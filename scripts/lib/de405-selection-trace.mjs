import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export const TRACE_SCHEMA_VERSION = 1
export const TRACE_GROUPS = Object.freeze(['state_equivalent_selection_different', 'candidate_state_different'])
export const TRACE_SOURCES = Object.freeze(['jpl', 'cspice'])
export const UNAVAILABLE_REASONS = Object.freeze(['api_does_not_expose_selected_record', 'ambiguous_candidate_without_selected_marker', 'source_format_has_no_matching_identity', 'diagnostic_not_implemented', 'not_applicable', 'not_comparable'])
export const CAUSE_LEVELS = Object.freeze(['confirmed', 'strong_correlation', 'candidate_explanation', 'not_computable', 'unresolved'])
export const GROUP_606_MECHANISMS = Object.freeze(['selected_record_confirmed_same', 'selected_record_confirmed_different', 'multiple_records_state_equivalent', 'selection_not_observable', 'identity_not_comparable', 'unresolved'])
export const GROUP_1095_MECHANISMS = Object.freeze(['logical_record_different', 'subinterval_different', 'normalized_time_different', 'coefficient_block_different', 'evaluation_path_different', 'same_trace_state_different', 'selection_not_observable', 'identity_not_comparable', 'unresolved'])

export const DEFAULT_TRACE_PATH = 'artifacts/de405-jpl-cspice-selection-trace.jsonl'
export const DEFAULT_TRACE_SUMMARY_PATH = 'docs/de405-selection-trace-analysis.json'
export const DEFAULT_TRACE_MARKDOWN_PATH = 'docs/de405-selection-trace-analysis.md'
export const DEFAULT_TRACE_INPUTS = Object.freeze({
  breakdown: 'artifacts/de405-jpl-cspice-unresolved-selection-breakdown.json',
  classifications: 'artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl',
  candidateEvidence: 'artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl',
  jplRunnerSource: 'tools/de405-jpl-reader/src/de405_jpl_reader_runner.f',
  cspiceRunnerSource: 'tools/de405-cspice-runner/src/de405_canonical_v2.c',
  jplRunnerBinary: 'tools/de405-jpl-reader/build/de405-jpl-canonical-v2-runner',
  cspiceRunnerBinary: 'tools/de405-cspice-runner/build/de405-canonical-v2-runner',
  jplBinary: 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405',
  spk: '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
})

export function parseCliOptions(args) {
  const options = {}
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    options[key] = args[index + 1] && !args[index + 1].startsWith('--') ? args[++index] : true
  }
  return options
}

export async function fileIdentity(path, { cwd = root } = {}) {
  const absolutePath = resolve(cwd, path)
  const content = await readFile(absolutePath)
  const info = await stat(absolutePath)
  return { path: absolutePath.startsWith(`${cwd}/`) ? absolutePath.slice(cwd.length + 1) : absolutePath, sizeBytes: info.size, sha256: createHash('sha256').update(content).digest('hex') }
}

