import test from 'node:test'
import assert from 'node:assert/strict'
import { ZIWEI_BENCHMARK_CASES } from './fixtures/ziwei/benchmarkCases.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import { resolveMinorStars } from '../src/ziwei/minorStarResolver.js'
import {
  createZiweiCalculationContext,
  createZiweiInterpretationContext,
} from '../src/ziwei/ziweiContract.js'
import { buildZiweiPromptPayload } from '../src/interpretationPrep/ziweiPromptAdapter.js'

test('ziweiQualityBenchmark: validates contract & guardrails across 5 representative benchmark cases', () => {
  ZIWEI_BENCHMARK_CASES.forEach((c) => {
    // 1. Resolve Chart
    const chartCtx = resolveZiweiChart({
      subjectName: c.input.subjectName,
      birthYearStem: c.input.birthYearStem,
      lunarMonth: c.input.lunarMonth,
      hourBranch: c.input.hourBranch || '子',
      isLeapMonth: Boolean(c.input.isLeapMonth),
    })

    const chart = chartCtx.chart
    chart.majorStars = resolve14MajorStars({
      bureauNumber: chart.fiveElementsBureau.number,
      lunarDay: 15,
      palaces: chart.palaces,
    }).majorStars

    chart.transformations = resolveFourTransformations(c.input.birthYearStem).transformations
    chart.minorStars = resolveMinorStars({
      birthYearStem: c.input.birthYearStem,
      lunarMonth: c.input.lunarMonth,
      hourBranch: c.input.hourBranch || '子',
      palaces: chart.palaces,
    }).minorStars

    const calcCtx = createZiweiCalculationContext({
      input: c.input,
      chart,
      calculationMeta: {
        confidence: c.expectedLowConfidence ? 'low' : 'high',
        verificationStatus: c.expectedLowConfidence ? 'needs_verification' : 'verified',
      },
    })

    const interpCtx = createZiweiInterpretationContext(calcCtx)
    const payload = buildZiweiPromptPayload(interpCtx, c.domainProfile)

    // Verify 4-step protocol
    assert.ok(payload.systemPrompt.includes('1단계: Consensus'))
    assert.ok(payload.systemPrompt.includes('2단계: Variance'))
    assert.ok(payload.systemPrompt.includes('3단계: Safety'))
    assert.ok(payload.systemPrompt.includes('4단계: Domain Focus'))

    // Verify Low Confidence Guardrail when expected
    if (c.expectedLowConfidence) {
      assert.equal(payload.contextPayload.isLowConfidence, true)
      assert.ok(payload.systemPrompt.includes('복수의 명반 후보가 존재합니다'))
    }

    // Verify Trine & Opposite Focus
    assert.ok(payload.contextPayload.interpretationFocus.relationTypes.includes('trine'))
    assert.ok(payload.contextPayload.interpretationFocus.relationTypes.includes('opposite'))
  })
})
