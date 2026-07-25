/**
 * palaceRelationRules.js
 *
 * 자미두수 삼방사정(三方四正) 대궁 및 삼방 궁위 관계 규칙 명세 (RuleSet Versioning)
 */

export const PALACE_RELATION_RULESET = {
  version: 'traditional_v1',
  description: '전통 자미두수 대궁(Opposite) 및 삼방(Trine) 궁위 관계 규칙',
}

// 궁위별 삼방사정 주제 인덱스 맵 (해석 참조 구조)
export const TOPIC_PALACE_PATTERNS = {
  careerPattern: {
    label: '직업 및 역량 개발 패턴',
    primaryPalaceId: 'career',
    relatedPalaceIds: ['life', 'career', 'wealth', 'travel'],
  },
  wealthPattern: {
    label: '재물 및 자산 관리 패턴',
    primaryPalaceId: 'wealth',
    relatedPalaceIds: ['life', 'wealth', 'career', 'property'],
  },
  relationshipPattern: {
    label: '대인관계 및 배우자 소통 패턴',
    primaryPalaceId: 'spouse',
    relatedPalaceIds: ['life', 'spouse', 'travel', 'mind'],
  },
}

/**
 * 특정 궁 인덱스(0~11)에 대한 대궁(Opposite Index: +6 mod 12) 산출
 */
export function calculateOppositePalaceIndex(palaceIndex) {
  const idx = Number(palaceIndex) || 0
  return (idx + 6) % 12
}

/**
 * 특정 궁 인덱스(0~11)에 대한 삼방 궁위 인덱스(Trine Indices: +4, +8 mod 12) 산출
 */
export function calculateTrinePalaceIndices(palaceIndex) {
  const idx = Number(palaceIndex) || 0
  return [(idx + 4) % 12, (idx + 8) % 12]
}
