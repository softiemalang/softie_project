#include <inttypes.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "SpiceUsr.h"

typedef struct {
  SpiceDouble dc[2], init, intlen;
  SpiceInt ic[6], rsize, n, degree, begin, end;
  int ordinal;
  char id[256];
  int valid;
} Segment;

static void die(const char *message) { fprintf(stderr, "%s\n", message); exit(1); }
static uint64_t dbits(double value) { uint64_t bits; memcpy(&bits, &value, 8); return bits; }
static int exact_int(double value, SpiceInt *out) {
  if (!isfinite(value) || trunc(value) != value || value < 1 || value > 2147483647.0) return 0;
  *out = (SpiceInt)value;
  return (double)*out == value;
}
static int field(const char *line, const char *key, const char **value) {
  char needle[128];
  int length = snprintf(needle, sizeof needle, "\"%s\":", key);
  const char *found = length > 0 ? strstr(line, needle) : NULL;
  if (!found) return 0;
  *value = found + length;
  return 1;
}
static int strfield(const char *line, const char *key, char *out, size_t capacity) {
  const char *value;
  if (!field(line, key, &value) || *value++ != '"') return 0;
  const char *end = strchr(value, '"');
  if (!end || (size_t)(end - value) >= capacity) return 0;
  memcpy(out, value, (size_t)(end - value));
  out[end - value] = 0;
  return 1;
}
static int intfield(const char *line, const char *key, SpiceInt *out) {
  const char *value;
  char *end;
  double number;
  if (!field(line, key, &value)) return 0;
  number = strtod(value, &end);
  if (end == value || trunc(number) != number || number < INT32_MIN || number > INT32_MAX) return 0;
  *out = (SpiceInt)number;
  return 1;
}
static int numfield(const char *line, const char *key, double *out) {
  const char *value;
  char *end;
  if (!field(line, key, &value)) return 0;
  *out = strtod(value, &end);
  return end != value && isfinite(*out);
}
static int hexfield(const char *line, const char *key, uint64_t *out) {
  char buffer[32], *end;
  unsigned long long value;
  if (!strfield(line, key, buffer, sizeof buffer) || strncmp(buffer, "0x", 2) != 0) return 0;
  value = strtoull(buffer + 2, &end, 16);
  if (*end) return 0;
  *out = (uint64_t)value;
  return 1;
}
static void jsons(FILE *file, const char *value) {
  fputc('"', file);
  for (; *value; value++) {
    if (*value == '"' || *value == '\\') fputc('\\', file);
    fputc(*value, file);
  }
  fputc('"', file);
}
static int load(SpiceInt handle, Segment *segments, int capacity) {
  SpiceDouble summary[5], directory[4];
  SpiceBoolean found = SPICEFALSE;
  int count = 0;
  dafbfs_c(handle);
  while (1) {
    daffna_c(&found);
    if (failed_c()) die("DAF traversal failed");
    if (!found) break;
    if (count == capacity) die("too many DAF segments");
    Segment *segment = &segments[count++];
    memset(segment, 0, sizeof *segment);
    segment->ordinal = count - 1;
    dafgs_c(summary);
    dafgn_c(255, segment->id);
    dafus_c(summary, 2, 6, segment->dc, segment->ic);
    if (failed_c()) die("DAF summary failed");
    segment->begin = segment->ic[4];
    segment->end = segment->ic[5];
    if (segment->ic[3] != 2 || segment->end - segment->begin + 1 < 4) continue;
    dafgda_c(handle, segment->end - 3, segment->end, directory);
    if (failed_c()) die("DAF directory read failed");
    segment->init = directory[0];
    segment->intlen = directory[1];
    if (!exact_int(directory[2], &segment->rsize) || !exact_int(directory[3], &segment->n) || segment->rsize < 5 || (segment->rsize - 2) % 3 || segment->n < 1 || !isfinite(segment->init) || !isfinite(segment->intlen) || segment->intlen <= 0) continue;
    segment->degree = (segment->rsize - 2) / 3 - 1;
    if ((long double)segment->n * segment->rsize + 4 != (long double)(segment->end - segment->begin + 1)) continue;
    segment->valid = 1;
  }
  return count;
}
static int read_record(SpiceInt handle, const Segment *segment, int index, double *record) {
  SpiceInt begin = segment->begin + index * segment->rsize;
  dafgda_c(handle, begin, begin + segment->rsize - 1, record);
  return !failed_c();
}
static int record_index(const Segment *segment, double et) {
  double quotient = (et - segment->init) / segment->intlen;
  long index = (long)floor(quotient);
  if (index < 0) index = 0;
  if (index >= segment->n) index = segment->n - 1;
  return (int)index;
}
static void cheby(const double *coefficients, int degree, double midpoint, double radius, double et, double *position, double *velocity) {
  double normalized = (et - midpoint) / radius;
  double twice = 2 * normalized;
  double w0 = 0, w1 = 0, w2, d0 = 0, d1 = 0, d2;
  for (int j = degree + 1; j > 1; j--) {
    w2 = w1; w1 = w0; w0 = coefficients[j - 1] + (twice * w1 - w2);
    d2 = d1; d1 = d0; d0 = w1 * 2 + (d1 * twice - d2);
  }
  *position = coefficients[0] + (normalized * w0 - w1);
  *velocity = (w0 + normalized * d0 - d1) / radius;
}
static uint64_t fingerprint(const double *record, int count) {
  uint64_t hash = UINT64_C(1469598103934665603);
  for (int i = 0; i < count; i++) {
    uint64_t value = dbits(record[i]);
    for (int byte = 0; byte < 8; byte++) { hash ^= (unsigned char)(value >> (byte * 8)); hash *= UINT64_C(1099511628211); }
  }
  return hash;
}
static void state(FILE *file, const double *values) {
  fputc('[', file);
  for (int i = 0; i < 6; i++) fprintf(file, "%s%.17g", i ? "," : "", values[i]);
  fputc(']', file);
}
static void bits(FILE *file, const double *values) {
  fputc('[', file);
  for (int i = 0; i < 6; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", dbits(values[i]));
  fputc(']', file);
}
static void coefficient_bits(FILE *file, const double *record, int count) {
  fputc('[', file);
  for (int i = 0; i < count; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", dbits(record[i]));
  fputc(']', file);
}
static void emit_candidate(FILE *file, SpiceInt handle, const Segment *segment, double et, int index, const char *kind) {
  double *record = calloc((size_t)segment->rsize, sizeof *record);
  double values[6];
  if (!record || !read_record(handle, segment, index, record)) die("record read failed");
  for (int axis = 0; axis < 3; axis++) cheby(record + 2 + axis * (segment->degree + 1), segment->degree, record[0], record[1], et, &values[axis], &values[axis + 3]);
  fprintf(file, "{\"candidateKind\":"); jsons(file, kind);
  fprintf(file, ",\"segmentIdentity\":\"target:%d:center:%d:frame:%d:begin:%d:end:%d\",\"nativeSegmentId\":", segment->ic[0], segment->ic[1], segment->ic[2], segment->begin, segment->end); jsons(file, segment->id);
  fprintf(file, ",\"segmentOrdinal\":%d,\"segmentBeginDafAddress\":%d,\"segmentEndDafAddress\":%d,\"target\":%d,\"center\":%d,\"frame\":%d,\"segmentType\":2,\"segmentStartEt\":%.17g,\"segmentEndEt\":%.17g,\"recordCount\":%d,\"recordInterval\":%.17g,\"initialEpoch\":%.17g,\"recordIndex\":%d,\"recordStartEt\":%.17g,\"recordEndEt\":%.17g,\"recordStartEtBits\":\"0x%016" PRIx64 "\",\"recordEndEtBits\":\"0x%016" PRIx64 "\",\"recordMidpointBits\":\"0x%016" PRIx64 "\",\"recordRadiusBits\":\"0x%016" PRIx64 "\",\"queryMinusMidpointBits\":\"0x%016" PRIx64 "\",\"normalizedTimeBits\":\"0x%016" PRIx64 "\",\"normalizedTimeValue\":%.17g,\"recordPayloadHash\":\"%016" PRIx64 "\",\"evaluationRoutineIdentity\":\"project_owned_type2_chbint_recurrence_v1\",\"coefficientBits\":", segment->ordinal, segment->begin, segment->end, segment->ic[0], segment->ic[1], segment->ic[2], segment->dc[0], segment->dc[1], segment->n, segment->intlen, segment->init, index, record[0] - record[1], record[0] + record[1], dbits(record[0] - record[1]), dbits(record[0] + record[1]), dbits(record[0]), dbits(record[1]), dbits(et - record[0]), dbits((et - record[0]) / record[1]), (et - record[0]) / record[1], fingerprint(record, segment->rsize));
  coefficient_bits(file, record, segment->rsize);
  fprintf(file, ",\"nativeState\":"); state(file, values); fprintf(file, ",\"nativeStateBits\":"); bits(file, values); fputs("}", file);
  free(record);
}
static Segment *find_identity(Segment *segments, int count, const char *identity) {
  for (int i = 0; i < count; i++) {
    char current[512];
    if (!segments[i].valid) continue;
    snprintf(current, sizeof current, "target:%d:center:%d:frame:%d:begin:%d:end:%d", segments[i].ic[0], segments[i].ic[1], segments[i].ic[2], segments[i].begin, segments[i].end);
    if (!strcmp(current, identity)) return &segments[i];
  }
  return NULL;
}
static int matching(const Segment *segment, SpiceInt target, SpiceInt center, double et) {
  return segment->valid && segment->ic[0] == target && segment->ic[1] == center && segment->ic[2] == 1 && et >= segment->dc[0] && et <= segment->dc[1];
}
int main(int argc, char **argv) {
  const char *spk = NULL, *input = NULL, *output = NULL;
  if (argc < 2 || strcmp(argv[1], "--evaluate-neighborhood")) return 2;
  for (int i = 2; i < argc; i++) { if (i + 1 < argc && !strcmp(argv[i], "--spk")) spk = argv[++i]; else if (i + 1 < argc && !strcmp(argv[i], "--input-jsonl")) input = argv[++i]; else if (i + 1 < argc && !strcmp(argv[i], "--output-jsonl")) output = argv[++i]; }
  if (!spk || !input || !output) die("missing required argument");
  SpiceInt handle; dafopr_c(spk, &handle); if (failed_c()) die("DAF open failed");
  Segment segments[64]; int count = load(handle, segments, 64);
  FILE *in = fopen(input, "rb"), *out = fopen(output, "wb"); if (!in || !out) die("input/output open failed");
  char line[8192], sample[512], projectIdentity[512]; int bad = 0;
  while (fgets(line, sizeof line, in)) {
    SpiceInt target, center; double decimal; uint64_t etBits;
    if (!strfield(line, "sampleId", sample, sizeof sample) || !intfield(line, "targetId", &target) || !intfield(line, "centerId", &center) || !numfield(line, "queryEt", &decimal) || !hexfield(line, "queryEtHex", &etBits) || !strfield(line, "projectSegmentIdentity", projectIdentity, sizeof projectIdentity)) { bad = 1; continue; }
    double et; memcpy(&et, &etBits, 8); if (dbits(decimal) != etBits) { bad = 1; continue; }
    Segment *project = find_identity(segments, count, projectIdentity); if (!project || !matching(project, target, center, et)) { bad = 1; continue; }
    int selected = record_index(project, et);
    fprintf(out, "{\"sampleId\":"); jsons(out, sample); fprintf(out, ",\"queryEtBits\":\"0x%016" PRIx64 "\",\"projectSegmentIdentity\":", etBits); jsons(out, projectIdentity); fputs(",\"projectCandidates\":[", out);
    int emitted = 0;
    for (int offset = -1; offset <= 1; offset++) { int index = selected + offset; if (index < 0 || index >= project->n) continue; if (emitted++) fputc(',', out); emit_candidate(out, handle, project, et, index, offset < 0 ? "previous" : offset > 0 ? "next" : "selected"); }
    fputs("],\"overlapSegments\":[", out); int overlapSegment = 0;
    for (int i = 0; i < count; i++) {
      Segment *candidate = &segments[i]; if (candidate == project || !matching(candidate, target, center, et)) continue;
      if (overlapSegment++) fputc(',', out);
      int overlapSelected = record_index(candidate, et);
      fprintf(out, "{\"segmentIdentity\":"); char identity[512]; snprintf(identity, sizeof identity, "target:%d:center:%d:frame:%d:begin:%d:end:%d", candidate->ic[0], candidate->ic[1], candidate->ic[2], candidate->begin, candidate->end); jsons(out, identity); fputs(",\"candidates\":[", out);
      int candidateCount = 0; for (int offset = -1; offset <= 1; offset++) { int index = overlapSelected + offset; if (index < 0 || index >= candidate->n) continue; if (candidateCount++) fputc(',', out); char kind[32]; snprintf(kind, sizeof kind, "overlap_%s", offset < 0 ? "previous" : offset > 0 ? "next" : "selected"); emit_candidate(out, handle, candidate, et, index, kind); }
      fputs("]}", out);
    }
    fputs("]}\n", out);
  }
  fclose(in); fclose(out); dafcls_c(handle); return bad ? 1 : 0;
}
