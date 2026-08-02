// Expected values were materialized from the installed IAU SOFA/ERFA
// pmat06 + obl06 implementation during validation. No SOFA/ERFA code is
// copied into the repository and it is not a runtime dependency.
export const EPHEMERIS_TRANSFORM_ORACLE_FIXTURES = [
  { fixtureId: 'sofa_pmat06_j2000', jdTt: 2451545.0, expectedLongitude: 71.72580453601428, expectedSpeed: -2.701912036758166e-11 },
  { fixtureId: 'sofa_pmat06_unix_epoch', jdTt: 2440587.5, expectedLongitude: 71.307315516725, expectedSpeed: 0 },
  { fixtureId: 'sofa_pmat06_future', jdTt: 2462502.5, expectedLongitude: 72.14435486537295, expectedSpeed: 0 },
]

export const DE405_SUN_ORACLE_FIXTURE = {
  fixtureId: 'de405_j2000_sun_geometric_mean_ecliptic_date',
  jdTt: 2451545.0007428704,
  state: [26499034.228862327, -132757417.66468561, -57556717.447906621, 29.794260048366745, 5.0180524604150447, 2.1753937286070539],
  expectedLongitude: 280.3778249002279,
  expectedSpeed: 1.0193938157083333,
  toleranceDegrees: 1e-9,
  toleranceSpeed: 1e-12,
}
