#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "f2c.h"

extern int spke02_(doublereal *, doublereal *, doublereal *);
extern int de405_spke02_trace_(doublereal *, doublereal *, doublereal *);

#define MAX_COMPONENTS 3
#define MAX_OPERATIONS 128
#define MAX_COEFFICIENTS 128

typedef struct {
  int ordinal;
  uint64_t coefficientBits, w0Bits, w1Bits, w2Bits, d0Bits, d1Bits, d2Bits, twiceBits;
} Operation;

typedef struct {
  int coefficientStart, coefficientCount, operationCount;
  uint64_t normalizedTimeBits, twiceNormalizedTimeBits, polynomialBits, derivativeBeforeScaleBits, scaleBits, velocityBits;
  uint64_t coefficientSha256Like, firstCoefficientBits, lastCoefficientBits;
  Operation operations[MAX_OPERATIONS];
} ComponentTrace;

typedef struct {
  int activeComponent;
  uint64_t midpointBits, radiusBits;
  ComponentTrace components[MAX_COMPONENTS];
} Trace;

static Trace officialTrace;
static Trace *activeTrace = NULL;

static uint64_t bits(double value) { uint64_t result; memcpy(&result, &value, sizeof result); return result; }
static void json_string(FILE *file, const char *value) { fputc('"', file); for (; *value; value++) { if (*value == '"' || *value == '\\') fputc('\\', file); fputc(*value, file); } fputc('"', file); }
static void hex(FILE *file, uint64_t value) { fprintf(file, "\"0x%016" PRIx64 "\"", value); }
static void die(const char *message) { fprintf(stderr, "%s\n", message); exit(1); }

static void reset_trace(Trace *trace) { memset(trace, 0, sizeof *trace); trace->activeComponent = -1; }
static void trace_component_begin(int component, int start, int count, const double *record) {
  if (!activeTrace || component < 0 || component >= MAX_COMPONENTS || count < 1 || count > MAX_COEFFICIENTS) die("invalid trace component");
  activeTrace->activeComponent = component;
  ComponentTrace *item = &activeTrace->components[component];
  memset(item, 0, sizeof *item);
  item->coefficientStart = start - 1;
  item->coefficientCount = count;
  item->firstCoefficientBits = bits(record[start]);
  item->lastCoefficientBits = bits(record[start + count - 1]);
  uint64_t hash = UINT64_C(1469598103934665603);
  for (int i = 0; i < count; i++) { uint64_t value = bits(record[start + i]); for (int byte = 0; byte < 8; byte++) { hash ^= (unsigned char)(value >> (byte * 8)); hash *= UINT64_C(1099511628211); } }
  item->coefficientSha256Like = hash;
  activeTrace->midpointBits = bits(record[1]);
  activeTrace->radiusBits = bits(record[2]);
}
void de405_trace_component_begin(int component, integer start, integer count, doublereal *record) { trace_component_begin(component, (int)start, (int)count, record); }
void de405_trace_normalized_time(doublereal value, doublereal twice) { if (!activeTrace || activeTrace->activeComponent < 0) die("normalized time without component"); ComponentTrace *item = &activeTrace->components[activeTrace->activeComponent]; item->normalizedTimeBits = bits(value); item->twiceNormalizedTimeBits = bits(twice); }
void de405_trace_iteration(integer ordinal, doublereal coefficient, doublereal w0, doublereal w1, doublereal w2, doublereal d0, doublereal d1, doublereal d2) {
  if (!activeTrace || activeTrace->activeComponent < 0) die("iteration without component"); ComponentTrace *item = &activeTrace->components[activeTrace->activeComponent]; if (item->operationCount >= MAX_OPERATIONS) die("trace operation capacity exceeded"); Operation *op = &item->operations[item->operationCount++]; op->ordinal = (int)ordinal; op->coefficientBits = bits(coefficient); op->w0Bits = bits(w0); op->w1Bits = bits(w1); op->w2Bits = bits(w2); op->d0Bits = bits(d0); op->d1Bits = bits(d1); op->d2Bits = bits(d2); op->twiceBits = item->twiceNormalizedTimeBits;
}
void de405_trace_polynomial_result(doublereal position, doublereal derivative) { if (!activeTrace || activeTrace->activeComponent < 0) die("polynomial without component"); ComponentTrace *item = &activeTrace->components[activeTrace->activeComponent]; item->polynomialBits = bits(position); item->derivativeBeforeScaleBits = bits(derivative); }
void de405_trace_velocity_scaled(doublereal velocity, doublereal scale) { if (!activeTrace || activeTrace->activeComponent < 0) die("scale without component"); ComponentTrace *item = &activeTrace->components[activeTrace->activeComponent]; item->velocityBits = bits(velocity); item->scaleBits = bits(scale); }

