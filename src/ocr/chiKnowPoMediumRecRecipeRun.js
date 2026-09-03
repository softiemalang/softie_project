import {
  BLOCK_OCR_ROUTE,
  OCRProvider,
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from './historicalOcrTeam.js'

export const CHI_KNOW_PO_MEDIUM_REC_RECIPE_RUN_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-hf-recipe-run-v1'

const HASH = /^[a-f0-9]{64}$/i
const INNER_TRAIN = Object.freeze(['A-1', 'A-4', 'S-2', 'S-4', 'S-6', 'S-7', 'T-1'])
const INNER_DEV = Object.freeze(['A-3', 'S-3', 'T-3'])
const DOC_COUNTS = Object.freeze({ 'A-3': 590, 'S-3': 1267, 'T-3': 832 })
const EXPECTED_SOURCE_SHARDS = Object.freeze({
  'data/train-00000-of-00002.parquet': 'a7e73c9d6a4441d8ab8c1a42eed498757ae19ad1f2e015536fa222e90e1f360d',
  'data/train-00001-of-00002.parquet': '568596476bc25bb68a4576207aad6f52c898cfd9884a2e3aab994333c3db19e3',
})
const EXPECTED_MODEL_WEIGHTS = '5f43c16f2a684b1d2284662178bdb604febd3d6bfdb5ca73828d08d0f7c0c3e9'
const EXPECTED_MODEL_CHARACTER = 'ce2cbde4e573b4791facae91eea497d7a2ae245b30bf73563643a0f4971caa3d'
const EXPECTED_INNER_SPLIT = '617f4c6988438a262fc3412b40e5897a01e0ba7d3c32c6b760db3f67dce18aab'
const EXPECTED_TRAIN_PARQUET = '97f6fcc531cb79c4e0f2f63a042f52317b9299ed2f13785663c8523c7c0bc25b'
const STAGES = Object.freeze([
  { id: 's0-head-only', learningRate: 0.00001, trainable: ['head.head.'], frozen: ['head.encoder.', 'model.'], count: 2 },
  { id: 's1-head-encoder', learningRate: 0.000003, trainable: ['head.head.', 'head.encoder.'], frozen: ['model.'], count: 45 },
  { id: 's2-last-backbone-block', learningRate: 0.000001, trainable: ['head.head.', 'head.encoder.', 'model.backbone.encoder.blocks.3.'], frozen: ['model.backbone.encoder.stem1.', 'model.backbone.encoder.blocks.0.', 'model.backbone.encoder.blocks.1.', 'model.backbone.encoder.blocks.2.'], count: 88 },
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isHash = value => typeof value === 'string' && HASH.test(value)
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value)
const add = (errors, code) => { if (!errors.includes(code)) errors.push(code) }
const exactArray = (value, expected) => Array.isArray(value) && canonicalHistoricalOcrJson(value) === canonicalHistoricalOcrJson(expected)
const close = (left, right, epsilon = 1e-9) => isFiniteNumber(left) && isFiniteNumber(right) && Math.abs(left - right) <= epsilon

const forbiddenKeys = new Set(['transcription', 'targetText', 'predictionText', 'imageBytes', 'imageData', 'records'])
function checkForbiddenKeys(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkForbiddenKeys(item, `${path}[${index}]`, errors))
    return
  }
  if (!isObject(value)) return
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) add(errors, `raw_text_or_image_retained:${path}.${key}`)
    checkForbiddenKeys(nested, `${path}.${key}`, errors)
  }
}

