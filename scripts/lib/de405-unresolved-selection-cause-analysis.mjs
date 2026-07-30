import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'

export const DEFAULT_CAUSE_INPUTS = Object.freeze({
  breakdown: 'artifacts/de405-jpl-cspice-unresolved-selection-breakdown.json',
  classifications: 'artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl',
  candidateEvidence: 'artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl'
})
export const DEFAULT_CAUSE_OUTPUT = 'docs/de405-unresolved-selection-cause-analysis.json'
export const FINDING_STATUSES = Object.freeze(['confirmed', 'strong_correlation', 'candidate_explanation', 'not_computable', 'unresolved'])

export function parseCliOptions(args) {
  const options = {}
  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    if (!key.startsWith('--')) continue
    const name = key.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    options[name] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true
  }
  return options
}

export async function inspectFileIdentity(filePath, { cwd = process.cwd() } = {}) {
  const absolutePath = isAbsolute(filePath) ? filePath : resolve(cwd, filePath)
  const content = await readFile(absolutePath)
  const fileStat = await stat(absolutePath)
  const text = content.toString('utf8')
  return {
    path: relative(cwd, absolutePath), absolutePath, sizeBytes: fileStat.size,
    sha256: createHash('sha256').update(content).digest('hex'),
    lineCount: filePath.endsWith('.jsonl') ? text.trim().split('\n').filter(Boolean).length : 1,
    text
  }
}

function increment(map, key) { map[key] = (map[key] || 0) + 1 }
function sortedMap(map) { return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))) }
function percentiles(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const at = p => { const x = (sorted.length - 1) * p; const lo = Math.floor(x); const hi = Math.ceil(x); return sorted[lo] + (sorted[hi] - sorted[lo]) * (x - lo) }
  return { min: sorted[0], p50: at(.5), p95: at(.95), p99: at(.99), max: sorted.at(-1) }
}
function bits(value) { const v = new DataView(new ArrayBuffer(8)); v.setFloat64(0, value); return v.getBigUint64(0) }
function ulpDistance(a, b) { const normal = n => { const x = bits(n); return (x >> 63n) === 0n ? x + 0x8000000000000000n : ~x }; return Number(normal(a) > normal(b) ? normal(a) - normal(b) : normal(b) - normal(a)) }
function boundaryRelation(query, boundary) { return query === boundary ? 'exact' : query < boundary ? 'before' : 'after' }
function representative(rows) {
  const sorted = [...rows].sort((a, b) => a.sampleId.localeCompare(b.sampleId))
  const max = [...rows].sort((a, b) => b.positionResidualNormKm - a.positionResidualNormKm || a.sampleId.localeCompare(b.sampleId))[0]
  return [sorted[0], max].map(row => ({ sampleId: row.sampleId, queryEt: row.queryEt, epochKind: row.epochKind, targetCenter: row.targetCenter, jplCandidateId: row.jplCandidateId, cspiceCandidateIds: row.cspiceCandidateIds, positionResidualNormKm: row.positionResidualNormKm, velocityResidualNormKmPerSec: row.velocityResidualNormKmPerSec, sharedCspiceBoundaryEt: row.sharedCspiceBoundaryEt, deltaEtToSharedCspiceBoundarySeconds: row.deltaEtToSharedCspiceBoundarySeconds, ulpDistanceToSharedCspiceBoundary: row.ulpDistanceToSharedCspiceBoundary }))
}

