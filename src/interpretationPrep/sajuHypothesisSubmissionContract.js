import { evaluateInterpretationConstitution } from '../interpretationConstitution.js'
import { validateSajuConversationalHandoffPackage } from './sajuConversationalHandoffPackage.js'

/**
 * Contract for a hypothesis supplied by a conversation model or another
 * external caller.  This module validates a submission; it never creates a
 * hypothesis, classifies a user response, stores a response, or personalizes
 * a result.
 */
export const SAJU_HYPOTHESIS_SUBMISSION_SCHEMA = 'saju-hypothesis-submission-v0'
export const SAJU_HYPOTHESIS_SUBMISSION_VERSION = '0.1.0'
export const SAJU_HYPOTHESIS_SUBMISSION_KIND = 'external_saju_hypothesis_submission'

export const SAJU_HYPOTHESIS_VALIDATION_SCHEMA = 'saju-hypothesis-submission-validation-v0'
export const SAJU_HYPOTHESIS_VALIDATION_VERSION = '0.1.0'
export const SAJU_HYPOTHESIS_VALIDATION_KIND = 'validated_saju_hypothesis_submission'

const ALLOWED_USER_CONTEXT_STATUSES = new Set(['not_provided', 'reported'])
const ALLOWED_USER_CONTEXT_RELATIONS = new Set(['supports', 'neutral', 'conflicts'])
const ALLOWED_APPLICATION_MODES = new Set(['source_bounded_discussion', 'user_context_comparison'])
const ALLOWED_SEMANTIC_ROLES = new Set(['semantic_result', 'semanticLexicon_result', 'composition_result'])
const UNSAFE_EVIDENCE_STATUSES = new Set(['candidate', 'unverified', 'unsupported', 'blocked', 'unresolved', 'ambiguous', 'not_applicable'])

const SUBMISSION_CONTRACT = Object.freeze({
  schemaVersion: SAJU_HYPOTHESIS_SUBMISSION_SCHEMA,
  version: SAJU_HYPOTHESIS_SUBMISSION_VERSION,
  kind: 'saju_hypothesis_submission_contract',
  input: {
    userContext: {
      status: ['not_provided', 'reported'],
      role: 'reported_context_only_not_fact_or_interpretation_confirmation',
      noClassification: true,
    },
    hypothesis: {
      claimType: 'interpretation_hypothesis',
      status: 'hypothesis',
      applicationModes: ['source_bounded_discussion', 'user_context_comparison'],
      sourceScope: 'exact_referenced_source_and_locator_scope',
      generalization: 'forbidden',
      crossLineageSynthesis: 'forbidden',
      personalConclusion: 'forbidden',
      unstatedPersonalAttributes: 'not_claimed',
    },
  },
  decisions: {
    accepted: 'accepted_bounded_hypothesis',
    userContextRequired: 'requires_user_confirmation',
    blocked: 'blocked',
  },
  boundary: {
    submissionOnly: true,
    noHypothesisGeneration: true,
    noRecalculation: true,
    noMeaningAddition: true,
    noCrossLineageSynthesis: true,
    unresolvedPreserved: true,
    conflictsPreserved: true,
    userContextIsNotConfirmation: true,
    noDefinitivePersonalization: true,
    noResponseStorage: true,
    noResponseClassification: true,
    noPersonalizationEngine: true,
    activationNotMutated: true,
  },
})

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0
const clone = value => JSON.parse(JSON.stringify(value))
const arraysEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right)

function unique(values) {
  return [...new Set(values)]
}

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

function validateStringArray(value, path, errors, { required = false } = {}) {
  if (!Array.isArray(value)) {
    addError(errors, `${path}:not_array`)
    return []
  }
  if (required && value.length === 0) addError(errors, `${path}:empty`)
  if (value.some(item => !isNonEmptyString(item))) addError(errors, `${path}:invalid_item`)
  if (new Set(value).size !== value.length) addError(errors, `${path}:duplicate`)
  return value
}

