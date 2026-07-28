/**
 * astrologyChartAngles.js
 *
 * 평균 MC (Midheaven) 및 평균 ASC (Ascendant) 계산 모듈
 * Rule Set: mallang-time-angle-core-v0
 */

import { normalizeDegrees360 } from './astrologyAngles.js'
import { GEOGRAPHIC_POLE_EPSILON_DEGREES, TIME_ANGLE_RULE_SET_VERSION } from './astrologyCalendarTime.js'

/**
 * Local Mean Sidereal Time과 평균 황도경사를 이용해 평균 MC (Midheaven)를 계산합니다.
 * 위도는 MC 계산에 사용되지 않습니다 (극점에서도 계산 가능).
 * Math.atan2(y, x)를 사용하여 사분면 정보를 보존합니다.
 *
 * @param {object} lmstResult
 * @param {object} meanObliquityResult
 * @returns {object}
 */
export function deriveMidheaven(lmstResult, meanObliquityResult) {
  if (!lmstResult || lmstResult.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: lmstResult?.reason || 'local_mean_sidereal_time_unavailable',
      longitudeDegrees: null,
      epistemicStatus: 'derived',
      ruleId: 'mean_midheaven_from_lmst_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthOrientation.localMeanSiderealTimeDegrees', 'earthOrientation.meanObliquityDegrees']
    }
  }

  if (!meanObliquityResult || meanObliquityResult.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: meanObliquityResult?.reason || 'mean_obliquity_unavailable',
      longitudeDegrees: null,
      epistemicStatus: 'derived',
      ruleId: 'mean_midheaven_from_lmst_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthOrientation.localMeanSiderealTimeDegrees', 'earthOrientation.meanObliquityDegrees']
    }
  }

  const theta = lmstResult.degrees * (Math.PI / 180)
  const epsilon = meanObliquityResult.degrees * (Math.PI / 180)

  const mcRadians = Math.atan2(
    Math.sin(theta),
    Math.cos(theta) * Math.cos(epsilon)
  )

  const longitudeDegrees = normalizeDegrees360(mcRadians * (180 / Math.PI))

  return {
    availability: 'available',
    longitudeDegrees,
    epistemicStatus: 'derived',
    ruleId: 'mean_midheaven_from_lmst_v0',
    ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
    sourceRefs: ['earthOrientation.localMeanSiderealTimeDegrees', 'earthOrientation.meanObliquityDegrees']
  }
}

/**
 * Local Mean Sidereal Time, 평균 황도경사, 지리적 위도를 이용해 평균 ASC (Ascendant)를 계산합니다.
 * 동쪽 지평선 교점을 얻기 위해 계산된 기준 각도에 180°를 더합니다.
 * 지리적 북극/남극(|lat| >= 90 - 1e-10)에서는 ASC가 미정의되므로 blocked 처리합니다.
 *
 * @param {object} lmstResult
 * @param {object} meanObliquityResult
 * @param {object} [location]
 * @returns {object}
 */
export function deriveAscendant(lmstResult, meanObliquityResult, location) {
  if (!lmstResult || lmstResult.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: lmstResult?.reason || 'local_mean_sidereal_time_unavailable',
      longitudeDegrees: null,
      epistemicStatus: 'derived',
      ruleId: 'mean_ascendant_from_lmst_latitude_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthOrientation.localMeanSiderealTimeDegrees', 'earthOrientation.meanObliquityDegrees', 'input.location.geographicLatitudeDegrees']
    }
  }

  if (!meanObliquityResult || meanObliquityResult.availability !== 'available') {
    return {
      availability: 'blocked',
      reason: meanObliquityResult?.reason || 'mean_obliquity_unavailable',
      longitudeDegrees: null,
      epistemicStatus: 'derived',
      ruleId: 'mean_ascendant_from_lmst_latitude_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthOrientation.localMeanSiderealTimeDegrees', 'earthOrientation.meanObliquityDegrees', 'input.location.geographicLatitudeDegrees']
    }
  }

  if (!location || typeof location.geographicLatitudeDegrees !== 'number' || !Number.isFinite(location.geographicLatitudeDegrees)) {
    return {
      availability: 'blocked',
      reason: 'latitude_unavailable',
      longitudeDegrees: null,
      epistemicStatus: 'derived',
      ruleId: 'mean_ascendant_from_lmst_latitude_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthOrientation.localMeanSiderealTimeDegrees', 'earthOrientation.meanObliquityDegrees', 'input.location.geographicLatitudeDegrees']
    }
  }

  const lat = location.geographicLatitudeDegrees
  if (lat < -90 || lat > 90) {
    return {
      availability: 'blocked',
      reason: 'latitude_outside_valid_range',
      longitudeDegrees: null,
      epistemicStatus: 'derived',
      ruleId: 'mean_ascendant_from_lmst_latitude_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.location.geographicLatitudeDegrees']
    }
  }

  // Geographic pole check (abs(lat) >= 90 - EPSILON)
  if (90 - Math.abs(lat) <= GEOGRAPHIC_POLE_EPSILON_DEGREES) {
    return {
      availability: 'blocked',
      reason: 'ascendant_undefined_at_geographic_pole',
      fallbackApplied: false,
      longitudeDegrees: null,
      epistemicStatus: 'derived',
      ruleId: 'mean_ascendant_from_lmst_latitude_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['earthOrientation.localMeanSiderealTimeDegrees', 'earthOrientation.meanObliquityDegrees', 'input.location.geographicLatitudeDegrees']
    }
  }

  const theta = lmstResult.degrees * (Math.PI / 180)
  const epsilon = meanObliquityResult.degrees * (Math.PI / 180)
  const phi = lat * (Math.PI / 180)

  const ascBaseRadians = Math.atan2(
    -Math.cos(theta),
    Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon)
  )

  const longitudeDegrees = normalizeDegrees360((ascBaseRadians * (180 / Math.PI)) + 180)

  return {
    availability: 'available',
    longitudeDegrees,
    epistemicStatus: 'derived',
    ruleId: 'mean_ascendant_from_lmst_latitude_v0',
    ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
    sourceRefs: ['earthOrientation.localMeanSiderealTimeDegrees', 'earthOrientation.meanObliquityDegrees', 'input.location.geographicLatitudeDegrees']
  }
}