export function bitsHex(value) {
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value, false)
  return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}`
}

function signedUlpDistance(query, boundary) {
  const ordered = value => {
    const view = new DataView(new ArrayBuffer(8)); view.setFloat64(0, value, false)
    const bits = view.getBigUint64(0, false)
    return bits >> 63n ? ~bits : bits | 0x8000000000000000n
  }
  return (ordered(query) - ordered(boundary)).toString()
}

async function readJsonl(path) {
  const records = []
  const input = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  for await (const line of input) if (line.trim()) records.push(JSON.parse(line))
  return records
}

async function run(command, args, label) {
  return await new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout = []; const stderr = []
    child.stdout.on('data', chunk => stdout.push(chunk)); child.stderr.on('data', chunk => stderr.push(chunk))
    child.on('error', reject)
    child.on('close', code => {
      const result = { code, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }
      if (code !== 0) reject(new Error(`${label} exited ${code}: ${result.stderr.trim()}`))
      else resolveRun(result)
    })
  })
}

function directCandidateBoundary(candidates, queryEt) {
  if (!Array.isArray(candidates) || candidates.length !== 2) return null
  const [previous, next] = candidates
  if (previous.endEt !== next.startEt) return null
  const boundary = previous.endEt
  return {
    sharedBoundaryEt: boundary,
    deltaToPreviousBoundary: queryEt - boundary,
    deltaToNextBoundary: queryEt - boundary,
    signedUlpDistanceToPreviousBoundary: signedUlpDistance(queryEt, boundary),
    signedUlpDistanceToNextBoundary: signedUlpDistance(queryEt, boundary),
    nearestBoundaryKind: queryEt === boundary ? 'exact_shared_candidate_boundary' : queryEt < boundary ? 'next_down_of_shared_candidate_boundary' : 'next_up_of_shared_candidate_boundary'
  }
}

function candidateProjection(candidate) {
  return {
    candidateIdentity: candidate.candidateId ?? null,
    nativeRecordIdentity: candidate.recordId ?? null,
    subintervalIdentity: candidate.subintervalIndex ?? null,
    segmentIdentity: candidate.segmentId ?? null,
    recordStartEt: candidate.startEt ?? null,
    recordEndEt: candidate.endEt ?? null,
    recordStartEtBits: Number.isFinite(candidate.startEt) ? bitsHex(candidate.startEt) : null,
    recordEndEtBits: Number.isFinite(candidate.endEt) ? bitsHex(candidate.endEt) : null,
    bitwiseStateMatch: candidate.bitwiseStateMatch ?? null,
    selectedMarker: candidate.selected ?? null
  }
}

function stateBits(state) {
  if (!Array.isArray(state) || state.length !== 6 || !state.every(Number.isFinite)) throw new Error('runner trace state is not six finite values')
  return state.map(bitsHex)
}

function traceRecord({ source, evidence, runner, runnerIdentity }) {
  const sourceEvidence = evidence.sources[source]
  const candidates = sourceEvidence.candidates || []
  const state = runner.stateKmKmPerSec
  const stateBitValues = stateBits(state)
  const boundary = source === 'cspice' ? directCandidateBoundary(candidates, evidence.queryEt) : null
  const unavailableReason = runner.selectionTrace?.unavailableReason || (source === 'cspice' ? 'api_does_not_expose_selected_record' : 'api_does_not_expose_selected_record')
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    recordType: 'de405_selection_trace',
    source,
    sampleId: evidence.sampleId,
    group: evidence.classification,
    target: evidence.target,
    center: evidence.center,
    epochKind: evidence.epochKind,
    queryEt: evidence.queryEt,
    queryEtBits: bitsHex(evidence.queryEt),
    queryEtHex: evidence.queryEtHex,
    segmentIdentity: null,
    logicalRecordIdentity: null,
    subintervalIdentity: null,
    selectedCandidateIdentity: null,
    candidateCount: candidates.length,
    selectionObservable: false,
    selectionMethod: runner.selectionTrace?.selectionMethod || (source === 'cspice' ? 'cspice_spkez_c_type2_record_not_exposed' : 'official_testeph_state_record_not_exposed'),
    unavailableReason,
    recordStartEt: null,
    recordEndEt: null,
    recordStartEtBits: null,
    recordEndEtBits: null,
    deltaToPreviousBoundary: boundary?.deltaToPreviousBoundary ?? null,
    deltaToNextBoundary: boundary?.deltaToNextBoundary ?? null,
    signedUlpDistanceToPreviousBoundary: boundary?.signedUlpDistanceToPreviousBoundary ?? null,
    signedUlpDistanceToNextBoundary: boundary?.signedUlpDistanceToNextBoundary ?? null,
    nearestBoundaryKind: boundary?.nearestBoundaryKind ?? 'not_observable_at_top_level',
    normalizedTime: null,
    normalizedTimeBits: null,
    normalizedTimeHex: null,
    coefficientBlockIdentity: null,
    positionCoefficientSpan: null,
    velocityCoefficientSpan: null,
    evaluationRoutineIdentity: source === 'jpl' ? 'official_testeph.f:DPLEPH' : 'CSPICE_N0067:spkez_c',
    positionBits: stateBitValues.slice(0, 3),
    velocityBits: stateBitValues.slice(3),
    positionResidual: evidence.comparison.targetCenterResidual.positionVectorNormKm,
    velocityResidual: evidence.comparison.targetCenterResidual.velocityVectorNormKmPerSec,
    runnerBinarySha256: runnerIdentity.sha256,
    candidates: candidates.map(candidateProjection)
  }
}

export async function materializeSelectionTrace({ outputPath = DEFAULT_TRACE_PATH, inputPaths = {}, cwd = root } = {}) {
  const paths = { ...DEFAULT_TRACE_INPUTS, ...inputPaths }
  const absoluteOutput = resolve(cwd, outputPath)
  try { await stat(absoluteOutput); throw new Error(`output already exists: ${outputPath}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
  const evidence = await readJsonl(resolve(cwd, paths.candidateEvidence))
  const classifications = await readJsonl(resolve(cwd, paths.classifications))
  const groups = new Map(classifications.map(row => [row.sampleId, row.classification]))
  if (evidence.length !== 1701 || groups.size !== 1701 || evidence.some(row => groups.get(row.sampleId) !== row.classification)) throw new Error('unresolved selection source population is not the fixed 1,701-row identity')
  const sorted = [...evidence].sort((a, b) => a.sampleId.localeCompare(b.sampleId))
  const temp = await mkdtemp(`${tmpdir()}/de405-selection-trace-input.`)
  try {
    const input = `${temp}/input.jsonl`
    await writeFile(input, sorted.map(row => JSON.stringify({ sampleId: row.sampleId, queryEt: row.queryEt, queryEtHex: row.queryEtHex, targetId: row.target, centerId: row.center, frameId: 1 })).join('\n') + '\n')
    const jplOutput = `${temp}/jpl.jsonl`; const cspiceOutput = `${temp}/cspice.jsonl`
    await run(process.execPath, ['tools/de405-jpl-reader/run.mjs', '--evaluate-et-batch', '--selection-trace', '--binary', paths.jplBinary, '--input-jsonl', input, '--output-jsonl', jplOutput], 'JPL selection trace')
    await run(resolve(cwd, paths.cspiceRunnerBinary), ['--evaluate-spk-type2-batch', '--selection-trace', '--spk', paths.spk, '--input-jsonl', input, '--output-jsonl', cspiceOutput], 'CSPICE selection trace')
    const [jpl, cspice] = await Promise.all([readJsonl(jplOutput), readJsonl(cspiceOutput)])
    if (jpl.length !== sorted.length || cspice.length !== sorted.length) throw new Error('native selection trace output count mismatch')
    const identities = { jpl: await fileIdentity(paths.jplRunnerBinary, { cwd }), cspice: await fileIdentity(paths.cspiceRunnerBinary, { cwd }) }
    const records = []
    for (let index = 0; index < sorted.length; index++) {
      if (jpl[index].sampleId !== sorted[index].sampleId || cspice[index].sampleId !== sorted[index].sampleId) throw new Error('native selection trace sample order mismatch')
      records.push(traceRecord({ source: 'jpl', evidence: sorted[index], runner: jpl[index], runnerIdentity: identities.jpl }))
      records.push(traceRecord({ source: 'cspice', evidence: sorted[index], runner: cspice[index], runnerIdentity: identities.cspice }))
    }
    await writeFile(absoluteOutput, records.map(record => JSON.stringify(record)).join('\n') + '\n')
    return { outputPath: absoluteOutput, sampleCount: sorted.length, traceCount: records.length, sources: await selectionTraceSourceIdentities(paths, { cwd }) }
  } finally { await rm(temp, { recursive: true, force: true }) }
}

