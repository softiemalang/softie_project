#include <math.h>

/* Compiled separately with the accepted official-trace flags. */
void de405_candidate_cheby(const double *coefficients, int degree, double midpoint, double radius, double et, double *position, double *velocity) {
  double s = (et - midpoint) / radius, s2 = s * 2.0;
  double w0 = 0.0, w1 = 0.0, w2 = 0.0, d0 = 0.0, d1 = 0.0, d2 = 0.0;
  for (int j = degree + 1; j > 1; j--) {
    w2 = w1; w1 = w0; w0 = coefficients[j - 1] + (s2 * w1 - w2);
    d2 = d1; d1 = d0; d0 = w1 * 2.0 + d1 * s2 - d2;
  }
  *position = coefficients[0] + (s * w0 - w1);
  *velocity = (w0 + s * d0 - d1) / radius;
}
