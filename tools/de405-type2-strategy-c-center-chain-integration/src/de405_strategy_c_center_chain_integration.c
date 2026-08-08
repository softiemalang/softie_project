#include <inttypes.h>
#include <stdint.h>
#include <locale.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "SpiceUsr.h"
#include "f2c.h"

static uint64_t bits(double value) {
  uint64_t result;
  memcpy(&result, &value, sizeof result);
  return result;
}

static int field(const char *line, const char *name, const char **value) {
  char needle[96];
  int length = snprintf(needle, sizeof needle, "\"%s\":", name);
  const char *found = length > 0 ? strstr(line, needle) : NULL;
  if (!found) return 0;
  *value = found + length;
  return 1;
}

static int string_field(const char *line, const char *name, char *out, size_t capacity) {
  const char *value;
  if (!field(line, name, &value) || *value++ != '"') return 0;
  const char *end = strchr(value, '"');
  if (!end || (size_t)(end - value) + 1 > capacity) return 0;
  memcpy(out, value, (size_t)(end - value));
  out[end - value] = '\0';
  return 1;
}

static int hex_field(const char *line, const char *name, uint64_t *out) {
  char value[32], *end;
  if (!string_field(line, name, value, sizeof value) || strncmp(value, "0x", 2) != 0) return 0;
  unsigned long long parsed = strtoull(value + 2, &end, 16);
  if (*end != '\0') return 0;
  *out = (uint64_t)parsed;
  return 1;
}

static int int_field(const char *line, const char *name, SpiceInt *out) {
  const char *value, *end;
  if (!field(line, name, &value)) return 0;
  long parsed = strtol(value, (char **)&end, 10);
  if (end == value || parsed < INT32_MIN || parsed > INT32_MAX) return 0;
  *out = (SpiceInt)parsed;
  return 1;
}

static void state_json(FILE *out, const SpiceDouble state[6]) {
  fprintf(out, "[\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\"]",
          bits(state[0]), bits(state[1]), bits(state[2]), bits(state[3]), bits(state[4]), bits(state[5]));
}

int main(int argc, char **argv) {
  const char *spk = NULL, *input_path = NULL, *output_path = NULL;
  for (int i = 1; i + 1 < argc; i++) {
    if (!strcmp(argv[i], "--spk")) spk = argv[++i];
    else if (!strcmp(argv[i], "--input-jsonl")) input_path = argv[++i];
    else if (!strcmp(argv[i], "--output-jsonl")) output_path = argv[++i];
  }
  if (!spk || !input_path || !output_path) return 2;

  setlocale(LC_NUMERIC, "C");
  erract_c("SET", 6, "RETURN");
  furnsh_c(spk);
  if (failed_c()) return 3;
  FILE *input = fopen(input_path, "rb");
  FILE *output = fopen(output_path, "wb");
  if (!input || !output) return 4;

  char line[8192], sample_id[512];
  int invalid = 0;
  while (fgets(line, sizeof line, input)) {
    SpiceInt target = 0, center = 0, frame = 0;
    uint64_t et_bits = 0;
    if (!string_field(line, "sampleId", sample_id, sizeof sample_id) ||
        !int_field(line, "targetId", &target) || !int_field(line, "centerId", &center) ||
        !int_field(line, "frameId", &frame) || !hex_field(line, "queryEtHex", &et_bits)) {
      invalid = 1;
      continue;
    }
    (void)frame;
    SpiceDouble et, state[6], light_time;
    memcpy(&et, &et_bits, sizeof et);
    reset_c();
    spkez_c(target, et, "J2000", "NONE", center, state, &light_time);
    fprintf(output, "{\"schemaVersion\":1,\"recordType\":\"de405_strategy_c_center_chain_state\",\"sampleId\":\"");
    fputs(sample_id, output);
    fprintf(output, "\",\"targetId\":%d,\"centerId\":%d,\"queryEtHex\":\"0x%016" PRIx64 "\",\"error\":%s,\"stateBits\":", (int)target, (int)center, et_bits, failed_c() ? "true" : "false");
    if (failed_c()) fputs("null", output); else state_json(output, state);
    fputs("}\n", output);
  }
  fclose(input);
  fclose(output);
  kclear_c();
  return invalid ? 1 : 0;
}

/* Strategy C replacement for the CSPICE N0067 Type-2 CHBINT symbol. */
int chbint_(doublereal *cp, integer *degp, doublereal *x2s, doublereal *x, doublereal *p, doublereal *dpdx) {
  doublereal s = (*x - x2s[0]) / x2s[1];
  doublereal s2 = s * 2.0;
  doublereal w0 = 0.0, w1 = 0.0, w2 = 0.0;
  doublereal d0 = 0.0, d1 = 0.0, d2 = 0.0;
  for (integer j = *degp + 1; j > 1; j--) {
    w2 = w1;
    w1 = w0;
    w0 = cp[j - 1] + (s2 * w1 - w2);
    d2 = d1;
    d1 = d0;
    d0 = w1 * 2.0 + d1 * s2 - d2;
  }
  *p = cp[0] + (s * w0 - w1);
  *dpdx = (w0 + s * d0 - d1) / x2s[1];
  return 0;
}
