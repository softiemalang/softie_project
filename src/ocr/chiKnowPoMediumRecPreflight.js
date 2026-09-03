import {
  BLOCK_OCR_ROUTE,
  OCRProvider,
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from './historicalOcrTeam.js'

export const CHI_KNOW_PO_MEDIUM_REC_PREFLIGHT_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-preflight-v1'
export const CHI_KNOW_PO_MEDIUM_REC_PREFLIGHT_RUN_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-preflight-run-v1'

const HASH = /^[a-f0-9]{64}$/i
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isHash = value => typeof value === 'string' && HASH.test(value)
const close = (left, right, epsilon = 1e-7) => typeof left === 'number' && typeof right === 'number' && Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= epsilon
const add = (errors, code) => { if (!errors.includes(code)) errors.push(code) }

const FORBIDDEN_KEYS = new Set(['transcription', 'predictionText', 'targetText', 'imageBytes', 'imageData'])

function checkForbiddenKeys(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkForbiddenKeys(item, `${path}[${index}]`, errors))
    return
  }
  if (!isObject(value)) return
  Object.keys(value).forEach(key => {
    if (FORBIDDEN_KEYS.has(key)) add(errors, `raw_text_or_image_retained:${path}.${key}`)
    checkForbiddenKeys(value[key], `${path}.${key}`, errors)
  })
}

function validateMetrics(bundle, path, expectedRecordCount, errors) {
  if (!isObject(bundle)) {
    add(errors, `${path}_not_object`)
    return
  }
  const records = Array.isArray(bundle.records) ? bundle.records : []
  if (records.length !== expectedRecordCount) add(errors, `${path}_record_count_invalid`)
  const ids = new Set()
  let exact = 0
  let editDistance = 0
  let targetCharacters = 0
  const confidences = []
  for (const [index, record] of records.entries()) {
    if (!isObject(record)) {
      add(errors, `${path}_record_not_object:${index}`)
      continue
    }
    if (!isHash(record.recordIdSha256) || ids.has(record.recordIdSha256)) add(errors, `${path}_record_identity_invalid:${index}`)
    ids.add(record.recordIdSha256)
    if (typeof record.docId !== 'string' || !isHash(record.targetTextSha256) || !isHash(record.predictionTextSha256)) add(errors, `${path}_hash_fields_invalid:${index}`)
    if (!Number.isInteger(record.targetTextLength) || record.targetTextLength < 1) add(errors, `${path}_target_length_invalid:${index}`)
    if (!Number.isInteger(record.editDistance) || record.editDistance < 0) add(errors, `${path}_edit_distance_invalid:${index}`)
    if (record.characterErrorRate !== null && !close(record.characterErrorRate, record.editDistance / record.targetTextLength)) add(errors, `${path}_cer_invalid:${index}`)
    if (typeof record.exactMatch !== 'boolean' || record.exactMatch !== (record.targetTextSha256 === record.predictionTextSha256)) add(errors, `${path}_exact_invalid:${index}`)
    if (!close(record.confidence, record.confidence) || record.confidence < 0 || record.confidence > 1 || record.confidencePresent !== true) add(errors, `${path}_confidence_invalid:${index}`)
    exact += Number(record.exactMatch === true)
    editDistance += record.editDistance
    targetCharacters += record.targetTextLength
    confidences.push(record.confidence)
  }
  const metrics = bundle.metrics || {}
  if (metrics.recordCount !== records.length || metrics.exactMatchRuns !== exact) add(errors, `${path}_aggregate_count_mismatch`)
  if (!close(metrics.exactMatchRate, records.length ? exact / records.length : null)) add(errors, `${path}_aggregate_exact_rate_mismatch`)
  if (metrics.totalEditDistance !== editDistance || metrics.totalTargetCharacters !== targetCharacters) add(errors, `${path}_aggregate_edit_mismatch`)
  if (!close(metrics.characterErrorRate, targetCharacters ? editDistance / targetCharacters : null)) add(errors, `${path}_aggregate_cer_mismatch`)
  if (metrics.confidencePresentRuns !== confidences.length) add(errors, `${path}_aggregate_confidence_count_mismatch`)
  if (confidences.length > 0) {
    if (!close(metrics.confidenceMean, confidences.reduce((sum, value) => sum + value, 0) / confidences.length, 1e-6)) add(errors, `${path}_aggregate_confidence_mean_mismatch`)
    if (!close(metrics.confidenceMin, Math.min(...confidences), 1e-6) || !close(metrics.confidenceMax, Math.max(...confidences), 1e-6)) add(errors, `${path}_aggregate_confidence_range_mismatch`)
  }
  if (!isHash(bundle.outputSha256) || bundle.reproducibility?.outputSha256 !== bundle.outputSha256) add(errors, `${path}_output_hash_missing`)
  const decoder = bundle.decoder || null
  const digest = historicalOcrContentSha256({
    decoder,
    records: records.map(record => ({
      docId: record.docId,
      recordIdSha256: record.recordIdSha256,
      targetTextSha256: record.targetTextSha256,
      targetTextLength: record.targetTextLength,
      predictionTextSha256: record.predictionTextSha256,
      predictionTextLength: record.predictionTextLength,
      exactMatch: record.exactMatch,
      editDistance: record.editDistance,
    })),
  })
  if (digest !== bundle.outputSha256) add(errors, `${path}_output_hash_not_recomputed`)
}

