import {
  buildAstrologyWesternHypothesisSubmissionValidation,
} from './astrologyWesternHypothesisSubmissionContract.js'

/**
 * Per-hypothesis authorization for a validated Western Astrology submission.
 * Authorization is intentionally narrower than interpretation activation: it
 * is limited to one submitted hypothesis and never stores or classifies user
 * responses or changes a runtime flag.
 */
export const ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_REQUEST_SCHEMA = 'astrology-western-hypothesis-discussion-authorization-request-v0'
export const ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_REQUEST_VERSION = '0.1.0'
export const ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_REQUEST_KIND = 'external_astrology_western_hypothesis_discussion_authorization_request'

export const ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_SCHEMA = 'astrology-western-hypothesis-discussion-authorization-v0'
export const ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_VERSION = '0.1.0'
export const ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_KIND = 'validated_astrology_western_hypothesis_discussion_authorization'

export const ASTROLOGY_WESTERN_HYPOTHESIS_CONFIRMATION_STATES = Object.freeze([
  'declined',
  'uncertain',
  'confirmed',
])

export const ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_PERMISSIONS = Object.freeze([
  'discussion_allowed',
  'explore_only',
  'reject',
])

const CONFIRMATION_STATE_SET = new Set(ASTROLOGY_WESTERN_HYPOTHESIS_CONFIRMATION_STATES)

const AUTHORIZATION_CONTRACT = Object.freeze({
  schemaVersion: ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_SCHEMA,
  version: ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_VERSION,
  kind: 'astrology_western_hypothesis_per_hypothesis_discussion_authorization_contract',
  input: {
    validatedHypothesis: 'one_current_validated_astrology_western_hypothesis_submission_only',
    userConfirmation: 'one_external_user_confirmation_state_for_the_same_hypothesis',
    requestedUse: 'fixed_bounded_discussion_scope_for_the_same_hypothesis',
  },
  confirmationStates: {
    confirmed: 'may_authorize_bounded_discussion_after_validation_and_preserved_boundary_checks',
    uncertain: 'exploration_only; no personal application',
    declined: 'reject this hypothesis; do not discuss it as a usable hypothesis',
  },
  permissions: {
    discussion_allowed: 'this hypothesis may be discussed within its declared source, evidence, and explicit user-context scope',
    explore_only: 'this hypothesis may be inspected or explained but not applied to the user',
    reject: 'this hypothesis is not authorized for discussion or personal application',
  },
  confirmationDoesNot: [
    'promote_source_evidence_to_base_fact',
    'resolve_unresolved_or_unsupported_evidence',
    'resolve_preserved_conflict',
    'authorize_cross_lineage_synthesis',
    'authorize_other_hypotheses',
    'promote_global_interpretation_activation',
  ],
})

const AUTHORIZATION_BOUNDARY = Object.freeze({
  oneHypothesisOnly: true,
  noOtherHypotheses: true,
  noPersonalityTraits: true,
  noDefinitivePersonalization: true,
  noGoodBadFortuneOrPrediction: true,
  noCrossLineageSynthesis: true,
  unresolvedPreserved: true,
  conflictsPreserved: true,
  noRecalculation: true,
  noResponseStorage: true,
  noResponseClassification: true,
  noPersonalizationEngine: true,
  activationMutation: 'forbidden',
})

