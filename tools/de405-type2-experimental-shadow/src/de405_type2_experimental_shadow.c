#include <inttypes.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "SpiceUsr.h"

typedef struct { SpiceDouble dc[2], init, intlen; SpiceInt ic[6], rsize, n, degree, begin, end; char id[256]; int valid; } Segment;
typedef struct { int body, parent, recordIndex; Segment *segment; int recordCount; double record[386], baselineState[6], candidateState[6], baselineBefore[6], baselineAfter[6], candidateBefore[6], candidateAfter[6]; } Leg;
typedef struct { Leg legs[16]; int count; double baselineState[6], candidateState[6]; } Chain;

static void die(const char *message) { fprintf(stderr, "%s\n", message); exit(1); }
static uint64_t dbits(double value) { uint64_t result; memcpy(&result, &value, sizeof result); return result; }
static void jsons(FILE *file, const char *value) { fputc('"', file); for (; *value; value++) { if (*value == '"' || *value == '\\') fputc('\\', file); fputc(*value, file); } fputc('"', file); }
static int field(const char *line, const char *key, const char **value) { char needle[128]; int length = snprintf(needle, sizeof needle, "\"%s\":", key); const char *found = length > 0 ? strstr(line, needle) : NULL; if (!found) return 0; *value = found + length; return 1; }
static int strfield(const char *line, const char *key, char *out, size_t capacity) { const char *value; if (!field(line, key, &value) || *value++ != '"') return 0; const char *end = strchr(value, '"'); if (!end || (size_t)(end - value) >= capacity) return 0; memcpy(out, value, (size_t)(end - value)); out[end - value] = 0; return 1; }
static int intfield(const char *line, const char *key, SpiceInt *out) { const char *value; char *end; if (!field(line, key, &value)) return 0; long parsed = strtol(value, &end, 10); if (end == value || parsed < INT32_MIN || parsed > INT32_MAX) return 0; *out = (SpiceInt)parsed; return 1; }
static int numfield(const char *line, const char *key, double *out) { const char *value; char *end; if (!field(line, key, &value)) return 0; *out = strtod(value, &end); return end != value && isfinite(*out); }
static int hexfield(const char *line, const char *key, uint64_t *out) { char value[32], *end; if (!strfield(line, key, value, sizeof value) || strncmp(value, "0x", 2) != 0) return 0; unsigned long long parsed = strtoull(value + 2, &end, 16); if (*end) return 0; *out = (uint64_t)parsed; return 1; }
static int exact_int(double value, SpiceInt *out) { if (!isfinite(value) || trunc(value) != value || value < 1 || value > 2147483647.0) return 0; *out = (SpiceInt)value; return (double)*out == value; }

static int load(SpiceInt handle, Segment *segments, int capacity) {
  SpiceDouble summary[5], directory[4]; SpiceBoolean found = SPICEFALSE; int count = 0;
  dafbfs_c(handle);
  while (1) {
    daffna_c(&found); if (failed_c()) die("DAF traversal failed"); if (!found) break;
    if (count == capacity) die("too many DAF segments");
    Segment *segment = &segments[count++]; memset(segment, 0, sizeof *segment);
    dafgs_c(summary); dafgn_c(255, segment->id); dafus_c(summary, 2, 6, segment->dc, segment->ic);
    if (failed_c()) die("DAF summary failed");
    segment->begin = segment->ic[4]; segment->end = segment->ic[5];
    if (segment->ic[3] != 2 || segment->end - segment->begin + 1 < 4) continue;
    dafgda_c(handle, segment->end - 3, segment->end, directory);
    if (failed_c() || !exact_int(directory[2], &segment->rsize) || !exact_int(directory[3], &segment->n) || segment->rsize < 5 || (segment->rsize - 2) % 3 || segment->n < 1 || !isfinite(directory[0]) || directory[1] <= 0) continue;
    segment->init = directory[0]; segment->intlen = directory[1]; segment->degree = (segment->rsize - 2) / 3 - 1;
    if ((long double)segment->n * segment->rsize + 4 != (long double)(segment->end - segment->begin + 1)) continue;
    segment->valid = 1;
  }
  return count;
}

static Segment *segment_for(Segment *segments, int count, SpiceInt body, double et) {
  Segment *result = NULL;
  for (int i = 0; i < count; i++) {
    Segment *segment = &segments[i];
    if (segment->valid && segment->ic[0] == body && segment->ic[2] == 1 && et >= segment->dc[0] && et <= segment->dc[1]) {
      if (result) return NULL;
      result = segment;
    }
  }
  return result;
}

