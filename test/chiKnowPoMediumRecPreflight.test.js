import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import { checkChiKnowPoMediumRecPreflight } from '../src/ocr/chiKnowPoMediumRecPreflight.js'

test('preflight validator fails closed before any evidence exists', () => {
  const errors = checkChiKnowPoMediumRecPreflight({})
  assert.ok(errors.includes('schema_mismatch'))
  assert.ok(errors.includes('train_only_input_invalid'))
  assert.ok(errors.includes('promotion_boundary_invalid'))
})

test('HF disposable design stays design-only and preserves boundaries', () => {
  const spec = JSON.parse(fs.readFileSync('artifacts/historical-ocr-chi-know-po-medium-rec-preflight/hf-disposable-job-spec.json', 'utf8'))
  assert.equal(spec.status, 'DESIGN_ONLY')
  assert.equal(spec.submitted, false)
  assert.equal(spec.route.BLOCK_OCR_ROUTE, true)
  assert.equal(spec.route.OCRProvider.enabled, false)
  assert.equal(spec.corpus.heldOutInTrainJob, false)
  assert.equal(spec.corpus.frozenGoldInAnyPhase, false)
  assert.equal(spec.preflight.causeConfirmationRequired, true)
  assert.equal(spec.prohibitions.fullFineTuningBeforeCauseConfirmation, 'FORBIDDEN')
  assert.equal(spec.jobSubmission.scheduled, false)
  assert.equal(spec.jobSubmission.publicResultPush, false)
})

const preflightPath = 'artifacts/historical-ocr-chi-know-po-medium-rec-preflight/preflight.json'
test('materialized preflight artifact satisfies the independent contract when present', { skip: !fs.existsSync(preflightPath) }, () => {
  const preflight = JSON.parse(fs.readFileSync(preflightPath, 'utf8'))
  assert.deepEqual(checkChiKnowPoMediumRecPreflight(preflight), [])
})