const COMMON_FORBIDDEN_USES = Object.freeze([
  'treat_hypothesis_as_definitive_fact',
  'state_definitive_personal_conclusion',
  'infer_unstated_personality_or_trait',
  'infer_good_bad_fortune_or_prediction',
  'generalize_beyond_declared_source_scope',
  'expand_to_other_hypotheses',
  'perform_cross_lineage_synthesis',
  'resolve_or_hide_unresolved_unsupported_or_conflict_state',
  'recalculate_or_fill_missing_values',
  'promote_global_interpretation_activation',
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0
const clone = value => structuredClone(value)
const arraysEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right)
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

function expectedAuthorizationContract() {
  return clone(AUTHORIZATION_CONTRACT)
}

function expectedBoundary() {
  return clone(AUTHORIZATION_BOUNDARY)
}

function validatePriorHypothesisValidation(handoffPackage, hypothesisValidation, errors) {
  if (!isObject(hypothesisValidation)) {
    addError(errors, 'hypothesis_validation:not_object')
    return null
  }
  exactKeys(hypothesisValidation, [
    'schemaVersion',
    'version',
    'kind',
    'handoffPackage',
    'submissionContract',
    'submission',
    'result',
    'readiness',
  ], 'hypothesisValidation', errors)
  if (!isObject(hypothesisValidation.submission)) {
    addError(errors, 'hypothesis_validation:submission_missing')
    return null
  }
  const rebuilt = buildAstrologyWesternHypothesisSubmissionValidation({
    handoffPackage,
    submission: hypothesisValidation.submission,
  })
  if (!rebuilt.valid || !rebuilt.validation) {
    for (const error of rebuilt.errors || ['hypothesis_validation_rejected']) addError(errors, `hypothesis_validation:${error}`)
    return null
  }
  if (!arraysEqual(rebuilt.validation, hypothesisValidation)) {
    addError(errors, 'hypothesis_validation:not_current_or_tampered')
    return null
  }
  return rebuilt.validation
}

function hypothesisIdOf(validation) {
  return validation?.submission?.hypothesis?.id || null
}

function validateUserConfirmation(userConfirmation, hypothesisId, errors) {
  exactKeys(userConfirmation, ['hypothesisId', 'state', 'scope', 'basis'], 'userConfirmation', errors)
  if (!isNonEmptyString(userConfirmation?.hypothesisId)) addError(errors, 'user_confirmation:hypothesis_id_missing')
  else if (userConfirmation.hypothesisId !== hypothesisId) addError(errors, 'user_confirmation:hypothesis_id_mismatch')
  if (!CONFIRMATION_STATE_SET.has(userConfirmation?.state)) addError(errors, 'user_confirmation:state_invalid')
  if (userConfirmation?.scope !== 'this_hypothesis_only') addError(errors, 'user_confirmation:scope_invalid')
  if (userConfirmation?.basis !== 'external_user_confirmation') addError(errors, 'user_confirmation:basis_invalid')
}

function validateRequestedUse(requestedUse, hypothesisId, errors) {
  exactKeys(requestedUse, [
    'hypothesisId',
    'action',
    'scope',
    'otherHypotheses',
    'personalApplication',
    'globalActivation',
  ], 'requestedUse', errors)
  if (!isNonEmptyString(requestedUse?.hypothesisId)) addError(errors, 'requested_use:hypothesis_id_missing')
  else if (requestedUse.hypothesisId !== hypothesisId) addError(errors, 'requested_use:hypothesis_id_mismatch')
  if (requestedUse?.action !== 'discussion') addError(errors, 'requested_use:action_invalid')
  if (requestedUse?.scope !== 'this_hypothesis_only') addError(errors, 'requested_use:scope_invalid')
  if (requestedUse?.otherHypotheses !== 'forbidden') addError(errors, 'requested_use:other_hypotheses_not_forbidden')
  if (requestedUse?.personalApplication !== 'bounded_user_context_only') addError(errors, 'requested_use:personal_application_scope_invalid')
  if (requestedUse?.globalActivation !== 'forbidden') addError(errors, 'requested_use:global_activation_not_forbidden')
}

function validateAuthorizationRequest({ handoffPackage, request } = {}) {
  const errors = []
  if (!isObject(request)) return { valid: false, errors: ['request_not_object'], validation: null }
  exactKeys(request, [
    'schemaVersion',
    'version',
    'kind',
    'authorizationId',
    'hypothesisValidation',
    'userConfirmation',
    'requestedUse',
  ], '$', errors)
  if (request.schemaVersion !== ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_REQUEST_SCHEMA || request.version !== ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_REQUEST_VERSION || request.kind !== ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_REQUEST_KIND) addError(errors, 'request_schema_mismatch')
  if (!isNonEmptyString(request.authorizationId)) addError(errors, 'request_authorization_id_missing')

  const validation = validatePriorHypothesisValidation(handoffPackage, request.hypothesisValidation, errors)
  const hypothesisId = hypothesisIdOf(validation)
  validateUserConfirmation(request.userConfirmation, hypothesisId, errors)
  validateRequestedUse(request.requestedUse, hypothesisId, errors)
  return { valid: unique(errors).length === 0, errors: unique(errors).sort(), validation }
}

function hasPreservedBoundary(validation) {
  const result = validation?.result
  const userContextHasConflict = result?.userContextDecision === 'reported_user_conflict_defer_application'
  return (Array.isArray(result?.unresolvedEvidenceIds) && result.unresolvedEvidenceIds.length > 0)
    || (Array.isArray(result?.conflictIds) && result.conflictIds.length > 0)
    || result?.conflictState === 'preserved_tension'
    || userContextHasConflict
}

function validationIsBlocked(validation) {
  return validation?.result?.decision === 'blocked'
    || validation?.result?.status === 'blocked'
    || validation?.readiness?.submissionValidationReady !== true
}

function permissionFor(validation, confirmationState) {
  if (validationIsBlocked(validation)) return { permission: 'reject', reason: 'hypothesis_validation_blocked' }
  if (confirmationState === 'declined') return { permission: 'reject', reason: 'user_confirmation_declined' }
  if (confirmationState === 'uncertain') return { permission: 'explore_only', reason: 'user_confirmation_uncertain' }
  if (hasPreservedBoundary(validation)) return { permission: 'explore_only', reason: 'preserved_unresolved_unsupported_or_conflict_requires_exploration_only' }
  return { permission: 'discussion_allowed', reason: 'explicit_user_confirmation_for_bounded_hypothesis' }
}

function usesFor(permission) {
  if (permission === 'discussion_allowed') {
    return {
      personalApplication: 'bounded_user_context_comparison_only',
      allowedUses: ['report_declared_fact_basis', 'explain_declared_source_bounded_evidence', 'discuss_this_hypothesis_as_tentative', 'compare_only_with_explicit_user_context'],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'treat_user_confirmation_as_source_validation'],
    }
  }
  if (permission === 'explore_only') {
    return {
      personalApplication: 'forbidden',
      allowedUses: ['report_declared_fact_basis', 'explain_declared_source_bounded_evidence', 'explore_this_hypothesis_without_personal_application', 'ask_for_or_acknowledge_user_context'],
      forbiddenUses: [...COMMON_FORBIDDEN_USES, 'apply_hypothesis_to_user', 'treat_confirmation_as_resolution_of_preserved_boundary'],
    }
  }
  return {
    personalApplication: 'forbidden',
    allowedUses: ['report_rejection_reason_only'],
    forbiddenUses: [...COMMON_FORBIDDEN_USES, 'discuss_rejected_hypothesis_as_usable', 'apply_rejected_hypothesis_to_user'],
  }
}

