import {
  buildAstrologyWesternEvidenceConsumptionContract,
  validateAstrologyWesternEvidenceConsumptionContract,
} from './astrologyWesternEvidenceConsumptionContract.js'
import { canonicalAstrologyWesternEvidenceJson } from './astrologyWesternEvidenceHandoff.js'

/**
 * Canonical package for an external conversational consumer of the Western
 * Astrology lane.  It carries FACT and source evidence permissions together;
 * it does not implement a conversation, persist responses, or generate a
 * hypothesis.
 */
export const ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_SCHEMA = 'astrology-western-conversational-handoff-package-v0'
export const ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION = '0.1.0'
export const ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_KIND = 'canonical_astrology_western_conversational_handoff_package'
export const ASTROLOGY_WESTERN_CONVERSATIONAL_USE_CONTRACT_SCHEMA = 'astrology-western-conversational-use-contract-v0'
export const ASTROLOGY_WESTERN_INTERPRETATION_HYPOTHESIS_CONTRACT_SCHEMA = 'astrology-western-interpretation-hypothesis-contract-v0'

const CONVERSATIONAL_USE_CONTRACT = Object.freeze({
  schemaVersion: ASTROLOGY_WESTERN_CONVERSATIONAL_USE_CONTRACT_SCHEMA,
  version: ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION,
  kind: 'astrology_western_evidence_conversational_use_contract',
  evidenceClasses: {
    fact: {
      directUse: 'confirmed_fact_report_only',
      sourceBoundedUse: 'not_a_literature_claim',
      hypothesisUse: 'not_from_fact_presence',
      userContext: 'not_required_for_fact_report',
      personalUse: 'never_definitive',
    },
    literature_evidence: {
      directUse: 'source_locator_bounded_explanation',
      sourceBoundedUse: 'allowed_without_promoting_to_base_fact',
      hypothesisUse: 'conditional_after_explicit_submission_and_user_gate',
      userContext: 'required_before_personal_application',
      personalUse: 'never_definitive',
    },
    source_local_composition: {
      directUse: 'precomputed_same_source_lineage_composition_only',
      sourceBoundedUse: 'component_chain_and_locator_must_remain_visible',
      hypothesisUse: 'conditional_after_explicit_submission_and_user_gate',
      userContext: 'required_before_personal_application',
      personalUse: 'never_definitive',
    },
    unresolved: {
      directUse: 'status_boundary_report_only',
      sourceBoundedUse: 'describe_missing_blocked_or_unresolved_state_only',
      hypothesisUse: 'blocked',
      userContext: 'ask_or_confirm_without_filling_the_gap',
      personalUse: 'never_definitive',
    },
    unsupported: {
      directUse: 'unsupported_scope_report_only',
      sourceBoundedUse: 'do_not treat as source evidence',
      hypothesisUse: 'blocked',
      userContext: 'not a basis for personal application',
      personalUse: 'never_definitive',
    },
    conflict: {
      directUse: 'report_all_sides_and_preserved_tension',
      sourceBoundedUse: 'do_not select_or_hide_a_side',
      hypothesisUse: 'blocked_while_conflict_is_preserved',
      userContext: 'required_before_personal_application_but_not_source_resolution',
      personalUse: 'never_definitive',
    },
  },
  consumptionOrder: [
    'locate_relevant_included_fact',
    'separate_base_fact_from_source_derived_evidence',
    'keep_source_lineage_and_locator_visible',
    'report_unresolved_unsupported_and_conflict_without_repair',
    'state_that_source_evidence_is_not_a_personal_fact',
    'ask_for_user_context_before_personal_application',
  ],
  personalMeaningQuestion: {
    scenario: 'personal_identity_trait_or_fortune_question',
    allowedNextSteps: [
      'report_relevant_included_fact_values',
      'explain_source_bounded_evidence_and_locator_scope',
      'state_unresolved_unsupported_or_conflict_boundary',
      'ask_user_context_before_personal_application',
    ],
    requiredStop: 'do_not_answer_as_a_definitive_personal_trait_fortune_or_prediction_judgment',
    noAutomaticClassification: true,
    noResponseGeneration: true,
  },
  responsibilitiesOutsideContract: [
    'store_user_responses',
    'classify_user_responses',
    'choose_personalization_strategy',
    'run_conversation_flow',
  ],
})

