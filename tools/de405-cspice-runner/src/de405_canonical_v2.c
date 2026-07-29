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
  const char *spk = NULL, *out = NULL; int target = 0, knot = -1;
  for (int i = 2; i + 1 < argc; i++) { if (!strcmp(argv[i], "--spk")) spk = argv[++i]; else if (!strcmp(argv[i], "--output")) out = argv[++i]; else if (!strcmp(argv[i], "--target-id")) target = atoi(argv[++i]); else if (!strcmp(argv[i], "--knot-index")) knot = atoi(argv[++i]); }
  if (!spk) fail("missing SPK argument");
  furnsh_c(spk); if (failed_c()) fail("SPK load failed");
  SpiceInt handle; dafopr_c(spk, &handle); if (failed_c()) fail("DAF open failed");
  Type2Segment segments[256]; int count = load_type2_segments(handle, segments, 256);
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