function expectedSubmissionContract() {
  return clone(SUBMISSION_CONTRACT)
}

function validateHypothesisShape(hypothesis, errors) {
  exactKeys(hypothesis, [
    'id',
    'statement',
    'claimType',
    'status',
    'userExperienceGate',
    'factRefs',
    'evidenceIds',
    'semanticBasisIds',
    'conflictIds',
    'userContextIds',
    'sourceScope',
    'preservation',
    'assertion',
  ], 'hypothesis', errors)
  if (!isNonEmptyString(hypothesis?.id)) addError(errors, 'hypothesis:id_missing')
  if (!isNonEmptyString(hypothesis?.statement)) addError(errors, 'hypothesis:statement_missing')
  if (hypothesis?.claimType !== 'interpretation_hypothesis') addError(errors, 'hypothesis:claim_type_invalid')
  if (hypothesis?.status !== 'hypothesis') addError(errors, 'hypothesis:status_invalid')
  if (hypothesis?.userExperienceGate !== 'required') addError(errors, 'hypothesis:user_experience_gate_invalid')

  const factRefs = validateStringArray(hypothesis?.factRefs, 'hypothesis:factRefs', errors, { required: true })
  const evidenceIds = validateStringArray(hypothesis?.evidenceIds, 'hypothesis:evidenceIds', errors, { required: true })
  const semanticBasisIds = validateStringArray(hypothesis?.semanticBasisIds, 'hypothesis:semanticBasisIds', errors)
  const conflictIds = validateStringArray(hypothesis?.conflictIds, 'hypothesis:conflictIds', errors)
  const userContextIds = validateStringArray(hypothesis?.userContextIds, 'hypothesis:userContextIds', errors)

  exactKeys(hypothesis?.sourceScope, ['mode', 'lineages', 'sourceIds', 'locatorIds', 'generalization', 'crossLineage'], 'hypothesis.sourceScope', errors)
  if (hypothesis?.sourceScope?.mode !== 'exact_referenced_source_scope') addError(errors, 'hypothesis:source_scope_mode_invalid')
  const lineages = validateStringArray(hypothesis?.sourceScope?.lineages, 'hypothesis.sourceScope.lineages', errors, { required: true })
  const sourceIds = validateStringArray(hypothesis?.sourceScope?.sourceIds, 'hypothesis.sourceScope.sourceIds', errors, { required: true })
  const locatorIds = validateStringArray(hypothesis?.sourceScope?.locatorIds, 'hypothesis.sourceScope.locatorIds', errors, { required: true })
  if (hypothesis?.sourceScope?.generalization !== 'forbidden') addError(errors, 'hypothesis:source_generalization_not_forbidden')
  if (hypothesis?.sourceScope?.crossLineage !== 'forbidden') addError(errors, 'hypothesis:cross_lineage_not_forbidden')

  exactKeys(hypothesis?.preservation, ['unresolvedEvidenceIds', 'conflictIds'], 'hypothesis.preservation', errors)
  const unresolvedEvidenceIds = validateStringArray(hypothesis?.preservation?.unresolvedEvidenceIds, 'hypothesis.preservation.unresolvedEvidenceIds', errors)
  const preservedConflictIds = validateStringArray(hypothesis?.preservation?.conflictIds, 'hypothesis.preservation.conflictIds', errors)

  exactKeys(hypothesis?.assertion, ['mode', 'subjectScope', 'applicationMode', 'personalConclusion', 'unstatedPersonalAttributes'], 'hypothesis.assertion', errors)
  if (hypothesis?.assertion?.mode !== 'tentative') addError(errors, 'hypothesis:assertion_not_tentative')
  if (hypothesis?.assertion?.subjectScope !== 'source_bounded_evidence_and_explicit_user_context') addError(errors, 'hypothesis:subject_scope_invalid')
  if (!ALLOWED_APPLICATION_MODES.has(hypothesis?.assertion?.applicationMode)) addError(errors, 'hypothesis:application_mode_invalid')
  if (hypothesis?.assertion?.personalConclusion !== 'forbidden') addError(errors, 'hypothesis:definitive_personalization_forbidden')
  if (hypothesis?.assertion?.unstatedPersonalAttributes !== 'not_claimed') addError(errors, 'hypothesis:unstated_personal_attributes_claimed')

  return {
    id: hypothesis?.id,
    factRefs,
    evidenceIds,
    semanticBasisIds,
    conflictIds,
    userContextIds,
    sourceScope: { lineages, sourceIds, locatorIds },
    preservation: { unresolvedEvidenceIds, conflictIds: preservedConflictIds },
  }
}

