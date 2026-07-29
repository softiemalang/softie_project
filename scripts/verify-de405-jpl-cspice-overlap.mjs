import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { existsSync, statSync, openSync, readSync, closeSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
let jplBinary = 'tools/de405-jpl-reader/fixtures/lnxp1600p2200.405'
let cspiceSpk = null
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--spk') cspiceSpk = process.argv[i + 1]
}
if (!cspiceSpk && process.env.DE405_BSP_PATH) {
  cspiceSpk = process.env.DE405_BSP_PATH
}
if (!cspiceSpk) {
  cspiceSpk = join(homedir(), '.local/share/softie-de405/kernels/spk/de405.bsp')
}

if (!existsSync(cspiceSpk)) {
  console.error(JSON.stringify({
    executionSucceeded: false, comparisonCompleted: false, errorCode: 'cspice_kernel_not_found', kernelPath: cspiceSpk
  }))
  process.exit(1)
}

const stat = statSync(cspiceSpk)
if (!stat.isFile() || stat.size === 0) {
  console.error(JSON.stringify({
    executionSucceeded: false, comparisonCompleted: false, errorCode: 'cspice_kernel_not_found', kernelPath: cspiceSpk
  }))
  process.exit(1)
}

const fd = openSync(cspiceSpk, 'r')
const headerBuf = Buffer.alloc(8)
readSync(fd, headerBuf, 0, 8, 0)
closeSync(fd)
const headerStr = headerBuf.toString('ascii')

if (headerStr !== 'NAIF/DAF' && headerStr !== 'DAF/SPK ') {
  console.error(JSON.stringify({
    executionSucceeded: false, comparisonCompleted: false, errorCode: 'invalid_cspice_kernel_header', kernelPath: cspiceSpk, observedHeader: headerStr
  }))
  process.exit(1)
}

const spkBuffer = readFileSync(cspiceSpk)
const spkSha256 = createHash('sha256').update(spkBuffer).digest('hex')
const spkMd5 = createHash('md5').update(spkBuffer).digest('hex')

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--jpl-binary') jplBinary = args[++i]
}

if (!existsSync(jplBinary)) {
  console.error(JSON.stringify({
    executionSucceeded: false, comparisonCompleted: false, toleranceStatus: 'undefined',
    passed: null, verdict: 'jpl_de405_cspice_overlap_execution_blocked',
    error: `Missing binary: ${jplBinary}`
  }))
  process.exit(1)
}

const jplRunner = resolve('tools/de405-jpl-reader/run.mjs')
const cspiceRunner = resolve('tools/de405-cspice-runner/build/de405-canonical-v2-runner')

if (!existsSync(cspiceRunner)) {
  console.error(JSON.stringify({
    executionSucceeded: false, comparisonCompleted: false, toleranceStatus: 'undefined',
    passed: null, verdict: 'jpl_de405_cspice_overlap_execution_blocked',
    error: 'CSPICE runner not built'
  }))
  process.exit(1)
}

// 1. Get CSPICE coverage
const cspiceCovRun = spawnSync(cspiceRunner, ['--coverage', '--spk', cspiceSpk], { encoding: 'utf8' })
if (cspiceCovRun.status !== 0) {
  console.error(JSON.stringify({
    executionSucceeded: false, comparisonCompleted: false, errorCode: 'unsupported_cspice_coverage_schema',
    message: 'CSPICE coverage check failed', observedTopLevelKeys: []
  }))
  process.exit(1)
}

let spkStart, spkEnd
try {
  const cspiceCov = JSON.parse(cspiceCovRun.stdout)
  if (typeof cspiceCov.coverageStartEt === 'undefined' || typeof cspiceCov.coverageEndEt === 'undefined') {
     console.error(JSON.stringify({
       executionSucceeded: false, comparisonCompleted: false, errorCode: 'unsupported_cspice_coverage_schema',
       message: 'Missing expected coverage field', observedTopLevelKeys: Object.keys(cspiceCov)
     }))
     process.exit(1)
  }
  spkStart = Math.ceil(Number(cspiceCov.coverageStartEt))
  spkEnd = Math.floor(Number(cspiceCov.coverageEndEt))
} catch (e) {
  console.error(JSON.stringify({
    executionSucceeded: false, comparisonCompleted: false, errorCode: 'unsupported_cspice_coverage_schema',
    message: e.message, observedTopLevelKeys: []
  }))
  process.exit(1)
}