const INTERPRETATION_HYPOTHESIS_CONTRACT = Object.freeze({
  schemaVersion: ASTROLOGY_WESTERN_INTERPRETATION_HYPOTHESIS_CONTRACT_SCHEMA,
  version: ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION,
  kind: 'astrology_western_interpretation_hypothesis_use_contract',
  status: 'contract_available_but_activation_closed',
  automaticGeneration: false,
  directFactToHypothesis: false,
  requiredConditions: [
    'external_hypothesis_submission_is_explicit',
    'fact_refs_point_to_present_public_base_values',
    'semantic_basis_ids_point_to_present_available_source_evidence',
    'source_scope_is_exact_and_single_lineage',
    'all_unresolved_and_conflict_ledgers_are_preserved',
    'user_experience_gate_is_explicitly_submitted_before_personal_application',
  ],
  permittedResult: 'source_bounded_hypothesis_only_never_definitive_personal_conclusion',
  missingConditionAction: 'remain_closed_and_ask_for_context_or_preserve_boundary',
  forbiddenResults: [
    'definitive_personality_or_trait_claim',
    'good_bad_fortune_or_prediction_claim',
    'personalized_conclusion_from_single_fact',
    'cross_lineage_majority_or_synthesis',
    'silent_resolution_of_unresolved_unsupported_or_conflict_state',
    'recalculation_or_free_natural_language_completion',
    'global_interpretation_activation',
  ],
})

const PACKAGE_BOUNDARY = Object.freeze({
  precomputedEvidenceOnly: true,
  noRecalculation: true,
  noMeaningAddition: true,
  factsAndSourceEvidenceSeparate: true,
  noCrossLineageSynthesis: true,
  unresolvedPreserved: true,
  conflictsPreserved: true,
  noHypothesisGenerated: true,
  noResponseStorage: true,
  noResponseClassification: true,
  noPersonalizationEngine: true,
  noConversationFlowImplementation: true,
  noActivationMutation: true,
})

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
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

function expectedUseContract() {
  return clone(CONVERSATIONAL_USE_CONTRACT)
}

function expectedHypothesisContract() {
  return clone(INTERPRETATION_HYPOTHESIS_CONTRACT)
}

function expectedBoundary() {
  return clone(PACKAGE_BOUNDARY)
}

function expectedReadiness() {
  return {
    boundedConversationalUseReady: true,
    sourceBoundedEvidenceHandoff: 'ready_source_bounded',
    hypothesisSubmissionValidationAvailable: true,
    perHypothesisDiscussionAuthorizationAvailable: true,
    userExperienceGate: 'required_before_personal_application',
    userExperienceProvided: false,
    interpretationHypothesisLayer: 'contract_available_not_activated',
    conversationalInterpretationActivationReady: false,
    activation: 'blocked',
    blockers: [
      'user_experience_not_provided',
      'explicit_external_hypothesis_submission_required',
      'global_interpretation_activation_is_forbidden',
    ],
    reason: 'FACT and source-bounded evidence can be consumed; personal application remains closed until a bounded hypothesis and per-hypothesis user gate are supplied.',
  }
}

function invalidBuild(errors, consumption = null) {
  return {
    valid: false,
    errors: unique(errors).sort(),
    package: null,
    consumption,
  }
}

