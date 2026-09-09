import {
  adaptSajuLineageHandoffEvidenceToConstitution,
  validateSajuLineageHandoffEvidenceEnvelope,
} from './sajuLineageHandoffEvidence.js'
import { validateDeterministicBaseForInterpretation } from '../interpretationConstitution.js'

/**
 * Deterministic, model-facing use permissions for the Saju evidence handoff.
 * This module does not store responses, classify user statements, personalize
 * a result, or generate a hypothesis. It only binds each supplied evidence
 * item to a conservative consumption policy.
 */
export const SAJU_EVIDENCE_CONSUMPTION_SCHEMA = 'saju-evidence-consumption-v0'
export const SAJU_EVIDENCE_CONSUMPTION_VERSION = '0.1.0'
export const SAJU_EVIDENCE_CONSUMPTION_KIND = 'conversational_evidence_use_contract'

export const SAJU_EVIDENCE_CONSUMPTION_CLASSES = Object.freeze([
  'fact',
  'literature_evidence',
  'source_local_composition',
  'unresolved',
  'conflict',
])

const CONTRACT_BOUNDARY = Object.freeze({
  precomputedOnly: true,
  noRecalculation: true,
  factsAndSourceEvidenceSeparate: true,
  noPersonalization: true,
  noDefinitivePersonalConclusion: true,
  noCrossLineageMerge: true,
  unresolvedPreserved: true,
  conflictsPreserved: true,
  noHypothesisGenerated: true,
})

const MODEL_POLICY = Object.freeze({
  fact: 'Base에 포함된 FACT 값만 확정 사실로 보고하고, FACT 존재만으로 의미를 만들지 않는다.',
  literatureEvidence: 'source/locator 범위 안의 문헌 주장·역할·용어만 설명하며 Base FACT나 보편 법칙으로 승격하지 않는다.',
  sourceLocalComposition: '미리 계산된 동일 source/lineage의 composition과 component chain만 설명하며 다른 lineage와 합치지 않는다.',
  unresolved: '미해결·미지원·차단·후보·모호·비적용 상태를 그대로 보고하고 빈칸을 추정·재계산하지 않는다.',
  conflict: '충돌하는 양쪽 근거와 tension을 모두 보고하고 승자·다수결·해소 결과를 만들지 않는다.',
  hypothesis: '자동 가설을 만들지 않으며, 별도 Constitution hypothesis와 사용자 맥락 gate가 제출된 경우에만 가설 층을 검토한다.',
  personalApplication: '성격·길흉·예측·개인 특성을 확정하지 않고 개인 적용 전 사용자 맥락을 확인한다.',
  conversationLayerResponsibility: '사용자 응답 저장·분류·대화 흐름·개인화 판단은 이 계약 밖의 대화 모델 책임이다.',
})

