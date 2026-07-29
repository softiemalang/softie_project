#include <float.h>
#include <inttypes.h>
#include <locale.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "SpiceUsr.h"

static const int ids[] = {1,2,4,5,6,7,8,9,10,301};
static const char *names[] = {"MERCURY BARYCENTER","VENUS BARYCENTER","MARS BARYCENTER","JUPITER BARYCENTER","SATURN BARYCENTER","URANUS BARYCENTER","NEPTUNE BARYCENTER","PLUTO BARYCENTER","SUN","MOON"};
static const char *types[] = {"barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","barycenter","body","body"};

typedef struct {
  SpiceDouble sum[5], dc[2], init, intlen;
  SpiceInt ic[6], rsize, n, degree, begin, end;
  char id[256];
  int valid;
} Type2Segment;

static void fail(const char *message) { fprintf(stderr, "%s\n", message); kclear_c(); exit(1); }

static void json_string(const char *value) {
  putchar('"');
  for (const unsigned char *p = (const unsigned char *)value; *p; p++) {
    if (*p == '"' || *p == '\\') printf("\\%c", *p);
    else if (*p < 0x20) printf("\\u%04x", *p);
    else putchar(*p);
  }
  putchar('"');
}

static void json_string_file(FILE *output, const char *value) {
  fputc('"', output);
  for (const unsigned char *p = (const unsigned char *)value; *p; p++) {
    if (*p == '"' || *p == '\\') { fputc('\\', output); fputc(*p, output); }
    else if (*p < 0x20) fprintf(output, "\\u%04x", *p);
    else fputc(*p, output);
  }
  fputc('"', output);
}

static int exact_int(SpiceDouble value, SpiceInt *out) {
  if (!isfinite(value) || trunc(value) != value || value < 1.0 || value > (SpiceDouble)INT32_MAX) return 0;
  *out = (SpiceInt)value;
  return (SpiceDouble)*out == value;
}

static void descriptor_from_summary(const SpiceDouble sum[5], SpiceDouble dc[2], SpiceInt ic[6]) {
  dafus_c(sum, 2, 6, dc, ic);
  if (failed_c()) fail("DAF descriptor unpack failed");
}

static int load_type2_segments(SpiceInt handle, Type2Segment *segments, int capacity) {
  SpiceDouble sum[5];
  SpiceBoolean found = SPICEFALSE;
  int count = 0;
  dafbfs_c(handle);
  while (1) {
    daffna_c(&found);
    if (failed_c()) fail("DAF segment search failed");
    if (!found) break;
    if (count >= capacity) fail("too many SPK segments for evidence buffer");
    Type2Segment *segment = &segments[count++];
    memset(segment, 0, sizeof(*segment));
    dafgs_c(sum);
    if (failed_c()) fail("DAF summary extraction failed");
    memcpy(segment->sum, sum, sizeof(sum));
    dafgn_c((SpiceInt)sizeof(segment->id), segment->id);
    if (failed_c()) fail("DAF segment name extraction failed");
    descriptor_from_summary(sum, segment->dc, segment->ic);
    segment->begin = segment->ic[4];
    segment->end = segment->ic[5];
    segment->valid = 0;
    if (segment->ic[3] != 2) continue;

    SpiceDouble directory[4];
    if (segment->end < segment->begin || segment->end - segment->begin + 1 < 4) continue;
    dafgda_c(handle, segment->end - 3, segment->end, directory);
    if (failed_c()) fail("SPK Type 2 directory extraction failed");
    segment->init = directory[0];
    segment->intlen = directory[1];
    SpiceInt rsize, n;
    if (!exact_int(directory[2], &rsize) || !exact_int(directory[3], &n) ||
        rsize < 5 || (rsize - 2) % 3 != 0 || n < 1 ||
        (rsize - 2) / 3 - 1 > 26) continue;
    SpiceInt word_count = segment->end - segment->begin + 1;
    long double expected = (long double)n * (long double)rsize + 4.0L;
    if (!isfinite(segment->init) || !isfinite(segment->intlen) || segment->intlen <= 0.0 ||
        expected != (long double)word_count) continue;
    segment->rsize = rsize;
    segment->n = n;
    segment->degree = (rsize - 2) / 3 - 1;
    segment->valid = 1;
  }
  return count;
}

