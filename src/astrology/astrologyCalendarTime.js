/**
 * astrologyCalendarTime.js
 *
 * Gregorian 달력 및 UTC 입력 검증, Julian Date UTC 계산 모듈
 * Rule Set: mallang-time-angle-core-v0
 */

export const SECONDS_PER_DAY = 86400
export const J2000_JULIAN_DATE = 2451545.0
export const DAYS_PER_JULIAN_CENTURY = 36525
export const ERA_ORIGIN_TURNS = 0.7790572732640
export const ERA_RATE_TURNS_PER_UT1_DAY = 1.00273781191135448
export const TIME_ANGLE_RULE_SET_VERSION = 'mallang-time-angle-core-v0'
export const ANGLE_MODEL_ID = 'iau2000-era__iau2006-gmst-mean-obliquity'
export const GEOGRAPHIC_POLE_EPSILON_DEGREES = 0.0000000001
export const V0_SUPPORTED_YEAR_MIN = 1900
export const V0_SUPPORTED_YEAR_MAX = 2100

/**
 * 주어진 연도가 proleptic Gregorian 기준 윤년인지 판정합니다.
 * @param {number} year
 * @returns {boolean}
 */
export function isLeapYear(year) {
  if (typeof year !== 'number' || !Number.isInteger(year)) {
    return false
  }
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

/**
 * 주어진 연/월의 말일(일수)을 반환합니다.
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  if (typeof month !== 'number' || !Number.isInteger(month) || month < 1 || month > 12) {
    return 0
  }
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30
  }
  return 31
}

/**
 * UTC 입력 객체의 유효성을 숫자로 직접 엄격히 검증합니다.
 * 문자열 변환, Date 객체 파싱, 자동 형변환을 절대 사용하지 않습니다.
 *
 * @param {object} utc
 * @returns {{ valid: boolean, availability?: string, reason?: string }}
 */
export function validateUtcInput(utc) {
  if (!utc || typeof utc !== 'object' || Array.isArray(utc)) {
    return { valid: false, availability: 'invalid', reason: 'utc_input_not_object' }
  }

  const { year, month, day, hour, minute, second } = utc

  if (typeof year !== 'number' || !Number.isInteger(year)) {
    return { valid: false, availability: 'invalid', reason: 'invalid_year' }
  }
  if (typeof month !== 'number' || !Number.isInteger(month) || month < 1 || month > 12) {
    return { valid: false, availability: 'invalid', reason: 'invalid_month' }
  }
  const maxDays = getDaysInMonth(year, month)
  if (typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > maxDays) {
    return { valid: false, availability: 'invalid', reason: 'invalid_day' }
  }
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23) {
    return { valid: false, availability: 'invalid', reason: 'invalid_hour' }
  }
  if (typeof minute !== 'number' || !Number.isInteger(minute) || minute < 0 || minute > 59) {
    return { valid: false, availability: 'invalid', reason: 'invalid_minute' }
  }
  if (typeof second !== 'number' || !Number.isFinite(second) || second < 0) {
    return { valid: false, availability: 'invalid', reason: 'invalid_second' }
  }
  if (second >= 60) {
    // second = 60 (leap second representation) is unsupported in v0
    return { valid: false, availability: 'unsupported', reason: 'leap_second_unsupported' }
  }

  // v0 range restriction: 1900-01-01 00:00:00 through 2100-12-31 23:59:59.999
  if (year < V0_SUPPORTED_YEAR_MIN || year > V0_SUPPORTED_YEAR_MAX) {
    return { valid: false, availability: 'unsupported', reason: 'date_outside_v0_range' }
  }

  return { valid: true }
}

/**
 * proleptic Gregorian 날짜를 정수 기반 공식으로 Julian Date UTC로 변환합니다.
 *
 * @param {{ year: number, month: number, day: number, hour: number, minute: number, second: number }} utc
 * @returns {number} Julian Date UTC
 */
export function computeJulianDateUtc(utc) {
  const Y = utc.year
  const M = utc.month
  const D = utc.day
  const hour = utc.hour
  const minute = utc.minute
  const second = utc.second

  const a = Math.floor((14 - M) / 12)
  const y = Y + 4800 - a
  const m = M + 12 * a - 3

  const JDN = D + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  const secondsOfDay = hour * 3600 + minute * 60 + second

  return JDN - 0.5 + (secondsOfDay / SECONDS_PER_DAY)
}

/**
 * UTC 입력으로부터 Calendar computation 결과 및 근거 객체를 생성합니다.
 *
 * @param {object} input
 * @returns {object}
 */
export function deriveCalendarTime(input) {
  if (!input || typeof input !== 'object') {
    return {
      availability: 'invalid',
      reason: 'input_not_object',
      julianDateUtc: null,
      epistemicStatus: 'derived',
      ruleId: 'julian_date_utc_proleptic_gregorian_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input']
    }
  }

  if (input.schemaVersion !== 'astrology-time-angle-input-v0') {
    return {
      availability: 'unsupported',
      reason: 'unsupported_schema_version',
      julianDateUtc: null,
      epistemicStatus: 'derived',
      ruleId: 'julian_date_utc_proleptic_gregorian_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.schemaVersion']
    }
  }

  if (input.calendar !== 'proleptic_gregorian') {
    return {
      availability: 'unsupported',
      reason: 'unsupported_calendar',
      julianDateUtc: null,
      epistemicStatus: 'derived',
      ruleId: 'julian_date_utc_proleptic_gregorian_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.calendar']
    }
  }

  const validation = validateUtcInput(input.utc)
  if (!validation.valid) {
    return {
      availability: validation.availability,
      reason: validation.reason,
      julianDateUtc: null,
      epistemicStatus: 'derived',
      ruleId: 'julian_date_utc_proleptic_gregorian_v0',
      ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
      sourceRefs: ['input.utc']
    }
  }

  const julianDateUtc = computeJulianDateUtc(input.utc)

  return {
    availability: 'available',
    julianDateUtc,
    epistemicStatus: 'derived',
    ruleId: 'julian_date_utc_proleptic_gregorian_v0',
    ruleSetVersion: TIME_ANGLE_RULE_SET_VERSION,
    sourceRefs: ['input.utc']
  }
}