export function buildAstrologyWesternConversationalHandoffPackage({ base, envelope } = {}) {
  const consumption = buildAstrologyWesternEvidenceConsumptionContract({ base, envelope })
  if (!consumption.valid) return invalidBuild(consumption.errors, consumption)
  const packageValue = {
    schemaVersion: ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_SCHEMA,
    version: ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION,
    kind: ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_KIND,
    evidenceConsumption: clone(consumption.contract),
    conversationalUseContract: expectedUseContract(),
    interpretationHypothesisContract: expectedHypothesisContract(),
    boundary: expectedBoundary(),
    readiness: expectedReadiness(),
  }
  const validation = validateAstrologyWesternConversationalHandoffPackage(packageValue, { base })
  return {
    valid: validation.valid,
    errors: validation.errors,
    package: validation.valid ? packageValue : null,
    consumption,
  }
}

export function validateAstrologyWesternConversationalHandoffPackage(packageValue, { base = null } = {}) {
  const errors = []
  if (!isObject(packageValue)) return { valid: false, errors: ['package_not_object'] }
  exactKeys(packageValue, ['schemaVersion', 'version', 'kind', 'evidenceConsumption', 'conversationalUseContract', 'interpretationHypothesisContract', 'boundary', 'readiness'], '$', errors)
  if (packageValue.schemaVersion !== ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_SCHEMA || packageValue.version !== ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION || packageValue.kind !== ASTROLOGY_WESTERN_CONVERSATIONAL_HANDOFF_PACKAGE_KIND) addError(errors, 'package_schema_mismatch')

  const embeddedBase = packageValue.evidenceConsumption?.constitutionInput?.base
  const effectiveBase = base === null ? embeddedBase : base
  const consumptionValidation = validateAstrologyWesternEvidenceConsumptionContract(packageValue.evidenceConsumption, { base: effectiveBase })
  if (!consumptionValidation.valid) errors.push(...consumptionValidation.errors.map(error => `consumption:${error}`))
  if (canonicalAstrologyWesternEvidenceJson(packageValue.conversationalUseContract) !== canonicalAstrologyWesternEvidenceJson(expectedUseContract())) addError(errors, 'conversational_use_contract_mismatch')
  if (canonicalAstrologyWesternEvidenceJson(packageValue.interpretationHypothesisContract) !== canonicalAstrologyWesternEvidenceJson(expectedHypothesisContract())) addError(errors, 'interpretation_hypothesis_contract_mismatch')

  exactKeys(packageValue.boundary, Object.keys(PACKAGE_BOUNDARY), 'boundary', errors)
  if (canonicalAstrologyWesternEvidenceJson(packageValue.boundary) !== canonicalAstrologyWesternEvidenceJson(expectedBoundary())) addError(errors, 'package_boundary_invalid')
  exactKeys(packageValue.readiness, [
    'boundedConversationalUseReady',
    'sourceBoundedEvidenceHandoff',
    'hypothesisSubmissionValidationAvailable',
    'perHypothesisDiscussionAuthorizationAvailable',
    'userExperienceGate',
    'userExperienceProvided',
    'interpretationHypothesisLayer',
    'conversationalInterpretationActivationReady',
    'activation',
    'blockers',
    'reason',
  ], 'readiness', errors)
  if (canonicalAstrologyWesternEvidenceJson(packageValue.readiness) !== canonicalAstrologyWesternEvidenceJson(expectedReadiness())) addError(errors, 'package_readiness_invalid')

  return {
    valid: unique(errors).length === 0,
    errors: unique(errors).sort(),
    consumptionValidation,
  }
}

export const exportAstrologyWesternConversationalHandoffPackageJson = (packageValue, indent = 2) => JSON.stringify(packageValue, null, indent)

export function consumeAstrologyWesternConversationalHandoffPackage(serialized, { base = null } = {}) {
  let packageValue
  try {
    packageValue = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['package_json_invalid'], package: null }
  }
  const validation = validateAstrologyWesternConversationalHandoffPackage(packageValue, { base })
  return {
    valid: validation.valid,
    errors: validation.errors,
    package: validation.valid ? packageValue : null,
    validation,
  }
}
