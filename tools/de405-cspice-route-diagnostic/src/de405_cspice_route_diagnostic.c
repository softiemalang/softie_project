#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "SpiceUsr.h"

void de405_diag_open(FILE *);
void de405_diag_close(void);
void de405_diag_request_start(const char *, SpiceInt, SpiceInt, SpiceDouble);
static uint64_t bits(double value) { uint64_t out; memcpy(&out, &value, sizeof out); return out; }
static int field(const char *line, const char *name, char *out, size_t size) {
  char needle[96]; snprintf(needle, sizeof needle, "\"%s\":", name); const char *p = strstr(line, needle); if (!p) return 0; p += strlen(needle);
  if (*p == '"') { p++; const char *q = strchr(p, '"'); if (!q || (size_t)(q - p) + 1 > size) return 0; memcpy(out, p, (size_t)(q - p)); out[q - p] = 0; return 1; }
  char *end; double v = strtod(p, &end); if (end == p) return 0; snprintf(out, size, "%.17g", v); return 1;
}
static void state_json(FILE *out, double *state) { fprintf(out, "[\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\"]", bits(state[0]), bits(state[1]), bits(state[2]), bits(state[3]), bits(state[4]), bits(state[5])); }
int main(int argc, char **argv) {
  const char *spk = NULL, *input = NULL, *output = NULL, *events = NULL;
  for (int i = 1; i + 1 < argc; i++) { if (!strcmp(argv[i], "--spk")) spk = argv[++i]; else if (!strcmp(argv[i], "--input-jsonl")) input = argv[++i]; else if (!strcmp(argv[i], "--output-jsonl")) output = argv[++i]; else if (!strcmp(argv[i], "--events-jsonl")) events = argv[++i]; }
  if (!spk || !input || !output || !events) return 2;
  furnsh_c(spk); if (failed_c()) return 3; FILE *in = fopen(input, "rb"), *out = fopen(output, "wb"), *ev = fopen(events, "wb"); if (!in || !out || !ev) return 4;
  de405_diag_open(ev); char line[8192], id[512], text[128];
  while (fgets(line, sizeof line, in)) {
    if (!field(line, "sampleId", id, sizeof id) || !field(line, "targetId", text, sizeof text)) continue;
    SpiceInt target = (SpiceInt)strtol(text, NULL, 10); if (!field(line, "queryEt", text, sizeof text)) continue; SpiceDouble et = strtod(text, NULL), state[6], lt;
    de405_diag_request_start(id, target, 399, et); reset_c(); spkez_c(target, et, "J2000", "NONE", 399, state, &lt);
    fprintf(out, "{\"schemaVersion\":1,\"caseId\":\"%s\",\"targetId\":%d,\"etBits\":\"0x%016" PRIx64 "\",\"error\":%s,\"stateBits\":", id, (int)target, bits(et), failed_c() ? "true" : "false"); if (failed_c()) fputs("null", out); else state_json(out, state); fputs("}\n", out);
  }
  de405_diag_close(); fclose(in); fclose(out); fclose(ev); kclear_c(); return 0;
}