static int field(const char *line, const char *key, const char **value) { char needle[128]; int length = snprintf(needle, sizeof needle, "\"%s\":", key); const char *found = length > 0 ? strstr(line, needle) : NULL; if (!found) return 0; *value = found + length; return 1; }
static int string_field(const char *line, const char *key, char *out, size_t capacity) { const char *value; if (!field(line, key, &value) || *value++ != '"') return 0; const char *end = strchr(value, '"'); if (!end || (size_t)(end - value) >= capacity) return 0; memcpy(out, value, (size_t)(end - value)); out[end - value] = 0; return 1; }
static int hex_field(const char *line, const char *key, uint64_t *out) { char value[32], *end; const char *raw; if (!field(line, key, &raw) || *raw++ != '"') return 0; const char *finish = strchr(raw, '"'); if (!finish || (size_t)(finish - raw) >= sizeof value) return 0; memcpy(value, raw, (size_t)(finish - raw)); value[finish - raw] = 0; if (strncmp(value, "0x", 2) != 0) return 0; unsigned long long parsed = strtoull(value + 2, &end, 16); if (*end) return 0; *out = (uint64_t)parsed; return 1; }
static int int_field(const char *line, const char *key, int *out) { const char *value; char *end; if (!field(line, key, &value)) return 0; long parsed = strtol(value, &end, 10); if (end == value || parsed < 1 || parsed > 100000) return 0; *out = (int)parsed; return 1; }
static int record_field(const char *line, uint64_t *out, int capacity, int *count) { const char *value; if (!field(line, "recordBits", &value) || *value++ != '[') return 0; int n = 0; while (*value && *value != ']') { while (*value == ' ' || *value == ',') value++; if (*value++ != '"' || n == capacity) return 0; char hexValue[32], *end; const char *finish = strchr(value, '"'); if (!finish || (size_t)(finish - value) >= sizeof hexValue) return 0; memcpy(hexValue, value, (size_t)(finish - value)); hexValue[finish - value] = 0; if (strncmp(hexValue, "0x", 2) != 0) return 0; unsigned long long parsed = strtoull(hexValue + 2, &end, 16); if (*end) return 0; out[n++] = (uint64_t)parsed; value = finish + 1; } if (*value != ']') return 0; *count = n; return 1; }

static void bits_array(FILE *file, const double *values, int count) { fputc('[', file); for (int i = 0; i < count; i++) { if (i) fputc(',', file); hex(file, bits(values[i])); } fputc(']', file); }
static void trace_json(FILE *file, const Trace *trace) {
  fprintf(file, "{\"recordMetadata\":{\"midpointBits\":"); hex(file, trace->midpointBits); fprintf(file, ",\"radiusBits\":"); hex(file, trace->radiusBits); fputs("},\"components\":[", file);
  for (int c = 0; c < MAX_COMPONENTS; c++) { if (c) fputc(',', file); const ComponentTrace *item = &trace->components[c]; fprintf(file, "{\"component\":%d,\"coefficientStart\":%d,\"coefficientCount\":%d,\"coefficientFingerprintFNV1a64\":", c, item->coefficientStart, item->coefficientCount); hex(file, item->coefficientSha256Like); fprintf(file, ",\"firstCoefficientBits\":"); hex(file, item->firstCoefficientBits); fprintf(file, ",\"lastCoefficientBits\":"); hex(file, item->lastCoefficientBits); fprintf(file, ",\"normalizedTimeBits\":"); hex(file, item->normalizedTimeBits); fprintf(file, ",\"twiceNormalizedTimeBits\":"); hex(file, item->twiceNormalizedTimeBits); fputs(",\"operations\":[", file);
    for (int i = 0; i < item->operationCount; i++) { if (i) fputc(',', file); const Operation *op = &item->operations[i]; fprintf(file, "{\"ordinal\":%d,\"coefficientBits\":", op->ordinal); hex(file, op->coefficientBits); fprintf(file, ",\"twiceNormalizedTimeBits\":"); hex(file, op->twiceBits); fprintf(file, ",\"w0Bits\":"); hex(file, op->w0Bits); fprintf(file, ",\"w1Bits\":"); hex(file, op->w1Bits); fprintf(file, ",\"w2Bits\":"); hex(file, op->w2Bits); fprintf(file, ",\"d0Bits\":"); hex(file, op->d0Bits); fprintf(file, ",\"d1Bits\":"); hex(file, op->d1Bits); fprintf(file, ",\"d2Bits\":"); hex(file, op->d2Bits); fputc('}', file); }
    fputs("],\"positionPolynomialBits\":", file); hex(file, item->polynomialBits); fprintf(file, ",\"derivativeBeforeScaleBits\":"); hex(file, item->derivativeBeforeScaleBits); fprintf(file, ",\"scaleBits\":"); hex(file, item->scaleBits); fprintf(file, ",\"velocityBits\":"); hex(file, item->velocityBits); fputc('}', file);
  }
  fputs("]}", file);
}

