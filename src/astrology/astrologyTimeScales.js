/**
 * astrologyTimeScales.js
 *
 * Julian Date UT1, Julian Date TT 및 ΔT 계산 모듈
 * Rule Set: mallang-time-angle-core-v0
 */

import { SECONDS_PER_DAY, TIME_ANGLE_RULE_SET_VERSION } from './astrologyCalendarTime.js'

/**
 * 명시적으로 공급된 DUT1과 TT-UTC offset을 사용하여 JD UT1, JD TT, ΔT를 계산합니다.
 * offset이 명시되지 않은 경우 절대 암묵적으로 0을 대입하지 않습니다.
 *
 * @param {object} calendarResult
 * @param {object} [timeScaleOffsets]
 * @returns {object}
 */
export function deriveTimeScales(calendarResult, timeScaleOffsets) {
  const isCalendarAvailable = calendarResult && calendarResult.availability === 'available'
  const jdUtc = isCalendarAvailable ? calendarResult.julianDateUtc : null

  const ut1Offset = timeScaleOffsets && typeof timeScaleOffsets.ut1MinusUtcSeconds === 'number' && Number.isFinite(timeScaleOffsets.ut1MinusUtcSeconds)
    ? timeScaleOffsets.ut1MinusUtcSeconds
    : null

  const ttOffset = timeScaleOffsets && typeof timeScaleOffsets.ttMinusUtcSeconds === 'number' && Number.isFinite(timeScaleOffsets.ttMinusUtcSeconds)
    ? timeScaleOffsets.ttMinusUtcSeconds
    : null

  // Julian Date UT1
  let julianDateUt1
  if (!isCalendarAvailable) {
    julianDateUt1 = {
      availability: 'blocked',
      reason: 'julian_date_utc_unavailable',
      value: null,
      epistemicStatus: 'derived',
      ruleId: 'julian_date_ut1_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['calendar.julianDateUtc']
    }
  } else if (ut1Offset === null) {
    julianDateUt1 = {
      availability: 'blocked',
      reason: 'ut1_minus_utc_unavailable',
      value: null,
      epistemicStatus: 'derived',
      ruleId: 'julian_date_ut1_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.timeScaleOffsets.ut1MinusUtcSeconds']
    }
  } else {
    julianDateUt1 = {
      availability: 'available',
      value: jdUtc + (ut1Offset / SECONDS_PER_DAY),
      epistemicStatus: 'derived',
      ruleId: 'julian_date_ut1_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['calendar.julianDateUtc', 'input.timeScaleOffsets.ut1MinusUtcSeconds']
    }
  }

  // Julian Date TT
  let julianDateTt
  if (!isCalendarAvailable) {
    julianDateTt = {
      availability: 'blocked',
      reason: 'julian_date_utc_unavailable',
      value: null,
      epistemicStatus: 'derived',
      ruleId: 'julian_date_tt_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['calendar.julianDateUtc']
    }
  } else if (ttOffset === null) {
    julianDateTt = {
      availability: 'blocked',
      reason: 'tt_minus_utc_unavailable',
      value: null,
      epistemicStatus: 'derived',
      ruleId: 'julian_date_tt_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.timeScaleOffsets.ttMinusUtcSeconds']
    }
  } else {
    julianDateTt = {
      availability: 'available',
      value: jdUtc + (ttOffset / SECONDS_PER_DAY),
      epistemicStatus: 'derived',
      ruleId: 'julian_date_tt_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['calendar.julianDateUtc', 'input.timeScaleOffsets.ttMinusUtcSeconds']
    }
  }

  // Delta T (TT - UT1)
  let deltaTSeconds
  if (ut1Offset === null || ttOffset === null) {
    deltaTSeconds = {
      availability: 'blocked',
      reason: 'time_scale_offset_incomplete',
      value: null,
      epistemicStatus: 'derived',
      ruleId: 'delta_t_seconds_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.timeScaleOffsets.ttMinusUtcSeconds', 'input.timeScaleOffsets.ut1MinusUtcSeconds']
    }
  } else {
    deltaTSeconds = {
      availability: 'available',
      value: ttOffset - ut1Offset,
      epistemicStatus: 'derived',
      ruleId: 'delta_t_seconds_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.timeScaleOffsets.ttMinusUtcSeconds', 'input.timeScaleOffsets.ut1MinusUtcSeconds']
    }
  }

  return {
    julianDateUt1,
    julianDateTt,
    deltaTSeconds
  }
}
