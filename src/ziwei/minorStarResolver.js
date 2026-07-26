/**
 * minorStarResolver.js
 *
 * 자미두수 보조성(육길성/육살성) 12궁 배치 모듈
 */

import {
  MINOR_STAR_RULESET,
  calculateZuoboBranch,
  calculateYoubiBranch,
  calculateWenchangBranch,
  calculateWenguBranch,
  calculateTiankuiYueBranch,
} from './minorStarRules.js'

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export function resolveMinorStars(params = {}) {
  const {
    birthYearStem,
    lunarMonth,
    hourBranch,
    palaces = [],
  } = params || {}

  const isValidStem = typeof birthYearStem === 'string' && STEMS.includes(birthYearStem)
  const isValidMonth = typeof lunarMonth === 'number' && Number.isInteger(lunarMonth) && lunarMonth >= 1 && lunarMonth <= 12
  const isValidBranch = typeof hourBranch === 'string' && BRANCHES.includes(hourBranch)

  if (!isValidStem || !isValidMonth || !isValidBranch) {
    return {
      minorStars: [],
      status: 'failed',
      reason: 'missing_or_invalid_input',
      minorStarMeta: {
        ruleSetVersion: MINOR_STAR_RULESET.version,
      },
    }
  }

  const minorStars = []

  // 1. 좌보 / 우필
  const zuoboBranch = calculateZuoboBranch(lunarMonth)
  const youbiBranch = calculateYoubiBranch(lunarMonth)

  // 2. 문창 / 문곡
  const wenchangBranch = calculateWenchangBranch(hourBranch)
  const wenguBranch = calculateWenguBranch(hourBranch)

  // 3. 천괴 / 천월
  const kuiYue = calculateTiankuiYueBranch(birthYearStem)

  const luckyStarSpecs = [
    { id: 'zuobo', name: '좌보', branch: zuoboBranch, subCategory: 'lucky' },
    { id: 'youbi', name: '우필', branch: youbiBranch, subCategory: 'lucky' },
    { id: 'wenchang', name: '문창', branch: wenchangBranch, subCategory: 'lucky' },
    { id: 'wengu', name: '문곡', branch: wenguBranch, subCategory: 'lucky' },
    { id: 'tiankui', name: '천괴', branch: kuiYue.kui, subCategory: 'lucky' },
    { id: 'tianyue', name: '천월', branch: kuiYue.yue, subCategory: 'lucky' },
  ]

  luckyStarSpecs.forEach((star) => {
    const matchedPalace = palaces.find((p) => p.branch === star.branch)
    minorStars.push({
      id: star.id,
      name: star.name,
      category: 'minor',
      subCategory: star.subCategory,
      palaceId: matchedPalace ? matchedPalace.id : null,
      palaceName: matchedPalace ? matchedPalace.name : null,
      palaceBranch: star.branch,
      ruleSetVersion: MINOR_STAR_RULESET.version,
    })
  })

  return {
    minorStars,
    minorStarMeta: {
      ruleSetVersion: MINOR_STAR_RULESET.version,
    },
  }
}
