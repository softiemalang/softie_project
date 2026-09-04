#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  historicalOcrContentSha256,
} from '../../src/ocr/historicalOcrTeam.js'
import {
  validatePacket as validateOperationalShadowPacket,
} from './adjudicate_bounded_ocr_operational_shadow.mjs'

export const SCHEMA = 'historical-ocr-bounded-raw-text-review-v1'
export const VERSION = '1.0.0'
export const CONFLICT_LINE_IDS = Object.freeze([
  'saju-folio-line',
  'astrology-title-line',
])

const HASH = /^[a-f0-9]{64}$/i
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
  'rawText',
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const add = (errors, value) => {
  if (!errors.includes(value)) errors.push(value)
}
const isHash = value => typeof value === 'string' && HASH.test(value)
const sha256File = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))

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

const withoutContentHash = packet => Object.fromEntries(
  Object.entries(packet).filter(([key]) => key !== 'packetContentSha256'),
)

const lineMap = operational => new Map(
  (operational.agreementConflict?.lineResults || []).map(line => [line.lineId, line]),
)

const buildReviewPacket = ({ operational, operationalPath, recordedOn }) => {
  const operationalErrors = validateOperationalShadowPacket(operational)
  if (operationalErrors.length) throw new Error(`operational_packet_invalid:${operationalErrors.join(',')}`)

  const lines = lineMap(operational)
  const lineResults = CONFLICT_LINE_IDS.map(lineId => {
    const line = lines.get(lineId)
    if (!line || !String(line.relation).startsWith('CONFLICT_')) {
      throw new Error(`conflict_line_missing:${lineId}`)
    }
    return {
      lineId,
      originalRelation: line.relation,
      originalExactOutcomes: {
        qwen: line.qwen.exactOutcome,
        documentAi: line.documentAi.exactOutcome,
      },
      reviewStatus: 'UNRESOLVED',
      textCompared: false,
      reasonCode: 'RAW_TEXT_EVIDENCE_UNAVAILABLE',
      disposition: 'PRESERVE_CONFLICT_NO_SELECTION',
    }
  })

  const packet = {
    schema: SCHEMA,
    version: VERSION,
    status: 'UNRESOLVED',
    recordedOn,
    decision: 'BOUNDED_ESCALATION_ATTEMPTED_FAIL_CLOSED',
    source: {
      operationalShadowPacketSha256: sha256File(operationalPath),
      operationalShadowPacketContentSha256: operational.packetContentSha256,
      sameFrozenGold: true,
      targetConflictLineIds: [...CONFLICT_LINE_IDS],
    },
    scope: {
      boundedRound: 1,
      requestedReviewCount: 1,
      reviewMode: 'independent_raw_text_review',
      lineScopedOnly: true,
      additionalWorkerRuns: 0,
      additionalApiCalls: 0,
    },
    evidenceAvailability: {
      qwen: {
        rawPredictionTextPresent: false,
        rawResponseBodyPresent: false,
        retainedEvidence: 'prediction_text_digest_and_exact_flags_only',
      },
      documentAi: {
        rawPredictionTextPresent: false,
        rawResponseBodyPresent: false,
        retainedEvidence: 'prediction_text_digest_length_geometry_and_exact_flags_only',
      },
      requiredTextEvidencePresent: false,
      reason: 'Neither retained candidate artifact contains the raw prediction text required for an independent textual review; digests and lengths cannot be decoded into text.',
    },
    execution: {
      attemptCount: 1,
      completedReviewCount: 0,
      reviewPerformedOnText: false,
      status: 'UNRESOLVED_NO_RAW_TEXT_EVIDENCE',
      noAdditionalWorkerRun: true,
      noApiCallOrRerun: true,
    },
    lineResults,
    resolution: {
      status: 'UNRESOLVED',
      unresolvedLineIds: [...CONFLICT_LINE_IDS],
      winner: 'NONE',
      selectedWorkerId: null,
      automaticWinnerSelection: false,
      majorityVote: false,
      semanticCorrection: false,
      fallbackUsed: false,
      rationale: 'The single bounded review attempt cannot inspect absent raw text; both original conflicts are preserved without adjudication.',
    },
    activationGateReevaluation: {
      status: 'NOT_REVIEWABLE_THIS_ROUND',
      limitedActivationEligible: false,
      reasonCodes: ['unresolved_conflict_lines', 'raw_text_evidence_missing', 'no_automatic_selection'],
      nextCondition: 'A separately authorized review requires lawfully retained raw prediction text for both workers; this packet does not request or perform that collection.',
    },
    routeBoundary: {
      BLOCK_OCR_ROUTE: true,
      OCRProvider: { enabled: false },
      activation: false,
      automaticWinnerSelection: false,
      majorityVote: false,
      semanticCorrection: false,
      silentFallback: false,
      fallbackPolicy: 'none',
      detectionSlotTouched: false,
      search: false,
      historicalSourceJudgment: false,
      processorMutation: false,
    },
    retention: {
      rawPredictionTextRetained: false,
      rawApiResponsesRetained: false,
      rawPromptsRetained: false,
      credentialValuesRetained: false,
      textCompared: false,
      textResolutionClaimed: false,
      winnerClaimed: false,
    },
    validator: {
      id: 'bounded-raw-text-review-validator-v1',
      status: 'PASSED',
      failClosedOnMissingRawText: true,
      failClosedOnConflict: true,
    },
  }
  return {
    ...packet,
    packetContentSha256: historicalOcrContentSha256(packet),
  }
}

