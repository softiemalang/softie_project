import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import {
  createZiweiCalculationContext,
  createZiweiInterpretationContext,
} from '../src/ziwei/ziweiContract.js'
import { buildZiweiPromptPayload, ZIWEI_SAFETY_GUARDRAILS } from '../src/interpretationPrep/ziweiPromptAdapter.js'

test('ziweiPromptAdapter: builds 4-step protocol prompt payload with trine/opposite focus', () => {
  const chartCtx = resolveZiweiChart({
    subjectName: '프롬프트테스트',
    lunarMonth: 5,
    hourBranch: '午',
    birthYearStem: '庚',
  })

  chartCtx.chart.majorStars = resolve14MajorStars({
    bureauNumber: chartCtx.chart.fiveElementsBureau.number,
    lunarDay: 15,
    palaces: chartCtx.chart.palaces,
  }).majorStars

  const calcCtx = createZiweiCalculationContext({
    input: { subjectName: '프롬프트테스트' },
    chart: chartCtx.chart,
    calculationMeta: chartCtx.calculationMeta,
  })

  const interpCtx = createZiweiInterpretationContext(calcCtx)
  const payload = buildZiweiPromptPayload(interpCtx, 'career')

  assert.ok(payload.systemPrompt.includes('1단계: Consensus'))
  assert.ok(payload.systemPrompt.includes('2단계: Variance'))
  assert.ok(payload.systemPrompt.includes('3단계: Safety'))
  assert.ok(payload.systemPrompt.includes('4단계: Domain Focus'))

  // Safety guardrails
  ZIWEI_SAFETY_GUARDRAILS.forEach((g) => {
    assert.ok(payload.systemPrompt.includes(g))
  })

  // Interpretation focus payload
  assert.equal(payload.contextPayload.interpretationFocus.primaryPalace, 'career')
  assert.ok(payload.contextPayload.interpretationFocus.relatedPalaces.includes('life'))
})

test('ziweiPromptAdapter: forbids deterministic prediction and demands candidate comparison when low confidence', () => {
  const calcCtx = createZiweiCalculationContext({
    input: { subjectName: '윤달테스트', isLeapMonth: true },
    chart: {},
    calculationMeta: { confidence: 'low', verificationStatus: 'needs_verification' },
  })

  const interpCtx = createZiweiInterpretationContext(calcCtx)
  const payload = buildZiweiPromptPayload(interpCtx, 'relationship')

  assert.equal(payload.contextPayload.isLowConfidence, true)
  assert.ok(payload.systemPrompt.includes('복수의 명반 후보가 존재합니다'))
})
