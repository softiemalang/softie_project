import {
  BLOCK_OCR_ROUTE,
  CHI_KNOW_PO_CORPUS_ID,
  OCRProvider,
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from './historicalOcrTeam.js'

export const CHI_KNOW_PO_SPECIALIZATION_SCHEMA = 'chi-know-po-historical-recognition-specialization-v1'
export const CHI_KNOW_PO_DOCUMENT_SPLIT_SCHEMA = 'chi-know-po-document-split-plan-v1'
export const CHI_KNOW_PO_SPLITS = Object.freeze(['train', 'untouched-held-out'])

const HASH = /^[a-f0-9]{64}$/i
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/
const clone = value => value === undefined ? undefined : structuredClone(value)
const sortedUnique = values => [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)))
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isId = value => typeof value === 'string' && ID.test(value)
const isHash = value => typeof value === 'string' && HASH.test(value)

function withContentSha256(value) {
  const copy = clone(value)
  delete copy.contentSha256
  return { ...copy, contentSha256: historicalOcrContentSha256(copy) }
}

function normalizeIds(values, path) {
  if (!Array.isArray(values)) throw new Error(`${path}_must_be_array`)
  values.forEach((value, index) => {
    if (!isId(value)) throw new Error(`${path}[${index}]_invalid`)
  })
  return sortedUnique(values)
}

function normalizeHashes(values, path) {
  if (!Array.isArray(values)) throw new Error(`${path}_must_be_array`)
  values.forEach((value, index) => {
    if (!isHash(value)) throw new Error(`${path}[${index}]_invalid`)
  })
  return sortedUnique(values)
}

function normalizeDocument(document, index) {
  if (!isObject(document)) throw new Error(`documents[${index}]_not_object`)
  if (!isId(document.documentId)) throw new Error(`documents[${index}].documentId_invalid`)
  if (document.documentFingerprint !== null && document.documentFingerprint !== undefined && !isHash(document.documentFingerprint)) {
    throw new Error(`documents[${index}].documentFingerprint_invalid`)
  }
  if (document.duplicateFamilyId !== null && document.duplicateFamilyId !== undefined && !isId(document.duplicateFamilyId)) {
    throw new Error(`documents[${index}].duplicateFamilyId_invalid`)
  }
  return {
    documentId: document.documentId,
    documentFingerprint: document.documentFingerprint ?? null,
    duplicateFamilyId: document.duplicateFamilyId ?? null,
    sourceObjectHashes: normalizeHashes(document.sourceObjectHashes || [], `documents[${index}].sourceObjectHashes`),
    memberRecordIds: normalizeIds(document.memberRecordIds || [], `documents[${index}].memberRecordIds`),
  }
}

function partitionSpec(split, documentIds) {
  const isHeldOut = split === 'untouched-held-out'
  return {
    split,
    documentIds: sortedUnique(documentIds),
    unit: 'document',
    eligibleForTraining: !isHeldOut,
    readOnly: isHeldOut,
    untouched: isHeldOut,
    useBoundary: {
      training: !isHeldOut,
      augmentation: !isHeldOut,
      normalizationFit: !isHeldOut,
      vocabularyFit: !isHeldOut,
      thresholdCalibration: !isHeldOut,
      hyperparameterTuning: !isHeldOut,
      checkpointSelection: !isHeldOut,
      earlyStopping: !isHeldOut,
      manualCorrection: !isHeldOut,
      feedbackToTraining: !isHeldOut,
    },
  }
}