export const validateReviewPacket = packet => {
  const errors = []
  if (!isObject(packet)) return ['packet_not_object']
  if (packet.schema !== SCHEMA) add(errors, 'schema_invalid')
  if (packet.version !== VERSION) add(errors, 'version_invalid')
  if (packet.status !== 'UNRESOLVED') add(errors, 'status_not_fail_closed')
  if (packet.source?.sameFrozenGold !== true || JSON.stringify(packet.source?.targetConflictLineIds) !== JSON.stringify(CONFLICT_LINE_IDS)) add(errors, 'scope_source_invalid')
  if (packet.scope?.boundedRound !== 1 || packet.scope?.requestedReviewCount !== 1 || packet.scope?.reviewMode !== 'independent_raw_text_review' || packet.scope?.lineScopedOnly !== true || packet.scope?.additionalWorkerRuns !== 0 || packet.scope?.additionalApiCalls !== 0) add(errors, 'scope_contract_invalid')
  if (packet.evidenceAvailability?.qwen?.rawPredictionTextPresent !== false || packet.evidenceAvailability?.qwen?.rawResponseBodyPresent !== false || packet.evidenceAvailability?.documentAi?.rawPredictionTextPresent !== false || packet.evidenceAvailability?.documentAi?.rawResponseBodyPresent !== false || packet.evidenceAvailability?.requiredTextEvidencePresent !== false) add(errors, 'raw_text_precondition_invalid')
  if (packet.execution?.attemptCount !== 1 || packet.execution?.completedReviewCount !== 0 || packet.execution?.reviewPerformedOnText !== false || packet.execution?.status !== 'UNRESOLVED_NO_RAW_TEXT_EVIDENCE' || packet.execution?.noAdditionalWorkerRun !== true || packet.execution?.noApiCallOrRerun !== true) add(errors, 'execution_contract_invalid')
  if (JSON.stringify((packet.lineResults || []).map(line => line.lineId)) !== JSON.stringify(CONFLICT_LINE_IDS) || !packet.lineResults.every(line => line.reviewStatus === 'UNRESOLVED' && line.textCompared === false && line.reasonCode === 'RAW_TEXT_EVIDENCE_UNAVAILABLE')) add(errors, 'line_resolution_invalid')
  if (packet.resolution?.status !== 'UNRESOLVED' || JSON.stringify(packet.resolution?.unresolvedLineIds) !== JSON.stringify(CONFLICT_LINE_IDS) || packet.resolution?.winner !== 'NONE' || packet.resolution?.selectedWorkerId !== null || packet.resolution?.automaticWinnerSelection !== false || packet.resolution?.majorityVote !== false || packet.resolution?.semanticCorrection !== false || packet.resolution?.fallbackUsed !== false) add(errors, 'resolution_boundary_invalid')
  if (packet.activationGateReevaluation?.status !== 'NOT_REVIEWABLE_THIS_ROUND' || packet.activationGateReevaluation?.limitedActivationEligible !== false) add(errors, 'activation_gate_boundary_invalid')
  if (packet.routeBoundary?.BLOCK_OCR_ROUTE !== true || packet.routeBoundary?.OCRProvider?.enabled !== false || packet.routeBoundary?.activation !== false || packet.routeBoundary?.automaticWinnerSelection !== false || packet.routeBoundary?.majorityVote !== false || packet.routeBoundary?.semanticCorrection !== false || packet.routeBoundary?.silentFallback !== false || packet.routeBoundary?.fallbackPolicy !== 'none' || packet.routeBoundary?.detectionSlotTouched !== false || packet.routeBoundary?.processorMutation !== false) add(errors, 'route_boundary_invalid')
  if (packet.retention?.rawPredictionTextRetained !== false || packet.retention?.rawApiResponsesRetained !== false || packet.retention?.rawPromptsRetained !== false || packet.retention?.credentialValuesRetained !== false || packet.retention?.textCompared !== false || packet.retention?.textResolutionClaimed !== false || packet.retention?.winnerClaimed !== false) add(errors, 'retention_boundary_invalid')
  if (!isHash(packet.source?.operationalShadowPacketSha256) || !isHash(packet.source?.operationalShadowPacketContentSha256)) add(errors, 'source_hash_invalid')
  if (!isHash(packet.packetContentSha256)) add(errors, 'packet_hash_invalid')
  if (isHash(packet.packetContentSha256) && packet.packetContentSha256 !== historicalOcrContentSha256(withoutContentHash(packet))) add(errors, 'packet_hash_mismatch')
  const forbidden = []
  walkForbidden(packet, '$', forbidden)
  forbidden.forEach(error => add(errors, error))
  return [...new Set(errors)].sort()
}

