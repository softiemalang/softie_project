#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

export const MAX_ULP_DISTANCE = 1
export const LATENCY_REDUCTION_FLOOR = 0.2

const FLOAT_FIELD_PATH = 'document.pages[].lines[].layout.confidence'
const FLOAT_SCALAR_TYPE = 'float'
const FLOAT_ENCODING = 'IEEE-754-binary32'
const OLD_DECISION = 'FULL_8_REVALIDATION_NOT_PROVEN'
const SOURCE_GOLD_SET_SHA256 = 'f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b'
const INPUT_MANIFEST_SHA256 = '33e656dfcc479ce9a48e9638c96258b48e8cf1dd7fa29187753798ce34ff5315'
const LINE_IDS = [
  'saju-main-title-line',
  'saju-folio-line',
  'ziwei-title-line',
  'astrology-title-line',
]
const HASH = /^[a-f0-9]{64}$/
const FORBIDDEN_PAYLOAD_KEYS = new Set([
  'accessToken',
  'authorization',
  'credential',
  'goldText',
  'imageBytes',
  'imageData',
  'predictionText',
  'rawApiResponse',
  'rawResponse',
  'responseBody',
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

const canonical = value => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

const structurallyEqual = (left, right) => canonical(left) === canonical(right)

export const float32Bits = value => {
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)
  view.setFloat32(0, value, false)
  return view.getUint32(0, false)
}

const float32FromBits = bits => {
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)
  view.setUint32(0, bits, false)
  return view.getFloat32(0, false)
}

export const ulpDistance = (left, right) => {
  if (typeof left !== 'number' || typeof right !== 'number') return null
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null
  if (left < 0 || left > 1 || right < 0 || right > 1) return null
  return Math.abs(float32Bits(left) - float32Bits(right))
}

const addError = (errors, error) => {
  if (!errors.includes(error)) errors.push(error)
}

const validHash = value => typeof value === 'string' && HASH.test(value)

const validConfidenceSummary = confidence => {
  if (!isObject(confidence)) return false
  if (confidence.present !== true || confidence.source !== 'line' || confidence.count !== 1) return false
  if (!validHash(confidence.valuesSha256)) return false
  const values = [confidence.min, confidence.mean, confidence.max]
  if (!values.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1)) return false
  return confidence.min === confidence.mean && confidence.mean === confidence.max
}

const baseRecords = input => {
  const lines = input?.provider?.summary?.lineResults
  if (!Array.isArray(lines)) return []
  return lines.flatMap(line => (Array.isArray(line.runs) ? line.runs : []).map(run => ({ ...run, lineId: run.lineId ?? line.lineId })))
}

const optimizedRecords = input => Array.isArray(input?.records) ? input.records : []

const recordKey = run => `${run?.lineId ?? ''}\u0000${run?.repeat ?? ''}`

const indexedRecords = records => {
  const map = new Map()
  const duplicates = []
  for (const record of records) {
    const key = recordKey(record)
    if (map.has(key)) duplicates.push(key)
    map.set(key, record)
  }
  return { map, duplicates }
}

const expectedKeys = LINE_IDS.flatMap(lineId => [1, 2].map(repeat => `${lineId}\u0000${repeat}`))