function checkBoundaries(value, errors) {
  if (!isObject(value)) {
    add(errors, 'boundaries_missing')
    return
  }
  if (value.BLOCK_OCR_ROUTE !== BLOCK_OCR_ROUTE) add(errors, 'BLOCK_OCR_ROUTE_changed')
  if (canonicalHistoricalOcrJson(value.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, 'OCRProvider_changed')
  for (const key of ['activation', 'detectionTouched', 'frozenDomainGoldAccessed', 'heldOutAccessed', 'search', 'historicalSourceJudgment', 'semanticCorrection', 'silentFallback']) {
    if (value[key] !== false) add(errors, `boundary_${key}_changed`)
  }
}

function checkSource(result, errors) {
  const source = result.source
  if (!isObject(source)) {
    add(errors, 'source_missing')
    return
  }
  if (source.corpusId !== 'CHI-KNOW-PO' || source.datasetId !== 'calfa-ai/chiknowpo' || source.datasetRevision !== 'be857420a96e49b009ef0d3b74fbd6d1b28d5c87' || source.partition !== 'train') add(errors, 'source_identity_invalid')
  if (source.materializedTrainParquetSha256Expected !== EXPECTED_TRAIN_PARQUET) add(errors, 'source_train_hash_invalid')
  if (source.innerSplitSha256 !== EXPECTED_INNER_SPLIT) add(errors, 'inner_split_hash_invalid')
  if (!exactArray(source.innerTrainDocumentIds, INNER_TRAIN) || !exactArray(source.innerDevDocumentIds, INNER_DEV)) add(errors, 'source_document_split_invalid')
  if (source.heldOutDownloaded !== false || source.frozenDomainGoldDownloaded !== false || source.rawTextOrImagesRetained !== false) add(errors, 'source_boundary_invalid')
  if (!Array.isArray(source.shards) || source.shards.length !== 2) {
    add(errors, 'source_shards_invalid')
  } else {
    for (const shard of source.shards) {
      if (!isObject(shard) || !EXPECTED_SOURCE_SHARDS[shard.filename] || shard.sha256 !== EXPECTED_SOURCE_SHARDS[shard.filename] || !Number.isInteger(shard.bytes) || shard.bytes < 1) add(errors, `source_shard_invalid:${shard?.filename || 'unknown'}`)
    }
  }
  const model = result.candidate?.model
  if (!isObject(model) || model.modelId !== 'PaddlePaddle/PP-OCRv6_medium_rec_safetensors' || model.modelRevision !== '024cad6a831de75c2c3c26e711ba8c4a82ccd24b' || model.weightsSha256 !== EXPECTED_MODEL_WEIGHTS || model.characterListSha256 !== EXPECTED_MODEL_CHARACTER || model.license !== 'Apache-2.0') add(errors, 'model_identity_or_license_invalid')
  if (result.partition?.innerSplitSha256 !== EXPECTED_INNER_SPLIT || result.partition?.devRecordCount !== 2689 || result.partition?.trainRecordCount !== 448) add(errors, 'partition_evidence_invalid')
  if (result.partition?.heldOutAccessed !== false || result.partition?.frozenDomainGoldAccessed !== false) add(errors, 'partition_external_access_invalid')
}

function expectedOutputDigest(decoder, documents) {
  return historicalOcrContentSha256({
    decoder,
    documents: documents.map(doc => ({
      docId: doc.docId,
      recordCount: doc.recordCount,
      exactMatchRuns: doc.exactMatchRuns,
      totalEditDistance: doc.totalEditDistance,
      totalTargetCharacters: doc.totalTargetCharacters,
      recordDigestSha256: doc.recordDigestSha256,
      confidenceDigestSha256: doc.confidenceDigestSha256,
    })),
  })
}

function checkEvaluation(evaluation, decoder, path, errors) {
  if (!isObject(evaluation) || !isObject(evaluation.metrics) || !Array.isArray(evaluation.documents)) {
    add(errors, `${path}_shape_invalid`)
    return null
  }
  if (!exactArray(evaluation.documents.map(doc => doc?.docId), INNER_DEV)) add(errors, `${path}_document_ids_invalid`)
  const sums = { recordCount: 0, exactMatchRuns: 0, totalEditDistance: 0, totalTargetCharacters: 0, confidencePresentRuns: 0 }
  const allConfidence = []
  for (const docId of INNER_DEV) {
    const doc = evaluation.documents.find(item => item?.docId === docId)
    if (!isObject(doc)) {
      add(errors, `${path}_document_missing:${docId}`)
      continue
    }
    if (doc.recordCount !== DOC_COUNTS[docId] || !Number.isInteger(doc.exactMatchRuns) || doc.exactMatchRuns < 0 || doc.exactMatchRuns > doc.recordCount) add(errors, `${path}_document_counts_invalid:${docId}`)
    for (const key of ['totalEditDistance', 'totalTargetCharacters']) if (!Number.isInteger(doc[key]) || doc[key] < 0) add(errors, `${path}_${key}_invalid:${docId}`)
    if (doc.totalTargetCharacters < 1 || !close(doc.characterErrorRate, doc.totalEditDistance / doc.totalTargetCharacters)) add(errors, `${path}_document_cer_invalid:${docId}`)
    if (!close(doc.exactMatchRate, doc.exactMatchRuns / doc.recordCount)) add(errors, `${path}_document_exact_rate_invalid:${docId}`)
    if (!isHash(doc.recordDigestSha256) || !isHash(doc.confidenceDigestSha256)) add(errors, `${path}_document_digest_invalid:${docId}`)
    if (doc.confidencePresentRuns !== doc.recordCount || !isFiniteNumber(doc.confidenceMean) || !isFiniteNumber(doc.confidenceMin) || !isFiniteNumber(doc.confidenceMax) || doc.confidenceMin < 0 || doc.confidenceMax > 1 || doc.confidenceMin > doc.confidenceMax) add(errors, `${path}_document_confidence_invalid:${docId}`)
    sums.recordCount += doc.recordCount
    sums.exactMatchRuns += doc.exactMatchRuns
    sums.totalEditDistance += doc.totalEditDistance
    sums.totalTargetCharacters += doc.totalTargetCharacters
    sums.confidencePresentRuns += doc.confidencePresentRuns
    allConfidence.push({ count: doc.recordCount, mean: doc.confidenceMean, min: doc.confidenceMin, max: doc.confidenceMax })
  }
  const metrics = evaluation.metrics
  if (metrics.recordCount !== sums.recordCount || metrics.exactMatchRuns !== sums.exactMatchRuns || metrics.totalEditDistance !== sums.totalEditDistance || metrics.totalTargetCharacters !== sums.totalTargetCharacters || metrics.confidencePresentRuns !== sums.confidencePresentRuns) add(errors, `${path}_aggregate_integer_metrics_invalid`)
  if (metrics.recordCount !== 2689 || metrics.totalTargetCharacters < 1 || !close(metrics.exactMatchRate, metrics.exactMatchRuns / metrics.recordCount) || !close(metrics.characterErrorRate, metrics.totalEditDistance / metrics.totalTargetCharacters)) add(errors, `${path}_aggregate_rate_invalid`)
  if (!isFiniteNumber(metrics.confidenceMean) || !isFiniteNumber(metrics.confidenceMin) || !isFiniteNumber(metrics.confidenceMax) || !close(metrics.confidenceMean, allConfidence.reduce((sum, item) => sum + item.count * item.mean, 0) / metrics.recordCount, 1e-8) || metrics.confidenceMin !== Math.min(...allConfidence.map(item => item.min)) || metrics.confidenceMax !== Math.max(...allConfidence.map(item => item.max))) add(errors, `${path}_aggregate_confidence_invalid`)
  if (evaluation.rawTextOrImagesRetained !== false) add(errors, `${path}_raw_data_boundary_invalid`)
  if (!isHash(evaluation.outputSha256) || evaluation.outputSha256 !== expectedOutputDigest(decoder, evaluation.documents)) add(errors, `${path}_output_digest_invalid`)
  return evaluation
}

function expectedComparison(candidate, base) {
  const perDocument = {}
  for (const docId of INNER_DEV) {
    const before = base.documents.find(doc => doc.docId === docId)
    const after = candidate.documents.find(doc => doc.docId === docId)
    perDocument[docId] = {
      cerNonWorse: after.characterErrorRate <= before.characterErrorRate,
      exactNonWorse: after.exactMatchRuns >= before.exactMatchRuns,
      cerStrictGain: after.characterErrorRate < before.characterErrorRate,
      exactStrictGain: after.exactMatchRuns > before.exactMatchRuns,
    }
  }
  const aggregate = {
    cerStrictlyImproved: candidate.metrics.characterErrorRate < base.metrics.characterErrorRate,
    exactNonWorse: candidate.metrics.exactMatchRuns >= base.metrics.exactMatchRuns,
  }
  const allDocumentsNonWorse = Object.values(perDocument).every(item => item.cerNonWorse && item.exactNonWorse)
  const atLeastOneStrictDocumentGain = Object.values(perDocument).some(item => item.cerStrictGain || item.exactStrictGain)
  return {
    aggregate,
    perDocument,
    allDocumentsNonWorse,
    atLeastOneStrictDocumentGain,
    devWorsened: !aggregate.exactNonWorse || candidate.metrics.characterErrorRate > base.metrics.characterErrorRate || !allDocumentsNonWorse,
    passesPromotionCriteria: aggregate.cerStrictlyImproved && aggregate.exactNonWorse && allDocumentsNonWorse && atLeastOneStrictDocumentGain,
  }
}

function checkCheckpoint(checkpoint, base, decoder, path, errors) {
  if (!isObject(checkpoint) || !Number.isInteger(checkpoint.step) || ![8, 16].includes(checkpoint.step) || !isHash(checkpoint.checkpointSha256) || checkpoint.checkpointPathOmitted !== true || checkpoint.checkpointRetention !== 'job_ephemeral') add(errors, `${path}_identity_invalid`)
  for (const key of ['parameterSha256Live', 'parameterSha256LoadedState', 'parameterSha256Reloaded']) if (!isHash(checkpoint[key])) add(errors, `${path}_${key}_invalid`)
  if (checkpoint.weightDigestRoundTripPass !== true || checkpoint.parameterSha256Live !== checkpoint.parameterSha256LoadedState || checkpoint.parameterSha256Live !== checkpoint.parameterSha256Reloaded) add(errors, `${path}_weight_roundtrip_invalid`)
  const live = checkEvaluation(checkpoint.liveEvaluation, decoder, `${path}_live`, errors)
  const reloaded = checkEvaluation(checkpoint.reloadEvaluation, decoder, `${path}_reload`, errors)
  if (!live || !reloaded || checkpoint.outputRoundTripPass !== true || live?.outputSha256 !== reloaded?.outputSha256) add(errors, `${path}_output_roundtrip_invalid`)
  if (checkpoint.decoderRoundTripPass !== true) add(errors, `${path}_decoder_roundtrip_invalid`)
  const expected = live && base ? expectedComparison(live, base) : null
  if (!expected || canonicalHistoricalOcrJson(checkpoint.comparisonToBase) !== canonicalHistoricalOcrJson(expected)) add(errors, `${path}_comparison_invalid`)
  return { checkpoint, live, comparison: expected }
}

function checkStage(stage, base, decoder, index, errors) {
  const expected = STAGES[index]
  const path = `repeat_stage_${index}`
  if (!isObject(stage) || !expected || stage.id !== expected.id || stage.learningRate !== expected.learningRate || stage.maxSteps !== 16 || !exactArray(stage.trainablePrefixes, expected.trainable) || !exactArray(stage.frozenPrefixes, expected.frozen) || stage.gradientClip?.implementation !== 'paddle.nn.ClipGradByGlobalNorm' || stage.gradientClip?.maxNorm !== 1 || stage.optimizerStateReset !== true || !Number.isInteger(stage.trainableParameterCount) || stage.trainableParameterCount !== expected.count) add(errors, `${path}_configuration_invalid`)
  if (!isObject(stage.selectorParameterCounts) || Object.values(stage.selectorParameterCounts).reduce((sum, value) => sum + value, 0) !== expected.count) add(errors, `${path}_selector_counts_invalid`)
  if (!Array.isArray(stage.losses) || !Array.isArray(stage.gradientMaxAbs) || !Array.isArray(stage.gradientGlobalNormBeforeClip) || stage.losses.length !== stage.stepsCompleted || stage.gradientMaxAbs.length !== stage.stepsCompleted || stage.gradientGlobalNormBeforeClip.length !== stage.stepsCompleted || stage.stepsCompleted < 1 || stage.stepsCompleted > 16 || stage.stable !== true) add(errors, `${path}_training_trace_invalid`)
  if (!Array.isArray(stage.checkpoints) || (stage.checkpoints.length !== 1 && stage.checkpoints.length !== 2) || stage.checkpoints.some((checkpoint, checkpointIndex) => checkpoint.step !== [8, 16][checkpointIndex])) add(errors, `${path}_checkpoint_schedule_invalid`)
  const checkpoints = (stage.checkpoints || []).map((checkpoint, checkpointIndex) => checkCheckpoint(checkpoint, base, decoder, `${path}_checkpoint_${checkpointIndex}`, errors))
  if (stage.stopReason === 'dev_worsened_against_base' && !checkpoints.at(-1)?.comparison?.devWorsened) add(errors, `${path}_worsening_stop_invalid`)
  if (stage.stopReason === 'earliest_passing_checkpoint' && !checkpoints.at(-1)?.comparison?.passesPromotionCriteria) add(errors, `${path}_passing_stop_invalid`)
  return { stage, checkpoints }
}

function checkRepeat(repeat, decoder, repeatIndex, errors) {
  const path = `repeat_${repeatIndex}`
  if (!isObject(repeat) || repeat.repeat !== repeatIndex || repeat.seed !== 7 || !isHash(repeat.baseParameterSha256)) add(errors, `${path}_identity_invalid`)
  const base = checkEvaluation(repeat.baseEvaluation, decoder, `${path}_base`, errors)
  if (!Array.isArray(repeat.stages) || repeat.stages.length < 1 || repeat.stages.length > 3) add(errors, `${path}_stage_count_invalid`)
  const stages = (repeat.stages || []).map((stage, index) => checkStage(stage, base, decoder, index, errors))
  if (stages.some(item => item.stage.stopReason === 'dev_worsened_against_base' || item.stage.stopReason === 'earliest_passing_checkpoint') && stages.length !== stages.findIndex(item => item.stage.stopReason === 'dev_worsened_against_base' || item.stage.stopReason === 'earliest_passing_checkpoint') + 1) add(errors, `${path}_post_stop_stage_present`)
  const selected = repeat.selectedCheckpoint
  if (selected !== null && !isObject(selected)) add(errors, `${path}_selected_checkpoint_shape_invalid`)
  if (selected) {
    const match = stages.flatMap(item => item.checkpoints).find(item => item.checkpoint.stageId === selected.stageId && item.checkpoint.step === selected.step)
    if (!match || !match.comparison.passesPromotionCriteria) add(errors, `${path}_selected_checkpoint_invalid`)
  }
  if (repeat.baseRetainedExplicitly !== (selected === null) || repeat.repeatRecipeUsable !== (selected !== null)) add(errors, `${path}_base_retention_flag_invalid`)
  return { repeat, base, stages, selected }
}

export function checkChiKnowPoMediumRecRecipeRun(result) {
  const errors = []
  if (!isObject(result)) return ['run_not_object']
  if (result.schema !== CHI_KNOW_PO_MEDIUM_REC_RECIPE_RUN_SCHEMA) add(errors, 'run_schema_mismatch')
  if (result.status !== 'COMPLETED') add(errors, 'run_not_completed')
  if (result.decision !== 'RECIPE_PROVEN' && result.decision !== 'RECIPE_NOT_PROVEN') add(errors, 'run_decision_invalid')
  checkBoundaries(result.boundaries, errors)
  checkSource(result, errors)
  if (result.runtime?.flavorRequested !== 't4-small' || result.runtime?.device !== 'gpu:0' || result.runtime?.cudaCompiled !== true) add(errors, 'runtime_t4_gpu_evidence_invalid')
  if (!isObject(result.decoder) || result.decoder.class !== 'PaddleX CTCLabelDecode' || result.decoder.blankIndex !== 0 || result.decoder.spaceCharacter !== true || result.decoder.semanticCorrection !== false || result.decoder.characterListSha256 !== EXPECTED_MODEL_CHARACTER) add(errors, 'decoder_contract_invalid')
  if (!isObject(result.recipe) || result.recipe.trainPartition !== 'inner-train' || result.recipe.devPartition !== 'inner-dev' || result.recipe.fullFineTuning !== false || result.recipe.augmentation !== false || result.recipe.semanticCorrection !== false || result.recipe.seed !== 7) add(errors, 'recipe_boundary_invalid')
  if (!isObject(result.recipe) || !Array.isArray(result.recipe.stages) || result.recipe.stages.length !== 3 || result.recipe.stages.some((stage, index) => stage.id !== STAGES[index].id || stage.maxSteps !== 16 || stage.checkpointEverySteps?.join(',') !== '8,16')) add(errors, 'recipe_stage_design_invalid')
  if (!Array.isArray(result.repeats) || result.repeats.length !== 2) add(errors, 'repeat_count_invalid')
  const repeatResults = Array.isArray(result.repeats) ? [1, 2].map(repeatIndex => checkRepeat(result.repeats.find(repeat => repeat?.repeat === repeatIndex), result.decoder, repeatIndex, errors)) : []
  if (!Array.isArray(result.reproducibility?.repeatPayloadSha256) || result.reproducibility.repeatPayloadSha256.length !== 2 || result.reproducibility.repeatPayloadSha256.some(value => !isHash(value))) add(errors, 'repeat_payload_digest_invalid')
  const reproducibilityPass = result.reproducibility?.repeatPayloadSha256?.[0] === result.reproducibility?.repeatPayloadSha256?.[1]
  if (result.reproducibility?.pass !== reproducibilityPass) add(errors, 'reproducibility_flag_invalid')
  const resource = result.resource
  const resourcePass = resource?.telemetryComplete === true && isFiniteNumber(resource.peak_rss_mib) && resource.peak_rss_mib > 0 && isFiniteNumber(resource.gpu_peak_memory_mib) && resource.gpu_peak_memory_mib > 0 && isFiniteNumber(resource.wall_time_ms) && resource.wall_time_ms > 0 && isFiniteNumber(resource.cpu_seconds) && resource.cpu_seconds >= 0 && resource.swap?.before?.status === 'OBSERVED' && resource.swap?.after?.status === 'OBSERVED' && isFiniteNumber(resource.swap.deltaMiB)
  if (!resourcePass) add(errors, 'resource_telemetry_gate_not_passed')
  const selected = repeatResults.length === 2 ? repeatResults.map(item => item?.selected) : []
  const selectedSame = selected.length === 2 && selected.every(item => item !== null) && selected[0]?.stageId === selected[1]?.stageId && selected[0]?.step === selected[1]?.step
  const recipeProven = reproducibilityPass && selectedSame && resourcePass
  if (result.decision !== (recipeProven ? 'RECIPE_PROVEN' : 'RECIPE_NOT_PROVEN')) add(errors, 'decision_does_not_match_independent_gates')
  if (result.baseRetainedExplicitly !== !recipeProven || result.promotion?.baseRetainedExplicitly !== !recipeProven) add(errors, 'base_retention_not_explicit')
  if (result.promotion?.recipeProven !== recipeProven || result.promotion?.nextFineTuningGate !== (recipeProven ? 'READY_FOR_NEXT_FINE_TUNING_GATE_ONLY' : 'NOT_OPEN') || result.promotion?.automaticActivation !== false || result.promotion?.activation !== 'SEPARATE_DECISION_REQUIRED') add(errors, 'promotion_boundary_invalid')
  checkForbiddenKeys(result, 'run', errors)
  return [...new Set(errors)].sort()
}

export function validateChiKnowPoMediumRecRecipeRun(result) {
  const errors = checkChiKnowPoMediumRecRecipeRun(result)
  return {
    pass: errors.length === 0,
    errors,
    decision: result?.decision || 'RECIPE_NOT_PROVEN',
    baseRetainedExplicitly: result?.baseRetainedExplicitly === true,
  }
}
