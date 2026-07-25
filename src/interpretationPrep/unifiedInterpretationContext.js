/**
 * unifiedInterpretationContext.js
 *
 * 사주 InterpretationContext 및 자미두수 ZiweiInterpretationContext를 융합하는
 * 통합 해석 오케스트레이션 모듈
 */

export function createUnifiedInterpretationContext(sajuContext = {}, ziweiContext = {}) {
  const saju = sajuContext || {}
  const ziwei = ziweiContext || {}

  const sajuConfidence = saju.calculationConfidence?.stateContract?.confidence || 'high'
  const ziweiConfidence = ziwei.calculationConfidence?.stateContract?.confidence || 'high'

  const isAnyLowConfidence = sajuConfidence === 'low' || ziweiConfidence === 'low'
  const isBothLowConfidence = sajuConfidence === 'low' && ziweiConfidence === 'low'

  // 1. systemAgreement (체계 간 일치도 및 보완성)
  let agreementLevel = 'strong_agreement'
  if (isBothLowConfidence) {
    agreementLevel = 'insufficient_data'
  } else if (isAnyLowConfidence) {
    agreementLevel = 'partial_agreement'
  }

  const systemAgreement = {
    agreementLevel,
    note:
      agreementLevel === 'strong_agreement'
        ? '사주와 자미두수 두 명리 체계가 안정적인 정격 명반 구조상에서 상호 보완적 관점을 제공합니다.'
        : '일부 조건(시간 미상/윤달/절기 경계)으로 인해 복수의 명반 후보가 존재하므로 입체적 보완 서술이 요구됩니다.',
  }

  // 2. sharedThemes (공통 테마 - 근거 보존 구조)
  const sharedThemes = [
    {
      themeId: 'core_competency',
      label: '주체적 역량 발휘 및 자기 표현',
      evidence: {
        saju: ['일간 및 식상/재성 기질 흐름'],
        ziwei: ['명궁 자체 주성 및 삼방사정(관록궁/재백궁) 구조'],
      },
      sajuPerspective: saju.candidateSetConsensus?.factual?.dayMaster
        ? `사주는 일간 ${saju.candidateSetConsensus.factual.dayMaster} 중심의 내부적 기질과 역량에 주목합니다.`
        : '사주는 일간 중심의 내부 기질과 에너지 흐름에 주목합니다.',
      ziweiPerspective: ziwei.candidateSetConsensus?.factual?.mingGongBranch
        ? `자미두수는 ${ziwei.candidateSetConsensus.factual.mingGongBranch}宮 명궁 중심의 삼방사정 관계망에 주목합니다.`
        : '자미두수는 명궁 중심의 삼방사정 환경 관계망에 주목합니다.',
    },
  ]

  // 3. differentPerspectives (관점 차이 - 입체적 보완)
  const differentPerspectives = [
    {
      perspectiveId: 'internal_vs_external',
      label: '내면적 기질(사주) vs 대외적 환경 역동성(자미두수)',
      description:
        '사주는 내면의 오행 기질과 에너지 축적을 비추며, 자미두수는 사회적 관계망과 환경 속에서의 표현 방식을 조명합니다.',
    },
  ]

  // 4. unifiedConfidence (통합 신뢰도)
  const unifiedConfidence = {
    overallConfidence: isBothLowConfidence ? 'low' : isAnyLowConfidence ? 'medium' : 'high',
    sajuConfidence,
    ziweiConfidence,
    uncertainFactors: [
      ...(saju.uncertainFactors || []),
      ...(ziwei.uncertainFactors || []),
    ],
    warnings: [
      ...(saju.interpretationWarnings || []),
      ...(ziwei.interpretationWarnings || []),
    ],
  }

  return {
    systemType: 'unified_saju_ziwei',
    subjectName: saju.subjectName || ziwei.subjectName || '내담자',
    systemAgreement,
    sharedThemes,
    differentPerspectives,
    unifiedConfidence,
    sajuContext: saju,
    ziweiContext: ziwei,
  }
}