const COMMON_FORBIDDEN_USES = Object.freeze([
  'treat_as_definitive_personalization',
  'infer_personality_or_trait',
  'infer_good_bad_fortune_or_prediction',
  'invent_missing_value',
  'recalculate_lineage_result',
  'promote_source_claim_to_base_fact',
  'merge_lineages_or_use_cross_lineage_majority',
  'select_conflict_winner',
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0
const clone = value => JSON.parse(JSON.stringify(value))

function addError(errors, message) {
  if (!errors.includes(message)) errors.push(message)
}

function exactKeys(value, expected, path, errors) {
  if (!isObject(value)) {
    addError(errors, `${path}:not_object`)
    return
  }
  for (const key of expected) if (!Object.hasOwn(value, key)) addError(errors, `${path}:missing:${key}`)
  for (const key of Object.keys(value)) if (!expected.includes(key)) addError(errors, `${path}:unexpected:${key}`)
}

function sourceEvidenceRole(item) {
  return item?.evidenceRole || item?.provenance?.lane || null
}

function sourceCategory(item) {
  return item?.provenance?.category || null
}

function permissionFor(classification, item) {
  if (classification === 'fact') {
    return {
      confirmedFact: true,
      sourceBoundedExplanation: false,
      hypothesisProposal: 'not_allowed_from_fact',
      userContextRequirement: 'not_required_for_fact_report',
      definitivePersonalization: false,
      explanationScope: 'included_base_value_only',
      allowedUses: ['report_included_fact_value', 'answer_explicit_fact_lookup', 'cite_base_fact_ref'],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'derive_semantic_meaning_from_fact_presence'],
    }
  }

  if (classification === 'literature_evidence') {
    const semanticBasisAvailable = item?.semanticBasisEligible === true && item?.status === 'available'
    return {
      confirmedFact: false,
      sourceBoundedExplanation: true,
      hypothesisProposal: semanticBasisAvailable
        ? 'conditional_after_explicit_constitution_and_user_gate'
        : 'not_allowed_structural_or_non_available_state',
      userContextRequirement: 'required_before_personal_application',
      definitivePersonalization: false,
      explanationScope: 'source_locator_bounded_result_or_role_only',
      allowedUses: [
        'report_source_locator_bounded_evidence',
        'preserve_lineage_and_provenance',
        ...(semanticBasisAvailable ? ['offer_tentative_hypothesis_only_after_explicit_gate'] : []),
      ],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'present_source_result_as_universal_rule'],
    }
  }

  if (classification === 'source_local_composition') {
    const semanticBasisAvailable = item?.semanticBasisEligible === true && item?.status === 'available'
    return {
      confirmedFact: false,
      sourceBoundedExplanation: true,
      hypothesisProposal: semanticBasisAvailable
        ? 'conditional_after_explicit_constitution_and_user_gate'
        : 'not_allowed_non_available_state',
      userContextRequirement: 'required_before_personal_application',
      definitivePersonalization: false,
      explanationScope: 'precomputed_source_local_components_and_chain_only',
      allowedUses: [
        'report_precomputed_source_local_composition',
        'preserve_component_chain_and_lineage',
        ...(semanticBasisAvailable ? ['offer_tentative_hypothesis_only_after_explicit_gate'] : []),
      ],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'compose_unresolved_components', 'treat_composition_as_cross_lineage_agreement'],
    }
  }

  if (classification === 'unresolved') {
    return {
      confirmedFact: false,
      sourceBoundedExplanation: true,
      hypothesisProposal: 'blocked_unresolved_or_unsupported_state',
      userContextRequirement: 'required_before_any_personal_application_without_filling_the_gap',
      definitivePersonalization: false,
      explanationScope: 'status_and_missing_boundary_only',
      allowedUses: ['report_unresolved_or_unsupported_status', 'identify_declared_missing_boundary', 'defer_application'],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'use_unresolved_as_semantic_basis'],
    }
  }

  return {
    confirmedFact: false,
    sourceBoundedExplanation: true,
    hypothesisProposal: 'blocked_conflict_preserved',
    userContextRequirement: 'required_before_any_personal_application_without_resolving_source_conflict',
    definitivePersonalization: false,
    explanationScope: 'both_sides_and_preserved_tension_only',
    allowedUses: ['report_all_conflicting_evidence', 'preserve_tension', 'defer_application'],
    forbiddenUses: [...COMMON_FORBIDDEN_USES, 'hide_conflicting_side', 'resolve_conflict_by_user_preference'],
  }
}

function classifyEvidence(item) {
  if (item?.kind === 'base_fact') return 'fact'
  if (item?.relation === 'conflicts') return 'conflict'
  if (item?.evidenceRole === 'lineage_state') return 'unresolved'
  if (item?.evidenceRole === 'composition_result') return 'source_local_composition'
  if (item?.kind === 'literature_claim') return 'literature_evidence'
  return null
}