export async function selectionTraceSourceIdentities(inputPaths = {}, { cwd = root } = {}) {
  const paths = { ...DEFAULT_TRACE_INPUTS, ...inputPaths }
  return Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([name, path]) => [name, await fileIdentity(path, { cwd })])))
}

export async function readSelectionTrace(path, { cwd = root } = {}) { return readJsonl(resolve(cwd, path)) }

function countBy(values) { const counts = {}; for (const value of values) counts[value] = (counts[value] || 0) + 1; return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))) }
function representative(rows) { return [...rows].sort((a, b) => a.sampleId.localeCompare(b.sampleId)).slice(0, 2).map(row => row.sampleId) }

function validateTrace(records) {
  const pairs = new Map()
  for (const record of records) {
    if (record.schemaVersion !== TRACE_SCHEMA_VERSION || record.recordType !== 'de405_selection_trace') throw new Error('invalid trace schema')
    if (!TRACE_SOURCES.includes(record.source) || !TRACE_GROUPS.includes(record.group)) throw new Error('invalid trace source or group')
    const key = `${record.sampleId}:${record.source}`
    if (pairs.has(key)) throw new Error(`duplicate trace pair: ${key}`)
    pairs.set(key, record)
    if (!record.selectionObservable && !UNAVAILABLE_REASONS.includes(record.unavailableReason)) throw new Error(`invalid unavailable reason: ${record.sampleId}`)
  }
  const samples = new Map()
  for (const record of records) { if (!samples.has(record.sampleId)) samples.set(record.sampleId, []); samples.get(record.sampleId).push(record) }
  if (samples.size !== 1701 || records.length !== 3402 || [...samples.values()].some(pair => pair.length !== 2 || pair[0].source !== 'jpl' || pair[1].source !== 'cspice')) throw new Error('trace coverage is not exactly 1,701 ordered JPL/CSPICE pairs')
  return [...samples.values()].map(pair => ({ jpl: pair[0], cspice: pair[1] }))
}

