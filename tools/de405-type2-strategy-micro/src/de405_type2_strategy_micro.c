#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

extern void de405_candidate_cheby(const double *, int, double, double, double, double *, double *);

static uint64_t bits(double value) { uint64_t result; memcpy(&result, &value, sizeof result); return result; }
static void fail(const char *message) { fprintf(stderr, "%s\n", message); exit(1); }

static void print_bits(FILE *output, const double state[6]) {
  fputc('[', output);
  for (int i = 0; i < 6; i++) fprintf(output, "%s\"0x%016" PRIx64 "\"", i ? "," : "", bits(state[i]));
  fputc(']', output);
}

int main(int argc, char **argv) {
  if (argc != 5 || strcmp(argv[1], "--evaluate-batch") != 0) return 2;
  FILE *input = fopen(argv[2], "rb"), *output = fopen(argv[3], "wb");
  if (!input || !output) fail("input/output open failed");
  uint64_t count = 0;
  if (fread(&count, sizeof count, 1, input) != 1 || count > 10000) fail("invalid batch count");
  for (uint64_t ordinal = 0; ordinal < count; ordinal++) {
    uint32_t idLength = 0, recordLength = 0;
    if (fread(&idLength, sizeof idLength, 1, input) != 1 || idLength > 4096) fail("invalid sample id length");
    char *sampleId = calloc((size_t)idLength + 1, 1);
    if (!sampleId || fread(sampleId, 1, idLength, input) != idLength) fail("invalid sample id");
    if (fread(&recordLength, sizeof recordLength, 1, input) != 1 || recordLength < 5 || recordLength > 386) fail("invalid record length");
    double *record = malloc((size_t)recordLength * sizeof(*record));
    if (!record) fail("record allocation failed");
    for (uint32_t i = 0; i < recordLength; i++) {
      uint64_t value = 0;
      if (fread(&value, sizeof value, 1, input) != 1) fail("invalid record payload");
      memcpy(&record[i], &value, sizeof value);
    }
    uint64_t etBits = 0;
    if (fread(&etBits, sizeof etBits, 1, input) != 1) fail("invalid ET payload");
    double et;
    memcpy(&et, &etBits, sizeof et);
    int degree = (int)((recordLength - 2) / 3) - 1;
    double state[6] = {0};
    for (int axis = 0; axis < 3; axis++) {
      const double *coefficients = record + 2 + axis * (degree + 1);
      de405_candidate_cheby(coefficients, degree, record[0], record[1], et, &state[axis], &state[axis + 3]);
    }
    fprintf(output, "{\"sampleId\":\"");
    for (uint32_t i = 0; i < idLength; i++) { if (sampleId[i] == '\\' || sampleId[i] == '"') fputc('\\', output); fputc(sampleId[i], output); }
    fputs("\",\"stateBits\":", output); print_bits(output, state); fputs("}\n", output);
    free(record); free(sampleId);
  }
  fclose(input); fclose(output); return 0;
}
