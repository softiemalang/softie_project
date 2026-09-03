import {
  BLOCK_OCR_ROUTE,
  OCRProvider,
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from './historicalOcrTeam.js'

export const HISTORICAL_OCR_EXACT_ADJUDICATION_SCHEMA = 'historical-ocr-frozen-exact-adjudication-v1'
export const PP_OCRV6_REC_ARCHIVE_SCHEMA = 'historical-ocr-ppocrv6-rec-archive-manifest-v1'

const PP_WORKER_IDS = Object.freeze(['pp-ocrv6-small-rec', 'pp-ocrv6-medium-rec'])
const clone = value => value === undefined ? undefined : structuredClone(value)
const sorted = values => [...values].sort((a, b) => String(a).localeCompare(String(b)))

function withContentSha256(value) {
  const copy = clone(value)
  delete copy.contentSha256
  return { ...copy, contentSha256: historicalOcrContentSha256(copy) }
}

function requireLineId(value, path) {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${path}_invalid`)
  return value
}

function normalizeExactFlags(value, path) {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(flag => typeof flag === 'boolean')) {
    throw new Error(`${path}_must_have_two_boolean_repeats`)
  }
  return [...value]
}

export function adjudicateFrozenExactOutcomes({ lineIds, candidates } = {}) {
  if (!Array.isArray(lineIds) || lineIds.length === 0) throw new Error('line_ids_required')
  const normalizedLineIds = lineIds.map((lineId, index) => requireLineId(lineId, `lineIds[${index}]`))
  if (new Set(normalizedLineIds).size !== normalizedLineIds.length) throw new Error('duplicate_line_id')
  if (!Array.isArray(candidates) || candidates.length === 0) throw new Error('candidates_required')

  const normalizedCandidates = candidates.map((candidate, candidateIndex) => {
    const workerId = requireLineId(candidate?.workerId, `candidates[${candidateIndex}].workerId`)
    if (!candidate?.exactByLine || typeof candidate.exactByLine !== 'object' || Array.isArray(candidate.exactByLine)) {
      throw new Error(`candidates[${candidateIndex}].exactByLine_required`)
    }
    const exactByLine = Object.fromEntries(normalizedLineIds.map(lineId => [
      lineId,
      normalizeExactFlags(candidate.exactByLine[lineId], `candidates[${candidateIndex}].exactByLine.${lineId}`),
    ]))
    const extraLineIds = Object.keys(candidate.exactByLine).filter(lineId => !normalizedLineIds.includes(lineId))
    if (extraLineIds.length > 0) throw new Error(`candidates[${candidateIndex}].unknown_line_id:${sorted(extraLineIds).join(',')}`)
    return { workerId, exactByLine }
  })
  const workerIds = normalizedCandidates.map(candidate => candidate.workerId)
  if (new Set(workerIds).size !== workerIds.length) throw new Error('duplicate_worker_id')

  const lineVerdicts = normalizedLineIds.map(lineId => {
    const workerOutcomes = normalizedCandidates.map(candidate => {
      const exactFlags = [...candidate.exactByLine[lineId]]
      const repeatStable = exactFlags[0] === exactFlags[1]
      const exactOutcome = repeatStable ? exactFlags[0] : null
      return { workerId: candidate.workerId, exactFlags, repeatStable, exactOutcome }
    })
    const exactWorkers = workerOutcomes.filter(item => item.exactOutcome === true).map(item => item.workerId)
    const uniqueExactWorker = exactWorkers.length === 1 ? exactWorkers[0] : null
    const answerStatus = exactWorkers.length === 0
      ? 'NO_EXACT_WORKER'
      : exactWorkers.length === 1
        ? 'UNIQUE_EXACT_WORKER_BUT_TEXT_UNRECONSTRUCTABLE'
        : 'NO_UNIQUE_EXACT_WORKER'
    return { lineId, workerOutcomes, exactWorkers, uniqueExactWorker, answerStatus }
  })

  const ppOcrv6UniqueExactLineCount = lineVerdicts.filter(verdict =>
    verdict.exactWorkers.some(workerId => PP_WORKER_IDS.includes(workerId)) && verdict.exactWorkers.length === 1,
  ).length
  const qwenUniqueExactLineCount = lineVerdicts.filter(verdict => verdict.uniqueExactWorker === 'qwen').length
  const uniqueTextAnswerEstablished = false

  return withContentSha256({
    schema: HISTORICAL_OCR_EXACT_ADJUDICATION_SCHEMA,
    status: 'CLOSED_RECORD',
    adjudicationMode: 'exact_boolean_outcomes_only',
    inputs: {
      frozenLineIds: [...normalizedLineIds],
      candidateWorkerIds: [...workerIds],
      repeatsPerLine: 2,
      rawTextInspected: false,
      predictionHashesInspected: false,
      cerInspected: false,
      confidenceInspected: false,
    },
    candidates: normalizedCandidates.map(candidate => ({
      workerId: candidate.workerId,
      lineOutcomes: normalizedLineIds.map(lineId => {
        const exactFlags = [...candidate.exactByLine[lineId]]
        return {
          lineId,
          exactFlags,
          repeatStable: exactFlags[0] === exactFlags[1],
          exactOutcome: exactFlags[0] === exactFlags[1] ? exactFlags[0] : null,
        }
      }),
    })),
    lineVerdicts,
    overall: {
      uniqueTextAnswerEstablished,
      uniqueTextAnswerStatus: 'NOT_ESTABLISHED_FROM_EXACT_OUTCOMES_ONLY',
      ppOcrv6UniqueExactLineCount,
      qwenUniqueExactLineCount,
      archivePpOcrv6BaseRecognition: true,
      archiveReasonCodes: [
        'no_ppocrv6_unique_exact_line',
        'unique_text_answer_not_reconstructable_from_exact_flags_only',
        'qwen_only_unique_exact_line_does_not_promote_ppocrv6',
      ],
    },
    routeBoundary: {
      BLOCK_OCR_ROUTE,
      OCRProvider: clone(OCRProvider),
      activation: false,
      fallbackPolicy: 'none',
    },
    retention: {
      rawPredictionTextRetained: false,
      rawModelOutputRetained: false,
      adjudicationUsesOnlyExactBooleans: true,
    },
  })
}

export function checkFrozenExactAdjudication(adjudication) {
  const errors = []
  if (!adjudication || typeof adjudication !== 'object' || Array.isArray(adjudication)) return ['adjudication_not_object']
  if (adjudication.schema !== HISTORICAL_OCR_EXACT_ADJUDICATION_SCHEMA) errors.push('schema_mismatch')
  if (adjudication.status !== 'CLOSED_RECORD') errors.push('status_invalid')
  if (adjudication.adjudicationMode !== 'exact_boolean_outcomes_only') errors.push('mode_invalid')
  if (adjudication.inputs?.rawTextInspected !== false) errors.push('raw_text_inspection_boundary_changed')
  if (adjudication.inputs?.predictionHashesInspected !== false) errors.push('prediction_hash_inspection_boundary_changed')
  if (adjudication.inputs?.cerInspected !== false) errors.push('cer_inspection_boundary_changed')
  if (adjudication.inputs?.confidenceInspected !== false) errors.push('confidence_inspection_boundary_changed')
  if (adjudication.inputs?.repeatsPerLine !== 2) errors.push('repeat_count_invalid')
  if (adjudication.retention?.adjudicationUsesOnlyExactBooleans !== true) errors.push('exact_only_boundary_changed')
  if (adjudication.routeBoundary?.BLOCK_OCR_ROUTE !== true) errors.push('BLOCK_OCR_ROUTE_changed')
  if (canonicalHistoricalOcrJson(adjudication.routeBoundary?.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) errors.push('OCRProvider_changed')
  if (adjudication.routeBoundary?.activation !== false) errors.push('activation_changed')
  if (adjudication.routeBoundary?.fallbackPolicy !== 'none') errors.push('fallback_policy_changed')
  if (adjudication.overall?.archivePpOcrv6BaseRecognition !== true) errors.push('ppocrv6_archive_decision_missing')
  if (adjudication.contentSha256 !== historicalOcrContentSha256({ ...adjudication, contentSha256: undefined })) errors.push('content_sha256_mismatch')

  const lineIds = adjudication.inputs?.frozenLineIds
  const candidates = adjudication.candidates
  if (!Array.isArray(lineIds) || lineIds.length === 0) errors.push('line_ids_missing')
  if (Array.isArray(lineIds) && new Set(lineIds).size !== lineIds.length) errors.push('duplicate_line_id')
  if (!Array.isArray(candidates) || candidates.length === 0) errors.push('candidates_missing')
  if (Array.isArray(lineIds) && Array.isArray(candidates)) {
    const candidateIds = new Set()
    candidates.forEach((candidate, candidateIndex) => {
      if (candidateIds.has(candidate?.workerId)) errors.push(`duplicate_worker_id:${candidate?.workerId}`)
      candidateIds.add(candidate?.workerId)
      if (!Array.isArray(candidate?.lineOutcomes)) {
        errors.push(`candidate_line_outcomes_missing:${candidateIndex}`)
        return
      }
      if (candidate.lineOutcomes.length !== lineIds.length) errors.push(`candidate_line_count_mismatch:${candidate?.workerId}`)
      const seen = new Set()
      candidate.lineOutcomes.forEach((outcome, outcomeIndex) => {
        if (!lineIds.includes(outcome?.lineId)) errors.push(`unknown_line_id:${outcome?.lineId}`)
        if (seen.has(outcome?.lineId)) errors.push(`duplicate_line_id:${candidate?.workerId}:${outcome?.lineId}`)
        seen.add(outcome?.lineId)
        if (outcome?.lineId !== lineIds[outcomeIndex]) errors.push(`line_order_mismatch:${candidate?.workerId}:${outcome?.lineId}`)
        if (!Array.isArray(outcome?.exactFlags) || outcome.exactFlags.length !== 2 || !outcome.exactFlags.every(flag => typeof flag === 'boolean')) {
          errors.push(`exact_flags_invalid:${candidate?.workerId}:${outcome?.lineId || outcomeIndex}`)
        }
        if (outcome?.repeatStable !== (outcome?.exactFlags?.[0] === outcome?.exactFlags?.[1])) errors.push(`repeat_stability_mismatch:${candidate?.workerId}:${outcome?.lineId}`)
        const expectedExact = outcome?.repeatStable ? outcome?.exactFlags?.[0] : null
        if (outcome?.exactOutcome !== expectedExact) errors.push(`exact_outcome_mismatch:${candidate?.workerId}:${outcome?.lineId}`)
      })
      lineIds.forEach(lineId => { if (!seen.has(lineId)) errors.push(`missing_line_id:${candidate?.workerId}:${lineId}`) })
    })
    if (errors.length === 0) {
      try {
        const expected = adjudicateFrozenExactOutcomes({
          lineIds,
          candidates: candidates.map(candidate => ({
            workerId: candidate.workerId,
            exactByLine: Object.fromEntries(candidate.lineOutcomes.map(outcome => [outcome.lineId, outcome.exactFlags])),
          })),
        })
        if (canonicalHistoricalOcrJson(adjudication.lineVerdicts) !== canonicalHistoricalOcrJson(expected.lineVerdicts)) errors.push('line_verdicts_not_derived')
        if (canonicalHistoricalOcrJson({ ...adjudication.overall, archivePpOcrv6BaseRecognition: undefined, archiveReasonCodes: undefined }) !== canonicalHistoricalOcrJson({ ...expected.overall, archivePpOcrv6BaseRecognition: undefined, archiveReasonCodes: undefined })) errors.push('overall_not_derived')
      } catch (error) {
        errors.push(`derived_adjudication_invalid:${error.message}`)
      }
    }
  }
  return sorted([...new Set(errors)])
}

export function buildPpOcrV6RecognitionArchiveManifest({
  adjudication,
  adjudicationPath,
  sourceArtifacts = [],
  comparisonSources = [],
  archivedOn = '2026-09-03',
} = {}) {
  if (!adjudication || checkFrozenExactAdjudication(adjudication).length > 0) throw new Error('valid_exact_adjudication_required')
  return withContentSha256({
    schema: PP_OCRV6_REC_ARCHIVE_SCHEMA,
    status: 'ARCHIVED',
    archivedOn,
    archiveMode: 'recoverable_manifest_without_source_deletion',
    archiveReason: 'no_unique_text_answer_established_from_frozen_line_exact_outcomes_only',
    sourceArtifacts: clone(sourceArtifacts),
    comparisonSources: clone(comparisonSources),
    adjudication: {
      path: adjudicationPath || null,
      contentSha256: adjudication.contentSha256,
      exactOnly: true,
    },
    selection: {
      availability: 'archived',
      availableForWorkerSelection: false,
      explicitWorkerIdCanOverride: false,
      fallbackPolicy: 'none',
      reasonCodes: [
        'no_ppocrv6_unique_exact_line',
        'unique_text_answer_not_reconstructable_from_exact_flags_only',
      ],
    },
    retention: {
      sourceArtifactsRemainInPlace: true,
      recoverable: true,
      rawPredictionTextDeleted: false,
      rawPredictionTextWasNotRetained: true,
    },
    routeBoundary: {
      BLOCK_OCR_ROUTE,
      OCRProvider: clone(OCRProvider),
      activation: false,
      fallbackPolicy: 'none',
    },
    fineTuning: {
      executed: false,
      decision: 'separate_gate_required',
    },
  })
}

export function checkPpOcrV6RecognitionArchiveManifest(manifest, { adjudication } = {}) {
  const errors = []
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return ['archive_manifest_not_object']
  if (manifest.schema !== PP_OCRV6_REC_ARCHIVE_SCHEMA) errors.push('schema_mismatch')
  if (manifest.status !== 'ARCHIVED') errors.push('status_invalid')
  if (manifest.archiveMode !== 'recoverable_manifest_without_source_deletion') errors.push('archive_mode_invalid')
  if (manifest.archiveReason !== 'no_unique_text_answer_established_from_frozen_line_exact_outcomes_only') errors.push('archive_reason_invalid')
  if (manifest.selection?.availability !== 'archived') errors.push('selection_availability_invalid')
  if (manifest.selection?.availableForWorkerSelection !== false) errors.push('worker_selection_not_blocked')
  if (manifest.selection?.explicitWorkerIdCanOverride !== false) errors.push('explicit_override_invalid')
  if (manifest.selection?.fallbackPolicy !== 'none') errors.push('fallback_policy_changed')
  if (manifest.retention?.sourceArtifactsRemainInPlace !== true || manifest.retention?.recoverable !== true) errors.push('recoverability_boundary_changed')
  if (manifest.routeBoundary?.BLOCK_OCR_ROUTE !== true) errors.push('BLOCK_OCR_ROUTE_changed')
  if (canonicalHistoricalOcrJson(manifest.routeBoundary?.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) errors.push('OCRProvider_changed')
  if (manifest.routeBoundary?.activation !== false) errors.push('activation_changed')
  if (manifest.fineTuning?.executed !== false) errors.push('fine_tuning_executed')
  if (manifest.fineTuning?.decision !== 'separate_gate_required') errors.push('fine_tuning_gate_policy_invalid')
  if (manifest.adjudication?.exactOnly !== true) errors.push('archive_adjudication_not_exact_only')
  if (!Array.isArray(manifest.sourceArtifacts) || manifest.sourceArtifacts.length < 2) errors.push('archive_source_artifacts_missing')
  if (adjudication && manifest.adjudication?.contentSha256 !== adjudication.contentSha256) errors.push('adjudication_reference_mismatch')
  if (manifest.contentSha256 !== historicalOcrContentSha256({ ...manifest, contentSha256: undefined })) errors.push('content_sha256_mismatch')
  return sorted([...new Set(errors)])
}
