import { spawnSync } from 'node:child_process'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { existsSync, statSync, openSync, readSync, closeSync, readFileSync, mkdtempSync, rmSync } from 'node:fs'

// Load Contract
let contractUrl = new URL('file://' + resolve('scripts/lib/de405-overlap-tolerance-contract.mjs'));
const { de405OverlapToleranceContract: contract } = await import(contractUrl);

const args = process.argv.slice(2)
let jplBinary = 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405'
let cspiceSpk = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--spk') cspiceSpk = args[i + 1]
  if (args[i] === '--jpl-binary') jplBinary = args[i + 1]
}
if (!cspiceSpk && process.env.DE405_BSP_PATH) cspiceSpk = process.env.DE405_BSP_PATH
if (!cspiceSpk) cspiceSpk = join(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp')

const exitWithError = (code, reason, kind = null, extra = {}) => {
  console.error(JSON.stringify({
    schemaVersion: 1,
    executionSucceeded: false,
    comparisonCompleted: false,
    toleranceStatus: contract.toleranceStatus,
    passed: null,
    verdict: 'overlap_tolerance_blocked',
    failureKind: kind,
    blockReason: reason,
    exitCode: code,
    ...extra
  }))
  process.exit(code)
}

if (!existsSync(cspiceSpk)) exitWithError(3, 'cspice_kernel_not_found', 'input_error', { kernelPath: cspiceSpk })
const stat = statSync(cspiceSpk)
if (!stat.isFile() || stat.size === 0) exitWithError(3, 'cspice_kernel_not_found', 'input_error', { kernelPath: cspiceSpk })
if (!existsSync(jplBinary)) exitWithError(3, 'jpl_binary_not_found', 'input_error', { binaryPath: jplBinary })

const fd = openSync(cspiceSpk, 'r')
const headerBuf = Buffer.alloc(8)
readSync(fd, headerBuf, 0, 8, 0)
closeSync(fd)
const headerStr = headerBuf.toString('ascii')
if (headerStr !== 'NAIF/DAF' && headerStr !== 'DAF/SPK ') exitWithError(3, 'invalid_cspice_kernel_header', 'input_error', { observedHeader: headerStr })

const spkBuffer = readFileSync(cspiceSpk)
const spkSha256 = createHash('sha256').update(spkBuffer).digest('hex')

const jplRunner = resolve('tools/de405-jpl-reader/run.mjs')
const cspiceRunner = resolve('tools/de405-cspice-runner/build/de405-canonical-v2-runner')
if (!existsSync(cspiceRunner)) exitWithError(3, 'cspice_runner_not_built', 'execution_error')

const metadataRun = spawnSync(cspiceRunner, ['--dump-spk-type2-segments', '--spk', cspiceSpk], { encoding: 'utf8' })
const metadataLines = metadataRun.stdout.trim() ? metadataRun.stdout.trim().split('\n') : []
let spkSegments = []
try { spkSegments = metadataLines.map(line => JSON.parse(line)).filter(item => item.recordType === 'spk_type2_segment_metadata') } catch { exitWithError(3, 'invalid_spk_metadata_evidence', 'execution_error') }
if (!spkSegments.length) exitWithError(3, 'spk_type2_metadata_unavailable', 'execution_error')
const spkRecordMetadataStatus = spkSegments.some(segment => segment.spkRecordMetadataStatus === 'metadata_invalid')
  ? 'metadata_invalid'
  : spkSegments.every(segment => segment.spkRecordMetadataStatus === 'verified') ? 'verified' : 'unavailable'
if (metadataRun.status !== 0 && spkRecordMetadataStatus === 'metadata_invalid') exitWithError(1, 'spk_type2_metadata_invalid', 'evidence_error', { spkRecordMetadataStatus })

const selectionEvidence = new Map()
function getSelectionEvidence(targetId, knotIndex) {
  const key = `${targetId}:${knotIndex}`
  if (selectionEvidence.has(key)) return selectionEvidence.get(key)
  const run = spawnSync(cspiceRunner, ['--inspect-spk-type2-knot', '--spk', cspiceSpk, '--target-id', String(targetId), '--knot-index', String(knotIndex)], { encoding: 'utf8' })
  if (run.status !== 0) { selectionEvidence.set(key, null); return null }
  const parsed = run.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
  selectionEvidence.set(key, parsed)
  return parsed
}

// Coverage
const cspiceCovRun = spawnSync(cspiceRunner, ['--coverage', '--spk', cspiceSpk], { encoding: 'utf8' })
if (cspiceCovRun.status !== 0) exitWithError(3, 'cspice_coverage_failed', 'execution_error')
let spkStart, spkEnd
try {
  const cspiceCov = JSON.parse(cspiceCovRun.stdout)
  spkStart = Number(cspiceCov.coverageStartEt)
  spkEnd = Number(cspiceCov.coverageEndEt)
} catch (e) {
  exitWithError(3, 'invalid_cspice_coverage', 'execution_error')
}
const jplStart = -12624811200
const jplEnd = 6347246400
const overlapStart = Math.max(jplStart, spkStart)
const overlapEnd = Math.min(jplEnd, spkEnd)

// NextUp / NextDown Helpers
function ulp(val) {
  if (Number.isNaN(val)) return NaN;
  if (Math.abs(val) === 0) return Number.MIN_VALUE;
  const buf = new ArrayBuffer(8);
  const f64 = new Float64Array(buf);
  const b64 = new BigInt64Array(buf);
  f64[0] = Math.abs(val);
  b64[0] = b64[0] + 1n;
  const next = f64[0];
  return next - Math.abs(val);
}

function nextUp(val) {
  if (Number.isNaN(val) || val === Number.POSITIVE_INFINITY) return val;
  if (val === -0) val = 0;
  const buf = new ArrayBuffer(8);
  const f64 = new Float64Array(buf);
  const b64 = new BigInt64Array(buf);
  f64[0] = val;
  if (val >= 0) b64[0] = b64[0] + 1n;
  else b64[0] = b64[0] - 1n;
  return f64[0];
}
function nextDown(val) {
  if (Number.isNaN(val) || val === Number.NEGATIVE_INFINITY) return val;
  if (val === 0) val = -0;
  const buf = new ArrayBuffer(8);
  const f64 = new Float64Array(buf);
  const b64 = new BigInt64Array(buf);
  f64[0] = val;
  if (val > 0) b64[0] = b64[0] - 1n;
  else b64[0] = b64[0] + 1n;
  return f64[0];
}

// Generate candidate epochs for one JPL logical record (32 days) near J2000.
// This is not evidence that the same interval is an SPK Type 2 record knot.
const recordLength = 2764800
let recordStart = jplStart
while (recordStart < overlapStart) {
  recordStart += recordLength
}
const recordEnd = recordStart + recordLength

// Also add bounds of canonical range for completeness
let canonicalStartRecord = jplStart
while (canonicalStartRecord + recordLength <= -3155716800) canonicalStartRecord += recordLength

let canonicalEndRecord = jplStart
while (canonicalEndRecord + recordLength <= 3187252800) canonicalEndRecord += recordLength

const generateEpochsForRecord = (start, end) => [
  start, nextUp(start), start + recordLength / 2, nextDown(end), end
]

const epochs = Array.from(new Set([
  ...generateEpochsForRecord(canonicalStartRecord, canonicalStartRecord + recordLength),
  ...generateEpochsForRecord(recordStart, recordEnd),
  ...generateEpochsForRecord(canonicalEndRecord, canonicalEndRecord + recordLength)
])).filter(et => et >= overlapStart && et <= overlapEnd).sort((a,b) => a - b)

const comparisonManifest = [
  { caseId: "mercury_barycenter", jplTarget: 1, spkTargetId: 1, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "venus_barycenter", jplTarget: 2, spkTargetId: 2, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "mars_barycenter", jplTarget: 4, spkTargetId: 4, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "jupiter_barycenter", jplTarget: 5, spkTargetId: 5, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "saturn_barycenter", jplTarget: 6, spkTargetId: 6, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "uranus_barycenter", jplTarget: 7, spkTargetId: 7, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "neptune_barycenter", jplTarget: 8, spkTargetId: 8, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "pluto_barycenter", jplTarget: 9, spkTargetId: 9, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "sun", jplTarget: 11, spkTargetId: 10, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" },
  { caseId: "moon", jplTarget: 10, spkTargetId: 301, spkCenterId: 399, frame: "J2000", aberrationCorrection: "NONE" }
]

const jplOutput = {}
const cspiceOutput = {}

const tmpDir = mkdtempSync(join(tmpdir(), 'cspice-overlap-'))
try {
  for (const et of epochs) {
    const stream = spawnSync(process.execPath, [jplRunner, '--stream-jpl-states', '--binary', jplBinary, '--start-et', String(et), '--count', '1', '--step-seconds', '864000'], { encoding: 'utf8' })
    if (stream.status !== 0) exitWithError(3, 'jpl_stream_failed', 'execution_error')

    jplOutput[et] = {}
    for (const line of stream.stdout.trim().split('\n')) {
      const parts = line.split(',')
      if (parts.length < 8) continue
      const tId = parseInt(parts[1], 10)
      jplOutput[et][tId] = {
        x: parseFloat(parts[2]), y: parseFloat(parts[3]), z: parseFloat(parts[4]),
        vx: parseFloat(parts[5]), vy: parseFloat(parts[6]), vz: parseFloat(parts[7])
      }
    }

    const outFile = join(tmpDir, `smoke-${et}.jsonl`)
    const smokeRun = spawnSync(cspiceRunner, ['--generate-overlap-smoke', '--spk', cspiceSpk, '--start-et', String(et), '--count', '1', '--step-seconds', '864000', '--output', outFile], { encoding: 'utf8' })
    if (smokeRun.status !== 0) exitWithError(3, 'cspice_smoke_failed', 'execution_error')
    
    cspiceOutput[et] = {}
    for (const line of readFileSync(outFile, 'utf8').trim().split('\n')) {
      if (!line) continue
      const parsed = JSON.parse(line)
      cspiceOutput[et][parsed.targetId] = parsed
    }
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}

let maxPosNorm = 0, maxVelNorm = 0
let failed = false

const detailedSamples = []
let compCount = 0

const ptTol = contract.candidatePositionToleranceKm
const vtTol = contract.candidateVelocityToleranceKmPerSec

for (const et of epochs) {
  for (const mapping of comparisonManifest) {
    const j = jplOutput[et][mapping.spkTargetId]
    const cObj = cspiceOutput[et][mapping.spkTargetId]
    if (!j || !cObj) exitWithError(3, 'missing_target_data', 'execution_error')
    
    const c = cObj.state || {
        x: Number(cObj.positionKm.x), y: Number(cObj.positionKm.y), z: Number(cObj.positionKm.z),
        vx: Number(cObj.velocityKmPerSecond.x), vy: Number(cObj.velocityKmPerSecond.y), vz: Number(cObj.velocityKmPerSecond.z)
    }

    if (!Number.isFinite(j.x) || !Number.isFinite(c.x)) exitWithError(3, 'invalid_number_found', 'execution_error')

    const dx = Math.abs(j.x - c.x)
    const dy = Math.abs(j.y - c.y)
    const dz = Math.abs(j.z - c.z)
    const dvx = Math.abs(j.vx - c.vx)
    const dvy = Math.abs(j.vy - c.vy)
    const dvz = Math.abs(j.vz - c.vz)

    const posNorm = Math.hypot(dx, dy, dz)
    const velNorm = Math.hypot(dvx, dvy, dvz)

    if (posNorm > maxPosNorm) maxPosNorm = posNorm
    if (velNorm > maxVelNorm) maxVelNorm = velNorm

    const componentUlpFloors = [
      Math.max(ulp(j.x), ulp(c.x)),
      Math.max(ulp(j.y), ulp(c.y)),
      Math.max(ulp(j.z), ulp(c.z))
    ]
    const positionUlpNormFloorKm = contract.candidatePositionUlpMultiplier * Math.hypot(...componentUlpFloors)
    const effectivePositionToleranceKm = Math.max(contract.candidatePositionAbsoluteFloorKm, positionUlpNormFloorKm)

    const velocityComponentUlpFloors = [
      Math.max(ulp(j.vx), ulp(c.vx)),
      Math.max(ulp(j.vy), ulp(c.vy)),
      Math.max(ulp(j.vz), ulp(c.vz))
    ]
    const velocityUlpNormFloorKmPerSec = contract.candidateVelocityUlpMultiplier * Math.hypot(...velocityComponentUlpFloors)
    const effectiveVelocityToleranceKmPerSec = Math.max(contract.candidateVelocityAbsoluteFloorKmPerSec, velocityUlpNormFloorKmPerSec)

    compCount++

    const isFail = (posNorm > effectivePositionToleranceKm || velNorm > effectiveVelocityToleranceKmPerSec)
    if (isFail) failed = true

    // Calculate a JPL logical-record candidate index. SPK segment and Type 2
    // record metadata are intentionally not inferred from the JPL block size.
    const recordOffset = (et - jplStart) / recordLength
    const jplRecordIndex = Math.floor(recordOffset)
    const isBoundary = Math.abs(recordOffset - Math.round(recordOffset)) < 1e-12
    let etKind = "midpoint"
    if (isBoundary) etKind = "exact_record_knot_candidate"
    else if (et === nextUp(jplStart + Math.round(recordOffset) * recordLength)) etKind = "exact_record_knot_candidate_nextUp"
    else if (et === nextDown(jplStart + Math.round(recordOffset) * recordLength)) etKind = "exact_record_knot_candidate_nextDown"

    const positionRequiredUlpMultiplier = positionUlpNormFloorKm === 0
      ? null
      : posNorm / Math.hypot(...componentUlpFloors)
    const velocityRequiredUlpMultiplier = velocityUlpNormFloorKmPerSec === 0
      ? null
      : velNorm / Math.hypot(...velocityComponentUlpFloors)

    const applicableSegments = spkSegments.filter(segment => segment.targetId === mapping.spkTargetId && et >= segment.segmentStartEt && et <= segment.segmentEndEt)
    const spkSegment = applicableSegments.length === 1 ? applicableSegments[0] : null
    const spkKnotOffsetRaw = spkSegment ? (et - spkSegment.initEt) / spkSegment.intlenSec : NaN
    const spkKnotOffset = Number.isFinite(spkKnotOffsetRaw) ? Math.round(spkKnotOffsetRaw) : NaN
    const spkKnotEt = spkSegment ? spkSegment.initEt + spkKnotOffset * spkSegment.intlenSec : NaN
    const spkProbeKind = spkSegment && spkKnotOffset > 0 && spkKnotOffset < spkSegment.recordCount
      ? (Object.is(et, spkKnotEt) ? 'exact_record_knot' : Object.is(et, nextDown(spkKnotEt)) ? 'nextDown' : Object.is(et, nextUp(spkKnotEt)) ? 'nextUp' : null)
      : null
    const isSpkProbe = Boolean(spkProbeKind)
    const knotEvidence = isSpkProbe ? getSelectionEvidence(mapping.spkTargetId, spkKnotOffset) : null
    const exactEvidence = knotEvidence?.find(item => item.epochKind === spkProbeKind && Object.is(Number(item.queryEt), et))
    const spkSelectionEvidenceStatus = exactEvidence?.selectionEvidenceStatus ?? (spkSegment ? (applicableSegments.length > 1 ? 'selection_ambiguous' : 'not_applicable') : 'unavailable')
    const spkSelectedRecordIndex = exactEvidence?.selectedRecordIndex ?? null
    const spkNormalizedTime = spkSegment && spkSelectedRecordIndex !== null
      ? exactEvidence.candidateEvaluations.find(candidate => candidate.recordIndex === spkSelectedRecordIndex)?.normalizedTime ?? null
      : null
    const recordSelectionRelation = !spkSegment ? 'metadata_unavailable'
      : spkSelectionEvidenceStatus === 'selection_ambiguous' ? 'spk_selection_ambiguous'
      : isSpkProbe ? 'opposite_sides_of_knot' : 'not_a_shared_knot'

    detailedSamples.push({
      epochEt: et,
      epochKind: etKind,
      jplOuterRecordIndex: jplRecordIndex,
      jplTargetSubintervalIndex: null,
      spkSegmentOrdinal: spkSegment?.segmentOrdinal ?? null,
      spkSegmentId: spkSegment?.segmentId ?? null,
      spkInitEt: spkSegment?.initEt ?? null,
      spkIntlenSec: spkSegment?.intlenSec ?? null,
      spkRsize: spkSegment?.rsize ?? null,
      spkRecordCount: spkSegment?.recordCount ?? null,
      spkPolynomialDegree: spkSegment?.polynomialDegree ?? null,
      spkKnotIndex: isSpkProbe ? spkKnotOffset : null,
      spkSelectedRecordIndex,
      spkSelectionEvidenceStatus,
      jplNormalizedTime: null,
      spkNormalizedTime,
      recordSelectionRelation,
      caseId: mapping.caseId,
      spkTargetId: mapping.spkTargetId,
      positionVectorNormKm: posNorm,
      positionAbsoluteFloorKm: contract.candidatePositionAbsoluteFloorKm,
      positionUlpNormFloorKm,
      positionUlpMultiplier: contract.candidatePositionUlpMultiplier,
      requiredPositionUlpMultiplier: positionRequiredUlpMultiplier,
      effectivePositionToleranceKm,
      positionWithinTolerance: posNorm <= effectivePositionToleranceKm,
      velocityVectorNormKmPerSec: velNorm,
      velocityAbsoluteFloorKmPerSec: contract.candidateVelocityAbsoluteFloorKmPerSec,
      velocityUlpNormFloorKmPerSec,
      velocityUlpMultiplier: contract.candidateVelocityUlpMultiplier,
      requiredVelocityUlpMultiplier: velocityRequiredUlpMultiplier,
      effectiveVelocityToleranceKmPerSec,
      velocityWithinTolerance: velNorm <= effectiveVelocityToleranceKmPerSec,
      pass: !isFail
    })
  }
}

const isCandidate = (contract.toleranceStatus === 'candidate')
const isBlocked = isCandidate && !failed
const exitCode = failed ? 1 : (isCandidate ? 2 : 0)

const result = {
  schemaVersion: 1,
  executionSucceeded: true,
  comparisonCompleted: true,
  conditionParity: true,
  toleranceStatus: contract.toleranceStatus,
  numericEvaluation: failed ? "tolerance_exceeded" : (isCandidate ? "within_candidate_bounds" : "within_active_bounds"),
  verifierStatus: 'implementation_operational',
  candidateContractStatus: failed ? 'rejected_by_observed_boundary_residuals' : 'not_rejected',
  activeContractStatus: 'not_established',
  spkRecordMetadataStatus,
  spk_record_metadata_status: spkRecordMetadataStatus,
  passed: !failed,
  verdict: failed ? "overlap_tolerance_exceeded" : (isCandidate ? "overlap_tolerance_blocked" : "overlap_verified"),
  failureKind: failed ? "tolerance_exceeded" : null,
  blockReason: isBlocked ? "candidate_contract_not_active" : null,
  exitCode: exitCode,
  jpl: {
    runnerPath: jplRunner,
    binaryPath: jplBinary,
    provenance: 'generated-independently-via-jpl-run-mjs',
    testephAuContext: '149597870.691 km (from DE405 header CONST array)'
  },
  cspice: {
    runnerPath: cspiceRunner,
    kernelPath: cspiceSpk,
    coverage: { startEt: spkStart, endEt: spkEnd },
    provenance: 'generated-independently-via-cspice-smoke-runner'
  },
  comparisonManifest,
  comparisonConditions: {
    referenceFrame: "J2000", stateKind: "geometric", aberrationCorrection: "NONE", timeScale: "TDB", positionUnit: "km", velocityUnit: "km/s", comparisonCoverage: "intersection"
  },
  epochs,
  comparisonCount: compCount,
  maximumObserved: {
    positionNormKm: maxPosNorm,
    velocityNormKmPerSecond: maxVelNorm
  },
  samples: detailedSamples
}

console.log(JSON.stringify(result, null, 2))
process.exitCode = exitCode
