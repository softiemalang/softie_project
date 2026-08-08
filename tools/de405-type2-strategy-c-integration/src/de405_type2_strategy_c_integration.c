/*
 * Test-only production-shaped integration copy.
 * The canonical runner source is included unchanged and only its Type-2
 * evaluator call is redirected to the Strategy C translation unit.
 */
#define main de405_canonical_v2_integration_main
#define chbint_c de405_strategy_c_chbint
#include "../../de405-cspice-runner/src/de405_canonical_v2.c"
#undef chbint_c
#undef main

extern void de405_candidate_cheby(const double *, int, double, double, double, double *, double *);

static FILE *strategy_c_trace_file;
static uint64_t strategy_c_trace_ordinal;

static void close_strategy_c_trace(void) {
  if (strategy_c_trace_file) fclose(strategy_c_trace_file);
}

static void open_strategy_c_trace(void) {
  const char *path = getenv("DE405_STRATEGY_C_TRACE");
  if (!path || !*path) return;
  strategy_c_trace_file = fopen(path, "wb");
  if (!strategy_c_trace_file) {
    fprintf(stderr, "strategy C trace open failed\n");
    exit(1);
  }
  atexit(close_strategy_c_trace);
}

void de405_strategy_c_chbint(const SpiceDouble *cp, SpiceInt deg, const SpiceDouble *record,
                             SpiceDouble et, SpiceDouble *px, SpiceDouble *dpx) {
  if (!strategy_c_trace_file && strategy_c_trace_ordinal == 0) open_strategy_c_trace();
  de405_candidate_cheby(cp, (int)deg, record[0], record[1], et, px, dpx);
  if (strategy_c_trace_file) {
    fprintf(strategy_c_trace_file, "{\"schemaVersion\":1,\"recordType\":\"de405_strategy_c_evaluator_call\",\"callOrdinal\":%llu,\"queryEtBits\":\"0x%016" PRIx64 "\",\"recordMidEtBits\":\"0x%016" PRIx64 "\",\"recordRadiusBits\":\"0x%016" PRIx64 "\",\"coefficientFirstBits\":\"0x%016" PRIx64 "\",\"stateBits\":[\"0x%016" PRIx64 "\",\"0x%016" PRIx64 "\"]}\n",
            (unsigned long long)strategy_c_trace_ordinal++, bits(et), bits(record[0]), bits(record[1]), bits(cp[0]), bits(*px), bits(*dpx));
    fflush(strategy_c_trace_file);
  }
}

int main(int argc, char **argv) {
  return de405_canonical_v2_integration_main(argc, argv);
}
