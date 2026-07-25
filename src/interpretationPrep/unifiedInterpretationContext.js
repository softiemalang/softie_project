/**
 * unifiedInterpretationContext.js
 *
 * 실제 계산 자료가 있는 체계만 해석 문맥에 포함하는 오케스트레이션 모듈.
 * 미지원 체계는 상태와 경고만 보존하며 관점이나 합성 결과를 만들지 않는다.
 */

export function createUnifiedInterpretationContext(sajuContext = {}, ziweiContext = {}, astrologyContext = {}) {
  const saju = sajuContext || {}
  const ziwei = ziweiContext || {}
  const astrology = astrologyContext || {}

  const hasSuppliedContext = (context) => Object.keys(context).length > 0 && !context.status
  const hasSajuData = Boolean(saju.candidateSetConsensus?.factual?.dayMaster || hasSuppliedContext(saju))
  const hasZiweiData = Boolean(
    ziwei.raw
    || ziwei.candidateSetConsensus?.factual?.mingGongBranch
    || hasSuppliedContext(ziwei)
  )
  const hasAstrologyData = Boolean(
    astrology.raw
    || astrology.astrologyContextSnapshot?.factualSigns?.sunSign
    || hasSuppliedContext(astrology)
  )
  const systemAvailability = {
    saju: hasSajuData ? 'available' : 'unavailable',
    ziwei: hasZiweiData ? 'available' : (ziwei.status || 'unavailable'),
    astrology: hasAstrologyData ? 'available' : (astrology.status || 'unavailable'),
  }
  const availableSystems = Object.entries(systemAvailability)
    .filter(([, status]) => status === 'available')
    .map(([system]) => system)

  const sajuConfidence = hasSajuData
    ? (saju.calculationConfidence?.stateContract?.confidence || 'high')
    : 'not_available'
  const ziweiConfidence = hasZiweiData
    ? (ziwei.calculationConfidence?.stateContract?.confidence || ziwei.unifiedConfidence?.ziweiConfidence || 'high')
    : 'not_available'
  const astrologyConfidence = hasAstrologyData
    ? (astrology.calculationConfidence?.stateContract?.confidence || astrology.astrologyContextSnapshot?.confidence || 'high')
    : 'not_available'
  const availableConfidences = [
    hasSajuData ? sajuConfidence : null,
    hasZiweiData ? ziweiConfidence : null,
    hasAstrologyData ? astrologyConfidence : null,
  ].filter(Boolean)
  const hasLowConfidence = availableConfidences.includes('low')
  const allAvailableLowConfidence = availableConfidences.length > 0
    && availableConfidences.every((confidence) => confidence === 'low')
  const agreementLevel = availableSystems.length < 2
    ? 'single_system_only'
    : allAvailableLowConfidence
      ? 'insufficient_data'
      : hasLowConfidence
        ? 'partial_uncertainty_preserved'
        : 'multi_lens_synthesis'

  const systemAgreement = {
    agreementLevel,
    note: availableSystems.length >= 2
      ? `실제 계산 자료가 있는 ${availableSystems.length}개 체계만 비교할 수 있습니다.`
      : '현재 실제 계산 자료는 사주만 있으므로 체계 간 통합이나 일치 판정을 생성하지 않습니다.',
  }

  const sharedThemes = availableSystems.length >= 2
    ? [{
        themeId: 'supported_context_comparison',
        label: '지원되는 계산 자료의 관점 비교',
        evidence: {
          ...(hasSajuData && {
            saju: saju.candidateSetConsensus?.factual?.dayMaster
              ? [`일간 ${saju.candidateSetConsensus.factual.dayMaster} 중심 오행 흐름`]
              : ['제공된 사주 계산 문맥'],
          }),
          ...(hasZiweiData && {
            ziwei: ziwei.candidateSetConsensus?.factual?.mingGongBranch
              ? [`명궁 ${ziwei.candidateSetConsensus.factual.mingGongBranch}宮 배치`]
              : ['제공된 자미두수 계산 문맥'],
          }),
          ...(hasAstrologyData && {
            astrology: astrology.astrologyContextSnapshot?.factualSigns?.sunSign
              ? [`Sun in ${astrology.astrologyContextSnapshot.factualSigns.sunSign}`]
              : ['제공된 서양 점성학 계산 문맥'],
          }),
        },
        synthesis: '실제 계산 자료가 있는 체계의 관점만 서로 분리해 비교합니다.',
      }]
    : []
  const differentPerspectives = availableSystems.length >= 2
    ? [{
        perspectiveId: 'supported_systems_only',
        label: '지원 체계별 독립 관점',
        description: `${availableSystems.join(', ')}의 실제 계산 문맥만 독립적으로 비교합니다.`,
      }]
    : []
  const overallGuidance = availableSystems.length === 0
    ? '해석에 사용할 수 있는 실제 계산 자료가 없습니다.'
    : hasLowConfidence
      ? '사주 계산에 경계 후보 또는 검증 필요 요소가 있으므로 가능성을 분리해 설명해야 합니다.'
      : '현재 지원되는 사주 계산값과 표시된 불확실성만 해석 근거로 사용합니다.'

  const unifiedConfidence = {
    overallConfidence: availableSystems.length === 0
      ? 'low'
      : allAvailableLowConfidence
        ? 'low'
        : hasLowConfidence
          ? 'medium'
          : availableConfidences[0] || 'high',
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
      ...(!hasZiweiData ? ['자미두수 계산 자료가 없으므로 관련 값을 추정하거나 생성하지 않습니다.'] : []),
      ...(!hasAstrologyData ? ['서양 점성학 계산 자료가 없으므로 관련 값을 추정하거나 생성하지 않습니다.'] : []),
    ],
  }

  return {
    systemType: availableSystems.length >= 2
      ? 'unified_3system_saju_ziwei_astrology'
      : 'supported_system_context',
    subjectName: saju.subjectName || ziwei.subjectName || astrology.subjectName || '내담자',
    availableSystems,
    systemAvailability,
    systemAgreement,
    sharedThemes,
    differentPerspectives,
    unifiedConfidence,
    sajuContext: saju,
    ziweiContext: ziwei,
    astrologyContext: astrology,
  }
}