static void print_metadata(const Type2Segment *s, int ordinal) {
  printf("{\"schemaVersion\":1,\"recordType\":\"spk_type2_segment_metadata\",\"segmentOrdinal\":%d,\"segmentId\":", ordinal);
  json_string(s->id);
  printf(",\"targetId\":%d,\"centerId\":%d,\"frameId\":%d,\"dataType\":%d,\"segmentStartEt\":%.17g,\"segmentEndEt\":%.17g,\"beginAddress\":%d,\"endAddress\":%d,\"initEt\":%.17g,\"intlenSec\":%.17g,\"rsize\":%d,\"recordCount\":%d,\"polynomialDegree\":%d,\"segmentWordCount\":%d,\"expectedSegmentWordCount\":%.0Lf,\"directoryVerified\":%s,\"spkRecordMetadataStatus\":\"%s\"}\n", s->ic[0], s->ic[1], s->ic[2], s->ic[3], s->dc[0], s->dc[1], s->begin, s->end, s->init, s->intlen, s->rsize, s->n, s->degree, s->end - s->begin + 1, (long double)s->n * s->rsize + 4.0L, s->valid ? "true" : "false", s->valid ? "verified" : "metadata_invalid");
}

static uint64_t bits(SpiceDouble value) { uint64_t out; memcpy(&out, &value, sizeof(out)); return out; }
static uint64_t ordered_bits(SpiceDouble value) { uint64_t b = bits(value); return (b & UINT64_C(0x8000000000000000)) ? ~b + 1 : b | UINT64_C(0x8000000000000000); }
static uint64_t ulp_distance(SpiceDouble a, SpiceDouble b) { uint64_t x = ordered_bits(a), y = ordered_bits(b); return x > y ? x - y : y - x; }

static int read_record(SpiceInt handle, const Type2Segment *s, SpiceInt index, SpiceDouble **record);
static int evaluate_record(SpiceInt handle, const Type2Segment *s, SpiceInt index, SpiceDouble et, SpiceDouble state[6], SpiceDouble *mid, SpiceDouble *radius, SpiceDouble *normalized);

static void print_json_string_value(const char *value) {
  json_string(value);
}

static int json_field_start(const char *line, const char *field, const char **value) {
  char needle[128];
  int written = snprintf(needle, sizeof(needle), "\"%s\":", field);
  if (written < 0 || (size_t)written >= sizeof(needle)) return 0;
  const char *found = strstr(line, needle);
  if (!found) return 0;
  *value = found + written;
  return 1;
}

static int json_string_field(const char *line, const char *field, char *out, size_t capacity) {
  const char *value = NULL;
  if (!json_field_start(line, field, &value) || *value != '"' || capacity == 0) return 0;
  value++;
  size_t length = 0;
  while (value[length] && value[length] != '"') length++;
  if (!value[length] || length + 1 > capacity) return 0;
  memcpy(out, value, length);
  out[length] = '\0';
  return 1;
}

static int json_number_field(const char *line, const char *field, SpiceDouble *out) {
  const char *value = NULL, *end = NULL;
  if (!json_field_start(line, field, &value)) return 0;
  *out = strtod(value, (char **)&end);
  return end != value && isfinite(*out);
}

static int json_int_field(const char *line, const char *field, SpiceInt *out) {
  SpiceDouble value;
  if (!json_number_field(line, field, &value) || trunc(value) != value || value < (SpiceDouble)INT32_MIN || value > (SpiceDouble)INT32_MAX) return 0;
  *out = (SpiceInt)value;
  return 1;
}

static int json_hex_field(const char *line, const char *field, uint64_t *out) {
  char text[32];
  if (!json_string_field(line, field, text, sizeof(text)) || strncmp(text, "0x", 2) != 0) return 0;
  char *end = NULL;
  unsigned long long value = strtoull(text + 2, &end, 16);
  if (end == text + 2 || *end != '\0') return 0;
  *out = (uint64_t)value;
  return 1;
}