const confidenceEvidence = (baselineMap, optimizedMap) => {
  const rawRecords = []
  const baseParity = []
  const repeatStability = []
  const errors = []

  for (const key of expectedKeys) {
    const baseline = baselineMap.get(key)
    const optimized = optimizedMap.get(key)
    const [lineId, repeatText] = key.split('\u0000')
    const repeat = Number(repeatText)
    if (!baseline || !optimized) {
      addError(errors, `confidence_record_missing:${lineId}:${repeat}`)
      continue
    }
    const baseConfidence = baseline.confidence
    const optimizedConfidence = optimized.confidence
    const baseValid = validConfidenceSummary(baseConfidence)
    const optimizedValid = validConfidenceSummary(optimizedConfidence)
    rawRecords.push({
      lineId,
      repeat,
      baseSource: baseConfidence?.source ?? null,
      optimizedSource: optimizedConfidence?.source ?? null,
      baseDigest: baseConfidence?.valuesSha256 ?? null,
      optimizedDigest: optimizedConfidence?.valuesSha256 ?? null,
      valid: baseValid && optimizedValid,
    })
    if (!baseValid || !optimizedValid) addError(errors, `confidence_provenance_invalid:${lineId}:${repeat}`)
    const distance = ulpDistance(baseConfidence?.mean, optimizedConfidence?.mean)
    baseParity.push({
      lineId,
      repeat,
      baseValue: baseConfidence?.mean ?? null,
      optimizedValue: optimizedConfidence?.mean ?? null,
      baseBinary32: typeof baseConfidence?.mean === 'number' ? float32Bits(baseConfidence.mean).toString(16).padStart(8, '0') : null,
      optimizedBinary32: typeof optimizedConfidence?.mean === 'number' ? float32Bits(optimizedConfidence.mean).toString(16).padStart(8, '0') : null,
      ulpDistance: distance,
    })
    if (distance === null || distance > MAX_ULP_DISTANCE) addError(errors, `confidence_base_parity_out_of_bound:${lineId}:${repeat}`)
  }

  for (const lineId of LINE_IDS) {
    const first = optimizedMap.get(`${lineId}\u00001`)
    const second = optimizedMap.get(`${lineId}\u00002`)
    const distance = ulpDistance(first?.confidence?.mean, second?.confidence?.mean)
    repeatStability.push({ lineId, ulpDistance: distance })
    if (distance === null || distance > MAX_ULP_DISTANCE) addError(errors, `confidence_repeat_out_of_bound:${lineId}`)
  }

  const max = values => values.length ? Math.max(...values) : null
  const baseParityDistances = baseParity.map(item => item.ulpDistance).filter(value => value !== null)
  const repeatDistances = repeatStability.map(item => item.ulpDistance).filter(value => value !== null)
  const rawDigestMatchingRecords = rawRecords.filter(item => item.baseDigest === item.optimizedDigest).length
  const rawProvenancePass = errors.length === 0 && rawRecords.length === 8 && rawRecords.every(item => item.valid)
  const semanticPass = errors.length === 0 && baseParity.length === 8 && repeatStability.length === 4 && baseParity.every(item => item.ulpDistance !== null && item.ulpDistance <= MAX_ULP_DISTANCE) && repeatStability.every(item => item.ulpDistance !== null && item.ulpDistance <= MAX_ULP_DISTANCE)

  return {
    pass: rawProvenancePass && semanticPass,
    errors,
    rawConfidenceProvenance: {
      status: rawProvenancePass ? 'PASS' : 'FAIL',
      fieldPath: FLOAT_FIELD_PATH,
      protoScalarType: FLOAT_SCALAR_TYPE,
      wireEncoding: FLOAT_ENCODING,
      allowedRange: [0, 1],
      retention: 'digest_only',
      rawLexemeRetention: 'not_retained',
      records: rawRecords.length,
      digestMatchingRecords: rawDigestMatchingRecords,
      recordsWithValidBindingAndDigest: rawRecords.filter(item => item.valid).length,
    },
    semanticConfidenceStability: {
      status: semanticPass ? 'PASS' : 'FAIL',
      comparison: 'binary32_ulp_distance',
      maxUlpDistance: MAX_ULP_DISTANCE,
      maxBaseParityUlpDistance: max(baseParityDistances),
      maxRepeatUlpDistance: max(repeatDistances),
      baseParityRecords: baseParity.length,
      repeatStableLines: repeatStability.filter(item => item.ulpDistance !== null && item.ulpDistance <= MAX_ULP_DISTANCE).length,
      baseParity,
      repeatStability,
    },
  }
}

const walkForbiddenPayload = (value, path, errors) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForbiddenPayload(item, `${path}[${index}]`, errors))
    return
  }
  if (!isObject(value)) return
  Object.entries(value).forEach(([key, child]) => {
    if (FORBIDDEN_PAYLOAD_KEYS.has(key)) addError(errors, `raw_or_secret_retained:${path}.${key}`)
    walkForbiddenPayload(child, `${path}.${key}`, errors)
  })
}

