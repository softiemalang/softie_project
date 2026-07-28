/**
 * astrologyTimeAngleExternalFixtures.js
 *
 * Mallang Time & Angle Core v0 독립 외부 오라클 검증용 Golden Fixture 및 Provenance 정보
 *
 * Oracles:
 * 1. IAU SOFA (ANSI C 2023-10-11)
 * 2. Swiss Ephemeris (v2.10.03)
 * 3. USNO Data Service (v4.0.1, Non-gating Sanity Check)
 */

export const ORACLE_PROVENANCE = {
  sofa: {
    oracleName: 'IAU SOFA',
    officialDomain: 'iausofa.org',
    releaseDate: '2023-10-11',
    languageVariant: 'ANSI C',
    downloadArtifactName: 'sofa_c-20231011tar.gz',
    downloadedAtUtc: '2026-07-28T00:15:48Z',
    artifactChecksumSha256: 'd9c10833cae8b4d9361a0ffda31ec361fd1262362025bec4d4e51a880150ace2',
    publicFunctionsUsed: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06'],
    temporaryLocation: '/tmp/mallang-time-angle-validation/sofa',
    committedArtifact: false,
    runtimeDependency: false
  },
  swissEphemeris: {
    oracleName: 'Swiss Ephemeris',
    documentationSource: 'Astrodienst Swiss Ephemeris documentation',
    documentationDomain: 'astro.com',
    artifactSource: 'GitHub tag archive',
    artifactDomain: 'github.com',
    artifactRepository: 'aloistr/swisseph',
    artifactVersion: 'v2.10.03',
    downloadArtifactName: 'swisseph-2.10.03.tar.gz',
    downloadedAtUtc: '2026-07-28T00:16:38Z',
    artifactChecksumSha256: '8c166796767a560691581575b6eb4b4383d849e542b16647dca2e0b127fb70b0',
    artifactAuthorityStatus: 'official_distribution_link_confirmed',
    publicFunctionUsed: 'swe_houses_armc',
    houseSystemArgument: 'W',
    temporaryLocation: '/tmp/mallang-time-angle-validation/swisseph',
    committedArtifact: false,
    runtimeDependency: false
  },
  usno: {
    serviceName: 'U.S. Naval Observatory Data Service',
    officialDomain: 'aa.usno.navy.mil',
    retrievedAtUtc: '2026-07-28T00:20:52Z',
    serviceType: 'REST API v4.0.1 (juliandate, siderealtime)',
    comparisonRole: 'non_gating_sanity_check'
  }
}

