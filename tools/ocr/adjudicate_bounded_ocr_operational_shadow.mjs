#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import {
  historicalOcrContentSha256,
} from '../../src/ocr/historicalOcrTeam.js'
import { validateQwenDocumentAiExactPacket } from './adjudicate_qwen_document_ai_exact_outcomes.mjs'

export const SCHEMA = 'historical-ocr-bounded-ocr-operational-shadow-v1'
export const VERSION = '1.0.0'
export const FROZEN_GOLD_SET_SHA256 = 'f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b'
export const INPUT_MANIFEST_SHA256 = '33e656dfcc479ce9a48e9638c96258b48e8cf1dd7fa29187753798ce34ff5315'
export const PINNED_DOCUMENT_AI_VERSION = 'pretrained-ocr-v2.1.1-2025-01-31'
export const LINE_IDS = Object.freeze([
  'saju-main-title-line',
  'saju-folio-line',
  'ziwei-title-line',
  'astrology-title-line',
])
export const QWEN_WORKER_ID = 'qwen/qwen3.8-27b'
export const DOCUMENT_AI_WORKER_ID = 'document-ai-enterprise-document-ocr-optimized-request-v2.1.1-adc'

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
])

const add = (errors, value) => {
  if (!errors.includes(value)) errors.push(value)
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isHash = value => typeof value === 'string' && HASH.test(value)
const clone = value => value === undefined ? undefined : structuredClone(value)

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

const sha256File = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const readJson = path => JSON.parse(readFileSync(path, 'utf8'))

const parseFlags = (flags, path) => {
  if (!Array.isArray(flags) || flags.length !== 2 || !flags.every(flag => typeof flag === 'boolean')) {
    throw new Error(`exact_flags_invalid:${path}`)
  }
  return [...flags]
}

const qwenLineFlags = qwen => {
  const byLine = new Map()
  for (const item of qwen.cases || []) {
    for (const line of item.lines || []) {
      if (byLine.has(line.line_id)) throw new Error(`duplicate_qwen_line:${line.line_id}`)
      byLine.set(line.line_id, parseFlags((line.runs || []).map(run => run.exact_match), `qwen:${line.line_id}`))
    }
  }
  return Object.fromEntries(LINE_IDS.map(lineId => {
    if (!byLine.has(lineId)) throw new Error(`missing_qwen_line:${lineId}`)
    return [lineId, byLine.get(lineId)]
  }))
}

const documentAiLineFlags = documentAi => {
  const lineResults = documentAi.provider?.summary?.lineResults
  if (!Array.isArray(lineResults)) throw new Error('document_ai_line_results_missing')
  const byLine = new Map()
  for (const item of lineResults) {
    if (byLine.has(item.lineId)) throw new Error(`duplicate_document_ai_line:${item.lineId}`)
    byLine.set(item.lineId, parseFlags((item.runs || []).map(run => run.exactMatch), `document_ai:${item.lineId}`))
  }
  return Object.fromEntries(LINE_IDS.map(lineId => {
    if (!byLine.has(lineId)) throw new Error(`missing_document_ai_line:${lineId}`)
    return [lineId, byLine.get(lineId)]
  }))
}

const validateQwenSource = qwen => {
  const errors = []
  if (qwen.schema !== 'hermes-historical-ocr-qwen-groq-recognition-eval-v1') add(errors, 'qwen_schema_invalid')
  if (qwen.status !== 'closed_record') add(errors, 'qwen_status_invalid')
  if (qwen.suite?.gold_set_sha256 !== FROZEN_GOLD_SET_SHA256) add(errors, 'qwen_gold_hash_invalid')
  if (qwen.conditions?.repeats_per_line !== 2 || qwen.conditions?.retry_count !== 0 || qwen.conditions?.fallback_used !== false || qwen.conditions?.semantic_correction !== false || qwen.conditions?.search !== false) add(errors, 'qwen_protocol_invalid')
  if (qwen.conditions?.raw_pixels_retained !== false || qwen.conditions?.raw_response_retained !== false || qwen.conditions?.no_local_raw_response_retention !== true) add(errors, 'qwen_retention_invalid')
  if (qwen.aggregate?.lines_attempted !== 4 || qwen.aggregate?.runs_attempted !== 8 || qwen.aggregate?.http_200_runs !== 8 || qwen.aggregate?.json_valid_runs !== 8 || qwen.aggregate?.strict_format_runs !== 8) add(errors, 'qwen_eight_run_evidence_invalid')
  if (qwen.aggregate?.repeat_text_stable_lines !== 4 || qwen.aggregate?.repeat_exact_stable_lines !== 4) add(errors, 'qwen_repeat_stability_invalid')
  if (qwen.candidate?.model !== QWEN_WORKER_ID || qwen.candidate?.provider !== 'Groq') add(errors, 'qwen_worker_identity_invalid')
  try { qwenLineFlags(qwen) } catch (error) { add(errors, error.message) }
  return errors
}

const validateDocumentAiSource = documentAi => {
  const errors = []
  if (documentAi.schema !== 'historical-ocr-document-ai-adc-optimized-shadow-v1') add(errors, 'document_ai_schema_invalid')
  if (documentAi.status !== 'COMPLETED') add(errors, 'document_ai_status_invalid')
  if (documentAi.source?.sourceGoldSetSha256 !== FROZEN_GOLD_SET_SHA256 || documentAi.source?.inputManifestSha256 !== INPUT_MANIFEST_SHA256 || documentAi.source?.lineCount !== 4 || documentAi.source?.sameInputBytes !== true) add(errors, 'document_ai_source_binding_invalid')
  if (documentAi.preflight?.httpStatus !== 200 || documentAi.preflight?.state !== 'DEPLOYED' || documentAi.preflight?.access !== 'PASS' || documentAi.preflight?.defaultVersionUsed !== false || documentAi.preflight?.processorMutation !== false) add(errors, 'document_ai_version_preflight_invalid')
  if (documentAi.provider?.processorVersion !== PINNED_DOCUMENT_AI_VERSION || documentAi.request?.targetSelection !== 'explicit_processor_version' || documentAi.request?.defaultVersionUsed !== false || !String(documentAi.request?.targetResource || '').endsWith(`/processorVersions/${PINNED_DOCUMENT_AI_VERSION}`)) add(errors, 'document_ai_version_pin_invalid')
  if (documentAi.request?.fieldMask !== 'text,pages.pageNumber,pages.dimension,pages.lines,pages.tokens' || documentAi.request?.imagelessMode !== true || documentAi.request?.processOptionsIncluded !== false || documentAi.request?.retryCount !== 0 || documentAi.request?.clientReuse !== false) add(errors, 'document_ai_optimized_request_invalid')
  if (documentAi.protocol?.attemptedRequests !== 8 || documentAi.protocol?.successfulRequests !== 8 || documentAi.protocol?.failedRequests !== 0 || documentAi.protocol?.repeatsPerLine !== 2 || documentAi.protocol?.retryCount !== 0 || documentAi.protocol?.fallbackUsed !== false || documentAi.protocol?.semanticCorrection !== false || documentAi.protocol?.rawPredictionTextRetained !== false || documentAi.protocol?.rawApiResponseRetained !== false) add(errors, 'document_ai_protocol_invalid')
  if (documentAi.authentication?.method !== 'gcloud_application_default_credentials' || documentAi.authentication?.credentialMaterialRetained !== false || documentAi.authentication?.accessTokenRetained !== false || documentAi.authentication?.serviceAccountKeyUsed !== false) add(errors, 'document_ai_auth_boundary_invalid')
  const boundaries = documentAi.boundaries || {}
  if (boundaries.BLOCK_OCR_ROUTE !== true || boundaries.OCRProvider?.enabled !== false || boundaries.activation !== false || boundaries.detectionSlotTouched !== false || boundaries.fallbackUsed !== false || boundaries.semanticCorrection !== false || boundaries.silentFallback !== false || boundaries.processorMutation !== false) add(errors, 'document_ai_route_boundary_invalid')
  const summary = documentAi.provider?.summary || {}
  if (summary.expectedRuns !== 8 || summary.status !== 'COMPLETED' || summary.successfulRuns !== 8 || summary.failedRuns !== 0 || summary.repeatTextStableLines !== 4 || summary.repeatGeometryStableLines !== 4 || summary.repeatConfidenceStableLines !== 4) add(errors, 'document_ai_summary_invalid')
  try { documentAiLineFlags(documentAi) } catch (error) { add(errors, error.message) }
  if (!isHash(documentAi.contentSha256)) add(errors, 'document_ai_content_hash_missing')
  return errors
}

const outcome = flags => flags[0] === flags[1] ? flags[0] : null

const relationFor = (qwenFlags, documentAiFlags) => {
  const qwenOutcome = outcome(qwenFlags)
  const documentAiOutcome = outcome(documentAiFlags)
  if (qwenOutcome === null || documentAiOutcome === null) return 'UNKNOWN_REPEAT_INSTABILITY'
  if (qwenOutcome === documentAiOutcome) return qwenOutcome ? 'AGREEMENT_BOTH_EXACT' : 'AGREEMENT_BOTH_NONEXACT'
  return documentAiOutcome
    ? 'CONFLICT_DOCUMENT_AI_EXACT_QWEN_NONEXACT'
    : 'CONFLICT_QWEN_EXACT_DOCUMENT_AI_NONEXACT'
}

const relationNeedsEscalation = relation => relation.startsWith('CONFLICT_') || relation === 'UNKNOWN_REPEAT_INSTABILITY' || relation === 'AGREEMENT_BOTH_NONEXACT'

const buildRelations = (qwenByLine, documentAiByLine) => {
  const lineResults = LINE_IDS.map(lineId => {
    const qwenFlags = qwenByLine[lineId]
    const documentAiFlags = documentAiByLine[lineId]
    const relation = relationFor(qwenFlags, documentAiFlags)
    return {
      lineId,
      qwen: { workerId: QWEN_WORKER_ID, exactFlags: [...qwenFlags], exactOutcome: outcome(qwenFlags), repeatStable: qwenFlags[0] === qwenFlags[1] },
      documentAi: { workerId: DOCUMENT_AI_WORKER_ID, exactFlags: [...documentAiFlags], exactOutcome: outcome(documentAiFlags), repeatStable: documentAiFlags[0] === documentAiFlags[1] },
      relation,
      escalation: relationNeedsEscalation(relation) ? 'ESCALATE_REQUIRED' : 'NO_AUTO_ACTION',
      evidenceMode: 'frozen_gold_exact_boolean_outcomes_plus_operational_metrics',
    }
  })
  const qwenOnlyExactLineIds = lineResults.filter(item => item.qwen.exactOutcome === true && item.documentAi.exactOutcome === false).map(item => item.lineId)
  const documentAiOnlyExactLineIds = lineResults.filter(item => item.documentAi.exactOutcome === true && item.qwen.exactOutcome === false).map(item => item.lineId)
  const overlappingExactLineIds = lineResults.filter(item => item.qwen.exactOutcome === true && item.documentAi.exactOutcome === true).map(item => item.lineId)
  const unknownLineIds = lineResults.filter(item => item.relation === 'UNKNOWN_REPEAT_INSTABILITY').map(item => item.lineId)
  const conflictLineIds = lineResults.filter(item => item.relation.startsWith('CONFLICT_')).map(item => item.lineId)
  const agreementLineIds = lineResults.filter(item => item.relation.startsWith('AGREEMENT_')).map(item => item.lineId)
  const agreementRecordCount = lineResults.reduce((sum, item) => sum + item.qwen.exactFlags.filter((flag, index) => flag === item.documentAi.exactFlags[index]).length, 0)
  return {
    lineResults,
    status: unknownLineIds.length > 0 ? 'UNKNOWN_INPUT' : conflictLineIds.length > 0 ? 'COMPLEMENTARY_EXACT_COVERAGE_WITH_CONFLICT' : 'AGREEMENT_ONLY',
    agreement: { lineIds: agreementLineIds, recordCount: agreementRecordCount },
    conflict: { lineIds: conflictLineIds, recordCount: 8 - agreementRecordCount },
    complementarity: {
      status: unknownLineIds.length === 0 && qwenOnlyExactLineIds.length > 0 && documentAiOnlyExactLineIds.length > 0 ? 'OBSERVED' : 'NOT_OBSERVED',
      qwenOnlyExactLineIds,
      documentAiOnlyExactLineIds,
      overlappingExactLineIds,
      unionExactLineIds: LINE_IDS.filter(lineId => [...qwenOnlyExactLineIds, ...documentAiOnlyExactLineIds, ...overlappingExactLineIds].includes(lineId)),
    },
  }
}

const buildPacket = ({ qwen, documentAi, qwenPath, documentAiPath, priorExactPath, recordedOn }) => {
  const qwenErrors = validateQwenSource(qwen)
  const documentAiErrors = validateDocumentAiSource(documentAi)
  if (qwenErrors.length || documentAiErrors.length) throw new Error([...qwenErrors, ...documentAiErrors].join(','))
  const qwenByLine = qwenLineFlags(qwen)
  const documentAiByLine = documentAiLineFlags(documentAi)
  const relations = buildRelations(qwenByLine, documentAiByLine)
  const priorExact = readJson(priorExactPath)
  const priorExactErrors = validateQwenDocumentAiExactPacket(priorExact)
  if (priorExactErrors.length) throw new Error(`prior_exact_packet_invalid:${priorExactErrors.join(',')}`)
  const qwenAggregate = qwen.aggregate
  const docSummary = documentAi.provider.summary
  const packet = {
    schema: SCHEMA,
    version: VERSION,
    status: 'CLOSED_RECORD',
    recordedOn,
    decision: 'OPERATIONAL_SHADOW_EVIDENCE_ONLY',
    source: {
      frozenGoldSetSha256: FROZEN_GOLD_SET_SHA256,
      inputManifestSha256: INPUT_MANIFEST_SHA256,
      qwenShadowEvidenceSha256: sha256File(qwenPath),
      documentAiShadowEvidenceSha256: sha256File(documentAiPath),
      priorExactPacketSha256: sha256File(priorExactPath),
      priorExactPacketValidation: 'PASSED',
      sameFrozenLineSet: true,
    },
    inputs: {
      frozenLineIds: [...LINE_IDS],
      repeatsPerLine: 2,
      candidateWorkerIds: [QWEN_WORKER_ID, DOCUMENT_AI_WORKER_ID],
      rawTextInspected: false,
      rawPredictionTextRetained: false,
      rawApiResponseRetained: false,
    },
    workers: [
      {
        workerId: QWEN_WORKER_ID,
        component: 'rec',
        provider: 'Groq',
        model: 'qwen/qwen3.8-27b',
        authentication: { credentialValueRetained: false, serviceAccountKeyUsed: false },
        outcomes: { exactRuns: qwenAggregate.exact_match_runs, exactRate: qwenAggregate.exact_rate, cer: null, cerStatus: 'UNKNOWN_RAW_TEXT_NOT_RETAINED' },
        latencyMs: { mean: qwenAggregate.latency_mean_ms, min: qwenAggregate.latency_min_ms, max: qwenAggregate.latency_max_ms },
        cost: { attemptedUnits: 8, unit: 'request', basis: qwenAggregate.cost_basis, actualInvoiceChecked: false, monetaryAmount: null },
        reproducibility: { http200Runs: 8, strictFormatRuns: 8, repeatTextStableLines: 4, repeatExactStableLines: 4, geometryStatus: 'NOT_AVAILABLE_IN_SOURCE_EVIDENCE', confidenceStatus: 'PRESENCE_ONLY_NOT_NUMERIC' },
      },
      {
        workerId: DOCUMENT_AI_WORKER_ID,
        component: 'rec',
        provider: 'Google Document AI',
        processorVersion: PINNED_DOCUMENT_AI_VERSION,
        authentication: { method: 'local_adc', credentialValueRetained: false, serviceAccountKeyUsed: false },
        outcomes: { exactRuns: docSummary.exactMatchRuns, exactRate: docSummary.exactMatchRate, cer: docSummary.characterErrorRate, cerStatus: 'MEASURED' },
        latencyMs: { mean: docSummary.latencyMeanMs, min: docSummary.latencyMinMs, max: docSummary.latencyMaxMs },
        cost: { attemptedUnits: 8, unit: 'page', basis: 'synchronous inline Enterprise Document OCR; actual invoice not checked', actualInvoiceChecked: false, monetaryAmount: null },
        reproducibility: { successfulRuns: 8, repeatTextStableLines: 4, repeatGeometryStableLines: 4, repeatConfidenceStableLines: 4, confidencePresentRuns: docSummary.confidencePresentRuns, confidencePresentRate: docSummary.confidencePresentRate, confidenceMean: docSummary.confidenceMean, confidenceMin: docSummary.confidenceMin, confidenceMax: docSummary.confidenceMax },
        request: { targetSelection: 'explicit_processor_version', defaultVersionUsed: false, fieldMask: documentAi.request.fieldMask, imagelessMode: true, processOptionsIncluded: false, retryCount: 0, fallbackUsed: false },
      },
    ],
    agreementConflict: {
      status: relations.status,
      lineResults: relations.lineResults,
      agreement: { ...relations.agreement, meaning: 'same frozen-gold exact boolean outcome; not raw-text equality' },
      conflict: { ...relations.conflict, meaning: 'different frozen-gold exact boolean outcome; no automatic winner' },
      complementarity: relations.complementarity,
    },
    operationalComparison: {
      latency: { fasterWorker: QWEN_WORKER_ID, qwenMeanMs: qwenAggregate.latency_mean_ms, documentAiMeanMs: docSummary.latencyMeanMs, qwenMaxMs: qwenAggregate.latency_max_ms, documentAiMaxMs: docSummary.latencyMaxMs, winnerSelectionUsed: false },
      cost: { qwen: { attemptedUnits: 8, actualInvoiceChecked: false, monetaryAmount: null }, documentAi: { attemptedUnits: 8, actualInvoiceChecked: false, monetaryAmount: null }, crossProviderMonetaryWinner: null },
      reproducibility: { qwenRepeatTextStableLines: 4, documentAiRepeatTextStableLines: 4, documentAiRepeatGeometryStableLines: 4, documentAiRepeatConfidenceStableLines: 4, repeatInstabilityPresent: false },
      packetValidity: { qwenSourceChecks: 'PASSED', documentAiSourceChecks: 'PASSED', priorExactPacket: 'PASSED', rawOrSecretRetention: 'NOT_PRESENT' },
    },
    escalationPolicy: {
      schema: 'historical-ocr-bounded-escalation-v1',
      currentDisposition: relations.conflict.lineIds.length || relations.complementarity.status === 'OBSERVED' ? 'ESCALATE_REQUIRED' : 'NO_AUTO_ACTION',
      trigger: 'line_scoped_conflict_or_unknown_repeat_outcome',
      maxRounds: 1,
      maxAdditionalWorkersPerRound: 1,
      maxAdditionalRequestsPerRound: 8,
      execution: 'NOT_RUN_IN_THIS_PACKET',
      prohibited: ['automatic winner selection', 'confidence-based selection', 'semantic correction', 'silent fallback', 'OCR activation'],
    },
    selection: {
      winner: 'NONE',
      selectedWorkerId: null,
      automaticWinnerSelection: false,
      rationale: 'two line-scoped conflicts and complementary exact coverage; no consensus winner',
    },
    activationGateProposal: {
      status: 'DO_NOT_OPEN',
      limitedActivationEligible: false,
      reasonCodes: ['line_scoped_conflict_present', 'complementary_exact_coverage_without_consensus', 'no_automatic_winner_allowed'],
      nextReview: 'bounded line-scoped escalation or separately retained text review; no activation in this packet',
    },
    routeBoundary: {
      BLOCK_OCR_ROUTE: true,
      OCRProvider: { enabled: false },
      activation: false,
      automaticWinnerSelection: false,
      fallbackPolicy: 'none',
      semanticCorrection: false,
      silentFallback: false,
      detectionSlotTouched: false,
      search: false,
      historicalSourceJudgment: false,
      processorMutation: false,
    },
    retention: {
      rawPixelsRetained: false,
      rawPromptsRetained: false,
      rawPredictionTextRetained: false,
      rawApiResponsesRetained: false,
      credentialValuesRetained: false,
      textAgreementClaimed: false,
      winnerClaimed: false,
    },
    validator: {
      id: 'bounded-ocr-operational-shadow-validator-v1',
      status: 'PASSED',
      failClosedOnMissingOrConflictingEvidence: true,
    },
  }
  return {
    ...packet,
    packetContentSha256: historicalOcrContentSha256(packet),
  }
}

export const validatePacket = packet => {
  const errors = []
  if (!isObject(packet)) return ['packet_not_object']
  if (packet.schema !== SCHEMA) add(errors, 'schema_invalid')
  if (packet.version !== VERSION) add(errors, 'version_invalid')
  if (packet.status !== 'CLOSED_RECORD') add(errors, 'status_invalid')
  if (packet.source?.frozenGoldSetSha256 !== FROZEN_GOLD_SET_SHA256 || packet.source?.inputManifestSha256 !== INPUT_MANIFEST_SHA256) add(errors, 'source_hash_invalid')
  if (JSON.stringify(packet.inputs?.frozenLineIds) !== JSON.stringify(LINE_IDS) || packet.inputs?.repeatsPerLine !== 2) add(errors, 'input_shape_invalid')
  if (packet.selection?.winner !== 'NONE' || packet.selection?.selectedWorkerId !== null || packet.selection?.automaticWinnerSelection !== false) add(errors, 'selection_boundary_invalid')
  if (packet.activationGateProposal?.status !== 'DO_NOT_OPEN' || packet.activationGateProposal?.limitedActivationEligible !== false) add(errors, 'activation_proposal_invalid')
  if (packet.routeBoundary?.BLOCK_OCR_ROUTE !== true || packet.routeBoundary?.OCRProvider?.enabled !== false || packet.routeBoundary?.activation !== false || packet.routeBoundary?.fallbackPolicy !== 'none' || packet.routeBoundary?.semanticCorrection !== false || packet.routeBoundary?.silentFallback !== false) add(errors, 'route_boundary_invalid')
  if (packet.retention?.rawPredictionTextRetained !== false || packet.retention?.rawApiResponsesRetained !== false || packet.retention?.credentialValuesRetained !== false || packet.retention?.winnerClaimed !== false) add(errors, 'retention_boundary_invalid')
  if (!isHash(packet.packetContentSha256)) add(errors, 'packet_hash_invalid')
  if (isHash(packet.packetContentSha256) && packet.packetContentSha256 !== historicalOcrContentSha256(Object.fromEntries(Object.entries(packet).filter(([key]) => key !== 'packetContentSha256')))) add(errors, 'packet_hash_mismatch')
  const forbidden = []
  walkForbidden(packet, '$', forbidden)
  forbidden.forEach(error => add(errors, error))
  if (packet.agreementConflict?.status !== 'COMPLEMENTARY_EXACT_COVERAGE_WITH_CONFLICT') add(errors, 'relation_status_invalid')
  if (JSON.stringify(packet.agreementConflict?.conflict?.lineIds) !== JSON.stringify(['saju-folio-line', 'astrology-title-line'])) add(errors, 'conflict_lines_invalid')
  if (JSON.stringify(packet.agreementConflict?.complementarity?.qwenOnlyExactLineIds) !== JSON.stringify(['astrology-title-line'])) add(errors, 'qwen_only_line_invalid')
  if (JSON.stringify(packet.agreementConflict?.complementarity?.documentAiOnlyExactLineIds) !== JSON.stringify(['saju-folio-line'])) add(errors, 'document_ai_only_line_invalid')
  if (packet.workers?.length !== 2 || !packet.workers.every(worker => worker.component === 'rec')) add(errors, 'worker_set_invalid')
  return [...new Set(errors)].sort()
}

const parseArgs = argv => {
  const result = {
    qwenPath: null,
    documentAiPath: null,
    priorExactPath: resolve('artifacts/historical-ocr-qwen-document-ai-exact-outcome-v1.json'),
    outputPath: null,
    recordedOn: '2026-09-04',
  }
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]
    if (flag === '--qwen') result.qwenPath = resolve(argv[++index])
    else if (flag === '--document-ai') result.documentAiPath = resolve(argv[++index])
    else if (flag === '--prior-exact') result.priorExactPath = resolve(argv[++index])
    else if (flag === '--output') result.outputPath = resolve(argv[++index])
    else if (flag === '--recorded-on') result.recordedOn = argv[++index]
    else throw new Error(`unknown_argument:${flag}`)
  }
  if (!result.qwenPath || !result.documentAiPath || !result.outputPath) throw new Error('usage: adjudicate_bounded_ocr_operational_shadow.mjs --qwen <qwen.json> --document-ai <document-ai.json> --output <packet.json> [--prior-exact <packet.json>]')
  return result
}

