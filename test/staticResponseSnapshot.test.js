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
  buildStaticResponseSnapshotReport,
} from '../scratch/staticResponseSnapshotEvaluation.js'

test('staticResponseSnapshot: validates rubric checks without making a live LLM request', () => {
  UNIFIED_BENCHMARK_CASES.forEach((c) => {
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

test('staticResponseSnapshot: buildStaticResponseSnapshotReport path evaluates all 5 benchmark cases to 12/12 score', () => {
  const report = buildStaticResponseSnapshotReport()
  assert.equal(report.totalCases, 5)
  assert.equal(report.evaluations.length, 5)
  report.evaluations.forEach((item) => {
    assert.equal(item.evaluation.totalScore, 12, `Report evaluation failed for ${item.caseId}: score ${item.evaluation.totalScore}`)
    assert.equal(item.evaluation.rubricScores.uncertaintyPreservation, 2, `Uncertainty preservation failed for ${item.caseId}`)
  })
})
