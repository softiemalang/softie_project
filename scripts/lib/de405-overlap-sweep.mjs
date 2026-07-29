import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { once } from 'node:events'
import { createInterface } from 'node:readline'

export const comparisonManifest = [
  { caseId: 'mercury_barycenter', jplTarget: 1, spkTargetId: 1, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'venus_barycenter', jplTarget: 2, spkTargetId: 2, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'mars_barycenter', jplTarget: 4, spkTargetId: 4, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'jupiter_barycenter', jplTarget: 5, spkTargetId: 5, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'saturn_barycenter', jplTarget: 6, spkTargetId: 6, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'uranus_barycenter', jplTarget: 7, spkTargetId: 7, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'neptune_barycenter', jplTarget: 8, spkTargetId: 8, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'pluto_barycenter', jplTarget: 9, spkTargetId: 9, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'sun', jplTarget: 11, spkTargetId: 10, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' },
  { caseId: 'moon', jplTarget: 10, spkTargetId: 301, spkCenterId: 399, frameId: 1, frame: 'J2000', aberrationCorrection: 'NONE' }
]

export function nextUp(value) {
  if (!Number.isFinite(value)) return value
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value, false)
  let bits = view.getBigUint64(0, false)
  if (value >= 0) bits += 1n
  else bits -= 1n
  view.setBigUint64(0, bits, false)
  return view.getFloat64(0, false)
}

export function nextDown(value) {
  if (!Number.isFinite(value)) return value
  const view = new DataView(new ArrayBuffer(8))
  view.setFloat64(0, value, false)
  let bits = view.getBigUint64(0, false)
  if (value > 0) bits -= 1n
  else bits += 1n
  view.setBigUint64(0, bits, false)
  return view.getFloat64(0, false)
}

export function ulp(value) {
  if (!Number.isFinite(value)) return Number.NaN
  const absolute = Math.abs(value)
  if (absolute === 0) return Number.MIN_VALUE
  return Math.abs(nextUp(absolute) - absolute)
}

export function nearestRankPercentile(values, percentile) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.max(1, Math.ceil(percentile * sorted.length))
  return sorted[rank - 1]
}

export function metricSummary(values) {
  let maximum = null
  let finiteCount = 0
  let zeroCount = 0
  for (const value of values) {
    if (Number.isFinite(value)) {
      finiteCount++
      if (maximum === null || value > maximum) maximum = value
    }
    if (value === 0) zeroCount++
  }
  return {
    count: values.length,
    finiteCount,
    zeroCount,
    candidateFailureCount: 0,
    p50: nearestRankPercentile(values, 0.5),
    p95: nearestRankPercentile(values, 0.95),
    p99: nearestRankPercentile(values, 0.99),
    p99_9: nearestRankPercentile(values, 0.999),
    maximum
  }
}

export function stateArray(value, name) {
  const array = value?.stateKmKmPerSec
  if (!Array.isArray(array) || array.length !== 6 || !array.every(Number.isFinite)) throw new Error(`${name} state is not six finite numbers`)
  return array
}