static int read_record(SpiceInt handle, Segment *segment, int index, double *record) {
  SpiceInt begin = segment->begin + index * segment->rsize;
  dafgda_c(handle, begin, begin + segment->rsize - 1, record);
  return !failed_c();
}

static int record_index(Segment *segment, double et) {
  int index = (int)floor((et - segment->init) / segment->intlen);
  if (index < 0) index = 0;
  if (index >= segment->n) index = segment->n - 1;
  return index;
}

/* The unchanged project baseline groups the final derivative subtraction. */
static void cheby_baseline(const double *coefficients, int degree, double midpoint, double radius, double et, double *position, double *velocity) {
  double s = (et - midpoint) / radius, s2 = s * 2.0;
  double w0 = 0.0, w1 = 0.0, w2 = 0.0, d0 = 0.0, d1 = 0.0, d2 = 0.0;
  for (int j = degree + 1; j > 1; j--) {
    w2 = w1; w1 = w0; w0 = coefficients[j - 1] + (s2 * w1 - w2);
    d2 = d1; d1 = d0; d0 = w1 * 2.0 + (d1 * s2 - d2);
  }
  *position = coefficients[0] + (s * w0 - w1);
  *velocity = (w0 + s * d0 - d1) / radius;
}

extern void de405_candidate_cheby(const double *coefficients, int degree, double midpoint, double radius, double et, double *position, double *velocity);

static int eval_leg(SpiceInt handle, Segment *segment, double et, Leg *leg) {
  leg->segment = segment; leg->recordIndex = record_index(segment, et); leg->recordCount = segment->rsize;
  if (!read_record(handle, segment, leg->recordIndex, leg->record)) return 0;
  for (int axis = 0; axis < 3; axis++) {
    const double *coefficients = leg->record + 2 + axis * ((segment->rsize - 2) / 3);
    cheby_baseline(coefficients, segment->degree, leg->record[0], leg->record[1], et, &leg->baselineState[axis], &leg->baselineState[axis + 3]);
    de405_candidate_cheby(coefficients, segment->degree, leg->record[0], leg->record[1], et, &leg->candidateState[axis], &leg->candidateState[axis + 3]);
  }
  leg->parent = segment->ic[1];
  return 1;
}

static int chain(SpiceInt handle, Segment *segments, int segmentCount, SpiceInt body, double et, Chain *chainResult) {
  memset(chainResult, 0, sizeof *chainResult); SpiceInt current = body;
  while (current != 0) {
    if (chainResult->count == 16) return 0;
    Segment *segment = segment_for(segments, segmentCount, current, et);
    if (!segment || !eval_leg(handle, segment, et, &chainResult->legs[chainResult->count])) return 0;
    Leg *leg = &chainResult->legs[chainResult->count++]; leg->body = current;
    for (int i = 0; i < 6; i++) { leg->baselineBefore[i] = chainResult->baselineState[i]; leg->candidateBefore[i] = chainResult->candidateState[i]; }
    for (int i = 0; i < 6; i++) { chainResult->baselineState[i] += leg->baselineState[i]; chainResult->candidateState[i] += leg->candidateState[i]; }
    for (int i = 0; i < 6; i++) { leg->baselineAfter[i] = chainResult->baselineState[i]; leg->candidateAfter[i] = chainResult->candidateState[i]; }
    current = leg->parent;
  }
  return 1;
}