const parseArgs = argv => {
  const result = {
    operationalPath: resolve('artifacts/historical-ocr-bounded-ocr-operational-shadow-v1.json'),
    outputPath: null,
    recordedOn: '2026-09-04',
  }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag === '--operational') result.operationalPath = resolve(argv[++index])
    else if (flag === '--output') result.outputPath = resolve(argv[++index])
    else if (flag === '--recorded-on') result.recordedOn = argv[++index]
    else throw new Error(`unknown_argument:${flag}`)
  }
  if (!result.outputPath) throw new Error('usage: execute_bounded_raw_text_review.mjs --output <packet.json> [--operational <packet.json>]')
  return result
}

const main = () => {
  const args = parseArgs(process.argv.slice(2))
  const packet = buildReviewPacket({
    operational: readJson(args.operationalPath),
    operationalPath: args.operationalPath,
    recordedOn: args.recordedOn,
  })
  const errors = validateReviewPacket(packet)
  if (errors.length) {
    console.log(JSON.stringify({ status: 'FAILED', errors }, null, 2))
    process.exitCode = 1
    return
  }
  mkdirSync(dirname(args.outputPath), { recursive: true })
  writeFileSync(args.outputPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({
    status: 'PASSED',
    reviewStatus: packet.status,
    attemptCount: packet.execution.attemptCount,
    completedReviewCount: packet.execution.completedReviewCount,
    unresolvedLineIds: packet.resolution.unresolvedLineIds,
    activationGateReevaluation: packet.activationGateReevaluation.status,
    output: args.outputPath,
    packetContentSha256: packet.packetContentSha256,
  }, null, 2))
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main()
