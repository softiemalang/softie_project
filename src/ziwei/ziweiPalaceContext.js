/**
 * ziweiPalaceContext.js
 *
 * 12궁별 삼방사정(三方四正) 관계 및 주성/보조성/사화 통합 Palace Context 구축
 */

import {
  PALACE_RELATION_RULESET,
  TOPIC_PALACE_PATTERNS,
  calculateOppositePalaceIndex,
  calculateTrinePalaceIndices,
} from './palaceRelationRules.js'

export function buildZiweiPalaceContexts(chart = {}) {
  const palaces = chart.palaces || []
  const majorStars = chart.majorStars || []
  const minorStars = chart.minorStars || []
  const transformations = chart.transformations || []

  const palaceContexts = {}

  palaces.forEach((palace, index) => {
    // 1. 해당 궁 자체의 요소들
    const ownMajorStars = majorStars.filter((s) => s.palaceId === palace.id)
    const ownMinorStars = minorStars.filter((s) => s.palaceId === palace.id)
    const ownTransformations = transformations.filter((t) => {
      return ownMajorStars.some((m) => m.id === t.starId) || ownMinorStars.some((m) => m.id === t.starId)
    })

    // 2. 대궁(Opposite Palace) 요소
    const oppositeIndex = calculateOppositePalaceIndex(index)
    const oppositePalace = palaces[oppositeIndex] || null
    const oppositeMajorStars = oppositePalace ? majorStars.filter((s) => s.palaceId === oppositePalace.id) : []

    // 3. 삼방궁(Trine Palaces) 요소
    const trineIndices = calculateTrinePalaceIndices(index)
    const trinePalaces = trineIndices.map((i) => palaces[i]).filter(Boolean)
    const trineMajorStars = trinePalaces.flatMap((p) => majorStars.filter((s) => s.palaceId === p.id))

    palaceContexts[palace.id] = {
      palaceId: palace.id,
      palaceName: palace.name,
      branch: palace.branch,

      own: {
        majorStars: ownMajorStars,
        minorStars: ownMinorStars,
        transformations: ownTransformations,
      },

      relationship: {
        opposite: {
          palaceId: oppositePalace ? oppositePalace.id : null,
          palaceName: oppositePalace ? oppositePalace.name : null,
          branch: oppositePalace ? oppositePalace.branch : null,
          majorStars: oppositeMajorStars,
        },
        trine: {
          palaces: trinePalaces.map((p) => ({ palaceId: p.id, palaceName: p.name, branch: p.branch })),
          majorStars: trineMajorStars,
        },
      },

      relationRuleSetVersion: PALACE_RELATION_RULESET.version,
    }
  })

  // 4. interpretivePatterns (해석 참조 인덱스 구조)
  const interpretivePatterns = {}
  Object.entries(TOPIC_PALACE_PATTERNS).forEach(([patternKey, patternSpec]) => {
    interpretivePatterns[patternKey] = {
      label: patternSpec.label,
      primaryPalaceId: patternSpec.primaryPalaceId,
      primaryContext: palaceContexts[patternSpec.primaryPalaceId] || null,
      relatedPalaceIds: patternSpec.relatedPalaceIds,
    }
  })

  return {
    palaceContexts,
    interpretivePatterns,
    relationMeta: {
      ruleSetVersion: PALACE_RELATION_RULESET.version,
    },
  }
}
