import test from 'node:test'
import assert from 'node:assert/strict'
import { UNIFIED_BENCHMARK_CASES } from './fixtures/unified/benchmarkCases.js'
import { buildInterpretationContext } from '../src/interpretationPrep/interpretationContext.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import {
  createZiweiCalculationContext,
  createZiweiInterpretationContext,
} from '../src/ziwei/ziweiContract.js'
import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'
import { buildUnifiedPromptPayload, UNIFIED_SAFETY_GUARDRAILS } from '../src/interpretationPrep/unifiedPromptAdapter.js'

test('unifiedQualityBenchmark: validates contract & system independence across 5 representative cases', () => {
  UNIFIED_BENCHMARK_CASES.forEach((c) => {
    // 1. Build Saju Context
    const sajuCtx = buildInterpretationContext({
      subjectName: c.sajuInput.subjectName,
      raw: { pillars: { year: '甲子', month: '丙寅', day: '甲子', hour: '甲子' } },
      stateContract: {
        confidence: c.sajuInput.birthDay === 4 ? 'low' : 'high',
        verificationStatus: c.sajuInput.birthDay === 4 ? 'candidate_required' : 'verified',
        inputStatus: 'valid',
        calculationStatus: 'calculated',
        interpretationStatus: c.sajuInput.birthDay === 4 ? 'candidate_only' : 'ready',
      },
    }) || { subjectName: c.sajuInput.subjectName }

    // 2. Build Ziwei Context
    const chartCtx = resolveZiweiChart({
      subjectName: c.ziweiInput.subjectName,
      birthYearStem: c.ziweiInput.birthYearStem,
      lunarMonth: c.ziweiInput.lunarMonth,
      hourBranch: c.ziweiInput.hourBranch || '子',
      isLeapMonth: Boolean(c.ziweiInput.isLeapMonth),
    })

    const chart = chartCtx.chart
    if (chart.fiveElementsBureau && chart.palaces.length > 0) {
      chart.majorStars = resolve14MajorStars({
        bureauNumber: chart.fiveElementsBureau.number,
        lunarDay: 15,
        palaces: chart.palaces,
      }).majorStars
      chart.transformations = resolveFourTransformations(c.ziweiInput.birthYearStem).transformations
    }

    const ziweiCalcCtx = createZiweiCalculationContext({
      input: {
        ...c.ziweiInput,
        hourBranch: c.ziweiInput.hourBranch || '子',
      },
      chart,
      calculationMeta: {
        confidence: c.ziweiInput.isLeapMonth ? 'low' : 'medium',
        verificationStatus: c.ziweiInput.isLeapMonth ? 'candidate_required' : 'needs_external_verification',
        interpretationStatus: c.ziweiInput.isLeapMonth ? 'candidate_only' : 'experimental',
      },
    })
    const ziweiCtx = createZiweiInterpretationContext(ziweiCalcCtx)

    // 3. Build Unified Context & Prompt Payload
    const astrologyCtx = c.expectedAgreement === 'insufficient_data'
      ? { calculationConfidence: { stateContract: { confidence: 'low' } } }
      : {}
    const unifiedCtx = createUnifiedInterpretationContext(sajuCtx, ziweiCtx, astrologyCtx)
    const payload = buildUnifiedPromptPayload(unifiedCtx, c.domainProfile)


    // Verify System Agreement & Synthesis Systems
    assert.equal(unifiedCtx.systemAgreement.agreementLevel, c.expectedAgreement)
    assert.ok(Array.isArray(unifiedCtx.synthesisSystems), 'synthesisSystems must be an array')
    if (c.expectedOverallConfidence) {
      assert.equal(unifiedCtx.unifiedConfidence.overallConfidence, c.expectedOverallConfidence)
    }

    // Verify 4-step protocol
    assert.ok(payload.systemPrompt.includes('Step 1: 3대 체계별 독립 렌즈 설명'))
    assert.ok(payload.systemPrompt.includes('Step 2: 공통 테마'))
    assert.ok(payload.systemPrompt.includes('Step 3: 통합 안전'))
    assert.ok(payload.systemPrompt.includes('Step 4: 대화형 가이드'))

    // Verify Safety Guardrails
    UNIFIED_SAFETY_GUARDRAILS.forEach((g) => {
      assert.ok(payload.systemPrompt.includes(g))
    })

    // Verify Evidence Preservation per Agreement Level
    if (c.expectedAgreement === 'multi_lens_synthesis') {
      assert.ok(unifiedCtx.synthesisSystems.length >= 2)
      assert.equal(unifiedCtx.sharedThemes.length, 1)
      assert.ok(unifiedCtx.sharedThemes[0].evidence.saju)
      assert.ok(unifiedCtx.sharedThemes[0].evidence.ziwei)
    } else if (c.expectedAgreement === 'single_system_only') {
      assert.equal(unifiedCtx.synthesisSystems.length, 1)
      assert.equal(unifiedCtx.sharedThemes.length, 0)
    } else if (c.expectedAgreement === 'insufficient_data') {
      assert.equal(unifiedCtx.synthesisSystems.length, 0)
      assert.equal(unifiedCtx.sharedThemes.length, 0)
    }
  })
})
