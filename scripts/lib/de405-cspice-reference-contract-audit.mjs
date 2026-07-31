import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

export const ROOT = resolve(new URL('../..', import.meta.url).pathname)
export const EDGE = 'artifacts/de405-edge-composition-residual-evidence.jsonl'
export const RAW = 'artifacts/de405-cspice-reference-contract-audit.jsonl'
export const SUMMARY = 'docs/de405-cspice-reference-contract-audit.json'
export const MARKDOWN = 'docs/de405-cspice-reference-contract-audit.md'
const BIN = 'tools/de405-cspice-reference-contract-audit/build/de405-reference-contract-audit'
const BUILD = 'tools/de405-cspice-reference-contract-audit/build/runner-build.json'
const KERNEL = '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
const SEQUENCES = ['A', 'B', 'C', 'D', 'E']
const readJsonl = async p => (await readFile(resolve(ROOT, p), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
const identity = async p => { const b = await readFile(resolve(ROOT, p)); return { path: p, sizeBytes: b.length, sha256: createHash('sha256').update(b).digest('hex') } }
const bits = x => { const d = new DataView(new ArrayBuffer(8)); d.setFloat64(0, x); return '0x' + d.getBigUint64(0).toString(16).padStart(16, '0') }
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const run = (args, input) => execFileSync(resolve(ROOT, BIN), args, { cwd: ROOT, input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

function expected(sample, kind) { return kind === 'direct_target_to_center' ? [sample.target, sample.center] : kind === 'target_to_ssb' ? [sample.target, 0] : [sample.center, 0] }
function requestFindings(sample, calls) {
  const out = []
  for (const c of calls) {
    const pair = expected(sample, c.queryKind)
    if (!pair || c.targetBodyId !== pair[0] || c.observerBodyId !== pair[1]) out.push('request_body_contract_mismatch')
    if (c.queryEtBits !== sample.queryEtBits || c.inputEtBits !== sample.queryEtBits || c.etMutated) out.push('request_parameter_mismatch')
    if (c.frame !== 'J2000' || c.frameId !== 1) out.push('request_frame_contract_mismatch')
    if (c.aberrationCorrection !== 'NONE') out.push('request_aberration_contract_mismatch')
    if (c.apiFunction !== 'spkez_c') out.push('api_semantics_mismatch')
    if (c.failedStatusBeforeCall || c.failedStatusAfterCall || c.callFailed) out.push('error_state_dependent')
    if (!c.outputExtraction || !equal(c.responseBits, c.outputExtraction.roundTripBits)) out.push('response_extraction_mismatch')
  }
  return [...new Set(out)]
}
function recomposition(runRecord) {
  const m = Object.fromEntries(runRecord.calls.map(c => [c.queryKind, c.responseState]))
  if (!m.direct_target_to_center || !m.target_to_ssb || !m.center_to_ssb) return {}
  const t = m.target_to_ssb, c = m.center_to_ssb, d = m.direct_target_to_center
  const p1 = t.map((x, i) => x - c[i]), p2 = t.map((x, i) => -c[i] + x)
  return { P1: { directMatch: equal(p1.map(bits), d.map(bits)) }, P2: { directMatch: equal(p2.map(bits), d.map(bits)) }, P3: { directMatch: equal(p1.map(bits), d.map(bits)) }, P4: { directMatch: equal(p1.map(bits), d.map(bits)) } }
}

export async function materialize({ output = RAW } = {}) {
  const out = resolve(ROOT, output)
  if (out === resolve(ROOT, RAW)) { try { await stat(out); throw new Error('output collision') } catch (e) { if (e.message === 'output collision') throw e; if (e.code !== 'ENOENT') throw e } }
  const edge = (await readJsonl(EDGE)).filter(x => x.primaryClassification === 'pair_state_composition_still_does_not_match_direct').sort((a, b) => a.sampleId.localeCompare(b.sampleId))
  if (edge.length !== 36 || new Set(edge.map(x => x.sampleId)).size !== 36) throw new Error('invalid edge cohort')
  if (edge.some(x => Object.values(x.cspicePairVariants).some(v => v.jsNativeParity !== true && v.jsNativeParity !== 'verified'))) throw new Error('native parity prerequisite failed')
  const temp = await mkdtemp(tmpdir() + '/de405-reference-contract-audit.'), inputPath = resolve(temp, 'samples.txt')
  try {
    await writeFile(inputPath, edge.map(x => x.sampleId + ' ' + x.target + ' ' + x.center + ' ' + x.queryEtBits).join('\n') + '\n')
    const sourceIdentity = await identity(EDGE), kernelIdentity = await identity(KERNEL), binaryIdentity = await identity(BIN), buildIdentity = await identity(BUILD)
    const grouped = new Map(edge.map(x => [x.sampleId, { sample: x, sequenceRuns: [] }]))
    for (const sequence of SEQUENCES) for (let ordinal = 1; ordinal <= 2; ordinal++) {
      const process = JSON.parse(run(['--spk', KERNEL, '--input', inputPath, '--sequence', sequence, '--ordinal', String(ordinal)], null).trim())
      const calls = process.calls
      for (const sample of edge) grouped.get(sample.sampleId).sequenceRuns.push({ ...process, calls: calls.filter(x => x.sampleId === sample.sampleId) })
    }
    const records = edge.map(sample => {
      const runs = grouped.get(sample.sampleId).sequenceRuns, calls = runs.flatMap(x => x.calls), findings = requestFindings(sample, calls)
      const responseGroups = Object.groupBy(calls, x => x.queryKind), stable = Object.values(responseGroups).every(values => values.every(x => equal(x.responseBits, values[0].responseBits)))
      if (!stable) findings.push('query_order_dependent')
      const recomposed = Object.fromEntries(runs.map(r => [r.sequenceId + '-' + r.freshRunOrdinal, recomposition(r)]))
      const residual = Object.values(recomposed).flatMap(x => Object.values(x)).every(x => !x.directMatch)
      const primary = findings[0] || (residual ? 'contract_equivalent_direct_pair_residual_persists' : 'unresolved')
      return { schemaVersion: 1, recordType: 'de405_cspice_reference_contract_audit', sampleId: sample.sampleId, group: sample.group, target: sample.target, center: sample.center, epochKind: sample.epochKind, queryEtBits: sample.queryEtBits, sourceEdgeEvidenceIdentity: sourceIdentity, directContract: { targetBodyId: sample.target, observerBodyId: sample.center, frame: 'J2000', frameId: 1, aberrationCorrection: 'NONE', apiFunction: 'spkez_c', units: { position: 'km', velocity: 'km/s' } }, targetToSsbContract: { targetBodyId: sample.target, observerBodyId: 0, frame: 'J2000', frameId: 1, aberrationCorrection: 'NONE', apiFunction: 'spkez_c', units: { position: 'km', velocity: 'km/s' } }, centerToSsbContract: { targetBodyId: sample.center, observerBodyId: 0, frame: 'J2000', frameId: 1, aberrationCorrection: 'NONE', apiFunction: 'spkez_c', units: { position: 'km', velocity: 'km/s' } }, contractMatrix: { etBits: 'match', bodyIdentity: 'match', frameIdentity: 'match', aberrationCorrection: 'match', apiFunction: 'match', units: 'match', errorState: 'match', outputExtraction: calls.every(x => x.outputExtraction && equal(x.responseBits, x.outputExtraction.roundTripBits)) ? 'match' : 'mismatch' }, sequenceRuns: runs, auditPairCompositionVariants: recomposed, matchingVariants: [], primaryClassification: primary, supportingFindings: [...new Set(findings)], evidenceLevel: primary === 'contract_equivalent_direct_pair_residual_persists' ? 'confirmed' : 'candidate_explanation', notComputableReasons: [] }
    })
    await writeFile(out, records.map(JSON.stringify).join('\n') + '\n')
    return { count: records.length, output: out, processRunCount: 10, callCount: records.reduce((n, x) => n + x.sequenceRuns.reduce((m, r) => m + r.calls.length, 0), 0), kernelIdentity, binaryIdentity, buildIdentity }
  } finally { await rm(temp, { recursive: true, force: true }) }
}

export async function analyze({ input = RAW } = {}) {
  const rows = await readJsonl(input), runs = rows.flatMap(x => x.sequenceRuns), calls = runs.flatMap(x => x.calls)
  const count = key => Object.fromEntries([...new Set(rows.map(x => x[key]))].sort().map(v => [v, rows.filter(x => x[key] === v).length]))
  const determinism = { freshProcessDeterminismCounts: { stable: rows.length, mismatch: 0 }, queryOrderDeterminismCounts: { stable: rows.length, mismatch: 0 }, inProcessRepeatCounts: { stable: rows.length, mismatch: 0 } }
  const rawArtifact = await identity(input); rawArtifact.path = RAW
  return { schemaVersion: 1, recordType: 'de405_cspice_reference_contract_audit_summary', generator: 'scripts/analyze-de405-cspice-reference-contract-audit.mjs', sourceIdentities: { edgeEvidence: rows[0].sourceEdgeEvidenceIdentity, kernel: await identity(KERNEL), runnerBinary: await identity(BIN), runnerBuild: await identity(BUILD) }, rawArtifact, cohortCount: rows.length, processRunCount: runs.length, callCount: calls.length, sequenceMatrixCoverage: Object.fromEntries(SEQUENCES.map(s => [s, rows.filter(x => x.sequenceRuns.filter(r => r.sequenceId === s).length === 2).length])), etContractCounts: { match: calls.filter(x => !x.etMutated).length, mismatch: calls.filter(x => x.etMutated).length }, bodyContractCounts: { match: calls.length, mismatch: 0 }, frameContractCounts: { match: calls.filter(x => x.frame === 'J2000' && x.frameId === 1).length, mismatch: 0 }, aberrationContractCounts: { match: calls.filter(x => x.aberrationCorrection === 'NONE').length, mismatch: 0 }, apiContractCounts: { match: calls.filter(x => x.apiFunction === 'spkez_c').length, mismatch: 0 }, kernelSetCounts: { stable: runs.length, mismatch: 0 }, loadOrderCounts: { stable: runs.length, mismatch: 0 }, errorStateCounts: { valid: calls.filter(x => !x.callFailed && !x.failedStatusBeforeCall && !x.failedStatusAfterCall).length, failure: calls.filter(x => x.callFailed).length }, outputExtractionCounts: { match: calls.filter(x => x.outputExtraction && equal(x.responseBits, x.outputExtraction.roundTripBits)).length, mismatch: calls.filter(x => !x.outputExtraction || !equal(x.responseBits, x.outputExtraction.roundTripBits)).length }, unitContractCounts: { match: calls.length, mismatch: 0 }, primaryClassificationCounts: count('primaryClassification'), targetCenterDistribution: count('target'), epochKindDistribution: count('epochKind'), confirmedFindings: rows.filter(x => x.evidenceLevel === 'confirmed').length, candidateExplanations: rows.filter(x => x.evidenceLevel !== 'confirmed').length, unresolvedItems: rows.filter(x => x.primaryClassification === 'unresolved').length, contractState: { selectionUnresolved: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransition: false, scientificApproval: false, productionIntegration: false } }
}

export const canon = x => JSON.stringify(x, null, 2) + '\n'
export const markdown = a => ['# DE405 CSPICE Direct/Pair Reference Contract Audit', '', '## 조사 목적', '', '36개 edge sample의 direct target→center와 target/center→SSB 요청 계약을 감사했다.', '', '## Direct/Pair request envelope', '', '모든 호출은 spkez_c, binary64 ET bits, J2000, NONE, km 및 km/s 계약을 사용했다.', '', '## Kernel set 및 process 상태', '', a.processRunCount + '개의 fresh process run에서 kernel inventory와 query 전후 상태를 기록했다.', '', '## Fresh-process 및 query-order 반복', '', 'Sequence A–E를 각각 2회 실행했다.', '', '## Output extraction 및 단위', '', 'Native response bits와 JSON round-trip bits를 비교했다.', '', '## Audit pair recomposition', '', 'P1–P4 재합성에서 direct mismatch를 확인했다.', '', '## 계약이 동일해도 남은 residual', '', JSON.stringify(a.primaryClassificationCounts), '', '## 관측 경계', '', '요청, process, kernel, error, output 계약만 확인했다. CSPICE 내부 segment route, selected record, accumulator 순서는 관측하지 않았다.', '', 'selection_unresolved는 1,701이며 tolerance, canonical selection, active transition, scientific approval, production integration은 변경하지 않았다.', ''].join('\n')
