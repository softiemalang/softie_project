/**
 * Availability-aware unified context.
 *
 * This layer compares only systems that explicitly have usable calculation
 * evidence. It does not average systems or translate one system's terminology
 * into another system's causal language.
 */

import { createEvidenceBoundary } from './evidenceBoundary.js'

const SYSTEM_IDS = ['saju', 'ziwei', 'astrology']
const CONFIDENCE_RANK = { low: 1, medium: 2, high: 3 }

function isDescriptor(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && (
      Object.hasOwn(value, 'availableForChat')
      || Object.hasOwn(value, 'interpretationContext')
      || Object.hasOwn(value, 'calculationResult')
    )
  )
}

function hasLegacyEvidence(system, context) {
  if (!context || typeof context !== 'object' || context.status) return false
  if (system === 'saju') {
    return Boolean(
      context.candidateSetConsensus?.factual?.dayMaster
      || context.subjectName
      || context.raw
    )
  }
  if (system === 'ziwei') {
    return Boolean(
      context.candidateSetConsensus?.factual?.mingGongBranch
      || context.palaceContexts
      || context.raw
      || context.subjectName
    )
  }

  // Astrology must opt in through a verified adapter descriptor. Legacy
  // InterpretationContext objects can originate from the blocked seed simulator.
  return context.adapterVerified === true
}

function inferLegacyStatus(system, context, availableForChat) {
  if (availableForChat) {
    if (system === 'ziwei' && context?.calculationConfidence?.stateContract?.interpretationStatus === 'experimental') {
      return 'experimental'
    }
    return 'available'
  }
  if (context?.status) return context.status
  return system === 'astrology' ? 'adapter_required' : 'unavailable'
}

function defaultSystemVerificationStatus(system, availableForChat) {
  if (!availableForChat) return 'not_available'
  if (system === 'ziwei') return 'needs_external_verification'
  if (system === 'saju') return 'needs_verification'
  return 'not_available'
}

function defaultSystemConfidence(system, availableForChat) {
  if (!availableForChat) return 'not_available'
  if (system === 'ziwei' || system === 'saju') return 'low'
  return 'not_available'
}

function defaultInterpretationStatus(system, availableForChat) {
  if (!availableForChat) return 'candidate_only'
  if (system === 'ziwei') return 'experimental'
  if (system === 'saju') return 'ready'
  return 'candidate_only'
}

function runtimeEvidenceBoundary(system, supplied) {
  const calculationResult = supplied.calculationResult || null
  const context = supplied.interpretationContext || supplied.context || supplied
  const hasCalculation = Boolean(calculationResult?.raw || calculationResult?.chart || supplied.raw || context?.candidateSetConsensus)
  const relationStatus = system === 'saju'
    ? (calculationResult?.raw?.stemRelations || calculationResult?.raw?.branchRelations || supplied.raw?.stemRelations
      ? 'present_in_calculation_context'
      : 'not_available')
    : system === 'ziwei'
      ? (calculationResult?.chart?.palaces?.length || context?.palaceContexts ? 'present_in_calculation_context' : 'not_available')
      : 'not_available'

  const sourceEvidenceStatus = system === 'astrology' && !supplied.availableForChat
    ? 'not_available'
    : 'unverified'
  const sourceEvidenceReason = system === 'saju'
    ? '로컬 계산과 구현 규칙은 존재하지만 고전 source identity와 독립 권위는 확정되지 않았습니다.'
    : system === 'ziwei'
      ? '고정 RuleSet 계산은 보존하지만 source/oracle/semantic authority는 독립적으로 확정되지 않았습니다.'
      : supplied.availableForChat
        ? '계산 Context는 제공되지만 이 handoff boundary는 독립 source authority를 주장하지 않습니다.'
        : '검증된 천문력 Adapter 계산이 이 prep pipeline에 연결되지 않았습니다.'

  return createEvidenceBoundary({
    system,
    calculationStatus: hasCalculation ? 'calculated' : 'not_available',
    sourceEvidenceStatus,
    sourceEvidenceReason,
    deterministicRelationStatus: relationStatus,
    sourceRefs: [`systems.${system}.calculationResult`, `systems.${system}.interpretationContext`, `systems.${system}.warnings`],
    relationRefs: relationStatus === 'present_in_calculation_context' ? [`systems.${system}.deterministicRelations`] : [],
  })
}

