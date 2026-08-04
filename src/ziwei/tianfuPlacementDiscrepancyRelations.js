/** Additive, source-first relation analysis. It never feeds production placement. */

export const DISCREPANCY_SCHEMA = 'ziwei-tianfu-placement-discrepancy-analysis-v0'
export const BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])

// p13 / 三十四 / 甲六、安天府, right scanned leaf, read top-to-bottom.
export const RECONFIRMED_SOURCE_TABLE = Object.freeze([
  ['子', '辰'], ['丑', '卯'], ['寅', '寅'], ['卯', '丑'], ['辰', '子'], ['巳', '亥'],
  ['午', '戌'], ['未', '酉'], ['申', '申'], ['酉', '未'], ['戌', '午'], ['亥', '巳'],
])

const mod = value => (value % 12 + 12) % 12
export const branchIndex = branch => BRANCHES.indexOf(branch)
export const branchAt = index => BRANCHES[mod(index)]
export const signedDistance = (sourceIndex, productionIndex) => {
  const distance = mod(sourceIndex - productionIndex)
  return distance > 6 ? distance - 12 : distance
}

export function evaluateReconfirmedSource(ziweiBranch) {
  const row = RECONFIRMED_SOURCE_TABLE.find(([ziwei]) => ziwei === ziweiBranch)
  if (!row) throw new Error('ziweiBranch:must_be_source_branch')
  return { input: { ziweiBranch: row[0] }, intermediate: { sourceTableRow: BRANCHES.indexOf(row[0]) + 1, direction: 'source-table-order', base: 'source table cell; no modulo applied' }, output: { traditionalName: '天府', branch: row[1], engineStarId: 'tianfu' } }
}

export function enumerateReconfirmedSource() {
  return RECONFIRMED_SOURCE_TABLE.map(([ziweiBranch], index) => ({ rowId: `ziwei-${ziweiBranch}-tianfu`, orderingKey: String(index).padStart(2, '0'), ...evaluateReconfirmedSource(ziweiBranch) }))
}

const relation = (id, family, definition, predict) => ({ id, family, definition, predict })
export function enumerateRelationCandidates() {
  const candidates = [relation('identity', 'identity', 'source = production', p => p)]
  for (let offset = 0; offset < 12; offset += 1) candidates.push(relation(`rotation-${String(offset).padStart(2, '0')}`, 'fixed_rotation_offset', `source = production + ${offset} (mod 12)`, p => mod(p + offset)))
  for (let offset = 0; offset < 12; offset += 1) candidates.push(relation(`reflection-rotation-${String(offset).padStart(2, '0')}`, 'reflection_rotation', `source = ${offset} - production (mod 12)`, p => mod(offset - p)))
  candidates.push(relation('inverse-mapping', 'inverse_mapping', 'source = inverse of production mapping over the 子=0..亥=11 enum', p => mod(10 - p)))
  for (let inputOffset = 0; inputOffset < 12; inputOffset += 1) for (let outputOffset = 0; outputOffset < 12; outputOffset += 1) candidates.push(relation(`enum-relabel-in-${String(inputOffset).padStart(2, '0')}-out-${String(outputOffset).padStart(2, '0')}`, 'enum_relabeling', `relabel input +${inputOffset}, output -${outputOffset}; source = production(relabelled input)`, p => mod(p + inputOffset - outputOffset)))
  candidates.push(relation('source-base-direction', 'source_base_direction', 'source table base 辰(index 4), reverse direction: source = 4 - ziwei', z => mod(4 - z)))
  return candidates
}

export function classifyTranscriptionDifference(oldBranch, newBranch) {
  if (oldBranch === newBranch) return 'exact'
  if (oldBranch === newBranch) return 'glyph equivalent'
  return 'rule-semantic discrepancy'
}