export function buildChiKnowPoSpecializationPlan({
  source = {},
  documents = [],
  trainDocumentIds = [],
  heldOutDocumentIds = [],
} = {}) {
  if (!Array.isArray(documents)) throw new Error('documents_must_be_array')
  const normalizedDocuments = documents.map(normalizeDocument)
  const trainIds = normalizeIds(trainDocumentIds, 'trainDocumentIds')
  const heldOutIds = normalizeIds(heldOutDocumentIds, 'heldOutDocumentIds')
  const catalogSupplied = normalizedDocuments.length > 0
  const splitMaterialized = trainIds.length > 0 || heldOutIds.length > 0
  const bytesAvailable = source?.bytesAvailable === true
  const manifestSha256 = source?.manifestSha256 ?? null
  if (manifestSha256 !== null && !isHash(manifestSha256)) throw new Error('source.manifestSha256_invalid')

  return withContentSha256({
    schema: CHI_KNOW_PO_SPECIALIZATION_SCHEMA,
    splitSchema: CHI_KNOW_PO_DOCUMENT_SPLIT_SCHEMA,
    status: catalogSupplied ? 'DRAFT_WITH_DECLARED_DOCUMENT_GROUPS' : 'DESIGN_ONLY',
    corpus: {
      corpusId: CHI_KNOW_PO_CORPUS_ID,
      unit: 'document',
      bytesAvailable,
      manifestSupplied: manifestSha256 !== null,
      manifestPath: source?.manifestPath ?? null,
      manifestSha256,
      documentCatalogSupplied: catalogSupplied,
      splitMaterialized,
      reason: catalogSupplied
        ? null
        : 'no CHI-KNOW-PO corpus bytes or manifest supplied in the current local scope; no synthetic substitute',
    },
    splitPolicy: {
      method: 'explicit_document_group_manifest_v1',
      assignment: 'manifest_only',
      unit: 'document',
      groupKey: 'documentId',
      ordering: 'lexicographic_document_id',
      randomAssignment: false,
      pagesLinesCropsStayTogether: true,
      splitBeforeDecodeOrAugment: true,
      duplicateDetection: {
        exactOnly: true,
        requiredCrossPartitionDisjointness: ['documentId', 'documentFingerprint', 'duplicateFamilyId', 'sourceObjectHashes', 'memberRecordIds'],
        fuzzyOrSemanticSimilarity: 'not_used',
      },
    },
    documentCatalog: normalizedDocuments,
    partitions: {
      train: partitionSpec('train', trainIds),
      'untouched-held-out': partitionSpec('untouched-held-out', heldOutIds),
    },
    leakageControls: {
      noPageOrLineRandomSplit: true,
      noCrossPartitionDocumentId: true,
      noCrossPartitionDocumentFingerprint: true,
      noCrossPartitionDuplicateFamily: true,
      noCrossPartitionSourceObjectHash: true,
      noCrossPartitionMemberRecordId: true,
      heldOutReadOnlyMount: true,
      heldOutNotVisibleToTrainingProcess: true,
      heldOutExcludedFromPreprocessingFit: true,
      heldOutExcludedFromModelSelection: true,
      heldOutEvaluationAfterCheckpointFreeze: true,
    },
    recognitionBoundary: {
      task: 'historical_recognition_only',
      normalization: 'NFC_only_preserve_glyphs_and_whitespace_policy',
      semanticCorrection: false,
      historicalSourceJudgment: false,
      search: false,
      silentFallback: false,
      labelsMayEnterTrainOnly: true,
      semanticFields: 'not_used',
    },
    executionOrder: [
      'verify_local_manifest_and_data_boundary',
      'resolve_declared_document_identity_and_duplicate_families',
      'materialize_explicit_document_split',
      'run_split_validator_before_any_decode_or_augment',
      'mount_train_read_write_and_untouched_held_out_read_only',
      'fit_train_only_preprocessing_and_recognition_checkpoint',
      'freeze_checkpoint_and_record_hash',
      'evaluate_untouched_held_out_without_feedback',
      'independent_gate_review',
    ],
    fineTuningGate: {
      status: 'NOT_RUN',
      executed: false,
      checkpoint: null,
      requires: [
        'CHI-KNOW-PO_manifest_and_license_data_boundary_verified',
        'document_split_validator_pass',
        'train_only_pipeline_audit_pass',
        'local_M1_runtime_and_resource_gate_pass',
        'deterministic_repeat_gate_pass',
        'frozen_checkpoint_before_untouched_held_out_evaluation',
        'independent_untouched_held_out_accuracy_review',
      ],
      failurePolicy: 'preserve_UNKNOWN_or_BLOCKED; no_silent_fallback',
    },
    activationGate: {
      status: 'BLOCKED',
      enabled: false,
      active: false,
      decision: 'separate_activation_decision_required',
      automaticPromotion: false,
      requiresExplicitOperatorDecision: true,
    },
    routeBoundary: {
      BLOCK_OCR_ROUTE,
      OCRProvider: clone(OCRProvider),
      fallbackPolicy: 'none',
    },
    noSyntheticData: true,
  })
}

