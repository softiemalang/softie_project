/**
 * sessionActualLlmResponseEvaluation.js
 *
 * Phase UX-1 Session Layer 평가 보고서 JSON 산출 스크립트
 */

import fs from 'fs'
import path from 'path'
import { evaluateSessionBenchmarkCase } from './sessionQualityBenchmarkEvaluation.js'

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

function generateSessionReport() {
  const evaluations = sessionTestCases.map((tc) => evaluateSessionBenchmarkCase(tc))
  const totalPassed = evaluations.filter((e) => e.passed).length

  const report = {
    timestamp: new Date().toISOString(),
    engine: 'Phase UX-1 Interpretation Session Engine (Topic Router + Priority Ordering + Strict Isolation)',
    totalCases: sessionTestCases.length,
    passedCases: totalPassed,
    passRate: `${Math.round((totalPassed / sessionTestCases.length) * 100)}%`,
    rubricCriteria: [
      'intentAccuracy (질문 의도 및 도메인 분석 정확도)',
      'lensPriorityRelevance (Primary/Secondary 렌즈 참조 순서 적절성)',
      'systemIndependence (체계 간 용어 및 근거 분리 유지)',
      'uncertaintySeparation (개별 불확실성 분리 고지)',
      'nonDeterministicGuidance (결정론적 단정 배제)',
      'practicalActionability (현실적 주체적 조언)',
      'conversationalContinuity (마무리 대화 지속성 및 성찰 질문)',
    ],
    evaluations,
  }

  const outputPath = path.join(process.cwd(), 'scratch', 'sessionQualityBenchmarkReport.json')
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`[Session Report Generated] Saved report to ${outputPath}`)
}

generateSessionReport()