export async function analyzeSelectionTrace({ inputPath = DEFAULT_TRACE_PATH, inputPaths = {}, cwd = root } = {}) {
  const records = await readSelectionTrace(inputPath, { cwd })
  const pairs = validateTrace(records)
  const rawTraceIdentity = await fileIdentity(inputPath, { cwd })
  const groupPairs = Object.fromEntries(TRACE_GROUPS.map(group => [group, pairs.filter(pair => pair.jpl.group === group && pair.cspice.group === group)]))
  if (groupPairs.state_equivalent_selection_different.length !== 606 || groupPairs.candidate_state_different.length !== 1095) throw new Error('trace group counts changed')
  const group606 = groupPairs.state_equivalent_selection_different
  const group1095 = groupPairs.candidate_state_different
  const candidateBoundaries = group1095.map(pair => pair.cspice).filter(record => record.signedUlpDistanceToPreviousBoundary !== null)
  const exactOneUlp = candidateBoundaries.filter(record => Math.abs(Number(record.signedUlpDistanceToPreviousBoundary)) === 1).length
  const level = text => ({ level: 'confirmed', text })
  const notComputable = text => ({ level: 'not_computable', text })
  return {
    schemaVersion: TRACE_SCHEMA_VERSION,
    recordType: 'de405_selection_trace_analysis',
    generator: 'scripts/analyze-de405-selection-trace.mjs',
    sourceIdentities: await selectionTraceSourceIdentities(inputPaths, { cwd }),
    rawTrace: { path: 'selection-trace.jsonl', sizeBytes: rawTraceIdentity.sizeBytes, sha256: rawTraceIdentity.sha256, recordCount: records.length },
    totalSampleCount: pairs.length,
    totalTraceCount: records.length,
    groupCounts: { state_equivalent_selection_different: group606.length, candidate_state_different: group1095.length },
    observability: { jplObservable: records.filter(record => record.source === 'jpl' && record.selectionObservable).length, cspiceObservable: records.filter(record => record.source === 'cspice' && record.selectionObservable).length, unobservable: records.filter(record => !record.selectionObservable).length },
    comparisons: { logicalRecord: { comparable: 0, different: 0, notComparable: pairs.length }, subinterval: { comparable: 0, different: 0, notComparable: pairs.length }, normalizedTime: { comparable: 0, different: 0, notComparable: pairs.length }, coefficientBlock: { comparable: 0, different: 0, notComparable: pairs.length }, evaluationPath: { comparable: 0, different: 0, notComparable: pairs.length } },
    groups: {
      state_equivalent_selection_different: {
        count: group606.length,
        epochKinds: countBy(group606.map(pair => pair.jpl.epochKind)),
        mechanismCounts: { selection_not_observable: group606.length },
        selectionObservableCount: 0,
        selectionUnobservableCount: group606.length,
        representativeSamples: representative(group606.map(pair => pair.jpl))
      },
      candidate_state_different: {
        count: group1095.length,
        epochKinds: countBy(group1095.map(pair => pair.jpl.epochKind)),
        mechanismCounts: { selection_not_observable: group1095.length },
        selectionUnobservableCount: group1095.length,
        oneUlpSharedCandidateBoundaryCount: exactOneUlp,
        velocityOnlyCount: group1095.filter(pair => pair.jpl.positionResidual === 0 && pair.jpl.velocityResidual > 0).length,
        representativeSamples: representative(group1095.map(pair => pair.jpl))
      }
    },
    findings: {
      confirmed: [level('The trace has exactly 3,402 records for 1,701 samples, preserving the 606/1,095 split.'), level('Both native diagnostic paths reran the sampled states while default selection markers remained unavailable.')],
      strong_correlation: [{ level: 'strong_correlation', text: `${exactOneUlp} of 1,095 candidate_state_different CSPICE traces are one ULP from the recorded shared candidate boundary.` }],
      candidate_explanation: [{ level: 'candidate_explanation', text: 'The directional boundary concentration remains consistent with source-specific selection or evaluation behavior, without proving either mechanism.' }],
      not_computable: [notComputable('Neither native API exposes the actual selected Type 2/JPL logical record marker for these diagnostic calls, so selected-record and normalized-time comparisons are not computable.'), notComputable('Coefficient-block and evaluator-path equality cannot be inferred without an exposed selected record.')],
      unresolved: [{ level: 'unresolved', text: 'selection_unresolved=1701 remains active; no canonical selection, tolerance, or scientific approval transition is made.' }]
    },
    contractState: { selectionUnresolvedBlockerActive: true, selectionUnresolvedCount: 1701, toleranceChanged: false, canonicalSelectionChanged: false, activeTransitionPerformed: false, scientificApproval: false }
  }
}

