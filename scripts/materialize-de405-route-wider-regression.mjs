import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

// This is a wider Type-2 shadow parity replay, not a production correctness claim.
const root = resolve(import.meta.dirname, '..')
const sourcePath = resolve(root, 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl')
const cspicePath = resolve(root, 'artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl')
const binary = resolve(root, 'tools/de405-type2-experimental-shadow/build/de405-type2-experimental-shadow')
const spk = '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
const outputPath = resolve(root, process.argv[2] || 'artifacts/de405-route-wider-regression.json')
const parse = line => JSON.parse(line)
const sha = value => createHash('sha256').update(value).digest('hex')
const bitsFromNumber = value => { const buffer = new ArrayBuffer(8); const view = new DataView(buffer); view.setFloat64(0, value, false); return `0x${view.getBigUint64(0, false).toString(16).padStart(16, '0')}` }
const bitsFromState = state => state.map(bitsFromNumber)
const identity = async path => { const bytes = await readFile(path); const info = await stat(path); const normalizedPath = path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path === spk ? 'external-kernel/softie-de405/de405.bsp' : 'external-input/' + path.split('/').at(-1); return { path: normalizedPath, sizeBytes: info.size, sha256: sha(bytes) } }

const sourceRows = (await readFile(sourcePath, 'utf8')).trim().split('\n').filter(Boolean).map(parse)
const cspiceRows = (await readFile(cspicePath, 'utf8')).trim().split('\n').filter(Boolean).map(parse)
if (sourceRows.length !== 150671 || new Set(sourceRows.map(row => row.sampleId)).size !== 150671) throw new Error('wider source is not exactly 150,671 unique samples')
if (cspiceRows.length !== 150671 || new Set(cspiceRows.map(row => row.sampleId)).size !== 150671) throw new Error('wider CSPICE source is not exactly 150,671 unique samples')
const sourceById = new Map(sourceRows.map(row => [row.sampleId, row]))
const cspiceById = new Map(cspiceRows.map(row => [row.sampleId, row]))
const uniqueSegmentRecordInputs = new Set(sourceRows.map(row => `${row.targetId}:${row.centerId}:${row.frameId}:${row.segmentOrdinal}:${row.recordIndex}`))
const uniqueSegmentInputs = new Set(sourceRows.map(row => `${row.targetId}:${row.centerId}:${row.frameId}:${row.segmentOrdinal}`))
const uniqueTargets = [...new Set(sourceRows.map(row => row.targetId))].sort((a, b) => a - b)
const uniqueObservers = [...new Set(sourceRows.map(row => row.centerId))].sort((a, b) => a - b)
const coverageBoundaryRows = sourceRows.filter(row => ['segment_coverage_start', 'segment_coverage_end', 'coverage_start'].includes(row.epochKind)).map(row => row.sampleId).sort()
const temp = await mkdtemp(`${tmpdir()}/de405-route-wider.`)
const inputPath = resolve(temp, 'input.jsonl')
const nativePath = resolve(temp, 'shadow.jsonl')
try {
  const input = [...sourceRows].sort((a, b) => a.sampleId.localeCompare(b.sampleId)).map(row => JSON.stringify({ sampleId: row.sampleId, targetId: row.targetId, centerId: row.centerId, queryEt: row.queryEt, queryEtHex: row.queryEtHex })).join('\n') + '\n'
  await writeFile(inputPath, input)
  execFileSync(binary, ['--evaluate-batch', '--spk', spk, '--input-jsonl', inputPath, '--output-jsonl', nativePath], { cwd: root, stdio: 'inherit' })
  const counts = { shadowRows: 0, missingRows: 0, executionErrors: 0, pairExactCspice: 0, pairMismatchCspice: 0, targetRecordExact: 0, targetRecordMismatch: 0, targetRecordUnavailable: 0, evaluatedSourceRows: 0 }
  const parityByRecordSelectionRelation = new Map()
  const parityByEpochKind = new Map()
  const parityByTarget = new Map()
  const bumpParity = (map, key, exact) => { const value = map.get(String(key)) || { total: 0, exact: 0, mismatch: 0 }; value.total++; value[exact ? 'exact' : 'mismatch']++; map.set(String(key), value) }
  const mismatches = []
  const inputStream = createInterface({ input: (await import('node:fs')).createReadStream(nativePath), crlfDelay: Infinity })
  for await (const line of inputStream) {
    if (!line.trim()) continue
    counts.shadowRows++
    const shadow = parse(line)
    const source = sourceById.get(shadow.sampleId)
    const cspice = cspiceById.get(shadow.sampleId)
    if (!source || !cspice) { counts.missingRows++; continue }
    counts.evaluatedSourceRows++
    const cspiceBits = bitsFromState(source.cspiceStateKmKmPerSec)
    const pairExact = JSON.stringify(shadow.shadowPairStateBits) === JSON.stringify(cspiceBits)
    if (pairExact) counts.pairExactCspice++
    else { counts.pairMismatchCspice++; if (mismatches.length < 20) mismatches.push({ sampleId: shadow.sampleId, shadowPairStateBits: shadow.shadowPairStateBits, cspiceStateBits: cspiceBits }) }
    bumpParity(parityByRecordSelectionRelation, source.recordSelectionRelation ?? 'unavailable', pairExact)
    bumpParity(parityByEpochKind, source.epochKind ?? 'unavailable', pairExact)
    bumpParity(parityByTarget, source.targetId, pairExact)
    const targetLeg = shadow.targetLegs?.[0]
    if (cspice.selectedRecordIndex == null) counts.targetRecordUnavailable++
    else if (targetLeg?.recordIndex === cspice.selectedRecordIndex) counts.targetRecordExact++
    else { counts.targetRecordMismatch++; if (mismatches.length < 20) mismatches.push({ sampleId: shadow.sampleId, shadowTargetRecordIndex: targetLeg?.recordIndex ?? null, cspiceSelectedRecordIndex: cspice.selectedRecordIndex }) }
  }
  const evaluationStatusCounts = Object.fromEntries([...sourceRows.reduce((map, row) => map.set(row.evaluationStatus, (map.get(row.evaluationStatus) || 0) + 1), new Map())])
  const summary = { schemaVersion: 1, recordType: 'de405_route_wider_regression', scope: 'wider_type2_shadow_parity', sourceCorpus: { path: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl', cspicePath: 'artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl', rowCount: sourceRows.length, identity: await identity(sourcePath), cspiceIdentity: await identity(cspicePath), evaluationStatusCounts, comparisonScopes: { selectionAmbiguousRows: sourceRows.filter(row => row.evaluationStatus === 'selection_ambiguous').length, previouslyExactProjectCspiceRows: null, projectRouteEventRows: null, uniqueRouteIdentities: null, unavailableReason: 'wider corpus has JPL/CSPICE sample states and selection metadata but no project route event chain' }, uniqueSegmentInputs: uniqueSegmentInputs.size, uniqueSegmentRecordInputs: uniqueSegmentRecordInputs.size, targets: uniqueTargets, observers: uniqueObservers, coverageBoundaryRows }, shadow: { evaluatorIdentity: 'de405_type2_experimental_official_chbint_order_v1', binary: await identity(binary), kernel: await identity(spk), command: 'de405-type2-experimental-shadow --evaluate-batch', counts, pairParityByRecordSelectionRelation: Object.fromEntries([...parityByRecordSelectionRelation].sort(([a], [b]) => a.localeCompare(b))), pairParityByEpochKind: Object.fromEntries([...parityByEpochKind].sort(([a], [b]) => a.localeCompare(b))), pairParityByTarget: Object.fromEntries([...parityByTarget].sort(([a], [b]) => Number(a) - Number(b))), firstMismatches: mismatches }, candidateInterpretation: { productionCandidateId: 'D405-CAND-TYPE2-OFFICIAL-ORDER', widerReplayStatus: counts.shadowRows === 150671 && counts.missingRows === 0 && counts.executionErrors === 0 ? 'completed_shadow_parity_only' : 'failed', productionRegressionStatus: 'not_established', reason: 'The wider corpus exposes JPL/CSPICE per-sample states but not the project route event chain; this artifact validates the shadow evaluator over wider inputs only.', claimsForbidden: ['production DE405 correctness', 'production route parity', 'canonical selection resolution', 'classification resolution'] }, determinism: { sourceSha256: (await identity(sourcePath)).sha256, cspiceSourceSha256: (await identity(cspicePath)).sha256, nativeOutputRowCount: counts.shadowRows, mismatchSampleIds: mismatches.map(row => row.sampleId).sort() } }
  await writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify({ output: outputPath, counts, productionRegressionStatus: summary.candidateInterpretation.productionRegressionStatus }, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }
