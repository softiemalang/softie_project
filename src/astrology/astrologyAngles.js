/**
 * astrologyAngles.js
 *
 * 천문 각도 정규화 및 각거리 계산 공통 함수 모듈
 * Rule Set: mallang-astrology-rule-core-v0
 */

/**
 * 주어진 값의 수치 유효성을 검증합니다.
 * NaN, Infinity, -Infinity, string, null, undefined 등 비정상 수치를 거릅니다.
 *
 * @param {unknown} val
 * @returns {boolean}
 */
export function isValidDegreeNumber(val) {
  return typeof val === 'number' && Number.isFinite(val)
}

/**
 * 황경 각도를 [0, 360) 범위로 정규화합니다.
 * 360° -> 0°, -1° -> 359°, -360° -> 0°, 720.25° -> 0.25°
 *
 * @param {number} degrees
 * @returns {number} 0 이상 360 미만의 수치
 * @throws {TypeError} 유효한 숫자가 아닐 경우
 */
export function normalizeDegrees360(degrees) {
  if (!isValidDegreeNumber(degrees)) {
    throw new TypeError(`Invalid degree number: ${degrees}`)
  }
  const normalized = ((degrees % 360) + 360) % 360
  // Handle JavaScript -0 edge case
  return Object.is(normalized, -0) ? 0 : normalized
}

/**
 * 각도를 [-180, 180) 범위로 정규화합니다.
 * 180° -> -180°
 *
 * @param {number} degrees
 * @returns {number} -180 이상 180 미만의 수치
 * @throws {TypeError} 유효한 숫자가 아닐 경우
 */
export function normalizeSignedDegrees180(degrees) {
  const norm360 = normalizeDegrees360(degrees)
  return norm360 >= 180 ? norm360 - 360 : norm360
}

/**
 * 두 각도 사이의 최소 각거리(0° ~ 180°)를 계산합니다.
 *
 * @param {number} degA
 * @param {number} degB
 * @returns {number} 0 이상 180 이하의 최소 각거리
 */
export function angularDistanceDegrees(degA, degB) {
  const normA = normalizeDegrees360(degA)
  const normB = normalizeDegrees360(degB)
  const diff = Math.abs(normA - normB)
  return Math.min(diff, 360 - diff)
}