function validateUserContext(userContext, hypothesisId, errors) {
  exactKeys(userContext, ['status', 'entries'], 'userContext', errors)
  const status = userContext?.status
  if (!ALLOWED_USER_CONTEXT_STATUSES.has(status)) addError(errors, 'user_context:status_invalid')
  if (!Array.isArray(userContext?.entries)) {
    addError(errors, 'user_context:entries_not_array')
    return { status, entries: [] }
  }
  const entries = userContext.entries
  if (status === 'not_provided' && entries.length > 0) addError(errors, 'user_context:not_provided_has_entries')
  if (status === 'reported' && entries.length === 0) addError(errors, 'user_context:reported_entries_missing')
  const ids = new Set()
  for (const [index, entry] of entries.entries()) {
    const path = `userContext.entries[${index}]`
    exactKeys(entry, ['id', 'statement', 'relation', 'hypothesisIds'], path, errors)
    if (!isNonEmptyString(entry?.id)) addError(errors, `${path}:id_missing`)
    else if (ids.has(entry.id)) addError(errors, `${path}:id_duplicate`)
    else ids.add(entry.id)
    if (!isNonEmptyString(entry?.statement)) addError(errors, `${path}:statement_missing`)
    if (!ALLOWED_USER_CONTEXT_RELATIONS.has(entry?.relation)) addError(errors, `${path}:relation_invalid`)
    const hypothesisIds = validateStringArray(entry?.hypothesisIds, `${path}.hypothesisIds`, errors)
    if (hypothesisIds.length > 0 && !hypothesisIds.includes(hypothesisId)) addError(errors, `${path}:not_bound_to_submitted_hypothesis`)
    if (status === 'reported' && !hypothesisIds.includes(hypothesisId)) addError(errors, `${path}:reported_context_not_bound`)
  }
  return { status, entries }
}

function evidenceState(item) {
  return item?.evidenceRole === 'lineage_state' || UNSAFE_EVIDENCE_STATUSES.has(item?.status)
}

function sourceRefsOf(item) {
  return {
    sourceIds: Array.isArray(item?.sourceRefs?.sourceIds) ? item.sourceRefs.sourceIds : [],
    locatorIds: Array.isArray(item?.sourceRefs?.locatorIds) ? item.sourceRefs.locatorIds : [],
  }
}

function sourceLineageOf(item) {
  if (Array.isArray(item?.lineages) && item.lineages.length === 1 && isNonEmptyString(item.lineages[0])) return item.lineages[0]
  if (isNonEmptyString(item?.lineage) && item.lineage !== 'none') return item.lineage
  return null
}