function analyzeGroup(name, rows) {
  const targetCenter = {}, epochKind = {}, jplRelation = {}, cspiceCandidateCounts = {}, cspiceSelectedCounts = {}, sharedBoundaryRelation = {}, candidateStateBits = {}, cspicePatterns = {}, trigger = { position_only: 0, velocity_only: 0, position_and_velocity: 0, neither: 0 }
  const boundaryDeltas = [], boundaryUlps = [], normalized = []
  for (const row of rows) {
    increment(targetCenter, `${row.target}:${row.center}`); increment(epochKind, row.epochKind)
    const jpl = row.sources.jpl.candidates[0]; const cspice = row.sources.cspice.candidates
    const position = row.comparison.targetCenterResidual.positionVectorNormKm; const velocity = row.comparison.targetCenterResidual.velocityVectorNormKmPerSec
    const selectedCspice = cspice.filter(x => x.selected).length
    increment(cspiceCandidateCounts, String(cspice.length)); increment(cspiceSelectedCounts, String(selectedCspice)); increment(candidateStateBits, cspice.every(x => x.bitwiseStateMatch) ? 'all_candidates_bitwise_match_reference' : 'not_all_candidates_bitwise_match_reference')
    const jRel = jpl ? (row.queryEt === jpl.startEt ? 'at_start' : row.queryEt === jpl.endEt ? 'at_end' : row.queryEt > jpl.startEt && row.queryEt < jpl.endEt ? 'inside' : 'outside') : 'missing'
    increment(jplRelation, jRel)
    const pair = cspice.length === 2 && cspice[0].segmentId === cspice[1].segmentId && cspice[0].endEt === cspice[1].startEt
    const boundary = pair ? cspice[0].endEt : null
    const relation = pair ? boundaryRelation(row.queryEt, boundary) : 'not_a_two_record_shared_boundary'
    increment(sharedBoundaryRelation, relation)
    const pattern = pair ? `${cspice[0].segmentId}:adjacent_records` : `${cspice.length}_candidates_nonadjacent_or_unknown`
    increment(cspicePatterns, pattern)
    if (pair) { boundaryDeltas.push(row.queryEt - boundary); boundaryUlps.push(ulpDistance(row.queryEt, boundary)) }
    const pos = position > 0; const vel = velocity > 0
    increment(trigger, pos && vel ? 'position_and_velocity' : pos ? 'position_only' : vel ? 'velocity_only' : 'neither')
    normalized.push({ sampleId: row.sampleId, queryEt: row.queryEt, epochKind: row.epochKind, targetCenter: `${row.target}:${row.center}`, jplCandidateId: jpl?.candidateId ?? null, cspiceCandidateIds: cspice.map(x => x.candidateId), positionResidualNormKm: position, velocityResidualNormKmPerSec: velocity, sharedCspiceBoundaryEt: boundary, deltaEtToSharedCspiceBoundarySeconds: boundary === null ? null : row.queryEt - boundary, ulpDistanceToSharedCspiceBoundary: boundary === null ? null : ulpDistance(row.queryEt, boundary) })
  }
  return {
    classification: name, count: rows.length, distributions: { targetCenter: sortedMap(targetCenter), epochKind: sortedMap(epochKind), trigger: sortedMap(trigger) },
    selectionAndBoundary: { jplSelectedCandidateCount: rows.every(r => r.sources.jpl.candidates.filter(x => x.selected).length === 1) ? 1 : 'not_uniform', jplSelectedCandidateRelationToItsRecordedInterval: sortedMap(jplRelation), cspiceCandidateCount: sortedMap(cspiceCandidateCounts), cspiceSelectedCandidateCountRecorded: sortedMap(cspiceSelectedCounts), cspiceCandidateStateBits: sortedMap(candidateStateBits), cspiceRecordPattern: sortedMap(cspicePatterns), sharedCspiceRecordBoundaryRelation: sortedMap(sharedBoundaryRelation), deltaEtToSharedCspiceRecordBoundarySeconds: boundaryDeltas.length ? percentiles(boundaryDeltas) : null, ulpDistanceToSharedCspiceRecordBoundary: boundaryUlps.length ? percentiles(boundaryUlps) : null },
    residuals: { positionNormKm: percentiles(normalized.map(x => x.positionResidualNormKm)), velocityNormKmPerSec: percentiles(normalized.map(x => x.velocityResidualNormKmPerSec)) },
    representativeSamples: representative(normalized)
  }
}