const compareCoreRecords = (baselineMap, optimizedMap) => {
  const rows = []
  const errors = []
  for (const key of expectedKeys) {
    const baseline = baselineMap.get(key)
    const optimized = optimizedMap.get(key)
    const [lineId, repeatText] = key.split('\u0000')
    const repeat = Number(repeatText)
    if (!baseline || !optimized) {
      addError(errors, `core_record_missing:${lineId}:${repeat}`)
      continue
    }
    const preserved = (
      baseline.status === 'SUCCEEDED' && optimized.status === 'SUCCEEDED' &&
      baseline.exactMatch === optimized.exactMatch &&
      baseline.goldCharacterCount === optimized.goldCharacterCount &&
      baseline.editDistance === optimized.editDistance &&
      baseline.characterErrorRate === optimized.characterErrorRate &&
      baseline.goldTextSha256 === optimized.goldTextSha256 &&
      baseline.inputImageSha256 === optimized.inputImageSha256 &&
      baseline.predictionTextSha256 === optimized.predictionTextSha256 &&
      baseline.predictionNormalizedTextSha256 === optimized.predictionNormalizedTextSha256 &&
      baseline.geometry?.geometrySha256 === optimized.geometry?.geometrySha256
    )
    rows.push({ lineId, repeat, preserved })
    if (!preserved) addError(errors, `core_output_not_preserved:${lineId}:${repeat}`)
  }
  return { pass: errors.length === 0 && rows.length === 8, errors, rows }
}

const aggregateMetrics = records => {
  const successful = records.filter(record => record.status === 'SUCCEEDED')
  const exactMatchRuns = successful.filter(record => record.exactMatch === true).length
  const goldCharacters = successful.reduce((sum, record) => sum + Number(record.goldCharacterCount || 0), 0)
  const editDistance = successful.reduce((sum, record) => sum + Number(record.editDistance || 0), 0)
  const latencies = successful.map(record => Number(record.latencyMs)).filter(Number.isFinite)
  return {
    successfulRuns: successful.length,
    exactMatchRuns,
    exactMatchRate: successful.length ? exactMatchRuns / successful.length : null,
    characterErrorRate: goldCharacters ? editDistance / goldCharacters : null,
    latencyMeanMs: latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : null,
    latencyMaxMs: latencies.length ? Math.max(...latencies) : null,
    latencyMinMs: latencies.length ? Math.min(...latencies) : null,
  }
}

const expectedRequest = {
  clientReuse: false,
  fieldMask: 'text,pages.pageNumber,pages.dimension,pages.lines,pages.tokens',
  imagelessMode: true,
  omittedFeatures: ['enableImageQualityScores', 'enableSymbol', 'premiumFeatureFlags'],
  processOptionsIncluded: false,
  retryCount: 0,
  timeoutSec: 300,
  transport: 'urllib.request.urlopen_per_request',
}

const checkBoundaries = input => {
  const boundaries = input?.boundaries ?? {}
  return (
    boundaries.BLOCK_OCR_ROUTE === true &&
    boundaries.OCRProvider?.enabled === false &&
    boundaries.activation === false &&
    boundaries.detectionSlotTouched === false &&
    boundaries.semanticCorrection === false &&
    boundaries.silentFallback === false &&
    boundaries.search === false &&
    boundaries.historicalSourceJudgment === false
  )
}

const checkCandidateOnly = input => {
  const promotion = input?.promotion ?? {}
  return promotion.candidateEvidenceOnly === true && promotion.automaticActivation === false && promotion.separateDecisionRequired === true
}