static const char *case_name(SpiceInt target) {
  switch (target) {
    case 1: return "mercury-barycenter";
    case 2: return "venus-barycenter";
    case 4: return "mars-barycenter";
    case 5: return "jupiter-barycenter";
    case 6: return "saturn-barycenter";
    case 7: return "uranus-barycenter";
    case 8: return "neptune-barycenter";
    case 9: return "pluto-barycenter";
    case 10: return "sun";
    case 301: return "moon";
    default: return "unsupported-target";
  }
}

static void print_sample_manifest(const Type2Segment *s, int ordinal, SpiceInt record, SpiceInt knot, const char *kind, SpiceDouble et, SpiceDouble directory_knot, SpiceDouble stored_knot, const char *knot_status) {
  uint64_t et_bits = bits(et);
  printf("{\"schemaVersion\":1,\"recordType\":\"de405_spk_type2_sweep_sample\",\"sampleId\":\"");
  printf("segment-%d-", ordinal);
  if (record >= 0) printf("record-%d-%s\"", record, kind);
  else printf("knot-%d-%s\"", knot, kind);
  printf(",\"comparisonCaseId\":"); print_json_string_value(case_name(s->ic[0]));
  printf(",\"targetId\":%d,\"centerId\":399,\"frameId\":%d,\"segmentOrdinal\":%d,\"spkSegmentCenterId\":%d,\"recordIndex\":", s->ic[0], s->ic[2], ordinal, s->ic[1]);
  if (record >= 0) printf("%d", record); else printf("null");
  printf(",\"knotIndex\":");
  if (knot >= 0) printf("%d", knot); else printf("null");
  printf(",\"epochKind\":"); print_json_string_value(kind);
  printf(",\"queryEt\":%.17g,\"queryEtHex\":\"0x%016" PRIx64 "\",\"metadataStatus\":\"%s\"", et, et_bits, s->valid ? "verified" : "metadata_invalid");
  if (knot >= 0) printf(",\"directoryKnotEt\":%.17g,\"storedKnotEt\":%.17g,\"knotIdentityStatus\":\"%s\"", directory_knot, stored_knot, knot_status);
  printf("}\n");
}

static int read_record(SpiceInt handle, const Type2Segment *s, SpiceInt index, SpiceDouble **record) {
  if (!s->valid || index < 0 || index >= s->n) return 0;
  SpiceInt begin = s->begin + index * s->rsize;
  SpiceInt end = begin + s->rsize - 1;
  if (end > s->end - 4) return 0;
  *record = malloc((size_t)s->rsize * sizeof(**record));
  if (!*record) fail("record allocation failed");
  dafgda_c(handle, begin, end, *record);
  if (failed_c()) fail("SPK Type 2 record extraction failed");
  return 1;
}

static int evaluate_record(SpiceInt handle, const Type2Segment *s, SpiceInt index, SpiceDouble et, SpiceDouble state[6], SpiceDouble *mid, SpiceDouble *radius, SpiceDouble *normalized) {
  SpiceDouble *record = NULL;
  if (!read_record(handle, s, index, &record)) return 0;
  *mid = record[0]; *radius = record[1];
  if (!isfinite(*mid) || !isfinite(*radius) || *radius <= 0.0) { free(record); return 0; }
  *normalized = (et - *mid) / *radius;
  for (int axis = 0; axis < 3; axis++) {
    SpiceDouble derivative;
    chbint_c(record + 2 + axis * (s->degree + 1), s->degree, record, et, &state[axis], &derivative);
    state[axis + 3] = derivative;
  }
  free(record);
  return !failed_c();
}