function validateRun(run, phase, expectedRecordCount, errors) {
  if (!isObject(run)) {
    add(errors, `${phase}_run_not_object`)
    return
  }
  if (run.schema !== CHI_KNOW_PO_MEDIUM_REC_PREFLIGHT_RUN_SCHEMA) add(errors, `${phase}_schema_invalid`)
  if (run.phase !== phase) add(errors, `${phase}_phase_invalid`)
  if (run.status !== 'PASSED') add(errors, `${phase}_not_passed`)
  if (run.candidate?.workerId !== 'pp-ocrv6-medium-rec' || run.candidate?.component !== 'rec') add(errors, `${phase}_worker_identity_invalid`)
  if (run.candidate?.model?.modelId !== 'PaddlePaddle/PP-OCRv6_medium_rec_safetensors' || run.candidate?.model?.revision !== '024cad6a831de75c2c3c26e711ba8c4a82ccd24b' || !isHash(run.candidate?.model?.weightsSha256)) add(errors, `${phase}_model_identity_invalid`)
  if (run.input?.partition !== 'train' || run.input?.documentCount !== 10 || run.input?.heldOutPathArgumentProvided !== false || run.input?.frozenDomainGoldPathArgumentProvided !== false) add(errors, `${phase}_train_only_boundary_invalid`)
  if (typeof run.input?.parquetPath !== 'string' || !run.input.parquetPath.includes('/train/corpus.parquet') || /heldout|untouched-held-out|frozen[-_]?gold/i.test(run.input.parquetPath)) add(errors, `${phase}_train_path_invalid`)
  if (!isHash(run.input?.parquetSha256)) add(errors, `${phase}_train_hash_missing`)
  if (run.boundaries?.frozenDomainGoldAccessed !== false || run.boundaries?.heldOutAccessed !== false || run.boundaries?.detectionTouched !== false || run.boundaries?.activation !== false || run.boundaries?.fullFineTuningExecuted !== false) add(errors, `${phase}_scope_boundary_changed`)
  if (run.boundaries?.BLOCK_OCR_ROUTE !== BLOCK_OCR_ROUTE) add(errors, `${phase}_BLOCK_OCR_ROUTE_changed`)
  if (canonicalHistoricalOcrJson(run.boundaries?.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, `${phase}_OCRProvider_changed`)
  if (run.boundaries?.silentFallback !== false || run.boundaries?.semanticCorrection !== false || run.boundaries?.search !== false) add(errors, `${phase}_operation_boundary_changed`)
  if (phase === 'zero-step-checkpoint-round-trip') {
    if (run.configuration?.zeroOptimizerSteps !== 0) add(errors, 'zero_step_optimizer_changed')
    if (!isHash(run.checkpoint?.sha256) || run.checkpoint?.savedAndLoaded !== true) add(errors, 'zero_step_checkpoint_invalid')
    if (!isHash(run.checkpoint?.parameterSha256BeforeSave) || run.checkpoint.parameterSha256BeforeSave !== run.checkpoint.parameterSha256LoadedState || run.checkpoint.parameterSha256LoadedState !== run.checkpoint.parameterSha256AfterLoad) add(errors, 'zero_step_parameter_digest_not_preserved')
    if (run.decoderRoundTrip?.pass !== true || run.decoderRoundTrip?.before?.outputSha256 !== run.decoderRoundTrip?.after?.outputSha256 || run.decoderRoundTrip?.before?.probabilitiesSha256 !== run.decoderRoundTrip?.after?.probabilitiesSha256) add(errors, 'zero_step_decoder_not_preserved')
    validateMetrics({ ...run.decoderRoundTrip?.before, decoder: run.configuration?.decoder }, 'zero_step_before', run.input?.selection?.selectedRecordCount, errors)
    validateMetrics({ ...run.decoderRoundTrip?.after, decoder: run.configuration?.decoder }, 'zero_step_after', run.input?.selection?.selectedRecordCount, errors)
  } else if (phase === 'tiny-overfit-sanity') {
    if (run.configuration?.tinyRecordCount !== run.input?.selection?.selectedRecordCount || run.configuration?.tinyRecordCount < 1 || run.configuration?.tinyRecordCount > 4) add(errors, 'tiny_record_cap_invalid')
    if (run.configuration?.heldOutVisibleToTrainingProcess !== false || run.configuration?.heldOutPathArgumentProvided !== false) add(errors, 'tiny_held_out_visibility_changed')
    if (run.training?.stability !== 'PASSED' || run.training?.stepsCompleted !== run.training?.expectedSteps || run.training?.nonfiniteLossSteps !== 0 || run.training?.nonfiniteParameterSteps !== 0) add(errors, 'tiny_training_stability_invalid')
    if (!(typeof run.training?.lossFirst === 'number' && typeof run.training?.lossLast === 'number' && run.training.lossLast < run.training.lossFirst)) add(errors, 'tiny_loss_not_decreased')
    if (!isHash(run.checkpoint?.sha256) || run.checkpoint?.savedAndLoaded !== true) add(errors, 'tiny_checkpoint_invalid')
    if (run.sanityGate?.status !== 'PASSED' || run.sanityGate?.lossDecreased !== true || run.sanityGate?.accuracySignal !== true || run.sanityGate?.checkpointRoundTrip !== true || run.sanityGate?.noNonfinite !== true) add(errors, 'tiny_sanity_gate_invalid')
    validateMetrics({ ...run.baseEvaluation, decoder: run.configuration?.decoder }, 'tiny_base', run.input?.selection?.selectedRecordCount, errors)
    validateMetrics({ ...run.tunedEvaluation, decoder: run.configuration?.decoder }, 'tiny_tuned', run.input?.selection?.selectedRecordCount, errors)
    validateMetrics({ ...run.tunedCheckpointRoundTrip, decoder: run.configuration?.decoder }, 'tiny_tuned_roundtrip', run.input?.selection?.selectedRecordCount, errors)
    if (run.tunedEvaluation?.outputSha256 !== run.tunedCheckpointRoundTrip?.outputSha256) add(errors, 'tiny_checkpoint_decoder_output_not_preserved')
  }
}

export function checkChiKnowPoMediumRecPreflight(preflight) {
  const errors = []
  if (!isObject(preflight)) return ['preflight_not_object']
  if (preflight.schema !== CHI_KNOW_PO_MEDIUM_REC_PREFLIGHT_SCHEMA) add(errors, 'schema_mismatch')
  if (!['PASSED', 'FUNCTIONAL_PASS_RESOURCE_BLOCKED', 'FAILED'].includes(preflight.status)) add(errors, 'status_invalid')
  if (!['PRE_TUNING_SANITY_PASSED', 'PRE_TUNING_FUNCTIONAL_PASS_LOCAL_RESOURCE_BLOCKED', 'PRE_TUNING_SANITY_FAILED'].includes(preflight.decision)) add(errors, 'decision_invalid')
  if (preflight.candidate?.workerId !== 'pp-ocrv6-medium-rec' || preflight.candidate?.component !== 'rec') add(errors, 'candidate_identity_invalid')
  if (preflight.candidate?.model?.modelId !== 'PaddlePaddle/PP-OCRv6_medium_rec_safetensors' || preflight.candidate?.model?.revision !== '024cad6a831de75c2c3c26e711ba8c4a82ccd24b' || !isHash(preflight.candidate?.model?.weightsSha256)) add(errors, 'model_identity_invalid')
  if (preflight.input?.corpusId !== 'CHI-KNOW-PO' || preflight.input?.partition !== 'train' || preflight.input?.documentCount !== 10 || preflight.input?.heldOutPathArgumentProvided !== false || preflight.input?.frozenDomainGoldPathArgumentProvided !== false) add(errors, 'train_only_input_invalid')
  if (preflight.input?.parquetSha256 !== '97f6fcc531cb79c4e0f2f63a042f52317b9299ed2f13785663c8523c7c0bc25b') add(errors, 'train_parquet_hash_invalid')
  if (!Array.isArray(preflight.input?.documentIds) || preflight.input.documentIds.length !== 10 || new Set(preflight.input.documentIds).size !== 10) add(errors, 'train_document_ids_invalid')
  if (preflight.protocol?.trainOnly !== true || preflight.protocol?.fullFineTuningExecuted !== false || preflight.protocol?.heldOutAccessed !== false || preflight.protocol?.frozenDomainGoldAccessed !== false) add(errors, 'protocol_boundary_invalid')
  if (preflight.boundaries?.frozenDomainGoldAccessed !== false || preflight.boundaries?.heldOutAccessed !== false || preflight.boundaries?.fullFineTuningExecuted !== false || preflight.boundaries?.detectionExtension !== 'DEFERRED' || preflight.boundaries?.activation !== false || preflight.boundaries?.BLOCK_OCR_ROUTE !== BLOCK_OCR_ROUTE) add(errors, 'boundary_invalid')
  if (canonicalHistoricalOcrJson(preflight.boundaries?.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, 'OCRProvider_changed')
  if (preflight.boundaries?.fallbackPolicy !== 'none' || preflight.boundaries?.silentFallback !== false || preflight.boundaries?.semanticCorrection !== false || preflight.boundaries?.search !== false) add(errors, 'operation_boundary_changed')
  const expectedRecordCount = preflight.protocol?.tinyRecordCount
  validateRun(preflight.runs?.zeroStepCheckpointRoundTrip, 'zero-step-checkpoint-round-trip', expectedRecordCount, errors)
  validateRun(preflight.runs?.tinyOverfitSanity, 'tiny-overfit-sanity', expectedRecordCount, errors)
  const zeroPass = preflight.gates?.zeroStepCheckpointRoundTrip?.status === 'PASSED'
  const tinyPass = preflight.gates?.tinyOverfitSanity?.status === 'PASSED'
  const functionalPass = zeroPass && tinyPass
  if ((preflight.gates?.functional === 'PASSED') !== functionalPass) add(errors, 'functional_gate_not_derived')
  if (preflight.resourceGate?.status === 'PASSED' && (preflight.resourceGate?.pass !== true || (preflight.resourceGate?.reasons || []).length !== 0)) add(errors, 'resource_gate_status_invalid')
  if (preflight.status === 'PASSED' && (!functionalPass || preflight.resourceGate?.pass !== true || preflight.decision !== 'PRE_TUNING_SANITY_PASSED')) add(errors, 'passed_status_not_derived')
  if (preflight.status === 'FUNCTIONAL_PASS_RESOURCE_BLOCKED' && (!functionalPass || preflight.resourceGate?.pass === true || preflight.decision !== 'PRE_TUNING_FUNCTIONAL_PASS_LOCAL_RESOURCE_BLOCKED')) add(errors, 'resource_blocked_status_not_derived')
  if (preflight.status === 'FAILED' && functionalPass) add(errors, 'failed_status_not_derived')
  if (preflight.promotion?.fullFineTuning !== 'BLOCKED_PENDING_CAUSE_CONFIRMATION' || preflight.promotion?.nextFineTuningGate !== 'NOT_OPEN' || preflight.promotion?.hfDisposableDesign !== 'DESIGNED_NOT_SUBMITTED' || preflight.promotion?.automaticPromotion !== false || preflight.promotion?.activation !== 'SEPARATE_DECISION_REQUIRED') add(errors, 'promotion_boundary_invalid')
  checkForbiddenKeys(preflight, 'preflight', errors)
  const expectedContentSha = historicalOcrContentSha256({ ...preflight, contentSha256: null })
  if (preflight.contentSha256 !== expectedContentSha) add(errors, 'content_sha256_mismatch')
  return [...new Set(errors)].sort()
}

export function validateChiKnowPoMediumRecPreflight(preflight) {
  const errors = checkChiKnowPoMediumRecPreflight(preflight)
  return { pass: errors.length === 0, errors }
}