function inspectEvidence({ handoffPackage, hypothesis }, errors) {
  const constitutionInput = handoffPackage?.evidenceConsumption?.constitutionInput
  const evidence = Array.isArray(constitutionInput?.evidence) ? constitutionInput.evidence : []
  const conflicts = Array.isArray(constitutionInput?.conflicts) ? constitutionInput.conflicts : []
  const evidenceById = new Map(evidence.map(item => [item?.id, item]))
  const referenced = []
  for (const evidenceId of hypothesis.evidenceIds) {
    const item = evidenceById.get(evidenceId)
    if (!item) {
      addError(errors, `hypothesis:evidence_unknown:${evidenceId}`)
      continue
    }
    referenced.push(item)
    if (item.kind !== 'base_fact' && item.kind !== 'literature_claim') addError(errors, `hypothesis:evidence_kind_not_allowed:${evidenceId}`)
  }

  const baseFacts = referenced.filter(item => item.kind === 'base_fact')
  if (baseFacts.length === 0) addError(errors, 'hypothesis:base_fact_basis_missing')
  const declaredFactRefs = new Set(hypothesis.factRefs)
  for (const item of baseFacts) {
    for (const factRef of item.factRefs || []) {
      if (!declaredFactRefs.has(factRef)) addError(errors, `hypothesis:base_fact_ref_not_declared:${factRef}`)
    }
  }
  for (const factRef of hypothesis.factRefs) {
    if (!baseFacts.some(item => Array.isArray(item.factRefs) && item.factRefs.includes(factRef))) addError(errors, `hypothesis:fact_ref_not_represented:${factRef}`)
  }

  const sourceEvidence = referenced.filter(item => item.kind === 'literature_claim')
  if (sourceEvidence.length === 0) addError(errors, 'hypothesis:source_bounded_evidence_missing')
  const lineages = []
  const sourceIds = []
  const locatorIds = []
  const synthesisLineages = []
  for (const item of sourceEvidence) {
    const refs = sourceRefsOf(item)
    if (refs.sourceIds.length === 0 || refs.locatorIds.length === 0) addError(errors, `hypothesis:source_refs_missing:${item.id}`)
    for (const sourceId of refs.sourceIds) if (!sourceIds.includes(sourceId)) sourceIds.push(sourceId)
    for (const locatorId of refs.locatorIds) if (!locatorIds.includes(locatorId)) locatorIds.push(locatorId)
    const preservedConflict = item.relation === 'conflicts'
    if (preservedConflict) {
      if (!Array.isArray(item.lineages) || item.lineages.length < 2 || item.lineages.some(lineage => !isNonEmptyString(lineage) || lineage === 'none')) addError(errors, `hypothesis:conflict_lineage_scope_invalid:${item.id}`)
      else for (const lineage of item.lineages) if (!lineages.includes(lineage)) lineages.push(lineage)
    } else {
      const lineage = sourceLineageOf(item)
      if (!lineage) addError(errors, `hypothesis:lineage_missing:${item.id}`)
      else {
        if (!lineages.includes(lineage)) lineages.push(lineage)
        if (!synthesisLineages.includes(lineage)) synthesisLineages.push(lineage)
      }
      if (Array.isArray(item.lineages) && item.lineages.length !== 1) addError(errors, `hypothesis:lineage_not_single_source:${item.id}`)
      if (item.lineage && Array.isArray(item.lineages) && item.lineages.length === 1 && item.lineage !== item.lineages[0]) addError(errors, `hypothesis:lineage_identity_mismatch:${item.id}`)
    }
  }
  if (synthesisLineages.length > 1) addError(errors, 'hypothesis:cross_lineage_synthesis_forbidden')
  if (!arraysEqual(hypothesis.sourceScope.lineages, lineages)) addError(errors, 'hypothesis:source_scope_lineages_mismatch')
  if (!arraysEqual(hypothesis.sourceScope.sourceIds, sourceIds)) addError(errors, 'hypothesis:source_scope_sources_mismatch')
  if (!arraysEqual(hypothesis.sourceScope.locatorIds, locatorIds)) addError(errors, 'hypothesis:source_scope_locators_mismatch')

  const semanticBasis = []
  for (const semanticId of hypothesis.semanticBasisIds) {
    const item = evidenceById.get(semanticId)
    if (!item) {
      addError(errors, `hypothesis:semantic_basis_unknown:${semanticId}`)
      continue
    }
    if (!hypothesis.evidenceIds.includes(semanticId)) addError(errors, `hypothesis:semantic_basis_not_referenced:${semanticId}`)
    if (item.kind !== 'literature_claim' || item.status !== 'available' || item.admission !== 'semantic_candidate' || item.semanticBasisEligible !== true || !ALLOWED_SEMANTIC_ROLES.has(item.evidenceRole) || item.relation !== 'supports') {
      addError(errors, `hypothesis:semantic_basis_not_available:${semanticId}`)
    } else {
      semanticBasis.push(item)
    }
  }

  const declaredFactRefSet = new Set(hypothesis.factRefs)
  for (const item of sourceEvidence) {
    for (const factRef of item.factRefs || []) {
      if (!declaredFactRefSet.has(factRef)) addError(errors, `hypothesis:source_dependency_fact_not_declared:${factRef}`)
      if (!baseFacts.some(baseFact => Array.isArray(baseFact.factRefs) && baseFact.factRefs.includes(factRef))) addError(errors, `hypothesis:source_dependency_fact_not_referenced:${factRef}`)
    }
  }

  const referencedUnsafeIds = referenced.filter(evidenceState).map(item => item.id)
  const referencedConflictEvidenceIds = referenced.filter(item => item.relation === 'conflicts').map(item => item.id)
  const requiredConflictIds = conflicts
    .filter(conflict => Array.isArray(conflict?.evidenceIds) && conflict.evidenceIds.some(id => referencedConflictEvidenceIds.includes(id)))
    .map(conflict => conflict.id)
  if (!arraysEqual(hypothesis.preservation.unresolvedEvidenceIds, referencedUnsafeIds)) addError(errors, 'hypothesis:unresolved_not_exactly_preserved')
  if (!arraysEqual(hypothesis.preservation.conflictIds, requiredConflictIds)) addError(errors, 'hypothesis:conflicts_not_exactly_preserved')
  if (!arraysEqual(hypothesis.conflictIds, requiredConflictIds)) addError(errors, 'hypothesis:conflict_ids_not_exactly_referenced')
  for (const semanticItem of semanticBasis) {
    if (evidenceState(semanticItem) || semanticItem.relation === 'conflicts') addError(errors, `hypothesis:unsafe_semantic_basis:${semanticItem.id}`)
  }

  return {
    evidence,
    conflicts,
    evidenceById,
    referenced,
    baseFacts,
    sourceEvidence,
    semanticBasis,
    lineages,
    synthesisLineages,
    sourceIds,
    locatorIds,
    referencedUnsafeIds,
    requiredConflictIds,
  }
}

