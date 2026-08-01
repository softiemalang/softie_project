#include <inttypes.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  uint64_t ordinal;
  uint64_t coefficientBits, w0Bits, w1Bits, w2Bits, d0Bits, d1Bits, d2Bits;
} Operation;

typedef struct {
  uint64_t normalizedBits, twiceNormalizedBits, polynomialBits, derivativeBits, scaleBits, velocityBits;
  size_t operationCount;
  Operation operations[128];
} Component;

typedef struct { double state[6]; Component components[3]; } Evaluation;

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
    Component *component = &out->components[axis];
    component->normalizedBits = bits(s);
    component->twiceNormalizedBits = bits(s2);
    double w0 = 0.0, w1 = 0.0, w2 = 0.0;
    double dw0 = 0.0, dw1 = 0.0, dw2 = 0.0;
    for (int j = degree + 1; j > 1; j--) {
      w2 = w1; w1 = w0; w0 = cp[j - 1] + (s2 * w1 - w2);
      dw2 = dw1; dw1 = dw0; dw0 = w1 * 2.0 + dw1 * s2 - dw2;
      Operation *operation = &component->operations[component->operationCount++];
      operation->ordinal = (uint64_t)j;
      operation->coefficientBits = bits(cp[j - 1]);
      operation->w0Bits = bits(w0); operation->w1Bits = bits(w1); operation->w2Bits = bits(w2);
      operation->d0Bits = bits(dw0); operation->d1Bits = bits(dw1); operation->d2Bits = bits(dw2);
    }
    out->state[axis] = cp[0] + (s * w0 - w1);
    out->state[axis + 3] = (w0 + s * dw0 - dw1) / record[1];
    component->polynomialBits = bits(out->state[axis]);
    component->derivativeBits = bits(w0 + s * dw0 - dw1);
    component->scaleBits = bits(record[1]);
    component->velocityBits = bits(out->state[axis + 3]);
  }
}

static void write_bits(FILE *file, const double *values) {
  fputc('[', file);
  for (int i = 0; i < 6; i++) fprintf(file, "%s\"0x%016" PRIx64 "\"", i ? "," : "", bits(values[i]));
  fputc(']', file);
}

static void write_component(FILE *file, const Component *component) {
  fprintf(file, "{\"normalizedBits\":\"0x%016" PRIx64 "\",\"twiceNormalizedBits\":\"0x%016" PRIx64 "\",\"operations\":[", component->normalizedBits, component->twiceNormalizedBits);
  for (size_t i = 0; i < component->operationCount; i++) {
    const Operation *operation = &component->operations[i];
    if (i) fputc(',', file);
    fprintf(file, "{\"ordinal\":%" PRIu64 ",\"coefficientBits\":\"0x%016" PRIx64 "\",\"w0Bits\":\"0x%016" PRIx64 "\",\"w1Bits\":\"0x%016" PRIx64 "\",\"w2Bits\":\"0x%016" PRIx64 "\",\"d0Bits\":\"0x%016" PRIx64 "\",\"d1Bits\":\"0x%016" PRIx64 "\",\"d2Bits\":\"0x%016" PRIx64 "\"}", operation->ordinal, operation->coefficientBits, operation->w0Bits, operation->w1Bits, operation->w2Bits, operation->d0Bits, operation->d1Bits, operation->d2Bits);
  }
  fprintf(file, "],\"polynomialBits\":\"0x%016" PRIx64 "\",\"derivativeBits\":\"0x%016" PRIx64 "\",\"scaleBits\":\"0x%016" PRIx64 "\",\"velocityBits\":\"0x%016" PRIx64 "\"}", component->polynomialBits, component->derivativeBits, component->scaleBits, component->velocityBits);
}

int main(int argc, char **argv) {
  if (argc != 4 || strcmp(argv[1], "--evaluate") != 0) return 2;
  FILE *input = fopen(argv[2], "rb"), *output = fopen(argv[3], "wb");
  if (!input || !output) fail("input/output open failed");
  double record[386]; uint64_t etBits = 0; size_t length = 0;
  if (fread(&length, sizeof length, 1, input) != 1 || length > 386 || fread(record, sizeof(double), length, input) != length || fread(&etBits, sizeof etBits, 1, input) != 1) fail("malformed binary input");
  Evaluation result; memset(&result, 0, sizeof result); evaluate(record, length, etBits, &result);
  fputs("{\"stateBits\":", output); write_bits(output, result.state); fputs(",\"components\":[", output);
  for (int axis = 0; axis < 3; axis++) { if (axis) fputc(',', output); write_component(output, &result.components[axis]); }
  fputs("]}\n", output);
  fclose(input); fclose(output); return 0;
}
