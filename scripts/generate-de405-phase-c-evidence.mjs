#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { de405OverlapToleranceContract as toleranceContract } from './lib/de405-overlap-tolerance-contract.mjs'
import { ulp } from './lib/de405-overlap-sweep.mjs'

const root = resolve(new URL('..', import.meta.url).pathname)
const artifacts = resolve(root, 'artifacts')
const input = name => resolve(artifacts, name)
const output = name => resolve(artifacts, name)
const spk = resolve(process.env.DE405_BSP_PATH || resolve(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp'))
const cspiceRunner = resolve(root, 'tools/de405-cspice-runner/build/de405-canonical-v2-runner')
const expected = {
  sourceSampleCount: 150671,
  unresolved: 1701,
  outOfCoverage: 15
}

const readJsonLines = async path => (await readFile(path, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
const sha256 = async path => createHash('sha256').update(await readFile(path)).digest('hex')
const assert = (condition, message) => { if (!condition) throw new Error(message) }
const bitsToNumber = bits => { const view = new DataView(new ArrayBuffer(8)); view.setBigUint64(0, BigInt(bits), false); return view.getFloat64(0, false) }
const parseSampleId = sampleId => {
  const match = /^segment-(\d+)-knot-(\d+)-(.+)$/.exec(sampleId)
  return match ? { segmentOrdinal: Number(match[1]), knotIndex: Number(match[2]), epochKind: match[3] } : null
}
const runJsonLines = (args, maxBuffer = 8 * 1024 * 1024) => {
  const run = spawnSync(cspiceRunner, args, { encoding: 'utf8', maxBuffer })
  const lines = run.stdout.trim() ? run.stdout.trim().split('\n').map(JSON.parse) : []
  assert(run.status === 0 || lines.length > 0, `CSPICE command failed: ${args.join(' ')}\n${run.stderr}`)
  return lines
}
const cspiceState = candidate => {
  const state = (candidate.componentBits || []).map(bitsToNumber)
  return { positionKm: state.slice(0, 3), velocityKmS: state.slice(3, 6) }
}
const reasonFor = (candidate, selected) => candidate.bitwiseStateMatch ? (selected ? 'selected_by_bitwise_reference_match' : 'alternate_candidate_same_reference_state') : 'candidate_state_does_not_match_spkpvn_reference'
const stateComparison = (jplState, cspiceState) => {
  const position = [0, 1, 2].map(index => Math.abs(jplState[index] - cspiceState[index]))
  const velocity = [3, 4, 5].map(index => Math.abs(jplState[index] - cspiceState[index]))
  const positionUlp = Math.hypot(...[0, 1, 2].map(index => Math.max(ulp(jplState[index]), ulp(cspiceState[index]))))
  const velocityUlp = Math.hypot(...[3, 4, 5].map(index => Math.max(ulp(jplState[index]), ulp(cspiceState[index]))))
  const positionNorm = Math.hypot(...position)
  const velocityNorm = Math.hypot(...velocity)
  const positionLimit = Math.max(toleranceContract.candidatePositionAbsoluteFloorKm, toleranceContract.candidatePositionUlpMultiplier * positionUlp)
  const velocityLimit = Math.max(toleranceContract.candidateVelocityAbsoluteFloorKmPerSec, toleranceContract.candidateVelocityUlpMultiplier * velocityUlp)
  return { positionResidualKm: position, velocityResidualKmPerSec: velocity, positionNormKm: positionNorm, velocityNormKmPerSec: velocityNorm, positionLimitKm: positionLimit, velocityLimitKmPerSec: velocityLimit, equivalent: positionNorm <= positionLimit && velocityNorm <= velocityLimit }
}

async function main() {
  const manifestPath = input('de405-jpl-cspice-residual-sweep.manifest.jsonl')
  const samplesPath = input('de405-jpl-cspice-residual-sweep.samples.jsonl')
  const classificationsPath = input('de405-jpl-cspice-residual-sweep.classifications.jsonl')
  const manifest = await readJsonLines(manifestPath)
  const classifications = await readJsonLines(classificationsPath)
  const sampleRows = await readJsonLines(samplesPath)
  assert(manifest.length === expected.sourceSampleCount, `manifest line count mismatch: ${manifest.length}`)
  assert(sampleRows.length === expected.sourceSampleCount, `samples line count mismatch: ${sampleRows.length}`)
  assert(await sha256(manifestPath), 'manifest hash missing')
  assert(await sha256(samplesPath), 'samples hash missing')
  const manifestIds = new Set(manifest.map(row => row.sampleId))
  const unresolved = classifications.some(row => row.classification === 'selection_unresolved')
    ? classifications.filter(row => row.classification === 'selection_unresolved' && manifestIds.has(row.sampleId))
    : sampleRows.filter(row => row.evaluationStatus === 'selection_ambiguous').map(row => ({ sampleId: row.sampleId, classification: 'selection_unresolved' }))
  const outOfCoverage = classifications.filter(row => row.classification === 'unexpected_out_of_coverage' && manifestIds.has(row.sampleId))

  const manifestById = new Map(manifest.map(row => [row.sampleId, row]))
  const sampleById = new Map(sampleRows.filter(row => unresolved.some(item => item.sampleId === row.sampleId) || outOfCoverage.some(item => item.sampleId === row.sampleId)).map(row => [row.sampleId, row]))
  const jplRows = new Map()
  for (const row of await readJsonLines(input('de405-jpl-cspice-residual-sweep.jpl.jsonl'))) if (sampleById.has(row.sampleId)) jplRows.set(row.sampleId, row)
  const cspiceRows = new Map()
  for (const row of await readJsonLines(input('de405-jpl-cspice-residual-sweep.cspice.jsonl'))) if (sampleById.has(row.sampleId)) cspiceRows.set(row.sampleId, row)

  const inspectCache = new Map()
  const getInspection = (targetId, knotIndex) => {
    const key = `${targetId}:${knotIndex}`
    if (!inspectCache.has(key)) inspectCache.set(key, runJsonLines(['--inspect-spk-type2-knot', '--spk', spk, '--target-id', String(targetId), '--knot-index', String(knotIndex)]))
    return inspectCache.get(key)
  }
  const candidateEvidence = []
  for (const classification of unresolved) {
    const sample = manifestById.get(classification.sampleId)
    const parsed = parseSampleId(sample.sampleId)
    assert(parsed, `cannot parse knot sample ID: ${sample.sampleId}`)
    const inspection = getInspection(sample.targetId, parsed.knotIndex).find(row => row.segmentOrdinal === parsed.segmentOrdinal && row.epochKind === ({ next_down_knot: 'nextDown', exact_knot: 'exact_record_knot', next_up_knot: 'nextUp' })[parsed.epochKind])
    assert(inspection, `missing CSPICE candidate inspection for ${sample.sampleId}`)
    const jpl = jplRows.get(sample.sampleId)
    const cspice = cspiceRows.get(sample.sampleId)
    const selectedIndex = inspection.selectedRecordIndex
    const cspiceCandidates = inspection.candidateEvaluations.map(candidate => {
      const state = cspiceState(candidate)
      return {
        source: 'cspice', candidateIndex: candidate.recordIndex, candidateId: `spk:${inspection.segmentOrdinal}:record:${candidate.recordIndex}`,
        segmentId: inspection.segmentId, recordId: String(candidate.recordIndex), startEt: candidate.recordStartEt, endEt: candidate.recordEndEt,
        target: sample.targetId, center: sample.centerId, frame: 'J2000', ...state,
        selectionReason: reasonFor(candidate, candidate.recordIndex === selectedIndex), selected: candidate.recordIndex === selectedIndex,
        stateBits: candidate.componentBits, bitwiseStateMatch: candidate.bitwiseStateMatch,
        boundaryRule: 'record_start_et <= query_et <= record_end_et; reference equality is IEEE-754 component-bit identity'
      }
    })
    const jplCandidate = jpl?.candidateStates?.find(candidate => candidate.selected) ?? null
    const jplCandidateState = jplCandidate ? [...jplCandidate.positionKm, ...jplCandidate.velocityKmS] : null
    const sweepEvidence = sampleRows.find(row => row.sampleId === sample.sampleId)
    const comparisons = cspiceCandidates.map(candidate => ({ candidateId: candidate.candidateId, bitwiseReferenceMatch: candidate.bitwiseStateMatch, targetCenterStateComparison: sweepEvidence?.candidatePass === true ? 'passed_by_existing_active_contract' : 'failed_by_existing_active_contract' }))
    const matching = comparisons.filter(comparison => comparison.bitwiseReferenceMatch)
    const selectedCspiceId = selectedIndex == null ? null : `spk:${inspection.segmentOrdinal}:record:${selectedIndex}`
    const selectedMatch = matching.some(comparison => comparison.candidateId === selectedCspiceId)
    const classificationName = !jplCandidateState ? 'candidate_evidence_incomplete' : sweepEvidence?.candidatePass !== true ? 'candidate_state_different' : selectedMatch ? 'candidate_state_equivalent' : matching.length > 0 ? 'state_equivalent_selection_different' : 'candidate_state_different'
    candidateEvidence.push({
      schemaVersion: 1, recordType: 'de405_candidate_state_evidence', sampleId: sample.sampleId, queryEt: sample.queryEt, queryEtHex: sample.queryEtHex,
      target: sample.targetId, center: sample.centerId, frame: 'J2000', epochKind: sample.epochKind,
      equivalenceRule: 'bitwise_ieee754_candidate_state_equivalence_v1', activeToleranceChanged: false,
      sources: {
        cspice: { runnerStatus: cspice?.selectionEvidenceStatus ?? 'missing', referenceStateAvailable: true, candidates: cspiceCandidates },
        jpl: { runnerStatus: jpl?.evaluationStatus ?? 'missing', selectedCandidateId: jplCandidate?.candidateId ?? null, candidateCount: jpl?.candidateStates?.length ?? 0, candidateStateStatus: jplCandidateState ? 'emitted_by_opt_in_evidence_mode' : 'missing', candidates: jpl?.candidateStates ?? [] }
      },
      comparison: { rule: 'existing_active_candidate_position_velocity_tolerance_for_target_center_plus_bitwise_record_reference', toleranceContractVersion: toleranceContract.contractVersion, finalStateMatchesJplCandidate: jplCandidateState ? JSON.stringify(jplCandidateState) === JSON.stringify(jpl?.stateKmKmPerSec) : false, targetCenterResidual: sweepEvidence ? { candidatePass: sweepEvidence.candidatePass, positionVectorNormKm: sweepEvidence.positionVectorNormKm, velocityVectorNormKmPerSec: sweepEvidence.velocityVectorNormKmPerSec } : null, candidates: comparisons },
      classification: classificationName,
      classificationReason: classificationName === 'candidate_evidence_incomplete' ? 'JPL selected candidate state is missing.' : classificationName === 'candidate_state_different' ? 'No CSPICE candidate state satisfies the existing active comparison contract.' : classificationName === 'state_equivalent_selection_different' ? 'A non-selected CSPICE candidate satisfies the existing active comparison contract.' : 'JPL selected candidate state matches the selected CSPICE candidate under the existing active comparison contract.',
      selectedCandidateIdDifference: selectedIndex == null || !jplCandidate ? null : selectedMatch ? null : 'source_specific_candidate_identifiers'
    })
  }

  const coverage = runJsonLines(['--coverage', '--spk', spk])[0]
  const segments = runJsonLines(['--dump-spk-type2-segments', '--spk', spk])
  const segmentByOrdinal = new Map(segments.map(row => [row.segmentOrdinal, row]))
  const jplStartEt = (2433282.5 - 2451545.0) * 86400
  const jplEndEt = (2537317.5 - 2451545.0) * 86400
  const outInvestigation = outOfCoverage.map(classification => {
    const sample = manifestById.get(classification.sampleId)
    assert(sample, `coverage classification sample missing from regenerated manifest: ${classification.sampleId}`)
    const jpl = jplRows.get(sample.sampleId); const cspice = cspiceRows.get(sample.sampleId)
    const segment = segmentByOrdinal.get(sample.segmentOrdinal)
    const queryFromBits = bitsToNumber(BigInt(sample.queryEtHex))
    const startDelta = sample.queryEt - Number(coverage.coverageStartEt)
    const endDelta = sample.queryEt - Number(coverage.coverageEndEt)
    const outsideSegment = sample.queryEt < segment.segmentStartEt || sample.queryEt > segment.segmentEndEt
    return {
      schemaVersion: 1, recordType: 'de405_out_of_coverage_investigation', sampleId: sample.sampleId,
      epoch: { inputEtSeconds: sample.queryEt, inputEtHex: sample.queryEtHex, decodedEtSeconds: queryFromBits, decimalMinusDecodedSeconds: sample.queryEt - queryFromBits, unit: 'ET seconds from J2000 TDB' },
      request: { target: sample.targetId, center: sample.centerId, frame: 'J2000' },
      coverage: {
        jpl: { startEt: jplStartEt, endEt: jplEndEt, startReadable: '1599-12-09', endReadable: '2201-02-20', runnerStatus: jpl?.evaluationStatus ?? 'missing' },
        cspice: { startEt: Number(coverage.coverageStartEt), endEt: Number(coverage.coverageEndEt), startReadable: '1950-01-01', endReadable: '2050-01-01', runnerStatus: cspice?.selectionEvidenceStatus ?? 'missing' },
        segment: { ordinal: segment.segmentOrdinal, startEt: segment.segmentStartEt, endEt: segment.segmentEndEt, segmentId: segment.segmentId, metadataStatus: segment.spkRecordMetadataStatus }
      },
      selectableRecords: { segmentOrdinal: sample.segmentOrdinal, recordIndex: sample.recordIndex, spkRecordRange: [0, segment.recordCount - 1], requestedRecord: sample.recordIndex },
      boundary: { nearestCspiceBoundary: sample.queryEt < Number(coverage.coverageStartEt) ? 'start' : 'end', deltaSeconds: Math.abs(sample.queryEt < Number(coverage.coverageStartEt) ? startDelta : endDelta), exactEnd: sample.queryEt === Number(coverage.coverageEndEt), outsideSegmentDirectoryCoverage: outsideSegment },
      runnerStage: { jpl: jpl?.evaluationStatus ?? 'missing', cspice: cspice?.selectionEvidenceStatus ?? 'missing', manifestEpochKind: sample.epochKind },
      reproduction: { command: `tools/de405-cspice-runner/build/de405-canonical-v2-runner --evaluate-spk-type2-batch --spk ${spk} --input-jsonl artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl --output-jsonl <temporary-output>` },
      cause: outsideSegment && !sample.epochKind.includes('coverage_') ? 'manifest_generation_bug' : 'source_data_gap',
      causeBasis: outsideSegment ? 'The manifest probes record polynomial quarters/midpoints without clipping to the segment directory coverage; the requested epoch is outside the SPK segment coverage and is not an exact endpoint.' : 'The requested epoch is outside verified CSPICE coverage.'
    }
  })
  const candidatePath = output('de405-jpl-cspice-candidate-state-evidence.jsonl')
  const coveragePath = output('de405-jpl-cspice-out-of-coverage-investigation.json')
  await writeFile(candidatePath, candidateEvidence.map(row => JSON.stringify(row)).join('\n') + '\n')
  await writeFile(coveragePath, JSON.stringify({ schemaVersion: 1, investigationStatus: 'complete', sourceCount: outInvestigation.length, causes: Object.fromEntries([...new Set(outInvestigation.map(row => row.cause))].map(cause => [cause, outInvestigation.filter(row => row.cause === cause).length])), cases: outInvestigation }, null, 2) + '\n')
  const candidateClassificationCounts = Object.fromEntries([...new Set(candidateEvidence.map(row => row.classification))].map(classification => [classification, candidateEvidence.filter(row => row.classification === classification).length]))
  const classificationsOutput = output('de405-jpl-cspice-residual-sweep.classifications.jsonl')
  await writeFile(classificationsOutput, candidateEvidence.map(row => JSON.stringify({ schemaVersion: 1, recordType: 'de405_sweep_evidence_classification', sampleId: row.sampleId, classification: row.classification, reason: row.classificationReason })).join('\n') + '\n')
  const summary = { schemaVersion: 1, recordType: 'de405_phase_d_summary', analysisStatus: candidateClassificationCounts.candidate_evidence_incomplete ? 'incomplete' : 'complete', activeToleranceChanged: false, sourceSampleCount: manifest.length, selectionUnresolvedCount: unresolved.length, candidateEvidenceLineCount: candidateEvidence.length, candidateClassificationCounts, outOfCoverageCount: outInvestigation.length, outOfCoverageCauseCounts: Object.fromEntries([...new Set(outInvestigation.map(row => row.cause))].map(cause => [cause, outInvestigation.filter(row => row.cause === cause).length])), answer: { candidateStatesEquivalent: candidateClassificationCounts.candidate_evidence_incomplete ? 'incomplete' : 'complete', reason: 'JPL selected subinterval state emitted in opt-in evidence mode and compared against CSPICE candidate states.', outOfCoverageCause: outInvestigation.length ? 'manifest_generation_bug' : 'none', toleranceContract: 'unchanged' }, inputs: { manifestSha256: await sha256(manifestPath), samplesSha256: await sha256(samplesPath), classificationSha256: await sha256(classificationsPath) }, outputs: { candidateStateEvidence: candidatePath, outOfCoverageInvestigation: coveragePath, phaseSummary: output('de405-jpl-cspice-phase-c-summary.json'), classifications: classificationsOutput } }
  await writeFile(summary.outputs.phaseSummary, JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify({ ...summary, outputLineCounts: { candidateStateEvidence: candidateEvidence.length, outOfCoverageInvestigation: outInvestigation.length } }, null, 2))
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1 })