export const SOFA_TIME_ANGLE_FIXTURES = [
  {
    fixtureId: 'sofa_1900_start',
    validationScope: 'declared_mean_model',
    oracle: {
      name: 'IAU SOFA',
      release: '2023-10-11',
      functions: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06']
    },
    input: {
      utc: { year: 1900, month: 1, day: 1, hour: 0, minute: 0, second: 0.0 },
      timeScaleOffsets: { ut1MinusUtcSeconds: 0.0, ttMinusUtcSeconds: 32.184, sourceStatus: 'synthetic_validation_fixture' }
    },
    expected: {
      julianDateUtc: 2415020.5,
      julianDateUt1: 2415020.5,
      julianDateTt: 2415020.5003725,
      deltaTSeconds: 32.184,
      earthRotationAngleDegrees: 101.464602119030,
      meanObliquityDegrees: 23.45228887233797,
      greenwichMeanSiderealTimeDegrees: 100.183855638506
    },
    tolerances: {
      julianDateUtc: 1e-9,
      julianDateUt1: 1e-9,
      julianDateTt: 1e-9,
      earthRotationAngleDegrees: 1e-9,
      meanObliquityDegrees: 1e-10,
      greenwichMeanSiderealTimeDegrees: 1e-9
    }
  },
  {
    fixtureId: 'sofa_1950_mid',
    validationScope: 'declared_mean_model',
    oracle: {
      name: 'IAU SOFA',
      release: '2023-10-11',
      functions: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06']
    },
    input: {
      utc: { year: 1950, month: 6, day: 30, hour: 18, minute: 15, second: 30.5 },
      timeScaleOffsets: { ut1MinusUtcSeconds: 0.123456, ttMinusUtcSeconds: 32.184, sourceStatus: 'synthetic_validation_fixture' }
    },
    expected: {
      julianDateUtc: 2433463.2607696760,
      julianDateUt1: 2433463.2607711051,
      julianDateTt: 2433463.2611421761,
      deltaTSeconds: 32.060544,
      earthRotationAngleDegrees: 192.753842204095,
      meanObliquityDegrees: 23.44572008409718,
      greenwichMeanSiderealTimeDegrees: 192.119704066823
    },
    tolerances: {
      julianDateUtc: 1e-9,
      julianDateUt1: 1e-9,
      julianDateTt: 1e-9,
      earthRotationAngleDegrees: 1e-9,
      meanObliquityDegrees: 1e-10,
      greenwichMeanSiderealTimeDegrees: 1e-9
    }
  },
  {
    fixtureId: 'sofa_unix_epoch',
    validationScope: 'declared_mean_model',
    oracle: {
      name: 'IAU SOFA',
      release: '2023-10-11',
      functions: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06']
    },
    input: {
      utc: { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0.0 },
      timeScaleOffsets: { ut1MinusUtcSeconds: -0.25, ttMinusUtcSeconds: 42.184, sourceStatus: 'synthetic_validation_fixture' }
    },
    expected: {
      julianDateUtc: 2440587.5,
      julianDateUt1: 2440587.4999971064,
      julianDateTt: 2440587.5004882407,
      deltaTSeconds: 42.434,
      earthRotationAngleDegrees: 100.612927100111,
      meanObliquityDegrees: 23.44318248874960,
      greenwichMeanSiderealTimeDegrees: 100.228619558323
    },
    tolerances: {
      julianDateUtc: 1e-9,
      julianDateUt1: 1e-9,
      julianDateTt: 1e-9,
      earthRotationAngleDegrees: 1e-9,
      meanObliquityDegrees: 1e-10,
      greenwichMeanSiderealTimeDegrees: 1e-9
    }
  },
  {
    fixtureId: 'sofa_2000_j2000',
    validationScope: 'declared_mean_model',
    oracle: {
      name: 'IAU SOFA',
      release: '2023-10-11',
      functions: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06']
    },
    input: {
      utc: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0.0 },
      timeScaleOffsets: { ut1MinusUtcSeconds: 0.0, ttMinusUtcSeconds: 64.184, sourceStatus: 'synthetic_validation_fixture' }
    },
    expected: {
      julianDateUtc: 2451545.0,
      julianDateUt1: 2451545.0,
      julianDateTt: 2451545.0007428704,
      deltaTSeconds: 64.184,
      earthRotationAngleDegrees: 280.460618375040,
      meanObliquityDegrees: 23.43927944417984,
      greenwichMeanSiderealTimeDegrees: 280.460622430541
    },
    tolerances: {
      julianDateUtc: 1e-9,
      julianDateUt1: 1e-9,
      julianDateTt: 1e-9,
      earthRotationAngleDegrees: 1e-9,
      meanObliquityDegrees: 1e-10,
      greenwichMeanSiderealTimeDegrees: 1e-9
    }
  },
  {
    fixtureId: 'sofa_2024_leap_feb29',
    validationScope: 'declared_mean_model',
    oracle: {
      name: 'IAU SOFA',
      release: '2023-10-11',
      functions: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06']
    },
    input: {
      utc: { year: 2024, month: 2, day: 29, hour: 23, minute: 59, second: 59.25 },
      timeScaleOffsets: { ut1MinusUtcSeconds: -0.0825, ttMinusUtcSeconds: 69.184, sourceStatus: 'synthetic_validation_fixture' }
    },
    expected: {
      julianDateUtc: 2460370.4999913196,
      julianDateUt1: 2460370.4999903645,
      julianDateTt: 2460370.5007920605,
      deltaTSeconds: 69.2665,
      earthRotationAngleDegrees: 158.978388628628,
      meanObliquityDegrees: 23.43613580386234,
      greenwichMeanSiderealTimeDegrees: 159.287979384699
    },
    tolerances: {
      julianDateUtc: 1e-9,
      julianDateUt1: 1e-9,
      julianDateTt: 1e-9,
      earthRotationAngleDegrees: 1e-9,
      meanObliquityDegrees: 1e-10,
      greenwichMeanSiderealTimeDegrees: 1e-9
    }
  },
  {
    fixtureId: 'sofa_2038_y2k38',
    validationScope: 'declared_mean_model',
    oracle: {
      name: 'IAU SOFA',
      release: '2023-10-11',
      functions: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06']
    },
    input: {
      utc: { year: 2038, month: 1, day: 19, hour: 3, minute: 14, second: 7.5 },
      timeScaleOffsets: { ut1MinusUtcSeconds: 0.375, ttMinusUtcSeconds: 70.0, sourceStatus: 'synthetic_validation_fixture' }
    },
    expected: {
      julianDateUtc: 2465442.6348090279,
      julianDateUt1: 2465442.6348133683,
      julianDateTt: 2465442.6356192129,
      deltaTSeconds: 69.625,
      earthRotationAngleDegrees: 166.673078380422,
      meanObliquityDegrees: 23.43432912664951,
      greenwichMeanSiderealTimeDegrees: 167.160613245606
    },
    tolerances: {
      julianDateUtc: 1e-9,
      julianDateUt1: 1e-9,
      julianDateTt: 1e-9,
      earthRotationAngleDegrees: 1e-9,
      meanObliquityDegrees: 1e-10,
      greenwichMeanSiderealTimeDegrees: 1e-9
    }
  },
  {
    fixtureId: 'sofa_2049_mid_century',
    validationScope: 'declared_mean_model',
    oracle: {
      name: 'IAU SOFA',
      release: '2023-10-11',
      functions: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06']
    },
    input: {
      utc: { year: 2049, month: 12, day: 31, hour: 12, minute: 34, second: 56.75 },
      timeScaleOffsets: { ut1MinusUtcSeconds: -0.45, ttMinusUtcSeconds: 75.1234, sourceStatus: 'synthetic_validation_fixture' }
    },
    expected: {
      julianDateUtc: 2469807.0242679399,
      julianDateUt1: 2469807.0242627314,
      julianDateTt: 2469807.0251374235,
      deltaTSeconds: 75.5734,
      earthRotationAngleDegrees: 288.470720391773,
      meanObliquityDegrees: 23.43277456361713,
      greenwichMeanSiderealTimeDegrees: 289.111381693336
    },
    tolerances: {
      julianDateUtc: 1e-9,
      julianDateUt1: 1e-9,
      julianDateTt: 1e-9,
      earthRotationAngleDegrees: 1e-9,
      meanObliquityDegrees: 1e-10,
      greenwichMeanSiderealTimeDegrees: 1e-9
    }
  },
  {
    fixtureId: 'sofa_2100_boundary',
    validationScope: 'declared_mean_model',
    oracle: {
      name: 'IAU SOFA',
      release: '2023-10-11',
      functions: ['iauCal2jd', 'iauEra00', 'iauObl06', 'iauGmst06']
    },
    input: {
      utc: { year: 2100, month: 12, day: 31, hour: 23, minute: 59, second: 59.5 },
      timeScaleOffsets: { ut1MinusUtcSeconds: 0.15, ttMinusUtcSeconds: 80.5, sourceStatus: 'synthetic_validation_fixture' }
    },
    expected: {
      julianDateUtc: 2488434.4999942128,
      julianDateUt1: 2488434.4999959487,
      julianDateTt: 2488434.5009259256,
      deltaTSeconds: 80.35,
      earthRotationAngleDegrees: 99.203657338914,
      meanObliquityDegrees: 23.42613991678470,
      greenwichMeanSiderealTimeDegrees: 100.497995527794
    },
    tolerances: {
      julianDateUtc: 1e-9,
      julianDateUt1: 1e-9,
      julianDateTt: 1e-9,
      earthRotationAngleDegrees: 1e-9,
      meanObliquityDegrees: 1e-10,
      greenwichMeanSiderealTimeDegrees: 1e-9
    }
  }
]