export const adjudicate = (baseline, optimized, fileMetadata = {}) => {
  const errors = []
  const base = baseRecords(baseline)
  const trial = optimizedRecords(optimized)
  const baseIndex = indexedRecords(base)
  const trialIndex = indexedRecords(trial)
  if (baseIndex.duplicates.length) addError(errors, 'baseline_duplicate_record_keys')
  if (trialIndex.duplicates.length) addError(errors, 'optimized_duplicate_record_keys')

  const source = optimized?.source ?? {}
  const sourcePass = (
    source.sourceGoldSetSha256 === SOURCE_GOLD_SET_SHA256 &&
    source.inputManifestSha256 === INPUT_MANIFEST_SHA256 &&
    source.selectedLineCount === 4 &&
    structurallyEqual(source.selectedLineIds, LINE_IDS) &&
    source.sameInputBytes === true
  )
  if (!sourcePass) addError(errors, 'source_binding_invalid')

  const statusPass = optimized?.status === 'COMPLETED' && trial.length === 8 && optimized?.protocol?.attemptedRequests === 8 && optimized?.protocol?.successfulRequests === 8 && optimized?.protocol?.failedRequests === 0
  if (!statusPass) addError(errors, 'optimized_eight_successful_requests_invalid')

  const requestPass = structurallyEqual(optimized?.request, expectedRequest)
  if (!requestPass) addError(errors, 'optimized_request_shape_invalid')

  const protocolBoundaryPass = optimized?.protocol?.fallbackUsed === false && optimized?.protocol?.semanticCorrection === false && optimized?.protocol?.rawApiResponseRetained === false && optimized?.protocol?.rawPredictionTextRetained === false && optimized?.protocol?.repeatsPerSelectedLine === 2
  if (!protocolBoundaryPass) addError(errors, 'protocol_boundary_invalid')

  const core = compareCoreRecords(baseIndex.map, trialIndex.map)
  core.errors.forEach(error => addError(errors, error))
  const confidence = confidenceEvidence(baseIndex.map, trialIndex.map)
  confidence.errors.forEach(error => addError(errors, error))

  const baseMetrics = aggregateMetrics(base)
  const trialMetrics = aggregateMetrics(trial)
  const meanReductionRate = baseMetrics.latencyMeanMs && trialMetrics.latencyMeanMs !== null ? 1 - trialMetrics.latencyMeanMs / baseMetrics.latencyMeanMs : null
  const maxReductionRate = baseMetrics.latencyMaxMs && trialMetrics.latencyMaxMs !== null ? 1 - trialMetrics.latencyMaxMs / baseMetrics.latencyMaxMs : null
  const latencyPass = meanReductionRate !== null && maxReductionRate !== null && meanReductionRate >= LATENCY_REDUCTION_FLOOR && maxReductionRate >= LATENCY_REDUCTION_FLOOR
  if (!latencyPass) addError(errors, 'latency_reduction_below_floor')

  const boundaryPass = checkBoundaries(optimized)
  if (!boundaryPass) addError(errors, 'route_or_operation_boundary_invalid')
  const candidateOnlyPass = checkCandidateOnly(optimized)
  if (!candidateOnlyPass) addError(errors, 'candidate_only_boundary_invalid')
  const oldDecisionPreserved = optimized?.decision === OLD_DECISION
  if (!oldDecisionPreserved) addError(errors, 'previous_decision_not_preserved')

  const forbiddenPayloadErrors = []
  walkForbiddenPayload(optimized, '$', forbiddenPayloadErrors)
  forbiddenPayloadErrors.forEach(error => addError(errors, error))

  const checks = {
    sourceBinding: sourcePass,
    eightSuccessfulRequests: statusPass,
    requestShape: requestPass,
    protocolBoundary: protocolBoundaryPass,
    rawConfidenceProvenance: confidence.rawConfidenceProvenance.status === 'PASS',
    semanticConfidenceStability: confidence.semanticConfidenceStability.status === 'PASS',
    exactCerTextGeometryPreserved: core.pass,
    latencyReduction: latencyPass,
    boundaries: boundaryPass,
    candidateOnly: candidateOnlyPass,
    noRawOrSecretPayload: forbiddenPayloadErrors.length === 0,
    previousDecisionPreserved: oldDecisionPreserved,
  }
  const pass = Object.values(checks).every(Boolean) && errors.length === 0
  return {
    schema: 'historical-ocr-document-ai-confidence-float-aware-gate-v2',
    status: pass ? 'PASSED' : 'FAIL_CLOSED',
    decision: pass ? 'OPTIMIZED_REQUEST_SHAPE_CANDIDATE' : 'FAIL_CLOSED_BASE_RETAINED',
    fixedPolicy: {
      confidenceFieldPath: FLOAT_FIELD_PATH,
      protoScalarType: FLOAT_SCALAR_TYPE,
      wireEncoding: FLOAT_ENCODING,
      allowedRange: [0, 1],
      maxUlpDistance: MAX_ULP_DISTANCE,
      latencyReductionFloor: LATENCY_REDUCTION_FLOOR,
      toleranceSelection: 'pre_registered_from_scalar_type; no evidence-derived decimal epsilon',
    },
    source: {
      baselineFile: fileMetadata.baselinePath ?? null,
      optimizedFile: fileMetadata.optimizedPath ?? null,
      baselineFileSha256: fileMetadata.baselineSha256 ?? null,
      optimizedFileSha256: fileMetadata.optimizedSha256 ?? null,
      sourceGoldSetSha256: source.sourceGoldSetSha256 ?? null,
      inputManifestSha256: source.inputManifestSha256 ?? null,
    },
    checks,
    errors,
    rawConfidenceProvenance: confidence.rawConfidenceProvenance,
    semanticConfidenceStability: confidence.semanticConfidenceStability,
    metrics: {
      baseline: baseMetrics,
      optimized: trialMetrics,
      meanReductionRate,
      maxReductionRate,
      exactCerTextGeometryRecords: core.rows.filter(row => row.preserved).length,
    },
    optimizedRequestShape: {
      status: pass ? 'PROMOTED_CANDIDATE_ONLY' : 'NOT_PROMOTED',
      request: optimized?.request ?? null,
      automaticActivation: false,
      activation: false,
      separateDecisionRequired: true,
    },
    previousDecisionPreserved: {
      artifactDecision: optimized?.decision ?? null,
      expectedArtifactDecision: OLD_DECISION,
      unchanged: oldDecisionPreserved,
    },
    boundaries: {
      BLOCK_OCR_ROUTE: optimized?.boundaries?.BLOCK_OCR_ROUTE ?? null,
      OCRProviderEnabled: optimized?.boundaries?.OCRProvider?.enabled ?? null,
      activation: optimized?.boundaries?.activation ?? null,
      detectionSlotTouched: optimized?.boundaries?.detectionSlotTouched ?? null,
      semanticCorrection: optimized?.boundaries?.semanticCorrection ?? null,
      silentFallback: optimized?.boundaries?.silentFallback ?? null,
    },
  }
}

