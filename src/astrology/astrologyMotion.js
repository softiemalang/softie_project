/**
 * astrologyMotion.js
 *
 * 황경 일일 속도(longitudeSpeedDegreesPerDay) 기반 운동 상태 판정 모듈
 * Rule Set: mallang-astrology-rule-core-v0
 */

import { isValidDegreeNumber } from './astrologyAngles.js'

export const MOTION_EPSILON_DEGREES_PER_DAY = 0.0000001

/**
 * 일일 속도로 운동 상태(direct, retrograde, stationary, unavailable)를 도출합니다.
 *
 * @param {number|null|undefined} speed
 * @returns {object} 운동 상태 정보
 */
export function deriveMotionState(speed) {
  if (!isValidDegreeNumber(speed)) {
    return {
      motionState: 'unavailable',
      retrograde: null,
      availability: 'unavailable',
      reason: 'speed_unavailable',
      sourceSpeedDegreesPerDay: null,
      ruleId: 'motion_from_longitude_speed_v0',
    }
  }

  if (speed > MOTION_EPSILON_DEGREES_PER_DAY) {
    return {
      motionState: 'direct',
      retrograde: false,
      availability: 'available',
      sourceSpeedDegreesPerDay: speed,
      ruleId: 'motion_from_longitude_speed_v0',
    }
  }

  if (speed < -MOTION_EPSILON_DEGREES_PER_DAY) {
    return {
      motionState: 'retrograde',
      retrograde: true,
      availability: 'available',
      sourceSpeedDegreesPerDay: speed,
      ruleId: 'motion_from_longitude_speed_v0',
    }
  }

  return {
    motionState: 'stationary',
    retrograde: false,
    availability: 'available',
    sourceSpeedDegreesPerDay: speed,
    ruleId: 'motion_from_longitude_speed_v0',
  }
}
