import {
  adaptAstrologyWesternEvidenceToConstitution,
  canonicalAstrologyWesternEvidenceJson,
  validateAstrologyWesternEvidenceEnvelope,
} from './astrologyWesternEvidenceHandoff.js'
import { validateDeterministicBaseForInterpretation } from '../interpretationConstitution.js'

/**
 * Consumer-side permissions for the Western Astrology evidence lane.
 *
 * This is a transport and boundary contract, not an interpreter.  It does not
 * calculate a chart, create a hypothesis, store a user response, or decide
 * what a person is like.  It binds each already materialized FACT/evidence
 * item to the narrowest use that its status and source lane permit.
 */
export const ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_SCHEMA = 'astrology-western-evidence-consumption-v0'
export const ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_VERSION = '0.1.0'
export const ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_KIND = 'astrology_western_evidence_consumption_contract'

export const ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_CLASSES = Object.freeze([
  'fact',
  'literature_evidence',
  'source_local_composition',
  'unresolved',
  'unsupported',
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
  noActivationMutation: true,
})

const MODEL_POLICY = Object.freeze({
  fact: 'Use only the included technical FACT value as a confirmed fact; FACT presence alone does not authorize a meaning claim.',
  literatureEvidence: 'Explain only the included source term, role, or result with its source and locator; do not promote it to a Base fact or universal rule.',
  sourceLocalComposition: 'Explain only the precomputed composition from the same source and lineage, keeping its component chain visible.',
  unresolved: 'Report the declared unresolved, blocked, ambiguous, or missing state and stop; do not fill the gap from general astrology knowledge.',
  unsupported: 'Report that the feature is outside the admitted source scope; it is not a semantic basis.',
  conflict: 'Report every conflicting side and preserved tension; do not choose a winner or resolve it by majority or user preference.',
  hypothesis: 'Do not generate a hypothesis. A separately submitted hypothesis must pass the validation and user-context contracts before bounded use.',
  personalApplication: 'Do not assert personality, fate, prediction, advice, or an individual conclusion; ask for context before any bounded comparison.',
  conversationLayerResponsibility: 'Response storage, response classification, conversation flow, and personalization remain outside the engine.',
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
  'promote_global_interpretation_activation',
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0
const clone = value => structuredClone(value)
const unique = values => [...new Set(values)]

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

function sourceScopeFor(item) {
  const refs = Array.isArray(item?.sourceRefs) ? item.sourceRefs : []
  return {
    sourceIds: unique(refs.map(ref => ref?.sourceId).filter(isNonEmptyString)),
    lineageIds: unique(refs.map(ref => ref?.lineageId).filter(isNonEmptyString)),
    locatorIds: unique(refs.map(ref => ref?.locatorId).filter(isNonEmptyString)),
  }
}

function classifyEvidence(item) {
  if (item?.kind === 'base_fact') return 'fact'
  if (item?.relation === 'conflicts' || item?.status === 'conflict') return 'conflict'
  if (item?.status === 'unsupported') return 'unsupported'
  if (['blocked', 'unresolved', 'ambiguous', 'not_applicable'].includes(item?.status)) return 'unresolved'
  if (item?.evidenceRole === 'source_local_composition') return 'source_local_composition'
  if (item?.kind === 'literature_claim') return 'literature_evidence'
  return null
}

function permissionFor(classification, item) {
  if (classification === 'fact') {
    return {
      confirmedFact: true,
      sourceBoundedExplanation: false,
      hypothesisProposal: 'not_allowed_from_fact_presence',
      userContextRequirement: 'not_required_for_fact_report',
      definitivePersonalization: false,
      explanationScope: 'included_base_fact_value_only',
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
        ? 'conditional_after_explicit_submission_and_user_gate'
        : 'not_allowed_structural_or_non_available_state',
      userContextRequirement: 'required_before_personal_application',
      definitivePersonalization: false,
      explanationScope: 'source_locator_bounded_result_or_lexicon_only',
      allowedUses: [
        'report_source_locator_bounded_evidence',
        'preserve_lineage_and_provenance',
        ...(semanticBasisAvailable ? ['consider_submitted_bounded_hypothesis_only'] : []),
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
        ? 'conditional_after_explicit_submission_and_user_gate'
        : 'not_allowed_non_available_state',
      userContextRequirement: 'required_before_personal_application',
      definitivePersonalization: false,
      explanationScope: 'precomputed_same_source_components_and_chain_only',
      allowedUses: [
        'report_precomputed_source_local_composition',
        'preserve_component_chain_and_lineage',
        ...(semanticBasisAvailable ? ['consider_submitted_bounded_hypothesis_only'] : []),
      ],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'compose_unresolved_components', 'treat_as_cross_lineage_agreement'],
    }
  }

  if (classification === 'unsupported') {
    return {
      confirmedFact: false,
      sourceBoundedExplanation: true,
      hypothesisProposal: 'blocked_unsupported_source_scope',
      userContextRequirement: 'not_applicable_until_a_separate_source_is_admitted',
      definitivePersonalization: false,
      explanationScope: 'unsupported_scope_label_only',
      allowedUses: ['report_unsupported_feature_scope'],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'use_unsupported_feature_as_semantic_basis'],
    }
  }

  if (classification === 'unresolved') {
    return {
      confirmedFact: false,
      sourceBoundedExplanation: true,
      hypothesisProposal: 'blocked_unresolved_or_blocked_state',
      userContextRequirement: 'required_before_any_personal_application_without_filling_the_gap',
      definitivePersonalization: false,
      explanationScope: 'status_and_declared_missing_boundary_only',
      allowedUses: ['report_unresolved_or_blocked_status', 'identify_declared_missing_boundary', 'defer_application'],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'use_unresolved_as_semantic_basis'],
    }
  }

  return {
    confirmedFact: false,
    sourceBoundedExplanation: true,
    hypothesisProposal: 'blocked_conflict_preserved',
    userContextRequirement: 'required_before_any_personal_application_without_resolving_source_conflict',
    definitivePersonalization: false,
    explanationScope: 'all_conflicting_sides_and_preserved_tension_only',
    allowedUses: ['report_all_conflicting_evidence', 'preserve_tension', 'defer_application'],
    forbiddenUses: [...COMMON_FORBIDDEN_USES, 'hide_conflicting_side', 'resolve_conflict_by_user_preference'],
  }
}

