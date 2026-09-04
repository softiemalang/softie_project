#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { historicalOcrContentSha256 } from '../../src/ocr/historicalOcrTeam.js'

export const SCHEMA = 'historical-ocr-bounded-conflict-ephemeral-handoff-v1'
export const VERSION = '1.0.0'
export const FROZEN_GOLD_SHA256 = 'f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b'
export const INPUT_MANIFEST_SHA256 = '33e656dfcc479ce9a48e9638c96258b48e8cf1dd7fa29187753798ce34ff5315'
export const DOCUMENT_AI_VERSION = 'pretrained-ocr-v2.1.1-2025-01-31'
export const CONFLICT_LINE_IDS = Object.freeze(['saju-folio-line', 'astrology-title-line'])
export const ALLOWED_REVIEW_LABELS = Object.freeze(['A', 'B', 'NEITHER', 'UNCERTAIN'])
export const RESOLVING_REVIEW_LABELS = Object.freeze(['A', 'B'])
export const NON_RESOLVING_REVIEW_LABELS = Object.freeze(['NEITHER', 'UNCERTAIN'])

const HASH = /^[a-f0-9]{64}$/i
const FORBIDDEN_KEYS = new Set([
  'accessToken',
  'authorization',
  'candidateText',
  'content',
  'goldText',
  'imageBytes',
  'imageData',
  'prompt',
  'predictionText',
  'rawApiResponse',
  'rawResponse',
  'responseBody',
  'transcription',
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isHash = value => typeof value === 'string' && HASH.test(value)
const add = (errors, value) => {
  if (!errors.includes(value)) errors.push(value)
}
const withoutContentHash = packet => Object.fromEntries(
  Object.entries(packet).filter(([key]) => key !== 'contentSha256'),
)

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

const callIsOneSuccessfulNoRetry = call => isObject(call)
  && call.requestCount === 1
  && call.retryCount === 0
  && call.fallbackUsed === false
  && call.httpStatus === 200
  && isHash(call.requestPayloadSha256)
  && isHash(call.responseSha256)

const candidateIsBounded = candidate => isObject(candidate)
  && candidate.present === true
  && isHash(candidate.sha256)
  && isHash(candidate.normalizedSha256)
  && Number.isInteger(candidate.length)
  && candidate.length >= 0
  && typeof candidate.exactMatchAgainstFrozenGold === 'boolean'

export const validatePacket = packet => {
  const errors = []
  if (!isObject(packet)) return ['packet_not_object']
  if (packet.schema !== SCHEMA) add(errors, 'schema_invalid')
  if (packet.version !== VERSION) add(errors, 'version_invalid')
  if (!['RESOLVED_SHADOW_ONLY', 'UNRESOLVED'].includes(packet.status)) add(errors, 'status_invalid')
  if (packet.decision !== 'BOUNDED_ESCALATION_SHADOW_ONLY') add(errors, 'decision_invalid')
  if (packet.source?.frozenGoldSetSha256 !== FROZEN_GOLD_SHA256 || packet.source?.inputManifestSha256 !== INPUT_MANIFEST_SHA256 || packet.source?.sameFrozenGold !== true || JSON.stringify(packet.source?.targetConflictLineIds) !== JSON.stringify(CONFLICT_LINE_IDS)) add(errors, 'source_binding_invalid')
  const scope = packet.scope || {}
  if (scope.boundedRound !== 1 || scope.conflictLinesOnly !== true || scope.lineCount !== 2 || scope.qwenCallsAttempted !== 2 || scope.documentAiCallsAttempted !== 2 || scope.reviewHandoffsAttempted !== 2 || scope.reviewerCallsAttempted !== 2 || scope.expectedQwenCalls !== 2 || scope.expectedDocumentAiCalls !== 2 || scope.expectedReviewHandoffs !== 2 || scope.additionalWorkerRuns !== 0 || scope.additionalFallbackCalls !== 0) add(errors, 'bounded_scope_invalid')
  if (JSON.stringify(packet.workers?.reviewer?.allowedOutputs) !== JSON.stringify(ALLOWED_REVIEW_LABELS)) add(errors, 'reviewer_allowlist_invalid')
  if (packet.workers?.qwen?.workerId !== 'qwen/qwen3.8-27b' || packet.workers?.qwen?.provider !== 'Groq' || packet.workers?.qwen?.credentialValueRetained !== false || packet.workers?.qwen?.candidateTextRetained !== false) add(errors, 'qwen_worker_boundary_invalid')
  if (packet.workers?.documentAi?.processorVersion !== DOCUMENT_AI_VERSION || packet.workers?.documentAi?.authentication !== 'local_adc' || packet.workers?.documentAi?.accessTokenRetained !== false || packet.workers?.documentAi?.credentialValueRetained !== false || packet.workers?.documentAi?.candidateTextRetained !== false) add(errors, 'document_ai_worker_boundary_invalid')
  if (packet.workers?.reviewer?.model !== 'gemini-3.7-flash' || packet.workers?.reviewer?.noConversationHistory !== true || packet.workers?.reviewer?.credentialValueRetained !== false) add(errors, 'reviewer_worker_boundary_invalid')

  const lines = packet.lineResults || []
  if (lines.length !== CONFLICT_LINE_IDS.length || JSON.stringify(lines.map(line => line.lineId)) !== JSON.stringify(CONFLICT_LINE_IDS)) add(errors, 'line_scope_invalid')
  for (const line of lines) {
    if (!isObject(line.input) || !isHash(line.input.cropSha256) || !Array.isArray(line.input.cropDimensions) || line.input.cropBytesRetained !== false) add(errors, `input_boundary_invalid:${line.lineId}`)
    if (line.qwen?.workerId !== 'qwen/qwen3.8-27b' || line.qwen?.provider !== 'Groq' || !candidateIsBounded(line.qwen?.candidate) || !callIsOneSuccessfulNoRetry(line.qwen?.call) || line.qwen?.parse?.jsonValid !== true || line.qwen?.parse?.strictFormat !== true) add(errors, `qwen_line_invalid:${line.lineId}`)
    const documentRequest = line.documentAi?.request || {}
    if (line.documentAi?.processorVersion !== DOCUMENT_AI_VERSION || line.documentAi?.workerId !== 'document-ai-enterprise-document-ocr-optimized-request-v2.1.1-adc' || line.documentAi?.provider !== 'Google Document AI' || !candidateIsBounded(line.documentAi?.candidate) || !callIsOneSuccessfulNoRetry(line.documentAi?.call) || documentRequest.targetResource !== `projects/888064596054/locations/asia-southeast1/processors/dcd3c8ca85ec70d2/processorVersions/${DOCUMENT_AI_VERSION}` || documentRequest.targetSelection !== 'explicit_processor_version' || documentRequest.defaultVersionUsed !== false || documentRequest.fieldMask !== 'text,pages.pageNumber,pages.dimension,pages.lines,pages.tokens' || documentRequest.imagelessMode !== true || documentRequest.processOptionsIncluded !== false || documentRequest.retryCount !== 0 || documentRequest.fallbackUsed !== false) add(errors, `document_ai_line_invalid:${line.lineId}`)
    const review = line.review || {}
    const handoff = review.handoff || {}
    if (review.reviewer?.workerId !== 'gemini-3.7-flash-independent-conflict-reviewer' || review.reviewer?.model !== 'gemini-3.7-flash' || review.reviewer?.independentNoHistory !== true || !callIsOneSuccessfulNoRetry(review.call) || review.response?.status !== 'ACCEPTED' || !ALLOWED_REVIEW_LABELS.includes(review.response?.label) || JSON.stringify(review.response?.allowedLabels) !== JSON.stringify(ALLOWED_REVIEW_LABELS)) add(errors, `review_invalid:${line.lineId}`)
    if (handoff.candidateStringsForwarded !== true || handoff.originalCropForwarded !== true || handoff.goldForwarded !== false || handoff.semanticContextForwarded !== false || handoff.candidateTextRetainedAfterCall !== false || handoff.cropRetainedAfterCall !== false || handoff.reviewerResponseRetained !== false || handoff.immediateDisposalAttempted !== true) add(errors, `handoff_boundary_invalid:${line.lineId}`)
    const resolved = RESOLVING_REVIEW_LABELS.includes(review.response?.label)
    const nonResolving = NON_RESOLVING_REVIEW_LABELS.includes(review.response?.label)
    if (nonResolving && review.response?.status !== 'ACCEPTED') add(errors, `non_resolving_label_not_accepted:${line.lineId}`)
    if (line.resolution?.status !== (resolved ? 'RESOLVED_BY_INDEPENDENT_REVIEW' : 'UNRESOLVED') || line.resolution?.reviewerLabel !== review.response?.label || line.resolution?.selectedWorkerId !== null || line.resolution?.automaticWinnerSelection !== false || line.resolution?.majorityVote !== false || line.resolution?.semanticCorrection !== false || line.resolution?.fallbackUsed !== false) add(errors, `line_resolution_invalid:${line.lineId}`)
    if (line.disposal?.candidateStringsDiscardedAfterReview !== true || line.disposal?.cropDiscardedAfterReview !== true || line.disposal?.rawProviderResponsesDiscarded !== true || line.disposal?.disposalAttemptedImmediately !== true) add(errors, `disposal_invalid:${line.lineId}`)
  }

  const labels = lines.map(line => line.review?.response?.label)
  const allResolved = labels.length === 2 && labels.every(label => RESOLVING_REVIEW_LABELS.includes(label))
  if (packet.status !== (allResolved ? 'RESOLVED_SHADOW_ONLY' : 'UNRESOLVED')) add(errors, 'status_not_derived')
  const expectedResolved = lines.filter(line => RESOLVING_REVIEW_LABELS.includes(line.review?.response?.label)).map(line => line.lineId)
  const expectedUnresolved = lines.filter(line => NON_RESOLVING_REVIEW_LABELS.includes(line.review?.response?.label)).map(line => line.lineId)
  if (JSON.stringify(packet.resolution?.resolvedLineIds) !== JSON.stringify(expectedResolved) || JSON.stringify(packet.resolution?.unresolvedLineIds) !== JSON.stringify(expectedUnresolved) || packet.resolution?.status !== packet.status || packet.resolution?.selectedWorkerId !== null || packet.resolution?.winner !== 'NONE' || packet.resolution?.automaticWinnerSelection !== false || packet.resolution?.majorityVote !== false || packet.resolution?.semanticCorrection !== false || packet.resolution?.fallbackUsed !== false) add(errors, 'resolution_boundary_invalid')
  if (packet.activationGate?.status !== 'DO_NOT_OPEN' || packet.activationGate?.limitedActivationEligible !== false || packet.activationGate?.separateReviewEvidenceComplete !== allResolved) add(errors, 'activation_gate_invalid')
  const boundary = packet.routeBoundary || {}
  if (boundary.BLOCK_OCR_ROUTE !== true || boundary.OCRProvider?.enabled !== false || boundary.activation !== false || boundary.automaticWinnerSelection !== false || boundary.majorityVote !== false || boundary.semanticCorrection !== false || boundary.silentFallback !== false || boundary.fallbackPolicy !== 'none' || boundary.detectionSlotTouched !== false || boundary.search !== false || boundary.historicalSourceJudgment !== false || boundary.processorMutation !== false) add(errors, 'route_boundary_invalid')
  const retention = packet.retention || {}
  if (retention.rawCandidateStrings !== false || retention.rawCropBytes !== false || retention.rawProviderResponses !== false || retention.rawReviewerResponse !== false || retention.rawPrompts !== false || retention.credentials !== false || retention.candidateTextHashOnly !== true) add(errors, 'retention_boundary_invalid')
  if (!isHash(packet.contentSha256) || packet.contentSha256 !== historicalOcrContentSha256(withoutContentHash(packet))) add(errors, 'packet_hash_invalid')
  const forbidden = []
  walkForbidden(packet, '$', forbidden)
  forbidden.forEach(error => add(errors, error))
  return [...new Set(errors)].sort()
}

const main = () => {
  const inputIndex = process.argv.indexOf('--input')
  const input = inputIndex >= 0 ? process.argv[inputIndex + 1] : null
  if (!input) throw new Error('usage: validate_bounded_conflict_ephemeral_handoff.mjs --input <packet.json>')
  const packet = JSON.parse(readFileSync(resolve(input), 'utf8'))
  const errors = validatePacket(packet)
  console.log(JSON.stringify({
    status: errors.length ? 'FAILED' : 'PASSED',
    errors,
    packetStatus: packet.status,
    reviewLabels: (packet.lineResults || []).map(line => line.review?.response?.label),
    routeBoundary: packet.routeBoundary,
    contentSha256: packet.contentSha256,
  }, null, 2))
  if (errors.length) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main()
