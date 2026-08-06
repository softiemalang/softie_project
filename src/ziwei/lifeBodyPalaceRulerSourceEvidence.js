/**
 * Source-only Ziwei evidence rules for 命宮·身宮 and 命主·身主.
 *
 * This module intentionally does not import the production resolver. It keeps
 * source transcription, normalization, and ruler tables at the comparison
 * boundary without changing the public calculation contract.
 */

export const SOURCE_RULE_SCHEMA = 'ziwei-life-body-palace-ruler-source-rule-v0'
export const TRADITIONAL_BRANCH_ORDER = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])

export const NANBEI_MINGZHU_BY_MING_GONG = Object.freeze({
  子: '貪狼', 丑: '巨門', 寅: '祿存', 卯: '文曲', 辰: '廉貞', 巳: '武曲',
  午: '破軍', 未: '武曲', 申: '廉貞', 酉: '文曲', 戌: '祿存', 亥: '巨門',
})

export const NANBEI_SHENZHU_BY_BIRTH_YEAR_BRANCH = Object.freeze({
  子: '火星', 丑: '天相', 寅: '天梁', 卯: '天同', 辰: '文昌', 巳: '天機',
  午: '火星', 未: '天相', 申: '天梁', 酉: '天同', 戌: '文昌', 亥: '天機',
})

// Directly read from the Ming Nanyang Tang scan at the 命主/身主 section.
// The grouped source labels and the surface variants are preserved separately
// in the materialized transcription; these maps are only the comparison-boundary
// expansion to one branch per row.
export const NANYANG_MINGZHU_BY_MING_GONG = Object.freeze({
  子: '貪狼', 丑: '巨門', 寅: '祿存', 卯: '文曲', 辰: '廉貞', 巳: '武曲',
  午: '破軍', 未: '武曲', 申: '廉貞', 酉: '文曲', 戌: '祿存', 亥: '巨門',
})

export const NANYANG_SHENZHU_SURFACE_BY_BIRTH_YEAR_BRANCH = Object.freeze({
  子: '火鈴星', 丑: '天相星', 寅: '天梁星', 卯: '天同星', 辰: '文昌星', 巳: '天機主',
  午: '火鈴星', 未: '天相星', 申: '天梁星', 酉: '天同星', 戌: '文昌星', 亥: '天機主',
})

const branchIndex = branch => {
  const index = TRADITIONAL_BRANCH_ORDER.indexOf(branch)
  if (index < 0) throw new Error(`unknown_traditional_branch:${branch}`)
  return index
}

export function evaluateSourceLifeBody({ lunarMonth, hourBranch }) {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error('lunarMonth:must_be_integer_1_to_12')
  const hourIndex = branchIndex(hourBranch)
  const monthPalaceIndex = (branchIndex('寅') + lunarMonth - 1) % 12
  const lifeIndex = (monthPalaceIndex - hourIndex + 12) % 12
  const bodyIndex = (monthPalaceIndex + hourIndex) % 12
  return {
    lunarMonth,
    hourBranch,
    monthPalaceBranch: TRADITIONAL_BRANCH_ORDER[monthPalaceIndex],
    mingGongBranch: TRADITIONAL_BRANCH_ORDER[lifeIndex],
    shenGongBranch: TRADITIONAL_BRANCH_ORDER[bodyIndex],
  }
}

export function evaluateSourceRulers({ mingGongBranch, birthYearBranch, edition = 'nanbei' }) {
  const mingZhuTable = edition === 'nanyangtang' ? NANYANG_MINGZHU_BY_MING_GONG : NANBEI_MINGZHU_BY_MING_GONG
  const shenZhuTable = edition === 'nanyangtang' ? NANYANG_SHENZHU_SURFACE_BY_BIRTH_YEAR_BRANCH : NANBEI_SHENZHU_BY_BIRTH_YEAR_BRANCH
  return {
    edition,
    mingGongBranch,
    birthYearBranch,
    mingZhuStar: mingZhuTable[mingGongBranch] || null,
    shenZhuStar: shenZhuTable[birthYearBranch] || null,
  }
}

export function enumerateLifeBodyInputs() {
  const rows = []
  for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth += 1) {
    for (const hourBranch of TRADITIONAL_BRANCH_ORDER) {
      const result = evaluateSourceLifeBody({ lunarMonth, hourBranch })
      rows.push({
        rowId: `lunar-month-${String(lunarMonth).padStart(2, '0')}-hour-${hourBranch}`,
        orderingKey: `${String(lunarMonth).padStart(2, '0')}:${String(branchIndex(hourBranch)).padStart(2, '0')}`,
        ...result,
      })
    }
  }
  return rows
}

export function enumerateRulerInputs(edition = 'nanbei') {
  const rows = []
  for (const mingGongBranch of TRADITIONAL_BRANCH_ORDER) {
    for (const birthYearBranch of TRADITIONAL_BRANCH_ORDER) {
      rows.push({
        rowId: `${edition}-ming-gong-${mingGongBranch}-birth-year-branch-${birthYearBranch}`,
        orderingKey: `${String(branchIndex(mingGongBranch)).padStart(2, '0')}:${String(branchIndex(birthYearBranch)).padStart(2, '0')}`,
        ...evaluateSourceRulers({ mingGongBranch, birthYearBranch, edition }),
      })
    }
  }
  return rows
}

export function evaluateCandidateLifeBody({ lunarMonth, hourBranch, anchorIndex, monthDirection, lifeDirection, bodyDirection, monthOffset = 0, hourOffset = 0 }) {
  const monthIndex = (anchorIndex + monthDirection * (lunarMonth - 1 + monthOffset) + 1200) % 12
  const hourIndex = (branchIndex(hourBranch) + hourOffset + 1200) % 12
  const lifeIndex = (monthIndex + lifeDirection * hourIndex + 1200) % 12
  const bodyIndex = (monthIndex + bodyDirection * hourIndex + 1200) % 12
  return { mingGongBranch: TRADITIONAL_BRANCH_ORDER[lifeIndex], shenGongBranch: TRADITIONAL_BRANCH_ORDER[bodyIndex] }
}