function makeGuidance(item) {
  const evidenceClass = classifyEvidence(item)
  if (!evidenceClass || !isNonEmptyString(item?.id)) return null
  return {
    evidenceId: item.id,
    evidenceKind: item.kind,
    evidenceClass,
    evidenceRole: item.evidenceRole || null,
    status: item.status,
    relation: item.relation,
    factRefs: Array.isArray(item.factRefs) ? [...item.factRefs] : [],
    sourceScope: sourceScopeFor(item),
    sourceRefs: Array.isArray(item.sourceRefs) ? clone(item.sourceRefs) : [],
    requiredTechnicalFactRefs: Array.isArray(item.requiredTechnicalFactRefs) ? [...item.requiredTechnicalFactRefs] : [],
    semanticBasisEligible: item.semanticBasisEligible === true,
    permission: permissionFor(evidenceClass, item),
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
    sourceBoundedEvidenceHandoff: adapter.readiness.sourceBoundedEvidenceHandoff,
    hypothesisSubmissionValidationAvailable: true,
    perHypothesisDiscussionAuthorizationAvailable: true,
    interpretationHypothesisLayer: 'contract_available_not_activated',
    userExperienceGate: 'required_before_personal_application',
    userExperienceProvided: false,
    conversationalInterpretationActivationReady: false,
    activation: 'blocked',
    blockers: [
      'explicit_external_hypothesis_submission_required',
      'user_context_is_not_source_validation_or_confirmation',
      'global_interpretation_activation_is_forbidden',
    ],
    reason: 'FACT and source-bounded evidence can be consumed; only a separately submitted, bounded hypothesis may enter validation and per-hypothesis authorization.',
  }
}

function expectedBoundary() {
  return clone(CONTRACT_BOUNDARY)
}

function expectedModelPolicy() {
  return clone(MODEL_POLICY)
}

function invalidBuild(errors, adapter = null) {
  return {
    valid: false,
    errors: unique(errors).sort(),
    contract: null,
    adapter,
  }
}

/** Build a consumer contract from the current, validated evidence envelope. */
export function buildAstrologyWesternEvidenceConsumptionContract({ base, envelope } = {}) {
  const baseValidation = validateDeterministicBaseForInterpretation(base)
  if (!baseValidation.valid) return invalidBuild(baseValidation.errors.map(error => `base:${error}`))
  const adapter = adaptAstrologyWesternEvidenceToConstitution({ base, envelope })
  if (!adapter.adapterValidation?.valid) {
    return invalidBuild(adapter.adapterValidation?.errors || ['adapter_validation_failed'], adapter)
  }

  const entries = adapter.evidence.map(makeGuidance)
  if (entries.some(entry => entry === null)) return invalidBuild(['evidence_guidance_unclassifiable'], adapter)

  const contract = {
    schemaVersion: ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_SCHEMA,
    version: ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_VERSION,
    kind: ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_KIND,
    handoffEvidence: clone(envelope),
    constitutionInput: expectedConstitutionInput(base, adapter),
    consumptionGuidance: {
      entries,
      modelPolicy: expectedModelPolicy(),
    },
    boundary: expectedBoundary(),
    readiness: expectedReadiness(adapter),
  }
  const validation = validateAstrologyWesternEvidenceConsumptionContract(contract)
  return {
    valid: validation.valid,
    errors: validation.errors,
    contract: validation.valid ? contract : null,
    adapter,
  }
}

