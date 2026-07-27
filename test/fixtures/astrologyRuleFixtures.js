/**
 * astrologyRuleFixtures.js
 *
 * Mallang Astrology Rule Core v0 테스트용 합성(Synthetic) 피처 데이터 모듈
 * 외부 점성학 서비스/출처의 실제 천체 위치를 복사하지 않고 오직 수학적 계산 검증용 합성 수치만 사용합니다.
 */

export const synthetic_astrology_rule_fixture_001 = {
  schemaVersion: 'astrology-raw-chart-v0',
  zodiac: 'tropical',
  referenceFrame: 'geocentric',
  coordinateBasis: 'ecliptic-of-date',
  candidateId: 'synthetic_001',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  bodies: [
    {
      id: 'sun',
      longitudeDegrees: 31.1542, // Taurus 1.1542°
      longitudeSpeedDegreesPerDay: 0.9731, // direct
    },
    {
      id: 'moon',
      longitudeDegrees: 192.6504, // Libra 12.6504°
      longitudeSpeedDegreesPerDay: 13.427, // direct
    },
    {
      id: 'mercury',
      longitudeDegrees: 45.0, // Taurus 15.0°
      longitudeSpeedDegreesPerDay: -0.42, // retrograde
    },
    {
      id: 'venus',
      longitudeDegrees: 15.0, // Aries 15.0°
      longitudeSpeedDegreesPerDay: 1.15, // direct
    },
    {
      id: 'mars',
      longitudeDegrees: 211.1542, // Scorpio 1.1542°
      longitudeSpeedDegreesPerDay: 0.55, // direct
    },
    {
      id: 'jupiter',
      longitudeDegrees: 120.0, // Leo 0.0°
      longitudeSpeedDegreesPerDay: 0.00000005, // stationary (abs <= epsilon)
    },
    {
      id: 'saturn',
      longitudeDegrees: 270.0, // Capricorn 0.0°
      longitudeSpeedDegreesPerDay: 0.05, // direct
    },
    {
      id: 'uranus',
      longitudeDegrees: 60.0, // Gemini 0.0°
      longitudeSpeedDegreesPerDay: 0.02, // direct
    },
    {
      id: 'neptune',
      longitudeDegrees: 330.0, // Pisces 0.0°
      longitudeSpeedDegreesPerDay: -0.01, // retrograde
    },
    {
      id: 'pluto',
      longitudeDegrees: 300.0, // Aquarius 0.0°
      longitudeSpeedDegreesPerDay: 0.001, // direct
    },
  ],
  angles: {
    ascendant: {
      longitudeDegrees: 156.5167, // Virgo 6.5167°
    },
    midheaven: {
      longitudeDegrees: 63.2333, // Gemini 3.2333°
    },
  },
}

export const synthetic_sign_boundary_fixture = {
  schemaVersion: 'astrology-raw-chart-v0',
  zodiac: 'tropical',
  referenceFrame: 'geocentric',
  coordinateBasis: 'ecliptic-of-date',
  candidateId: 'synthetic_boundary',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  bodies: [
    {
      id: 'sun',
      longitudeDegrees: 29.999999, // Aries, near boundary
      longitudeSpeedDegreesPerDay: 1.0,
    },
    {
      id: 'moon',
      longitudeDegrees: 30.0, // Taurus 0°
      longitudeSpeedDegreesPerDay: 13.0,
    },
    {
      id: 'mercury',
      longitudeDegrees: 59.999999, // Taurus, near boundary
      longitudeSpeedDegreesPerDay: 1.0,
    },
    {
      id: 'venus',
      longitudeDegrees: 359.999999, // Pisces, near boundary
      longitudeSpeedDegreesPerDay: 1.0,
    },
    {
      id: 'mars',
      longitudeDegrees: 360.0, // Aries 0° (normalized 0)
      longitudeSpeedDegreesPerDay: 0.5,
    },
  ],
  angles: {
    ascendant: {
      longitudeDegrees: 0.0, // Aries 0°
    },
  },
}

export const synthetic_aspect_phase_fixture = {
  schemaVersion: 'astrology-raw-chart-v0',
  zodiac: 'tropical',
  referenceFrame: 'geocentric',
  coordinateBasis: 'ecliptic-of-date',
  candidateId: 'synthetic_aspect_phase',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  bodies: [
    {
      id: 'sun',
      longitudeDegrees: 10.0,
      longitudeSpeedDegreesPerDay: 1.0,
    },
    {
      id: 'moon',
      longitudeDegrees: 68.0, // delta = 58° (sextile 60°), target = +60, signedOffset = -2°
      longitudeSpeedDegreesPerDay: 0.5, // relativeSpeed = 0.5 - 1.0 = -0.5 °/day -> separating
    },
    {
      id: 'mercury',
      longitudeDegrees: 68.0,
      longitudeSpeedDegreesPerDay: 1.5, // relativeSpeed = 1.5 - 1.0 = +0.5 °/day -> applying
    },
    {
      id: 'venus',
      longitudeDegrees: 70.0, // delta = 60° (exact sextile)
      longitudeSpeedDegreesPerDay: 1.0, // exact
    },
    {
      id: 'mars',
      longitudeDegrees: 68.0,
      longitudeSpeedDegreesPerDay: 1.0, // relativeSpeed = 0 -> indeterminate
    },
  ],
  angles: {
    ascendant: {
      longitudeDegrees: 10.0,
    },
  },
}

export const synthetic_missing_ascendant_fixture = {
  schemaVersion: 'astrology-raw-chart-v0',
  zodiac: 'tropical',
  referenceFrame: 'geocentric',
  coordinateBasis: 'ecliptic-of-date',
  candidateId: 'synthetic_no_asc',
  inputStatus: 'needs_verification',
  verificationStatus: 'needs_verification',
  bodies: [
    {
      id: 'sun',
      longitudeDegrees: 31.1542,
      longitudeSpeedDegreesPerDay: 0.9731,
    },
  ],
  angles: {},
}

export const synthetic_unsupported_body_fixture = {
  schemaVersion: 'astrology-raw-chart-v0',
  zodiac: 'tropical',
  referenceFrame: 'geocentric',
  coordinateBasis: 'ecliptic-of-date',
  candidateId: 'synthetic_unsupported',
  inputStatus: 'confirmed',
  verificationStatus: 'confirmed',
  bodies: [
    {
      id: 'sun',
      longitudeDegrees: 31.1542,
      longitudeSpeedDegreesPerDay: 0.9731,
    },
    {
      id: 'chiron',
      longitudeDegrees: 55.4,
      longitudeSpeedDegreesPerDay: 0.05,
    },
    {
      id: 'true_node',
      longitudeDegrees: 120.0,
      longitudeSpeedDegreesPerDay: -0.05,
    },
  ],
  angles: {
    ascendant: {
      longitudeDegrees: 156.5167,
    },
  },
}