function scopeFor(validation) {
  const hypothesis = validation.submission.hypothesis
  return {
    hypothesisId: hypothesis.id,
    hypothesisIds: [hypothesis.id],
    otherHypothesisIds: [],
    factRefs: [...hypothesis.factRefs],
    evidenceIds: [...hypothesis.evidenceIds],
    semanticBasisIds: [...hypothesis.semanticBasisIds],
    userContextIds: [...hypothesis.userContextIds],
    sourceScope: clone(hypothesis.sourceScope),
    preservation: clone(hypothesis.preservation),
  }
}

function readinessFor({ permission, confirmationState, validation }) {
  const blockers = ['definitive_personal_application_forbidden', 'global_interpretation_activation_forbidden']
  if (permission === 'reject') blockers.push(validationIsBlocked(validation) ? 'hypothesis_validation_blocked' : 'user_confirmation_declined')
  else if (permission === 'explore_only') {
    if (confirmationState === 'uncertain') blockers.push('user_confirmation_uncertain')
    if (hasPreservedBoundary(validation)) blockers.push('preserved_unresolved_unsupported_or_conflict')
  }
  return {
    safeBoundedConsumerReady: true,
    perHypothesisAuthorizationReady: true,
    permission,
    hypothesisUsable: permission !== 'reject',
    boundedDiscussionAllowed: permission === 'discussion_allowed',
    exploreOnly: permission === 'explore_only',
    personalApplicationReady: false,
    conversationalInterpretationActivationReady: false,
    globalActivationPromotion: false,
    blockers: unique(blockers),
    reason: 'Authorization is limited to one hypothesis and never promotes definitive personal use or global interpretation activation.',
  }
}