static void bits(FILE *file, const double *values) { fputc('[', file); for (int i = 0; i < 6; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", dbits(values[i])); fputc(']', file); }
static void record_bits(FILE *file, const double *record, int count) { fputc('[', file); for (int i = 0; i < count; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", dbits(record[i])); fputc(']', file); }

static void legs(FILE *file, const Chain *chainResult) {
  fputc('[', file);
  for (int i = 0; i < chainResult->count; i++) {
    const Leg *leg = &chainResult->legs[i]; if (i) fputc(',', file);
    fprintf(file, "{\"body\":%d,\"parent\":%d,\"recordIndex\":%d,\"segmentIdentity\":\"target:%d:center:%d:frame:%d:begin:%d:end:%d\",\"recordBits\":", leg->body, leg->parent, leg->recordIndex, leg->segment->ic[0], leg->segment->ic[1], leg->segment->ic[2], leg->segment->begin, leg->segment->end);
    record_bits(file, leg->record, leg->recordCount); fputs(",\"baselineStateBits\":", file); bits(file, leg->baselineState); fputs(",\"candidateStateBits\":", file); bits(file, leg->candidateState); fputs(",\"baselineAccumulatorBeforeBits\":", file); bits(file, leg->baselineBefore); fputs(",\"baselineAccumulatorAfterBits\":", file); bits(file, leg->baselineAfter); fputs(",\"candidateAccumulatorBeforeBits\":", file); bits(file, leg->candidateBefore); fputs(",\"candidateAccumulatorAfterBits\":", file); bits(file, leg->candidateAfter); fputs(",\"stateBits\":", file); bits(file, leg->candidateState); fputs("}", file);
  }
  fputc(']', file);
}

int main(int argc, char **argv) {
  const char *spk = NULL, *inputPath = NULL, *outputPath = NULL;
  if (argc < 2 || strcmp(argv[1], "--evaluate-batch")) return 2;
  for (int i = 2; i + 1 < argc; i++) { if (!strcmp(argv[i], "--spk")) spk = argv[++i]; else if (!strcmp(argv[i], "--input-jsonl")) inputPath = argv[++i]; else if (!strcmp(argv[i], "--output-jsonl")) outputPath = argv[++i]; }
  if (!spk || !inputPath || !outputPath) die("missing required argument");
  SpiceInt handle; dafopr_c(spk, &handle); if (failed_c()) die("DAF open failed");
  Segment segments[64]; int segmentCount = load(handle, segments, 64); FILE *input = fopen(inputPath, "rb"), *output = fopen(outputPath, "wb");
  if (!input || !output) die("input/output open failed");
  char line[4096], sample[512]; int invalid = 0;
  while (fgets(line, sizeof line, input)) {
    SpiceInt target, center; double decimal, et; uint64_t etBits;
    if (!strfield(line, "sampleId", sample, sizeof sample) || !intfield(line, "targetId", &target) || !intfield(line, "centerId", &center) || !numfield(line, "queryEt", &decimal) || !hexfield(line, "queryEtHex", &etBits)) { invalid = 1; continue; }
    memcpy(&et, &etBits, sizeof et); if (dbits(decimal) != etBits) { invalid = 1; continue; }
    Chain targetChain, centerChain;
    if (!chain(handle, segments, segmentCount, target, et, &targetChain) || !chain(handle, segments, segmentCount, center, et, &centerChain)) { invalid = 1; continue; }
    double baselinePair[6], candidatePair[6]; for (int i = 0; i < 6; i++) { baselinePair[i] = targetChain.baselineState[i] - centerChain.baselineState[i]; candidatePair[i] = targetChain.candidateState[i] - centerChain.candidateState[i]; }
    fprintf(output, "{\"schemaVersion\":2,\"recordType\":\"de405_type2_experimental_shadow\",\"sampleId\":"); jsons(output, sample);
    fprintf(output, ",\"target\":%d,\"center\":%d,\"queryEtBits\":\"0x%016" PRIx64 "\",\"baselineEvaluatorIdentity\":\"project_owned_type2_chbint_recurrence_v1\",\"experimentalEvaluatorIdentity\":\"de405_type2_experimental_official_chbint_order_v1\",\"baselinePairStateBits\":", target, center, etBits);
    bits(output, baselinePair); fputs(",\"candidatePairStateBits\":", output); bits(output, candidatePair); fputs(",\"shadowPairStateBits\":", output); bits(output, candidatePair);
    fputs(",\"baselineTargetToSsbBits\":", output); bits(output, targetChain.baselineState); fputs(",\"candidateTargetToSsbBits\":", output); bits(output, targetChain.candidateState); fputs(",\"targetToSsbBits\":", output); bits(output, targetChain.candidateState);
    fputs(",\"baselineCenterToSsbBits\":", output); bits(output, centerChain.baselineState); fputs(",\"candidateCenterToSsbBits\":", output); bits(output, centerChain.candidateState); fputs(",\"centerToSsbBits\":", output); bits(output, centerChain.candidateState);
    fputs(",\"targetLegs\":", output); legs(output, &targetChain); fputs(",\"centerLegs\":", output); legs(output, &centerChain); fputs("}\n", output);
  }
  fclose(input); fclose(output); dafcls_c(handle); return invalid ? 1 : 0;
}
