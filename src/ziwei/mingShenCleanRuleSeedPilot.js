/**
 * Source-derived 명궁·신궁 seed evaluator.
 *
 * This module intentionally contains no production-engine import. It is a
 * transcription/materialization of the rule-bearing witness only.
 */

export const SOURCE_RULE_SCHEMA = 'ziwei-ming-shen-clean-rule-seed-rule-v0'
export const TRADITIONAL_BRANCH_ORDER = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
export const ENGINE_PALACE_MAPPING = Object.freeze({ 命宮: 'life', 身宮: 'shen' })

const isInteger = value => Number.isInteger(value)

export function evaluateSourceMingShen({ lunarMonth, hourBranch }) {
  if (!isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error('lunarMonth:must_be_integer_1_to_12')
  const hourIndex = TRADITIONAL_BRANCH_ORDER.indexOf(hourBranch)
  if (hourIndex < 0) throw new Error('hourBranch:unknown_traditional_branch')

  // 寅宮起正月，順數至生月；自該宮起子時，命宮逆數、身宮順數。
  const monthPalaceIndex = (TRADITIONAL_BRANCH_ORDER.indexOf('寅') + lunarMonth - 1) % 12
  const mingIndex = (monthPalaceIndex - hourIndex + 12) % 12
  const shenIndex = (monthPalaceIndex + hourIndex) % 12
  return {
    lunarMonth,
    hourBranch,
    monthStartBranch: TRADITIONAL_BRANCH_ORDER[monthPalaceIndex],
    mingGong: { traditionalName: '命宮', engineId: ENGINE_PALACE_MAPPING.命宮, branch: TRADITIONAL_BRANCH_ORDER[mingIndex], branchIndex: mingIndex },
    shenGong: { traditionalName: '身宮', engineId: ENGINE_PALACE_MAPPING.身宮, branch: TRADITIONAL_BRANCH_ORDER[shenIndex], branchIndex: shenIndex },
  }
}

export function enumerateSourceInputs() {
  const rows = []
  for (let lunarMonth = 1; lunarMonth <= 12; lunarMonth += 1) {
    for (const hourBranch of TRADITIONAL_BRANCH_ORDER) {
      const result = evaluateSourceMingShen({ lunarMonth, hourBranch })
      rows.push({
        rowId: `lunar-month-${String(lunarMonth).padStart(2, '0')}-hour-${hourBranch}`,
        orderingKey: `${String(lunarMonth).padStart(2, '0')}:${String(TRADITIONAL_BRANCH_ORDER.indexOf(hourBranch)).padStart(2, '0')}`,
        ...result,
      })
    }
  }
  return rows
}