export function residualEvidence(sample, jpl, cspice, contract) {
  if (jpl.sampleId !== sample.sampleId || cspice.sampleId !== sample.sampleId) throw new Error(`sampleId mismatch for ${sample.sampleId}`)
  if (jpl.queryEtHex !== sample.queryEtHex || cspice.queryEtHex !== sample.queryEtHex) throw new Error(`queryEtHex mismatch for ${sample.sampleId}`)
  if (!Array.isArray(cspice.stateKmKmPerSec) || !Array.isArray(jpl.stateKmKmPerSec)) return {
    ...sample,
    jplStateKmKmPerSec: Array.isArray(jpl.stateKmKmPerSec) ? jpl.stateKmKmPerSec : null,
    cspiceStateKmKmPerSec: Array.isArray(cspice.stateKmKmPerSec) ? cspice.stateKmKmPerSec : null,
    jplOuterRecordIndex: jpl.jplOuterRecordIndex ?? null,
    jplTargetSubintervalIndex: jpl.jplSubintervalIndex ?? null,
    jplSubintervalCount: jpl.jplSubintervalCount ?? null,
    spkSelectedRecordIndex: cspice.selectedRecordIndex ?? null,
    spkSelectionEvidenceStatus: cspice.selectionEvidenceStatus ?? 'unavailable',
    spkNormalizedTime: cspice.normalizedTime ?? null,
    recordSelectionRelation: 'metadata_relation_unavailable',
    evaluationStatus: cspice.selectionEvidenceStatus || jpl.evaluationStatus || 'execution_error',
    positionResidualKm: null,
    velocityResidualKmPerSec: null,
    requiredPositionUlpMultiplier: null,
    requiredVelocityUlpMultiplier: null,
    candidatePass: null
  }
  const jplState = stateArray(jpl, 'JPL')
  const cspiceState = stateArray(cspice, 'CSPICE')
  const positionResidualKm = [0, 1, 2].map(index => Math.abs(jplState[index] - cspiceState[index]))
  const velocityResidualKmPerSec = [3, 4, 5].map(index => Math.abs(jplState[index] - cspiceState[index]))
  const positionUlpFloors = [0, 1, 2].map(index => Math.max(ulp(jplState[index]), ulp(cspiceState[index])))
  const velocityUlpFloors = [3, 4, 5].map(index => Math.max(ulp(jplState[index]), ulp(cspiceState[index])))
  const positionUlpNormFloorKm = Math.hypot(...positionUlpFloors)
  const velocityUlpNormFloorKmPerSec = Math.hypot(...velocityUlpFloors)
  const positionNormKm = Math.hypot(...positionResidualKm)
  const velocityNormKmPerSec = Math.hypot(...velocityResidualKmPerSec)
  const requiredPositionUlpMultiplier = positionUlpNormFloorKm === 0 ? null : positionNormKm / positionUlpNormFloorKm
  const requiredVelocityUlpMultiplier = velocityUlpNormFloorKmPerSec === 0 ? null : velocityNormKmPerSec / velocityUlpNormFloorKmPerSec
  const effectivePositionToleranceKm = Math.max(contract.candidatePositionAbsoluteFloorKm, contract.candidatePositionUlpMultiplier * positionUlpNormFloorKm)
  const effectiveVelocityToleranceKmPerSec = Math.max(contract.candidateVelocityAbsoluteFloorKmPerSec, contract.candidateVelocityUlpMultiplier * velocityUlpNormFloorKmPerSec)
  const relation = sample.epochKind.startsWith('segment_coverage_')
    ? 'coverage_start'
    : sample.epochKind.includes('knot')
      ? (sample.epochKind === 'exact_knot' && cspice.selectionEvidenceStatus === 'verified' ? 'exact_knot_right_record_selected' : 'opposite_sides_of_shared_knot')
      : 'same_logical_interval'
  const evaluationStatus = cspice.selectionEvidenceStatus === 'verified' && jpl.evaluationStatus === 'evaluated' ? 'evaluated' : (cspice.selectionEvidenceStatus || jpl.evaluationStatus || 'execution_error')
  return {
    ...sample,
    jplStateKmKmPerSec: jplState,
    cspiceStateKmKmPerSec: cspiceState,
    jplOuterRecordIndex: jpl.jplOuterRecordIndex ?? null,
    jplTargetSubintervalIndex: jpl.jplSubintervalIndex ?? null,
    jplSubintervalCount: jpl.jplSubintervalCount ?? null,
    spkSelectedRecordIndex: cspice.selectedRecordIndex ?? null,
    spkSelectionEvidenceStatus: cspice.selectionEvidenceStatus ?? 'unavailable',
    spkNormalizedTime: cspice.normalizedTime ?? null,
    recordSelectionRelation: relation,
    evaluationStatus,
    positionResidualKm,
    positionMaxAbsoluteComponentKm: Math.max(...positionResidualKm),
    positionVectorNormKm: positionNormKm,
    positionUlpFloors,
    positionUlpNormFloorKm,
    requiredPositionUlpMultiplier,
    effectivePositionToleranceKm,
    positionWithinCandidateTolerance: positionNormKm <= effectivePositionToleranceKm,
    velocityResidualKmPerSec,
    velocityMaxAbsoluteComponentKmPerSec: Math.max(...velocityResidualKmPerSec),
    velocityVectorNormKmPerSec: velocityNormKmPerSec,
    velocityUlpFloors,
    velocityUlpNormFloorKmPerSec,
    requiredVelocityUlpMultiplier,
    effectiveVelocityToleranceKmPerSec,
    velocityWithinCandidateTolerance: velocityNormKmPerSec <= effectiveVelocityToleranceKmPerSec,
    candidatePass: positionNormKm <= effectivePositionToleranceKm && velocityNormKmPerSec <= effectiveVelocityToleranceKmPerSec
  }
}

export async function sha256File(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

export async function assertFile(path, label) {
  const info = await stat(path).catch(() => null)
  if (!info?.isFile() || info.size === 0) throw new Error(`${label} not found or empty: ${path}`)
  return { path, size: info.size, sha256: await sha256File(path) }
}

export async function writeCheckpoint(path, checkpoint) {
  await writeFile(path, JSON.stringify(checkpoint, null, 2) + '\n')
}

export async function readJsonLines(path) {
  const stream = createReadStream(path)
  const input = createInterface({ input: stream, crlfDelay: Infinity })
  const iterator = input[Symbol.asyncIterator]()
  return { input, stream, iterator }
}

export async function closeJsonLines(reader) {
  reader.input.close()
  reader.stream.destroy()
  await Promise.race([once(reader.input, 'close'), Promise.resolve()])
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true })
}
