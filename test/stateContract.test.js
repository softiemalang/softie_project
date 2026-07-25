import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareInterpretationData, buildExportPayload, exportPayloadToMarkdown } from '../src/interpretationPrep/prepare.js'
import { calculateSajuSystem } from '../src/interpretationPrep/sajuAdapter.js'
import { DEFAULT_INPUT, DEFAULT_PROFILES } from '../src/interpretationPrep/schema.js'
import { resolveStateContract } from '../src/interpretationPrep/statusResolver.js'

test('resolveStateContract splits 5 state dimensions correctly', () => {
  const defaultContract = resolveStateContract()
  assert.equal(defaultContract.inputStatus, 'valid')
  assert.equal(defaultContract.calculationStatus, 'calculated')
  assert.equal(defaultContract.verificationStatus, 'verified')
  assert.equal(defaultContract.interpretationStatus, 'ready')
  assert.equal(defaultContract.confidence, 'medium')

  const customContract = resolveStateContract({
    inputStatus: 'unknown_birth_time',
    calculationStatus: 'partial',
    verificationStatus: 'needs_verification',
    interpretationStatus: 'experimental',
    confidence: 'low',
  })
  assert.equal(customContract.inputStatus, 'unknown_birth_time')
  assert.equal(customContract.calculationStatus, 'partial')
  assert.equal(customContract.verificationStatus, 'needs_verification')
  assert.equal(customContract.interpretationStatus, 'experimental')
  assert.equal(customContract.confidence, 'low')
})

test('sajuAdapter outputs stateContract and epistemicMetadata for yongShin and gyeokguk', () => {
  const input = {
    ...DEFAULT_INPUT,
    birthDate: '1990-05-15',
    birthTime: '14:30',
    targetDate: '2025-01-01',
    gender: 'female',
    referenceCity: 'seoul',
  }

  const saju = calculateSajuSystem(input, DEFAULT_PROFILES.saju)
  assert.ok(saju.stateContract)
  assert.equal(saju.stateContract.inputStatus, 'valid')

  const experimental = saju.raw.experimental
  assert.ok(experimental.yongShin.epistemicMetadata)
  assert.equal(experimental.yongShin.epistemicMetadata.confidence, 'low')
  assert.equal(experimental.yongShin.epistemicMetadata.method.id, 'surface-support-heuristic-v1')

  assert.ok(experimental.gyeokguk.epistemicMetadata)
  assert.equal(experimental.gyeokguk.epistemicMetadata.method.id, 'month-jijangan-tugan-v1')
})

test('needs_verification state propagates across adapter, experimental, export, and metadata', () => {
  // 1958 birth is prior to 1961-08-10, triggering historical timezone verification
  const input = {
    ...DEFAULT_INPUT,
    birthDate: '1958-03-15',
    birthTime: '10:00',
    targetDate: '2025-01-01',
    gender: 'male',
    referenceCity: 'seoul',
  }

  const prepResult = prepareInterpretationData(input)
  const saju = prepResult.systems.saju

  assert.equal(saju.status, 'needs_verification')
  assert.equal(saju.stateContract.verificationStatus, 'needs_verification')
  assert.equal(saju.raw.experimental.verificationStatus, 'needs_verification')
  assert.equal(saju.raw.experimental.confidence, 'low')

  // Metadata should also reflect low confidence when needs_verification is triggered
  assert.equal(saju.raw.experimental.strength.epistemicMetadata.confidence, 'low')
  assert.equal(saju.raw.experimental.gyeokguk.epistemicMetadata.confidence, 'low')
  assert.equal(saju.raw.experimental.yongShin.epistemicMetadata.confidence, 'low')

  const exportPayload = buildExportPayload(prepResult, { type: 'chat_package', topicId: 'overall', question: '', generatedAt: '2026-07-25' })
  assert.equal(exportPayload.calculationSummary.saju.systemStatus, 'needs_verification')

  const markdown = exportPayloadToMarkdown(exportPayload)
  assert.ok(markdown.includes('needs_verification') || markdown.includes('후보 확인 필요') || markdown.includes('미산출'))
})

test('low confidence is preserved without promotion across pipeline', () => {
  const input = {
    ...DEFAULT_INPUT,
    birthDate: '1995-07-20',
    birthTime: '18:00',
    targetDate: '2025-01-01',
    gender: 'female',
    referenceCity: 'seoul',
  }

  const prepResult = prepareInterpretationData(input)
  const yongShin = prepResult.systems.saju.raw.experimental.yongShin
  assert.equal(yongShin.confidence, 'low')
  assert.equal(yongShin.epistemicMetadata.confidence, 'low')
})