function normalizeSystem(system, value = {}) {
  const supplied = value || {}
  if (isDescriptor(supplied)) {
    const context = supplied.interpretationContext || supplied.context || null
    const confidence = supplied.confidence
      || context?.calculationConfidence?.stateContract?.confidence
      || defaultSystemConfidence(system, supplied.availableForChat)
    const verificationStatus = supplied.verificationStatus
      || context?.calculationConfidence?.stateContract?.verificationStatus
      || defaultSystemVerificationStatus(system, supplied.availableForChat)
    const interpretationStatus = supplied.interpretationStatus
      || context?.calculationConfidence?.stateContract?.interpretationStatus
      || defaultInterpretationStatus(system, supplied.availableForChat)

    return {
      system,
      status: supplied.status || (supplied.availableForChat ? 'available' : 'unavailable'),
      verificationStatus,
      interpretationStatus,
      confidence: supplied.availableForChat ? confidence : 'not_available',
      availableForChat: supplied.availableForChat === true && Boolean(context),
      context: supplied.availableForChat === true ? context : null,
      calculationResult: supplied.calculationResult || null,
      warnings: Array.isArray(supplied.warnings) ? supplied.warnings : [],
      sourceDerivation: supplied.sourceDerivation || null,
      adapterContract: supplied.adapterContract || null,
      supportScope: supplied.supportScope || null,
      evidenceBoundary: supplied.evidenceBoundary || runtimeEvidenceBoundary(system, supplied),
    }
  }

  const availableForChat = hasLegacyEvidence(system, supplied)
  const confidence = availableForChat
    ? supplied.calculationConfidence?.stateContract?.confidence || defaultSystemConfidence(system, availableForChat)
    : 'not_available'

  const verificationStatus = availableForChat
    ? supplied.calculationConfidence?.stateContract?.verificationStatus || defaultSystemVerificationStatus(system, availableForChat)
    : 'not_available'

  const interpretationStatus = availableForChat
    ? supplied.calculationConfidence?.stateContract?.interpretationStatus || defaultInterpretationStatus(system, availableForChat)
    : 'candidate_only'

  return {
    system,
    status: inferLegacyStatus(system, supplied, availableForChat),
    verificationStatus,
    interpretationStatus,
    confidence,
    availableForChat,
    context: availableForChat ? supplied : null,
    calculationResult: supplied.raw || null,
    warnings: [
      ...(supplied.interpretationWarnings || []),
      ...(supplied.warnings || []),
    ],
    evidenceBoundary: supplied.evidenceBoundary || runtimeEvidenceBoundary(system, supplied),
  }
}

function parseInputs(sajuOrSystems, ziweiContext, astrologyContext) {
  if (
    sajuOrSystems
    && typeof sajuOrSystems === 'object'
    && SYSTEM_IDS.every((system) => Object.hasOwn(sajuOrSystems, system))
  ) {
    return sajuOrSystems
  }
  return {
    saju: sajuOrSystems || {},
    ziwei: ziweiContext || {},
    astrology: astrologyContext || {},
  }
}

function isEligibleForSynthesis(sys) {
  if (!sys || !sys.availableForChat) return false
  if (sys.verificationStatus === 'candidate_required') return false
  if (sys.interpretationStatus === 'candidate_only') return false
  return true
}

function evidenceFor(system, context) {
  if (system === 'saju') {
    const dayMaster = context?.candidateSetConsensus?.factual?.dayMaster
    return dayMaster ? [`사주: 일간 ${dayMaster}`] : ['사주: 계산 Context 제공']
  }
  if (system === 'ziwei') {
    const factual = context?.candidateSetConsensus?.factual || {}
    return factual.mingGongBranch
      ? [`자미두수: 명궁 ${factual.mingGongBranch}宮`, `자미두수: 신궁 ${factual.shenGongBranch || '미확정'}宮`]
      : ['자미두수: 계산 Context 제공']
  }
  const factual = context?.candidateSetConsensus?.factual || {}
  return factual.sunSign ? [`서양 점성학: 태양 ${factual.sunSign}`] : ['서양 점성학: 검증된 계산 Context 제공']
}

function lowestConfidence(systems, synthesisSystems) {
  if (synthesisSystems.length === 0) return 'not_available'
  return synthesisSystems.reduce((lowest, system) => {
    const confidence = systems[system].confidence
    if (!CONFIDENCE_RANK[confidence]) return lowest
    if (!lowest || CONFIDENCE_RANK[confidence] < CONFIDENCE_RANK[lowest]) return confidence
    return lowest
  }, null) || 'low'
}

function systemTypeFor(count) {
  if (count === 3) return 'unified_3system'
  if (count === 2) return 'unified_2system'
  if (count === 1) return 'single_system_context'
  return 'no_system_context'
}

