/**
 * threeSystemActualLlmResponseEvaluation.js
 *
 * 3대 체계 통합 프롬프트 페이로드 생성 및 3-Layer 자동 평가 보고서 JSON 산출 스크립트
 */

import fs from 'fs'
import path from 'path'
import { evaluate3SystemUnifiedBenchmarkCase } from './threeSystemUnifiedQualityBenchmarkEvaluation.js'

const testCases = [
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

function generateReport() {
  const evaluations = testCases.map((tc) => evaluate3SystemUnifiedBenchmarkCase(tc))
  const totalPassed = evaluations.filter((e) => e.passed).length

  const report = {
    timestamp: new Date().toISOString(),
    engine: '3-System Unified Interpretation Engine (Saju + Ziwei + Western Astrology)',
    totalCases: testCases.length,
    passedCases: totalPassed,
    passRate: `${Math.round((totalPassed / testCases.length) * 100)}%`,
    rubricCriteria: [
      'systemIndependencePreservation (체계 간 용어/논리 오염 배제)',
      'evidenceTraceability (근거 출처 추적 가능성)',
      'uncertaintySeparation (개별 불확실성 분리 고지)',
      'multiLensSynthesis (다차원 층위적 관점 보완)',
      'nonDeterministicGuidance (비결정론적 성찰 유도)',
      'practicalReflection (실용적 주체적 선택 유도)',
    ],
    evaluations,
  }

  const outputPath = path.join(process.cwd(), 'scratch', 'threeSystemUnifiedQualityBenchmarkReport.json')
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`[Report Generated] Saved report to ${outputPath}`)
}

generateReport()
