import {
  BLOCK_OCR_ROUTE,
  CHI_KNOW_PO_CORPUS_ID,
  OCRProvider,
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from './historicalOcrTeam.js'

export const CHI_KNOW_PO_FINE_TUNING_TRIAL_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-finetuning-trial-v1'
export const CHI_KNOW_PO_FINE_TUNING_RUN_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-finetuning-run-v1'

const HASH = /^[a-f0-9]{64}$/i
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isHash = value => typeof value === 'string' && HASH.test(value)
const close = (left, right, epsilon = 1e-9) => typeof left === 'number' && typeof right === 'number' && Math.abs(left - right) <= epsilon
const add = (errors, code) => { if (!errors.includes(code)) errors.push(code) }

function validateRun(run, phase, expectedRecords, errors) {
  if (!isObject(run)) {
    add(errors, `${phase}_run_not_object`)
    return
  }
  if (run.schema !== CHI_KNOW_PO_FINE_TUNING_RUN_SCHEMA) add(errors, `${phase}_run_schema_invalid`)
  if (run.phase !== phase) add(errors, `${phase}_run_phase_invalid`)
  if (run.status !== 'PASSED') add(errors, `${phase}_run_not_passed`)
  if (run.candidate?.workerId !== 'pp-ocrv6-medium-rec' || run.candidate?.component !== 'rec') add(errors, `${phase}_worker_identity_invalid`)
  if (run.boundaries?.frozenDomainGoldAccessed !== false) add(errors, `${phase}_frozen_gold_boundary_changed`)
  if (run.boundaries?.detectionTouched !== false) add(errors, `${phase}_det_boundary_changed`)
  if (run.boundaries?.activation !== false) add(errors, `${phase}_activation_boundary_changed`)
  if (run.boundaries?.BLOCK_OCR_ROUTE !== BLOCK_OCR_ROUTE) add(errors, `${phase}_BLOCK_OCR_ROUTE_changed`)
  if (canonicalHistoricalOcrJson(run.boundaries?.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, `${phase}_OCRProvider_changed`)
  if (run.boundaries?.silentFallback !== false || run.boundaries?.semanticCorrection !== false) add(errors, `${phase}_operation_boundary_changed`)
  if (phase === 'train') {
    if (run.configuration?.heldOutVisibleToTrainingProcess !== false || run.configuration?.heldOutPathArgumentProvided !== false) add(errors, 'train_held_out_visibility_changed')
    if (run.checkpoint?.stateDictSaved !== true || !isHash(run.checkpoint?.sha256)) add(errors, 'train_checkpoint_missing')
    if (run.training?.stability !== 'PASSED' || run.training?.stepsCompleted !== run.training?.expectedSteps) add(errors, 'train_stability_not_closed')
    if (run.training?.nonfiniteLossSteps !== 0 || run.training?.nonfiniteParameterSteps !== 0) add(errors, 'train_nonfinite_observed')
    if (run.input?.partition !== 'train' || run.input?.documentCount !== 10) add(errors, 'train_partition_invalid')
    if (run.input?.selection?.selectedRecordCount !== run.configuration?.maxSelectedRecordsPerDocument * 10) add(errors, 'train_selection_count_invalid')
  } else {
    if (run.input?.partition !== 'untouched-held-out' || run.input?.documentCount !== 3) add(errors, `${phase}_partition_invalid`)
    if (phase === 'base-eval' && run.checkpoint?.loaded !== false) add(errors, 'base_checkpoint_unexpected')
    if (phase === 'tuned-eval' && (run.checkpoint?.loaded !== true || run.checkpoint?.frozenBeforeEvaluation !== true)) add(errors, 'tuned_checkpoint_not_frozen_before_eval')
    validateEvaluationMetrics(run, expectedRecords, errors)
  }
}

function validateEvaluationMetrics(run, expectedRecords, errors) {
  const records = Array.isArray(run.records) ? run.records : []
  if (records.length !== expectedRecords) add(errors, `${run.phase}_record_count_invalid`)
  const ids = new Set()
  let exact = 0
  let editDistance = 0
  let targetCharacters = 0
  const confidences = []
  const perDocument = new Map()
  for (const [index, record] of records.entries()) {
    if (!isObject(record)) { add(errors, `${run.phase}_record_not_object:${index}`); continue }
    for (const forbidden of ['transcription', 'predictionText', 'targetText', 'imageBytes', 'imageData']) {
      if (Object.prototype.hasOwnProperty.call(record, forbidden)) add(errors, `${run.phase}_raw_text_or_image_retained:${index}`)
    }
    if (!isHash(record.recordIdSha256) || ids.has(record.recordIdSha256)) add(errors, `${run.phase}_record_identity_invalid:${index}`)
    ids.add(record.recordIdSha256)
    if (!isHash(record.targetTextSha256) || !isHash(record.predictionTextSha256)) add(errors, `${run.phase}_prediction_hash_invalid:${index}`)
    if (typeof record.targetTextLength !== 'number' || record.targetTextLength < 1) add(errors, `${run.phase}_target_length_invalid:${index}`)
    if (!Number.isInteger(record.editDistance) || record.editDistance < 0) add(errors, `${run.phase}_edit_distance_invalid:${index}`)
    if (record.characterErrorRate !== null && !close(record.characterErrorRate, record.editDistance / record.targetTextLength)) add(errors, `${run.phase}_cer_invalid:${index}`)
    if (typeof record.exactMatch !== 'boolean' || record.exactMatch !== (record.predictionTextSha256 === record.targetTextSha256)) add(errors, `${run.phase}_exact_invalid:${index}`)
    if (!close(record.confidence, record.confidence) || record.confidence < 0 || record.confidence > 1) add(errors, `${run.phase}_confidence_invalid:${index}`)
    exact += Number(record.exactMatch === true)
    editDistance += record.editDistance
    targetCharacters += record.targetTextLength
    confidences.push(record.confidence)
    const doc = perDocument.get(record.docId) || { recordCount: 0, exactMatchRuns: 0, editDistance: 0, targetCharacters: 0 }
    doc.recordCount += 1
    doc.exactMatchRuns += Number(record.exactMatch === true)
    doc.editDistance += record.editDistance
    doc.targetCharacters += record.targetTextLength
    perDocument.set(record.docId, doc)
  }
  const metrics = run.metrics || {}
  if (metrics.recordCount !== records.length || metrics.exactMatchRuns !== exact) add(errors, `${run.phase}_aggregate_count_mismatch`)
  if (!close(metrics.exactMatchRate, exact / records.length)) add(errors, `${run.phase}_aggregate_exact_rate_mismatch`)
  if (metrics.totalEditDistance !== editDistance || metrics.totalTargetCharacters !== targetCharacters) add(errors, `${run.phase}_aggregate_edit_mismatch`)
  if (!close(metrics.characterErrorRate, editDistance / targetCharacters)) add(errors, `${run.phase}_aggregate_cer_mismatch`)
  if (metrics.confidencePresentRuns !== confidences.length) add(errors, `${run.phase}_aggregate_confidence_count_mismatch`)
  if (!close(metrics.confidenceMean, confidences.reduce((sum, value) => sum + value, 0) / confidences.length)) add(errors, `${run.phase}_aggregate_confidence_mean_mismatch`)
  if (!close(metrics.confidenceMin, Math.min(...confidences)) || !close(metrics.confidenceMax, Math.max(...confidences))) add(errors, `${run.phase}_aggregate_confidence_range_mismatch`)
  if (!isHash(run.outputSha256) || run.reproducibility?.outputSha256 !== run.outputSha256) add(errors, `${run.phase}_output_hash_missing`)
  const digest = historicalOcrContentSha256({
    partition: 'untouched-held-out',
    checkpointSha256: run.checkpoint?.sha256 || null,
    records: records.map(record => ({
      recordIdSha256: record.recordIdSha256,
      docId: record.docId,
      targetTextSha256: record.targetTextSha256,
      targetTextLength: record.targetTextLength,
      predictionTextSha256: record.predictionTextSha256,
      predictionTextLength: record.predictionTextLength,
      exactMatch: record.exactMatch,
      editDistance: record.editDistance,
    })),
  })
  if (digest !== run.outputSha256) add(errors, `${run.phase}_output_hash_not_recomputed`)
  for (const [docId, value] of perDocument.entries()) {
    const observed = run.perDocumentMetrics?.[docId]
    if (!observed || observed.recordCount !== value.recordCount || observed.exactMatchRuns !== value.exactMatchRuns || observed.editDistance !== value.editDistance || observed.targetCharacters !== value.targetCharacters) add(errors, `${run.phase}_per_document_metrics_mismatch:${docId}`)
  }
}

export function checkChiKnowPoFineTuningTrial(trial) {
  const errors = []
  if (!isObject(trial)) return ['trial_not_object']
  if (trial.schema !== CHI_KNOW_PO_FINE_TUNING_TRIAL_SCHEMA) add(errors, 'schema_mismatch')
  if (!['PROVEN', 'NOT_PROVEN', 'BLOCKED'].includes(trial.status)) add(errors, 'status_invalid')
  if (trial.candidate?.workerId !== 'pp-ocrv6-medium-rec' || trial.candidate?.component !== 'rec') add(errors, 'candidate_identity_invalid')
  if (trial.candidate?.model?.modelId !== 'PaddlePaddle/PP-OCRv6_medium_rec_safetensors') add(errors, 'model_id_invalid')
  if (trial.candidate?.model?.revision !== '024cad6a831de75c2c3c26e711ba8c4a82ccd24b') add(errors, 'model_revision_invalid')
  if (!isHash(trial.candidate?.model?.weightsSha256)) add(errors, 'model_hash_missing')
  if (trial.corpus?.corpusId !== CHI_KNOW_PO_CORPUS_ID) add(errors, 'corpus_id_invalid')
  for (const field of ['sourceManifestSha256', 'documentSplitSha256', 'leakageValidationSha256']) if (!isHash(trial.corpus?.[field])) add(errors, `corpus_${field}_missing`)
  if (trial.protocol?.trainDocumentCount !== 10 || trial.protocol?.heldOutDocumentCount !== 3) add(errors, 'document_count_invalid')
  if (trial.protocol?.heldOutEvaluationAfterCheckpointFreeze !== true || trial.protocol?.heldOutExcludedFromTrainingProcess !== true || trial.protocol?.modelSelectionOnHeldOut !== false) add(errors, 'held_out_protocol_invalid')
  const trainIds = trial.corpus?.train?.documentIds || []
  const heldOutIds = trial.corpus?.untouchedHeldOut?.documentIds || []
  if (trainIds.length !== 10 || new Set(trainIds).size !== 10) add(errors, 'train_document_ids_invalid')
  if (heldOutIds.length !== 3 || new Set(heldOutIds).size !== 3) add(errors, 'held_out_document_ids_invalid')
  if (trainIds.some(id => heldOutIds.includes(id))) add(errors, 'cross_partition_document_id')
  if (trial.boundaries?.frozenDomainGoldAccessed !== false) add(errors, 'frozen_gold_boundary_changed')
  if (trial.boundaries?.detectionExtension !== 'DEFERRED') add(errors, 'det_extension_changed')
  if (trial.boundaries?.activation !== false || trial.boundaries?.BLOCK_OCR_ROUTE !== BLOCK_OCR_ROUTE) add(errors, 'activation_or_route_boundary_changed')
  if (canonicalHistoricalOcrJson(trial.boundaries?.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, 'OCRProvider_changed')
  if (trial.boundaries?.fallbackPolicy !== 'none' || trial.boundaries?.semanticCorrection !== false || trial.boundaries?.search !== false || trial.boundaries?.historicalSourceJudgment !== false || trial.boundaries?.silentFallback !== false) add(errors, 'operation_boundary_changed')
  const expectedRecords = trial.corpus?.untouchedHeldOut?.recordCount
  if (!Number.isInteger(expectedRecords) || expectedRecords < 1) add(errors, 'held_out_record_count_missing')
  const baseRuns = trial.runs?.baseEval
  const trainRuns = trial.runs?.train
  const tunedRuns = trial.runs?.tunedEval
  if (!Array.isArray(baseRuns) || baseRuns.length !== 2) add(errors, 'base_repeat_count_invalid')
  if (!Array.isArray(trainRuns) || trainRuns.length !== 2) add(errors, 'train_repeat_count_invalid')
  if (!Array.isArray(tunedRuns) || tunedRuns.length !== 2) add(errors, 'tuned_repeat_count_invalid')
  if (Array.isArray(baseRuns)) baseRuns.forEach(run => validateRun(run, 'base-eval', expectedRecords, errors))
  if (Array.isArray(trainRuns)) trainRuns.forEach(run => validateRun(run, 'train', expectedRecords, errors))
  if (Array.isArray(tunedRuns)) tunedRuns.forEach(run => validateRun(run, 'tuned-eval', expectedRecords, errors))
  if (Array.isArray(baseRuns) && baseRuns.length === 2 && baseRuns[0]?.outputSha256 !== baseRuns[1]?.outputSha256) add(errors, 'base_reproducibility_invalid')
  if (Array.isArray(tunedRuns) && tunedRuns.length === 2 && tunedRuns[0]?.outputSha256 !== tunedRuns[1]?.outputSha256) add(errors, 'tuned_reproducibility_invalid')
  if (Array.isArray(trainRuns) && trainRuns.length === 2 && trainRuns[0]?.checkpoint?.sha256 !== trainRuns[1]?.checkpoint?.sha256) add(errors, 'checkpoint_reproducibility_invalid')
  if (trial.resourceGate?.status === 'PASSED' && (trial.resourceGate?.pass !== true || (trial.resourceGate?.reasons || []).length !== 0)) add(errors, 'resource_gate_status_invalid')
  if (trial.specializationEffectGate?.status === 'PROVEN') {
    if (trial.status !== 'PROVEN') add(errors, 'proven_effect_status_mismatch')
    if (trial.promotion?.nextFineTuningGate !== 'READY_FOR_NEXT_FINE_TUNING_GATE') add(errors, 'proven_promotion_missing')
  } else if (trial.status === 'PROVEN') {
    add(errors, 'trial_proven_without_effect_gate')
  } else if (trial.promotion?.nextFineTuningGate !== 'NOT_PROMOTED') {
    add(errors, 'not_proven_promotion_open')
  }
  const expectedContentSha = historicalOcrContentSha256({ ...trial, contentSha256: null })
  if (trial.contentSha256 !== expectedContentSha) add(errors, 'content_sha256_mismatch')
  return [...new Set(errors)].sort()
}

export function validateChiKnowPoFineTuningTrial(trial) {
  const errors = checkChiKnowPoFineTuningTrial(trial)
  return { pass: errors.length === 0, errors }
}
