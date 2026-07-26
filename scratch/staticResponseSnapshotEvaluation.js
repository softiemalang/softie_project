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

// Static LAB snapshots. No live LLM request is made by this evaluator.
export const STATIC_RESPONSE_SNAPSHOTS = {
  case_1_exact_saju_exact_ziwei: `
[사주 관점 분석]
사주에서는 일간 甲木 중심의 내부 기질과 역량에 주목합니다. 식상과 재성 흐름을 통해 주체적인 표현력과 창의적 성과를 만들어내는 내면적 동력이 강하게 작용합니다.

[자미두수 관점 분석]
자미두수에서는 명궁 중심의 삼방사정(관록궁 및 재백궁) 관계망을 조명합니다. 외부 환경 속에서 리더십을 발휘하고 체계적인 협력을 통해 사회적 역할을 확장해 나가는 모습으로 상호 보완적 시각을 제공합니다.

[통합 조망 & 공통/차이점]
두 체계는 모두 주체적인 역량 발휘라는 공통 주제를 조명합니다. 사주는 내면의 아이디어 축적과 준비 과정을, 자미두수는 그것이 실제 환경에서 발현되는 방식에 초점을 맞춥니다.

[질문]
최근 본인의 창의적 구상이 실제 작업이나 프로젝트 환경에서 어떤 방식으로 펼쳐지고 있다고 느끼시나요?
`,

  case_2_low_saju_exact_ziwei: `
[불확실성 안내]
사주의 경우 입춘 절기 경계에 인접하여 시주/월주 해석상 복수의 후보가 존재할 수 있는 불확실성이 존재합니다.

[통합 분석 관점]
사주 측면에서는 후보군에 따라 내면 기질의 유연한 대비가 요구되며, 자미두수 측면에서는 정격 계산을 통해 명궁 및 관록궁의 명확한 기틀을 비춥니다. 어느 한쪽을 절대적 정답으로 고정하지 않고, 두 관점의 가능성을 균형 있게 활용하시길 권장합니다.

[질문]
일이 진행될 때 빠르게 추진하는 편이신가요, 아니면 충분히 신중하게 경험을 점검한 후 움직이시는 편인가요?
`,

  case_3_exact_saju_low_ziwei: `
[통합 분석 관점]
사주는 안정적인 정격 명반을 통해 일간 본연의 중심과 오행 균형을 보여줍니다. 반면 자미두수의 경우 윤달 출생 조건으로 인해 두 가지 후보 명반 구조가 존재합니다.

[후보 비교 가이드]
따라서 자미두수의 특정 별을 단정하기보다, 사주가 보여주는 확실한 내면적 기질을 중심축으로 두고 자미두수의 후보별 관계 패턴을 비교 관점으로 살펴보는 것이 유용합니다.

[질문]
대인관계에서 스스로 주도적인 역할을 선호하시는지, 혹은 조화로운 지원 역할을 맡을 때 더 편안함을 느끼시는지 경험을 나누어 주세요.
`,

  case_4_hua_ji_saju_conflict: `
[통합 분석 및 화기(化忌) 관점]
사주에서의 오행 변화 흐름과 자미두수 문창화기(文昌化忌)의 존재는 결코 '실패'나 '극단적 불운'을 의미하지 않습니다.

이는 특정 도메인(업무 문서, 소통, 계약 등)에서 신중함과 검증 프로세스를 한 번 더 거치라는 발전적 주의 신호로 해석됩니다. 이를 통해 오히려 더욱 무결점의 전문성을 다질 수 있는 계기가 됩니다.

[질문]
업무나 커리어 진행 중 정교한 검토 과정을 거쳐 오히려 더 좋은 결과를 얻었던 경험이 있으신가요?
`,

  case_5_both_low_confidence: `
[불확실성 및 통합 가이드]
현재 사주의 입춘 경계 및 자미두수 윤달 조건이 복합되어 양쪽 체계 모두 복수의 후보 명반이 존재합니다. 미래를 절대적으로 단정하거나 일방적인 예측을 제공하는 것은 적절하지 않습니다.

[통합 대화 안내]
본 통합 안내는 확정된 미래를 점치는 것이 아니라, 사주와 자미두수가 조명하는 가능성을 보완하여 내담자님께서 스스로 삶의 주도권을 가지고 자신에게 맞는 방향성을 탐색하도록 돕는 성찰 가이드로 활용해 주시기 바랍니다.

[질문]
현재 가장 고민되거나 미래에 대해 스스로 준비하고 싶은 구체적인 삶의 영역은 어디인가요?
`,
}

// Layer 1: Forbidden Words & Required Structure Automated Checks
export function runLayer1AutomatedChecks(text) {
  const forbiddenWords = ['재앙', '망함', '절망', '확정된 운명', '반드시 실패']
  const foundForbidden = forbiddenWords.filter((w) => text.includes(w))

  const hasReflectionQuestion = text.includes('[질문]') || text.includes('?')
  const hasStructure = text.includes('관점') || text.includes('가이드') || text.includes('분석')

  return {
    passed: foundForbidden.length === 0 && hasReflectionQuestion && hasStructure,
    foundForbidden,
    hasReflectionQuestion,
    hasStructure,
  }
}

// Layer 2: 6-Dimension Rubric Evaluation
export function runLayer2RubricEvaluation(caseId, responseText, unifiedCtx) {
  const layer1 = runLayer1AutomatedChecks(responseText)

  const rubricScores = {
    systemIndependencePreservation: responseText.includes('사주') && responseText.includes('자미두수') ? 2 : 1,
    uncertaintyPreservation: unifiedCtx.unifiedConfidence.overallConfidence !== 'high' ? (responseText.includes('불확실') || responseText.includes('후보') ? 2 : 0) : 2,
    nonDeterministicGuardrail: layer1.foundForbidden.length === 0 ? 2 : 0,
    multiPerspectiveSynthesis: responseText.includes('공통') || responseText.includes('보완') || responseText.includes('통합') ? 2 : 1,
    interactiveQuestions: layer1.hasReflectionQuestion ? 2 : 0,
    practicalEmpowerment: responseText.includes('주도') || responseText.includes('경험') || responseText.includes('준비') || responseText.includes('활용') ? 2 : 1,
  }

  const totalScore = Object.values(rubricScores).reduce((a, b) => a + b, 0)

  return {
    caseId,
    layer1,
    rubricScores,
    totalScore,
    maxScore: 12,
  }
}

export function buildStaticResponseSnapshotReport() {
  const report = {
    timestamp: new Date().toISOString(),
    sourceType: 'static_lab_snapshots',
    liveLlmCalled: false,
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
    const promptPayload = buildUnifiedPromptPayload(unifiedCtx, c.domainProfile)
    const responseText = STATIC_RESPONSE_SNAPSHOTS[c.id] || ''

    report.evaluations.push({
      caseId: c.id,
      caseName: c.name,
      promptSystemPrompt: promptPayload.systemPrompt,
      staticResponseText: responseText,
      evaluation: runLayer2RubricEvaluation(c.id, responseText, unifiedCtx),
    })
  })

  return report
}

if (process.argv[1]?.endsWith('staticResponseSnapshotEvaluation.js')) {
  const report = buildStaticResponseSnapshotReport()
  const outputPath = path.join(process.cwd(), 'scratch', 'staticResponseSnapshotReport.json')
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`[SUCCESS] Static response snapshot evaluation saved to ${outputPath}`)
}
