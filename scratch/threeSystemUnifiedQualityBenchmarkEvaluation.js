/**
 * threeSystemUnifiedQualityBenchmarkEvaluation.js
 *
 * 사주 · 자미두수 · 서양점성학 3대 체계 통합 해석 품질 평가 엔진 (6-Dimension 3-System Rubric)
 */

import { createUnifiedInterpretationContext } from '../src/interpretationPrep/unifiedInterpretationContext.js'
import { buildUnifiedPromptPayload } from '../src/interpretationPrep/unifiedPromptAdapter.js'

export function evaluate3SystemUnifiedBenchmarkCase(testCase = {}) {
  const { sajuContext = {}, ziweiContext = {}, astrologyContext = {}, domainProfile = 'personality' } = testCase

  const unifiedCtx = createUnifiedInterpretationContext(sajuContext, ziweiContext, astrologyContext)
  const payload = buildUnifiedPromptPayload(unifiedCtx, domainProfile)
  const systemPrompt = payload.systemPrompt || ''

  // 6-Dimension 3-System Rubric Evaluation (Max 12 points, 2 points per dimension)
  const scores = {
    systemIndependencePreservation: 2, // 체계 간 용어/논리 오염 배제
    evidenceTraceability: 2,           // 근거 출처 추적 가능성
    uncertaintySeparation: 2,          // 개별 불확실성 분리 고지
    multiLensSynthesis: 2,             // 다차원 층위적 관점 보완 (synthesis)
    nonDeterministicGuidance: 2,       // 비결정론적 성찰 유도
    practicalReflection: 2,            // 실용적 주체적 선택 유도
  }

  // 1. System Independence Preservation
  if (
    !systemPrompt.includes('각 체계의 용어') ||
    !systemPrompt.includes('해당 체계 내부 의미로만 설명') ||
    !systemPrompt.includes('인과관계로 연결')
  ) {
    scores.systemIndependencePreservation = 0
  }

  // 2. Evidence Traceability
  if (
    !systemPrompt.includes('사주 관점') ||
    !systemPrompt.includes('자미두수 관점') ||
    !systemPrompt.includes('서양점성학 관점')
  ) {
    scores.evidenceTraceability = 0
  }

  // 3. Uncertainty Separation
  const isAnyLow =
    (sajuContext.calculationConfidence?.stateContract?.confidence === 'low') ||
    (ziweiContext.calculationConfidence?.stateContract?.confidence === 'low') ||
    (astrologyContext.astrologyContextSnapshot?.confidence === 'low')

  if (isAnyLow) {
    if (!systemPrompt.includes('불확실 요소가 포함되어 있으므로') && !systemPrompt.includes('분리 고지')) {
      scores.uncertaintySeparation = 0
    }
  }

  // 4. Multi-Lens Synthesis
  if (!systemPrompt.includes('공통 테마') || !systemPrompt.includes('통합 조망(Synthesis)')) {
    scores.multiLensSynthesis = 1
  }

  // 5. Non-Deterministic Guidance
  if (!systemPrompt.includes('단정') && !systemPrompt.includes('금지')) {
    scores.nonDeterministicGuidance = 0
  }

  // 6. Practical Reflection
  if (!systemPrompt.includes('주체적') || !systemPrompt.includes('탐색')) {
    scores.practicalReflection = 1
  }

  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)

  return {
    caseId: testCase.id,
    caseName: testCase.name,
    scores,
    totalScore, // Max 12
    passed: totalScore >= 10,
    unifiedContextSnapshot: unifiedCtx,
    payloadSnapshot: payload,
  }
}

// ----------------------------------------------------
// Benchmark Execution Suite
// ----------------------------------------------------
const benchmarkCases = [
  {
    id: 'case-1-all-high',
    name: '3대 체계 모두 고신뢰도(High Confidence) 정상 케이스',
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
    id: 'case-2-saju-low-uncertainty',
    name: '사주 절기 경계(Low Confidence) + 자미두수 High + 점성학 High 케이스',
    sajuContext: {
      subjectName: '김철수',
      calculationConfidence: { stateContract: { confidence: 'low' } },
      uncertainFactors: ['입춘 절기 경계 시각 출생 (후보 2개)'],
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
    id: 'case-3-astrology-asc-low',
    name: '사주 High + 자미두수 High + 점성학 ASC 경계(Low Confidence) 케이스',
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
        confidence: 'low',
        uncertainFactors: ['ASC 경계 도수 (후보 2개 하우스 구조)'],
        factualSigns: { sunSign: 'Scorpio', ascendantSign: 'Libra' },
      },
    },
  },
]

function runBenchmark() {
  console.log('=== 3-System Unified Quality Benchmark Execution ===\n')
  let passedCount = 0

  benchmarkCases.forEach((tc) => {
    const res = evaluate3SystemUnifiedBenchmarkCase(tc)
    console.log(`[${res.passed ? 'PASS' : 'FAIL'}] ${res.caseId}: ${res.caseName}`)
    console.log(`  - Total Score: ${res.totalScore} / 12`)
    console.log(`  - Scores:`, JSON.stringify(res.scores))
    console.log(`  - System Agreement: ${res.unifiedContextSnapshot.systemAgreement.note}`)
    console.log(`  - Overall Guidance: ${res.unifiedContextSnapshot.unifiedConfidence.overallGuidance}\n`)
    if (res.passed) passedCount++
  })

  console.log(`Summary: ${passedCount} / ${benchmarkCases.length} Passed.`)
}

if (process.argv[1].endsWith('threeSystemUnifiedQualityBenchmarkEvaluation.js')) {
  runBenchmark()
}