function makeContextEvidence(entry) {
  return {
    id: `saju.user-context.${entry.id}`,
    kind: 'user_experience',
    status: 'reported',
    admission: 'user_report',
    relation: entry.relation,
    statement: entry.statement,
  }
}

function buildConstitutionCheck(handoffPackage, submission, userContext) {
  const constitutionInput = clone(handoffPackage.evidenceConsumption.constitutionInput)
  const contextEntries = userContext.status === 'reported' ? userContext.entries : []
  const contextEvidence = contextEntries.map(makeContextEvidence)
  const contextEvidenceIds = contextEvidence.map(item => item.id)
  const contextConflicts = contextEvidence
    .filter(item => item.relation === 'conflicts')
    .map(item => ({
      id: `saju.user-context-conflict.${item.id.slice('saju.user-context.'.length)}`,
      evidenceIds: [item.id],
      resolution: 'preserved_tension',
    }))
  constitutionInput.evidence.push(...contextEvidence)
  constitutionInput.conflicts.push(...contextConflicts)
  const hypothesis = clone(submission.hypothesis)
  hypothesis.evidenceIds = [...hypothesis.evidenceIds, ...contextEvidenceIds]
  hypothesis.conflictIds = [
    ...hypothesis.conflictIds,
    ...contextConflicts.map(conflict => conflict.id),
  ]
  constitutionInput.hypotheses = [hypothesis]
  return {
    input: constitutionInput,
    result: evaluateInterpretationConstitution(constitutionInput),
    contextEvidenceIds,
    contextConflictIds: contextConflicts.map(conflict => conflict.id),
  }
}