static int emit_sweep_manifest(SpiceInt handle, const Type2Segment *segments, int count) {
  int invalid = 0;
  for (int i = 0; i < count; i++) {
    const Type2Segment *s = &segments[i];
    if (s->ic[3] != 2 || s->ic[2] != 1 ||
        !(s->ic[0] == 1 || s->ic[0] == 2 || s->ic[0] == 4 ||
          s->ic[0] == 5 || s->ic[0] == 6 || s->ic[0] == 7 ||
          s->ic[0] == 8 || s->ic[0] == 9 || s->ic[0] == 10 ||
          s->ic[0] == 301)) continue;
    if (!s->valid) { invalid = 1; continue; }
    SpiceDouble *records = malloc((size_t)s->n * (size_t)s->rsize * sizeof(*records));
    if (!records) fail("sweep record allocation failed");
    dafgda_c(handle, s->begin, s->end - 4, records);
    if (failed_c()) fail("sweep record extraction failed");
    for (SpiceInt record = 0; record < s->n; record++) {
      SpiceDouble *row = records + (size_t)record * s->rsize;
      SpiceDouble mid = row[0], radius = row[1];
      if (!isfinite(mid) || !isfinite(radius) || radius <= 0.0) { invalid = 1; continue; }
      print_sample_manifest(s, i, record, -1, "record_quarter", mid - 0.5 * radius, 0.0, 0.0, "not_applicable");
      print_sample_manifest(s, i, record, -1, "record_midpoint", mid, 0.0, 0.0, "not_applicable");
      print_sample_manifest(s, i, record, -1, "record_three_quarter", mid + 0.5 * radius, 0.0, 0.0, "not_applicable");
    }
    for (SpiceInt knot = 1; knot < s->n; knot++) {
      SpiceDouble *previous = records + (size_t)(knot - 1) * s->rsize;
      SpiceDouble *next = records + (size_t)knot * s->rsize;
      SpiceDouble directory_knot = s->init + knot * s->intlen;
      SpiceDouble stored_knot = previous[0] + previous[1];
      SpiceDouble next_start = next[0] - next[1];
      int identical = bits(directory_knot) == bits(stored_knot) && bits(directory_knot) == bits(next_start);
      const char *identity_status = identical ? "verified" : "mismatch";
      if (!identical) invalid = 1;
      print_sample_manifest(s, i, -1, knot, "next_down_knot", nextafter(directory_knot, -INFINITY), directory_knot, stored_knot, identity_status);
      print_sample_manifest(s, i, -1, knot, "exact_knot", directory_knot, directory_knot, stored_knot, identity_status);
      print_sample_manifest(s, i, -1, knot, "next_up_knot", nextafter(directory_knot, INFINITY), directory_knot, stored_knot, identity_status);
    }
    print_sample_manifest(s, i, 0, -1, "segment_coverage_start", s->dc[0], 0.0, 0.0, "not_applicable");
    print_sample_manifest(s, i, s->n - 1, -1, "segment_coverage_end", s->dc[1], 0.0, 0.0, "not_applicable");
    free(records);
  }
  return invalid ? 1 : 0;
}