function makeGuidance(item) {
  const classification = classifyEvidence(item)
  if (!classification || !isNonEmptyString(item?.id)) return null
  const permission = permissionFor(classification, item)
  return {
    evidenceId: item.id,
    evidenceKind: item.kind,
    evidenceClass: classification,
    evidenceRole: sourceEvidenceRole(item),
    category: sourceCategory(item),
    status: item.status,
    relation: item.relation,
    factRefs: Array.isArray(item.factRefs) ? [...item.factRefs] : [],
    sourceRefs: isObject(item.sourceRefs) ? clone(item.sourceRefs) : null,
    semanticBasisEligible: item.semanticBasisEligible === true,
    permission,
  }
}

function expectedConstitutionInput(base, adapter) {
  return {
    base: clone(base),
    evidence: clone(adapter.evidence),
    conflicts: clone(adapter.conflicts),
    hypotheses: [],
  }
}

function expectedReadiness(adapter) {
  return {
    boundedEvidenceConsumptionReady: true,
    ...clone(adapter.readiness),
    noHypothesisGenerated: true,
  }
}

function expectedContractBoundary() {
  return clone(CONTRACT_BOUNDARY)
}

function expectedModelPolicy() {
  return clone(MODEL_POLICY)
}

function invalidBuild(errors, adapter = null) {
  return {
    valid: false,
    errors: [...new Set(errors)].sort(),
    contract: null,
    adapter,
  }
}

/**
 * Build use permissions from a validated envelope. The original envelope
 * and the adapter's Constitution input are retained so a fresh consumer can
 * verify that guidance was not substituted for, or detached from, evidence.
 */
export function buildSajuEvidenceConsumptionContract({ base, envelope } = {}) {
  const adapter = adaptSajuLineageHandoffEvidenceToConstitution({ base, envelope })
  if (!adapter.adapterValidation?.valid) {
    return invalidBuild(adapter.adapterValidation?.errors || ['adapter_validation_failed'], adapter)
  }

  const entries = adapter.evidence.map(makeGuidance)
  if (entries.some(entry => entry === null)) return invalidBuild(['evidence_guidance_unclassifiable'], adapter)

  const contract = {
    schemaVersion: SAJU_EVIDENCE_CONSUMPTION_SCHEMA,
    version: SAJU_EVIDENCE_CONSUMPTION_VERSION,
    kind: SAJU_EVIDENCE_CONSUMPTION_KIND,
    handoffEvidence: clone(envelope),
    constitutionInput: expectedConstitutionInput(base, adapter),
    consumptionGuidance: {
      entries,
      modelPolicy: expectedModelPolicy(),
    },
    boundary: expectedContractBoundary(),
    readiness: expectedReadiness(adapter),
  }
  const validation = validateSajuEvidenceConsumptionContract(contract)
  return {
    valid: validation.valid,
    errors: validation.errors,
    contract: validation.valid ? contract : null,
    adapter,
  }
}

/**
 * Validate the contract without deriving any Saju result. If `base` is
 * supplied, the embedded public Base must match it exactly; otherwise the
 * embedded Base is validated as the self-contained handoff input.
 */
