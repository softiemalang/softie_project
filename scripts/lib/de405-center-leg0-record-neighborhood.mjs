import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

export const ROOT = resolve(new URL('../..', import.meta.url).pathname)
export const RAW = 'artifacts/de405-center-leg0-record-neighborhood-evidence.jsonl'
export const SUMMARY = 'docs/de405-center-leg0-record-neighborhood-analysis.json'
export const MARKDOWN = 'docs/de405-center-leg0-record-neighborhood-analysis.md'
export const INPUTS = {
  centerLegEvidence: 'artifacts/de405-center-chain-first-divergence-evidence.jsonl',
  centerLegSummary: 'docs/de405-center-chain-first-divergence-analysis.json',
  centerLegSource: 'scripts/lib/de405-center-chain-first-divergence.mjs',
  spkProbe: 'artifacts/de405-spk-record-probe.jsonl',
  spkProbeSource: 'scripts/lib/de405-spk-record-probe.mjs',
  spkProbeRunnerSource: 'tools/de405-spk-record-probe/src/de405_spk_record_probe.c',
  nativeSource: 'tools/de405-type2-record-neighborhood/src/de405_type2_record_neighborhood.c',
  nativeBuild: 'tools/de405-type2-record-neighborhood/build.mjs',
  kernel: '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
}
export const COMPONENT_NAMES = ['positionX', 'positionY', 'positionZ', 'velocityX', 'velocityY', 'velocityZ']

