import {
  BLOCK_OCR_ROUTE,
  OCRProvider,
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from './historicalOcrTeam.js'

export const CHI_KNOW_PO_MEDIUM_REC_INNER_SPLIT_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-inner-split-v1'
export const CHI_KNOW_PO_MEDIUM_REC_RECIPE_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-minimal-recipe-v1'
export const CHI_KNOW_PO_MEDIUM_REC_HF_JOB_SCHEMA = 'chi-know-po-ppocrv6-medium-rec-hf-recipe-search-design-v1'

const HASH = /^[a-f0-9]{64}$/i
const EXPECTED_TRAIN_PARQUET_SHA256 = '97f6fcc531cb79c4e0f2f63a042f52317b9299ed2f13785663c8523c7c0bc25b'
const EXPECTED_SOURCE_DOCUMENT_IDS = Object.freeze(['A-1', 'A-3', 'A-4', 'S-2', 'S-3', 'S-4', 'S-6', 'S-7', 'T-1', 'T-3'])
const EXPECTED_INNER_TRAIN_DOCUMENT_IDS = Object.freeze(['A-1', 'A-4', 'S-2', 'S-4', 'S-6', 'S-7', 'T-1'])
const EXPECTED_INNER_DEV_DOCUMENT_IDS = Object.freeze(['A-3', 'S-3', 'T-3'])
const EXPECTED_RECORD_COUNTS = Object.freeze({
  'A-1': 1654,
  'A-3': 590,
  'A-4': 492,
  'S-2': 302,
  'S-3': 1267,
  'S-4': 2532,
  'S-6': 356,
  'S-7': 1766,
  'T-1': 1053,
  'T-3': 832,
})
const EXPECTED_TRANSCRIPTION_CHARACTERS = Object.freeze({
  'A-1': 15650,
  'A-3': 4818,
  'A-4': 3592,
  'S-2': 3786,
  'S-3': 11572,
  'S-4': 8568,
  'S-6': 3524,
  'S-7': 13810,
  'T-1': 7285,
  'T-3': 6533,
})
const FORBIDDEN_KEYS = new Set(['transcription', 'predictionText', 'targetText', 'imageBytes', 'imageData'])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isHash = value => typeof value === 'string' && HASH.test(value)
const add = (errors, code) => { if (!errors.includes(code)) errors.push(code) }
const exactArray = (value, expected) => Array.isArray(value) && canonicalHistoricalOcrJson(value) === canonicalHistoricalOcrJson(expected)
const pathIsTrainOnly = value => typeof value === 'string' && value.includes('/materialized/train/') && !/heldout|untouched-held-out|frozen[-_]?gold/i.test(value)
const pathIsInnerSplit = value => typeof value === 'string' && value.endsWith('/inner-dev-split.json') && !/heldout|untouched-held-out|frozen[-_]?gold/i.test(value)

function checkForbiddenKeys(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkForbiddenKeys(item, `${path}[${index}]`, errors))
    return
  }
  if (!isObject(value)) return
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) add(errors, `raw_text_or_image_retained:${path}.${key}`)
    checkForbiddenKeys(nested, `${path}.${key}`, errors)
  }
}

