#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const HASH = /^[a-f0-9]{64}$/
const FORBIDDEN_KEYS = new Set([
  'accessToken',
  'authorization',
  'credential',
  'content',
  'goldText',
  'imageBytes',
  'imageData',
  'predictionText',
  'rawApiResponse',
  'rawResponse',
  'responseBody',
])

const add = (errors, value) => {
  if (!errors.includes(value)) errors.push(value)
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)

const canonical = value => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}

const hash = value => createHash('sha256').update(canonical(value)).digest('hex')
const close = (left, right, tolerance = 1e-9) => typeof left === 'number' && typeof right === 'number' && Math.abs(left - right) <= tolerance
const requireHash = (errors, value, path) => {
  if (typeof value !== 'string' || !HASH.test(value)) add(errors, `${path}_hash_invalid`)
}

const walkForbidden = (value, path, errors) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForbidden(item, `${path}[${index}]`, errors))
    return
  }
  if (!isObject(value)) return
  Object.entries(value).forEach(([key, child]) => {
    if (FORBIDDEN_KEYS.has(key)) add(errors, `raw_or_secret_retained:${path}.${key}`)
    walkForbidden(child, `${path}.${key}`, errors)
  })
}

const validateLine = (line, errors, path) => {
  if (!isObject(line)) {
    add(errors, `${path}_not_object`)
    return
  }
  if (!Array.isArray(line.runs) || line.runs.length !== 2) add(errors, `${path}_repeat_count_invalid`)
  requireHash(errors, line.goldTextSha256, `${path}.goldTextSha256`)
  for (const [index, run] of (line.runs || []).entries()) {
    const runPath = `${path}.runs[${index}]`
    if (run.status !== 'SUCCEEDED') add(errors, `${runPath}_not_successful`)
    if (!Number.isInteger(run.repeat) || run.repeat !== index + 1) add(errors, `${runPath}_repeat_invalid`)
    requireHash(errors, run.inputImageSha256, `${runPath}.inputImageSha256`)
    requireHash(errors, run.predictionTextSha256, `${runPath}.predictionTextSha256`)
    requireHash(errors, run.predictionNormalizedTextSha256, `${runPath}.predictionNormalizedTextSha256`)
    requireHash(errors, run.geometry?.geometrySha256, `${runPath}.geometry.geometrySha256`)
    requireHash(errors, run.confidence?.valuesSha256, `${runPath}.confidence.valuesSha256`)
    if (run.goldTextSha256 !== line.goldTextSha256) add(errors, `${runPath}_gold_hash_mismatch`)
    const expectedCer = Number(run.goldCharacterCount) > 0 ? Number(run.editDistance) / Number(run.goldCharacterCount) : null
    if (!close(run.characterErrorRate, expectedCer)) add(errors, `${runPath}_cer_mismatch`)
  }
  const [first, second] = line.runs || []
  if (first && second) {
    const textStable = first.predictionNormalizedTextSha256 === second.predictionNormalizedTextSha256
    const geometryStable = first.geometry?.geometrySha256 === second.geometry?.geometrySha256
    const confidenceStable = first.confidence?.valuesSha256 === second.confidence?.valuesSha256
    if (line.summary?.repeatTextStable !== textStable) add(errors, `${path}_text_stability_mismatch`)
    if (line.summary?.repeatGeometryStable !== geometryStable) add(errors, `${path}_geometry_stability_mismatch`)
    if (line.summary?.repeatConfidenceStable !== confidenceStable) add(errors, `${path}_confidence_stability_mismatch`)
  }
}

const validateProvider = (provider, value, errors) => {
  const path = `providers.${provider}`
  if (!isObject(value) || !isObject(value.summary)) {
    add(errors, `${path}_missing`)
    return
  }
  const summary = value.summary
  if (summary.provider !== provider) add(errors, `${path}_identity_invalid`)
  if (summary.expectedRuns !== 8) add(errors, `${path}_expected_runs_invalid`)
  if (!Array.isArray(summary.lineResults) || summary.lineResults.length !== 4) add(errors, `${path}_line_count_invalid`)
  for (const [index, line] of (summary.lineResults || []).entries()) validateLine(line, errors, `${path}.summary.lineResults[${index}]`)
  const runs = (summary.lineResults || []).flatMap(line => line.runs || [])
  const successful = runs.filter(run => run.status === 'SUCCEEDED')
  if (summary.successfulRuns !== successful.length) add(errors, `${path}_successful_count_mismatch`)
  if (summary.failedRuns !== runs.length - successful.length) add(errors, `${path}_failed_count_mismatch`)
  if (summary.status === 'COMPLETED' && successful.length !== 8) add(errors, `${path}_completed_without_eight_runs`)
  const exact = successful.filter(run => run.exactMatch === true).length
  const goldCharacters = successful.reduce((sum, run) => sum + Number(run.goldCharacterCount || 0), 0)
  const edit = successful.reduce((sum, run) => sum + Number(run.editDistance || 0), 0)
  if (summary.exactMatchRuns !== exact) add(errors, `${path}_exact_count_mismatch`)
  if (successful.length && !close(summary.exactMatchRate, exact / successful.length)) add(errors, `${path}_exact_rate_mismatch`)
  if (goldCharacters && !close(summary.characterErrorRate, edit / goldCharacters)) add(errors, `${path}_cer_mismatch`)
  if (value.cost?.attemptedUnits !== 8) add(errors, `${path}_cost_units_invalid`)
}

