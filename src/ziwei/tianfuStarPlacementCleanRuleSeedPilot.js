/** Source-only Tianfu placement evaluator. It deliberately has no production imports. */

export const SOURCE_RULE_SCHEMA = 'ziwei-tianfu-star-placement-clean-rule-seed-rule-v0'
export const BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])

// p13 / 三十四 / 甲六、安天府: the drawn two-column table, read top-to-bottom.
// The table is transcribed as source cells, not as a production lookup table.
export const SOURCE_TABLE = Object.freeze([
  ['子', '辰'], ['丑', '巳'], ['寅', '午'], ['卯', '未'], ['辰', '申'], ['巳', '酉'],
  ['午', '戌'], ['未', '亥'], ['申', '子'], ['酉', '丑'], ['戌', '寅'], ['亥', '卯'],
])

const sourceRow = ziweiBranch => {
  const row = SOURCE_TABLE.find(([ziwei]) => ziwei === ziweiBranch)
  if (!row) throw new Error('ziweiBranch:must_be_source_branch')
  return row
}

export function evaluateSourceTianfuPlacement({ ziweiBranch }) {
  const [ziwei, tianfu] = sourceRow(ziweiBranch)
  return { input: { ziweiBranch: ziwei }, intermediate: { sourceTableRow: BRANCHES.indexOf(ziwei) + 1, direction: 'source-table-order', base: 'source table cell; no modulo applied' }, output: { traditionalName: '天府', branch: tianfu, engineStarId: 'tianfu' } }
}

export function enumerateSourceInputs() {
  return SOURCE_TABLE.map(([ziweiBranch], index) => ({ rowId: `ziwei-${ziweiBranch}-tianfu`, orderingKey: String(index).padStart(2, '0'), ...evaluateSourceTianfuPlacement({ ziweiBranch }) }))
}