export const LMST_LONGITUDE_FIXTURES = [
  { longitudeDegreesEast: 0.0 },
  { longitudeDegreesEast: 126.978 },
  { longitudeDegreesEast: -74.006 },
  { longitudeDegreesEast: 151.2093 },
  { longitudeDegreesEast: -21.9426 },
  { longitudeDegreesEast: 180.0 },
  { longitudeDegreesEast: -180.0 },
  { longitudeDegreesEast: 179.9999 }
]

export const SWISS_ANGLE_FIXTURES = [
  {
    fixtureId: 'swiss_armc_0_lat_0',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 0.0, geographicLatitudeDegrees: 0.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 90.0, midheavenDegrees: 0.0 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_90_lat_0',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 90.0, geographicLatitudeDegrees: 0.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 180.0, midheavenDegrees: 90.0 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_180_lat_0',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 180.0, geographicLatitudeDegrees: 0.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 270.0, midheavenDegrees: 180.0 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_270_lat_0',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 270.0, geographicLatitudeDegrees: 0.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 0.0000000001, midheavenDegrees: 270.0 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_37_lat_pos37_5',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 37.0, geographicLatitudeDegrees: 37.5, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 137.031608544134, midheavenDegrees: 39.397230091087 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_123_lat_neg33_9',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 123.0, geographicLatitudeDegrees: -33.9, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 227.323201685815, midheavenDegrees: 120.787325993509 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_281_lat_pos51_5',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 281.0, geographicLatitudeDegrees: 51.5, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 25.471543567658, midheavenDegrees: 280.111846709865 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_359_999_lat_neg60',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 359.999, geographicLatitudeDegrees: -60.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 55.433704748089, midheavenDegrees: 359.998910060531 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_12_345_lat_pos66',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 12.345, geographicLatitudeDegrees: 66.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 138.121676117137, midheavenDegrees: 13.416726221959 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_215_75_lat_neg45',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 215.75, geographicLatitudeDegrees: -45.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 319.006275094023, midheavenDegrees: 218.119296182458 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_89_5_lat_pos80',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 89.5, geographicLatitudeDegrees: 80.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 179.842440323515, midheavenDegrees: 89.541257085927 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  },
  {
    fixtureId: 'swiss_armc_300_25_lat_neg80',
    validationScope: 'declared_mean_model',
    oracle: { name: 'Swiss Ephemeris', version: '2.10.03', function: 'swe_houses_armc', houseSystemArgument: 'W' },
    input: { armcDegrees: 300.25, geographicLatitudeDegrees: -80.0, meanObliquityDegrees: 23.439279444444445 },
    expected: { ascendantDegrees: 9.383624072309, midheavenDegrees: 298.149443713288 },
    tolerances: { ascendantDegrees: 1e-7, midheavenDegrees: 1e-7 }
  }
]

