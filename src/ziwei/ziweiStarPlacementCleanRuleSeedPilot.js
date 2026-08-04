/** Source-derived 紫微星 placement evaluator. Independent of production rules. */

export const SOURCE_RULE_SCHEMA = 'ziwei-ziwei-star-placement-clean-rule-seed-rule-v0'
export const BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
export const BUREAUS = Object.freeze([
  { traditionalName: '水二局', number: 2, engineEnum: 'water_2' },
  { traditionalName: '木三局', number: 3, engineEnum: 'wood_3' },
  { traditionalName: '金四局', number: 4, engineEnum: 'metal_4' },
  { traditionalName: '土五局', number: 5, engineEnum: 'earth_5' },
  { traditionalName: '火六局', number: 6, engineEnum: 'fire_6' },
])

const bureau = value => {
  const found = BUREAUS.find(item => item.traditionalName === value || item.number === value)
  if (!found) throw new Error('bureau:must_be_source_bureau_2_to_6')
  return found
}

export function evaluateSourceZiweiStarPlacement({ bureau: bureauInput, lunarDay }) {
  const selected = bureau(bureauInput)
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) throw new Error('lunarDay:must_be_integer_1_to_30')
  const quotient = Math.floor((lunarDay + selected.number - 1) / selected.number)
  const remainder = quotient * selected.number - lunarDay
  const direction = remainder === 0 ? 'none' : remainder % 2 === 1 ? 'reverse' : 'forward'
  const signedRemainder = direction === 'reverse' ? -remainder : remainder
  const branchIndex = (2 + quotient - 1 + signedRemainder + 12) % 12
  return {
    input: { bureau: selected.traditionalName, bureauNumber: selected.number, lunarDay },
    intermediate: { quotient, remainder, direction, signedRemainder, baseBranch: '寅', branchIndex },
    output: { traditionalName: '紫微', branch: BRANCHES[branchIndex], engineStarId: 'ziwei' },
  }
}

export function enumerateSourceInputs() {
  return BUREAUS.flatMap(selected => Array.from({ length: 30 }, (_, index) => {
    const lunarDay = index + 1
    const result = evaluateSourceZiweiStarPlacement({ bureau: selected.traditionalName, lunarDay })
    return { rowId: `bureau-${selected.number}-day-${String(lunarDay).padStart(2, '0')}`, orderingKey: `${selected.number}:${String(lunarDay).padStart(2, '0')}`, ...result }
  }))
}
