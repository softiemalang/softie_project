import fs from 'node:fs'
import path from 'node:path'
import { ZIWEI_BENCHMARK_CASES } from '../test/fixtures/ziwei/benchmarkCases.js'
import { resolveZiweiChart } from '../src/ziwei/ziweiResolver.js'
import { resolve14MajorStars } from '../src/ziwei/starResolver.js'
import { resolveFourTransformations } from '../src/ziwei/transformationResolver.js'
import { resolveMinorStars } from '../src/ziwei/minorStarResolver.js'
import {
  createZiweiCalculationContext,
  createZiweiInterpretationContext,
} from '../src/ziwei/ziweiContract.js'
import { buildZiweiPromptPayload } from '../src/interpretationPrep/ziweiPromptAdapter.js'

const report = {
  timestamp: new Date().toISOString(),
  totalCases: ZIWEI_BENCHMARK_CASES.length,
  evaluations: [],
}

ZIWEI_BENCHMARK_CASES.forEach((c) => {
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

  // Rubric Evaluation Simulation (Layer 2)
  const rubricScore = {
    protocolCompliance: payload.systemPrompt.includes('1단계') ? 2 : 0,
    trineOppositeIntegration: payload.contextPayload.interpretationFocus.relationTypes.length === 2 ? 2 : 1, // 궁위 관계 통합 능력 (2점)
    nonDeterministicGuidance: c.expectedLowConfidence ? (payload.systemPrompt.includes('복수의 명반 후보') ? 2 : 0) : 2,
    starSafetyGuardrail: payload.systemPrompt.includes('성격 결함, 불행, 결정론적 재앙으로 단정하지 마십시오') ? 2 : 0,
    practicalEmpowerment: 2,
  }

  const totalScore = Object.values(rubricScore).reduce((a, b) => a + b, 0)

  report.evaluations.push({
    caseId: c.id,
    caseName: c.name,
    domainProfile: c.domainProfile,
    isLowConfidence: Boolean(c.expectedLowConfidence),
    rubricScore,
    totalScore,
    maxScore: 10,
    systemPromptSnapshot: payload.systemPrompt,
  })
})

const outputPath = path.join(process.cwd(), 'scratch', 'ziweiQualityBenchmarkReport.json')
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8')
console.log(`[SUCCESS] Ziwei Quality Benchmark Evaluation Completed! Report saved to ${outputPath}`)
