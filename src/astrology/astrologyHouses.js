/**
 * astrologyHouses.js
 *
 * Whole Sign 하우스 도출 모듈
 * Rule Set: mallang-astrology-rule-core-v0
 */

/**
 * ASC 별자리 인덱스와 대상 별자리 인덱스로 Whole Sign 하우스 번호를 계산합니다.
 *
 * @param {number} bodySignIndex 0..11
 * @param {number} ascendantSignIndex 0..11
 * @returns {number} 1..12
 */
export function calculateWholeSignHouse(bodySignIndex, ascendantSignIndex) {
  return ((bodySignIndex - ascendantSignIndex + 12) % 12) + 1
}

/**
 * 차트의 전체 Whole Sign 하우스 및 천체별 하우스 배치를 도출합니다.
 *
 * @param {object} params
 * @param {object|null} params.ascendantPlacement ASC 별자리배치 객체 (없을 경우 null)
 * @param {Array} params.bodyPlacements 천체 별자리배치 객체 배열
 * @returns {object} 하우스 도출 결과
 */
export function deriveWholeSignHouses({ ascendantPlacement = null, bodyPlacements = [] } = {}) {
  if (!ascendantPlacement || typeof ascendantPlacement.signIndex !== 'number') {
    return {
      availability: 'blocked',
      reason: 'ascendant_unavailable',
      fallbackApplied: false,
      houseSystem: 'whole_sign',
      placements: [],
      ruleId: 'whole_sign_house_v0',
    }
  }

  const ascSignIndex = ascendantPlacement.signIndex

  const placements = bodyPlacements.map((b) => {
    if (b.availability === 'unsupported') {
      return {
        id: b.id,
        availability: 'unsupported',
        reason: 'unsupported_body',
        house: null,
      }
    }

    if (typeof b.signIndex !== 'number') {
      return {
        id: b.id,
        availability: 'unavailable',
        reason: 'sign_unavailable',
        house: null,
      }
    }

    const house = calculateWholeSignHouse(b.signIndex, ascSignIndex)

    return {
      id: b.id,
      house,
      houseSystem: 'whole_sign',
      availability: 'available',
      epistemicStatus: 'derived',
      ruleId: 'whole_sign_house_v0',
    }
  })

  return {
    availability: 'available',
    houseSystem: 'whole_sign',
    ascendantSignId: ascendantPlacement.signId,
    ascendantSignIndex: ascSignIndex,
    placements,
    ruleId: 'whole_sign_house_v0',
  }
}
