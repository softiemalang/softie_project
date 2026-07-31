#include <inttypes.h>
#include <limits.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "SpiceUsr.h"

/* N0067's official low-level routines are f2c symbols, not public _c wrappers. */
extern int spkr02_(SpiceInt *, SpiceDouble *, SpiceDouble *, SpiceDouble *);
extern int spke02_(SpiceDouble *, SpiceDouble *, SpiceDouble *);

typedef struct {
  SpiceDouble sum[5], dc[2], init, intlen;
  SpiceInt ic[6], rsize, n, ordinal, begin, end;
  char id[256];
  int valid;
} Segment;

static uint64_t dbits(double value) { uint64_t bits; memcpy(&bits, &value, sizeof bits); return bits; }
static void json_string(FILE *file, const char *value) { fputc('"', file); for (; *value; value++) { if (*value == '"' || *value == '\\') fputc('\\', file); fputc(*value, file); } fputc('"', file); }
static void die(const char *message) { fprintf(stderr, "%s\n", message); exit(1); }
static int field(const char *line, const char *key, const char **value) { char needle[128]; int length = snprintf(needle, sizeof needle, "\"%s\":", key); const char *found = length > 0 ? strstr(line, needle) : NULL; if (!found) return 0; *value = found + length; return 1; }
static int string_field(const char *line, const char *key, char *out, size_t capacity) { const char *value; if (!field(line, key, &value) || *value++ != '"') return 0; const char *end = strchr(value, '"'); if (!end || (size_t)(end - value) >= capacity) return 0; memcpy(out, value, (size_t)(end - value)); out[end - value] = 0; return 1; }
static int int_field(const char *line, const char *key, SpiceInt *out) { const char *value; char *end; double number; if (!field(line, key, &value)) return 0; number = strtod(value, &end); if (end == value || !isfinite(number) || trunc(number) != number || number < INT32_MIN || number > INT32_MAX) return 0; *out = (SpiceInt)number; return (double)*out == number; }
static int hex_field(const char *line, const char *key, uint64_t *out) { char value[32], *end; unsigned long long number; if (!string_field(line, key, value, sizeof value) || strncmp(value, "0x", 2) != 0) return 0; number = strtoull(value + 2, &end, 16); if (*end) return 0; *out = (uint64_t)number; return 1; }
static void state_json(FILE *file, const SpiceDouble state[6]) { fputc('[', file); for (int i = 0; i < 6; i++) fprintf(file, "%s%.17g", i ? "," : "", state[i]); fputc(']', file); }
static void state_bits_json(FILE *file, const SpiceDouble state[6]) { fputc('[', file); for (int i = 0; i < 6; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", dbits(state[i])); fputc(']', file); }
static void record_bits_json(FILE *file, const SpiceDouble *record, SpiceInt count) { fputc('[', file); for (SpiceInt i = 0; i < count; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", dbits(record[i + 1])); fputc(']', file); }
static void descriptor_json(FILE *file, const Segment *segment) {
  fputs("{\"doubleBits\":[", file); for (int i = 0; i < 5; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", dbits(segment->sum[i]));
  fputs("],\"dc\":[", file); for (int i = 0; i < 2; i++) fprintf(file, "%s%.17g", i ? "," : "", segment->dc[i]);
  fputs("],\"ic\":[", file); for (int i = 0; i < 6; i++) fprintf(file, "%s%d", i ? "," : "", segment->ic[i]); fputs("]}", file);
}
static int load_segments(SpiceInt handle, Segment *segments, int capacity) {
  SpiceDouble summary[5], directory[4]; SpiceBoolean found = SPICEFALSE; int count = 0;
  dafbfs_c(handle);
  while (1) {
    daffna_c(&found); if (failed_c()) die("DAF segment search failed"); if (!found) break;
    if (count == capacity) die("too many DAF segments"); Segment *segment = &segments[count]; memset(segment, 0, sizeof *segment); segment->ordinal = count;
    dafgs_c(summary); dafgn_c(255, segment->id); dafus_c(summary, 2, 6, segment->dc, segment->ic); if (failed_c()) die("DAF summary extraction failed"); memcpy(segment->sum, summary, sizeof summary);
    segment->begin = segment->ic[4]; segment->end = segment->ic[5]; count++;
    if (segment->ic[3] != 2 || segment->end - segment->begin + 1 < 4) continue;
    dafgda_c(handle, segment->end - 3, segment->end, directory); if (failed_c()) die("DAF directory extraction failed");
    segment->init = directory[0]; segment->intlen = directory[1]; segment->rsize = (SpiceInt)directory[2]; segment->n = (SpiceInt)directory[3];
    segment->valid = isfinite(segment->init) && isfinite(segment->intlen) && segment->intlen > 0 && segment->rsize >= 5 && segment->n > 0 && (double)segment->rsize == directory[2] && (double)segment->n == directory[3] && (SpiceInt)((long long)segment->n * segment->rsize + 4) == segment->end - segment->begin + 1;
  }
  return count;
}
static Segment *find_segment(Segment *segments, int count, const char *identity) { for (int i = 0; i < count; i++) { char current[512]; snprintf(current, sizeof current, "target:%d:center:%d:frame:%d:begin:%d:end:%d", segments[i].ic[0], segments[i].ic[1], segments[i].ic[2], segments[i].begin, segments[i].end); if (segments[i].valid && strcmp(current, identity) == 0) return &segments[i]; } return NULL; }
static void clear_spice_error(void) { reset_c(); }
static int spice_error(char *message, size_t capacity) { if (!failed_c()) return 0; getmsg_c("SHORT", (SpiceInt)capacity, message); reset_c(); return 1; }
static void emit_not_computable(FILE *out, const char *sample, const char *kind, const char *status, const char *reason) { fputs("{\"sampleId\":", out); json_string(out, sample); fputs(",\"candidateKind\":", out); json_string(out, kind); fputs(",\"status\":", out); json_string(out, status); fputs(",\"reason\":", out); json_string(out, reason); fputs("}\n", out); }

int main(int argc, char **argv) {
  const char *spk = NULL, *input_path = NULL, *output_path = NULL;
  if (argc < 2 || strcmp(argv[1], "--evaluate-batch") != 0) { fprintf(stderr, "usage: --evaluate-batch --spk FILE --input-jsonl FILE --output-jsonl FILE\n"); return 2; }
  for (int i = 2; i + 1 < argc; i++) { if (strcmp(argv[i], "--spk") == 0) spk = argv[++i]; else if (strcmp(argv[i], "--input-jsonl") == 0) input_path = argv[++i]; else if (strcmp(argv[i], "--output-jsonl") == 0) output_path = argv[++i]; }
  if (!spk || !input_path || !output_path) die("missing required argument");
  SpiceInt handle; dafopr_c(spk, &handle); if (failed_c()) die("DAF open failed");
  Segment segments[256]; int segment_count = load_segments(handle, segments, 256); FILE *input = fopen(input_path, "rb"); FILE *output = fopen(output_path, "wb"); if (!input || !output) die("input/output open failed");
  char line[16384], sample[512], kind[32], identity[512], error_message[1841]; int invalid = 0;
  while (fgets(line, sizeof line, input)) {
    SpiceInt target, center, frame, type, ordinal, begin, end, record_index; uint64_t query_bits; uint64_t kernel_bits = 0;
    if (!string_field(line, "sampleId", sample, sizeof sample) || !string_field(line, "candidateKind", kind, sizeof kind) || !string_field(line, "segmentIdentity", identity, sizeof identity) || !int_field(line, "target", &target) || !int_field(line, "center", &center) || !int_field(line, "frame", &frame) || !int_field(line, "segmentType", &type) || !int_field(line, "segmentOrdinal", &ordinal) || !int_field(line, "segmentBeginAddress", &begin) || !int_field(line, "segmentEndAddress", &end) || !int_field(line, "recordIndex", &record_index) || !hex_field(line, "queryEtBits", &query_bits)) { invalid = 1; continue; }
    (void)kernel_bits; double query_et; memcpy(&query_et, &query_bits, sizeof query_et); Segment *segment = find_segment(segments, segment_count, identity);
    if (!segment || segment->ordinal != ordinal || segment->ic[0] != target || segment->ic[1] != center || segment->ic[2] != frame || segment->ic[3] != type || segment->begin != begin || segment->end != end || type != 2 || record_index < 0 || record_index >= segment->n) { emit_not_computable(output, sample, kind, "segment_identity_mismatch", "expected segment identity does not match the opened kernel"); invalid = 1; continue; }
    if (query_et < segment->dc[0] || query_et > segment->dc[1]) { emit_not_computable(output, sample, kind, "segment_identity_mismatch", "query ET is outside segment coverage"); invalid = 1; continue; }
    SpiceDouble *record = calloc((size_t)segment->rsize + 1U, sizeof *record); if (!record) die("record allocation failed");
    SpiceDouble reader_et = segment->init + ((SpiceDouble)record_index + 0.5) * segment->intlen; uint64_t reader_bits = dbits(reader_et); clear_spice_error();
    spkr02_(&handle, segment->sum, &reader_et, record); if (spice_error(error_message, sizeof error_message)) { fprintf(output, "{\"sampleId\":"); json_string(output, sample); fprintf(output, ",\"candidateKind\":"); json_string(output, kind); fprintf(output, ",\"status\":\"official_reader_failed\",\"readerEtBits\":\"0x%016" PRIx64 "\",\"cspiceErrorState\":", reader_bits); json_string(output, error_message); fputs("}\n", output); free(record); invalid = 1; continue; }
    SpiceInt returned_size = (SpiceInt)record[0]; if (returned_size != segment->rsize) { emit_not_computable(output, sample, kind, "official_reader_failed", "official reader returned an unexpected record size"); free(record); invalid = 1; continue; }
    SpiceDouble state[6]; clear_spice_error(); spke02_(&query_et, record, state); if (spice_error(error_message, sizeof error_message)) { fprintf(output, "{\"sampleId\":"); json_string(output, sample); fprintf(output, ",\"candidateKind\":"); json_string(output, kind); fprintf(output, ",\"status\":\"official_evaluator_failed\",\"readerEtBits\":\"0x%016" PRIx64 "\",\"cspiceErrorState\":", reader_bits); json_string(output, error_message); fputs("}\n", output); free(record); invalid = 1; continue; }
    fprintf(output, "{\"sampleId\":"); json_string(output, sample); fprintf(output, ",\"candidateKind\":"); json_string(output, kind); fprintf(output, ",\"status\":\"computed\",\"readerFunction\":\"spkr02_\",\"evaluatorFunction\":\"spke02_\",\"recordNumberConvention\":\"project_zero_based_to_spkr02_one_based\",\"projectRecordIndex\":%d,\"cspiceReaderRecordNumber\":%d,\"readerEtBits\":\"0x%016" PRIx64 "\",\"queryEtBits\":\"0x%016" PRIx64 "\",\"nativeInputEtBits\":\"0x%016" PRIx64 "\",\"nativeEtBitsBeforeEvaluation\":\"0x%016" PRIx64 "\",\"nativeEtBitsAfterEvaluation\":\"0x%016" PRIx64 "\",\"etMutated\":false,\"segmentDescriptor\":", record_index, record_index + 1, reader_bits, query_bits, query_bits, dbits(query_et), dbits(query_et)); descriptor_json(output, segment); fprintf(output, ",\"officialRecordDoubleCount\":%d,\"officialRecordBits\":", segment->rsize); record_bits_json(output, record, segment->rsize); fputs(",\"officialStateValues\":", output); state_json(output, state); fputs(",\"officialStateBits\":", output); state_bits_json(output, state); fputs(",\"officialEvaluatorStatus\":\"computed\",\"officialCspiceErrorState\":null}\n", output); free(record);
  }
  fclose(input); fclose(output); dafcls_c(handle); return invalid ? 1 : 0;
}
