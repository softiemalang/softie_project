/**
 * astrologyRulers.js
 *
 * 별자리 속성(원소, 양식, 극성, 전통/현대 룰러) 및 차트 룰러 도출 모듈
 * Rule Set: mallang-astrology-rule-core-v0
 */

export const SIGN_METADATA = {
  aries: {
    element: 'fire',
    modality: 'cardinal',
    polarity: 'masculine',
    traditionalRuler: 'mars',
    modernRuler: 'mars',
  },
  taurus: {
    element: 'earth',
    modality: 'fixed',
    polarity: 'feminine',
    traditionalRuler: 'venus',
    modernRuler: 'venus',
  },
  gemini: {
    element: 'air',
    modality: 'mutable',
    polarity: 'masculine',
    traditionalRuler: 'mercury',
    modernRuler: 'mercury',
  },
  cancer: {
    element: 'water',
    modality: 'cardinal',
    polarity: 'feminine',
    traditionalRuler: 'moon',
    modernRuler: 'moon',
  },
  leo: {
    element: 'fire',
    modality: 'fixed',
    polarity: 'masculine',
    traditionalRuler: 'sun',
    modernRuler: 'sun',
  },
  virgo: {
    element: 'earth',
    modality: 'mutable',
    polarity: 'feminine',
    traditionalRuler: 'mercury',
    modernRuler: 'mercury',
  },
  libra: {
    element: 'air',
    modality: 'cardinal',
    polarity: 'masculine',
    traditionalRuler: 'venus',
    modernRuler: 'venus',
  },
  scorpio: {
    element: 'water',
    modality: 'fixed',
    polarity: 'feminine',
    traditionalRuler: 'mars',
    modernRuler: 'pluto',
  },
  sagittarius: {
    element: 'fire',
    modality: 'mutable',
    polarity: 'masculine',
    traditionalRuler: 'jupiter',
    modernRuler: 'jupiter',
  },
  capricorn: {
    element: 'earth',
    modality: 'cardinal',
    polarity: 'feminine',
    traditionalRuler: 'saturn',
    modernRuler: 'saturn',
  },
  aquarius: {
    element: 'air',
    modality: 'fixed',
    polarity: 'masculine',
    traditionalRuler: 'saturn',
    modernRuler: 'uranus',
  },
  pisces: {
    element: 'water',
    modality: 'mutable',
    polarity: 'feminine',
    traditionalRuler: 'jupiter',
    modernRuler: 'neptune',
  },
}

/**
 * 특정 별자리의 속성 정보를 조회합니다.
 *
 * @param {string} signId
 * @returns {object|null}
 */
export function getSignMetadata(signId) {
  return SIGN_METADATA[signId] || null
}

/**
 * ASC 별자리 위치로 전통 및 현대 차트 룰러를 도출합니다.
 *
 * @param {object|null} ascendantPlacement ASC 별자리 배치 정보 (없으면 null)
 * @returns {object} 차트 룰러 도출 결과
 */
export function deriveChartRulers(ascendantPlacement = null) {
  if (!ascendantPlacement || !ascendantPlacement.signId) {
    return {
      availability: 'blocked',
      reason: 'ascendant_unavailable',
      traditionalChartRuler: null,
      modernChartRuler: null,
      ruleId: 'chart_ruler_from_ascendant_v0',
    }
  }

  const meta = getSignMetadata(ascendantPlacement.signId)
  if (!meta) {
    return {
      availability: 'blocked',
      reason: 'invalid_ascendant_sign',
      traditionalChartRuler: null,
      modernChartRuler: null,
      ruleId: 'chart_ruler_from_ascendant_v0',
    }
  }

  return {
    availability: 'available',
    ascendantSignId: ascendantPlacement.signId,
    traditionalChartRuler: meta.traditionalRuler,
    modernChartRuler: meta.modernRuler,
    epistemicStatus: 'derived',
    ruleId: 'chart_ruler_from_ascendant_v0',
  }
}