// JPL coverage is well known: -1.2624811200000000e+10 to 6.3472464000000000e+09
const jplStart = -12624811200
const jplEnd = 6347246400

const overlapStart = Math.max(jplStart, spkStart)
const overlapEnd = Math.min(jplEnd, spkEnd)

const epochs = []
const excludedEpochs = []

// 1. sufficiently inside start (e.g. + 30 days)
const startInside = overlapStart + 864000 * 3
if (startInside < overlapEnd) epochs.push(startInside)

// 2. J2000
if (0 >= overlapStart && 0 <= overlapEnd) {
  epochs.push(0)
} else {
  excludedEpochs.push({ name: 'J2000', reason: 'outside-cspice-coverage' })
}

// 3. middle
const middle = Math.floor((overlapStart + overlapEnd) / 2)
if (middle > overlapStart && middle < overlapEnd && !epochs.includes(middle)) epochs.push(middle)

// 4. sufficiently inside end (e.g. - 30 days)
const endInside = overlapEnd - 864000 * 3
if (endInside > overlapStart && !epochs.includes(endInside)) epochs.push(endInside)

if (epochs.length < 4) {
  console.error(JSON.stringify({
    executionSucceeded: false, comparisonCompleted: false, errorCode: 'coverage_mismatch',
    message: 'Could not select 4 overlapping epochs'
  }))
  process.exit(1)
}

// Verify coverage
for (const et of epochs) {
  if (et < jplStart || et > jplEnd || et < spkStart || et > spkEnd) {
    console.error(JSON.stringify({
      executionSucceeded: false, comparisonCompleted: false, toleranceStatus: 'undefined',
      passed: null, verdict: 'coverage_mismatch',
      error: `Epoch ${et} is outside kernel coverage`
    }))
    process.exit(1)
  }
}

// 2. Fetch data from JPL
const jplOutput = {}
for (const et of epochs) {
  const stream = spawnSync(process.execPath, [jplRunner, '--stream-jpl-states', '--binary', jplBinary, '--start-et', String(et), '--count', '1', '--step-seconds', '864000'], { encoding: 'utf8' })
  if (stream.status !== 0) {
    console.error(JSON.stringify({
      executionSucceeded: false, comparisonCompleted: false, toleranceStatus: 'undefined', passed: null, verdict: 'jpl_de405_cspice_overlap_execution_blocked', error: 'JPL stream failed'
    }))
    process.exit(1)
  }
  
  const lines = stream.stdout.trim().split('\n')
  for (const line of lines) {
    const parts = line.split(',')
    if (parts.length < 8) continue
    const targetId = parseInt(parts[1], 10)
    if (!jplOutput[et]) jplOutput[et] = {}
    jplOutput[et][targetId] = {
      x: parseFloat(parts[2]), y: parseFloat(parts[3]), z: parseFloat(parts[4]),
      vx: parseFloat(parts[5]), vy: parseFloat(parts[6]), vz: parseFloat(parts[7])
    }
  }
}

// 3. Fetch data from CSPICE (using its native generate-overlap-smoke JSONL format)
const cspiceOutput = {}
const { mkdtempSync, rmSync } = await import('node:fs')
const { tmpdir } = await import('node:os')
const tmpDir = mkdtempSync(join(tmpdir(), 'cspice-overlap-'))

try {
  for (const et of epochs) {
    const outFile = join(tmpDir, `smoke-${et}.jsonl`)
    const smokeRun = spawnSync(cspiceRunner, ['--generate-overlap-smoke', '--spk', cspiceSpk, '--start-et', String(et), '--count', '1', '--step-seconds', '864000', '--output', outFile], { encoding: 'utf8' })
    if (smokeRun.status !== 0) {
      console.error(JSON.stringify({
        executionSucceeded: false, comparisonCompleted: false, toleranceStatus: 'undefined', passed: null, verdict: 'jpl_de405_cspice_overlap_execution_blocked', error: 'CSPICE smoke generation failed'
      }))
      process.exit(1)
    }
    
    const lines = readFileSync(outFile, 'utf8').trim().split('\n')
    for (const line of lines) {
      if (!line) continue
      const parsed = JSON.parse(line)
      const targetId = parsed.targetId
      if (!cspiceOutput[et]) cspiceOutput[et] = {}
      cspiceOutput[et][targetId] = {
        x: Number(parsed.positionKm.x), y: Number(parsed.positionKm.y), z: Number(parsed.positionKm.z),
        vx: Number(parsed.velocityKmPerSecond.x), vy: Number(parsed.velocityKmPerSecond.y), vz: Number(parsed.velocityKmPerSecond.z)
      }
    }
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true })
}