export const USNO_SANITY_FIXTURES = [
  {
    fixtureId: 'usno_greenwich_2000',
    serviceName: 'U.S. Naval Observatory Sidereal Time Data Service',
    officialDomain: 'aa.usno.navy.mil',
    comparisonRole: 'non_gating_sanity_check',
    input: { utc: { year: 2000, month: 1, day: 1, hour: 12, minute: 0, second: 0 }, location: { geographicLatitudeDegrees: 51.4769, longitudeDegreesEast: 0.0 } },
    usnoOutput: { gmstHms: '18:41:50.5494', lmstHms: '18:41:50.5494', gmstDegrees: 280.4606225, lmstDegrees: 280.4606225, eqofeqArcsec: -0.8520 },
    modelCaveat: 'USNO website returns GMST/LMST in HH:MM:SS.SSSS. Equation of equinoxes (-0.8520") illustrates difference between mean and apparent sidereal time.'
  },
  {
    fixtureId: 'usno_east_seoul_2024',
    serviceName: 'U.S. Naval Observatory Sidereal Time Data Service',
    officialDomain: 'aa.usno.navy.mil',
    comparisonRole: 'non_gating_sanity_check',
    input: { utc: { year: 2024, month: 2, day: 29, hour: 23, minute: 59, second: 59 }, location: { geographicLatitudeDegrees: 37.5665, longitudeDegreesEast: 126.9780 } },
    usnoOutput: { gmstHms: '10:37:08.9471', lmstHms: '19:05:03.6671', gmstDegrees: 159.2872796, lmstDegrees: 286.2652796, eqofeqArcsec: -0.2747 },
    modelCaveat: 'USNO API evaluates time with its internal DeltaT provider rather than synthetic test offsets.'
  },
  {
    fixtureId: 'usno_west_ny_1970',
    serviceName: 'U.S. Naval Observatory Sidereal Time Data Service',
    officialDomain: 'aa.usno.navy.mil',
    comparisonRole: 'non_gating_sanity_check',
    input: { utc: { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0 }, location: { geographicLatitudeDegrees: 40.7128, longitudeDegreesEast: -74.0060 } },
    usnoOutput: { gmstHms: '06:40:55.1194', lmstHms: '01:44:53.6794', gmstDegrees: 100.2296642, lmstDegrees: 26.2236642, eqofeqArcsec: 0.2762 },
    modelCaveat: 'Non-gating check; differences stem from USNO historical TT-UT1 curve vs fixed synthetic test offsets.'
  }
]