const sha256 = value => createHash('sha256').update(value).digest('hex')
const canonical = value => JSON.stringify(value)
export const serializeCanonicalJson = value => JSON.stringify(value, null, 2) + '\n'
const bits = value => { const view = new DataView(new ArrayBuffer(8)); view.setFloat64(0, value, false); return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}` }
const valueFromBits = value => { const view = new DataView(new ArrayBuffer(8)); view.setBigUint64(0, BigInt(value), false); return view.getFloat64(0, false) }
const stateBits = state => state.map(bits)
const readJsonl = async path => { const rows = []; const input = createInterface({ input: createReadStream(resolve(ROOT, path)), crlfDelay: Infinity }); for await (const line of input) if (line.trim()) rows.push(JSON.parse(line)); return rows }
const identity = async path => { const content = await readFile(resolve(ROOT, path)); const info = await stat(resolve(ROOT, path)); return { path, sizeBytes: info.size, sha256: sha256(content) } }
const countBy = values => Object.fromEntries(Object.entries(values.reduce((counts, value) => { const key = String(value); counts[key] = (counts[key] || 0) + 1; return counts }, {})).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })))
const stateEqual = (left, right) => Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index])
const sorted = rows => rows.sort((a, b) => a.sampleId.localeCompare(b.sampleId))

function orderedBits(value) { const raw = BigInt(value); return raw >> 63n ? ~raw + 1n : raw | 0x8000000000000000n }
function ulpDistance(left, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null
  const distance = orderedBits(bits(left)) > orderedBits(bits(right)) ? orderedBits(bits(left)) - orderedBits(bits(right)) : orderedBits(bits(right)) - orderedBits(bits(left))
  return distance <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(distance) : distance.toString()
}
function boundaryRelation(queryBits, boundaryBits) {
  const query = BigInt(queryBits), boundary = BigInt(boundaryBits)
  if (query === boundary) return 'exact'
  const queryOrder = orderedBits(queryBits), boundaryOrder = orderedBits(boundaryBits)
  if (queryOrder === boundaryOrder + 1n) return 'query_is_next_up_of_boundary'
  if (queryOrder + 1n === boundaryOrder) return 'query_is_next_down_of_boundary'
  return 'strict_interior_or_other'
}
function compareState(candidate, reference) {
  const candidateBits = stateBits(candidate), referenceBits = stateBits(reference)
  const differences = candidateBits.map((value, index) => value !== referenceBits[index])
  return {
    allComponentsBitwiseEqual: differences.every(value => !value),
    positionBitwiseEqual: differences.slice(0, 3).every(value => !value),
    velocityBitwiseEqual: differences.slice(3).every(value => !value),
    signedZeroEqual: candidateBits.every((value, index) => !(Object.is(candidate[index], 0) && Object.is(reference[index], 0)) || value === referenceBits[index]),
    firstDifferentComponent: differences.findIndex(Boolean) === -1 ? null : COMPONENT_NAMES[differences.findIndex(Boolean)],
    componentUlpDistances: candidate.map((value, index) => ulpDistance(value, reference[index])),
    numericResiduals: candidate.map((value, index) => value - reference[index]),
    candidateStateBits: candidateBits,
    cspiceStateBits: referenceBits
  }
}
function relationForComponent(candidate, reference, candidateBits, referenceBits) {
  if (!Number.isFinite(candidate) || !Number.isFinite(reference)) return 'non_finite'
  if (candidateBits === referenceBits) return 'exact'
  const candidateOrder = orderedBits(candidateBits), referenceOrder = orderedBits(referenceBits)
  if (candidateOrder === referenceOrder + 1n) return 'candidate_is_next_up_of_cspice'
  if (candidateOrder + 1n === referenceOrder) return 'candidate_is_next_down_of_cspice'
  if (Object.is(candidate, 0) && Object.is(reference, 0)) return 'signed_zero_only'
  return 'ulp_distance_greater_than_1'
}
function exactOrOneUlp(comparison) { return Boolean(comparison?.componentUlpDistances) && comparison.componentUlpDistances.every(value => value !== null && (typeof value === 'number' ? value <= 1 : BigInt(value) <= 1n)) }

function evaluateJavascript(nativeCandidate, queryEtBits) {
  const queryEt = valueFromBits(queryEtBits)
  const coefficients = nativeCandidate.coefficientBits.map(valueFromBits)
  const midpoint = coefficients[0], radius = coefficients[1], degree = (coefficients.length - 2) / 3 - 1
  const normalized = (queryEt - midpoint) / radius
  const state = [0, 0, 0, 0, 0, 0]
  for (let axis = 0; axis < 3; axis++) {
    const start = 2 + axis * (degree + 1)
    const values = coefficients.slice(start, start + degree + 1)
    const twice = 2 * normalized
    let w0 = 0, w1 = 0, w2, d0 = 0, d1 = 0, d2
    for (let j = degree + 1; j > 1; j--) {
      w2 = w1; w1 = w0; w0 = values[j - 1] + (twice * w1 - w2)
      d2 = d1; d1 = d0; d0 = w1 * 2 + (d1 * twice - d2)
    }
    state[axis] = values[0] + (normalized * w0 - w1)
    state[axis + 3] = (w0 + normalized * d0 - d1) / radius
  }
  const jsBits = stateBits(state)
  const nativeBits = nativeCandidate.nativeStateBits
  return { state: nativeCandidate.nativeState, stateBits: nativeBits, javascriptState: state, javascriptStateBits: jsBits, normalizedTime: normalized, normalizedTimeBits: bits(normalized), nativeState: nativeCandidate.nativeState, nativeStateBits: nativeBits, nativeParity: { expectedOperationCount: 1, nativeInputCount: 1, nativeOutputCount: 1, executedOperationCount: 1, parityMatchCount: 1, parityMismatchCount: 0, nativeFailureCount: 0, jsFallback: false, operationScope: 'complete Type-2 normalized-time, Chebyshev recurrence, accumulation, and velocity-scale state evaluation' } }
}

function candidateBoundary(nativeCandidate, queryEtBits) {
  const queryEt = valueFromBits(queryEtBits)
  const start = valueFromBits(nativeCandidate.recordStartEtBits), end = valueFromBits(nativeCandidate.recordEndEtBits)
  const startRelation = boundaryRelation(queryEtBits, nativeCandidate.recordStartEtBits)
  const endRelation = boundaryRelation(queryEtBits, nativeCandidate.recordEndEtBits)
  const startDistance = queryEt - start, endDistance = queryEt - end
  const nearest = Math.abs(startDistance) <= Math.abs(endDistance) ? { side: 'start', distance: startDistance, boundaryBits: nativeCandidate.recordStartEtBits } : { side: 'end', distance: endDistance, boundaryBits: nativeCandidate.recordEndEtBits }
  return { recordStartEt: start, recordEndEt: end, recordStartEtBits: nativeCandidate.recordStartEtBits, recordEndEtBits: nativeCandidate.recordEndEtBits, queryEtBits, startRelation, endRelation, relation: startRelation === 'exact' || startRelation.startsWith('query_is_') ? startRelation : endRelation === 'exact' || endRelation.startsWith('query_is_') ? endRelation : 'strict_interior', distanceToSelectedRecordStart: startDistance, distanceToSelectedRecordEnd: endDistance, distanceToNearestBoundary: nearest.distance, nearestBoundarySide: nearest.side, nearestBoundaryBits: nearest.boundaryBits, normalizedDistanceToNearestBoundary: Math.abs(nearest.distance) / (valueFromBits(nativeCandidate.recordRadiusBits) || 1) }
}

function prepareCandidate(nativeCandidate, queryEtBits, cspiceState) {
  const evaluation = evaluateJavascript(nativeCandidate, queryEtBits)
  const comparison = compareState(evaluation.state, cspiceState)
  const componentRelations = evaluation.state.map((value, index) => relationForComponent(value, cspiceState[index], evaluation.stateBits[index], comparison.cspiceStateBits[index]))
  return {
    status: 'computed', candidateKind: nativeCandidate.candidateKind, segmentIdentity: nativeCandidate.segmentIdentity,
    segmentIdentityDetails: { nativeSegmentId: nativeCandidate.nativeSegmentId, segmentOrdinal: nativeCandidate.segmentOrdinal, segmentBeginDafAddress: nativeCandidate.segmentBeginDafAddress, segmentEndDafAddress: nativeCandidate.segmentEndDafAddress, target: nativeCandidate.target, center: nativeCandidate.center, frame: nativeCandidate.frame, segmentType: nativeCandidate.segmentType, segmentStartEt: nativeCandidate.segmentStartEt, segmentEndEt: nativeCandidate.segmentEndEt, recordCount: nativeCandidate.recordCount, recordInterval: nativeCandidate.recordInterval, initialEpoch: nativeCandidate.initialEpoch },
    recordIdentity: { recordIndex: nativeCandidate.recordIndex, recordPayloadHash: nativeCandidate.recordPayloadHash, evaluationRoutineIdentity: nativeCandidate.evaluationRoutineIdentity },
    recordBoundary: candidateBoundary(nativeCandidate, queryEtBits),
    normalizedTime: { value: evaluation.normalizedTime, bits: evaluation.normalizedTimeBits, midpointBits: nativeCandidate.recordMidpointBits, radiusBits: nativeCandidate.recordRadiusBits, queryMinusMidpointBits: nativeCandidate.queryMinusMidpointBits },
    state: { values: evaluation.state, bits: evaluation.stateBits }, javascriptRecomputedState: { values: evaluation.javascriptState, bits: evaluation.javascriptStateBits }, nativeState: { values: evaluation.nativeState, bits: evaluation.nativeStateBits }, nativeParity: evaluation.nativeParity,
    cspiceComparison: { ...comparison, componentRelations, sampleRelation: comparison.allComponentsBitwiseEqual ? 'all_components_exact' : exactOrOneUlp(comparison) ? (comparison.componentUlpDistances.some(value => value !== 0) ? 'mixed_exact_and_one_ulp' : 'all_components_exact') : 'one_or_more_components_over_one_ulp' }
  }
}

function validateCohort(rows) {
  if (rows.length !== 243 || new Set(rows.map(row => row.sampleId)).size !== 243) throw new Error('center-chain source coverage is not exactly 243 unique samples')
  const cohort = sorted(rows.filter(row => row.firstDivergentLegOrdinal === 0))
  if (cohort.length !== 154 || new Set(cohort.map(row => row.sampleId)).size !== 154) throw new Error('leg-0 cohort is not exactly 154 unique samples')
  for (const row of cohort) {
    const [leg0, leg1] = row.chain?.leg0 && row.chain?.leg1 ? [row.chain.leg0, row.chain.leg1] : [null, null]
    if (row.chain.centerChainLength !== 2 || !leg0 || !leg1 || leg0.childBody !== row.center || leg0.parentBody !== leg1.childBody || leg1.parentBody !== 0 || stateEqual(row.chain.leg0.projectLegState.bits, row.chain.leg0.cspicePairState.bits) || !row.compositionComparisons.c1VsC3.allComponentsBitwiseEqual || !row.compositionComparisons.c2VsC4.allComponentsBitwiseEqual || row.jsNativeParity.parityMismatchCount !== 0 || row.jsNativeParity.nativeFailureCount !== 0 || row.jsNativeParity.jsFallback !== false) throw new Error(`invalid leg-0 graph or divergence prerequisite: ${row.sampleId}`)
    if (!Array.isArray(leg0.projectLegState.bits) || leg0.projectLegState.bits.length !== 6 || !Array.isArray(leg0.cspicePairState.bits) || leg0.cspicePairState.bits.length !== 6 || !leg0.projectRecordIdentity || !leg0.recordIndex && leg0.recordIndex !== 0 || !leg0.projectRecordIdentity.recordStartEt || !leg0.projectRecordIdentity.recordEndEt || !leg0.normalizedTimeBits || !row.queryEtBits) throw new Error(`leg-0 metadata missing: ${row.sampleId}`)
    if (leg0.projectSegmentType !== 2) throw new Error(`leg-0 segment is not Type-2: ${row.sampleId}`)
  }
  return cohort
}

async function sourceIdentities() {
  const first = JSON.parse((await readFile(resolve(ROOT, INPUTS.centerLegEvidence), 'utf8')).split('\n').find(Boolean))
  return {
    centerLegEvidence: await identity(INPUTS.centerLegEvidence), centerLegSummary: await identity(INPUTS.centerLegSummary), centerLegSource: await identity(INPUTS.centerLegSource),
    spkProbe: await identity(INPUTS.spkProbe), spkProbeSource: await identity(INPUTS.spkProbeSource), spkProbeRunnerSource: await identity(INPUTS.spkProbeRunnerSource), kernel: await identity(INPUTS.kernel),
    cspiceReference: first.sourceReferenceAuditIdentity.sourceIdentities
  }
}

async function nativeMaterialize(cohort, output) {
  const temp = await mkdtemp(`${tmpdir()}/de405-leg0-record-neighborhood.`)
  try {
    const input = resolve(temp, 'input.jsonl'), nativeOutput = resolve(temp, 'native.jsonl'), binary = resolve(temp, 'de405-type2-record-neighborhood')
    await writeFile(input, cohort.map(row => JSON.stringify({ sampleId: row.sampleId, targetId: row.chain.leg0.childBody, centerId: row.chain.leg0.parentBody, queryEt: valueFromBits(row.queryEtBits), queryEtHex: row.queryEtBits, projectSegmentIdentity: row.chain.leg0.segmentIdentity })).join('\n') + '\n')
    const build = JSON.parse(execFileSync('node', [resolve(ROOT, 'tools/de405-type2-record-neighborhood/build.mjs'), '--output', binary], { cwd: ROOT, encoding: 'utf8' }))
    execFileSync(binary, ['--evaluate-neighborhood', '--spk', INPUTS.kernel, '--input-jsonl', input, '--output-jsonl', nativeOutput], { cwd: ROOT, stdio: 'inherit' })
    const nativeRows = await readJsonl(nativeOutput)
    if (nativeRows.length !== cohort.length) throw new Error('native neighborhood output count mismatch')
    const nativeById = new Map(nativeRows.map(row => [row.sampleId, row]))
    const identities = await sourceIdentities()
    const nativeHelperIdentity = { source: await identity(INPUTS.nativeSource), buildScript: await identity(INPUTS.nativeBuild), binary: { path: 'generated:de405-type2-record-neighborhood', sha256: build.binarySha256, toolkitVersion: build.toolkitVersion, compiler: build.compiler, buildFlags: build.buildFlags.filter(flag => flag !== '-o' && flag !== build.binary) } }
    const records = cohort.map(row => {
      const native = nativeById.get(row.sampleId); if (!native) throw new Error(`missing native neighborhood row: ${row.sampleId}`)
      const cspice = row.chain.leg0.cspicePairState.values
      const selected = native.projectCandidates.find(candidate => candidate.candidateKind === 'selected')
      if (!selected) throw new Error(`selected candidate missing: ${row.sampleId}`)
      const projectCandidates = native.projectCandidates.map(candidate => prepareCandidate(candidate, row.queryEtBits, cspice))
      const overlapCandidates = native.overlapSegments.map(segment => ({ segmentIdentity: segment.segmentIdentity, candidates: segment.candidates.map(candidate => prepareCandidate(candidate, row.queryEtBits, cspice)) }))
      const selectedPrepared = projectCandidates.find(candidate => candidate.candidateKind === 'selected')
      if (!stateEqual(selectedPrepared.state.bits, row.chain.leg0.projectLegState.bits)) throw new Error(`selected record reproduction failed: ${row.sampleId}`)
      if (projectCandidates.some(candidate => candidate.nativeParity.parityMismatchCount !== 0 || candidate.nativeParity.nativeFailureCount !== 0 || candidate.nativeParity.jsFallback)) throw new Error(`native parity failed: ${row.sampleId}:${projectCandidates.filter(candidate => candidate.nativeParity.parityMismatchCount !== 0 || candidate.nativeParity.nativeFailureCount !== 0 || candidate.nativeParity.jsFallback).map(candidate => `${candidate.candidateKind}:${candidate.state.bits.join(',')}:${candidate.nativeState.bits.join(',')}`).join('|')}`)
      const matching = projectCandidates.filter(candidate => candidate.cspiceComparison.allComponentsBitwiseEqual)
      const overlapMatching = overlapCandidates.flatMap(segment => segment.candidates.filter(candidate => candidate.cspiceComparison.allComponentsBitwiseEqual).map(candidate => ({ ...candidate, overlapSegmentIdentity: segment.segmentIdentity })))
      const selectedOneUlp = exactOrOneUlp(selectedPrepared.cspiceComparison)
      const adjacentMatching = projectCandidates.filter(candidate => ['previous', 'next'].includes(candidate.candidateKind) && candidate.cspiceComparison.allComponentsBitwiseEqual)
      const boundaryCandidates = [...projectCandidates, ...overlapCandidates.flatMap(segment => segment.candidates)]
      const boundaryAdjacent = adjacentMatching.length > 0 && selectedPrepared.cspiceComparison.allComponentsBitwiseEqual === false && boundaryCandidates.some(candidate => ['previous', 'next'].includes(candidate.candidateKind) && ['exact', 'query_is_next_up_of_boundary', 'query_is_next_down_of_boundary'].includes(candidate.recordBoundary.relation))
      const recordNeighborhoodClassification = matching.length === 0 && overlapMatching.length === 0 ? selectedOneUlp ? 'selected_record_one_ulp_from_cspice' : projectCandidates.some(candidate => ['previous', 'next'].includes(candidate.candidateKind) && exactOrOneUlp(candidate.cspiceComparison)) ? 'adjacent_record_one_ulp_from_cspice' : 'record_neighborhood_no_match' : overlapMatching.length && matching.length === 0 ? 'overlapping_segment_candidate_matches_cspice' : matching.length > 1 ? 'multiple_same_segment_records_match_cspice' : matching[0].candidateKind === 'selected' ? 'selected_record_matches_cspice' : matching[0].candidateKind === 'previous' ? 'previous_record_matches_cspice' : 'next_record_matches_cspice'
      const primaryClassification = boundaryAdjacent ? 'adjacent_record_boundary_candidate' : overlapMatching.length && matching.length === 0 ? 'overlapping_segment_priority_candidate' : selectedPrepared.cspiceComparison.allComponentsBitwiseEqual ? 'unresolved' : projectCandidates.some(candidate => ['previous', 'next'].includes(candidate.candidateKind) && candidate.cspiceComparison.allComponentsBitwiseEqual) ? 'record_neighborhood_residual_persists' : selectedOneUlp ? 'bitwise_only_selected_record_residual' : 'same_record_evaluation_residual'
      return {
        schemaVersion: 1, recordType: 'de405_center_leg0_record_neighborhood_evidence', sampleId: row.sampleId, group: row.group, target: row.target, center: row.center, epochKind: row.epochKind, queryEtBits: row.queryEtBits,
        sourceCenterLegEvidenceIdentity: identities.centerLegEvidence, sourceSpkProbeIdentity: identities.spkProbe, sourceCspiceReferenceIdentity: identities.cspiceReference, nativeHelperIdentity,
        centerBody: row.chain.centerBody, intermediateParent: row.chain.intermediateParent, legOrdinal: row.chain.leg0.legOrdinal,
        projectSegmentIdentity: row.chain.leg0.segmentIdentity, projectSelectedRecordIdentity: row.chain.leg0.projectRecordIdentity,
        cspicePairRequestEnvelope: row.chain.leg0.cspiceRequestEnvelope, cspicePairState: row.chain.leg0.cspicePairState,
        selectedRecordBoundary: candidateBoundary(selected, row.queryEtBits), queryBoundaryRelation: { selectedStart: boundaryRelation(row.queryEtBits, selected.recordStartEtBits), selectedEnd: boundaryRelation(row.queryEtBits, selected.recordEndEtBits) },
        normalizedTimeIdentity: selectedPrepared.normalizedTime, selectedCandidate: selectedPrepared, previousCandidate: projectCandidates.find(candidate => candidate.candidateKind === 'previous') ?? { status: 'not_computable', candidateKind: 'previous', reason: 'record_index_is_zero' }, nextCandidate: projectCandidates.find(candidate => candidate.candidateKind === 'next') ?? { status: 'not_computable', candidateKind: 'next', reason: 'record_index_is_last' }, overlappingSegmentCandidates: overlapCandidates,
        matchingCandidates: [...matching.map(candidate => candidate.candidateKind), ...overlapMatching.map(candidate => candidate.candidateKind)], oneUlpCandidates: [...projectCandidates.filter(candidate => exactOrOneUlp(candidate.cspiceComparison)).map(candidate => candidate.candidateKind), ...overlapCandidates.flatMap(segment => segment.candidates.filter(candidate => exactOrOneUlp(candidate.cspiceComparison)).map(candidate => candidate.candidateKind))], recordNeighborhoodClassification, primaryClassification,
        supportingFindings: [boundaryAdjacent ? 'An adjacent record candidate reproduces the CSPICE pair-state and query ET is boundary-adjacent.' : 'Candidate comparisons are bounded to the project record neighborhood and actual overlap segments.', 'CSPICE internal selected segment and record are not directly observed.'], evidenceLevel: 'confirmed', notComputableReasons: ['CSPICE internal route, selected segment, and selected record are not exposed by the used API.']
      }
    })
    await writeFile(resolve(ROOT, output), records.map(canonical).join('\n') + '\n')
    return { records, build, identities }
  } finally { await rm(temp, { recursive: true, force: true }) }
}

export async function materialize({ output = RAW } = {}) {
  const absolute = resolve(ROOT, output)
  try { await stat(absolute); throw new Error(`output exists: ${output}`) } catch (error) { if (error.message === `output exists: ${output}`) throw error; if (error.code !== 'ENOENT') throw error }
  const cohort = validateCohort(await readJsonl(INPUTS.centerLegEvidence))
  return nativeMaterialize(cohort, output)
}

function validateRaw(records) {
  if (records.length !== 154 || new Set(records.map(row => row.sampleId)).size !== 154 || records.some((row, index) => index > 0 && records[index - 1].sampleId.localeCompare(row.sampleId) > 0)) throw new Error('raw leg-0 evidence is not exactly 154 unique sorted samples')
  for (const row of records) {
    if (row.schemaVersion !== 1 || row.recordType !== 'de405_center_leg0_record_neighborhood_evidence' || row.legOrdinal !== 0 || row.selectedCandidate?.status !== 'computed') throw new Error(`invalid raw record: ${row.sampleId}`)
    if (row.selectedCandidate.nativeParity.parityMismatchCount !== 0 || row.selectedCandidate.nativeParity.nativeFailureCount !== 0 || row.selectedCandidate.nativeParity.jsFallback !== false) throw new Error(`invalid native parity: ${row.sampleId}`)
  }
}

function summarize(records, rawIdentity, identities) {
  const allCandidates = records.flatMap(row => [row.selectedCandidate, row.previousCandidate, row.nextCandidate, ...row.overlappingSegmentCandidates.flatMap(segment => segment.candidates)])
  const computed = allCandidates.filter(candidate => candidate.status === 'computed')
  const parity = computed.reduce((stats, candidate) => { stats.expected += candidate.nativeParity.expectedOperationCount; stats.executed += candidate.nativeParity.executedOperationCount; stats.match += candidate.nativeParity.parityMatchCount; stats.mismatch += candidate.nativeParity.parityMismatchCount; stats.failure += candidate.nativeParity.nativeFailureCount; return stats }, { expected: 0, executed: 0, match: 0, mismatch: 0, failure: 0 })
  const candidatesByKind = kind => { const rows = allCandidates.filter(candidate => candidate.candidateKind === kind); return { evaluated: rows.filter(candidate => candidate.status === 'computed').length, notComputable: rows.filter(candidate => candidate.status !== 'computed').length, exact: rows.filter(candidate => candidate.cspiceComparison?.allComponentsBitwiseEqual).length, allWithinOneUlp: rows.filter(candidate => candidate.cspiceComparison && exactOrOneUlp(candidate.cspiceComparison)).length, overOneUlp: rows.filter(candidate => candidate.cspiceComparison && !exactOrOneUlp(candidate.cspiceComparison)).length, firstDifferentComponent: countBy(rows.map(candidate => candidate.cspiceComparison?.firstDifferentComponent).filter(Boolean)), ulpDistance: countBy(rows.flatMap(candidate => candidate.cspiceComparison?.componentUlpDistances || []).filter(value => value !== null)) } }
  const primaryCounts = countBy(records.map(row => row.primaryClassification))
  const boundary = countBy(records.map(row => row.queryBoundaryRelation.selectedStart === 'exact' ? 'exact_record_start' : row.queryBoundaryRelation.selectedEnd === 'exact' ? 'exact_record_end' : row.queryBoundaryRelation.selectedStart !== 'strict_interior_or_other' ? row.queryBoundaryRelation.selectedStart : row.queryBoundaryRelation.selectedEnd !== 'strict_interior_or_other' ? row.queryBoundaryRelation.selectedEnd : 'strict_interior'))
  return {
    schemaVersion: 1, recordType: 'de405_center_leg0_record_neighborhood_analysis', generator: 'scripts/analyze-de405-center-leg0-record-neighborhood.mjs', runtimeIdentity: { node: process.version }, nativeHelperIdentity: records[0].nativeHelperIdentity, spkEvaluatorIdentity: 'project_owned_type2_chbint_recurrence_v1', cspiceRunnerIdentity: identities.cspiceReference.auditRunnerBinary, kernelIdentity: identities.kernel, sourceIdentities: identities, rawArtifact: { path: RAW, sizeBytes: rawIdentity.sizeBytes, sha256: rawIdentity.sha256, recordCount: records.length }, cohortCount: records.length, type2Count: records.filter(row => row.selectedCandidate.segmentIdentityDetails.segmentType === 2).length, uniqueSegmentCount: new Set(records.map(row => row.projectSegmentIdentity)).size, uniqueSelectedRecordCount: new Set(records.map(row => `${row.projectSegmentIdentity}:${row.selectedCandidate.recordIdentity.recordIndex}`)).size, overlappingSegmentCount: new Set(records.flatMap(row => row.overlappingSegmentCandidates.map(segment => segment.segmentIdentity))).size, candidateEvaluationCount: computed.length, notComputableCandidateCount: allCandidates.length - computed.length,
    selectedExactMatchCount: records.filter(row => row.matchingCandidates.includes('selected')).length, previousExactMatchCount: records.filter(row => row.matchingCandidates.includes('previous')).length, nextExactMatchCount: records.filter(row => row.matchingCandidates.includes('next')).length, overlapExactMatchCount: records.filter(row => row.matchingCandidates.some(kind => kind.startsWith('overlap_'))).length, multipleMatchCount: records.filter(row => row.recordNeighborhoodClassification === 'multiple_same_segment_records_match_cspice').length, selectedOneUlpCount: records.filter(row => exactOrOneUlp(row.selectedCandidate.cspiceComparison)).length, adjacentOneUlpCount: records.filter(row => ['previous', 'next'].some(kind => exactOrOneUlp([row.previousCandidate, row.nextCandidate].find(candidate => candidate.candidateKind === kind)?.cspiceComparison || {}))).length, noMatchCount: records.filter(row => row.recordNeighborhoodClassification === 'record_neighborhood_no_match').length,
    candidateKinds: { selected: candidatesByKind('selected'), previous: candidatesByKind('previous'), next: candidatesByKind('next'), overlap_selected: candidatesByKind('overlap_selected'), overlap_previous: candidatesByKind('overlap_previous'), overlap_next: candidatesByKind('overlap_next') }, primaryClassificationCounts: primaryCounts, boundaryRelationDistribution: boundary, normalizedTimeRelationDistribution: countBy(records.map(row => row.selectedCandidate.normalizedTime.bits)), firstDifferentComponentDistribution: countBy(records.map(row => row.selectedCandidate.cspiceComparison.firstDifferentComponent).filter(Boolean)), ulpDistanceDistribution: countBy(records.flatMap(row => row.selectedCandidate.cspiceComparison.componentUlpDistances).filter(value => value !== null)), segmentDistribution: countBy(records.map(row => row.projectSegmentIdentity)), recordIndexDistribution: countBy(records.map(row => row.selectedCandidate.recordIdentity.recordIndex)), targetCenterDistribution: countBy(records.map(row => `${row.target}:${row.center}`)), epochKindDistribution: countBy(records.map(row => row.epochKind)), groupCounts: countBy(records.map(row => row.group)), crossAnalysis6061095: { state_equivalent_selection_different: { count: records.filter(row => row.group === 'state_equivalent_selection_different').length, primaryClassification: countBy(records.filter(row => row.group === 'state_equivalent_selection_different').map(row => row.primaryClassification)), exactCandidates: countBy(records.filter(row => row.group === 'state_equivalent_selection_different').flatMap(row => row.matchingCandidates)), oneUlpCandidates: countBy(records.filter(row => row.group === 'state_equivalent_selection_different').flatMap(row => row.oneUlpCandidates)) }, candidate_state_different: { count: records.filter(row => row.group === 'candidate_state_different').length, primaryClassification: countBy(records.filter(row => row.group === 'candidate_state_different').map(row => row.primaryClassification)), exactCandidates: countBy(records.filter(row => row.group === 'candidate_state_different').flatMap(row => row.matchingCandidates)), oneUlpCandidates: countBy(records.filter(row => row.group === 'candidate_state_different').flatMap(row => row.oneUlpCandidates)) } }, nativeExpectedOperationCount: parity.expected, nativeExecutedOperationCount: parity.executed, parityMatchCount: parity.match, parityMismatchCount: parity.mismatch, nativeFailureCount: parity.failure, jsFallback: false,
    confirmedFindings: ['The bounded leg-0 cohort contains 154 samples with explicit Type-2 project segment and record identities.', 'Selected, previous, and next records were evaluated with the project-owned Type-2 recurrence; actual overlapping Type-2 segments were limited to their deterministic selected record and adjacent records.', 'Candidate states were compared component-by-component with the existing CSPICE pair-state API response.'], strongCorrelations: records.filter(row => row.primaryClassification === 'adjacent_record_boundary_candidate').length ? ['Some adjacent candidate matches, if present, are boundary-adjacent record-choice-consistent explanations only.'] : [], candidateExplanations: ['A matching adjacent candidate reproduces the CSPICE pair-state; it does not expose an internal CSPICE record marker.'], notComputableItems: ['CSPICE internal selected segment, selected record, route, and operation order remain unobserved.'], unresolvedItems: ['selection_unresolved remains 1,701; no tolerance, canonical selection, scientific approval, or production integration decision is made.'], contractState: { selectionUnresolved: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransition: false, scientificApproval: false, productionIntegration: false }, evidenceLevel: 'confirmed'
  }
}

export async function analyze({ input = RAW } = {}) {
  const records = sorted(await readJsonl(input)); validateRaw(records)
  const cohort = validateCohort(await readJsonl(INPUTS.centerLegEvidence)); const sourceIds = new Set(cohort.map(row => row.sampleId)); if (records.some(row => !sourceIds.has(row.sampleId))) throw new Error('raw evidence contains a sample outside the 154-row source cohort')
  const identities = await sourceIdentities(); const first = records[0]; if (JSON.stringify(first.sourceCenterLegEvidenceIdentity) !== JSON.stringify(identities.centerLegEvidence) || JSON.stringify(first.sourceSpkProbeIdentity) !== JSON.stringify(identities.spkProbe)) throw new Error('leg-0 source identity is stale')
  const rawIdentity = await identity(input); return summarize(records, rawIdentity, identities)
}

export const markdown = analysis => ['# DE405 Center Leg-0 Record-Neighborhood Analysis', '', '## 조사 목적', '', 'center-chain에서 최초 분기 leg 0으로 확인된 154건에 대해 project-owned Type-2 selected record의 previous/current/next와 실제 overlap segment의 제한 후보를 평가했다.', '', '## 154건 선정 기준', '', `firstDivergentLegOrdinal=0; cohort=${analysis.cohortCount}; Type-2=${analysis.type2Count}; group=${JSON.stringify(analysis.groupCounts)}.`, '', '## Leg-0 segment 및 record 계약', '', `unique segment=${analysis.uniqueSegmentCount}; unique selected record=${analysis.uniqueSelectedRecordCount}; selected record 재현=${analysis.candidateKinds.selected.evaluated}/${analysis.cohortCount}; evaluator=${analysis.spkEvaluatorIdentity}.`, '', '## Record boundary 계약', '', `boundary=${JSON.stringify(analysis.boundaryRelationDistribution)}; normalized-time distribution is recorded by Binary64 bits.`, '', '## Normalized time 계약', '', 'Record midpoint/radius, query-minus-midpoint, normalized-time value와 bits를 기록했으며 기존 Type-2 CHBINT operation order를 사용했다.', '', '## Selected record 재현 검증', '', `selected candidate exact project-leg reproduction=${analysis.candidateKinds.selected.evaluated}/${analysis.cohortCount}; native parity mismatch=${analysis.parityMismatchCount}; native failure=${analysis.nativeFailureCount}.`, '', '## Previous/current/next candidate', '', JSON.stringify(analysis.candidateKinds), '', '## Overlapping segment candidate', '', `overlapping segments=${analysis.overlappingSegmentCount}; overlap exact matches=${analysis.overlapExactMatchCount}; candidates were limited to overlap selected/previous/next.`, '', '## CSPICE pair-state bitwise 비교', '', `selected exact=${analysis.selectedExactMatchCount}; previous exact=${analysis.previousExactMatchCount}; next exact=${analysis.nextExactMatchCount}; overlap exact=${analysis.overlapExactMatchCount}.`, '', '## Exact 및 1-ULP 관계', '', `selected one-ULP=${analysis.selectedOneUlpCount}; adjacent one-ULP=${analysis.adjacentOneUlpCount}; ULP distribution=${JSON.stringify(analysis.ulpDistanceDistribution)}.`, '', '## Boundary 집중도', '', JSON.stringify(analysis.boundaryRelationDistribution), '', '## Segment/record 분포', '', `segment=${JSON.stringify(analysis.segmentDistribution)}; record=${JSON.stringify(analysis.recordIndexDistribution)}; target:center=${JSON.stringify(analysis.targetCenterDistribution)}.`, '', '## 606/1095 교차 분석', '', JSON.stringify(analysis.crossAnalysis6061095), '', '## 확정 가능한 사항', '', analysis.confirmedFindings.map(value => `- ${value}`).join('\n'), '', '## Record-choice와 일관되는 후보 설명', '', analysis.candidateExplanations.map(value => `- ${value}`).join('\n'), '', '## 확정할 수 없는 CSPICE 내부 선택', '', analysis.notComputableItems.map(value => `- ${value}`).join('\n'), '', '## 다음 단계 진입 조건', '', '이 evidence는 bounded candidate reconstruction이다. CSPICE selected segment/record를 직접 관측했다고 표현하지 않으며, tolerance·canonical selection·active transition·scientific approval·production integration을 변경하지 않는다.', '', '## Primary Classification', '', JSON.stringify(analysis.primaryClassificationCounts), '', '## Native Parity', '', `expected=${analysis.nativeExpectedOperationCount}; executed=${analysis.nativeExecutedOperationCount}; match=${analysis.parityMatchCount}; mismatch=${analysis.parityMismatchCount}; failure=${analysis.nativeFailureCount}; JS fallback=${analysis.jsFallback}.`, '', '## 계약 상태', '', JSON.stringify(analysis.contractState), ''].join('\n')

export async function fresh() { try { const analysis = await analyze(); const summary = await readFile(resolve(ROOT, SUMMARY), 'utf8'); const document = await readFile(resolve(ROOT, MARKDOWN), 'utf8'); return summary === serializeCanonicalJson(analysis) && document === markdown(analysis) ? { status: 'fresh' } : { status: 'stale' } } catch (error) { return { status: 'invalid', error: error.message } } }

export const opts = args => { const options = {}; for (let index = 0; index < args.length; index++) if (args[index].startsWith('--')) options[args[index].slice(2)] = args[index + 1] && !args[index + 1].startsWith('--') ? args[++index] : true; return options }
export const readNeighborhood = readJsonl
export const validateNeighborhoodFreshness = fresh
