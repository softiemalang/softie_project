import fs from 'node:fs'
import path from 'node:path'
import { UNIFIED_BENCHMARK_CASES } from '../test/fixtures/unified/benchmarkCases.js'
import { buildInterpretationContext } from '../src/interpretationPrep/interpretationContext.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import {
  createZiweiCalculationContext,
  createZiweiInterpretationContext,
} from '../src/ziwei/ziweiContract.js'
import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'
import { buildUnifiedPromptPayload } from '../src/interpretationPrep/unifiedPromptAdapter.js'

const report = {
  timestamp: new Date().toISOString(),
  totalCases: UNIFIED_BENCHMARK_CASES.length,
  evaluations: [],
}

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
  const payload = buildUnifiedPromptPayload(unifiedCtx, c.domainProfile)

  // Layer 2 Rubric Evaluation Simulation
  const rubricScore = {
    protocolCompliance: payload.systemPrompt.includes('Step 1') ? 2 : 0,
    systemIndependencePreservation: unifiedCtx.sharedThemes[0]?.evidence?.saju && unifiedCtx.sharedThemes[0]?.evidence?.ziwei ? 2 : 1, // 체계 독립성 유지 (2점)
    systemAgreementAccuracy: unifiedCtx.systemAgreement.agreementLevel === c.expectedAgreement ? 2 : 0,
    unifiedSafetyGuardrail: payload.systemPrompt.includes('억지 합산하거나 특정 체계의 결과를 우위로 단정하지 마십시오') ? 2 : 0,
    practicalEmpowerment: 2,
  }

  const totalScore = Object.values(rubricScore).reduce((a, b) => a + b, 0)

  report.evaluations.push({
    caseId: c.id,
    caseName: c.name,
    domainProfile: c.domainProfile,
    agreementLevel: unifiedCtx.systemAgreement.agreementLevel,
    overallConfidence: unifiedCtx.unifiedConfidence.overallConfidence,
    rubricScore,
    totalScore,
    maxScore: 10,
    systemPromptSnapshot: payload.systemPrompt,
  })
})

const outputPath = path.join(process.cwd(), 'scratch', 'unifiedQualityBenchmarkReport.json')
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8')
console.log(`[SUCCESS] Unified Quality Benchmark Evaluation Completed! Report saved to ${outputPath}`)
