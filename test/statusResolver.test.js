import test from 'node:test'
import assert from 'node:assert/strict'

import { getSystemCapabilities, supportsCapability } from '../src/interpretationPrep/engineCapabilities.js'
import { createEmptySystemResult } from '../src/interpretationPrep/schema.js'
import { isSystemStatus, resolveSystemStatus } from '../src/interpretationPrep/statusResolver.js'

test('missing input and missing profile take precedence over calculation state', () => {
  assert.equal(resolveSystemStatus({ system: 'saju', hasRequiredInput: false }), 'missing_input')
  assert.equal(resolveSystemStatus({ system: 'saju', profileReady: false }), 'needs_profile')
})

test('candidate and verification states take precedence over a completed calculation', () => {
  assert.equal(resolveSystemStatus({ system: 'saju', candidateRequired: true }), 'candidate_required')
  assert.equal(resolveSystemStatus({ system: 'saju', needsVerification: true }), 'needs_verification')
})

test('explicit unsupported-system statuses remain stable', () => {
  assert.equal(resolveSystemStatus({ system: 'ziwei', requestedStatus: 'needs_profile' }), 'needs_profile')
  assert.equal(resolveSystemStatus({ system: 'astrology', requestedStatus: 'unsupported' }), 'unsupported')
})

test('unknown systems safely fall back to unsupported capabilities', () => {
  const capabilities = getSystemCapabilities('unknown-system')
  assert.equal(capabilities.calculation, false)
  assert.equal(capabilities.defaultStatus, 'unsupported')
  assert.equal(resolveSystemStatus({ system: 'unknown-system' }), 'unsupported')
})

test('capability registry describes currently implemented calculation coverage', () => {
  assert.equal(supportsCapability('saju', 'pillars'), true)
  assert.equal(supportsCapability('saju', 'relations'), true)
  assert.equal(supportsCapability('ziwei', 'calculation'), false)
  assert.equal(supportsCapability('astrology', 'calculation'), false)
})

test('empty system results expose the resolved status and capability snapshot', () => {
  const result = createEmptySystemResult('ziwei', 'needs_profile', ['profile required'])

  assert.equal(result.status, 'needs_profile')
  assert.equal(result.capabilities.system, 'ziwei')
  assert.equal(result.capabilities.calculation, false)
  assert.deepEqual(result.warnings, ['profile required'])
})

test('status guard recognizes every public resolver state', () => {
  for (const status of [
    'complete',
    'partial',
    'needs_verification',
    'candidate_required',
    'experimental',
    'unsupported',
    'missing_input',
    'needs_profile',
  ]) {
    assert.equal(isSystemStatus(status), true)
  }

  assert.equal(isSystemStatus('not-a-status'), false)
})
