import test from 'node:test'
import assert from 'node:assert/strict'
import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'
import { buildUnifiedPromptPayload, UNIFIED_SAFETY_GUARDRAILS } from '../src/interpretationPrep/unifiedPromptAdapter.js'

test('unifiedInterpretationContext: creates unified contract preserving evidence and systemAgreement', () => {
  const sajuContext = {
    subjectName: '통합테스트',
    candidateSetConsensus: { factual: { dayMaster: '甲' } },
    calculationConfidence: { stateContract: { confidence: 'high' } },
  }

  const ziweiContext = {
    subjectName: '통합테스트',
    candidateSetConsensus: { factual: { mingGongBranch: '寅' } },
    calculationConfidence: { stateContract: { confidence: 'high' } },
  }

  const unifiedCtx = createUnifiedInterpretationContext(sajuContext, ziweiContext)

  assert.equal(unifiedCtx.systemType, 'unified_3system_saju_ziwei_astrology')
  assert.equal(unifiedCtx.systemAgreement.agreementLevel, 'multi_lens_synthesis')
  assert.equal(unifiedCtx.sharedThemes.length, 1)
  assert.ok(unifiedCtx.sharedThemes[0].evidence.saju)
  assert.ok(unifiedCtx.sharedThemes[0].evidence.ziwei)
  assert.equal(unifiedCtx.unifiedConfidence.overallConfidence, 'high')

  const payload = buildUnifiedPromptPayload(unifiedCtx, 'career')
  assert.ok(payload.systemPrompt.includes('Step 1: 3대 체계별 독립 렌즈 설명'))
  assert.ok(payload.systemPrompt.includes('Step 2: 공통 테마'))
  assert.ok(payload.systemPrompt.includes('Step 3: 통합 안전'))


  UNIFIED_SAFETY_GUARDRAILS.forEach((g) => {
    assert.ok(payload.systemPrompt.includes(g))
  })
})

test('unifiedInterpretationContext: propagates partial_uncertainty_preserved when one system has low confidence', () => {
  const sajuContext = {
    subjectName: '불확실통합',
    calculationConfidence: { stateContract: { confidence: 'low' } },
    uncertainFactors: [{ issue: '시주 미상' }],
  }

  const ziweiContext = {
    subjectName: '불확실통합',
    calculationConfidence: { stateContract: { confidence: 'high' } },
  }

  const unifiedCtx = createUnifiedInterpretationContext(sajuContext, ziweiContext)

  assert.equal(unifiedCtx.systemAgreement.agreementLevel, 'partial_uncertainty_preserved')

  assert.equal(unifiedCtx.unifiedConfidence.overallConfidence, 'medium')
  assert.equal(unifiedCtx.unifiedConfidence.uncertainFactors.length, 1)

  const payload = buildUnifiedPromptPayload(unifiedCtx, 'personality')
  assert.ok(payload.systemPrompt.includes('미래 단정적 예언을 절대 금하고'))
})
