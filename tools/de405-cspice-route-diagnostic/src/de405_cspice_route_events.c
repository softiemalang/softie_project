#include <inttypes.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include "f2c.h"
extern int vaddg_(doublereal *, doublereal *, integer *, doublereal *);
extern int vsubg_(doublereal *, doublereal *, integer *, doublereal *);
extern int moved_(doublereal *, integer *, doublereal *);
extern int mxv_(doublereal *, doublereal *, doublereal *);
extern int mxvg_(doublereal *, doublereal *, integer *, integer *, doublereal *);

static FILE *sink;
static uint64_t sequence;
static char current_case_id[512];
static integer current_target;
static integer current_observer;
static uint64_t current_request_et_bits;
static integer current_leg_index;

static uint64_t bits(doublereal value) { uint64_t out; memcpy(&out, &value, sizeof out); return out; }
static void vec(FILE *out, const doublereal *values, int count) {
  fputc('[', out);
  for (int i = 0; i < count; i++) fprintf(out, "\"0x%016" PRIx64 "\"%s", bits(values[i]), i + 1 == count ? "" : ",");
  fputc(']', out);
}
static void event(const char *type, doublereal et) {
  if (!sink) return;
  fprintf(sink, "{\"schemaVersion\":1,\"eventSequence\":%" PRIu64 ",\"caseId\":\"%s\",\"requestTargetId\":%d,\"requestObserverId\":%d,\"requestEtBits\":\"0x%016" PRIx64 "\",\"eventType\":\"%s\",\"eventEtBits\":\"0x%016" PRIx64 "\"", ++sequence, current_case_id, (int)current_target, (int)current_observer, current_request_et_bits, type, bits(et));
}
void de405_diag_open(FILE *out) { sink = out; sequence = 0; current_case_id[0] = 0; current_target = 0; current_observer = 0; current_request_et_bits = 0; current_leg_index = 0; }
void de405_diag_close(void) { if (sink) fflush(sink); sink = NULL; }
void de405_diag_request_start(const char *case_id, integer target, integer observer, doublereal et) {
  if (!sink) return;
  snprintf(current_case_id, sizeof current_case_id, "%s", case_id); current_target = target; current_observer = observer; current_request_et_bits = bits(et); current_leg_index = 0;
  fprintf(sink, "{\"schemaVersion\":1,\"eventSequence\":%" PRIu64 ",\"caseId\":\"%s\",\"requestTargetId\":%d,\"requestObserverId\":%d,\"requestEtBits\":\"0x%016" PRIx64 "\",\"eventType\":\"request_start\",\"eventEtBits\":\"0x%016" PRIx64 "\"}\n", ++sequence, current_case_id, (int)target, (int)observer, current_request_et_bits, current_request_et_bits);
}
void de405_diag_segment(doublereal et, integer *ic, integer frame) {
  current_leg_index++;
  event("segment_selected", et);
  if (!sink) return;
  (void)frame;
  fprintf(sink, ",\"legIndex\":%d,\"targetId\":%d,\"centerId\":%d,\"frameId\":%d,\"segmentType\":%d,\"beginAddress\":%d,\"endAddress\":%d}\n", (int)current_leg_index, (int)ic[0], (int)ic[1], (int)ic[2], (int)ic[3], (int)ic[4], (int)ic[5]);
}
void de405_diag_record(doublereal et, integer record, integer size, integer begin) {
  event("record_selected", et);
  if (!sink) return;
  fprintf(sink, ",\"legIndex\":%d,\"recordNumber\":%d,\"recordSize\":%d,\"recordBeginAddress\":%d}\n", (int)current_leg_index, (int)record, (int)size, (int)(begin + (record - 1) * size));
}
void de405_diag_evaluator(doublereal et, doublereal *record, integer ncof, doublereal *state) {
  event("evaluator_output", et);
  if (!sink) return;
  fprintf(sink, ",\"legIndex\":%d,\"evaluatorType\":2,\"coefficientCount\":%d,\"recordMidEtBits\":\"0x%016" PRIx64 "\",\"recordRadiusBits\":\"0x%016" PRIx64 "\",\"stateBits\":", (int)current_leg_index, (int)ncof, bits(record[1]), bits(record[2]));
  vec(sink, state, 6); fputs("}\n", sink);
}
static int compose(const char *operation, doublereal *left, doublereal *right, integer *n, doublereal *out, int subtract) {
  doublereal before[6]; memcpy(before, out, sizeof before);
  if (subtract) vsubg_(left, right, n, out); else vaddg_(left, right, n, out);
  if (sink) { event(operation, 0.0); fprintf(sink, ",\"legIndex\":%d,\"compositionOperation\":\"%s\",", (int)current_leg_index, subtract ? "subtract" : "add"); if (!subtract) { fputs("\"accumulatorBeforeBits\":", sink); vec(sink, before, 6); fputs(",", sink); } fputs("\"leftOperandBits\":", sink); vec(sink, left, 6); fputs(",\"rightOperandBits\":", sink); vec(sink, right, 6); fputs(",\"accumulatorAfterBits\":", sink); vec(sink, out, 6); fputs("}\n", sink); }
  return 0;
}
int de405_diag_vaddg_(doublereal *left, doublereal *right, integer *n, doublereal *out) { return compose("accumulator_add", left, right, n, out, 0); }
int de405_diag_vsubg_(doublereal *left, doublereal *right, integer *n, doublereal *out) { return compose("accumulator_subtract", left, right, n, out, 1); }
static int orientation(const char *operation) {
  if (sink) { event(operation, 0.0); fputs(",\"orientationEvidence\":\"observed_operation\"}\n", sink); }
  return 0;
}
int de405_diag_moved_(doublereal *in, integer *n, doublereal *out) { int result = moved_(in, n, out); orientation("orientation_copy"); return result; }
int de405_diag_mxv_(doublereal *matrix, doublereal *in, doublereal *out) { int result = mxv_(matrix, in, out); orientation("orientation_inertial_rotation"); return result; }
int de405_diag_mxvg_(doublereal *matrix, doublereal *in, integer *rows, integer *cols, doublereal *out) { int result = mxvg_(matrix, in, rows, cols, out); orientation("orientation_general_transform"); return result; }