function buildDecision({ hypothesis, userContext, evidenceInspection, constitution }) {
  if (evidenceInspection.semanticBasis.length === 0) return 'blocked'
  const hasSupportingContext = userContext.entries.some(entry => entry.relation === 'supports' && entry.hypothesisIds.includes(hypothesis.id))
  const hasConflictingContext = userContext.entries.some(entry => entry.relation === 'conflicts' && entry.hypothesisIds.includes(hypothesis.id))
  const contextRequired = hypothesis.assertion.applicationMode === 'user_context_comparison'
    && (userContext.status !== 'reported' || !hasSupportingContext)
  if (evidenceInspection.referencedUnsafeIds.length > 0 || evidenceInspection.requiredConflictIds.length > 0 || hasConflictingContext || contextRequired) return 'requires_user_confirmation'
  return 'accepted_bounded_hypothesis'
}

function readinessFor(decision, userContext) {
  const blockers = ['submission_cannot_promote_runtime_activation']
  if (decision === 'accepted_bounded_hypothesis') blockers.push('personal_application_requires_confirmation')
  else if (decision === 'requires_user_confirmation') blockers.push('user_context_or_preserved_boundary_requires_confirmation')
  else blockers.push('hypothesis_submission_blocked')
  return {
    submissionValidationReady: true,
    boundedHypothesisDiscussionReady: decision === 'accepted_bounded_hypothesis',
    userContextProvided: userContext.status === 'reported',
    conversationalInterpretationActivationReady: false,
    personalApplicationReady: false,
    activationMutation: 'forbidden',
    blockers,
    reason: 'submission validation may allow bounded hypothesis discussion only; it never promotes runtime activation or definitive personal application',
  }
}

function resultFor({ submission, userContext, evidenceInspection, constitution, decision }) {
  const hypothesis = submission.hypothesis
  const hasSupportingContext = userContext.entries.some(entry => entry.relation === 'supports' && entry.hypothesisIds.includes(hypothesis.id))
  const hasConflictingContext = userContext.entries.some(entry => entry.relation === 'conflicts' && entry.hypothesisIds.includes(hypothesis.id))
  const userContextDecision = hasConflictingContext
    ? 'reported_user_conflict_defer_application'
    : hasSupportingContext
      ? 'reported_context_only_not_confirmation'
      : 'user_context_required_before_personal_application'
  return {
    decision,
    status: decision === 'accepted_bounded_hypothesis'
      ? 'bounded_hypothesis_only'
      : decision === 'requires_user_confirmation'
        ? 'user_context_required'
        : 'blocked',
    hypothesisId: hypothesis.id,
    factRefs: [...hypothesis.factRefs],
    factEvidenceIds: evidenceInspection.baseFacts.map(item => item.id),
    sourceEvidenceIds: evidenceInspection.sourceEvidence.map(item => item.id),
    semanticBasisIds: evidenceInspection.semanticBasis.map(item => item.id),
    compositionEvidenceIds: evidenceInspection.semanticBasis.filter(item => item.evidenceRole === 'composition_result').map(item => item.id),
    sourceScope: clone(hypothesis.sourceScope),
    userContextIds: [...hypothesis.userContextIds],
    userContextDecision,
    unresolvedEvidenceIds: [...evidenceInspection.referencedUnsafeIds],
    conflictIds: [...evidenceInspection.requiredConflictIds],
    conflictState: evidenceInspection.requiredConflictIds.length > 0 ? 'preserved_tension' : 'no_source_conflict_referenced',
    constitutionDecision: constitution.result.interpretationDecision,
    hypothesisUse: decision === 'accepted_bounded_hypothesis' ? 'bounded_source_and_context_discussion_only' : 'do_not_apply_until_boundary_is_confirmed',
    sourceGeneralization: 'forbidden',
    userUnstatedAttributes: 'not_claimed',
    definitivePersonalization: false,
    noHypothesisGenerated: true,
    noRecalculation: true,
    noCrossLineageSynthesis: true,
    noMeaningAddition: true,
  }
}

