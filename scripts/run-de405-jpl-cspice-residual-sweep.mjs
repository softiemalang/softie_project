#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createWriteStream, existsSync, openSync, closeSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { de405OverlapToleranceContract as contract } from './lib/de405-overlap-tolerance-contract.mjs'
import { assertFile, closeJsonLines, comparisonManifest, ensureDir, metricSummary, readJsonLines, residualEvidence, writeCheckpoint } from './lib/de405-overlap-sweep.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const valueOf = (name, fallback) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : fallback
}
const has = name => args.includes(name)
const spk = resolve(valueOf('--spk', process.env.DE405_BSP_PATH || join(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp')))
const jplBinary = resolve(valueOf('--jpl-binary', 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405'))
const artifactsDir = resolve(valueOf('--artifacts-dir', 'artifacts'))
const checkpointDir = resolve(valueOf('--checkpoint-dir', join(artifactsDir, 'de405-sweep-checkpoints')))
const manifestPath = resolve(valueOf('--manifest', join(artifactsDir, 'de405-jpl-cspice-residual-sweep.manifest.jsonl')))
const jplOutputPath = resolve(valueOf('--jpl-output', join(artifactsDir, 'de405-jpl-cspice-residual-sweep.jpl.jsonl')))
const cspiceOutputPath = resolve(valueOf('--cspice-output', join(artifactsDir, 'de405-jpl-cspice-residual-sweep.cspice.jsonl')))
const samplesPath = resolve(valueOf('--samples-output', join(artifactsDir, 'de405-jpl-cspice-residual-sweep.samples.jsonl')))
const summaryPath = resolve(valueOf('--summary-output', join(artifactsDir, 'de405-jpl-cspice-residual-sweep.summary.json')))
const checkpointPath = join(checkpointDir, 'checkpoint.json')
const chunkSize = Math.max(1, Number(valueOf('--chunk-size', '5000')))
const cspiceRunner = resolve('tools/de405-cspice-runner/build/de405-canonical-v2-runner')
const jplRunner = resolve('tools/de405-jpl-reader/run.mjs')

function fail(message, extra = {}) {
  console.error(JSON.stringify({ schemaVersion: 1, sweepStatus: 'partial_sweep', executionSucceeded: false, error: message, ...extra }))
  process.exitCode = 3
}

async function runNativeToFile(command, commandArgs, outputPath) {
  const outputFd = openSync(outputPath, 'w')
  const result = spawnSync(command, commandArgs, { stdio: ['ignore', outputFd, 'inherit'] })
  closeSync(outputFd)
  if (result.status !== 0) throw new Error(`${command} failed with exit ${result.status}`)
}

function percentileGroups() {
  return new Map()
}

function addMetric(groups, group, value) {
  if (!groups.has(group)) groups.set(group, [])
  groups.get(group).push(value)
}

function makeWorst(sample, metric, value) {
  return { sampleId: sample.sampleId, targetId: sample.targetId, centerId: sample.centerId, frameId: sample.frameId, queryEt: sample.queryEt, queryEtHex: sample.queryEtHex, epochKind: sample.epochKind, segmentOrdinal: sample.segmentOrdinal, recordIndex: sample.recordIndex, knotIndex: sample.knotIndex, spkSelectedRecordIndex: sample.spkSelectedRecordIndex, jplOuterRecordIndex: sample.jplOuterRecordIndex, jplTargetSubintervalIndex: sample.jplTargetSubintervalIndex, positionResidualKm: sample.positionResidualKm, velocityResidualKmPerSec: sample.velocityResidualKmPerSec, requiredPositionUlpMultiplier: sample.requiredPositionUlpMultiplier, requiredVelocityUlpMultiplier: sample.requiredVelocityUlpMultiplier, metric, value }
}

async function mergeEvidence() {
  const manifestReader = await readJsonLines(manifestPath)
  const jplReader = await readJsonLines(jplOutputPath)
  const cspiceReader = await readJsonLines(cspiceOutputPath)
  const output = createWriteStream(samplesPath, { flags: has('--resume') ? 'a' : 'w' })
  const metrics = { position: percentileGroups(), velocity: percentileGroups(), requiredPosition: percentileGroups(), requiredVelocity: percentileGroups() }
  const worst = { position: null, velocity: null, requiredPosition: null, requiredVelocity: null }
  const failedEvidence = { metadata_invalid: 0, selection_ambiguous: 0, out_of_coverage: 0, execution_error: 0 }
  const metricFailureCounts = { position: 0, velocity: 0, requiredPosition: 0, requiredVelocity: 0 }
  const checkpoint = has('--resume') && existsSync(checkpointPath) ? JSON.parse(await readFile(checkpointPath, 'utf8')) : null
  const manifestInfo = await assertFile(manifestPath, 'manifest')
  const spkInfo = await assertFile(spk, 'SPK')
  const jplInfo = await assertFile(jplBinary, 'JPL binary')
  if (checkpoint && (checkpoint.manifestSha256 !== manifestInfo.sha256 || checkpoint.spkSha256 !== spkInfo.sha256 || checkpoint.jplBinarySha256 !== jplInfo.sha256 || checkpoint.contractVersion !== contract.contractVersion)) throw new Error('checkpoint input identity mismatch')
  const completedChunkIds = new Set(checkpoint?.completedChunkIds || [])
  let index = 0
  let evaluated = 0
  let candidateFailures = 0
  let missing = 0
  let expectedTotal = 0
  const records = new Set()
  const segments = new Set()
  let interiorSamples = 0
  let knotSamples = 0
  let coverageEdgeSamples = 0
  for await (const manifestLine of { [Symbol.asyncIterator]: () => manifestReader.iterator }) {
    if (!manifestLine.trim()) continue
    expectedTotal++
    const sample = JSON.parse(manifestLine)
    segments.add(sample.segmentOrdinal)
    if (sample.recordIndex !== null) records.add(`${sample.segmentOrdinal}:${sample.recordIndex}`)
    if (sample.knotIndex !== null) knotSamples++
    else if (sample.epochKind.startsWith('segment_coverage_')) coverageEdgeSamples++
    else interiorSamples++
    const jplNext = await jplReader.iterator.next()
    const cspiceNext = await cspiceReader.iterator.next()
    if (jplNext.done || cspiceNext.done) { missing++; break }
    const jpl = JSON.parse(jplNext.value)
    const cspice = JSON.parse(cspiceNext.value)
    let evidence
    try {
      evidence = residualEvidence(sample, jpl, cspice, contract)
    } catch (error) {
      failedEvidence.execution_error++
      throw error
    }
    const skippedByCheckpoint = checkpoint && index <= checkpoint.lastCompletedSampleIndex
    if (!skippedByCheckpoint) {
      if (!output.write(JSON.stringify(evidence) + '\n')) await once(output, 'drain')
      evaluated++
    }
    if (evidence.evaluationStatus !== 'evaluated') failedEvidence[evidence.evaluationStatus] = (failedEvidence[evidence.evaluationStatus] || 0) + 1
    if (evidence.candidatePass === false) candidateFailures++
    if (evidence.positionWithinCandidateTolerance === false) metricFailureCounts.position++
    if (evidence.velocityWithinCandidateTolerance === false) metricFailureCounts.velocity++
    if (Number.isFinite(evidence.requiredPositionUlpMultiplier) && evidence.requiredPositionUlpMultiplier > contract.candidatePositionUlpMultiplier) metricFailureCounts.requiredPosition++
    if (Number.isFinite(evidence.requiredVelocityUlpMultiplier) && evidence.requiredVelocityUlpMultiplier > contract.candidateVelocityUlpMultiplier) metricFailureCounts.requiredVelocity++
    if (Number.isFinite(evidence.positionVectorNormKm)) for (const [group, values] of [['overall', evidence.positionVectorNormKm], [evidence.comparisonCaseId, evidence.positionVectorNormKm], [evidence.epochKind, evidence.positionVectorNormKm], [`${evidence.comparisonCaseId}:${evidence.epochKind}`, evidence.positionVectorNormKm], [evidence.epochKind.includes('knot') ? 'knot' : evidence.epochKind.startsWith('segment_') ? 'coverage_edge' : 'interior', evidence.positionVectorNormKm]]) addMetric(metrics.position, group, values)
    if (Number.isFinite(evidence.velocityVectorNormKmPerSec)) for (const [group, values] of [['overall', evidence.velocityVectorNormKmPerSec], [evidence.comparisonCaseId, evidence.velocityVectorNormKmPerSec], [evidence.epochKind, evidence.velocityVectorNormKmPerSec], [`${evidence.comparisonCaseId}:${evidence.epochKind}`, evidence.velocityVectorNormKmPerSec], [evidence.epochKind.includes('knot') ? 'knot' : evidence.epochKind.startsWith('segment_') ? 'coverage_edge' : 'interior', evidence.velocityVectorNormKmPerSec]]) addMetric(metrics.velocity, group, values)
    if (Number.isFinite(evidence.requiredPositionUlpMultiplier)) addMetric(metrics.requiredPosition, 'overall', evidence.requiredPositionUlpMultiplier)
    if (Number.isFinite(evidence.requiredVelocityUlpMultiplier)) addMetric(metrics.requiredVelocity, 'overall', evidence.requiredVelocityUlpMultiplier)
    for (const [key, metric, value] of [['position', 'positionNormKm', evidence.positionVectorNormKm], ['velocity', 'velocityNormKmPerSec', evidence.velocityVectorNormKmPerSec], ['requiredPosition', 'requiredPositionUlpMultiplier', evidence.requiredPositionUlpMultiplier], ['requiredVelocity', 'requiredVelocityUlpMultiplier', evidence.requiredVelocityUlpMultiplier]]) if (Number.isFinite(value) && (!worst[key] || value > worst[key].value)) worst[key] = makeWorst(evidence, metric, value)
    if (index % chunkSize === chunkSize - 1) {
      completedChunkIds.add(Math.floor(index / chunkSize))
      await writeCheckpoint(checkpointPath, { schemaVersion: 1, manifestSha256: manifestInfo.sha256, spkSha256: spkInfo.sha256, jplBinarySha256: jplInfo.sha256, contractVersion: contract.contractVersion, lastCompletedSampleIndex: index, completedChunkIds: [...completedChunkIds].sort((a, b) => a - b), chunkSize })
    }
    index++
  }
  if (index > 0 && (index - 1) % chunkSize !== chunkSize - 1) {
    completedChunkIds.add(Math.floor((index - 1) / chunkSize))
    await writeCheckpoint(checkpointPath, { schemaVersion: 1, manifestSha256: manifestInfo.sha256, spkSha256: spkInfo.sha256, jplBinarySha256: jplInfo.sha256, contractVersion: contract.contractVersion, lastCompletedSampleIndex: index - 1, completedChunkIds: [...completedChunkIds].sort((a, b) => a - b), chunkSize })
  }
  output.end()
  await once(output, 'close')
  const trailingJpl = await jplReader.iterator.next()
  const trailingCspice = await cspiceReader.iterator.next()
  if (!trailingJpl.done || !trailingCspice.done) missing++
  await closeJsonLines(manifestReader); await closeJsonLines(jplReader); await closeJsonLines(cspiceReader)
  const complete = missing === 0 && failedEvidence.execution_error === 0 && index === expectedTotal
  const sweepStatus = complete ? (Object.values(failedEvidence).some(value => value > 0) ? 'complete_sweep_with_evidence_failures' : 'complete_sweep') : 'partial_sweep'
  const proposalReady = sweepStatus === 'complete_sweep'
  const summary = {
    schemaVersion: 1,
    sweepStatus,
    evaluationOrder: 'manifest-order',
    percentileMethod: 'nearest-rank, rank=ceil(p*N)',
    comparisonManifest,
    manifest: { path: manifestPath, ...manifestInfo },
    spk: spkInfo,
    jplBinary: jplInfo,
    comparisonSegmentCount: segments.size,
    logicalRecordCount: records.size,
    interiorSamples,
    knotSamples,
    coverageEdgeSamples,
    declaredExpectedSampleCount: 150681,
    sampleCountDifferenceFromDeclared: expectedTotal - 150681,
    sampleCountExplanation: 'The current comparison manifest selects 10 of 15 raw Type 2 segments. With 25,116 logical records this yields 6*N-10 = 150,686 samples; the worksheet 150,681 uses a 15-segment edge term.',
    evaluatedSamples: index,
    missingSamples: missing,
    failedEvidence,
    candidateFailureCount: candidateFailures,
    expectedSampleCount: expectedTotal,
    residuals: { position: Object.fromEntries([...metrics.position].map(([key, values]) => [key, { ...metricSummary(values), candidateFailureCount: key === 'overall' ? metricFailureCounts.position : 0 }])), velocity: Object.fromEntries([...metrics.velocity].map(([key, values]) => [key, { ...metricSummary(values), candidateFailureCount: key === 'overall' ? metricFailureCounts.velocity : 0 }])) },
    requiredUlpMultipliers: { position: Object.fromEntries([...metrics.requiredPosition].map(([key, values]) => [key, { ...metricSummary(values), candidateFailureCount: key === 'overall' ? metricFailureCounts.requiredPosition : 0 }])), velocity: Object.fromEntries([...metrics.requiredVelocity].map(([key, values]) => [key, { ...metricSummary(values), candidateFailureCount: key === 'overall' ? metricFailureCounts.requiredVelocity : 0 }])) },
    worstCase: worst,
    activeContractProposal: { status: proposalReady ? 'ready_for_review' : 'blocked_until_complete_sweep', observedMaxima: { position: worst.position?.value ?? null, velocity: worst.velocity?.value ?? null, requiredPosition: worst.requiredPosition?.value ?? null, requiredVelocity: worst.requiredVelocity?.value ?? null }, proposedHeadroom: null, proposedRule: null, contractModified: false, activeTransition: false },
    evidence: { samplesPath, jplOutputPath, cspiceOutputPath, checkpointPath }
  }
  await writeFile(summaryPath, JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify(summary, null, 2))
  if (sweepStatus === 'partial_sweep') process.exitCode = 1
}

async function main() {
  await ensureDir(artifactsDir); await ensureDir(checkpointDir)
  await assertFile(spk, 'SPK'); await assertFile(jplBinary, 'JPL binary')
  if (!has('--resume') || !existsSync(manifestPath)) {
    await runNativeToFile(cspiceRunner, ['--emit-spk-type2-sweep-manifest', '--spk', spk], manifestPath)
  }
  if (!has('--resume') || !existsSync(jplOutputPath)) {
    const jplResult = spawnSync(process.execPath, [jplRunner, '--evaluate-et-batch', '--binary', jplBinary, '--input-jsonl', manifestPath, '--output-jsonl', jplOutputPath], { stdio: 'inherit' })
    if (jplResult.status !== 0) throw new Error(`JPL batch failed with exit ${jplResult.status}`)
  }
  if (!has('--resume') || !existsSync(cspiceOutputPath)) {
    const cspiceResult = spawnSync(cspiceRunner, ['--evaluate-spk-type2-batch', '--spk', spk, '--input-jsonl', manifestPath, '--output-jsonl', cspiceOutputPath], { stdio: 'inherit' })
    if (cspiceResult.status !== 0) throw new Error(`CSPICE batch failed with exit ${cspiceResult.status}`)
  }
  await mergeEvidence()
}

main().catch(error => fail(error.message))
