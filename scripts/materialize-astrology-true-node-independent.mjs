#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { BODY_ORDER, DE405_BODY_MAPPING } from '../src/astrology/astrologyEphemerisCore.js'
import { UNSUPPORTED_BODIES } from '../src/astrology/astrologyRuleCore.js'
import { END_ET, START_ET, STEP_SECONDS, TIMESTAMP_COUNT } from './lib/de405-canonical-v2-contract.mjs'
import { angularDifferenceDegrees, deriveOsculatingLunarNodeLongitude } from '../spikes/astrology-true-node-independent/src/trueNodeCandidate.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DAY_SECONDS = 86400
const J2000 = 2451545.0
const START_ET_SECONDS = Number(START_ET)
const END_ET_SECONDS = Number(END_ET)
const START_JD_TDB = J2000 + START_ET_SECONDS / DAY_SECONDS
const END_JD_TDB_EXCLUSIVE = J2000 + END_ET_SECONDS / DAY_SECONDS
const STEP_DAYS = STEP_SECONDS / DAY_SECONDS
const CSPICE_OVERLAP_START_JD_TDB = 2433282.5 + 100 / DAY_SECONDS
const CSPICE_OVERLAP_TIMESTAMP_COUNT = 3653
const SYNTHETIC_TT_MINUS_UTC_SECONDS = 64.184
const requestedFlags = 2 | 256

