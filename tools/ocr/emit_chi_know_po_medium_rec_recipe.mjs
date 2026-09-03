#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

import {
  checkChiKnowPoMediumRecInnerSplit,
  checkChiKnowPoMediumRecHFJobSpec,
  checkChiKnowPoMediumRecRecipe,
} from '../../src/ocr/chiKnowPoMediumRecRecipe.js'
import {
  canonicalHistoricalOcrJson,
  historicalOcrContentSha256,
} from '../../src/ocr/historicalOcrTeam.js'

const OUTPUT_DIR = path.resolve('artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1')
const SPLIT_PATH = path.join(OUTPUT_DIR, 'inner-dev-split.json')
const PREFLIGHT_PATH = path.resolve('artifacts/historical-ocr-chi-know-po-medium-rec-preflight/preflight.json')
const MODEL_ID = 'PaddlePaddle/PP-OCRv6_medium_rec_safetensors'
const MODEL_REVISION = '024cad6a831de75c2c3c26e711ba8c4a82ccd24b'
const MODEL_WEIGHTS_SHA256 = '5f43c16f2a684b1d2284662178bdb604febd3d6bfdb5ca73828d08d0f7c0c3e9'
const readJson = filePath => JSON.parse(fs.readFileSync(filePath, 'utf8'))
const writeJson = (filePath, value) => fs.writeFileSync(filePath, canonicalHistoricalOcrJson(value), 'utf8')
const assert = (condition, message) => { if (!condition) throw new Error(message) }

function modelIdentity(preflight) {
  const source = preflight.candidate.model
  const { modelDir, ...identity } = source
  return identity
}