static void project_cheby(const double *coefficients, int degree, double midpoint, double radius, double et, double *position, double *velocity, Trace *trace, int component) {
  ComponentTrace *item = &trace->components[component]; item->coefficientStart = 2 + component * (degree + 1); item->coefficientCount = degree + 1; item->firstCoefficientBits = bits(coefficients[0]); item->lastCoefficientBits = bits(coefficients[degree]); uint64_t hash = UINT64_C(1469598103934665603); for (int i = 0; i <= degree; i++) { uint64_t value = bits(coefficients[i]); for (int byte = 0; byte < 8; byte++) { hash ^= (unsigned char)(value >> (byte * 8)); hash *= UINT64_C(1099511628211); } } item->coefficientSha256Like = hash;
  trace->midpointBits = bits(midpoint); trace->radiusBits = bits(radius); double normalized = (et - midpoint) / radius; double twice = 2 * normalized; item->normalizedTimeBits = bits(normalized); item->twiceNormalizedTimeBits = bits(twice); double w0 = 0, w1 = 0, w2, d0 = 0, d1 = 0, d2;
  for (int j = degree + 1; j > 1; j--) { w2 = w1; w1 = w0; w0 = coefficients[j - 1] + (twice * w1 - w2); d2 = d1; d1 = d0; d0 = w1 * 2 + (d1 * twice - d2); Operation *op = &item->operations[item->operationCount++]; op->ordinal = j; op->coefficientBits = bits(coefficients[j - 1]); op->twiceBits = bits(twice); op->w0Bits = bits(w0); op->w1Bits = bits(w1); op->w2Bits = bits(w2); op->d0Bits = bits(d0); op->d1Bits = bits(d1); op->d2Bits = bits(d2); }
  *position = coefficients[0] + (normalized * w0 - w1); *velocity = (w0 + normalized * d0 - d1) / radius; item->polynomialBits = bits(*position); item->derivativeBeforeScaleBits = bits(w0 + normalized * d0 - d1); item->scaleBits = bits(radius); item->velocityBits = bits(*velocity);
}

int main(int argc, char **argv) {
  if (argc != 6 || strcmp(argv[1], "--evaluate-batch") != 0) { fprintf(stderr, "usage: --evaluate-batch --input-jsonl FILE --output-jsonl FILE\n"); return 2; }
  const char *inputPath = NULL, *outputPath = NULL; for (int i = 2; i + 1 < argc; i++) { if (!strcmp(argv[i], "--input-jsonl")) inputPath = argv[++i]; else if (!strcmp(argv[i], "--output-jsonl")) outputPath = argv[++i]; } if (!inputPath || !outputPath) die("missing input/output");
  FILE *input = fopen(inputPath, "rb"), *output = fopen(outputPath, "wb"); if (!input || !output) die("input/output open failed"); char line[16384]; int bad = 0;
  while (fgets(line, sizeof line, input)) {
    char sample[512]; uint64_t queryBits, recordBits[MAX_COEFFICIENTS * 3 + 2]; int recordCount = 0, declaredCount = 0; if (!string_field(line, "sampleId", sample, sizeof sample) || !hex_field(line, "queryEtBits", &queryBits) || !int_field(line, "recordCount", &declaredCount) || !record_field(line, recordBits, (int)(sizeof recordBits / sizeof recordBits[0]), &recordCount) || recordCount != declaredCount || recordCount < 5 || (recordCount - 2) % 3 != 0) { bad = 1; continue; }
    double et, payload[MAX_COEFFICIENTS * 3 + 2], officialRecord[MAX_COEFFICIENTS * 3 + 3], linkedState[6], instrumentedState[6], projectState[6]; memcpy(&et, &queryBits, 8); officialRecord[0] = (double)recordCount; for (int i = 0; i < recordCount; i++) { memcpy(&payload[i], &recordBits[i], 8); officialRecord[i + 1] = payload[i]; }
    memset(linkedState, 0, sizeof linkedState); spke02_(&et, officialRecord, linkedState); reset_trace(&officialTrace); activeTrace = &officialTrace; memset(instrumentedState, 0, sizeof instrumentedState); de405_spke02_trace_(&et, officialRecord, instrumentedState); activeTrace = NULL;
    Trace projectTrace; reset_trace(&projectTrace); for (int component = 0; component < 3; component++) project_cheby(payload + 2 + component * ((recordCount - 2) / 3), (recordCount - 2) / 3 - 1, payload[0], payload[1], et, &projectState[component], &projectState[component + 3], &projectTrace, component);
    fprintf(output, "{\"sampleId\":"); json_string(output, sample); fprintf(output, ",\"queryEtBits\":"); hex(output, queryBits); fprintf(output, ",\"recordCount\":%d,\"linkedOfficialStateBits\":", recordCount); bits_array(output, linkedState, 6); fprintf(output, ",\"instrumentedOfficialStateBits\":"); bits_array(output, instrumentedState, 6); fprintf(output, ",\"projectStateBits\":"); bits_array(output, projectState, 6); fputs(",\"officialTrace\":", output); trace_json(output, &officialTrace); fputs(",\"projectTrace\":", output); trace_json(output, &projectTrace); fputs("}\n", output);
  }
  fclose(input); fclose(output); return bad ? 1 : 0;
}
