/**
 * unifiedInterpretationContext.js
 *
 * 사주, 자미두수, 서양 점성학(Western Astrology) 3대 체계를 융합하는
 * 통합 해석 오케스트레이션 모듈
 */

export function createUnifiedInterpretationContext(sajuContext = {}, ziweiContext = {}, astrologyContext = {}) {
  const saju = sajuContext || {}
  const ziwei = ziweiContext || {}
  const astrology = astrologyContext || {}

  const sajuConfidence = saju.calculationConfidence?.stateContract?.confidence || saju.unifiedConfidence?.sajuConfidence || 'high'
  const ziweiConfidence = ziwei.calculationConfidence?.stateContract?.confidence || ziwei.unifiedConfidence?.ziweiConfidence || 'high'
  const astrologyConfidence = astrology.calculationConfidence?.stateContract?.confidence || astrology.astrologyContextSnapshot?.confidence || 'high'

  const confMap = { saju: sajuConfidence, ziwei: ziweiConfidence, astrology: astrologyConfidence }
  const lowConfSystems = Object.keys(confMap).filter((k) => confMap[k] === 'low')
  const isAnyLowConfidence = lowConfSystems.length > 0
  const isAllLowConfidence = lowConfSystems.length === 3

  // 1. systemAgreement (일치 점수가 아닌 3개 렌즈의 층위적 보완 및 시너지)
  let agreementLevel = 'multi_lens_synthesis'
  if (isAllLowConfidence) {
    agreementLevel = 'insufficient_data'
  } else if (isAnyLowConfidence) {
    agreementLevel = 'partial_uncertainty_preserved'
  }

  const systemAgreement = {
    agreementLevel,
    note:
      agreementLevel === 'multi_lens_synthesis'
        ? '사주(내면 오행 기질), 자미두수(대외 환경·관계), 점성학(원형적 심리·상징 시간선) 3대 체계가 다차원적 입체 관점을 제공합니다.'
        : `일부 체계(${lowConfSystems.join(', ')})의 불확실성 요소로 인해 정밀 측정된 확정 데이터 중심의 보완적 서술이 요구됩니다.`,
  }

  // 2. sharedThemes (3-System 관점 보존 및 통합 synthesis 서술)
  const sharedThemes = [
    {
      themeId: 'core_competency_and_expression',
      label: '주체적 역량 발휘 및 자기 표현',
      evidence: {
        saju: saju.candidateSetConsensus?.factual?.dayMaster ? [`일간 ${saju.candidateSetConsensus.factual.dayMaster} 중심 오행 흐름`] : ['일간 중심 내부 기질'],
        ziwei: ziwei.candidateSetConsensus?.factual?.mingGongBranch ? [`명궁 ${ziwei.candidateSetConsensus.factual.mingGongBranch}宮 삼방사정 배치`] : ['명궁 삼방사정 환경 관계망'],
        astrology: astrology.astrologyContextSnapshot?.factualSigns?.sunSign ? [`Sun in ${astrology.astrologyContextSnapshot.factualSigns.sunSign}, Ascendant in ${astrology.astrologyContextSnapshot.factualSigns.ascendantSign}`] : ['태양/달/상승궁 원형 상징'],
      },
      sajuPerspective: saju.candidateSetConsensus?.factual?.dayMaster
        ? `사주는 일간 ${saju.candidateSetConsensus.factual.dayMaster} 중심의 내면적 에너지와 축적된 역량에 주목합니다.`
        : '사주는 일간 중심의 내면 기질과 오행 생극 제화에 주목합니다.',
      ziweiPerspective: ziwei.candidateSetConsensus?.factual?.mingGongBranch
        ? `자미두수는 ${ziwei.candidateSetConsensus.factual.mingGongBranch}宮 명궁 중심의 사회적 관계망과 대외적 역동성에 주목합니다.`
        : '자미두수는 명궁 중심의 사회적 환경과 명반 체계에 주목합니다.',
      astrologyPerspective: astrology.astrologyContextSnapshot?.factualSigns?.sunSign
        ? `점성학은 ${astrology.astrologyContextSnapshot.factualSigns.sunSign} 태양 및 상승궁 중심의 심리 원형과 의식 발전 여정에 주목합니다.`
        : '점성학은 태양, 달, 상승궁 중심의 원형적 심리 역동과 상징적 시간선에 주목합니다.',
      synthesis:
        '세 체계는 모두 주체적 표현이라는 동일한 삶의 주제를 비추지만, 사주는 내면의 오행 동력, 자미두수는 사회적 환경 배치, 점성학은 심리적 원형과 발전 여정이라는 서로 다른 층위를 충실히 보여줍니다.',
    },
  ]

  // 3. differentPerspectives (각 체계 고유의 독자적 렌즈)
  const differentPerspectives = [
    {
      perspectiveId: 'internal_vs_external_vs_archetypal',
      label: '내면 기질(사주) vs 환경 역동성(자미두수) vs 원형적 시간선(점성학)',
      description:
        '사주는 오행의 기운 축적과 조화를 비추고, 자미두수는 삶의 무대와 인연의 관계망을 조명하며, 서양 점성학은 심리적 상징과 우주적 시기의 전개를 보여줍니다.',
    },
  ]

  // 4. unifiedConfidence (평균화 없이 개별 보존 & overallGuidance 제공)
  let overallGuidance = '세 체계 모두 안정적인 데이터 계약 상태를 유지하고 있습니다.'
  if (isAllLowConfidence) {
    overallGuidance = '세 체계 모두 경계 후보 또는 불확실 요소를 포함하고 있어 개연성 있는 보충 서술 위주로 진행됩니다.'
  } else if (isAnyLowConfidence) {
    overallGuidance = `일부 체계(${lowConfSystems.join(', ')})는 경계 후보 요소를 포함하되, 나머지 확정된 체계의 데이터는 안정적인 참고 자료가 됩니다.`
  }

  const unifiedConfidence = {
    overallConfidence: isAllLowConfidence ? 'low' : isAnyLowConfidence ? 'medium' : 'high',
    sajuConfidence,
    ziweiConfidence,
    astrologyConfidence,
    overallGuidance,
    uncertainFactors: [
      ...(saju.uncertainFactors || saju.unifiedConfidence?.uncertainFactors || []),
      ...(ziwei.uncertainFactors || ziwei.unifiedConfidence?.uncertainFactors || []),
      ...(astrology.astrologyContextSnapshot?.uncertainFactors || []),
    ],
    warnings: [
      ...(saju.interpretationWarnings || saju.unifiedConfidence?.warnings || []),
      ...(ziwei.interpretationWarnings || ziwei.unifiedConfidence?.warnings || []),
      ...(astrology.astrologyContextSnapshot?.warnings || []),
    ],
  }

  return {
    systemType: 'unified_3system_saju_ziwei_astrology',
    subjectName: saju.subjectName || ziwei.subjectName || astrology.subjectName || '내담자',
    systemAgreement,
    sharedThemes,
    differentPerspectives,
    unifiedConfidence,
    sajuContext: saju,
    ziweiContext: ziwei,
    astrologyContext: astrology,
  }
}

