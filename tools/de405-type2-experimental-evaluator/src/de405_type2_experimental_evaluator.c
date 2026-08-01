#include <inttypes.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct { double state[6]; } Evaluation;

static void fail(const char *message) { fprintf(stderr, "%s\n", message); exit(1); }
static uint64_t bits(double value) { uint64_t result; memcpy(&result, &value, sizeof result); return result; }

static void evaluate(const double *record, size_t length, uint64_t etBits, Evaluation *out) {
  if (!record || !out || length < 5 || (length - 2) % 3 != 0) fail("invalid Type-2 record length");
  if (!isfinite(record[0]) || !isfinite(record[1]) || record[1] <= 0.0) fail("non-finite or invalid record metadata");
  double et; memcpy(&et, &etBits, sizeof et);
  if (!isfinite(et)) fail("non-finite query ET");
  size_t count = (length - 2) / 3;
  int degree = (int)count - 1;
  for (int axis = 0; axis < 3; axis++) {
    const double *cp = record + 2 + axis * count;
    double s = (et - record[0]) / record[1];
    double s2 = s * 2.0;
    double w0 = 0.0, w1 = 0.0, w2 = 0.0;
    double dw0 = 0.0, dw1 = 0.0, dw2 = 0.0;
    for (int j = degree + 1; j > 1; j--) {
      w2 = w1; w1 = w0; w0 = cp[j - 1] + (s2 * w1 - w2);
      dw2 = dw1; dw1 = dw0; dw0 = w1 * 2.0 + dw1 * s2 - dw2;
    }
    out->state[axis] = cp[0] + (s * w0 - w1);
    out->state[axis + 3] = (w0 + s * dw0 - dw1) / record[1];
  }
}

static void write_bits(FILE *file, const double *values) {
  fputc('[', file);
  for (int i = 0; i < 6; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", bits(values[i]));
  fputc(']', file);
}

int main(int argc, char **argv) {
  if (argc != 4 || strcmp(argv[1], "--evaluate") != 0) return 2;
  FILE *input = fopen(argv[2], "rb"), *output = fopen(argv[3], "wb");
  if (!input || !output) fail("input/output open failed");
  double record[386]; uint64_t etBits = 0; size_t length = 0;
  if (fread(&length, sizeof length, 1, input) != 1 || length > 386 || fread(record, sizeof(double), length, input) != length || fread(&etBits, sizeof etBits, 1, input) != 1) fail("malformed binary input");
  Evaluation result; evaluate(record, length, etBits, &result); write_bits(output, result.state); fputc('\n', output);
  fclose(input); fclose(output); return 0;
}
