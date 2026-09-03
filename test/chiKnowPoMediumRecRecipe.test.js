import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  checkChiKnowPoMediumRecInnerSplit,
  checkChiKnowPoMediumRecRecipe,
  checkChiKnowPoMediumRecHFJobSpec,
  validateChiKnowPoMediumRecRecipeArtifacts,
} from '../src/ocr/chiKnowPoMediumRecRecipe.js'
import {
  checkChiKnowPoMediumRecRecipeSubmission,
  validateChiKnowPoMediumRecRecipeSubmission,
} from '../src/ocr/chiKnowPoMediumRecRecipeSubmission.js'
import {
  checkChiKnowPoMediumRecRecipeRun,
} from '../src/ocr/chiKnowPoMediumRecRecipeRun.js'

const root = 'artifacts/historical-ocr-chi-know-po-medium-rec-recipe-v1'
const read = name => JSON.parse(fs.readFileSync(`${root}/${name}`, 'utf8'))

test('recipe validators fail closed before train-only split and design evidence exist', () => {
  assert.ok(checkChiKnowPoMediumRecInnerSplit({}).includes('inner_split_schema_mismatch'))
  assert.ok(checkChiKnowPoMediumRecRecipe({}).includes('recipe_schema_mismatch'))
  assert.ok(checkChiKnowPoMediumRecHFJobSpec({}).includes('hf_job_schema_mismatch'))
})

test('inner dev is a document-disjoint subset of the ten train documents', () => {
  const split = read('inner-dev-split.json')
  assert.deepEqual(split.split.innerDevDocumentIds, ['A-3', 'S-3', 'T-3'])
  assert.deepEqual(split.split.innerTrainDocumentIds, ['A-1', 'A-4', 'S-2', 'S-4', 'S-6', 'S-7', 'T-1'])
  assert.equal(split.corpus.sourcePartition, 'train')
  assert.equal(split.corpus.heldOutPathArgumentProvided, false)
  assert.equal(split.corpus.frozenGoldPathArgumentProvided, false)
  assert.equal(split.boundaries.BLOCK_OCR_ROUTE, true)
  assert.equal(split.boundaries.OCRProvider.enabled, false)
  assert.deepEqual(checkChiKnowPoMediumRecInnerSplit(split), [])
})

test('recipe and HF design stay conservative, disposable, and inactive', () => {
  const recipe = read('recipe-design.json')
  const hfJobSpec = read('hf-disposable-recipe-job-spec.json')
  const result = validateChiKnowPoMediumRecRecipeArtifacts({ split: read('inner-dev-split.json'), recipe, hfJobSpec })
  assert.deepEqual(result, { pass: true, errors: [] })
  assert.equal(recipe.execution.localTraining, 'STOPPED')
  assert.equal(recipe.promotion.nextFineTuningGate, 'NOT_OPEN')
  assert.deepEqual(recipe.recipe.stages.map(stage => stage.learningRate), [0.00001, 0.000003, 0.000001])
  assert.equal(recipe.recipe.optimizer.gradientClipping.maxNorm, 1)
  assert.equal(hfJobSpec.jobSubmission.api, "hf_jobs('uv')")
  assert.equal(hfJobSpec.jobSubmission.localFilesystemPathArgument, false)
  assert.equal(hfJobSpec.submitted, false)
  assert.equal(hfJobSpec.route.BLOCK_OCR_ROUTE, true)
  assert.equal(hfJobSpec.route.OCRProvider.enabled, false)
})

test('blocked HF submission is explicit and cannot be mistaken for a recipe result', () => {
  const receipt = read('hf-job-submission-receipt.json')
  assert.deepEqual(checkChiKnowPoMediumRecRecipeSubmission(receipt), [])
  assert.deepEqual(validateChiKnowPoMediumRecRecipeSubmission(receipt), {
    pass: true,
    errors: [],
    decision: 'RECIPE_NOT_PROVEN',
    baseRetainedExplicitly: true,
  })
  assert.equal(receipt.request.flavor, 't4-small')
  assert.equal(receipt.response.httpStatus, 402)
  assert.equal(receipt.checkpointEvidenceAvailable, false)
  assert.equal(receipt.baseRetainedExplicitly, true)
})

test('checkpoint validator fails closed when no remote run result exists', () => {
  const errors = checkChiKnowPoMediumRecRecipeRun({})
  assert.ok(errors.includes('run_schema_mismatch'))
  assert.ok(errors.includes('resource_telemetry_gate_not_passed'))
})
