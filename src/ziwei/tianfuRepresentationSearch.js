/**
 * Research-only Tianfu representation search.
 *
 * This module keeps the corrected source cells separate from the predecessor
 * transcription. It does not import or alter a production resolver.
 */

export const REPRESENTATION_SEARCH_SCHEMA = 'ziwei-tianfu-representation-search-v1'
export const BRANCHES = Object.freeze(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'])
export const LEGACY_SOURCE_TABLE = Object.freeze([
  ['子', '辰'], ['丑', '巳'], ['寅', '午'], ['卯', '未'], ['辰', '申'], ['巳', '酉'],
  ['午', '戌'], ['未', '亥'], ['申', '子'], ['酉', '丑'], ['戌', '寅'], ['亥', '卯'],
])

// p13 / 三十四 / 甲六、安天府 / right scanned leaf. The visible table has
// 紫微 in the right column and 天府 in the left column, read top-to-bottom.
export const CORRECTED_SOURCE_TABLE = Object.freeze([
  ['子', '辰'], ['丑', '卯'], ['寅', '寅'], ['卯', '丑'], ['辰', '子'], ['巳', '亥'],
  ['午', '戌'], ['未', '酉'], ['申', '申'], ['酉', '未'], ['戌', '午'], ['亥', '巳'],
])

export const mod = value => (value % 12 + 12) % 12
export const branchIndex = branch => BRANCHES.indexOf(branch)
export const branchAt = index => BRANCHES[mod(index)]
export const sourceBranch = (table, ziweiBranch) => table.find(([ziwei]) => ziwei === ziweiBranch)?.[1] ?? null
export const legacySourceBranch = ziweiBranch => sourceBranch(LEGACY_SOURCE_TABLE, ziweiBranch)
export const correctedSourceBranch = ziweiBranch => sourceBranch(CORRECTED_SOURCE_TABLE, ziweiBranch)

const signs = Object.freeze({ same: 1, reverse: -1 })
const pad = value => String(value).padStart(2, '0')

export function enumerateRepresentationCandidates() {
  const candidates = []
  for (const direction of ['same', 'reverse']) for (let rotation = 0; rotation < 12; rotation += 1) {
    candidates.push({
      candidateId: `affine-${direction}-rotation-${pad(rotation)}`,
      family: 'affine_dihedral_relation',
      definition: `source = ${direction === 'same' ? 'production' : '-production'} + ${rotation} (mod 12)`,
      axes: { direction, rotation },
      kind: 'affine',
    })
  }
  for (const inputDirection of ['same', 'reverse']) for (const outputDirection of ['same', 'reverse']) {
    for (let inputOrigin = 0; inputOrigin < 12; inputOrigin += 1) for (let outputOrigin = 0; outputOrigin < 12; outputOrigin += 1) {
      candidates.push({
        candidateId: `presentation-in-${inputDirection}-${pad(inputOrigin)}-out-${outputDirection}-${pad(outputOrigin)}`,
        family: 'independent_coordinate_presentation',
        definition: 'unpresent source input/output into the candidate canonical cycle, then evaluate production reverse-axis rule',
        axes: { inputDirection, inputOrigin, outputDirection, outputOrigin, indexBase: 0, referencePoint: 0 },
        kind: 'presentation',
      })
    }
  }
  for (const rowOrder of ['top_to_bottom', 'bottom_to_top']) for (const columnOrder of ['as_drawn', 'swapped']) {
    for (const indexBase of [0, 1]) for (let referencePoint = 0; referencePoint < 12; referencePoint += 1) {
      candidates.push({
        candidateId: `layout-${rowOrder}-${columnOrder}-index-${indexBase}-reference-${pad(referencePoint)}`,
        family: 'table_layout_and_index_adapter',
        definition: 'read row/column order, apply explicit 0/1 ordinal adapter, and compare one fixed reference-point offset',
        axes: { rowOrder, columnOrder, indexBase, referencePoint },
        kind: 'layout',
      })
    }
  }
  return candidates
}

export function sourceCells(table = CORRECTED_SOURCE_TABLE) {
  return table.map(([ziwei, tianfu], index) => ({
    row: index + 1,
    locator: `p13/三十四/甲六-安天府/table/row-${pad(index + 1)}`,
    reading: 'visual glyph; drawn row top-to-bottom',
    glyphs: { 天府: tianfu, 紫微: ziwei },
    unclearGlyph: null,
  }))
}

function unpresent(rawIndex, origin, direction) {
  return mod(signs[direction] * (rawIndex - origin))
}

function layoutPairs(candidate) {
  const rows = candidate.axes.rowOrder === 'top_to_bottom' ? CORRECTED_SOURCE_TABLE : [...CORRECTED_SOURCE_TABLE].reverse()
  return rows.map(([ziwei, tianfu], rowIndex) => {
    if (candidate.axes.rowOrder === 'top_to_bottom' && candidate.axes.columnOrder === 'as_drawn') return [ziwei, tianfu]
    if (candidate.axes.rowOrder === 'bottom_to_top' && candidate.axes.columnOrder === 'as_drawn') return [ziwei, tianfu]
    return [tianfu, ziwei]
  })
}

function layoutSourceBranch(candidate, productionZiweiIndex) {
  const pairs = layoutPairs(candidate)
  const rowIndex = mod(productionZiweiIndex + candidate.axes.referencePoint + (candidate.axes.indexBase === 1 ? 1 : 0))
  const [input, output] = pairs[rowIndex]
  // Labeled cells are authoritative in the source witness. The row-ordinal
  // adapter is deliberately reported as a bounded diagnostic, not promoted.
  return { input, output, outputIndex: mod(branchIndex(output) - candidate.axes.indexBase) }
}

export function evaluateRepresentationCandidate(candidate, row) {
  const productionZiweiIndex = branchIndex(row.production.ziweiBranch)
  const productionTianfuIndex = branchIndex(row.production.tianfuBranch)
  const sourceIndex = branchIndex(row.source.tianfuBranch)
  if (candidate.kind === 'affine') {
    const predicted = mod(signs[candidate.axes.direction] * productionTianfuIndex + candidate.axes.rotation)
    return { predictedIndex: predicted, expectedIndex: sourceIndex }
  }
  if (candidate.kind === 'presentation') {
    const sourceInputCanonical = unpresent(productionZiweiIndex, candidate.axes.inputOrigin, candidate.axes.inputDirection)
    const sourceOutputCanonical = unpresent(sourceIndex, candidate.axes.outputOrigin, candidate.axes.outputDirection)
    const predicted = mod(10 - sourceInputCanonical)
    return { predictedIndex: predicted, expectedIndex: sourceOutputCanonical }
  }
  const layout = layoutSourceBranch(candidate, productionZiweiIndex)
  const predicted = mod(productionTianfuIndex + candidate.axes.referencePoint)
  return { predictedIndex: predicted, expectedIndex: layout.outputIndex }
}

export function compareRepresentationCandidate(candidate, rows) {
  const tested = rows.map(row => {
    const result = evaluateRepresentationCandidate(candidate, row)
    return { rowId: row.rowId, ...result, match: result.predictedIndex === result.expectedIndex }
  })
  const mismatches = tested.filter(row => !row.match)
  const byZiwei = Object.fromEntries(BRANCHES.map(branch => [branch, mismatches.filter(row => rows.find(candidateRow => candidateRow.rowId === row.rowId).production.ziweiBranch === branch).length]))
  const byBureau = Object.fromEntries([...new Set(rows.map(row => row.input.bureauNumber))].sort((a, b) => a - b).map(bureau => [bureau, mismatches.filter(row => rows.find(candidateRow => candidateRow.rowId === row.rowId).input.bureauNumber === bureau).length]))
  const byDay = Object.fromEntries([...new Set(rows.map(row => row.input.lunarDay))].sort((a, b) => a - b).map(day => [day, mismatches.filter(row => rows.find(candidateRow => candidateRow.rowId === row.rowId).input.lunarDay === day).length]))
  const firstFailure = mismatches[0] ?? null
  return {
    candidateId: candidate.candidateId,
    family: candidate.family,
    definition: candidate.definition,
    axes: candidate.axes,
    testedRowCount: rows.length,
    matchCount: tested.length - mismatches.length,
    mismatchCount: mismatches.length,
    exact: mismatches.length === 0,
    mismatchPattern: { byZiweiBranch: byZiwei, byBureau, byLunarDay: byDay },
    firstFailure: firstFailure ? { rowId: firstFailure.rowId, predictedBranch: branchAt(firstFailure.predictedIndex), expectedBranch: branchAt(firstFailure.expectedIndex) } : null,
    firstMismatchRowIds: mismatches.slice(0, 3).map(row => row.rowId),
  }
}