function buildRecipe(split, preflight) {
  return {
    schema: 'chi-know-po-ppocrv6-medium-rec-minimal-recipe-v1',
    status: 'DESIGN_ONLY',
    designId: 'chi-know-po-medium-rec-conservative-progressive-unfreeze-v1',
    candidate: {
      workerId: 'pp-ocrv6-medium-rec',
      component: 'rec',
      model: modelIdentity(preflight),
      selectorEvidence: {
        source: 'read_only_model_named_parameter_introspection',
        totalNamedParameters: 269,
        prefixNamedParameterCounts: {
          'head.head.': 2,
          'head.encoder.': 41,
          'model.backbone.encoder.blocks.3.': 43,
          'model.other_or_earlier_backbone': 183,
        },
        allUnmatchedPrefixesMustRemainFrozen: true,
      },
    },
    corpus: {
      corpusId: split.corpus.corpusId,
      datasetId: split.corpus.datasetId,
      sourceRevision: split.corpus.sourceRevision,
      sourcePartition: split.corpus.sourcePartition,
      trainParquetSha256: split.corpus.trainParquetSha256,
      sourceDocumentIds: split.corpus.sourceDocumentIds,
      innerTrainDocumentIds: split.split.innerTrainDocumentIds,
      innerDevDocumentIds: split.split.innerDevDocumentIds,
      innerSplitPath: 'artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/inner-dev-split.json',
      innerSplitSha256: split.contentSha256,
      heldOutPathArgumentProvided: false,
      frozenGoldPathArgumentProvided: false,
    },
    preflight: {
      artifact: 'artifacts/historical-ocr-chi-know-po-medium-rec-preflight/preflight.json',
      artifactContentSha256: preflight.contentSha256,
      requiredFunctionalGate: 'PASSED',
      observedFunctionalGate: preflight.gates.functional,
      observedStatus: preflight.status,
      observedLocalResourceGate: preflight.resourceGate.status,
      localTrainingExecuted: false,
      heldOutAccessed: false,
      frozenDomainGoldAccessed: false,
    },
    recipe: {
      name: 'conservative-progressive-unfreeze-v1',
      objective: 'Improve inner-dev CER while preserving base exact outcomes and per-document non-worsening.',
      trainingPartition: 'inner-train',
      devPartition: 'inner-dev',
      fullFineTuning: false,
      augmentation: false,
      semanticCorrection: false,
      normalization: 'NFC_only',
      trainSelection: {
        selectionMethod: 'first_encodable_records_per_document_v1',
        maxRecordsPerDocument: 64,
        selectedRecordCount: 448,
        labelsUsedForTraining: true,
        rawTextOrImagesRetainedInEvidence: false,
      },
      devSelection: {
        allRecords: true,
        labelsUsedFor: 'metric_only_checkpoint_selection_and_early_stop',
        externalData: false,
        rawTextOrImagesRetainedInEvidence: false,
      },
      optimizer: {
        name: 'Adam',
        betas: [0.9, 0.999],
        weightDecay: 0,
        schedule: 'fixed_per_stage',
        reinitializeOptimizerOnUnfreeze: true,
        gradientClipping: {
          type: 'global_norm',
          implementation: 'paddle.nn.ClipGradByGlobalNorm',
          maxNorm: 1,
        },
      },
      stages: [
        {
          id: 's0-head-only',
          requires: 'base_reference',
          learningRate: 0.00001,
          maxSteps: 16,
          checkpointEverySteps: 8,
          trainablePrefixes: ['head.head.'],
          frozenPrefixes: ['head.encoder.', 'model.'],
          freezeUnmatched: true,
          optimizerStatePolicy: 'reset_on_stage_transition',
        },
        {
          id: 's1-head-encoder',
          requires: 's0_checkpoint_dev_non_worse',
          learningRate: 0.000003,
          maxSteps: 16,
          checkpointEverySteps: 8,
          trainablePrefixes: ['head.head.', 'head.encoder.'],
          frozenPrefixes: ['model.'],
          freezeUnmatched: true,
          optimizerStatePolicy: 'reset_on_stage_transition',
        },
        {
          id: 's2-last-backbone-block',
          requires: 's1_checkpoint_dev_non_worse',
          learningRate: 0.000001,
          maxSteps: 16,
          checkpointEverySteps: 8,
          trainablePrefixes: ['head.head.', 'head.encoder.', 'model.backbone.encoder.blocks.3.'],
          frozenPrefixes: [
            'model.backbone.encoder.stem1.',
            'model.backbone.encoder.blocks.0.',
            'model.backbone.encoder.blocks.1.',
            'model.backbone.encoder.blocks.2.',
          ],
          freezeUnmatched: true,
          optimizerStatePolicy: 'reset_on_stage_transition',
        },
      ],
      checkpointPolicy: {
        evaluateEveryCheckpoint: true,
        selectEarliestPassingCheckpoint: true,
        noIntermediateDevWorsening: true,
        baseRetainedExplicitlyOnFailure: true,
        silentFallback: false,
        criteria: {
          cerStrictlyImproved: true,
          exactNonWorsening: true,
          perDocumentCerNonWorsening: true,
          perDocumentExactNonWorsening: true,
          atLeastOneStrictDocumentGain: true,
          externalHeldOutOrFrozenGold: false,
        },
        failureOutcome: 'RECIPE_NOT_PROVEN_BASE_RETAINED_EXPLICITLY',
      },
      repeatPolicy: {
        repeats: 2,
        seed: 7,
        deterministicRuntime: true,
        checkpointAndDevHashesMustMatch: true,
        missingOrDifferentHashes: 'UNKNOWN_OR_BLOCKED',
      },
    },
    execution: {
      localTraining: 'STOPPED',
      target: 'HF_DISPOSABLE_ONLY',
      submitted: false,
      localResourceGate: 'BLOCKED_BY_SWAP_IN_PREVIOUS_PREFLIGHT',
      noLocalRetry: true,
    },
    promotion: {
      current: 'NOT_OPEN',
      stableRecipeDecision: 'NOT_PROVEN',
      nextFineTuningGate: 'NOT_OPEN',
      onStableProof: 'READY_FOR_NEXT_FINE_TUNING_GATE_ONLY',
      automaticPromotion: false,
      activation: 'SEPARATE_DECISION_REQUIRED',
    },
    boundaries: {
      BLOCK_OCR_ROUTE: true,
      OCRProvider: { enabled: false },
      activation: false,
      detectionTouched: false,
      fallbackPolicy: 'none',
      frozenDomainGoldAccessed: false,
      heldOutAccessed: false,
      historicalSourceJudgment: false,
      search: false,
      semanticCorrection: false,
      silentFallback: false,
    },
    evidenceRefs: [
      'artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/inner-dev-split.json',
      'artifacts/historical-ocr-chi-know-po-medium-rec-preflight/preflight.json',
      'tools/ocr/materialize_chi_know_po_medium_rec_inner_dev.mjs',
      'src/ocr/chiKnowPoMediumRecRecipe.js',
    ],
  }
}

