/**
 * astrologyEarthOrientation.js
 *
 * IAU 2000 Earth Rotation Angle, IAU 2006 평균 황도경사, IAU 2006 GMST, LMST 계산 모듈
 * Rule Set: mallang-time-angle-core-v0
 */

import { normalizeDegrees360 } from './astrologyAngles.js'
import {
  DAYS_PER_JULIAN_CENTURY,
  ERA_ORIGIN_TURNS,
  ERA_RATE_TURNS_PER_UT1_DAY,
  J2000_JULIAN_DATE,
  TIME_ANGLE_RULE_SET_VERSION
} from './astrologyCalendarTime.js'

/**
 * 실수의 소수점 부분을 계산합니다.
 * JavaScript의 % 연산자와 달리, 음수에서도 결과가 항상 [0, 1) 범위에 위치합니다.
 * fractionalPart(x) = x - floor(x)
 *
 * @param {number} x
 * @returns {number}
 */
export function fractionalPart(x) {
  return x - Math.floor(x)
}

/**
 * IAU 2000 Earth Rotation Angle (ERA)을 계산합니다.
 * 입력: JD UT1
 *
 * @param {object} julianDateUt1
 * @returns {object}
 */
export function deriveEarthRotationAngle(julianDateUt1) {
  if (!julianDateUt1 || julianDateUt1.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: julianDateUt1?.reason || 'julian_date_ut1_unavailable',
      degrees: null,
      turns: null,
      epistemicStatus: 'derived',
      ruleId: 'earth_rotation_angle_iau2000_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['timeScales.julianDateUt1']
    }
  }

  const dUT1 = julianDateUt1.value - J2000_JULIAN_DATE
  const dayFrac = fractionalPart(dUT1)
  const eraRawTurns = ERA_ORIGIN_TURNS + dayFrac + (0.00273781191135448 * dUT1)
  const eraTurns = fractionalPart(eraRawTurns)
  const degrees = normalizeDegrees360(eraTurns * 360)

  return {
    availability: 'available',
    degrees,
    turns: eraTurns,
    epistemicStatus: 'derived',
    ruleId: 'earth_rotation_angle_iau2000_v0',
    ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
    sourceRefs: ['timeScales.julianDateUt1']
  }
}

/**
 * IAU 2006 평균 황도경사 (Mean Obliquity of the Ecliptic)를 계산합니다.
 * 입력: JD TT
 *
 * @param {object} julianDateTt
 * @returns {object}
 */
export function deriveMeanObliquity(julianDateTt) {
  if (!julianDateTt || julianDateTt.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: julianDateTt?.reason || 'julian_date_tt_unavailable',
      degrees: null,
      arcseconds: null,
      epistemicStatus: 'derived',
      ruleId: 'mean_obliquity_iau2006_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['timeScales.julianDateTt']
    }
  }

  const T = (julianDateTt.value - J2000_JULIAN_DATE) / DAYS_PER_JULIAN_CENTURY
  const epsilonArcseconds = 84381.406
    - (46.836769 * T)
    - (0.0001831 * Math.pow(T, 2))
    + (0.00200340 * Math.pow(T, 3))
    - (0.000000576 * Math.pow(T, 4))
    - (0.0000000434 * Math.pow(T, 5))

  const degrees = epsilonArcseconds / 3600

  return {
    availability: 'available',
    degrees,
    arcseconds: epsilonArcseconds,
    epistemicStatus: 'derived',
    ruleId: 'mean_obliquity_iau2006_v0',
    ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
    sourceRefs: ['timeScales.julianDateTt']
  }
}

/**
 * IAU 2006 Greenwich Mean Sidereal Time (GMST)을 계산합니다.
 * ERA는 UT1 기준, T 다항식은 TT 기준입니다.
 *
 * @param {object} eraResult
 * @param {object} julianDateTt
 * @returns {object}
 */
export function deriveGreenwichMeanSiderealTime(eraResult, julianDateTt) {
  if (!eraResult || eraResult.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: eraResult?.reason || 'earth_rotation_angle_unavailable',
      degrees: null,
      epistemicStatus: 'derived',
      ruleId: 'greenwich_mean_sidereal_time_iau2006_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthRotationAngle.degrees', 'timeScales.julianDateTt']
    }
  }

  if (!julianDateTt || julianDateTt.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: julianDateTt?.reason || 'julian_date_tt_unavailable',
      degrees: null,
      epistemicStatus: 'derived',
      ruleId: 'greenwich_mean_sidereal_time_iau2006_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthRotationAngle.degrees', 'timeScales.julianDateTt']
    }
  }

  const T = (julianDateTt.value - J2000_JULIAN_DATE) / DAYS_PER_JULIAN_CENTURY
  const gmstCorrectionArcseconds = 0.014506
    + (4612.156534 * T)
    + (1.3915817 * Math.pow(T, 2))
    - (0.00000044 * Math.pow(T, 3))
    - (0.000029956 * Math.pow(T, 4))
    - (0.0000000368 * Math.pow(T, 5))

  const degrees = normalizeDegrees360(eraResult.degrees + (gmstCorrectionArcseconds / 3600))

  return {
    availability: 'available',
    degrees,
    epistemicStatus: 'derived',
    ruleId: 'greenwich_mean_sidereal_time_iau2006_v0',
    ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
    sourceRefs: ['earthRotationAngle.degrees', 'timeScales.julianDateTt']
  }
}

/**
 * Local Mean Sidereal Time (LMST)을 계산합니다.
 * 동경 양수(+) 기준입니다. (+180°와 -180°는 동일한 자오선)
 *
 * @param {object} gmstResult
 * @param {object} [location]
 * @returns {object}
 */
export function deriveLocalMeanSiderealTime(gmstResult, location) {
  if (!gmstResult || gmstResult.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: gmstResult?.reason || 'greenwich_mean_sidereal_time_unavailable',
      degrees: null,
      epistemicStatus: 'derived',
      ruleId: 'local_mean_sidereal_time_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthOrientation.greenwichMeanSiderealTimeDegrees', 'input.location.longitudeDegreesEast']
    }
  }

  if (!location || typeof location.longitudeDegreesEast !== 'number' || !Number.isFinite(location.longitudeDegreesEast)) {
    return {
      availability: 'blocked',
      reason: 'longitude_unavailable',
      degrees: null,
      epistemicStatus: 'derived',
      ruleId: 'local_mean_sidereal_time_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthOrientation.greenwichMeanSiderealTimeDegrees', 'input.location.longitudeDegreesEast']
    }
  }

  const lon = location.longitudeDegreesEast
  if (lon < -180 || lon > 180) {
    return {
      availability: 'blocked',
      reason: 'longitude_outside_valid_range',
      degrees: null,
      epistemicStatus: 'derived',
      ruleId: 'local_mean_sidereal_time_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.location.longitudeDegreesEast']
    }
  }

  const degrees = normalizeDegrees360(gmstResult.degrees + lon)

  return {
    availability: 'available',
    degrees,
    epistemicStatus: 'derived',
    ruleId: 'local_mean_sidereal_time_v0',
    ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
    sourceRefs: ['earthOrientation.greenwichMeanSiderealTimeDegrees', 'input.location.longitudeDegreesEast']
  }
}