const validate = input => {
  const errors = []
  if (input.schema !== 'historical-ocr-google-external-frozen-gold-run-v1') add(errors, 'schema_invalid')
  if (!['COMPLETED', 'PARTIAL_OR_BLOCKED'].includes(input.status)) add(errors, 'status_invalid')
  if (input.decision !== 'CANDIDATE_EVIDENCE_ONLY') add(errors, 'candidate_only_decision_missing')
  if (input.source?.sourceGoldSetSha256 !== 'f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b') add(errors, 'source_gold_set_hash_invalid')
  if (input.source?.lineCount !== 4 || input.source?.caseCount !== 3) add(errors, 'source_counts_invalid')
  if (input.source?.sameInputBytesForBothProviders !== true) add(errors, 'same_input_boundary_invalid')
  if (input.protocol?.repeatsPerLine !== 2 || input.protocol?.attemptedRequestsPerProvider !== 8 || input.protocol?.retryCount !== 0 || input.protocol?.fallbackUsed !== false) add(errors, 'protocol_invalid')
  if (!isObject(input.providers) || Object.keys(input.providers).sort().join(',') !== 'cloud_vision_document_text_detection,document_ai_enterprise_document_ocr') add(errors, 'provider_set_invalid')
  validateProvider('cloud_vision_document_text_detection', input.providers?.cloud_vision_document_text_detection, errors)
  validateProvider('document_ai_enterprise_document_ocr', input.providers?.document_ai_enterprise_document_ocr, errors)
  if (input.providers?.cloud_vision_document_text_detection?.feature !== 'DOCUMENT_TEXT_DETECTION') add(errors, 'vision_feature_invalid')
  if (input.providers?.document_ai_enterprise_document_ocr?.processor !== 'Enterprise Document OCR') add(errors, 'document_ai_processor_invalid')
  if (input.authentication?.credentialMaterialRetained !== false || input.authentication?.serviceAccountKeyUsed !== false) add(errors, 'credential_boundary_invalid')
  if (input.privacy?.requestMode !== 'synchronous_inline_base64' || input.privacy?.cloudStorageInput !== false || input.privacy?.cloudStorageOutput !== false || input.privacy?.batchProcessing !== false || input.privacy?.rawInputRetainedInArtifact !== false || input.privacy?.rawPredictionTextRetainedInArtifact !== false || input.privacy?.rawApiResponseRetainedInArtifact !== false) add(errors, 'privacy_boundary_invalid')
  if (input.boundaries?.frozenGoldAccessedForThisExplicitComparison !== true || input.boundaries?.detectionSlotTouched !== false || input.boundaries?.activation !== false || input.boundaries?.BLOCK_OCR_ROUTE !== true || input.boundaries?.OCRProvider?.enabled !== false || input.boundaries?.search !== false || input.boundaries?.historicalSourceJudgment !== false || input.boundaries?.semanticCorrection !== false || input.boundaries?.silentFallback !== false) add(errors, 'route_or_operation_boundary_invalid')
  if (input.promotion?.candidateEvidenceOnly !== true || input.promotion?.automaticActivation !== false || input.promotion?.separateActivationDecisionRequired !== true) add(errors, 'promotion_boundary_invalid')
  requireHash(errors, input.source?.inputManifestSha256, 'source.inputManifestSha256')
  requireHash(errors, input.contentSha256, 'contentSha256')
  walkForbidden(input, '$', errors)
  const copy = { ...input, contentSha256: null }
  if (input.contentSha256 !== hash(copy)) add(errors, 'content_sha256_mismatch')
  return { pass: errors.length === 0, errors }
}

const input = process.argv[2]
if (!input) throw new Error('usage: validate_google_external_ocr_evidence.mjs <evidence.json>')
const value = JSON.parse(readFileSync(input, 'utf8'))
const result = validate(value)
console.log(JSON.stringify({ status: result.pass ? 'PASSED' : 'FAILED', pass: result.pass, input, errors: result.errors }, null, 2))
if (!result.pass) process.exitCode = 1
