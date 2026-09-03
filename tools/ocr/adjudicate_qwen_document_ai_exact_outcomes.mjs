#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import {
  BLOCK_OCR_ROUTE,
  OCRProvider,
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from '../../src/ocr/historicalOcrTeam.js'

export const QWEN_DOCUMENT_AI_EXACT_PACKET_SCHEMA = 'historical-ocr-qwen-document-ai-exact-outcome-v1'
export const QWEN_DOCUMENT_AI_EXACT_PACKET_VERSION = '1.0.0'
export const FROZEN_GOLD_SET_SHA256 = 'f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b'
export const INPUT_MANIFEST_SHA256 = '33e656dfcc479ce9a48e9638c96258b48e8cf1dd7fa29187753798ce34ff5315'
export const LINE_IDS = Object.freeze([
  'saju-main-title-line',
  'saju-folio-line',
  'ziwei-title-line',
  'astrology-title-line',
])
export const QWEN_WORKER_ID = 'qwen/qwen3.8-27b'
export const DOCUMENT_AI_WORKER_ID = 'document-ai-enterprise-document-ocr-optimized-request-v1'

const HASH = /^[a-f0-9]{64}$/i
const FORBIDDEN_KEYS = new Set([
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
const clone = value => value === undefined ? undefined : structuredClone(value)

const add = (errors, error) => {
  if (!errors.includes(error)) errors.push(error)
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isHash = value => typeof value === 'string' && HASH.test(value)

const withoutContentHash = packet => {
  const copy = clone(packet)
  delete copy.contentSha256
  return copy
}

const withContentHash = packet => ({
  ...packet,
  contentSha256: historicalOcrContentSha256(withoutContentHash(packet)),
})

const normalizeFlags = (flags, lineId, workerId) => {
  if (!Array.isArray(flags) || flags.length !== 2 || !flags.every(flag => typeof flag === 'boolean')) {
    throw new Error(`exact_flags_invalid:${workerId}:${lineId}`)
  }
  return [...flags]
}

const normalizeByLine = (exactByLine, workerId) => Object.fromEntries(LINE_IDS.map(lineId => [
  lineId,
  normalizeFlags(exactByLine?.[lineId], lineId, workerId),
]))

const stableOutcome = flags => flags[0] === flags[1] ? flags[0] : null

const workerOutcome = (workerId, exactFlags) => ({
  workerId,
  exactFlags: [...exactFlags],
  repeatStable: exactFlags[0] === exactFlags[1],
  exactOutcome: stableOutcome(exactFlags),
})

const lineRelation = (qwen, documentAi) => {
  if (qwen.exactOutcome === null || documentAi.exactOutcome === null) return 'UNKNOWN_REPEAT_INSTABILITY'
  if (qwen.exactOutcome === documentAi.exactOutcome) return qwen.exactOutcome ? 'AGREEMENT_BOTH_EXACT' : 'AGREEMENT_BOTH_NONEXACT'
  return documentAi.exactOutcome
    ? 'CONFLICT_DOCUMENT_AI_EXACT_QWEN_NONEXACT'
    : 'CONFLICT_QWEN_EXACT_DOCUMENT_AI_NONEXACT'
}

const isConflict = relation => relation.startsWith('CONFLICT_')
const isAgreement = relation => relation.startsWith('AGREEMENT_')
const requiresEscalation = relation => isConflict(relation) || relation === 'UNKNOWN_REPEAT_INSTABILITY' || relation === 'AGREEMENT_BOTH_NONEXACT'

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

const buildLineResults = (qwenByLine, documentAiByLine) => LINE_IDS.map(lineId => {
  const qwen = workerOutcome(QWEN_WORKER_ID, qwenByLine[lineId])
  const documentAi = workerOutcome(DOCUMENT_AI_WORKER_ID, documentAiByLine[lineId])
  const relation = lineRelation(qwen, documentAi)
  return {
    lineId,
    qwen,
    documentAi,
    relation,
    evidenceMode: 'frozen_gold_exact_boolean_outcomes_only',
    escalation: requiresEscalation(relation) ? 'ESCALATE_REQUIRED' : 'NO_AUTO_ACTION',
  }
})

const exactLineIds = (lineResults, workerKey) => lineResults
  .filter(line => line[workerKey].exactOutcome === true)
  .map(line => line.lineId)

export const buildQwenDocumentAiExactPacket = ({
  recordedOn = '2026-09-04',
  source,
  qwenExactByLine,
  documentAiExactByLine,
} = {}) => {
  const qwenByLine = normalizeByLine(qwenExactByLine, QWEN_WORKER_ID)
  const documentAiByLine = normalizeByLine(documentAiExactByLine, DOCUMENT_AI_WORKER_ID)
  const lineResults = buildLineResults(qwenByLine, documentAiByLine)
  const qwenOnlyExactLineIds = lineResults
    .filter(line => line.qwen.exactOutcome === true && line.documentAi.exactOutcome === false)
    .map(line => line.lineId)
  const documentAiOnlyExactLineIds = lineResults
    .filter(line => line.documentAi.exactOutcome === true && line.qwen.exactOutcome === false)
    .map(line => line.lineId)
  const overlappingExactLineIds = lineResults
    .filter(line => line.qwen.exactOutcome === true && line.documentAi.exactOutcome === true)
    .map(line => line.lineId)
  const unknownLineIds = lineResults
    .filter(line => line.relation === 'UNKNOWN_REPEAT_INSTABILITY')
    .map(line => line.lineId)
  const conflictLineIds = lineResults.filter(line => isConflict(line.relation)).map(line => line.lineId)
  const agreementLineIds = lineResults.filter(line => isAgreement(line.relation)).map(line => line.lineId)
  const agreementRecordCount = lineResults.reduce((sum, line) => sum + line.qwen.exactFlags.filter((flag, index) => flag === line.documentAi.exactFlags[index]).length, 0)
  const conflictRecordCount = 8 - agreementRecordCount
  const qwenExactRuns = lineResults.reduce((sum, line) => sum + line.qwen.exactFlags.filter(Boolean).length, 0)
  const documentAiExactRuns = lineResults.reduce((sum, line) => sum + line.documentAi.exactFlags.filter(Boolean).length, 0)
  const complementarityObserved = unknownLineIds.length === 0 && qwenOnlyExactLineIds.length > 0 && documentAiOnlyExactLineIds.length > 0
  const comparisonStatus = unknownLineIds.length > 0
    ? 'UNKNOWN_INPUT'
    : conflictLineIds.length > 0
      ? complementarityObserved ? 'COMPLEMENTARY_EXACT_COVERAGE_WITH_CONFLICT' : 'CONFLICT_NO_COMPLEMENTARITY'
      : 'AGREEMENT_ONLY'

  return withContentHash({
    schema: QWEN_DOCUMENT_AI_EXACT_PACKET_SCHEMA,
    version: QWEN_DOCUMENT_AI_EXACT_PACKET_VERSION,
    status: 'CLOSED_RECORD',
    recordedOn,
    comparisonMode: 'frozen_gold_exact_boolean_outcomes_only',
    source: clone(source),
    inputs: {
      frozenGoldSetSha256: FROZEN_GOLD_SET_SHA256,
      inputManifestSha256: INPUT_MANIFEST_SHA256,
      frozenLineIds: [...LINE_IDS],
      repeatsPerLine: 2,
      candidateWorkerIds: [QWEN_WORKER_ID, DOCUMENT_AI_WORKER_ID],
      rawTextInspected: false,
      predictionHashesInspected: false,
      cerInspected: false,
      confidenceInspected: false,
      geometryInspected: false,
      qwenExactByLine: clone(qwenByLine),
      documentAiExactByLine: clone(documentAiByLine),
    },
    candidates: [
      { workerId: QWEN_WORKER_ID, exactByLine: clone(qwenByLine), rawPredictionTextRetained: false },
      { workerId: DOCUMENT_AI_WORKER_ID, exactByLine: clone(documentAiByLine), rawPredictionTextRetained: false },
    ],
    lineResults,
    relations: {
      status: comparisonStatus,
      agreement: {
        lineIds: agreementLineIds,
        recordCount: agreementRecordCount,
        meaning: 'same frozen-gold exact boolean outcome only; not text agreement',
      },
      conflict: {
        lineIds: conflictLineIds,
        recordCount: conflictRecordCount,
        meaning: 'different frozen-gold exact boolean outcome; not reconstructed text conflict',
      },
      complementarity: {
        status: complementarityObserved ? 'OBSERVED' : 'NOT_OBSERVED',
        qwenOnlyExactLineIds,
        documentAiOnlyExactLineIds,
        overlappingExactLineIds,
        unionExactLineIds: LINE_IDS.filter(lineId => [...qwenOnlyExactLineIds, ...documentAiOnlyExactLineIds, ...overlappingExactLineIds].includes(lineId)),
      },
    },
    metrics: {
      lineCount: 4,
      recordCount: 8,
      qwenExactRuns,
      documentAiExactRuns,
      qwenExactRate: qwenExactRuns / 8,
      documentAiExactRate: documentAiExactRuns / 8,
      qwenCer: 'UNKNOWN',
      qwenCerReason: 'Qwen raw prediction text was not retained',
      documentAiCer: 'NOT_COMPARED_IN_THIS_EXACT_ONLY_PACKET',
    },
    escalationPolicy: {
      schema: 'historical-ocr-bounded-escalation-v1',
      currentDisposition: unknownLineIds.length > 0 || conflictLineIds.length > 0 || lineResults.some(line => line.relation === 'AGREEMENT_BOTH_NONEXACT') ? 'ESCALATE_REQUIRED' : 'NO_AUTO_ACTION',
      trigger: 'line_scoped_conflict_or_unknown_repeat_outcome',
      maxRounds: 1,
      maxAdditionalWorkersPerRound: 1,
      maxAdditionalRequestsPerRound: 8,
      allowedNextStep: 'one explicitly named third recognition worker or independently retained raw-text review on the same frozen gold; design only, not executed',
      actions: [
        'preserve both candidate packets and line-scoped relation',
        'emit ESCALATE_REQUIRED for conflict/unknown lines',
        'recompute this packet after the bounded evidence arrives',
      ],
      prohibited: [
        'automatic winner selection',
        'confidence-based selection or cross-provider calibration',
        'per-line text stitching or union-as-output',
        'semantic correction',
        'silent fallback',
        'OCR activation',
      ],
      execution: 'NOT_RUN_READ_ONLY_SCOPE',
    },
    selection: {
      selectedWorkerId: null,
      winner: 'NONE',
      automaticWinnerSelection: false,
      reason: 'agreement/conflict/complementarity are evidence relations, not routing authority',
    },
    routeBoundary: {
      BLOCK_OCR_ROUTE,
      OCRProvider: clone(OCRProvider),
      activation: false,
      fallbackPolicy: 'none',
      detectionSlotTouched: false,
      semanticCorrection: false,
      silentFallback: false,
      search: false,
      historicalSourceJudgment: false,
    },
    retention: {
      exactBooleanOutcomesOnly: true,
      rawPredictionTextRetained: false,
      rawModelOutputRetained: false,
      textAgreementClaimed: false,
      winnerClaimed: false,
    },
  })
}

export const validateQwenDocumentAiExactPacket = packet => {
  const errors = []
  if (!isObject(packet)) return ['packet_not_object']
  if (packet.schema !== QWEN_DOCUMENT_AI_EXACT_PACKET_SCHEMA) add(errors, 'schema_invalid')
  if (packet.version !== QWEN_DOCUMENT_AI_EXACT_PACKET_VERSION) add(errors, 'version_invalid')
  if (packet.status !== 'CLOSED_RECORD') add(errors, 'status_invalid')
  if (packet.comparisonMode !== 'frozen_gold_exact_boolean_outcomes_only') add(errors, 'comparison_mode_invalid')
  if (packet.inputs?.frozenGoldSetSha256 !== FROZEN_GOLD_SET_SHA256) add(errors, 'frozen_gold_hash_invalid')
  if (packet.inputs?.inputManifestSha256 !== INPUT_MANIFEST_SHA256) add(errors, 'input_manifest_hash_invalid')
  if (canonicalHistoricalOcrJson(packet.inputs?.frozenLineIds) !== canonicalHistoricalOcrJson(LINE_IDS)) add(errors, 'line_ids_invalid')
  if (packet.inputs?.repeatsPerLine !== 2) add(errors, 'repeat_count_invalid')
  if (packet.inputs?.rawTextInspected !== false || packet.inputs?.predictionHashesInspected !== false || packet.inputs?.cerInspected !== false || packet.inputs?.confidenceInspected !== false || packet.inputs?.geometryInspected !== false) add(errors, 'exact_only_boundary_invalid')
  if (!Array.isArray(packet.candidates) || packet.candidates.length !== 2) add(errors, 'candidate_count_invalid')
  if (packet.selection?.winner !== 'NONE' || packet.selection?.selectedWorkerId !== null || packet.selection?.automaticWinnerSelection !== false) add(errors, 'winner_selection_boundary_invalid')
  if (packet.routeBoundary?.BLOCK_OCR_ROUTE !== true || packet.routeBoundary?.OCRProvider?.enabled !== false || packet.routeBoundary?.activation !== false || packet.routeBoundary?.fallbackPolicy !== 'none' || packet.routeBoundary?.detectionSlotTouched !== false || packet.routeBoundary?.semanticCorrection !== false || packet.routeBoundary?.silentFallback !== false || packet.routeBoundary?.search !== false || packet.routeBoundary?.historicalSourceJudgment !== false) add(errors, 'route_boundary_invalid')
  if (packet.retention?.exactBooleanOutcomesOnly !== true || packet.retention?.rawPredictionTextRetained !== false || packet.retention?.rawModelOutputRetained !== false || packet.retention?.textAgreementClaimed !== false || packet.retention?.winnerClaimed !== false) add(errors, 'retention_boundary_invalid')
  if (!isHash(packet.contentSha256)) add(errors, 'content_hash_invalid')
  if (isHash(packet.contentSha256) && packet.contentSha256 !== historicalOcrContentSha256(withoutContentHash(packet))) add(errors, 'content_hash_mismatch')
  const forbidden = []
  walkForbidden(packet, '$', forbidden)
  forbidden.forEach(error => add(errors, error))

  const qwen = packet.inputs?.qwenExactByLine
  const documentAi = packet.inputs?.documentAiExactByLine
  if (qwen && documentAi) {
    try {
      const expected = buildQwenDocumentAiExactPacket({
        recordedOn: packet.recordedOn,
        source: packet.source,
        qwenExactByLine: qwen,
        documentAiExactByLine: documentAi,
      })
      const actualWithoutHash = withoutContentHash(packet)
      const expectedWithoutHash = withoutContentHash(expected)
      if (canonicalHistoricalOcrJson(actualWithoutHash) !== canonicalHistoricalOcrJson(expectedWithoutHash)) add(errors, 'packet_not_deterministically_derived')
    } catch (error) {
      add(errors, `input_outcome_invalid:${error.message}`)
    }
  } else {
    add(errors, 'input_outcomes_missing')
  }
  return [...new Set(errors)].sort()
}

export const ACTUAL_EVIDENCE_INPUT = Object.freeze({
  recordedOn: '2026-09-04',
  source: {
    frozenGoldSetSha256: FROZEN_GOLD_SET_SHA256,
    inputManifestSha256: INPUT_MANIFEST_SHA256,
    qwenExactAdjudicationPath: 'artifacts/historical-ocr-ppocrv6-rec/exact-outcome-adjudication.json',
    qwenExactAdjudicationContentSha256: '24d11d1fcf083afea1acc398eb3316e5efef722a9e0d8744f19e2e1e014026c7',
    qwenRunRecordPath: '/Users/hangyukim/Documents/malang_lab/documents/Web Research Broker Lab/benchmark/historical-ocr-recognition-qwen-groq-v1/result-2026-09-03.json',
    qwenRunRecordSha256: '3fc4d6959dfea7216ecf5bbf1e240ee380d12dcfa1470e3c9be871d9a94df4c4',
    documentAiBasePath: '/home/haantube421/google-vision-smoke-20260904/document-ai-8run.json',
    documentAiBaseSha256: '7153095ad8cb2c75327154fe501f44e11eba05675603b3b44102f354b458f5a0',
    documentAiOptimizedPath: '/home/haantube421/google-vision-smoke-20260904/document-ai-minimal-mask-imageless-8run-20260904-v1.json',
    documentAiOptimizedSha256: 'b3fec8714c957cb80d2a5a87fe298b9e0e33ebfd4bb3517bb26e1b8c851fd671',
    optimizedRequestGate: 'OPTIMIZED_REQUEST_SHAPE_CANDIDATE',
  },
  qwenExactByLine: {
    'saju-main-title-line': [true, true],
    'saju-folio-line': [false, false],
    'ziwei-title-line': [true, true],
    'astrology-title-line': [true, true],
  },
  documentAiExactByLine: {
    'saju-main-title-line': [true, true],
    'saju-folio-line': [true, true],
    'ziwei-title-line': [true, true],
    'astrology-title-line': [false, false],
  },
})

export const buildActualEvidencePacket = () => buildQwenDocumentAiExactPacket(ACTUAL_EVIDENCE_INPUT)

const main = () => {
  if (process.argv.includes('--self-test')) {
    const packet = buildActualEvidencePacket()
    const errors = validateQwenDocumentAiExactPacket(packet)
    assert.deepEqual(errors, [])
    console.log(JSON.stringify({
      status: 'SELF_TEST_PASSED',
      schema: packet.schema,
      comparisonStatus: packet.relations.status,
      agreementLines: packet.relations.agreement.lineIds,
      conflictLines: packet.relations.conflict.lineIds,
      complementarity: packet.relations.complementarity.status,
      winner: packet.selection.winner,
      escalation: packet.escalationPolicy.currentDisposition,
      contentSha256: packet.contentSha256,
    }))
    return
  }
  const inputIndex = process.argv.indexOf('--input')
  if (inputIndex === -1 || !process.argv[inputIndex + 1]) throw new Error('usage: adjudicate_qwen_document_ai_exact_outcomes.mjs --self-test | --input <packet.json>')
  const input = resolve(process.argv[inputIndex + 1])
  const packet = JSON.parse(readFileSync(input, 'utf8'))
  const errors = validateQwenDocumentAiExactPacket(packet)
  console.log(JSON.stringify({ status: errors.length === 0 ? 'PASSED' : 'FAILED', input, errors, packet }, null, 2))
  if (errors.length > 0) process.exitCode = 1
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