export function createUnifiedInterpretationContext(
  sajuOrSystems = {},
  ziweiContext = {},
  astrologyContext = {},
) {
  const inputs = parseInputs(sajuOrSystems, ziweiContext, astrologyContext)
  const systems = Object.fromEntries(
    SYSTEM_IDS.map((system) => [system, normalizeSystem(system, inputs[system])]),
  )
  const availableSystems = SYSTEM_IDS.filter((system) => systems[system].availableForChat)
  const unavailableSystems = SYSTEM_IDS.filter((system) => !systems[system].availableForChat)
  const synthesisSystems = SYSTEM_IDS.filter((system) => isEligibleForSynthesis(systems[system]))

  const overallConfidence = lowestConfidence(systems, synthesisSystems)
  const hasLowConfidence = synthesisSystems.some((system) => systems[system].confidence === 'low')
  const allLowConfidence = synthesisSystems.length > 0
    && synthesisSystems.every((system) => systems[system].confidence === 'low')

  const agreementLevel = synthesisSystems.length === 0
    ? 'insufficient_data'
    : synthesisSystems.length === 1
      ? 'single_system_only'
      : allLowConfidence
        ? 'insufficient_data'
        : hasLowConfidence
          ? 'partial_uncertainty_preserved'
          : 'multi_lens_synthesis'

  const sharedThemes = synthesisSystems.length >= 2
    ? [{
        themeId: 'independent_system_evidence_comparison',
        label: '두 체계 이상이 함께 비추는 질문 영역',
        evidence: Object.fromEntries(
          synthesisSystems.map((system) => [system, evidenceFor(system, systems[system].context)]),
        ),
        synthesis: '각 체계의 용어와 근거를 섞지 않고, 같은 삶의 질문을 비추는 독립 관점으로 비교합니다.',
      }]
    : []

  const differentPerspectives = synthesisSystems.length >= 2
    ? synthesisSystems.map((system) => ({
        system,
        label: {
          saju: '사주 관점',
          ziwei: '자미두수 관점',
          astrology: '서양 점성학 관점',
        }[system],
        evidence: evidenceFor(system, systems[system].context),
      }))
    : []

  const unavailableWarnings = unavailableSystems.map((system) => {
    const descriptor = systems[system]
    if (descriptor.warnings.length > 0) return descriptor.warnings
    return [`${system}은 현재 Chat 해석에 사용할 수 있는 계산 자료가 없습니다.`]
  }).flat()
  const availableWarnings = availableSystems
    .flatMap((system) => systems[system].warnings)
  const warnings = [...new Set([...availableWarnings, ...unavailableWarnings])]
  const uncertainFactors = availableSystems.flatMap((system) => (
    systems[system].context?.uncertainFactors || []
  ))
  const subjectName = availableSystems
    .map((system) => systems[system].context?.subjectName)
    .find(Boolean) || '내담자'

  const overallGuidance = synthesisSystems.length === 0
    ? '해석에 합성 가능한 확정 계산 자료가 없습니다.'
    : `${synthesisSystems.join(', ')}의 독립 계산 근거를 중심으로 구성하며, 후보 및 미지원 체계는 통합·공통 테마에서 제외합니다.`

  return {
    systemType: systemTypeFor(availableSystems.length),
    subjectName,
    systems,
    availableSystems,
    unavailableSystems,
    synthesisSystems,
    systemAvailability: Object.fromEntries(
      SYSTEM_IDS.map((system) => [system, systems[system].status]),
    ),
    systemAgreement: {
      agreementLevel,
      note: synthesisSystems.length >= 2
        ? `합성 가능한 ${synthesisSystems.length}개 체계의 근거를 독립적으로 비교합니다.`
        : synthesisSystems.length === 1
          ? `단일 확정 체계(${synthesisSystems[0]})의 근거를 중심으로 구성하며, 후보/미지원 체계는 공통 테마 생성에서 제외합니다.`
          : '합성 가능한 체계가 없으므로 체계 간 공통 테마를 생성하지 않습니다.',
    },
    sharedThemes,
    differentPerspectives,
    warnings,
    unifiedConfidence: {
      overallConfidence,
      perSystem: Object.fromEntries(
        SYSTEM_IDS.map((system) => [system, systems[system].confidence]),
      ),
      sajuConfidence: systems.saju.confidence,
      ziweiConfidence: systems.ziwei.confidence,
      astrologyConfidence: systems.astrology.confidence,
      overallGuidance,
      uncertainFactors,
      warnings,
    },

    // Compatibility aliases for Lab assets. The production flow uses systems.*.
    sajuContext: systems.saju.context || {},
    ziweiContext: systems.ziwei.context || {},
    astrologyContext: systems.astrology.context || {},
  }
}
