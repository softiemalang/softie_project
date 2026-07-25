/**
 * sessionQualityBenchmarkEvaluation.js
 *
 * Phase UX-1 Session Layer 7-Dimension Rubric 평가 엔진 (14점 만점)
 */

import { createInterpretationSession } from '../src/interpretationPrep/interpretationSession.js'
import { buildSessionPromptPayload } from '../src/interpretationPrep/sessionPromptAdapter.js'

export function evaluateSessionBenchmarkCase(testCase = {}) {
  const { userQuestion = '', sajuContext = {}, ziweiContext = {}, astrologyContext = {}, sessionHistory = {} } = testCase

  const sessionInstance = createInterpretationSession({
    userQuestion,
    sajuContext,
    ziweiContext,
    astrologyContext,
    sessionHistory,
  })

  const payload = buildSessionPromptPayload(sessionInstance)
  const systemPrompt = payload.systemPrompt || ''

  // 7-Dimension Session Rubric Evaluation (Max 14 points, 2 points per dimension)
  const scores = {
    intentAccuracy: 2,           // 질문 의도 및 도메인 분석 정확도
    lensPriorityRelevance: 2,    // 렌즈 참조 우선순위 적절성 (Primary/Secondary)
    systemIndependence: 2,       // 체계 간 용어 및 근거 분리 유지
    uncertaintySeparation: 2,    // 개별 불확실성 분리 고지
    nonDeterministicGuidance: 2, // 결정론적 단정 배제
    practicalActionability: 2,   // 현실적 선택 및 조언
    conversationalContinuity: 2, // 답변 마무리 대화 지속성 및 성찰 질문 여부
  }

  // 1. Intent Accuracy
  if (!systemPrompt.includes('분석된 고민 주제') || !systemPrompt.includes('상담 의도')) {
    scores.intentAccuracy = 0
  }

  // 2. Lens Priority Relevance
  if (!systemPrompt.includes('렌즈 참조 우선순위') || !systemPrompt.includes('Primary')) {
    scores.lensPriorityRelevance = 0
  }

  // 3. System Independence
  if (!systemPrompt.includes('해당 체계 전용 용어') || !systemPrompt.includes('체계 간 용어')) {
    scores.systemIndependence = 0
  }

  // 4. Uncertainty Separation
  const isAnyLow =
    (sajuContext.calculationConfidence?.stateContract?.confidence === 'low') ||
    (ziweiContext.calculationConfidence?.stateContract?.confidence === 'low') ||
    (astrologyContext.astrologyContextSnapshot?.confidence === 'low')

  if (isAnyLow) {
    if (!systemPrompt.includes('불확실 요소가 포함된 체계가 있다면') && !systemPrompt.includes('분리 고지')) {
      scores.uncertaintySeparation = 0
    }
  }

  // 5. Non-Deterministic Guidance
  if (!systemPrompt.includes('결정론적 예언을 철저히 금지')) {
    scores.nonDeterministicGuidance = 0
  }

  // 6. Practical Actionability
  if (!systemPrompt.includes('현실적') && !systemPrompt.includes('조언')) {
    scores.practicalActionability = 1
  }

  // 7. Conversational Continuity (대화 지속성 & 성찰 질문 여부)
  if (!systemPrompt.includes('성찰 질문으로 마무리하여 대화 지속하기') || !systemPrompt.includes('대화를 이어가십시오')) {
    scores.conversationalContinuity = 0
  }

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)

  return {
    caseId: testCase.id,
    caseName: testCase.name,
    scores,
    totalScore, // Max 14
    passed: totalScore >= 12,
    sessionStateSnapshot: sessionInstance.sessionState,
    payloadSnapshot: payload,
  }
}

// ----------------------------------------------------
// Session Benchmark Execution Suite
// ----------------------------------------------------
const sessionTestCases = [
  {
    id: 'session-case-1-career',
    name: '커리어/이직 관련 질문 세션 케이스',
    userQuestion: '요즘 이직을 고민 중인데, 제 직업 적성과 대외적 환경이 어떤 방향인지 궁금해요.',
    sajuContext: {
      subjectName: '홍길동',
      calculationConfidence: { stateContract: { confidence: 'high' } },
      candidateSetConsensus: { factual: { dayMaster: '甲' } },
    },
    ziweiContext: {
      subjectName: '홍길동',
      calculationConfidence: { stateContract: { confidence: 'high' } },
      candidateSetConsensus: { factual: { mingGongBranch: '寅' } },
    },
    astrologyContext: {
      subjectName: '홍길동',
      astrologyContextSnapshot: {
        confidence: 'high',
        factualSigns: { sunSign: 'Aries', ascendantSign: 'Leo' },
      },
    },
  },
  {
    id: 'session-case-2-personality-self',
    name: '내면 기질 및 왜 지치는지에 대한 성찰 질문 세션 케이스',
    userQuestion: '요즘 내가 왜 이렇게 마음이 지치고 스스로에 대해 잘 모르겠는지 고민이에요.',
    sajuContext: {
      subjectName: '김철수',
      calculationConfidence: { stateContract: { confidence: 'low' } },
      uncertainFactors: ['입춘 절기 경계 시각 출생'],
    },
    ziweiContext: {
      subjectName: '김철수',
      calculationConfidence: { stateContract: { confidence: 'high' } },
      candidateSetConsensus: { factual: { mingGongBranch: '巳' } },
    },
    astrologyContext: {
      subjectName: '김철수',
      astrologyContextSnapshot: {
        confidence: 'high',
        factualSigns: { sunSign: 'Taurus', ascendantSign: 'Virgo' },
      },
    },
  },
  {
    id: 'session-case-3-relationship',
    name: '연애 패턴 및 인간관계 인연 질문 세션 케이스',
    userQuestion: '사람들과 관계를 맺을 때 왜 자꾸 일정한 패턴이 반복되는지, 연애와 인간관계가 궁금해요.',
    sajuContext: {
      subjectName: '이영희',
      calculationConfidence: { stateContract: { confidence: 'high' } },
      candidateSetConsensus: { factual: { dayMaster: '丙' } },
    },
    ziweiContext: {
      subjectName: '이영희',
      calculationConfidence: { stateContract: { confidence: 'high' } },
      candidateSetConsensus: { factual: { mingGongBranch: '申' } },
    },
    astrologyContext: {
      subjectName: '이영희',
      astrologyContextSnapshot: {
        confidence: 'high',
        factualSigns: { sunSign: 'Scorpio', ascendantSign: 'Libra' },
      },
    },
  },
]

function runSessionBenchmark() {
  console.log('=== Phase UX-1 Session Layer Quality Benchmark Execution ===\n')
  let passedCount = 0

  sessionTestCases.forEach((tc) => {
    const res = evaluateSessionBenchmarkCase(tc)
    console.log(`[${res.passed ? 'PASS' : 'FAIL'}] ${res.caseId}: ${res.caseName}`)
    console.log(`  - Total Score: ${res.totalScore} / 14`)
    console.log(`  - Primary Lenses: [${res.sessionStateSnapshot.lensPriority.primary.join(', ')}]`)
    console.log(`  - Scores:`, JSON.stringify(res.scores), '\n')
    if (res.passed) passedCount++
  })

  console.log(`Summary: ${passedCount} / ${sessionTestCases.length} Passed.`)
}

if (process.argv[1].endsWith('sessionQualityBenchmarkEvaluation.js')) {
  runSessionBenchmark()
}
