/**
 * astrologySigns.js
 *
 * 황도 12별자리 구간 판정 및 별자리 경계 감지 모듈
 * Rule Set: mallang-astrology-rule-core-v0
 */

import { normalizeDegrees360 } from './astrologyAngles.js'

export const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
]

export const SIGN_BOUNDARY_THRESHOLD_DEGREES = 1 / 60 // 1 arcminute = 0.016666666666666666...

/**
 * 황경(longitudeDegrees)으로 별자리 위치를 도출합니다.
 * 별자리 구간은 [start, end) 반열린 구간입니다.
 *
 * @param {number} longitudeDegrees
 * @returns {object} 별자리 위치 및 경계 정보
 */
export function deriveSignPlacement(longitudeDegrees) {
  const normDeg = normalizeDegrees360(longitudeDegrees)

  const signIndex = Math.floor(normDeg / 30) % 12
  const signId = ZODIAC_SIGNS[signIndex]
  const degreeInSign = normDeg % 30

  const distanceToNearestBoundaryDegrees = Math.min(degreeInSign, 30 - degreeInSign)
  const isNearBoundary = distanceToNearestBoundaryDegrees <= SIGN_BOUNDARY_THRESHOLD_DEGREES

  const boundaryInfo = isNearBoundary
    ? {
        boundaryStatus: 'near_sign_boundary',
        distanceToNearestBoundaryDegrees,
        thresholdDegrees: SIGN_BOUNDARY_THRESHOLD_DEGREES,
      }
    : {
        boundaryStatus: 'normal',
        distanceToNearestBoundaryDegrees,
        thresholdDegrees: SIGN_BOUNDARY_THRESHOLD_DEGREES,
      }

  return {
    signId,
    signIndex,
    degreeInSign,
    normalizedLongitudeDegrees: normDeg,
    ...boundaryInfo,
    epistemicStatus: 'derived',
    ruleId: 'sign_from_ecliptic_longitude_v0',
  }
}