export function validateSajuEvidenceConsumptionContract(contract, { base = null } = {}) {
  const errors = []
  if (!isObject(contract)) return { valid: false, errors: ['contract_not_object'], baseValidation: validateDeterministicBaseForInterpretation(base) }
  exactKeys(contract, ['schemaVersion', 'version', 'kind', 'handoffEvidence', 'constitutionInput', 'consumptionGuidance', 'boundary', 'readiness'], '$', errors)
  if (contract.schemaVersion !== SAJU_EVIDENCE_CONSUMPTION_SCHEMA || contract.version !== SAJU_EVIDENCE_CONSUMPTION_VERSION || contract.kind !== SAJU_EVIDENCE_CONSUMPTION_KIND) addError(errors, 'contract_schema_mismatch')

  const embeddedBase = contract.constitutionInput?.base
  const effectiveBase = base === null ? embeddedBase : base
  const baseValidation = validateDeterministicBaseForInterpretation(effectiveBase)
  if (!baseValidation.valid) errors.push(...baseValidation.errors.map(error => `base:${error}`))
  if (base !== null && JSON.stringify(embeddedBase) !== JSON.stringify(base)) addError(errors, 'embedded_base_mismatch')

  const envelopeValidation = validateSajuLineageHandoffEvidenceEnvelope(contract.handoffEvidence, effectiveBase)
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors.map(error => `handoff:${error}`))
  const adapter = adaptSajuLineageHandoffEvidenceToConstitution({ base: effectiveBase, envelope: contract.handoffEvidence })
  if (!adapter.adapterValidation?.valid) errors.push(...(adapter.adapterValidation?.errors || ['adapter_validation_failed']).map(error => `adapter:${error}`))

  exactKeys(contract.constitutionInput, ['base', 'evidence', 'conflicts', 'hypotheses'], 'constitutionInput', errors)
  if (!Array.isArray(contract.constitutionInput?.hypotheses) || contract.constitutionInput.hypotheses.length !== 0) addError(errors, 'hypothesis_present')
  if (adapter.adapterValidation?.valid) {
    const expectedInput = expectedConstitutionInput(effectiveBase, adapter)
    if (JSON.stringify(contract.constitutionInput) !== JSON.stringify(expectedInput)) addError(errors, 'constitution_input_not_lossless')
  }

  exactKeys(contract.consumptionGuidance, ['entries', 'modelPolicy'], 'consumptionGuidance', errors)
  if (!Array.isArray(contract.consumptionGuidance?.entries)) {
    addError(errors, 'guidance_entries_missing')
  } else if (adapter.adapterValidation?.valid) {
    const expectedEntries = adapter.evidence.map(makeGuidance)
    if (expectedEntries.some(entry => entry === null)) addError(errors, 'evidence_guidance_unclassifiable')
    if (JSON.stringify(contract.consumptionGuidance.entries) !== JSON.stringify(expectedEntries)) addError(errors, 'guidance_not_bound_to_evidence')
    const ids = contract.consumptionGuidance.entries.map(entry => entry?.evidenceId)
    if (new Set(ids).size !== ids.length) addError(errors, 'guidance_id_duplicate')
    if (contract.consumptionGuidance.entries.some(entry => !SAJU_EVIDENCE_CONSUMPTION_CLASSES.includes(entry?.evidenceClass))) addError(errors, 'guidance_class_invalid')
  }
  if (JSON.stringify(contract.consumptionGuidance?.modelPolicy) !== JSON.stringify(expectedModelPolicy())) addError(errors, 'model_policy_mismatch')

  exactKeys(contract.boundary, Object.keys(CONTRACT_BOUNDARY), 'boundary', errors)
  if (JSON.stringify(contract.boundary) !== JSON.stringify(expectedContractBoundary())) addError(errors, 'consumption_boundary_invalid')
  exactKeys(contract.readiness, ['boundedEvidenceConsumptionReady', 'semanticBasisAvailable', 'userExperienceGate', 'userExperienceProvided', 'interpretationHypothesisReady', 'noHypothesisGenerated', 'reason'], 'readiness', errors)
  if (adapter.adapterValidation?.valid && JSON.stringify(contract.readiness) !== JSON.stringify(expectedReadiness(adapter))) addError(errors, 'consumption_readiness_invalid')

  return {
    valid: [...new Set(errors)].length === 0,
    errors: [...new Set(errors)].sort(),
    baseValidation,
    envelopeValidation,
    adapterValidation: adapter.adapterValidation,
  }
}

export function exportSajuEvidenceConsumptionContractJson(contract, indent = 2) {
  return JSON.stringify(contract, null, indent)
}

/**
 * Parse and validate a freshly read contract file. Invalid JSON, provenance,
 * evidence mapping, or guidance policy returns no consumable contract.
 */
export function consumeSajuEvidenceConsumptionContract(serialized, { base = null } = {}) {
  let contract
  try {
    contract = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['contract_json_invalid'], contract: null }
  }
  const validation = validateSajuEvidenceConsumptionContract(contract, { base })
  return {
    valid: validation.valid,
    errors: validation.errors,
    contract: validation.valid ? contract : null,
    validation,
  }
}