function add(errors, code) {
  if (!errors.includes(code)) errors.push(code)
}

function overlapValues(left, right) {
  const rightSet = new Set(right)
  return left.filter(value => rightSet.has(value))
}

function catalogById(documents) {
  return new Map(documents.map(document => [document.documentId, document]))
}

function validateDocuments(plan, errors) {
  const documents = plan.documentCatalog
  if (!Array.isArray(documents)) {
    add(errors, 'document_catalog_not_array')
    return
  }
  const ids = new Set()
  documents.forEach((document, index) => {
    try {
      const normalized = normalizeDocument(document, index)
      if (ids.has(normalized.documentId)) add(errors, `duplicate_document_id:${normalized.documentId}`)
      ids.add(normalized.documentId)
    } catch (error) {
      add(errors, error.message)
    }
  })
}

export function checkChiKnowPoSpecializationPlan(plan) {
  const errors = []
  if (!isObject(plan)) return ['plan_not_object']
  if (plan.schema !== CHI_KNOW_PO_SPECIALIZATION_SCHEMA) add(errors, 'schema_mismatch')
  if (plan.splitSchema !== CHI_KNOW_PO_DOCUMENT_SPLIT_SCHEMA) add(errors, 'split_schema_mismatch')
  if (!['DESIGN_ONLY', 'DRAFT_WITH_DECLARED_DOCUMENT_GROUPS'].includes(plan.status)) add(errors, 'status_invalid')
  if (plan.corpus?.corpusId !== CHI_KNOW_PO_CORPUS_ID) add(errors, 'corpus_id_mismatch')
  if (plan.corpus?.unit !== 'document') add(errors, 'corpus_unit_invalid')
  if (plan.corpus?.bytesAvailable === true && !isHash(plan.corpus?.manifestSha256)) add(errors, 'available_corpus_manifest_missing')
  if (plan.splitPolicy?.method !== 'explicit_document_group_manifest_v1') add(errors, 'split_method_invalid')
  if (plan.splitPolicy?.assignment !== 'manifest_only') add(errors, 'split_assignment_invalid')
  if (plan.splitPolicy?.unit !== 'document' || plan.splitPolicy?.groupKey !== 'documentId') add(errors, 'document_group_key_invalid')
  if (plan.splitPolicy?.randomAssignment !== false) add(errors, 'random_assignment_enabled')
  if (plan.splitPolicy?.pagesLinesCropsStayTogether !== true) add(errors, 'derived_records_not_grouped')
  if (plan.splitPolicy?.splitBeforeDecodeOrAugment !== true) add(errors, 'split_after_decode_or_augment')
  if (plan.splitPolicy?.duplicateDetection?.fuzzyOrSemanticSimilarity !== 'not_used') add(errors, 'fuzzy_or_semantic_leakage_check_enabled')
  if (plan.splitPolicy?.duplicateDetection?.exactOnly !== true) add(errors, 'exact_duplicate_boundary_changed')
  if (plan.leakageControls?.noPageOrLineRandomSplit !== true) add(errors, 'page_or_line_random_split_allowed')
  for (const key of [
    'noCrossPartitionDocumentId',
    'noCrossPartitionDocumentFingerprint',
    'noCrossPartitionDuplicateFamily',
    'noCrossPartitionSourceObjectHash',
    'noCrossPartitionMemberRecordId',
    'heldOutReadOnlyMount',
    'heldOutNotVisibleToTrainingProcess',
    'heldOutExcludedFromPreprocessingFit',
    'heldOutExcludedFromModelSelection',
    'heldOutEvaluationAfterCheckpointFreeze',
  ]) if (plan.leakageControls?.[key] !== true) add(errors, `leakage_control_disabled:${key}`)
  if (plan.recognitionBoundary?.semanticCorrection !== false) add(errors, 'semantic_correction_enabled')
  if (plan.recognitionBoundary?.historicalSourceJudgment !== false) add(errors, 'historical_source_judgment_enabled')
  if (plan.recognitionBoundary?.search !== false) add(errors, 'search_enabled')
  if (plan.recognitionBoundary?.silentFallback !== false) add(errors, 'silent_fallback_enabled')
  if (plan.activationGate?.status !== 'BLOCKED' || plan.activationGate?.enabled !== false || plan.activationGate?.active !== false) add(errors, 'activation_gate_open')
  if (plan.activationGate?.automaticPromotion !== false || plan.activationGate?.requiresExplicitOperatorDecision !== true) add(errors, 'activation_policy_invalid')
  if (plan.fineTuningGate?.status !== 'NOT_RUN' || plan.fineTuningGate?.executed !== false) add(errors, 'fine_tuning_executed_or_gate_open')
  if (plan.routeBoundary?.BLOCK_OCR_ROUTE !== true) add(errors, 'BLOCK_OCR_ROUTE_changed')
  if (canonicalHistoricalOcrJson(plan.routeBoundary?.OCRProvider) !== canonicalHistoricalOcrJson(OCRProvider)) add(errors, 'OCRProvider_changed')
  if (plan.routeBoundary?.fallbackPolicy !== 'none') add(errors, 'fallback_policy_changed')
  if (plan.noSyntheticData !== true) add(errors, 'synthetic_data_boundary_changed')
  if (plan.contentSha256 !== historicalOcrContentSha256({ ...plan, contentSha256: undefined })) add(errors, 'content_sha256_mismatch')

  validateDocuments(plan, errors)
  const trainIds = plan.partitions?.train?.documentIds
  const heldOutIds = plan.partitions?.['untouched-held-out']?.documentIds
  if (!Array.isArray(trainIds)) add(errors, 'train_document_ids_missing')
  if (!Array.isArray(heldOutIds)) add(errors, 'held_out_document_ids_missing')
  if (Array.isArray(trainIds) && Array.isArray(heldOutIds)) {
    trainIds.forEach((documentId, index) => { if (!isId(documentId)) add(errors, `train_document_id_invalid:${index}`) })
    heldOutIds.forEach((documentId, index) => { if (!isId(documentId)) add(errors, `held_out_document_id_invalid:${index}`) })
    if (sortedUnique(trainIds).length !== trainIds.length) add(errors, 'train_document_ids_not_sorted_unique')
    if (sortedUnique(heldOutIds).length !== heldOutIds.length) add(errors, 'held_out_document_ids_not_sorted_unique')
    const directOverlap = overlapValues(trainIds, heldOutIds)
    if (directOverlap.length > 0) add(errors, `cross_partition_document_id:${sortedUnique(directOverlap).join(',')}`)
    const documents = Array.isArray(plan.documentCatalog) ? plan.documentCatalog : []
    const splitHasIds = trainIds.length > 0 || heldOutIds.length > 0
    if (plan.corpus?.splitMaterialized !== splitHasIds) add(errors, 'split_materialization_mismatch')
    if (splitHasIds && (documents.length === 0 || plan.corpus?.bytesAvailable !== true || !isHash(plan.corpus?.manifestSha256))) add(errors, 'materialized_split_source_not_verified')
    if (splitHasIds) documents.forEach(document => {
      if (!isHash(document?.documentFingerprint)) add(errors, `document_fingerprint_required:${document?.documentId}`)
      if (!Array.isArray(document?.sourceObjectHashes) || document.sourceObjectHashes.length === 0) add(errors, `source_object_hashes_required:${document?.documentId}`)
      if (!Array.isArray(document?.memberRecordIds) || document.memberRecordIds.length === 0) add(errors, `member_record_ids_required:${document?.documentId}`)
    })
    const catalogIds = new Set(documents.map(document => document?.documentId))
    const assignedIds = [...trainIds, ...heldOutIds]
    assignedIds.forEach(documentId => { if (documents.length > 0 && !catalogIds.has(documentId)) add(errors, `partition_document_not_in_catalog:${documentId}`) })
    if (documents.length > 0 && plan.corpus?.splitMaterialized === true) {
      documents.forEach(document => {
        const assignments = Number(trainIds.includes(document.documentId)) + Number(heldOutIds.includes(document.documentId))
        if (assignments !== 1) add(errors, `document_not_assigned_exactly_once:${document.documentId}`)
      })
    }

    const catalog = catalogById(documents)
    const trainDocs = trainIds.map(id => catalog.get(id)).filter(Boolean)
    const heldOutDocs = heldOutIds.map(id => catalog.get(id)).filter(Boolean)
    const compareField = (field, values) => {
      const trainValues = trainDocs.flatMap(document => field === 'sourceObjectHashes' || field === 'memberRecordIds' ? document[field] || [] : document[field] ? [document[field]] : [])
      const heldOutValues = heldOutDocs.flatMap(document => field === 'sourceObjectHashes' || field === 'memberRecordIds' ? document[field] || [] : document[field] ? [document[field]] : [])
      const overlap = overlapValues(trainValues, heldOutValues)
      if (overlap.length > 0) add(errors, `cross_partition_${values}:${sortedUnique(overlap).join(',')}`)
    }
    compareField('documentFingerprint', 'document_fingerprint')
    compareField('duplicateFamilyId', 'duplicate_family')
    compareField('sourceObjectHashes', 'source_object_hash')
    compareField('memberRecordIds', 'member_record_id')
  }

  const train = plan.partitions?.train
  const heldOut = plan.partitions?.['untouched-held-out']
  if (train?.unit !== 'document' || train?.eligibleForTraining !== true || train?.readOnly !== false || train?.untouched !== false) add(errors, 'train_partition_policy_invalid')
  if (heldOut?.unit !== 'document' || heldOut?.eligibleForTraining !== false || heldOut?.readOnly !== true || heldOut?.untouched !== true) add(errors, 'untouched_held_out_policy_invalid')
  const trainUse = train?.useBoundary || {}
  const heldOutUse = heldOut?.useBoundary || {}
  for (const key of ['training', 'augmentation', 'normalizationFit', 'vocabularyFit', 'thresholdCalibration', 'hyperparameterTuning', 'checkpointSelection', 'earlyStopping', 'manualCorrection', 'feedbackToTraining']) {
    if (trainUse[key] !== true) add(errors, `train_use_boundary_invalid:${key}`)
    if (heldOutUse[key] !== false) add(errors, `held_out_use_boundary_invalid:${key}`)
  }
  if (plan.status === 'DESIGN_ONLY' && (plan.corpus?.splitMaterialized !== false || plan.documentCatalog?.length !== 0)) add(errors, 'design_only_contains_materialized_data')
  return sortedUnique(errors)
}

export function validateChiKnowPoSpecializationPlan(plan) {
  const errors = checkChiKnowPoSpecializationPlan(plan)
  return { pass: errors.length === 0, errors }
}

export function assertChiKnowPoSpecializationPlan(plan) {
  const result = validateChiKnowPoSpecializationPlan(plan)
  if (!result.pass) throw new Error(`CHI-KNOW-PO specialization plan invalid: ${result.errors.join(', ')}`)
  return true
}
