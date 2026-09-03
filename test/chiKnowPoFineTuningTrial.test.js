import assert from 'node:assert/strict'
import test from 'node:test'

import { checkChiKnowPoFineTuningTrial } from '../src/ocr/chiKnowPoFineTuningTrial.js'

test('CHI-KNOW-PO fine-tuning trial validator fails closed on incomplete evidence', () => {
  const errors = checkChiKnowPoFineTuningTrial({})
  assert.ok(errors.includes('schema_mismatch'))
  assert.ok(errors.includes('base_repeat_count_invalid'))
  assert.ok(errors.includes('content_sha256_mismatch'))
})

test('an incomplete trial cannot claim next-gate promotion', () => {
  const errors = checkChiKnowPoFineTuningTrial({
    status: 'NOT_PROVEN',
    promotion: { nextFineTuningGate: 'READY_FOR_NEXT_FINE_TUNING_GATE' },
  })
  assert.ok(errors.includes('not_proven_promotion_open'))
})