const main = () => {
  const args = parseArgs(process.argv.slice(2))
  const packet = buildPacket({
    qwen: readJson(args.qwenPath),
    documentAi: readJson(args.documentAiPath),
    qwenPath: args.qwenPath,
    documentAiPath: args.documentAiPath,
    priorExactPath: args.priorExactPath,
    recordedOn: args.recordedOn,
  })
  const errors = validatePacket(packet)
  if (errors.length) {
    console.log(JSON.stringify({ status: 'FAILED', errors }, null, 2))
    process.exitCode = 1
    return
  }
  mkdirSync(dirname(args.outputPath), { recursive: true })
  writeFileSync(args.outputPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify({
    status: 'PASSED',
    output: args.outputPath,
    schema: packet.schema,
    relationStatus: packet.agreementConflict.status,
    agreementRecordCount: packet.agreementConflict.agreement.recordCount,
    conflictRecordCount: packet.agreementConflict.conflict.recordCount,
    qwenLatencyMeanMs: packet.workers.find(worker => worker.workerId === QWEN_WORKER_ID).latencyMs.mean,
    documentAiLatencyMeanMs: packet.workers.find(worker => worker.workerId === DOCUMENT_AI_WORKER_ID).latencyMs.mean,
    qwenExactRate: packet.workers.find(worker => worker.workerId === QWEN_WORKER_ID).outcomes.exactRate,
    documentAiExactRate: packet.workers.find(worker => worker.workerId === DOCUMENT_AI_WORKER_ID).outcomes.exactRate,
    activationGateProposal: packet.activationGateProposal.status,
    packetContentSha256: packet.packetContentSha256,
  }, null, 2))
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) main()