export function serializeCanonicalJson(value) { return `${JSON.stringify(value, null, 2)}\n` }

export function selectionTraceMarkdown(analysis) {
  const group606 = analysis.groups.state_equivalent_selection_different
  const group1095 = analysis.groups.candidate_state_different
  return [
    '# DE405 selection trace analysis', '', '## 606건 결과', '',
    `- Trace count: ${group606.count * 2}`,
    `- Selection observable: ${group606.selectionObservableCount}`,
    `- Selection unobservable: ${group606.selectionUnobservableCount}`,
    `- Mechanism: selection_not_observable=${group606.mechanismCounts.selection_not_observable}`,
    `- Epochs: exact=${group606.epochKinds.exact_knot}, next-up=${group606.epochKinds.next_up_knot}, next-down=${group606.epochKinds.next_down_knot}`,
    '', '## 1095건 결과', '',
    `- Selection unobservable: ${group1095.selectionUnobservableCount}`,
    `- Mechanism: selection_not_observable=${group1095.mechanismCounts.selection_not_observable}`,
    `- One-ULP shared candidate boundaries: ${group1095.oneUlpSharedCandidateBoundaryCount}`,
    `- next-up / next-down: ${group1095.epochKinds.next_up_knot} / ${group1095.epochKinds.next_down_knot}`,
    '', '## velocity-only 9건 결과', '', `- Velocity-only rows: ${group1095.velocityOnlyCount}`,
    '- No distinct evaluation path is confirmed because selection and coefficient-block inputs are not exposed.',
    '', '## next-up / next-down 대칭성', '',
    'The 1,095 rows retain the recorded 547 next-up / 548 next-down split. This is a strong correlation, not a confirmed mechanism.',
    '', '## selection observability 한계', '',
    'JPL official STATE and CSPICE spkez_c do not expose the actual selected logical Type 2/JPL record marker through the used APIs. Every trace records selectionObservable:false and a machine-readable unavailable reason; no selected record is inferred from candidate equality.',
    '', '## logical record 비교 결과', '', `Comparable: 0. Not comparable: ${analysis.totalSampleCount}.`,
    '', '## normalized time 비교 결과', '', 'Comparable: 0. Normalized time is not attributed to a selected candidate when that candidate is not observable.',
    '', '## evaluation path 비교 결과', '', 'No coefficient-block or evaluator-path equality claim is made.',
    '', '## 확정 가능한 메커니즘', '', 'Only population preservation and trace observability limits are confirmed.',
    '', '## 아직 확정할 수 없는 메커니즘', '', 'Selected-record direction, subinterval equality, normalized-time equality, coefficient-block equality, and evaluator-only divergence remain not computable.',
    '', '## 다음 단계 진입 조건', '', 'A native API or instrumented official-reader/CSPICE build that exposes the actual selected record marker without changing computation is required before promoting a mechanism beyond unresolved.', ''
  ].join('\n')
}

export async function validateSelectionTraceFreshness({ tracePath = DEFAULT_TRACE_PATH, summaryPath = DEFAULT_TRACE_SUMMARY_PATH, markdownPath = DEFAULT_TRACE_MARKDOWN_PATH, inputPaths = {}, cwd = root } = {}) {
  try {
    const analysis = await analyzeSelectionTrace({ inputPath: tracePath, inputPaths, cwd })
    const expected = serializeCanonicalJson(analysis)
    const actual = await readFile(resolve(cwd, summaryPath), 'utf8')
    if (actual !== expected) return { status: 'stale' }
    if (markdownPath) {
      const markdown = await readFile(resolve(cwd, markdownPath), 'utf8')
      if (markdown !== selectionTraceMarkdown(analysis)) return { status: 'stale' }
    }
    return { status: 'fresh' }
  } catch (error) { return { status: 'invalid', error: error.message } }
}