/** Validate a fresh consumer contract without recalculating any result. */
export function validateAstrologyWesternEvidenceConsumptionContract(contract, { base = null } = {}) {
  const errors = []
  if (!isObject(contract)) return { valid: false, errors: ['contract_not_object'] }
  exactKeys(contract, ['schemaVersion', 'version', 'kind', 'handoffEvidence', 'constitutionInput', 'consumptionGuidance', 'boundary', 'readiness'], '$', errors)
  if (contract.schemaVersion !== ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_SCHEMA || contract.version !== ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_VERSION || contract.kind !== ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_KIND) addError(errors, 'contract_schema_mismatch')

  const embeddedBase = contract.constitutionInput?.base
  const effectiveBase = base === null ? embeddedBase : base
  const baseValidation = validateDeterministicBaseForInterpretation(effectiveBase)
  if (!baseValidation.valid) errors.push(...baseValidation.errors.map(error => `base:${error}`))
  if (base !== null && canonicalAstrologyWesternEvidenceJson(embeddedBase) !== canonicalAstrologyWesternEvidenceJson(base)) addError(errors, 'embedded_base_mismatch')

  const envelopeValidation = validateAstrologyWesternEvidenceEnvelope(contract.handoffEvidence, { base: effectiveBase })
  if (!envelopeValidation.valid) errors.push(...envelopeValidation.errors.map(error => `handoff:${error}`))
  const adapter = adaptAstrologyWesternEvidenceToConstitution({ base: effectiveBase, envelope: contract.handoffEvidence })
  if (!adapter.adapterValidation?.valid) errors.push(...(adapter.adapterValidation?.errors || ['adapter_validation_failed']).map(error => `adapter:${error}`))

  exactKeys(contract.constitutionInput, ['base', 'evidence', 'conflicts', 'hypotheses'], 'constitutionInput', errors)
  if (!Array.isArray(contract.constitutionInput?.hypotheses) || contract.constitutionInput.hypotheses.length !== 0) addError(errors, 'hypothesis_present')
  if (adapter.adapterValidation?.valid) {
    if (canonicalAstrologyWesternEvidenceJson(contract.constitutionInput) !== canonicalAstrologyWesternEvidenceJson(expectedConstitutionInput(effectiveBase, adapter))) addError(errors, 'constitution_input_not_lossless')
  }

  exactKeys(contract.consumptionGuidance, ['entries', 'modelPolicy'], 'consumptionGuidance', errors)
  if (!Array.isArray(contract.consumptionGuidance?.entries)) {
    addError(errors, 'guidance_entries_missing')
  } else if (adapter.adapterValidation?.valid) {
    const expectedEntries = adapter.evidence.map(makeGuidance)
    if (expectedEntries.some(entry => entry === null)) addError(errors, 'evidence_guidance_unclassifiable')
    if (canonicalAstrologyWesternEvidenceJson(contract.consumptionGuidance.entries) !== canonicalAstrologyWesternEvidenceJson(expectedEntries)) addError(errors, 'guidance_not_bound_to_evidence')
    const ids = contract.consumptionGuidance.entries.map(entry => entry?.evidenceId)
    if (new Set(ids).size !== ids.length) addError(errors, 'guidance_id_duplicate')
    if (contract.consumptionGuidance.entries.some(entry => !ASTROLOGY_WESTERN_EVIDENCE_CONSUMPTION_CLASSES.includes(entry?.evidenceClass))) addError(errors, 'guidance_class_invalid')
  }
  if (canonicalAstrologyWesternEvidenceJson(contract.consumptionGuidance?.modelPolicy) !== canonicalAstrologyWesternEvidenceJson(expectedModelPolicy())) addError(errors, 'model_policy_mismatch')

  exactKeys(contract.boundary, Object.keys(CONTRACT_BOUNDARY), 'boundary', errors)
  if (canonicalAstrologyWesternEvidenceJson(contract.boundary) !== canonicalAstrologyWesternEvidenceJson(expectedBoundary())) addError(errors, 'consumption_boundary_invalid')
  exactKeys(contract.readiness, [
    'boundedEvidenceConsumptionReady',
    'sourceBoundedEvidenceHandoff',
    'hypothesisSubmissionValidationAvailable',
    'perHypothesisDiscussionAuthorizationAvailable',
    'interpretationHypothesisLayer',
    'userExperienceGate',
    'userExperienceProvided',
    'conversationalInterpretationActivationReady',
    'activation',
    'blockers',
    'reason',
  ], 'readiness', errors)
  if (adapter.adapterValidation?.valid && canonicalAstrologyWesternEvidenceJson(contract.readiness) !== canonicalAstrologyWesternEvidenceJson(expectedReadiness(adapter))) addError(errors, 'consumption_readiness_invalid')

  return {
    valid: unique(errors).length === 0,
    errors: unique(errors).sort(),
    baseValidation,
    envelopeValidation,
    adapterValidation: adapter.adapterValidation,
  }
}

export const exportAstrologyWesternEvidenceConsumptionContractJson = (contract, indent = 2) => JSON.stringify(contract, null, indent)

/** Reconsume a fresh JSON document; invalid policy or evidence yields no contract. */
export function consumeAstrologyWesternEvidenceConsumptionContract(serialized, { base = null } = {}) {
  let contract
  try {
    contract = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['contract_json_invalid'], contract: null }
  }
  const validation = validateAstrologyWesternEvidenceConsumptionContract(contract, { base })
  return {
    valid: validation.valid,
    errors: validation.errors,
    contract: validation.valid ? contract : null,
    validation,
  }
}
