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
import {
  STATIC_RESPONSE_SNAPSHOTS,
  runLayer1AutomatedChecks,
  runLayer2RubricEvaluation,
} from '../scratch/staticResponseSnapshotEvaluation.js'

test('staticResponseSnapshot: validates rubric checks without making a live LLM request', () => {
  UNIFIED_BENCHMARK_CASES.forEach((c) => {
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
    const unifiedCtx = createUnifiedInterpretationContext(sajuCtx, ziweiCtx)

    const responseText = STATIC_RESPONSE_SNAPSHOTS[c.id] || ''

    // Layer 1 Automated Checks
    const layer1 = runLayer1AutomatedChecks(responseText)
    assert.equal(layer1.passed, true, `Layer 1 failed for ${c.id}: ${JSON.stringify(layer1)}`)
    assert.equal(layer1.foundForbidden.length, 0)
    assert.equal(layer1.hasReflectionQuestion, true)

    // Layer 2 6-Dimension Rubric
    const evalResult = runLayer2RubricEvaluation(c.id, responseText, unifiedCtx)
    assert.equal(evalResult.totalScore, 12, `Case failed: ${c.id}, score: ${evalResult.totalScore}, rubric: ${JSON.stringify(evalResult.rubricScores)}`)
    assert.equal(evalResult.rubricScores.systemIndependencePreservation, 2)
    assert.equal(evalResult.rubricScores.nonDeterministicGuardrail, 2)
    assert.equal(evalResult.rubricScores.interactiveQuestions, 2)
  })
})
