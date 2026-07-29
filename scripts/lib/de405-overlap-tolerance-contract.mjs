export const de405OverlapToleranceContract = {
  schemaVersion: 1,
  contractVersion: "candidate-1",
  toleranceStatus: "candidate",
  // A strict sweep over all planetary bodies requires a dual-bound candidate contract.
  // 1. A fixed absolute floor for near-zero or small coordinates.
  // 2. A floating ULP-aware floor to absorb IEEE-754 binary64 evaluator divergence
  //    that physically scales with distance (e.g. outer planets in J2000 barycentric coordinates).

  // 1.0e-9 km = 1.0e-6 m = 1 micrometer (not 1 nanometer).
  candidatePositionAbsoluteFloorKm: 1.0e-9,
  candidatePositionUlpMultiplier: 4,

  candidateVelocityAbsoluteFloorKmPerSec: 1.0e-14,
  candidateVelocityUlpMultiplier: 4,

  // These are scale-aware empirical candidate bounds, not a proof of the
  // maximum error of either Chebyshev evaluator.
  toleranceDescription: 'scale-aware empirical ULP candidate tolerance',

  // Evaluation Metrics
  primaryMetric: 'euclidean_vector_norm'
};