static int evaluate_batch(SpiceInt handle, const Type2Segment *segments, int count, const char *input_path, const char *output_path) {
  FILE *input = input_path ? fopen(input_path, "rb") : stdin;
  FILE *output = output_path ? fopen(output_path, "wb") : stdout;
  if (!input) fail("batch input open failed");
  if (!output) fail("batch output open failed");
  char line[8192], sample_id[512];
  int failed = 0;
  while (fgets(line, sizeof(line), input)) {
    if (!strchr(line, '\n') && !feof(input)) { failed = 1; continue; }
    SpiceDouble et = 0.0;
    SpiceInt target = 0, center = 0, frame = 0;
    uint64_t et_bits = 0;
    if (!json_string_field(line, "sampleId", sample_id, sizeof(sample_id)) ||
        !json_int_field(line, "targetId", &target) || !json_int_field(line, "centerId", &center) ||
        !json_int_field(line, "frameId", &frame) || !json_hex_field(line, "queryEtHex", &et_bits)) {
      failed = 1;
      continue;
    }
    memcpy(&et, &et_bits, sizeof(et));
    if (!isfinite(et)) { failed = 1; continue; }
    int matching[8], matching_count = 0;
    for (int i = 0; i < count; i++) {
      const Type2Segment *s = &segments[i];
      SpiceDouble record_coverage_start = s->init;
      SpiceDouble record_coverage_end = s->init + s->n * s->intlen;
      if (s->ic[3] == 2 && s->ic[0] == target && s->ic[2] == frame && et >= record_coverage_start && et <= record_coverage_end) {
        if (matching_count < (int)(sizeof(matching) / sizeof(matching[0]))) matching[matching_count++] = i;
      }
    }
    if (matching_count == 0) {
      fprintf(output, "{\"schemaVersion\":1,\"recordType\":\"de405_spk_type2_batch_state\",\"sampleId\":");
      json_string_file(output, sample_id);
      fprintf(output, ",\"queryEt\":%.17g,\"queryEtHex\":\"0x%016" PRIx64 "\",\"targetId\":%d,\"centerId\":%d,\"frameId\":%d,\"segmentOrdinal\":null,\"spkSegmentCenterId\":null,\"selectedRecordIndex\":null,\"selectionEvidenceStatus\":\"out_of_coverage\",\"normalizedTime\":null,\"stateKmKmPerSec\":null}\n", et, et_bits, target, center, frame);
      continue;
    }
    const Type2Segment *s = &segments[matching[0]];
    SpiceInt selected = -1;
    SpiceDouble selected_mid = 0.0, selected_radius = 0.0, selected_normalized = 0.0;
    SpiceInt base = (SpiceInt)floor((et - s->init) / s->intlen);
    if (base < 0) base = 0;
    if (base >= s->n) base = s->n - 1;
    SpiceDouble reference[6]; SpiceInt reference_id = s->ic[2], reference_center = s->ic[1];
    spkpvn_c(handle, s->sum, et, &reference_id, reference, &reference_center);
    if (failed_c()) fail("SPK batch evaluation failed");
    for (int offset = -1; offset <= 1; offset++) {
      SpiceInt candidate = base + offset;
      SpiceDouble state[6], mid = 0.0, radius = 0.0, normalized = 0.0;
      if (candidate < 0 || candidate >= s->n || !evaluate_record(handle, s, candidate, et, state, &mid, &radius, &normalized)) continue;
      int match = 1;
      for (int axis = 0; axis < 6; axis++) if (bits(state[axis]) != bits(reference[axis])) match = 0;
      if (match) {
        if (selected >= 0) selected = -2;
        else { selected = candidate; selected_mid = mid; selected_radius = radius; selected_normalized = normalized; }
      }
    }
    const char *status = matching_count > 1 ? "selection_ambiguous" : (selected >= 0 ? "verified" : "selection_ambiguous");
    /* Evidence ambiguity is a row-level result; the batch must still emit every sample. */
    if (et < s->dc[0] || et > s->dc[1]) {
      fprintf(output, "{\"schemaVersion\":1,\"recordType\":\"de405_spk_type2_batch_state\",\"sampleId\":");
      json_string_file(output, sample_id);
      fprintf(output, ",\"queryEt\":%.17g,\"queryEtHex\":\"0x%016" PRIx64 "\",\"targetId\":%d,\"centerId\":%d,\"frameId\":%d,\"segmentOrdinal\":%d,\"spkSegmentCenterId\":%d,\"selectedRecordIndex\":", et, et_bits, target, center, frame, matching[0], s->ic[1]);
      if (selected >= 0) fprintf(output, "%d", selected); else fprintf(output, "null");
      fprintf(output, ",\"selectionEvidenceStatus\":\"out_of_coverage\",\"normalizedTime\":");
      if (selected >= 0) fprintf(output, "%.17g", selected_normalized); else fprintf(output, "null");
      fprintf(output, ",\"recordMidEt\":%.17g,\"recordRadiusSec\":%.17g,\"stateKmKmPerSec\":null}\n", selected_mid, selected_radius);
      continue;
    }
    SpiceDouble output_state[6], light_time;
    spkez_c(target, et, "J2000", "NONE", center, output_state, &light_time);
    if (failed_c()) fail("SPK batch observer-state evaluation failed");
    fprintf(output, "{\"schemaVersion\":1,\"recordType\":\"de405_spk_type2_batch_state\",\"sampleId\":");
    json_string_file(output, sample_id);
    fprintf(output, ",\"queryEt\":%.17g,\"queryEtHex\":\"0x%016" PRIx64 "\",\"targetId\":%d,\"centerId\":%d,\"frameId\":%d,\"segmentOrdinal\":%d,\"spkSegmentCenterId\":%d,\"selectedRecordIndex\":", et, et_bits, target, center, frame, matching[0], s->ic[1]);
    if (selected >= 0) fprintf(output, "%d", selected); else fprintf(output, "null");
    fprintf(output, ",\"selectionEvidenceStatus\":\"%s\",\"normalizedTime\":", status);
    if (selected >= 0) fprintf(output, "%.17g", selected_normalized); else fprintf(output, "null");
    fprintf(output, ",\"recordMidEt\":%.17g,\"recordRadiusSec\":%.17g,\"stateKmKmPerSec\":", selected_mid, selected_radius);
    fprintf(output, "[%.17g,%.17g,%.17g,%.17g,%.17g,%.17g]", output_state[0], output_state[1], output_state[2], output_state[3], output_state[4], output_state[5]);
    fprintf(output, "}\n");
  }
  if (input_path) fclose(input);
  if (output_path) fclose(output);
  return failed ? 1 : 0;
}

