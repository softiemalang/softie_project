import {
  buildSajuEvidenceConsumptionContract,
  validateSajuEvidenceConsumptionContract,
} from './sajuEvidenceConsumptionContract.js'

/**
 * Canonical package for a conversation model. It carries the already
 * validated evidence-consumption contract and declares how the model may
 * use it. It does not store responses, classify user statements, personalize
 * a result, or generate an interpretation hypothesis.
 */
export const SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_SCHEMA = 'saju-conversational-handoff-package-v0'
export const SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION = '0.1.0'
export const SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_KIND = 'canonical_saju_conversational_handoff_package'

export const SAJU_CONVERSATIONAL_USE_CONTRACT_SCHEMA = 'saju-conversational-use-contract-v0'
export const SAJU_INTERPRETATION_HYPOTHESIS_CONTRACT_SCHEMA = 'saju-interpretation-hypothesis-contract-v0'

const CONVERSATIONAL_USE_CONTRACT = Object.freeze({
  schemaVersion: SAJU_CONVERSATIONAL_USE_CONTRACT_SCHEMA,
  version: SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION,
  kind: 'saju_evidence_conversational_use_contract',
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
      hypothesisUse: 'conditional_after_explicit_hypothesis_and_user_gate',
      userContext: 'required_before_personal_application',
      personalUse: 'never_definitive',
    },
    source_local_composition: {
      directUse: 'precomputed_same_source_lineage_composition_only',
      sourceBoundedUse: 'component_chain_and_lineage_must_remain_visible',
      hypothesisUse: 'conditional_after_explicit_hypothesis_and_user_gate',
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
    conflict: {
      directUse: 'report_all_sides_and_preserved_tension',
      sourceBoundedUse: 'do_not_select_or_hide_a_side',
      hypothesisUse: 'blocked_while_conflict_is_preserved',
      userContext: 'required_before_personal_application_but_not_source_resolution',
      personalUse: 'never_definitive',
    },
  },
  consumptionOrder: [
    'locate_relevant_included_fact',
    'separate_base_fact_from_source_derived_evidence',
    'report_unresolved_and_conflict_without_repair',
    'state_that_personal_meaning_is_not_a_fact',
    'ask_for_user_context_before_personal_application',
  ],
  personalMeaningQuestion: {
    scenario: 'personal_identity_or_trait_question',
    allowedNextSteps: [
      'report_relevant_included_fact_values',
      'explain_source_bounded_evidence_and_locator_scope',
      'state_unresolved_or_conflict_boundary',
      'ask_user_context_before_personal_application',
    ],
    requiredStop: 'do_not_answer_as_a_definitive_personal_trait_or_fortune_judgment',
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
  schemaVersion: SAJU_INTERPRETATION_HYPOTHESIS_CONTRACT_SCHEMA,
  version: SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION,
  kind: 'saju_interpretation_hypothesis_use_contract',
  status: 'closed_until_explicit_gate',
  automaticGeneration: false,
  directFactToHypothesis: false,
  requiredConditions: [
    'explicit_hypothesis_record_is_submitted',
    'fact_refs_point_to_present_public_base_values',
    'semantic_basis_ids_point_to_present_available_source_evidence',
    'all_referenced_evidence_remains_separate',
    'unresolved_and_conflict_ledgers_are_preserved',
    'user_experience_gate_is_explicitly_satisfied_before_personal_application',
  ],
  permittedResult: 'hypothesis_only_never_definitive_personal_conclusion',
  missingConditionAction: 'remain_closed_and_ask_for_context_or_preserve_boundary',
  forbiddenResults: [
    'definitive_personality_or_trait_claim',
    'good_bad_fortune_or_prediction_claim',
    'personalized_conclusion_from_single_fact',
    'cross_lineage_majority_or_synthesis',
    'silent_resolution_of_unresolved_or_conflict_state',
    'recalculation_or_free_natural_language_completion',
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
const clone = value => JSON.parse(JSON.stringify(value))
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

function expectedConversationalUseContract() {
  return clone(CONVERSATIONAL_USE_CONTRACT)
}

function expectedInterpretationHypothesisContract() {
  return clone(INTERPRETATION_HYPOTHESIS_CONTRACT)
}

function expectedBoundary() {
  return clone(PACKAGE_BOUNDARY)
}

function expectedReadiness() {
  return {
    boundedConversationalUseReady: true,
    conversationalInterpretationActivationReady: false,
    userExperienceGate: 'required_before_personal_application',
    userExperienceProvided: false,
    interpretationHypothesisReady: false,
    blockers: [
      'user_experience_not_provided',
      'explicit_interpretation_hypothesis_not_submitted',
    ],
    reason: 'FACT and source-bounded evidence can be consumed; personal application remains closed until explicit user context and hypothesis gates are satisfied',
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

/**
 * Build the canonical package from the existing envelope and consumption
 * contract. No lineage derivation is imported or called here.
 */
export function buildSajuConversationalHandoffPackage({ base, envelope } = {}) {
  const consumption = buildSajuEvidenceConsumptionContract({ base, envelope })
  if (!consumption.valid) return invalidBuild(consumption.errors, consumption)

  const packageValue = {
    schemaVersion: SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_SCHEMA,
    version: SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION,
    kind: SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_KIND,
    evidenceConsumption: clone(consumption.contract),
    conversationalUseContract: expectedConversationalUseContract(),
    interpretationHypothesisContract: expectedInterpretationHypothesisContract(),
    boundary: expectedBoundary(),
    readiness: expectedReadiness(),
  }
  const validation = validateSajuConversationalHandoffPackage(packageValue, { base })
  return {
    valid: validation.valid,
    errors: validation.errors,
    package: validation.valid ? packageValue : null,
    consumption,
  }
}

/**
 * Validate package shape, embedded evidence-consumption integrity, and the
 * fixed conversational permissions. Validation never derives a Saju result.
 */
export function validateSajuConversationalHandoffPackage(packageValue, { base = null } = {}) {
  const errors = []
  if (!isObject(packageValue)) return { valid: false, errors: ['package_not_object'] }
  exactKeys(packageValue, ['schemaVersion', 'version', 'kind', 'evidenceConsumption', 'conversationalUseContract', 'interpretationHypothesisContract', 'boundary', 'readiness'], '$', errors)
  if (packageValue.schemaVersion !== SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_SCHEMA || packageValue.version !== SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_VERSION || packageValue.kind !== SAJU_CONVERSATIONAL_HANDOFF_PACKAGE_KIND) addError(errors, 'package_schema_mismatch')

  const embeddedBase = packageValue.evidenceConsumption?.constitutionInput?.base
  const effectiveBase = base === null ? embeddedBase : base
  const consumptionValidation = validateSajuEvidenceConsumptionContract(packageValue.evidenceConsumption, { base: effectiveBase })
  if (!consumptionValidation.valid) errors.push(...consumptionValidation.errors.map(error => `consumption:${error}`))

  if (JSON.stringify(packageValue.conversationalUseContract) !== JSON.stringify(expectedConversationalUseContract())) addError(errors, 'conversational_use_contract_mismatch')
  if (JSON.stringify(packageValue.interpretationHypothesisContract) !== JSON.stringify(expectedInterpretationHypothesisContract())) addError(errors, 'interpretation_hypothesis_contract_mismatch')
  exactKeys(packageValue.boundary, Object.keys(PACKAGE_BOUNDARY), 'boundary', errors)
  if (JSON.stringify(packageValue.boundary) !== JSON.stringify(expectedBoundary())) addError(errors, 'package_boundary_invalid')
  exactKeys(packageValue.readiness, ['boundedConversationalUseReady', 'conversationalInterpretationActivationReady', 'userExperienceGate', 'userExperienceProvided', 'interpretationHypothesisReady', 'blockers', 'reason'], 'readiness', errors)
  if (JSON.stringify(packageValue.readiness) !== JSON.stringify(expectedReadiness())) addError(errors, 'package_readiness_invalid')

  return {
    valid: [...new Set(errors)].length === 0,
    errors: [...new Set(errors)].sort(),
    consumptionValidation,
  }
}

export function exportSajuConversationalHandoffPackageJson(packageValue, indent = 2) {
  return JSON.stringify(packageValue, null, indent)
}

/**
 * Reconsume a package from a fresh file/transport. Invalid evidence or use
 * permissions return no package, so a consumer cannot fall back to guesses.
 */
export function consumeSajuConversationalHandoffPackage(serialized, { base = null } = {}) {
  let packageValue
  try {
    packageValue = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return { valid: false, errors: ['package_json_invalid'], package: null }
  }
  const validation = validateSajuConversationalHandoffPackage(packageValue, { base })
  return {
    valid: validation.valid,
    errors: validation.errors,
    package: validation.valid ? packageValue : null,
    validation,
  }
}