function buildHFJobSpec(split, recipe) {
  return {
    schema: 'chi-know-po-ppocrv6-medium-rec-hf-recipe-search-design-v1',
    status: 'DESIGN_ONLY',
    submitted: false,
    jobId: null,
    activation: false,
    route: {
      BLOCK_OCR_ROUTE: true,
      OCRProvider: { enabled: false },
      fallbackPolicy: 'none',
    },
    source: {
      datasetId: split.corpus.datasetId,
      revision: split.corpus.sourceRevision,
      split: 'train',
      trainParquetSha256: split.corpus.trainParquetSha256,
      innerTrainDocumentIds: split.split.innerTrainDocumentIds,
      innerDevDocumentIds: split.split.innerDevDocumentIds,
      documentUnit: true,
      heldOutInput: false,
      frozenGoldInput: false,
      sourceUpload: false,
      rawDataInResults: false,
    },
    model: {
      modelId: MODEL_ID,
      revision: MODEL_REVISION,
      weightsSha256: MODEL_WEIGHTS_SHA256,
      loadMode: 'PaddleX PPOCRV6SmallRec.from_pretrained(convert_from_hf=True)',
    },
    jobSubmission: {
      api: "hf_jobs('uv')",
      scriptTransport: 'inline_bundle_or_reviewed_url',
      localFilesystemPathArgument: false,
      flavor: 't4-small',
      timeout: '2h',
      scheduled: false,
      retryPolicy: 'none_until_operator_review',
      publicResultPush: false,
    },
    bundle: {
      status: 'DESIGN_ONLY',
      entrypoint: 'ppocrv6_medium_rec_recipe_runner.py',
      dependencies: [
        'paddlepaddle-gpu==3.3.1',
        'paddlex==3.7.2',
        'pyarrow==21.0.0',
        'Pillow==11.3.0',
        'numpy==2.0.2',
        'huggingface-hub==0.36.2',
      ],
      inputContract: [
        'model_id_and_revision',
        'dataset_id_and_revision',
        'inner_train_document_ids',
        'inner_dev_document_ids',
        'recipe_config_digest',
      ],
      forbiddenInputContract: ['local_filesystem_path', 'held_out_path', 'frozen_gold_path'],
    },
    workload: {
      kind: 'bounded_recognition_recipe_search',
      recipeDesignPath: 'artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1/recipe-design.json',
      trainPartition: 'inner-train',
      devPartition: 'inner-dev',
      fullFineTuning: false,
      heldOutPathArgument: false,
      frozenGoldPathArgument: false,
      detectionExtension: 'DEFERRED',
      activation: false,
      maxStepsPerStage: 16,
      checkpointEverySteps: 8,
    },
    execution: {
      python: '3.11',
      deterministicSeed: 7,
      repeats: 2,
      deterministicFlags: ['FLAGS_cpu_deterministic=1', 'OMP_NUM_THREADS=1', 'MKL_NUM_THREADS=1'],
      requiredTelemetry: [
        'peak_rss_mib',
        'gpu_peak_memory_mib',
        'wall_time_ms',
        'cpu_seconds',
        'deterministic_output_sha256',
        'checkpoint_sha256',
        'oom_or_swap_status',
      ],
      missingTelemetry: 'UNKNOWN_OR_BLOCKED',
    },
    persistence: {
      visibility: 'private_operator_selected_repo',
      hfTokenBinding: 'encrypted_secret_only_when_authorized',
      rawTextOrImages: false,
      checkpointAndMetrics: 'persist_after_each_checkpoint_and_final',
      publicResultPush: false,
    },
    resourceGate: {
      localTraining: 'STOPPED',
      localReason: 'previous_preflight_swap_delta_exceeded_256_MiB',
      remoteFlavor: 't4-small',
      telemetryRequired: true,
      automaticHardwareFallback: false,
      missingTelemetry: 'UNKNOWN_OR_BLOCKED',
      explicitEscalation: ['operator_review_then_l4x1_if_t4_telemetry_fails'],
    },
    promotion: {
      current: 'NOT_OPEN',
      onStableProof: 'READY_FOR_NEXT_FINE_TUNING_GATE_ONLY',
      automaticPromotion: false,
      activation: 'SEPARATE_DECISION_REQUIRED',
    },
    prohibitions: {
      search: false,
      historicalSourceJudgment: false,
      semanticCorrection: false,
      silentFallback: false,
      fullFineTuningBeforeCauseConfirmation: 'FORBIDDEN',
      frozenGoldAccess: 'FORBIDDEN',
      heldOutAccess: 'FORBIDDEN',
      detectionExtension: 'DEFERRED',
    },
    recipeReference: {
      designSha256: recipe.contentSha256,
      stableProofRequiredBeforeNextGate: true,
    },
  }
}

function main() {
  const split = readJson(SPLIT_PATH)
  const preflight = readJson(PREFLIGHT_PATH)
  const splitErrors = checkChiKnowPoMediumRecInnerSplit(split)
  assert(splitErrors.length === 0, `inner_split_invalid:${splitErrors.join(',')}`)
  assert(preflight.gates?.functional === 'PASSED', 'preflight_functional_gate_not_passed')
  const recipe = buildRecipe(split, preflight)
  recipe.contentSha256 = historicalOcrContentSha256({ ...recipe, contentSha256: null })
  const hfJobSpec = buildHFJobSpec(split, recipe)
  hfJobSpec.contentSha256 = historicalOcrContentSha256({ ...hfJobSpec, contentSha256: null })
  const recipeErrors = checkChiKnowPoMediumRecRecipe(recipe)
  const hfErrors = checkChiKnowPoMediumRecHFJobSpec(hfJobSpec)
  assert(recipeErrors.length === 0, `recipe_invalid:${recipeErrors.join(',')}`)
  assert(hfErrors.length === 0, `hf_job_spec_invalid:${hfErrors.join(',')}`)
  writeJson(path.join(OUTPUT_DIR, 'recipe-design.json'), recipe)
  writeJson(path.join(OUTPUT_DIR, 'hf-disposable-recipe-job-spec.json'), hfJobSpec)
  console.log(JSON.stringify({
    recipe: path.join(OUTPUT_DIR, 'recipe-design.json'),
    hfJobSpec: path.join(OUTPUT_DIR, 'hf-disposable-recipe-job-spec.json'),
    status: recipe.status,
    submitted: hfJobSpec.submitted,
    innerTrainDocuments: split.split.innerTrainDocumentIds,
    innerDevDocuments: split.split.innerDevDocumentIds,
    recipeContentSha256: recipe.contentSha256,
    hfJobContentSha256: hfJobSpec.contentSha256,
  }, null, 2))
}

main()
