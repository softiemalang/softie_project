import test from 'node:test'
import assert from 'node:assert/strict'
import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'
import { buildUnifiedPromptPayload, UNIFIED_SAFETY_GUARDRAILS } from '../src/interpretationPrep/unifiedPromptAdapter.js'

const contextFor = (system, confidence = 'high') => ({
  systemType: system,
  subjectName: '통합테스트',
  candidateSetConsensus: {
    factual: system === 'saju'
      ? { dayMaster: '甲' }
      : system === 'ziwei'
        ? { mingGongBranch: '寅', shenGongBranch: '午' }
        : { sunSign: 'taurus' },
  },
  calculationConfidence: {
    stateContract: { confidence, verificationStatus: 'verified' },
  },
})
const descriptorFor = (system, confidence = 'high') => ({
  system,
  status: 'available',
  verificationStatus: 'verified',
  confidence,
  availableForChat: true,
  interpretationContext: contextFor(system, confidence),
  calculationResult: { systemType: system },
  warnings: [],
})

test('unified context labels two available systems accurately and preserves independent evidence', () => {
  const unified = createUnifiedInterpretationContext({
    saju: descriptorFor('saju'),
    ziwei: descriptorFor('ziwei', 'medium'),
    astrology: {
      status: 'simulation_blocked',
      verificationStatus: 'unsupported_for_interpretation',
      confidence: 'not_available',
      availableForChat: false,
      interpretationContext: null,
      warnings: ['verified adapter missing'],
    },
  })

  assert.equal(unified.systemType, 'unified_2system')
  assert.deepEqual(unified.availableSystems, ['saju', 'ziwei'])
  assert.deepEqual(unified.unavailableSystems, ['astrology'])
  assert.equal(unified.unifiedConfidence.overallConfidence, 'medium')
  assert.equal(unified.sharedThemes.length, 1)
  assert.ok(unified.sharedThemes[0].evidence.saju)
  assert.ok(unified.sharedThemes[0].evidence.ziwei)
  assert.equal(unified.sharedThemes[0].evidence.astrology, undefined)

  const payload = buildUnifiedPromptPayload(unified, 'career')
  UNIFIED_SAFETY_GUARDRAILS.forEach((guardrail) => {
    assert.ok(payload.systemPrompt.includes(guardrail))
  })
})

test('unified context supports 1, 2, and 3 available system contracts', () => {
  const one = createUnifiedInterpretationContext({
    saju: descriptorFor('saju'),
    ziwei: { status: 'unavailable', availableForChat: false },
    astrology: { status: 'adapter_required', availableForChat: false },
  })
  const two = createUnifiedInterpretationContext({
    saju: descriptorFor('saju'),
    ziwei: descriptorFor('ziwei'),
    astrology: { status: 'simulation_blocked', availableForChat: false },
  })
  const three = createUnifiedInterpretationContext({
    saju: descriptorFor('saju'),
    ziwei: descriptorFor('ziwei'),
    astrology: { ...descriptorFor('astrology'), adapterVerified: true },
  })

  assert.equal(one.systemType, 'single_system_context')
  assert.equal(one.sharedThemes.length, 0)
  assert.equal(two.systemType, 'unified_2system')
  assert.equal(three.systemType, 'unified_3system')
  assert.equal(three.availableSystems.length, 3)
})

test('unified confidence uses the lowest available confidence and excludes unsupported systems', () => {
  const unified = createUnifiedInterpretationContext({
    saju: descriptorFor('saju', 'low'),
    ziwei: descriptorFor('ziwei', 'high'),
    astrology: {
      status: 'simulation_blocked',
      confidence: 'not_available',
      availableForChat: false,
      warnings: ['simulation blocked'],
    },
  })

  assert.equal(unified.systemAgreement.agreementLevel, 'partial_uncertainty_preserved')
  assert.equal(unified.unifiedConfidence.overallConfidence, 'low')
  assert.equal(unified.systems.astrology.context, null)
  assert.equal(unified.sharedThemes[0].evidence.astrology, undefined)
})

test('legacy astrology context is not available without verified adapter opt-in', () => {
  const unified = createUnifiedInterpretationContext(
    contextFor('saju'),
    contextFor('ziwei'),
    contextFor('astrology'),
  )

  assert.deepEqual(unified.availableSystems, ['saju', 'ziwei'])
  assert.equal(unified.systems.astrology.status, 'adapter_required')
})