function checkRoute(boundaries, path, errors) {
  if (!isObject(boundaries)) {
    add(errors, `${path}_missing`)
    return
  }
  if (boundaries.BLOCK_OCR_ROUTE !== BLOCK_OCR_ROUTE) add(errors, `${path}_BLOCK_OCR_ROUTE_changed`)
  if (canonicalHistoricalOcrJson(boundaries.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, `${path}_OCRProvider_changed`)
  for (const field of ['activation', 'detectionTouched', 'frozenDomainGoldAccessed', 'heldOutAccessed', 'historicalSourceJudgment', 'search', 'semanticCorrection', 'silentFallback']) {
    if (boundaries[field] !== false) add(errors, `${path}_${field}_changed`)
  }
}

function checkPartitionStats(partition, partitionName, expectedDocumentIds, expectedRecordCount, errors) {
  if (!isObject(partition)) {
    add(errors, `${partitionName}_stats_missing`)
    return
  }
  if (partition.recordCount !== expectedRecordCount) add(errors, `${partitionName}_record_count_invalid`)
  if (!Number.isInteger(partition.transcriptionCharacters) || partition.transcriptionCharacters < 1) add(errors, `${partitionName}_character_count_invalid`)
  if (!isHash(partition.recordMembershipSha256)) add(errors, `${partitionName}_membership_hash_invalid`)
  const documents = partition.documents
  if (!isObject(documents) || !exactArray(Object.keys(documents).sort(), [...expectedDocumentIds].sort())) add(errors, `${partitionName}_document_stats_invalid`)
  for (const documentId of expectedDocumentIds) {
    const stats = documents?.[documentId]
    if (!isObject(stats) || stats.recordCount !== EXPECTED_RECORD_COUNTS[documentId] || stats.transcriptionCharacters !== EXPECTED_TRANSCRIPTION_CHARACTERS[documentId] || !isHash(stats.recordMembershipSha256)) add(errors, `${partitionName}_document_stats_mismatch:${documentId}`)
  }
}

export function checkChiKnowPoMediumRecInnerSplit(split) {
  const errors = []
  if (!isObject(split)) return ['inner_split_not_object']
  if (split.schema !== CHI_KNOW_PO_MEDIUM_REC_INNER_SPLIT_SCHEMA) add(errors, 'inner_split_schema_mismatch')
  if (split.status !== 'MATERIALIZED_TRAIN_ONLY') add(errors, 'inner_split_status_invalid')
  if (!isObject(split.corpus)) add(errors, 'inner_split_corpus_missing')
  if (split.corpus?.corpusId !== 'CHI-KNOW-PO' || split.corpus?.datasetId !== 'calfa-ai/chiknowpo' || split.corpus?.sourceRevision !== 'be857420a96e49b009ef0d3b74fbd6d1b28d5c87' || split.corpus?.sourcePartition !== 'train') add(errors, 'inner_split_source_identity_invalid')
  if (split.corpus?.trainParquetSha256 !== EXPECTED_TRAIN_PARQUET_SHA256) add(errors, 'inner_split_train_hash_invalid')
  if (!pathIsTrainOnly(split.corpus?.trainParquetPath) || !pathIsTrainOnly(split.corpus?.sourceRecordManifestPath)) add(errors, 'inner_split_train_path_invalid')
  if (split.corpus?.heldOutPathArgumentProvided !== false || split.corpus?.frozenGoldPathArgumentProvided !== false || split.corpus?.sourceUpload !== false) add(errors, 'inner_split_external_data_boundary_invalid')
  if (!exactArray(split.corpus?.sourceDocumentIds, EXPECTED_SOURCE_DOCUMENT_IDS) || split.corpus?.sourceDocumentCount !== 10) add(errors, 'inner_split_source_documents_invalid')

  const innerTrain = split.split?.innerTrainDocumentIds
  const innerDev = split.split?.innerDevDocumentIds
  if (split.split?.unit !== 'document' || split.split?.method !== 'stratified_prefix_nearest_20pct_v1' || split.split?.sourcePartition !== 'train') add(errors, 'inner_split_policy_invalid')
  if (!exactArray(innerTrain, EXPECTED_INNER_TRAIN_DOCUMENT_IDS) || !exactArray(innerDev, EXPECTED_INNER_DEV_DOCUMENT_IDS)) add(errors, 'inner_split_partition_documents_invalid')
  if (new Set([...(innerTrain || []), ...(innerDev || [])]).size !== 10 || (innerTrain || []).some(id => (innerDev || []).includes(id))) add(errors, 'inner_split_document_overlap')
  if (split.split?.documentDisjoint !== true || split.split?.allSourceDocumentsCovered !== true) add(errors, 'inner_split_disjointness_invalid')
  checkPartitionStats(split.split?.innerTrain, 'inner_train', EXPECTED_INNER_TRAIN_DOCUMENT_IDS, 8155, errors)
  checkPartitionStats(split.split?.innerDev, 'inner_dev', EXPECTED_INNER_DEV_DOCUMENT_IDS, 2689, errors)
  if (Math.abs(split.split?.devRecordFraction - (2689 / 10844)) > 1e-12) add(errors, 'inner_dev_fraction_invalid')
  if (split.split?.rawTextRetained !== false || split.split?.rawImagesRetained !== false) add(errors, 'inner_split_raw_data_boundary_invalid')
  checkRoute(split.boundaries, 'inner_split_route', errors)
  checkForbiddenKeys(split, 'inner_split', errors)
  if (!isHash(split.contentSha256) || split.contentSha256 !== historicalOcrContentSha256({ ...split, contentSha256: null })) add(errors, 'inner_split_content_sha256_mismatch')
  return [...new Set(errors)].sort()
}

function checkStages(stages, errors) {
  if (!Array.isArray(stages) || stages.length !== 3) {
    add(errors, 'recipe_stage_count_invalid')
    return
  }
  const expected = [
    { id: 's0-head-only', learningRate: 0.00001, trainablePrefixes: ['head.head.'], requires: 'base_reference' },
    { id: 's1-head-encoder', learningRate: 0.000003, trainablePrefixes: ['head.head.', 'head.encoder.'], requires: 's0_checkpoint_dev_non_worse' },
    { id: 's2-last-backbone-block', learningRate: 0.000001, trainablePrefixes: ['head.head.', 'head.encoder.', 'model.backbone.encoder.blocks.3.'], requires: 's1_checkpoint_dev_non_worse' },
  ]
  for (const [index, stage] of stages.entries()) {
    const expectedStage = expected[index]
    if (!isObject(stage) || stage.id !== expectedStage.id || stage.learningRate !== expectedStage.learningRate || stage.maxSteps !== 16 || stage.checkpointEverySteps !== 8 || stage.requires !== expectedStage.requires) add(errors, `recipe_stage_invalid:${index}`)
    if (!exactArray(stage?.trainablePrefixes, expectedStage.trainablePrefixes) || stage?.freezeUnmatched !== true || stage?.optimizerStatePolicy !== 'reset_on_stage_transition') add(errors, `recipe_stage_selector_invalid:${index}`)
    if (stage?.learningRate > 0.00001 || stage?.learningRate <= 0) add(errors, `recipe_stage_learning_rate_invalid:${index}`)
    if (!Array.isArray(stage?.frozenPrefixes) || stage.frozenPrefixes.length < 1) add(errors, `recipe_stage_frozen_prefixes_missing:${index}`)
  }
}

export function checkChiKnowPoMediumRecRecipe(recipe) {
  const errors = []
  if (!isObject(recipe)) return ['recipe_not_object']
  if (recipe.schema !== CHI_KNOW_PO_MEDIUM_REC_RECIPE_SCHEMA) add(errors, 'recipe_schema_mismatch')
  if (recipe.status !== 'DESIGN_ONLY') add(errors, 'recipe_status_invalid')
  if (recipe.candidate?.workerId !== 'pp-ocrv6-medium-rec' || recipe.candidate?.component !== 'rec') add(errors, 'recipe_candidate_invalid')
  if (recipe.candidate?.model?.modelId !== 'PaddlePaddle/PP-OCRv6_medium_rec_safetensors' || recipe.candidate?.model?.revision !== '024cad6a831de75c2c3c26e711ba8c4a82ccd24b' || recipe.candidate?.model?.weightsSha256 !== '5f43c16f2a684b1d2284662178bdb604febd3d6bfdb5ca73828d08d0f7c0c3e9') add(errors, 'recipe_model_identity_invalid')
  if (recipe.corpus?.corpusId !== 'CHI-KNOW-PO' || recipe.corpus?.sourcePartition !== 'train' || recipe.corpus?.trainParquetSha256 !== EXPECTED_TRAIN_PARQUET_SHA256) add(errors, 'recipe_corpus_invalid')
  if (!exactArray(recipe.corpus?.sourceDocumentIds, EXPECTED_SOURCE_DOCUMENT_IDS) || !exactArray(recipe.corpus?.innerTrainDocumentIds, EXPECTED_INNER_TRAIN_DOCUMENT_IDS) || !exactArray(recipe.corpus?.innerDevDocumentIds, EXPECTED_INNER_DEV_DOCUMENT_IDS)) add(errors, 'recipe_document_split_invalid')
  if (!pathIsInnerSplit(recipe.corpus?.innerSplitPath) || recipe.corpus?.heldOutPathArgumentProvided !== false || recipe.corpus?.frozenGoldPathArgumentProvided !== false) add(errors, 'recipe_train_only_path_invalid')
  if (recipe.preflight?.requiredFunctionalGate !== 'PASSED' || recipe.preflight?.observedFunctionalGate !== 'PASSED' || recipe.preflight?.localTrainingExecuted !== false || recipe.preflight?.heldOutAccessed !== false || recipe.preflight?.frozenDomainGoldAccessed !== false) add(errors, 'recipe_preflight_gate_invalid')

  const design = recipe.recipe
  if (design?.trainingPartition !== 'inner-train' || design?.devPartition !== 'inner-dev' || design?.fullFineTuning !== false || design?.augmentation !== false || design?.semanticCorrection !== false || design?.normalization !== 'NFC_only') add(errors, 'recipe_data_boundary_invalid')
  if (design?.trainSelection?.maxRecordsPerDocument !== 64 || design?.trainSelection?.selectedRecordCount !== 448 || design?.trainSelection?.selectionMethod !== 'first_encodable_records_per_document_v1') add(errors, 'recipe_train_selection_invalid')
  if (design?.devSelection?.allRecords !== true || design?.devSelection?.labelsUsedFor !== 'metric_only_checkpoint_selection_and_early_stop' || design?.devSelection?.externalData !== false) add(errors, 'recipe_dev_selection_invalid')
  if (design?.optimizer?.name !== 'Adam' || design?.optimizer?.weightDecay !== 0 || design?.optimizer?.schedule !== 'fixed_per_stage' || design?.optimizer?.gradientClipping?.type !== 'global_norm' || design?.optimizer?.gradientClipping?.maxNorm !== 1 || design?.optimizer?.reinitializeOptimizerOnUnfreeze !== true) add(errors, 'recipe_optimizer_invalid')
  checkStages(design?.stages, errors)
  if (design?.checkpointPolicy?.evaluateEveryCheckpoint !== true || design?.checkpointPolicy?.selectEarliestPassingCheckpoint !== true || design?.checkpointPolicy?.noIntermediateDevWorsening !== true || design?.checkpointPolicy?.baseRetainedExplicitlyOnFailure !== true || design?.checkpointPolicy?.silentFallback !== false) add(errors, 'recipe_checkpoint_policy_invalid')
  const criteria = design?.checkpointPolicy?.criteria
  if (criteria?.cerStrictlyImproved !== true || criteria?.exactNonWorsening !== true || criteria?.perDocumentCerNonWorsening !== true || criteria?.perDocumentExactNonWorsening !== true || criteria?.atLeastOneStrictDocumentGain !== true || criteria?.externalHeldOutOrFrozenGold !== false) add(errors, 'recipe_selection_criteria_invalid')
  if (design?.repeatPolicy?.repeats !== 2 || design?.repeatPolicy?.seed !== 7 || design?.repeatPolicy?.checkpointAndDevHashesMustMatch !== true) add(errors, 'recipe_repeat_policy_invalid')
  if (recipe.execution?.localTraining !== 'STOPPED' || recipe.execution?.submitted !== false || recipe.execution?.target !== 'HF_DISPOSABLE_ONLY') add(errors, 'recipe_execution_boundary_invalid')
  if (recipe.promotion?.current !== 'NOT_OPEN' || recipe.promotion?.stableRecipeDecision !== 'NOT_PROVEN' || recipe.promotion?.nextFineTuningGate !== 'NOT_OPEN' || recipe.promotion?.automaticPromotion !== false || recipe.promotion?.activation !== 'SEPARATE_DECISION_REQUIRED') add(errors, 'recipe_promotion_boundary_invalid')
  checkRoute(recipe.boundaries, 'recipe_route', errors)
  checkForbiddenKeys(recipe, 'recipe', errors)
  if (!isHash(recipe.contentSha256) || recipe.contentSha256 !== historicalOcrContentSha256({ ...recipe, contentSha256: null })) add(errors, 'recipe_content_sha256_mismatch')
  return [...new Set(errors)].sort()
}

export function checkChiKnowPoMediumRecHFJobSpec(spec) {
  const errors = []
  if (!isObject(spec)) return ['hf_job_spec_not_object']
  if (spec.schema !== CHI_KNOW_PO_MEDIUM_REC_HF_JOB_SCHEMA) add(errors, 'hf_job_schema_mismatch')
  if (spec.status !== 'DESIGN_ONLY' || spec.submitted !== false || spec.jobId !== null) add(errors, 'hf_job_submission_state_invalid')
  if (spec.route?.BLOCK_OCR_ROUTE !== true || spec.route?.OCRProvider?.enabled !== false || spec.activation !== false) add(errors, 'hf_job_route_or_activation_invalid')
  if (spec.source?.datasetId !== 'calfa-ai/chiknowpo' || spec.source?.revision !== 'be857420a96e49b009ef0d3b74fbd6d1b28d5c87' || spec.source?.split !== 'train' || spec.source?.heldOutInput !== false || spec.source?.frozenGoldInput !== false || spec.source?.sourceUpload !== false) add(errors, 'hf_job_source_boundary_invalid')
  if (!exactArray(spec.source?.innerTrainDocumentIds, EXPECTED_INNER_TRAIN_DOCUMENT_IDS) || !exactArray(spec.source?.innerDevDocumentIds, EXPECTED_INNER_DEV_DOCUMENT_IDS)) add(errors, 'hf_job_document_split_invalid')
  if (spec.jobSubmission?.api !== "hf_jobs('uv')" || spec.jobSubmission?.scriptTransport !== 'inline_bundle_or_reviewed_url' || spec.jobSubmission?.localFilesystemPathArgument !== false || spec.jobSubmission?.flavor !== 't4-small' || spec.jobSubmission?.timeout !== '2h' || spec.jobSubmission?.scheduled !== false || spec.jobSubmission?.retryPolicy !== 'none_until_operator_review') add(errors, 'hf_job_submission_contract_invalid')
  if (spec.jobSubmission?.publicResultPush !== false || spec.persistence?.visibility !== 'private_operator_selected_repo' || spec.persistence?.rawTextOrImages !== false || spec.persistence?.hfTokenBinding !== 'encrypted_secret_only_when_authorized') add(errors, 'hf_job_persistence_invalid')
  if (spec.workload?.fullFineTuning !== false || spec.workload?.heldOutPathArgument !== false || spec.workload?.frozenGoldPathArgument !== false || spec.workload?.detectionExtension !== 'DEFERRED' || spec.workload?.activation !== false) add(errors, 'hf_job_workload_boundary_invalid')
  if (spec.execution?.python !== '3.11' || spec.execution?.deterministicSeed !== 7 || spec.execution?.repeats !== 2 || spec.execution?.missingTelemetry !== 'UNKNOWN_OR_BLOCKED') add(errors, 'hf_job_execution_contract_invalid')
  if (!Array.isArray(spec.execution?.requiredTelemetry) || !spec.execution.requiredTelemetry.includes('peak_rss_mib') || !spec.execution.requiredTelemetry.includes('gpu_peak_memory_mib') || !spec.execution.requiredTelemetry.includes('wall_time_ms') || !spec.execution.requiredTelemetry.includes('deterministic_output_sha256')) add(errors, 'hf_job_telemetry_contract_invalid')
  if (spec.promotion?.current !== 'NOT_OPEN' || spec.promotion?.onStableProof !== 'READY_FOR_NEXT_FINE_TUNING_GATE_ONLY' || spec.promotion?.automaticPromotion !== false) add(errors, 'hf_job_promotion_invalid')
  if (spec.prohibitions?.fullFineTuningBeforeCauseConfirmation !== 'FORBIDDEN' || spec.prohibitions?.search !== false || spec.prohibitions?.historicalSourceJudgment !== false || spec.prohibitions?.semanticCorrection !== false || spec.prohibitions?.silentFallback !== false) add(errors, 'hf_job_prohibitions_invalid')
  checkForbiddenKeys(spec, 'hf_job', errors)
  if (!isHash(spec.contentSha256) || spec.contentSha256 !== historicalOcrContentSha256({ ...spec, contentSha256: null })) add(errors, 'hf_job_content_sha256_mismatch')
  return [...new Set(errors)].sort()
}

export function validateChiKnowPoMediumRecRecipeArtifacts({ split, recipe, hfJobSpec }) {
  const errors = [
    ...checkChiKnowPoMediumRecInnerSplit(split),
    ...checkChiKnowPoMediumRecRecipe(recipe),
    ...checkChiKnowPoMediumRecHFJobSpec(hfJobSpec),
  ]
  return { pass: errors.length === 0, errors: [...new Set(errors)].sort() }
}
