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
      solarPillars: { year: '甲子', month: '丙寅', day: '甲子', hour: '甲子' },
      isSolarTermBoundary: c.sajuInput.birthDay === 4,
    }) || { subjectName: c.sajuInput.subjectName }

    if (c.sajuInput.birthDay === 4) {
      sajuCtx.calculationConfidence = {
        stateContract: { confidence: 'low', verificationStatus: 'needs_verification' },
      }
    }

    // 2. Build Ziwei Context
    const chartCtx = resolveZiweiChart({
      subjectName: c.ziweiInput.subjectName,
      birthYearStem: c.ziweiInput.birthYearStem,
      lunarMonth: c.ziweiInput.lunarMonth,
      hourBranch: c.ziweiInput.hourBranch || '子',
      isLeapMonth: Boolean(c.ziweiInput.isLeapMonth),
    })

    const chart = chartCtx.chart
    chart.majorStars = resolve14MajorStars({
      bureauNumber: chart.fiveElementsBureau.number,
      lunarDay: 15,
      palaces: chart.palaces,
    }).majorStars
    chart.transformations = resolveFourTransformations(c.ziweiInput.birthYearStem).transformations

    const ziweiCalcCtx = createZiweiCalculationContext({
      input: c.ziweiInput,
      chart,
      calculationMeta: {
        confidence: c.ziweiInput.isLeapMonth ? 'low' : 'high',
        verificationStatus: c.ziweiInput.isLeapMonth ? 'needs_verification' : 'verified',
      },
    })
    const ziweiCtx = createZiweiInterpretationContext(ziweiCalcCtx)

    // 3. Build Unified Context & Prompt Payload
    const unifiedCtx = createUnifiedInterpretationContext(sajuCtx, ziweiCtx)
    const payload = buildUnifiedPromptPayload(unifiedCtx, c.domainProfile)

    // Verify System Agreement
    assert.equal(unifiedCtx.systemAgreement.agreementLevel, c.expectedAgreement)

    // Verify 4-step protocol
    assert.ok(payload.systemPrompt.includes('Step 1: 각 체계별 독립 관점 설명'))
    assert.ok(payload.systemPrompt.includes('Step 2: 공통 테마와 입체적 관점 차이'))
    assert.ok(payload.systemPrompt.includes('Step 3: 통합 안전 지침'))
    assert.ok(payload.systemPrompt.includes('Step 4: 대화형 가이드'))

    // Verify Safety Guardrails
    UNIFIED_SAFETY_GUARDRAILS.forEach((g) => {
      assert.ok(payload.systemPrompt.includes(g))
    })

    // Verify Evidence Preservation
    assert.ok(unifiedCtx.sharedThemes[0].evidence.saju)
    assert.ok(unifiedCtx.sharedThemes[0].evidence.ziwei)
  })
})
