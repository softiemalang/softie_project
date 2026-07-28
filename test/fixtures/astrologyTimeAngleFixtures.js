/**
 * astrologyTimeAngleFixtures.js
 *
 * Mallang Time & Angle Core v0 테스트 픽스처
 */

export const j2000InputFixture = {
  schemaVersion: 'astrology-time-angle-input-v0',
  calendar: 'proleptic_gregorian',
  candidateId: 'confirmed_j2000',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  utc: {
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0
  },
  location: {
    geographicLatitudeDegrees: 37.47722,
    longitudeDegreesEast: 126.86639
  },
  timeScaleOffsets: {
    ut1MinusUtcSeconds: 0,
    ttMinusUtcSeconds: 0,
    sourceStatus: 'fixture_supplied'
  }
}

export const unixEpochInputFixture = {
  schemaVersion: 'astrology-time-angle-input-v0',
  calendar: 'proleptic_gregorian',
  candidateId: 'unix_epoch',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  utc: {
    year: 1970,
    month: 1,
    day: 1,
    hour: 0,
    minute: 0,
    second: 0
  }
}

export const sample1997InputFixture = {
  schemaVersion: 'astrology-time-angle-input-v0',
  calendar: 'proleptic_gregorian',
  candidateId: 'sample_1997',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  utc: {
    year: 1997,
    month: 4,
    day: 21,
    hour: 5,
    minute: 40,
    second: 0
  },
  location: {
    geographicLatitudeDegrees: 37.47722,
    longitudeDegreesEast: 126.86639
  },
  timeScaleOffsets: {
    ut1MinusUtcSeconds: 0.1,
    ttMinusUtcSeconds: 62.184,
    sourceStatus: 'fixture_supplied'
  }
}

export const syntheticMissingDut1Fixture = {
  schemaVersion: 'astrology-time-angle-input-v0',
  calendar: 'proleptic_gregorian',
  candidateId: 'missing_dut1',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  utc: {
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0
  },
  timeScaleOffsets: {
    ttMinusUtcSeconds: 64.184,
    sourceStatus: 'fixture_supplied'
  }
}

export const syntheticMissingTtFixture = {
  schemaVersion: 'astrology-time-angle-input-v0',
  calendar: 'proleptic_gregorian',
  candidateId: 'missing_tt',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  utc: {
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0
  },
  timeScaleOffsets: {
    ut1MinusUtcSeconds: 0.2,
    sourceStatus: 'fixture_supplied'
  }
}

export const syntheticGeographicPoleFixture = {
  schemaVersion: 'astrology-time-angle-input-v0',
  calendar: 'proleptic_gregorian',
  candidateId: 'north_pole',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  utc: {
    year: 2026,
    month: 3,
    day: 20,
    hour: 12,
    minute: 0,
    second: 0
  },
  location: {
    geographicLatitudeDegrees: 90.0,
    longitudeDegreesEast: 0.0
  },
  timeScaleOffsets: {
    ut1MinusUtcSeconds: 0.0,
    ttMinusUtcSeconds: 69.184,
    sourceStatus: 'fixture_supplied'
  }
}

export const syntheticLongitudeWrapFixture = {
  schemaVersion: 'astrology-time-angle-input-v0',
  calendar: 'proleptic_gregorian',
  candidateId: 'wrap_test',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  utc: {
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    second: 0
  },
  locationEast: {
    geographicLatitudeDegrees: 35.0,
    longitudeDegreesEast: 180.0
  },
  locationWest: {
    geographicLatitudeDegrees: 35.0,
    longitudeDegreesEast: -180.0
  },
  timeScaleOffsets: {
    ut1MinusUtcSeconds: 0.0,
    ttMinusUtcSeconds: 0.0,
    sourceStatus: 'fixture_supplied'
  }
}