function invalidResult(errors, handoffValidation = null, constitution = null) {
  return {
    valid: false,
    errors: unique(errors).sort(),
    decision: 'blocked',
    blockers: unique(errors).sort(),
    validation: null,
    handoffValidation,
    constitution,
  }
}

/**
 * Validate a submitted user context and hypothesis against one canonical
 * conversational handoff package.  The returned decision is not an
 * activation decision and no submitted text is persisted.
 */
export function buildSajuHypothesisSubmissionValidation({ handoffPackage, submission } = {}) {
  const handoffValidation = validateSajuConversationalHandoffPackage(handoffPackage)
  if (!handoffValidation.valid) return invalidResult(handoffValidation.errors.map(error => `handoff:${error}`), handoffValidation)

  const errors = []
  if (!isObject(submission)) return invalidResult(['submission_not_object'], handoffValidation)
  exactKeys(submission, ['schemaVersion', 'version', 'kind', 'submissionId', 'userContext', 'hypothesis'], '$', errors)
  if (submission.schemaVersion !== SAJU_HYPOTHESIS_SUBMISSION_SCHEMA || submission.version !== SAJU_HYPOTHESIS_SUBMISSION_VERSION || submission.kind !== SAJU_HYPOTHESIS_SUBMISSION_KIND) addError(errors, 'submission_schema_mismatch')
  if (!isNonEmptyString(submission.submissionId)) addError(errors, 'submission_id_missing')

  const hypothesisShape = validateHypothesisShape(submission.hypothesis, errors)
  const userContext = validateUserContext(submission.userContext, hypothesisShape.id, errors)
  if (userContext.status === 'not_provided' && hypothesisShape.userContextIds.length > 0) addError(errors, 'user_context_ids_present_when_not_provided')
  if (userContext.status === 'reported' && !arraysEqual(hypothesisShape.userContextIds, userContext.entries.map(entry => entry.id))) addError(errors, 'user_context_ids_not_lossless')

  const evidenceInspection = inspectEvidence({ handoffPackage, hypothesis: {
    ...hypothesisShape,
    sourceScope: hypothesisShape.sourceScope,
    preservation: hypothesisShape.preservation,
  } }, errors)
  const constitution = buildConstitutionCheck(handoffPackage, submission, userContext)
  if (!constitution.result.contractValid) errors.push(...constitution.result.violations.map(error => `constitution:${error}`))
  if (errors.length > 0) return invalidResult(errors, handoffValidation, constitution.result)

  const decision = buildDecision({ hypothesis: submission.hypothesis, userContext, evidenceInspection, constitution })
  const result = resultFor({ submission, userContext, evidenceInspection, constitution, decision })
  const validation = {
    schemaVersion: SAJU_HYPOTHESIS_VALIDATION_SCHEMA,
    version: SAJU_HYPOTHESIS_VALIDATION_VERSION,
    kind: SAJU_HYPOTHESIS_VALIDATION_KIND,
    handoffPackage: {
      schemaVersion: handoffPackage.schemaVersion,
      version: handoffPackage.version,
      kind: handoffPackage.kind,
    },
    submissionContract: expectedSubmissionContract(),
    submission: clone(submission),
    result,
    readiness: readinessFor(decision, userContext),
  }
  return {
    valid: true,
    errors: [],
    decision,
    blockers: decision === 'blocked' ? ['semantic_basis_missing'] : [],
    validation,
    handoffValidation,
    constitution: constitution.result,
  }
}

export function exportSajuHypothesisSubmissionJson(submission, indent = 2) {
  return JSON.stringify(submission, null, indent)
}

/**
 * Reconsume a submitted JSON document from a fresh transport surface.  A
 * malformed or policy-invalid submission produces no validated result.
 */
export function consumeSajuHypothesisSubmission(serialized, { handoffPackage } = {}) {
  let submission
  try {
    submission = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized)
  } catch {
    return invalidResult(['submission_json_invalid'])
  }
  return buildSajuHypothesisSubmissionValidation({ handoffPackage, submission })
}