const sha256File = path => createHash('sha256').update(readFileSync(path)).digest('hex')

const runSelfTest = () => {
  const base = 0.7431189
  const adjacent = 0.74311894
  assert.equal(ulpDistance(base, base), 0)
  assert.equal(ulpDistance(base, adjacent), 1)
  assert.equal(ulpDistance(base, float32FromBits(float32Bits(base) + 2)), 2)
  assert.equal(ulpDistance(Number.NaN, base), null)
  assert.equal(ulpDistance(-0.01, base), null)
  console.log(JSON.stringify({ status: 'SELF_TEST_PASSED', maxUlpDistance: MAX_ULP_DISTANCE, adjacentExampleUlpDistance: ulpDistance(base, adjacent) }))
}

const parseArgs = argv => {
  const result = { baselinePath: null, optimizedPath: null, outputPath: null }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag === '--baseline') result.baselinePath = argv[++index]
    else if (flag === '--optimized') result.optimizedPath = argv[++index]
    else if (flag === '--output') result.outputPath = argv[++index]
    else throw new Error(`unknown argument: ${flag}`)
  }
  if (!result.baselinePath || !result.optimizedPath) throw new Error('usage: adjudicate_document_ai_float_aware_gate.mjs --baseline <base.json> --optimized <optimized.json> [--output <report.json>]')
  return result
}

const main = () => {
  if (process.argv.includes('--self-test')) {
    runSelfTest()
    return
  }
  const args = parseArgs(process.argv.slice(2))
  const baselinePath = resolve(args.baselinePath)
  const optimizedPath = resolve(args.optimizedPath)
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
  const optimized = JSON.parse(readFileSync(optimizedPath, 'utf8'))
  const report = adjudicate(baseline, optimized, {
    baselinePath,
    optimizedPath,
    baselineSha256: sha256File(baselinePath),
    optimizedSha256: sha256File(optimizedPath),
  })
  const serialized = JSON.stringify(report, null, 2)
  if (args.outputPath) writeFileSync(resolve(args.outputPath), `${serialized}\n`)
  console.log(serialized)
  if (report.status !== 'PASSED') process.exitCode = 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