static void print_selection(const Type2Segment *s, int ordinal, SpiceInt knot, SpiceDouble et, const char *kind, const SpiceInt *candidates, int candidate_count, const char *status, SpiceInt selected, const SpiceDouble states[][6], const SpiceDouble mids[], const SpiceDouble radii[], const SpiceDouble normalized[], const SpiceDouble spice_state[6]) {
  printf("{\"schemaVersion\":1,\"recordType\":\"spk_type2_record_selection\",\"boundaryId\":\"target-%d-knot-%d\",\"targetId\":%d,\"centerId\":%d,\"frameId\":%d,\"segmentOrdinal\":%d,\"segmentId\":", s->ic[0], knot, s->ic[0], s->ic[1], s->ic[2], ordinal);
  json_string(s->id);
  printf(",\"knotIndex\":%d,\"knotEt\":%.17g,\"epochKind\":\"%s\",\"queryEt\":%.17g,\"candidateRecordIndices\":[", knot, s->init + knot * s->intlen, kind, et);
  for (int i = 0; i < candidate_count; i++) printf("%s%d", i ? "," : "", candidates[i]);
  printf("],\"selectedRecordIndex\":");
  if (selected >= 0) printf("%d", selected); else printf("null");
  printf(",\"selectionEvidenceStatus\":\"%s\",\"candidateEvaluations\":[", status);
  for (int i = 0; i < candidate_count; i++) {
    int match = 1; for (int axis = 0; axis < 6; axis++) if (bits(states[i][axis]) != bits(spice_state[axis])) match = 0;
    printf("%s{\"recordIndex\":%d,\"midEt\":%.17g,\"radiusSec\":%.17g,\"recordStartEt\":%.17g,\"recordEndEt\":%.17g,\"normalizedTime\":%.17g,\"bitwiseStateMatch\":%s,\"componentBits\":[", i ? "," : "", candidates[i], mids[i], radii[i], mids[i] - radii[i], mids[i] + radii[i], normalized[i], match ? "true" : "false");
    for (int axis = 0; axis < 6; axis++) { if (bits(states[i][axis]) != bits(spice_state[axis])) match = 0; printf("%s%" PRIu64, axis ? "," : "", bits(states[i][axis])); }
    printf("],\"componentUlpDistances\":[");
    for (int axis = 0; axis < 6; axis++) printf("%s%" PRIu64, axis ? "," : "", ulp_distance(states[i][axis], spice_state[axis]));
    printf("],\"positionResidualKm\":%.17g,\"velocityResidualKmPerSec\":%.17g}", hypot(hypot(states[i][0] - spice_state[0], states[i][1] - spice_state[1]), states[i][2] - spice_state[2]), hypot(hypot(states[i][3] - spice_state[3], states[i][4] - spice_state[4]), states[i][5] - spice_state[5]));
  }
  printf("]}\n");
}