function buildAuthorizationFromValidatedRequest(request, validation) {
  const confirmationState = request.userConfirmation.state
  const permissionDecision = permissionFor(validation, confirmationState)
  const uses = usesFor(permissionDecision.permission)
  const hypothesis = validation.submission.hypothesis
  return {
    schemaVersion: ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_SCHEMA,
    version: ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_VERSION,
    kind: ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_KIND,
    authorizationId: request.authorizationId,
    request: clone(request),
    hypothesisValidation: clone(validation),
    authorizationContract: expectedAuthorizationContract(),
    decision: {
      permission: permissionDecision.permission,
      hypothesisId: hypothesis.id,
      confirmationState,
      validationDecision: validation.result.decision,
      validationStatus: validation.result.status,
      personalApplication: uses.personalApplication,
      allowedUses: uses.allowedUses,
      forbiddenUses: uses.forbiddenUses,
      reason: permissionDecision.reason,
    },
    scope: scopeFor(validation),
    preservation: {
      unresolvedEvidenceIds: [...validation.result.unresolvedEvidenceIds],
      conflictIds: [...validation.result.conflictIds],
      conflictState: validation.result.conflictState,
      userContextDecision: validation.result.userContextDecision,
    },
    boundary: expectedBoundary(),
    readiness: readinessFor({ permission: permissionDecision.permission, confirmationState, validation }),
  }
}

function invalidResult(errors) {
  return {
    valid: false,
    errors: unique(errors).sort(),
    permission: 'reject',
    decision: 'reject',
    authorization: null,
  }
}

export function buildAstrologyWesternHypothesisDiscussionAuthorization({ handoffPackage, request } = {}) {
  const requestValidation = validateAuthorizationRequest({ handoffPackage, request })
  if (!requestValidation.valid || !requestValidation.validation) return invalidResult(requestValidation.errors)
  const authorization = buildAuthorizationFromValidatedRequest(request, requestValidation.validation)
  return {
    valid: true,
    errors: [],
    permission: authorization.decision.permission,
    decision: authorization.decision.permission,
    authorization,
  }
}

export function validateAstrologyWesternHypothesisDiscussionAuthorization(authorization, { handoffPackage } = {}) {
  const errors = []
  if (!isObject(authorization)) return { valid: false, errors: ['authorization_not_object'], authorization: null }
  exactKeys(authorization, [
    'schemaVersion',
    'version',
    'kind',
    'authorizationId',
    'request',
    'hypothesisValidation',
    'authorizationContract',
    'decision',
    'scope',
    'preservation',
    'boundary',
    'readiness',
  ], '$', errors)
  if (authorization.schemaVersion !== ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_SCHEMA || authorization.version !== ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_VERSION || authorization.kind !== ASTROLOGY_WESTERN_HYPOTHESIS_DISCUSSION_AUTHORIZATION_KIND) addError(errors, 'authorization_schema_mismatch')
  if (!isNonEmptyString(authorization.authorizationId)) addError(errors, 'authorization_id_missing')
  if (JSON.stringify(authorization.authorizationContract) !== JSON.stringify(expectedAuthorizationContract())) addError(errors, 'authorization_contract_mismatch')
  if (JSON.stringify(authorization.boundary) !== JSON.stringify(expectedBoundary())) addError(errors, 'authorization_boundary_mismatch')

  const requestValidation = validateAuthorizationRequest({ handoffPackage, request: authorization.request })
  if (!requestValidation.valid || !requestValidation.validation) {
    errors.push(...requestValidation.errors.map(error => `request:${error}`))
  } else {
    const expected = buildAuthorizationFromValidatedRequest(authorization.request, requestValidation.validation)
    if (JSON.stringify(authorization) !== JSON.stringify(expected)) addError(errors, 'authorization_not_bound_to_current_request')
  }
  return {
    valid: unique(errors).length === 0,
    errors: unique(errors).sort(),
    authorization: unique(errors).length === 0 ? authorization : null,
  }
}

export const exportAstrologyWesternHypothesisDiscussionAuthorizationRequestJson = (request, indent = 2) => JSON.stringify(request, null, indent)

export function consumeAstrologyWesternHypothesisDiscussionAuthorizationRequest(serialized, { handoffPackage } = {}) {
  let request
  try {
    request = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return invalidResult(['request_json_invalid'])
  }
  return buildAstrologyWesternHypothesisDiscussionAuthorization({ handoffPackage, request })
}