const jplRunnerPath = resolve(process.env.DE405_TRUE_NODE_JPL_RUNNER || join(root, 'tools/de405-jpl-reader/build/de405-jpl-canonical-v2-runner'))
const jplBinaryPath = resolve(process.env.DE405_TRUE_NODE_JPL_BINARY || join(root, 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405'))
const cspiceRunnerPath = resolve(process.env.DE405_TRUE_NODE_CSPICE_RUNNER || join(root, 'tools/de405-cspice-runner/build/de405-canonical-v2-runner'))
const cspiceSpkPath = resolve(process.env.DE405_TRUE_NODE_CSPICE_SPK || join(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp'))
const swissBuildPath = resolve(process.env.DE405_TRUE_NODE_SWISS_BUILD || join(root, 'spikes/astrology-swiss-wasm/generated/build-a'))
const outputPath = resolve(process.env.DE405_TRUE_NODE_OUTPUT || join(root, 'artifacts/astrology-true-node-independent-v0/complete.json'))

function fail(message) {
  throw new Error(message)
}

function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function sha256File(path) {
  return sha256Bytes(readFileSync(path))
}

function canonicalSha256(value) {
  return sha256Bytes(Buffer.from(`${JSON.stringify(value)}\n`))
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function tdbMinusTtSecondsAt(jdTt) {
  return 0.001657 * Math.sin((357.53 + 0.9856003 * (jdTt - J2000)) * Math.PI / 180)
}

function doubleHex(value) {
  const bytes = Buffer.allocUnsafe(8)
  bytes.writeDoubleLE(value)
  return `0x${bytes.readBigUInt64LE().toString(16).padStart(16, '0')}`
}

function buildSample(index, sampleId, jdTdb, etSecondsOverride = null) {
    const tdbMinusTtSeconds = tdbMinusTtSecondsAt(jdTdb)
    const jdTt = jdTdb - tdbMinusTtSeconds / DAY_SECONDS
    const jdUt = jdTt - SYNTHETIC_TT_MINUS_UTC_SECONDS / DAY_SECONDS
    const etSeconds = etSecondsOverride ?? (jdTdb - J2000) * DAY_SECONDS
    return { index, sampleId, jdTdb, jdTt, jdUt, etSeconds, tdbMinusTtSeconds, queryEtHex: doubleHex(etSeconds) }
}

function buildCorpus() {
  return Array.from({ length: TIMESTAMP_COUNT }, (_, index) => buildSample(index, `true-node-${String(index).padStart(5, '0')}`, START_JD_TDB + index * STEP_DAYS))
}

function buildBoundaryCorpus() {
  return [
    buildSample(0, 'boundary-service-start-exact', START_JD_TDB),
    buildSample(1, 'boundary-service-start-plus-one-second', START_JD_TDB + 1 / DAY_SECONDS),
    buildSample(2, 'boundary-service-end-minus-one-second', END_JD_TDB_EXCLUSIVE - 1 / DAY_SECONDS),
    buildSample(3, 'boundary-service-end-exclusive-exact', END_JD_TDB_EXCLUSIVE),
  ]
}

function evaluateJpl(corpus) {
  if (!existsSync(jplRunnerPath)) fail(`JPL runner missing: ${jplRunnerPath}`)
  if (!existsSync(jplBinaryPath)) fail(`JPL binary missing: ${jplBinaryPath}`)
  const tempPath = mkdtempSync(join(tmpdir(), 'true-node-jpl-'))
  try {
    symlinkSync(jplBinaryPath, join(tempPath, 'JPLEPH'))
    const input = `${corpus.map((sample) => JSON.stringify({ sampleId: sample.sampleId, queryEt: sample.etSeconds, queryEtHex: sample.queryEtHex, targetId: 301, centerId: 399, frameId: 1 })).join('\n')}\n`
    const result = spawnSync(jplRunnerPath, ['--evaluate-et-batch', '--binary', 'JPLEPH', '--input-jsonl', 'stdin'], { cwd: tempPath, input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    if (result.error) fail(`JPL runner failed to execute: ${result.error.message}`)
    if (result.status !== 0) fail(`JPL runner exited ${result.status}: ${result.stderr}`)
    return result.stdout.trim().split('\n').filter(Boolean).map((line) => JSON.parse(line))
  } finally {
    rmSync(tempPath, { recursive: true, force: true })
  }
}

async function loadSwiss() {
  const modulePath = join(swissBuildPath, 'swiss-spike.mjs')
  if (!existsSync(modulePath)) fail(`Swiss build missing: ${modulePath}`)
  const { default: createSwissSpike } = await import(pathToFileURL(modulePath))
  const module = await createSwissSpike({ locateFile: (fileName) => join(swissBuildPath, fileName) })
  module.ccall('astro_spike_init', null, ['string'], ['/ephe'])
  return module
}

function calculateSwissTrueNode(module, jdUt) {
  const row = JSON.parse(module.ccall('astro_spike_calculate_body', 'string', ['number', 'number', 'number'], [jdUt, 11, requestedFlags]))
  if (row.effectiveFlags !== requestedFlags || row.error !== '') fail(`Swiss fallback or error at JD UT ${jdUt}: ${JSON.stringify(row)}`)
  return row
}

function summarizeSwissArgumentShift(corpus, rows, swiss) {
  let referenceShiftSum = 0
  let candidateShiftedResidualSum = 0
  let argumentShiftSum = 0
  let minArgumentShiftSeconds = Infinity
  let maxArgumentShiftSeconds = -Infinity
  let maxReferenceShift = null
  let maxCandidateShiftedResidual = null

  for (const [index, sample] of corpus.entries()) {
    const shiftedReference = calculateSwissTrueNode(swiss, sample.jdTt)
    const baseline = rows[index]
    const referenceShiftArcseconds = Math.abs(angularDifferenceDegrees(baseline.swissTrueNodeLongitudeDegrees, shiftedReference.longitude)) * 3600
    const candidateShiftedResidualArcseconds = Math.abs(angularDifferenceDegrees(baseline.candidateLongitudeDegrees, shiftedReference.longitude)) * 3600
    const argumentShiftSeconds = (sample.jdTt - sample.jdUt) * DAY_SECONDS
    referenceShiftSum += referenceShiftArcseconds
    candidateShiftedResidualSum += candidateShiftedResidualArcseconds
    argumentShiftSum += argumentShiftSeconds
    minArgumentShiftSeconds = Math.min(minArgumentShiftSeconds, argumentShiftSeconds)
    maxArgumentShiftSeconds = Math.max(maxArgumentShiftSeconds, argumentShiftSeconds)
    if (!maxReferenceShift || referenceShiftArcseconds > maxReferenceShift.value) maxReferenceShift = { value: referenceShiftArcseconds, sampleId: sample.sampleId, argumentShiftSeconds }
    if (!maxCandidateShiftedResidual || candidateShiftedResidualArcseconds > maxCandidateShiftedResidual.value) maxCandidateShiftedResidual = { value: candidateShiftedResidualArcseconds, sampleId: sample.sampleId, argumentShiftSeconds }
  }

  return {
    status: 'diagnostic_only',
    method: 'same_swe_calc_ut_binding_with_jdTt_argument_probe',
    interpretation: 'This argument-shift probe is not a Swiss TT evaluation and does not establish a corrected time-scale convention.',
    rowCount: corpus.length,
    effectiveFlags: requestedFlags,
    inputArgumentShiftSeconds: { min: minArgumentShiftSeconds, max: maxArgumentShiftSeconds, mean: argumentShiftSum / corpus.length },
    swissReferenceArgumentShiftArcseconds: { mean: referenceShiftSum / corpus.length, max: maxReferenceShift },
    candidateVsShiftedReferenceArcseconds: { mean: candidateShiftedResidualSum / corpus.length, max: maxCandidateShiftedResidual },
    classification: 'argument_shift_is_smaller_than_observed_candidate_residual',
  }
}

function evaluateCspiceGrid(corpus) {
  if (!existsSync(cspiceRunnerPath)) fail(`CSPICE runner missing: ${cspiceRunnerPath}`)
  if (!existsSync(cspiceSpkPath)) fail(`CSPICE SPK missing: ${cspiceSpkPath}`)
  const tempPath = mkdtempSync(join(tmpdir(), 'true-node-cspice-'))
  const outputPath = join(tempPath, 'cspice-states.jsonl')
  try {
    const result = spawnSync(cspiceRunnerPath, [
      '--generate-overlap-smoke', '--spk', cspiceSpkPath,
      '--start-et', String(corpus[0].etSeconds), '--count', String(corpus.length),
      '--step-seconds', String(STEP_SECONDS), '--output', outputPath,
    ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 })
    if (result.error) fail(`CSPICE runner failed to execute: ${result.error.message}`)
    if (result.status !== 0) fail(`CSPICE runner exited ${result.status}: ${result.stderr}`)
    const rows = readFileSync(outputPath, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line))
    const moonRows = rows.filter((row) => row.targetId === 301)
    if (moonRows.length !== corpus.length) fail(`CSPICE Moon row count mismatch: ${moonRows.length} != ${corpus.length}`)
    return moonRows
  } finally {
    rmSync(tempPath, { recursive: true, force: true })
  }
}

function readCspiceCoverage() {
  const result = spawnSync(cspiceRunnerPath, ['--coverage', '--spk', cspiceSpkPath], { encoding: 'utf8' })
  if (result.error) fail(`CSPICE coverage failed to execute: ${result.error.message}`)
  if (result.status !== 0) fail(`CSPICE coverage exited ${result.status}: ${result.stderr}`)
  return JSON.parse(result.stdout)
}

function vectorResidual(jplState, cspiceRow) {
  const cspiceState = [
    Number(cspiceRow.positionKm.x), Number(cspiceRow.positionKm.y), Number(cspiceRow.positionKm.z),
    Number(cspiceRow.velocityKmPerSecond.x), Number(cspiceRow.velocityKmPerSecond.y), Number(cspiceRow.velocityKmPerSecond.z),
  ]
  const residual = jplState.map((value, index) => value - cspiceState[index])
  return {
    positionComponentMaxAbsKm: Math.max(...residual.slice(0, 3).map(Math.abs)),
    positionNormKm: Math.hypot(...residual.slice(0, 3)),
    velocityComponentMaxAbsKmPerSecond: Math.max(...residual.slice(3).map(Math.abs)),
    velocityNormKmPerSecond: Math.hypot(...residual.slice(3)),
    cspiceState,
  }
}

function summarizeCspiceOverlap(corpus, jplRows, cspiceRows) {
  const comparisons = corpus.map((sample, index) => {
    const jpl = jplRows[index]
    const cspice = cspiceRows[index]
    if (cspice.etSeconds !== jpl.queryEt.toExponential(17) && Number(cspice.etSeconds) !== sample.etSeconds) fail(`CSPICE/JPL epoch mismatch at ${sample.sampleId}`)
    const residual = vectorResidual(jpl.stateKmKmPerSec, cspice)
    const jplCandidate = deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: jpl.stateKmKmPerSec, jdTt: sample.jdTt })
    const cspiceCandidate = deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: residual.cspiceState, jdTt: sample.jdTt })
    if (jplCandidate.availability !== 'available' || cspiceCandidate.availability !== 'available') fail(`CSPICE candidate unavailable at ${sample.sampleId}`)
    return { sampleId: sample.sampleId, etSeconds: sample.etSeconds, jdTdb: sample.jdTdb, ...residual, candidateCyclicDifferenceArcseconds: Math.abs(angularDifferenceDegrees(jplCandidate.longitudeDegrees, cspiceCandidate.longitudeDegrees)) * 3600, jplCandidateLongitudeDegrees: jplCandidate.longitudeDegrees, cspiceCandidateLongitudeDegrees: cspiceCandidate.longitudeDegrees }
  })
  const maxBy = (field) => comparisons.reduce((best, row) => row[field] > best[field] ? row : best, comparisons[0])
  const sortedCandidateDifferences = comparisons.map((row) => row.candidateCyclicDifferenceArcseconds).sort((a, b) => a - b)
  return {
    status: 'available',
    rowCount: comparisons.length,
    startJdTdb: corpus[0].jdTdb,
    endJdTdbInclusive: corpus.at(-1).jdTdb,
    stepDays: STEP_DAYS,
    positionNormMax: maxBy('positionNormKm'),
    velocityNormMax: maxBy('velocityNormKmPerSecond'),
    candidateDifferenceMax: maxBy('candidateCyclicDifferenceArcseconds'),
    candidateDifferenceMedianArcseconds: sortedCandidateDifferences[Math.floor((sortedCandidateDifferences.length - 1) / 2)],
    firstRow: comparisons[0],
  }
}

function summarize(rows) {
  const absoluteArcseconds = rows.map((row) => row.absoluteDifferenceArcseconds).sort((left, right) => left - right)
  const percentile = (fraction) => absoluteArcseconds[Math.min(absoluteArcseconds.length - 1, Math.floor((absoluteArcseconds.length - 1) * fraction))]
  const max = rows.reduce((best, row) => row.absoluteDifferenceArcseconds > best.absoluteDifferenceArcseconds ? row : best, rows[0])
  const firstNonIdentical = rows.find((row) => row.cyclicDifferenceDegrees !== 0) || null
  return {
    rowCount: rows.length,
    maxAbsoluteDifferenceArcseconds: max.absoluteDifferenceArcseconds,
    maxDifferenceSampleId: max.sampleId,
    p50AbsoluteDifferenceArcseconds: percentile(0.5),
    p95AbsoluteDifferenceArcseconds: percentile(0.95),
    p99AbsoluteDifferenceArcseconds: percentile(0.99),
    minAbsoluteDifferenceArcseconds: absoluteArcseconds[0],
    firstNonIdentical,
    rawWrapDisagreementCount: rows.filter((row) => Math.abs(row.rawDifferenceDegrees) > 180 && Math.abs(row.cyclicDifferenceDegrees) <= 180).length,
    tolerancePolicy: 'no acceptance tolerance declared; differences are diagnostic only',
  }
}

function compareJplToSwiss(corpus, jplRows, swiss) {
  if (jplRows.length !== corpus.length) fail(`JPL row count mismatch: ${jplRows.length} != ${corpus.length}`)
  return corpus.map((sample, index) => {
    const jpl = jplRows[index]
    if (jpl.sampleId !== sample.sampleId || jpl.evaluationStatus !== 'evaluated' || !Array.isArray(jpl.stateKmKmPerSec)) fail(`JPL state unavailable at ${sample.sampleId}`)
    const candidate = deriveOsculatingLunarNodeLongitude({ stateJ2000KmKmPerSec: jpl.stateKmKmPerSec, jdTt: sample.jdTt })
    if (candidate.availability !== 'available') fail(`Candidate unavailable at ${sample.sampleId}: ${candidate.reason}`)
    const swissRow = calculateSwissTrueNode(swiss, sample.jdUt)
    const rawDifferenceDegrees = candidate.longitudeDegrees - swissRow.longitude
    const cyclicDifferenceDegrees = angularDifferenceDegrees(candidate.longitudeDegrees, swissRow.longitude)
    return {
      index: sample.index,
      sampleId: sample.sampleId,
      jdTdb: sample.jdTdb,
      jdTt: sample.jdTt,
      jdUt: sample.jdUt,
      etSeconds: sample.etSeconds,
      tdbMinusTtSeconds: sample.tdbMinusTtSeconds,
      jplOuterRecordIndex: jpl.jplOuterRecordIndex,
      jplSubintervalIndex: jpl.jplSubintervalIndex,
      candidateLongitudeDegrees: candidate.longitudeDegrees,
      swissTrueNodeLongitudeDegrees: swissRow.longitude,
      rawDifferenceDegrees,
      cyclicDifferenceDegrees,
      absoluteDifferenceArcseconds: Math.abs(cyclicDifferenceDegrees) * 3600,
      swissEffectiveFlags: swissRow.effectiveFlags,
    }
  })
}

const corpus = buildCorpus()
const jplRows = evaluateJpl(corpus)
const swiss = await loadSwiss()
const rows = compareJplToSwiss(corpus, jplRows, swiss)
const worstSwissDifference = rows.reduce((best, row) => row.absoluteDifferenceArcseconds > best.absoluteDifferenceArcseconds ? row : best, rows[0])
const swissArgumentShift = summarizeSwissArgumentShift(corpus, rows, swiss)
const boundaryCorpus = buildBoundaryCorpus()
const boundaryRows = compareJplToSwiss(boundaryCorpus, evaluateJpl(boundaryCorpus), swiss)
const cspiceOverlapStartEt = (CSPICE_OVERLAP_START_JD_TDB - J2000) * DAY_SECONDS
const cspiceOverlapCorpus = Array.from({ length: CSPICE_OVERLAP_TIMESTAMP_COUNT }, (_, index) => {
  const etSeconds = cspiceOverlapStartEt + index * STEP_SECONDS
  return buildSample(index, `cspice-overlap-${String(index).padStart(4, '0')}`, J2000 + etSeconds / DAY_SECONDS, etSeconds)
})
const cspiceOverlapJplRows = evaluateJpl(cspiceOverlapCorpus)
const cspiceOverlapRows = evaluateCspiceGrid(cspiceOverlapCorpus)
const cspiceCoverage = readCspiceCoverage()
const cspiceOverlapSummary = summarizeCspiceOverlap(cspiceOverlapCorpus, cspiceOverlapJplRows, cspiceOverlapRows)

const swissFiles = ['swiss-spike.mjs', 'swiss-spike.wasm', 'swiss-spike.data'].map((fileName) => {
  const path = join(swissBuildPath, fileName)
  if (!existsSync(path) || !lstatSync(path).isFile()) fail(`Swiss artifact missing: ${path}`)
  return { path: relative(root, path), sizeBytes: readFileSync(path).byteLength, sha256: sha256File(path) }
})
const jplBuildMetadataPath = join(root, 'tools/de405-jpl-reader/build/runner-build.json')
const jplBuildMetadata = existsSync(jplBuildMetadataPath) ? JSON.parse(readFileSync(jplBuildMetadataPath, 'utf8')) : null
const cspiceBuildMetadataPath = join(root, 'tools/de405-cspice-runner/build/runner-build.json')
const cspiceBuildMetadata = existsSync(cspiceBuildMetadataPath) ? JSON.parse(readFileSync(cspiceBuildMetadataPath, 'utf8')) : null
const astrologManifestPath = join(root, 'spikes/astrology-independent-reference/fixtures/manifest.json')
const astrologManifest = existsSync(astrologManifestPath) ? JSON.parse(readFileSync(astrologManifestPath, 'utf8')) : null
const candidatePath = join(root, 'spikes/astrology-true-node-independent/src/trueNodeCandidate.js')
const materializerPath = fileURLToPath(import.meta.url)

const payload = {
  schemaVersion: 'astrology-true-node-independent-frontier-v0',
  availability: 'available',
  candidate: {
    schemaVersion: 'astrology-true-node-osculating-candidate-v0',
    status: 'experimental_not_production',
    definition: 'instantaneous geocentric lunar ascending node from h = r x v and k x h',
    sourceState: 'official JPL DE405 geocentric Moon state, J2000/ICRF, geometric, km and km/s',
    transform: 'repository IAU 2006 Fukushima-Williams precession plus mean obliquity',
    velocity: 'inertial velocity expressed in date axes; moving-frame derivative excluded from orbital-plane normal',
    implementationSha256: sha256File(candidatePath),
  },
  sourceIdentity: {
    jplData: { path: relative(root, jplBinaryPath), sizeBytes: readFileSync(jplBinaryPath).byteLength, sha256: sha256File(jplBinaryPath), role: 'independent_candidate_data_source' },
    jplReader: { path: relative(root, jplRunnerPath), sha256: sha256File(jplRunnerPath), sourceSha256: jplBuildMetadata?.readerSourceSha256 || null, entryPoint: 'DPLEPH', role: 'independent_candidate_executable', platform: jplBuildMetadata?.platform || null, architecture: jplBuildMetadata?.architecture || null },
    cspiceCrossReference: { runnerPath: relative(root, cspiceRunnerPath), runnerSha256: sha256File(cspiceRunnerPath), spkRole: 'independent_cross_reference_overlap_only', spkSizeBytes: readFileSync(cspiceSpkPath).byteLength, spkSha256: sha256File(cspiceSpkPath), toolkitVersion: cspiceBuildMetadata?.toolkitVersion || 'N0067', platform: cspiceBuildMetadata?.platform || null, architecture: cspiceBuildMetadata?.architecture || null, coverage: cspiceCoverage },
    swissReference: { engineVersion: swiss.ccall('astro_spike_version', 'string'), files: swissFiles, target: 'SE_TRUE_NODE=11', role: 'same-engine-regression_reference_only' },
    swissSource: { repository: 'https://github.com/aloistr/swisseph', commit: '59ac051b5a5812c684973ca0fcedb1c8c3e9c5dc', sourceCheckoutAvailable: false, sourceDataHashesRecordedIn: 'docs/astrology-wasm-spike-report.md' },
    astrologReference: astrologManifest ? { source: astrologManifest.source, build: astrologManifest.build, role: 'true-node-observation_not_accepted_as_authority' } : { status: 'manifest_missing' },
  },
  runtime: { nodeVersion: process.version, platform: process.platform, architecture: process.arch, jplRunnerPlatform: jplBuildMetadata?.platform || null, jplRunnerArchitecture: jplBuildMetadata?.architecture || null, cspiceRunnerPlatform: cspiceBuildMetadata?.platform || null, cspiceRunnerArchitecture: cspiceBuildMetadata?.architecture || null },
  productionRelation: {
    ephemerisBodyOrder: BODY_ORDER,
    de405BodyMapping: DE405_BODY_MAPPING,
    trueNodeInProductionEphemeris: BODY_ORDER.includes('true_node'),
    ruleCoreUnsupportedBodies: UNSUPPORTED_BODIES,
    trueNodeRuleStatus: UNSUPPORTED_BODIES.includes('true_node') ? 'unsupported' : 'not_declared',
    productionResultCompared: false,
    reason: 'current production raw chart excludes true_node and Rule Core declares true_node/mean_node unsupported; no production True Node numeric result exists to compare',
    activationChanged: false,
  },
  oracleCandidateInventory: [
    { id: 'jpl-de405-osculating-state-derived', status: 'experimental_candidate', data: 'official JPL DE405 binary', algorithm: 'state-vector cross-product', executable: 'official JPL reader', authority: 'blocked_semantic_identity_insufficient' },
    { id: 'cspice-de405-overlap', status: 'cross-reference_only', data: 'NAIF de405.bsp', algorithm: 'CSPICE spkez_c', executable: 'CSPICE N0067', authority: 'not_a_true_node_oracle' },
    { id: 'swiss-se-true-node', status: 'reference_only', data: 'Swiss compressed ephemeris artifacts', algorithm: 'Swiss SE_TRUE_NODE', executable: 'Swiss WASM', authority: 'same-engine-comparison_reference' },
    { id: 'astrolog-matrix-true-node', status: 'not_accepted', data: 'Astrolog Matrix build', algorithm: 'Astrolog ComputeLunar path', executable: 'Swiss/Placalc-disabled Astrolog build', authority: 'definition_and_accuracy_unproven' },
  ],
  corpus: {
    timeAxis: 'synthetic TDB grid',
    startJdTdb: START_JD_TDB,
    stepDays: STEP_DAYS,
    timestampCount: TIMESTAMP_COUNT,
    endJdTdbInclusive: corpus.at(-1).jdTdb,
    fixedSyntheticTtMinusUtcSeconds: SYNTHETIC_TT_MINUS_UTC_SECONDS,
    tdbMinusTtModel: 'repository deterministic periodic fixture: 0.001657*sin(357.53 + 0.9856003*(JD_TT-J2000))',
    productionTimeScaleStatus: 'not_proven_historical_utc_mapping',
    boundaryCoverage: ['1900 service start and +1 second', '2101 service end exclusive -1 second and exact endpoint'],
    boundaryRows,
  },
  comparison: {
    reference: 'Swiss SE_TRUE_NODE through existing WASM smoke binding',
    coordinateComparison: 'cyclic longitude difference in degrees, then arcseconds',
    numericStatus: 'mismatch_observed_no_tolerance_pass',
    summary: summarize(rows),
    diagnostics: { swissArgumentShift },
    rows,
  },
  cspiceOverlap: cspiceOverlapSummary,
  firstDivergenceClassification: {
    firstSwissDifference: rows[0],
    worstSwissDifference,
    firstCspiceStateDifference: cspiceOverlapSummary.firstRow,
    conventionBoundary: {
      candidate: {
        sourceFrame: 'J2000/ICRF equatorial state',
        outputFrame: 'mean ecliptic and equinox of date',
        nodeDefinition: 'instantaneous geocentric osculating ascending node from h = r x v and k x h',
      },
      swissReference: {
        binding: 'astro_spike_calculate_body',
        api: 'swe_calc_ut',
        target: 'SE_TRUE_NODE=11',
        effectiveFlags: requestedFlags,
        outputFrameMetadata: 'not emitted by the existing smoke binding',
        nodeDefinition: 'Swiss SE_TRUE_NODE; source-level semantic equivalence to the candidate is not established',
      },
      classification: 'frame_and_node_definition_equivalence_unresolved',
    },
    timeScaleArgumentShift: swissArgumentShift,
    eliminatedCauses: ['Swiss ephemeris fallback', 'cyclic wrap-around arithmetic', 'JPL out-of-coverage', 'missing JPL row'],
    unresolvedCauses: ['osculating versus Swiss True Node semantic definition', 'frame/equinox/nutation convention equivalence', 'historical TT/UTC mapping for the synthetic comparison axis'],
    status: 'root_cause_not_uniquely_identified_from_current_evidence',
  },
  independenceAssessment: {
    dataSource: { status: 'partial', evidence: 'JPL DE405 binary and Swiss compressed artifacts are distinct local artifacts; shared upstream lineage is not disproven' },
    algorithm: { status: 'independent_candidate', evidence: 'node derived from state-vector cross products; no Swiss node routine is called for the candidate' },
    executable: { status: 'independent_with_cspice_overlap_control', evidence: 'official JPL Fortran reader versus Swiss WASM C executable, with NAIF CSPICE N0067 overlap control' },
    fixture: { status: 'deterministic_comparison_fixture', evidence: 'corpus is generated from exact TDB grid and recorded artifact identities' },
    authority: { status: 'blocked', reason: 'candidate osculating-node semantics are not proven equivalent to Swiss SE_TRUE_NODE or an independent external True Node authority' },
    qualification: 'blocked_semantic_identity_insufficient',
  },
  readinessImpact: {
    independentTrueNodeReference: 'pending',
    productionProviderChanged: false,
    swissDependencyRemoved: false,
    activationChanged: false,
    toleranceChanged: false,
    interpretationEligibility: 'unchanged_blocked_by_existing_contracts',
  },
  provenance: {
    materializerPath: relative(root, materializerPath),
    materializerSha256: sha256File(materializerPath),
    candidatePath: relative(root, candidatePath),
    generatedWithoutNetwork: true,
  },
}
const output = { ...payload, payloadCanonicalSha256: canonicalSha256(payload) }
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ outputPath, payloadCanonicalSha256: output.payloadCanonicalSha256, rowCount: rows.length, summary: output.comparison.summary }, null, 2))
