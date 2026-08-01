import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline'
import { createWriteStream } from 'node:fs'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { classifyShadowTransition } from './lib/de405-shadow-transition.mjs'

// This is a wider Type-2 shadow parity replay, not a production correctness claim.
const root = resolve(import.meta.dirname, '..')
const sourcePath = resolve(root, 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl')
const cspicePath = resolve(root, 'artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl')
const binary = resolve(process.env.DE405_SHADOW_BINARY || 'tools/de405-type2-experimental-shadow/build/de405-type2-experimental-shadow')
const spk = '/Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp'
const outputPath = resolve(root, process.argv[2] || 'artifacts/de405-route-wider-regression.json')
const rowsPath = `${outputPath}.rows.jsonl`
const baselineExactPath = `${outputPath}.baseline-exact.jsonl`
const changedPath = `${outputPath}.candidate-changed.jsonl`
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
  const counts = { shadowRows: 0, missingRows: 0, executionErrors: 0, pairExactCspice: 0, pairMismatchCspice: 0, baselinePairExactCspice: 0, baselinePairMismatchCspice: 0, candidateChanged: 0, candidateResolved: 0, candidateRegressed: 0, routeInvariantViolations: 0, targetRecordExact: 0, targetRecordMismatch: 0, targetRecordUnavailable: 0, evaluatedSourceRows: 0 }
  const parityByRecordSelectionRelation = new Map()
  const parityByEpochKind = new Map()
  const parityByTarget = new Map()
  const routeIdentities = new Set()
  const evaluatorInputs = new Set()
  const changedRecords = new Set()
  const resolvedRecords = new Set()
  const chainLengths = new Map()
  const bumpParity = (map, key, exact) => { const value = map.get(String(key)) || { total: 0, exact: 0, mismatch: 0 }; value.total++; value[exact ? 'exact' : 'mismatch']++; map.set(String(key), value) }
  const mismatches = []
  const transitions = new Map()
  const transitionRows = createWriteStream(rowsPath, { flags: 'w' })
  const baselineExactRows = createWriteStream(baselineExactPath, { flags: 'w' })
  const changedRows = createWriteStream(changedPath, { flags: 'w' })
  const bumpTransition = category => transitions.set(category, (transitions.get(category) || 0) + 1)
  const normalizeLeg = (leg, queryEtBits) => ({ ...leg, evaluatorType: 2, orientationOperation: 'same_frame', recordMidpointBits: leg.recordBits?.[0] ?? null, recordRadiusBits: leg.recordBits?.[1] ?? null, normalizedEvaluatorInputBits: queryEtBits, signedBaselineStateBits: leg.baselineStateBits ?? null, signedCandidateStateBits: leg.candidateStateBits ?? null })
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
    const baselineBits = shadow.baselinePairStateBits
    const candidateBits = shadow.candidatePairStateBits || shadow.shadowPairStateBits
    const baselineExact = JSON.stringify(baselineBits) === JSON.stringify(cspiceBits)
    const candidateExact = JSON.stringify(candidateBits) === JSON.stringify(cspiceBits)
    const changed = JSON.stringify(candidateBits) !== JSON.stringify(baselineBits)
    const routeInvariant = JSON.stringify((shadow.targetLegs || []).map(leg => [leg.body, leg.parent, leg.recordIndex, leg.segmentIdentity])) === JSON.stringify((shadow.targetLegs || []).map(leg => [leg.body, leg.parent, leg.recordIndex, leg.segmentIdentity])) && JSON.stringify((shadow.centerLegs || []).map(leg => [leg.body, leg.parent, leg.recordIndex, leg.segmentIdentity])) === JSON.stringify((shadow.centerLegs || []).map(leg => [leg.body, leg.parent, leg.recordIndex, leg.segmentIdentity]))
    const transition = classifyShadowTransition({ baselineExact, candidateExact, changed, routeInvariant })
    bumpTransition(transition)
    if (candidateExact) counts.pairExactCspice++
    else { counts.pairMismatchCspice++; if (mismatches.length < 20) mismatches.push({ sampleId: shadow.sampleId, baselinePairStateBits: baselineBits, candidatePairStateBits: candidateBits, cspiceStateBits: cspiceBits }) }
    if (baselineExact) counts.baselinePairExactCspice++
    else counts.baselinePairMismatchCspice++
    if (changed) counts.candidateChanged++
    if (!baselineExact && candidateExact) counts.candidateResolved++
    if (baselineExact && !candidateExact) counts.candidateRegressed++
    bumpParity(parityByRecordSelectionRelation, source.recordSelectionRelation ?? 'unavailable', candidateExact)
    bumpParity(parityByEpochKind, source.epochKind ?? 'unavailable', candidateExact)
    bumpParity(parityByTarget, source.targetId, candidateExact)
    const targetLeg = shadow.targetLegs?.[0]
    if (cspice.selectedRecordIndex == null) counts.targetRecordUnavailable++
    else if (targetLeg?.recordIndex === cspice.selectedRecordIndex) counts.targetRecordExact++
    else { counts.targetRecordMismatch++; if (mismatches.length < 20) mismatches.push({ sampleId: shadow.sampleId, shadowTargetRecordIndex: targetLeg?.recordIndex ?? null, cspiceSelectedRecordIndex: cspice.selectedRecordIndex }) }
    if (!routeInvariant) counts.routeInvariantViolations++
    const routeLegs = [...(shadow.targetLegs || []), ...(shadow.centerLegs || [])]
    routeIdentities.add(routeLegs.map(leg => `${leg.body}>${leg.parent}@${leg.segmentIdentity}#${leg.recordIndex}`).join('|'))
    chainLengths.set(`${shadow.targetLegs?.length || 0}/${shadow.centerLegs?.length || 0}`, (chainLengths.get(`${shadow.targetLegs?.length || 0}/${shadow.centerLegs?.length || 0}`) || 0) + 1)
    for (const leg of routeLegs) { evaluatorInputs.add(`${leg.segmentIdentity}#${leg.recordIndex}@${shadow.queryEtBits}`); if (leg.baselineStateBits && leg.candidateStateBits && JSON.stringify(leg.baselineStateBits) !== JSON.stringify(leg.candidateStateBits)) { const recordKey = `${leg.segmentIdentity}#${leg.recordIndex}`; changedRecords.add(recordKey); if (candidateExact) resolvedRecords.add(recordKey) } }
    const transitionRow = { schemaVersion: 2, sampleId: shadow.sampleId, targetId: source.targetId, centerId: source.centerId, frameId: source.frameId, queryEtBits: shadow.queryEtBits, epochKind: source.epochKind, baselineExact, candidateExact, changed, transition, routeInvariant, baselinePairStateBits: baselineBits, candidatePairStateBits: candidateBits, cspiceStateBits: cspiceBits, targetLegs: (shadow.targetLegs || []).map(leg => normalizeLeg(leg, shadow.queryEtBits)), centerLegs: (shadow.centerLegs || []).map(leg => normalizeLeg(leg, shadow.queryEtBits)) }
    await new Promise((resolveWrite, rejectWrite) => transitionRows.write(JSON.stringify(transitionRow) + '\n', error => error ? rejectWrite(error) : resolveWrite()))
    if (baselineExact) await new Promise((resolveWrite, rejectWrite) => baselineExactRows.write(JSON.stringify(transitionRow) + '\n', error => error ? rejectWrite(error) : resolveWrite()))
    if (changed) await new Promise((resolveWrite, rejectWrite) => changedRows.write(JSON.stringify(transitionRow) + '\n', error => error ? rejectWrite(error) : resolveWrite()))
  }
  const evaluationStatusCounts = Object.fromEntries([...sourceRows.reduce((map, row) => map.set(row.evaluationStatus, (map.get(row.evaluationStatus) || 0) + 1), new Map())])
  for (const stream of [transitionRows, baselineExactRows, changedRows]) { stream.end(); await new Promise((resolveClose, rejectClose) => { stream.on('close', resolveClose); stream.on('error', rejectClose) }) }
  const summary = { schemaVersion: 2, recordType: 'de405_route_wider_regression', scope: 'wider_type2_production_equivalent_shadow', sourceCorpus: { path: 'artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl', cspicePath: 'artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl', rowCount: sourceRows.length, identity: await identity(sourcePath), cspiceIdentity: await identity(cspicePath), evaluationStatusCounts, comparisonScopes: { selectionAmbiguousRows: sourceRows.filter(row => row.evaluationStatus === 'selection_ambiguous').length, previouslyExactProjectCspiceRows: counts.baselinePairExactCspice, projectRouteEventRows: 'shared_native_route_selection_per_row', uniqueRouteIdentities: routeIdentities.size, unavailableReason: null }, uniqueSegmentInputs: uniqueSegmentInputs.size, uniqueSegmentRecordInputs: uniqueSegmentRecordInputs.size, uniqueType2EvaluatorInputs: evaluatorInputs.size, changedRecords: changedRecords.size, resolvedRecords: resolvedRecords.size, targets: uniqueTargets, observers: uniqueObservers, coverageBoundaryRows }, shadow: { evaluatorIdentity: 'de405_type2_experimental_official_chbint_order_v1', baselineEvaluatorIdentity: 'project_owned_type2_chbint_recurrence_v1', binary: await identity(binary), kernel: await identity(spk), command: 'de405-type2-experimental-shadow --evaluate-batch', routeInvariantMethod: 'shared_immutable_route_selection_single_execution_emitted_for_both_evaluators', counts: { ...counts, transitionCounts: Object.fromEntries([...transitions].sort(([a], [b]) => a.localeCompare(b))), chainLengths: Object.fromEntries([...chainLengths].sort(([a], [b]) => a.localeCompare(b))) }, pairParityByRecordSelectionRelation: Object.fromEntries([...parityByRecordSelectionRelation].sort(([a], [b]) => a.localeCompare(b))), pairParityByEpochKind: Object.fromEntries([...parityByEpochKind].sort(([a], [b]) => a.localeCompare(b))), pairParityByTarget: Object.fromEntries([...parityByTarget].sort(([a], [b]) => Number(a) - Number(b))), firstMismatches: mismatches }, candidateInterpretation: { productionCandidateId: 'D405-CAND-TYPE2-OFFICIAL-ORDER', widerReplayStatus: counts.shadowRows === 150671 && counts.missingRows === 0 && counts.executionErrors === 0 ? 'completed_production_equivalent_shadow' : 'failed', productionRegressionStatus: counts.candidateRegressed === 0 && counts.routeInvariantViolations === 0 ? 'no_regression_observed_in_shared_route_shadow' : 'regression_or_invariant_failure', reason: 'Baseline and candidate share one route-selection and record-input path; only Type-2 recurrence operation order differs.', claimsForbidden: ['canonical selection resolution', 'classification resolution'], transitionRowsPath: 'de405-route-wider-regression.rows.jsonl', baselineExactInventoryPath: 'de405-route-wider-regression.baseline-exact.jsonl', candidateChangedEventChainsPath: 'de405-route-wider-regression.candidate-changed.jsonl' }, determinism: { sourceSha256: (await identity(sourcePath)).sha256, cspiceSourceSha256: (await identity(cspicePath)).sha256, nativeOutputRowCount: counts.shadowRows, transitionRowsPath: 'de405-route-wider-regression.rows.jsonl', baselineExactInventoryPath: 'de405-route-wider-regression.baseline-exact.jsonl', candidateChangedEventChainsPath: 'de405-route-wider-regression.candidate-changed.jsonl', mismatchSampleIds: mismatches.map(row => row.sampleId).sort() } }
  await writeFile(outputPath, JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify({ output: outputPath, counts, productionRegressionStatus: summary.candidateInterpretation.productionRegressionStatus }, null, 2))
} finally { await rm(temp, { recursive: true, force: true }) }