export async function runUnresolvedSelectionCauseAnalysis(inputPaths = {}, { cwd = process.cwd() } = {}) {
  const sources = {}
  for (const [role, path] of Object.entries(DEFAULT_CAUSE_INPUTS)) sources[role] = await inspectFileIdentity(inputPaths[role] || path, { cwd })
  const breakdown = JSON.parse(sources.breakdown.text); const classifications = sources.classifications.text.trim().split('\n').filter(Boolean).map(JSON.parse); const evidence = sources.candidateEvidence.text.trim().split('\n').filter(Boolean).map(JSON.parse)
  const classified = new Map(); const evidenceMap = new Map(); const duplicates = { classifications: 0, candidateEvidence: 0 }
  for (const row of classifications) { if (classified.has(row.sampleId)) duplicates.classifications++; classified.set(row.sampleId, row.classification) }
  for (const row of evidence) { if (evidenceMap.has(row.sampleId)) duplicates.candidateEvidence++; evidenceMap.set(row.sampleId, row) }
  const groups = { state_equivalent_selection_different: [], candidate_state_different: [] }; const missing = []; const extra = []
  for (const [id, kind] of classified) { const row = evidenceMap.get(id); if (!row) { missing.push(id); continue } if (groups[kind]) groups[kind].push(row) }
  for (const id of evidenceMap.keys()) if (!classified.has(id)) extra.push(id)
  const inv = { totalUnresolvedCount: classified.size, stateEquivalentSelectionDifferentCount: groups.state_equivalent_selection_different.length, candidateStateDifferentCount: groups.candidate_state_different.length, crossGroupOverlap: 0, duplicateClassifications: duplicates.classifications, duplicateCandidateEvidence: duplicates.candidateEvidence, missingCandidateEvidence: missing.length, extraCandidateEvidence: extra.length }
  if (inv.totalUnresolvedCount !== 1701 || inv.stateEquivalentSelectionDifferentCount !== 606 || inv.candidateStateDifferentCount !== 1095 || Object.values(inv).some(v => typeof v === 'number' && v < 0) || missing.length || extra.length || duplicates.classifications || duplicates.candidateEvidence) throw new Error(`unresolved input invariant failed: ${JSON.stringify(inv)}`)
  const groupOne = analyzeGroup('state_equivalent_selection_different', groups.state_equivalent_selection_different); const groupTwo = analyzeGroup('candidate_state_different', groups.candidate_state_different)
  if (groupTwo.distributions.epochKind.next_up_knot !== 547 || groupTwo.distributions.epochKind.next_down_knot !== 548 || groupTwo.distributions.trigger.position_only !== 0 || groupTwo.distributions.trigger.velocity_only !== 9 || groupTwo.distributions.trigger.position_and_velocity !== 1086 || groupTwo.distributions.trigger.neither !== 0) throw new Error('candidate_state_different invariant failed')
  return {
    schemaVersion: 1, recordType: 'de405_unresolved_selection_cause_analysis', generator: 'scripts/analyze-de405-unresolved-selection-cause.mjs',
    sources: Object.fromEntries(Object.entries(sources).map(([role, value]) => [role, { path: value.path, sizeBytes: value.sizeBytes, sha256: value.sha256, lineCount: value.lineCount }])),
    invariants: inv, priorBreakdownIdentityMatches: breakdown.invariants?.totalUnresolvedCount === 1701 && breakdown.invariants?.groupCounts?.state_equivalent_selection_different === 606 && breakdown.invariants?.groupCounts?.candidate_state_different === 1095,
    groups: { state_equivalent_selection_different: groupOne, candidate_state_different: groupTwo },
    findings: {
      confirmed: ['The input population is exactly 1,701, split into 606 state_equivalent_selection_different and 1,095 candidate_state_different with no missing or extra candidate-evidence rows.', 'Each evidence row records exactly one selected JPL candidate; CSPICE candidate state bits match its recorded reference for every candidate in both groups.', 'candidate_state_different has 547 next_up_knot and 548 next_down_knot rows, with no exact_knot row; its trigger distribution is 0 position-only, 9 velocity-only, 1,086 position-and-velocity, 0 neither.'],
      strong_correlation: ['All 1,095 candidate_state_different rows are one representable IEEE-754 step from their recorded shared CSPICE record boundary, split by next_up_knot and next_down_knot direction.', 'state_equivalent_selection_different and candidate_state_different remain disjoint classifications with materially different residual distributions.'],
      candidate_explanation: ['The directional one-ULP boundary concentration is consistent with source-specific record/subinterval selection or evaluation behavior around logical Chebyshev record knots, but it does not by itself prove a segment-boundary defect or identify a canonical selection.'],
      not_computable: ['A CSPICE selected record identity is not recorded for these ambiguous rows (all recorded CSPICE candidates have selected:false), so selected-record disagreement cannot be directly measured.', 'Bitwise JPL-to-CSPICE state identity is not computable because the JPL candidate evidence has numeric state vectors but no component-bit representation.', 'SPK segment-directory boundary distance is not established by record start/end fields alone; this report only computes explicitly recorded shared record boundaries.'],
      unresolved: ['The source-specific mechanism that produces the non-equivalent JPL/CSPICE states at the 1,095 directional knot-adjacent samples remains unresolved.', 'selection_unresolved=1701 remains an active blocker.']
    },
    contractState: { selectionUnresolvedBlockerActive: true, selectionUnresolvedCount: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransitionPerformed: false, scientificApproval: false }
  }
}

export function serializeCanonicalJson(value) { return JSON.stringify(value, null, 2) + '\n' }
export async function validateUnresolvedSelectionCauseAnalysisFreshness(outputPath = DEFAULT_CAUSE_OUTPUT, inputPaths = DEFAULT_CAUSE_INPUTS, { cwd = process.cwd() } = {}) {
  let expected; try { expected = serializeCanonicalJson(await runUnresolvedSelectionCauseAnalysis(inputPaths, { cwd })) } catch (error) { return { status: 'invalid', fresh: false, error: error.message, mismatches: [] } }
  let actual; try { actual = (await inspectFileIdentity(outputPath, { cwd })).text } catch (error) { return { status: 'invalid', fresh: false, error: error.message, mismatches: [] } }
  const expectedSha256 = createHash('sha256').update(expected).digest('hex'); const actualSha256 = createHash('sha256').update(actual).digest('hex')
  return { status: actual === expected ? 'fresh' : 'stale', fresh: actual === expected, expectedSha256, actualSha256, mismatches: actual === expected ? [] : [{ source: 'output', field: 'canonical_bytes', recorded: actualSha256, actual: expectedSha256 }] }
}