int main(int argc, char **argv) {
  setlocale(LC_NUMERIC, "C"); erract_c("SET", 6, "RETURN");
  if (argc < 2) { fprintf(stderr, "mode required\n"); return 2; }
  if (!strcmp(argv[1], "--version")) { puts("{\"runnerVersion\":\"de405-canonical-v2-runner\",\"cspiceToolkitVersion\":\"N0067\",\"testOnly\":false}"); return 0; }
  const char *spk = NULL, *out = NULL, *input_jsonl = NULL; int target = 0, knot = -1;
  for (int i = 2; i + 1 < argc; i++) { if (!strcmp(argv[i], "--spk")) spk = argv[++i]; else if (!strcmp(argv[i], "--output") || !strcmp(argv[i], "--output-jsonl")) out = argv[++i]; else if (!strcmp(argv[i], "--input-jsonl")) input_jsonl = argv[++i]; else if (!strcmp(argv[i], "--target-id")) target = atoi(argv[++i]); else if (!strcmp(argv[i], "--knot-index")) knot = atoi(argv[++i]); }
  if (!spk) fail("missing SPK argument");
  furnsh_c(spk); if (failed_c()) fail("SPK load failed");
  SpiceInt handle; dafopr_c(spk, &handle); if (failed_c()) fail("DAF open failed");
  Type2Segment segments[256]; int count = load_type2_segments(handle, segments, 256);
  if (!strcmp(argv[1], "--emit-spk-type2-sweep-manifest")) { int status = emit_sweep_manifest(handle, segments, count); dafcls_c(handle); kclear_c(); return status; }
  if (!strcmp(argv[1], "--evaluate-spk-type2-batch")) { int status = evaluate_batch(handle, segments, count, input_jsonl, out); dafcls_c(handle); kclear_c(); return status; }
  if (!strcmp(argv[1], "--dump-spk-type2-segments")) { int invalid = 0; for (int i = 0; i < count; i++) if (segments[i].ic[3] == 2) { print_metadata(&segments[i], i); if (!segments[i].valid) invalid = 1; } dafcls_c(handle); kclear_c(); return invalid ? 1 : 0; }
  if (!strcmp(argv[1], "--inspect-spk-type2-knot")) {
    if (target == 0 || knot < 1) fail("target-id and positive knot-index are required");
    int applicable = 0, invalid = 0, ambiguous_segment = 0, any_verified = 0; SpiceInt selected = -1;
    int applicable_segment_count = 0;
    for (int i = 0; i < count; i++) if (segments[i].ic[3] == 2 && segments[i].ic[0] == target && segments[i].valid && knot < segments[i].n) applicable_segment_count++;
    if (applicable_segment_count > 1) ambiguous_segment = 1;
    for (int i = 0; i < count; i++) {
      Type2Segment *s = &segments[i];
      if (s->ic[3] != 2 || s->ic[0] != target) continue;
      if (!s->valid || knot >= s->n) { invalid = 1; continue; }
      SpiceDouble et = s->init + knot * s->intlen; SpiceDouble down = nextafter(et, -INFINITY), up = nextafter(et, INFINITY);
      const SpiceDouble probes[3] = {down, et, up}; const char *kinds[3] = {"nextDown", "exact_record_knot", "nextUp"};
      for (int p = 0; p < 3; p++) {
        SpiceInt candidates[2] = {knot - 1, knot}; int candidate_count = (knot - 1 >= 0 && knot < s->n) ? 2 : 1;
        SpiceDouble spice_state[6], states[2][6], mids[2] = {0}, radii[2] = {0}, normalized[2] = {0}; SpiceInt ref = s->ic[2], center = s->ic[1];
        SpiceDouble query = probes[p]; spkpvn_c(handle, s->sum, query, &ref, spice_state, &center); if (failed_c()) fail("spkpvn_c failed");
        int matches = 0, chosen = -1;
        for (int c = 0; c < candidate_count; c++) if (evaluate_record(handle, s, candidates[c], query, states[c], &mids[c], &radii[c], &normalized[c])) { int match = 1; for (int axis = 0; axis < 6; axis++) if (bits(states[c][axis]) != bits(spice_state[axis])) match = 0; if (match) { matches++; chosen = candidates[c]; } }
        const char *status = ambiguous_segment ? "selection_ambiguous" : (matches == 1 ? "verified" : (matches > 1 ? "selection_ambiguous" : "unavailable"));
        print_selection(s, i, knot, query, kinds[p], candidates, candidate_count, status, (!ambiguous_segment && matches == 1) ? chosen : -1, states, mids, radii, normalized, spice_state);
        applicable++; if (matches == 1) { any_verified = 1; selected = chosen; }
      }
    }
    dafcls_c(handle); kclear_c(); if (invalid || ambiguous_segment) return 1; if (applicable == 0 || !any_verified) return 1; (void)selected; return 0;
  }
  if (!strcmp(argv[1], "--coverage")) { SPICEINT_CELL(objects,100); SPICEDOUBLE_CELL(cover,100); spkobj_c(spk,&objects); if (failed_c()) fail("spkobj_c failed"); double commonStart=-1.0e300,commonEnd=1.0e300; for(int j=0;j<10;j++){int found=0;for(int i=0;i<objects.card;i++){SpiceInt object;SPICE_CELL_GET_I(&objects,i,&object);if(object==ids[j])found=1;}if(!found)fail("canonical target absent from SPK");scard_c(0,&cover);spkcov_c(spk,ids[j],&cover);if(failed_c()||cover.card==0)fail("spkcov_c failed");for(int i=0;i<wncard_c(&cover);i++){SpiceDouble left,right;wnfetd_c(&cover,i,&left,&right);if(left>commonStart)commonStart=left;if(right<commonEnd)commonEnd=right;}}printf("{\"coverageStartEt\":\"%.16e\",\"coverageEndEt\":\"%.16e\",\"objectCount\":%d,\"coverageTool\":\"spkobj_c+spkcov_c\",\"coverageToolVersion\":\"N0067\"}\n",commonStart,commonEnd,objects.card);dafcls_c(handle);kclear_c();return 0; }
  if (!strcmp(argv[1], "--generate-overlap-smoke") && out) { const char *start = NULL; int count_out = 7342; double step = 864000; for(int i=2;i+1<argc;i++){if(!strcmp(argv[i],"--start-et"))start=argv[++i];else if(!strcmp(argv[i],"--count"))count_out=atoi(argv[++i]);else if(!strcmp(argv[i],"--step-seconds"))step=atof(argv[++i]);}if(!start||count_out<1)fail("invalid smoke arguments");FILE*f=fopen(out,"wb");if(!f)fail("output open failed");double s=atof(start);for(int i=0;i<count_out;i++){double et=s+i*step;for(int j=0;j<10;j++){double st[6],lt;spkez_c(ids[j],et,"J2000","NONE",399,st,&lt);if(failed_c())fail("spkez_c failed");fprintf(f,"{\"schemaVersion\":\"de405-canonical-v2\",\"etSeconds\":\"%.17e\",\"targetId\":%d,\"target\":\"%s\",\"targetType\":\"%s\",\"observerId\":399,\"observer\":\"EARTH\",\"frame\":\"J2000\",\"aberrationCorrection\":\"NONE\",\"positionKm\":{\"x\":\"%.17e\",\"y\":\"%.17e\",\"z\":\"%.17e\"},\"velocityKmPerSecond\":{\"x\":\"%.17e\",\"y\":\"%.17e\",\"z\":\"%.17e\"}}\n",et,ids[j],names[j],types[j],st[0],st[1],st[2],st[3],st[4],st[5]);}}fclose(f);dafcls_c(handle);kclear_c();return 0; }
  fail("unsupported runner mode"); return 2;
}
