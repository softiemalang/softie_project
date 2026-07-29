import test from 'node:test'
import assert from 'node:assert/strict'
import { calibrateInputs } from '../scripts/calibrate-de405-cross-reference.mjs'

test('calibration stays blocked when raw cross-reference evidence is absent', () => {
  const result = calibrateInputs({
    manifest: 'test/fixtures/astrology/de405/manifest.json',
    baseline: 'test/fixtures/astrology/de405/baseline.json',
    raw: 'test/fixtures/astrology/de405/raw-comparison.jsonl',
  })
  assert.equal(result.status, 'blocked_by_missing_raw_cross_reference_evidence')
  assert.equal(result.evidence.numericPolicyMayBeWritten, false)
})
