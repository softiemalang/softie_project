/**
 * starResolver.js
 *
 * 자미두수 14주성(Major Stars) 배치 산출 모듈
 */

import {
  STAR_PLACEMENT_RULESET,
  calculateZiweiBranch,
  calculateTianfuBranch,
  getTianfuModeConvention,
  ZIWEI_SERIES_OFFSETS,
  TIANFU_SERIES_OFFSETS,
} from './starPlacementRules.js'

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const buildStarPlacementMeta = (convention) => ({
  ruleSetVersion: STAR_PLACEMENT_RULESET.version,
  ziweiMethod: STAR_PLACEMENT_RULESET.ziweiMethod,
  tianfuMode: convention.mode,
  tianfuMethod: convention.tianfuMethod,
  tianfuFormula: convention.tianfuFormula,
})

export function resolve14MajorStars(params = {}) {
  const {
    bureauNumber,
    lunarDay,
    palaces = [],
    tianfuMode,
  } = params || {}

  let tianfuConvention
  try {
    tianfuConvention = getTianfuModeConvention(tianfuMode)
  } catch {
    return {
      ziweiBranch: null,
      tianfuBranch: null,
      majorStars: [],
      status: 'failed',
      reason: 'invalid_tianfu_mode',
      starPlacementMeta: {
        ruleSetVersion: STAR_PLACEMENT_RULESET.version,
        ziweiMethod: STAR_PLACEMENT_RULESET.ziweiMethod,
        tianfuMode: null,
        tianfuMethod: null,
        tianfuFormula: null,
      },
    }
  }

  const isValidBureau = typeof bureauNumber === 'number' && Number.isInteger(bureauNumber) && bureauNumber >= 2 && bureauNumber <= 6
  const isValidLunarDay = typeof lunarDay === 'number' && Number.isInteger(lunarDay) && lunarDay >= 1 && lunarDay <= 30

  if (!isValidBureau || !isValidLunarDay) {
    return {
      ziweiBranch: null,
      tianfuBranch: null,
      majorStars: [],
      status: 'failed',
      reason: 'missing_or_invalid_input',
      starPlacementMeta: buildStarPlacementMeta(tianfuConvention),
    }
  }

  const ziweiBranch = calculateZiweiBranch(bureauNumber, lunarDay)
  const tianfuBranch = calculateTianfuBranch(ziweiBranch, { tianfuMode: tianfuConvention.mode })

  const ziweiIndex = BRANCHES.indexOf(ziweiBranch)
  const tianfuIndex = BRANCHES.indexOf(tianfuBranch)

  const majorStars = []

  // 1. 자미계성 6星 배치
  ZIWEI_SERIES_OFFSETS.forEach((star) => {
    const branchIdx = (ziweiIndex + star.offset + 1200) % 12
    const branch = BRANCHES[branchIdx]
    const matchedPalace = palaces.find((p) => p.branch === branch)

    majorStars.push({
      id: star.id,
      name: star.name,
      category: 'major',
      series: 'ziwei',
      palaceId: matchedPalace ? matchedPalace.id : null,
      palaceName: matchedPalace ? matchedPalace.name : null,
      palaceBranch: branch,
      brightness: null, // 묘왕평함 슬롯
      transformation: null, // 사화 슬롯
      ruleSetVersion: STAR_PLACEMENT_RULESET.version,
    })
  })

  // 2. 천부계성 8星 배치
  TIANFU_SERIES_OFFSETS.forEach((star) => {
    const branchIdx = (tianfuIndex + star.offset + 1200) % 12
    const branch = BRANCHES[branchIdx]
    const matchedPalace = palaces.find((p) => p.branch === branch)

    majorStars.push({
      id: star.id,
      name: star.name,
      category: 'major',
      series: 'tianfu',
      palaceId: matchedPalace ? matchedPalace.id : null,
      palaceName: matchedPalace ? matchedPalace.name : null,
      palaceBranch: branch,
      brightness: null,
      transformation: null,
      ruleSetVersion: STAR_PLACEMENT_RULESET.version,
    })
  })

  return {
    ziweiBranch,
    tianfuBranch,
    majorStars,
    starPlacementMeta: buildStarPlacementMeta(tianfuConvention),
  }
}