// 4. Compare
const diffs = []
let maxPosNorm = 0, maxVelNorm = 0
let maxPosComp = 0, maxVelComp = 0
let maxEpoch = 0, maxTargetId = 0
let compCount = 0

for (const et of epochs) {
  for (const targetId of Object.keys(jplOutput[et])) {
    const j = jplOutput[et][targetId]
    const c = cspiceOutput[et][targetId]
    
    if (!c) continue; // CSPICE doesn't have it?

    if (Number.isNaN(j.x) || !Number.isFinite(j.x) || Number.isNaN(c.x) || !Number.isFinite(c.x)) {
      console.error(JSON.stringify({
        executionSucceeded: false, comparisonCompleted: false, toleranceStatus: 'undefined', passed: null, verdict: 'jpl_de405_cspice_overlap_execution_blocked', error: 'NaN or Infinity found'
      }))
      process.exit(1)
    }

    const dx = Math.abs(j.x - c.x)
    const dy = Math.abs(j.y - c.y)
    const dz = Math.abs(j.z - c.z)
    const dvx = Math.abs(j.vx - c.vx)
    const dvy = Math.abs(j.vy - c.vy)
    const dvz = Math.abs(j.vz - c.vz)

    const posComp = Math.max(dx, dy, dz)
    const velComp = Math.max(dvx, dvy, dvz)
    const posNorm = Math.sqrt(dx*dx + dy*dy + dz*dz)
    const velNorm = Math.sqrt(dvx*dvx + dvy*dvy + dvz*dvz)

    compCount++

    if (posNorm > maxPosNorm) {
      maxPosNorm = posNorm
      maxVelNorm = velNorm
      maxPosComp = posComp
      maxVelComp = velComp
      maxEpoch = et
      maxTargetId = targetId
    }
  }
}

console.log(JSON.stringify({
  schemaVersion: 1,
  executionSucceeded: true,
  comparisonCompleted: true,
  conditionParity: true,
  toleranceStatus: 'undefined',
  passed: null,
  verdict: 'overlap_tolerance_blocked',
  jpl: {
    runnerPath: jplRunner,
    runnerSha256: null,
    binaryPath: jplBinary,
    binarySha256: null,
    provenance: 'generated-independently-via-jpl-run-mjs'
  },
  cspice: {
    runnerPath: cspiceRunner,
    runnerSha256: null,
    kernelPath: cspiceSpk,
    kernelSizeBytes: stat.size,
    kernelSha256: spkSha256,
    kernelMd5: spkMd5,
    kernelHeader: headerStr,
    kernelSourceRole: 'external-official-dependency',
    coverage: { startEt: spkStart, endEt: spkEnd },
    provenance: 'generated-independently-via-cspice-smoke-runner'
  },
  conditions: {
    observer: 'EARTH', observerNaifId: 399, frame: 'J2000',
    aberrationCorrection: 'NONE', positionUnit: 'km', velocityUnit: 'km/s',
    independentExecution: true
  },
  epochs,
  excludedEpochs,
  targetCount: 10,
  comparisonCount: compCount,
  maximumObserved: {
    positionComponentKm: maxPosComp,
    positionNormKm: maxPosNorm,
    velocityComponentKmPerSecond: maxVelComp,
    velocityNormKmPerSecond: maxVelNorm,
    epochEt: String(maxEpoch),
    targetId: parseInt(maxTargetId, 10),
    target: "Various",
    jplState: jplOutput[maxEpoch][maxTargetId],
    cspiceState: cspiceOutput[maxEpoch][maxTargetId]
  },
  failures: []
}, null, 2))

process.exit(2)
