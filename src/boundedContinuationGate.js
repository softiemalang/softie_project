import { createHash } from 'node:crypto'
import {
  canonicalSubagentEvidenceJson,
  checkSubagentEvidenceContract,
} from './subagentEvidenceContract.js'

export const BOUNDED_CONTINUATION_GATE_VERSION = 'bounded-continuation-gate-v0'

export const CONTINUATION_DECISIONS = Object.freeze([
  'continue',
  'stop_complete',
  'stop_blocked',
  'recheck_required',
])

export const CONTINUATION_FAILURE_CLASSES = Object.freeze([
  'none',
  'deterministic',
  'transient',
  'flaky',
  'aggregate',
  'unknown',
])

export const CONTINUATION_REASON_CODES = Object.freeze([
  'gate_input_invalid',
  'child_contract_invalid',
  'parent_verification_missing',
  'parent_verification_pending',
  'parent_verification_rejected',
  'attempt_identity_invalid',
  'attempt_identity_changed',
  'relevant_state_changed',
  'new_evidence',
  'new_artifact',
  'validated_fact',
  'blocker_reduced',
  'new_checkable_frontier',
  'frontier_not_actionable',
  'deterministic_failure_checkpoint',
  'deterministic_failure_pivot',
  'same_deterministic_failure',
  'transient_failure_recheck',
  'flaky_failure_recheck',
  'aggregate_failure_recheck',
  'unknown_failure_recheck',
  'external_transient_unresolved',
  'external_flaky_unresolved',
  'external_aggregate_unresolved',
  'external_unknown_unresolved',
  'scope_complete',
  'unresolved_parent_blocker',
  'no_safe_frontier',
  'budget_checkpoint',
])

export const BOUNDED_CONTINUATION_AUTHORITY_BOUNDARY = Object.freeze({
  gateRole: 'workflow_continuation_only',
  domainReadiness: 'not_evaluated',
  semanticAuthority: 'not_established',
  productionActivation: false,
  childPassIsParentGoalPass: false,
})

const HEAD = /^[0-9a-f]{40}$/i
const HASH = /^[0-9a-f]{64}$/i
const WORKTREE_STATES = new Set(['clean', 'dirty', 'unknown'])
const NETWORK_CONDITIONS = new Set(['local', 'available', 'unavailable', 'unknown'])
const FAILURE_CLASSES = new Set(CONTINUATION_FAILURE_CLASSES)
const FAILURE_STAGES = new Set(['none', 'materialize', 'check', 'source_resolution', 'parent_verification', 'other'])
const RESOLUTIONS = new Set(['resolved', 'missing', 'mismatched', 'unknown'])
const BLOCKER_STATUSES = new Set(['open', 'pending', 'resolved'])
const PENDING_FAILURE_CLASSES = new Set(['transient', 'flaky', 'aggregate', 'unknown'])
const FORBIDDEN_PROMOTION_FIELDS = new Set([
  'readiness',
  'domainReadiness',
  'semanticAuthority',
  'activation',
  'productionActivation',
  'availableForInterpretation',
  'serviceEligibility',
  'claimPromotion',
  'readinessPromotion',
  'semanticAuthorityPromotion',
  'activationPromotion',
  'childPassIsParentGoalPass',
  'authorityBoundary',
  'canonicalArtifactPayload',
  'artifactPayload',
])

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const hasText = value => typeof value === 'string' && value.trim().length > 0
const isBoolean = value => typeof value === 'boolean'
const isInteger = value => Number.isInteger(value)
const unique = values => [...new Set(values)]

const addError = (errors, code) => {
  if (!errors.includes(code)) errors.push(code)
}

const addReason = (reasons, code) => {
  if (!reasons.includes(code)) reasons.push(code)
}

const normalizeNoise = value => String(value)
  .replace(/\r\n?/g, '\n')
  .replace(/\b\d{4}-\d{2}-\d{2}(?:[T ][0-9:.+\-Z]+)?\b/g, '<timestamp>')
  .replace(/\b(pid|process(?:\s+id)?|worker(?:\s+id)?)\s*[:=]?\s*\d+\b/gi, '$1=<pid>')
  .replace(/(?:file:\/\/)?\/(?:private\/tmp|tmp|var\/tmp|var\/folders)[^\s"'`,;)]*/g, '<temp-path>')
  .replace(/[ \t]+/g, ' ')
  .trim()

const stableValue = value => {
  if (Array.isArray(value)) return value.map(stableValue)
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, stableValue(child)]))
  return value
}

export function normalizeFailureSignature(value) {
  return normalizeNoise(value || '')
}

function validateAttempt(attempt, errors, path = 'attempt') {
  if (!isObject(attempt)) {
    addError(errors, `invalid_object:${path}`)
    return
  }

  if (!isObject(attempt.action)) addError(errors, `invalid_object:${path}.action`)
  else {
    for (const key of ['actionId', 'kind', 'command']) if (!hasText(attempt.action[key])) addError(errors, `invalid_string:${path}.action.${key}`)
    if (attempt.action.args !== undefined && !Array.isArray(attempt.action.args)) addError(errors, `invalid_array:${path}.action.args`)
    if (attempt.action.toolVersion !== undefined && !hasText(attempt.action.toolVersion)) addError(errors, `invalid_string:${path}.action.toolVersion`)
  }

  if (!Array.isArray(attempt.inputs)) addError(errors, `invalid_array:${path}.inputs`)
  else {
    const inputIds = new Set()
    attempt.inputs.forEach((input, index) => {
      const inputPath = `${path}.inputs[${index}]`
      if (!isObject(input)) {
        addError(errors, `invalid_object:${inputPath}`)
        return
      }
      if (!hasText(input.refId)) addError(errors, `invalid_string:${inputPath}.refId`)
      else if (inputIds.has(input.refId)) addError(errors, `duplicate_input_ref:${input.refId}`)
      else inputIds.add(input.refId)
      if (!hasText(input.identity)) addError(errors, `invalid_string:${inputPath}.identity`)
      if (input.resolution !== undefined && !RESOLUTIONS.has(input.resolution)) addError(errors, `invalid_resolution:${inputPath}.resolution`)
    })
  }

  if (!isObject(attempt.basis)) addError(errors, `invalid_object:${path}.basis`)
  else {
    if (!hasText(attempt.basis.branch) || /[\\\s]/.test(attempt.basis.branch)) addError(errors, `invalid_branch:${path}.basis.branch`)
    if (!HEAD.test(attempt.basis.basisHead || '')) addError(errors, `invalid_head:${path}.basis.basisHead`)
    if (!WORKTREE_STATES.has(attempt.basis.scopedWorktreeState)) addError(errors, `invalid_worktree_state:${path}.basis.scopedWorktreeState`)
    if (!hasText(attempt.basis.scopedWorktreeDigest)) addError(errors, `invalid_string:${path}.basis.scopedWorktreeDigest`)
    if (attempt.basis.observedHeadRelevant !== undefined && !isBoolean(attempt.basis.observedHeadRelevant)) addError(errors, `invalid_boolean:${path}.basis.observedHeadRelevant`)
    if (attempt.basis.observedHeadRelevant === true && !HEAD.test(attempt.basis.observedHead || '')) addError(errors, `invalid_head:${path}.basis.observedHead`)
  }

  if (!isObject(attempt.environment)) addError(errors, `invalid_object:${path}.environment`)
  else {
    for (const key of ['runtime', 'platform', 'dependencyIdentity', 'sourceIdentity']) if (!hasText(attempt.environment[key])) addError(errors, `invalid_string:${path}.environment.${key}`)
    if (!NETWORK_CONDITIONS.has(attempt.environment.networkCondition)) addError(errors, `invalid_network_condition:${path}.environment.networkCondition`)
  }

  if (!isObject(attempt.failure)) addError(errors, `invalid_object:${path}.failure`)
  else {
    if (!FAILURE_CLASSES.has(attempt.failure.class)) addError(errors, `invalid_failure_class:${path}.failure.class`)
    if (!FAILURE_STAGES.has(attempt.failure.stage)) addError(errors, `invalid_failure_stage:${path}.failure.stage`)
    if (!hasText(attempt.failure.code)) addError(errors, `invalid_string:${path}.failure.code`)
    if (attempt.failure.exitCode !== undefined && attempt.failure.exitCode !== null && (!isInteger(attempt.failure.exitCode) || attempt.failure.exitCode < 0)) addError(errors, `invalid_exit_code:${path}.failure.exitCode`)
    if (attempt.failure.signal !== undefined && attempt.failure.signal !== null && !hasText(attempt.failure.signal)) addError(errors, `invalid_signal:${path}.failure.signal`)
    if (attempt.failure.signature !== undefined && !hasText(attempt.failure.signature)) addError(errors, `invalid_signature:${path}.failure.signature`)
    if (attempt.failure.message !== undefined && !hasText(attempt.failure.message)) addError(errors, `invalid_message:${path}.failure.message`)
    if (attempt.failure.class === 'none' && attempt.failure.code !== 'none') addError(errors, `none_failure_code_mismatch:${path}.failure.code`)
    if (attempt.failure.class !== 'none' && attempt.failure.code === 'none') addError(errors, `non_none_failure_code_invalid:${path}.failure.code`)
  }
}

function validateProgress(progress, errors) {
  if (!isObject(progress)) {
    addError(errors, 'invalid_object:workUnit.progress')
    return
  }
  for (const key of ['newEvidence', 'newArtifacts', 'validatedFacts', 'blockerReductions']) {
    if (!Array.isArray(progress[key])) {
      addError(errors, `invalid_array:workUnit.progress.${key}`)
      continue
    }
    progress[key].forEach((item, index) => {
      const path = `workUnit.progress.${key}[${index}]`
      if (!isObject(item)) {
        addError(errors, `invalid_object:${path}`)
        return
      }
      if (!hasText(item.id)) addError(errors, `invalid_string:${path}.id`)
      if (!isBoolean(item.verified)) addError(errors, `invalid_boolean:${path}.verified`)
      if (key === 'blockerReductions') {
        if (!BLOCKER_STATUSES.has(item.from)) addError(errors, `invalid_blocker_status:${path}.from`)
        if (!BLOCKER_STATUSES.has(item.to)) addError(errors, `invalid_blocker_status:${path}.to`)
      }
    })
  }
  if (progress.nextFrontier !== null && !isObject(progress.nextFrontier)) addError(errors, 'invalid_frontier')
  if (isObject(progress.nextFrontier)) {
    for (const key of ['id', 'actionId']) if (!hasText(progress.nextFrontier[key])) addError(errors, `invalid_string:workUnit.progress.nextFrontier.${key}`)
    for (const key of ['checkable', 'authorized']) if (!isBoolean(progress.nextFrontier[key])) addError(errors, `invalid_boolean:workUnit.progress.nextFrontier.${key}`)
  }
}

function validateWorkUnit(workUnit, errors) {
  if (!isObject(workUnit)) {
    addError(errors, 'invalid_object:workUnit')
    return
  }
  validateProgress(workUnit.progress, errors)
  if (!Array.isArray(workUnit.unknowns)) addError(errors, 'invalid_array:workUnit.unknowns')
  else workUnit.unknowns.forEach((item, index) => {
    const path = `workUnit.unknowns[${index}]`
    if (!isObject(item)) addError(errors, `invalid_object:${path}`)
    else {
      if (!hasText(item.id)) addError(errors, `invalid_string:${path}.id`)
      if (!isBoolean(item.blocksParent)) addError(errors, `invalid_boolean:${path}.blocksParent`)
    }
  })
  if (!Array.isArray(workUnit.blockers)) addError(errors, 'invalid_array:workUnit.blockers')
  else workUnit.blockers.forEach((item, index) => {
    const path = `workUnit.blockers[${index}]`
    if (!isObject(item)) addError(errors, `invalid_object:${path}`)
    else {
      if (!hasText(item.id)) addError(errors, `invalid_string:${path}.id`)
      if (!BLOCKER_STATUSES.has(item.status)) addError(errors, `invalid_blocker_status:${path}.status`)
      if (!isBoolean(item.blocksParent)) addError(errors, `invalid_boolean:${path}.blocksParent`)
    }
  })
  if (!isObject(workUnit.scope)) addError(errors, 'invalid_object:workUnit.scope')
  else {
    if (!isBoolean(workUnit.scope.acceptanceComplete)) addError(errors, 'invalid_boolean:workUnit.scope.acceptanceComplete')
    if (!isBoolean(workUnit.scope.objectiveUnmet)) addError(errors, 'invalid_boolean:workUnit.scope.objectiveUnmet')
    if (workUnit.scope.acceptanceComplete === true && workUnit.scope.objectiveUnmet === true) addError(errors, 'scope_complete_and_objective_unmet')
  }
}

function validateParentVerification(value, errors, childPresent) {
  if (value === undefined || value === null) {
    if (childPresent) addError(errors, 'parent_verification_missing')
    return
  }
  if (!isObject(value)) {
    addError(errors, 'invalid_object:parentVerification')
    return
  }
  if (!['pending', 'verified', 'rejected'].includes(value.status)) addError(errors, 'invalid_parent_verification_status')
  if (!['none', 'reference_check', 'direct_recheck'].includes(value.mode)) addError(errors, 'invalid_parent_verification_mode')
  if (!Array.isArray(value.recheckedValidationIds) || value.recheckedValidationIds.some(id => !hasText(id))) addError(errors, 'invalid_parent_rechecked_validation_ids')
  if (childPresent && value.status === 'verified' && value.mode === 'none') addError(errors, 'child_parent_verification_mode_missing')
  if (value.status === 'verified' && value.mode === 'direct_recheck' && Array.isArray(value.recheckedValidationIds) && value.recheckedValidationIds.length === 0) addError(errors, 'parent_verification_recheck_missing')
}

function validatePreviousAttempt(value, errors) {
  if (value === undefined || value === null) return
  if (!isObject(value)) {
    addError(errors, 'invalid_object:previousAttempt')
    return
  }
  if (!HASH.test(value.fingerprint || '')) addError(errors, 'invalid_previous_fingerprint')
  if (!HASH.test(value.stateFingerprint || '')) addError(errors, 'invalid_previous_state_fingerprint')
  if (!Array.isArray(value.progressIds) || value.progressIds.some(id => !hasText(id))) addError(errors, 'invalid_previous_progress_ids')
  if (value.frontierId !== null && !hasText(value.frontierId)) addError(errors, 'invalid_previous_frontier_id')
  if (!isInteger(value.recheckCount) || value.recheckCount < 0) addError(errors, 'invalid_previous_recheck_count')
}

function rejectPromotionFields(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((child, index) => rejectPromotionFields(child, `${path}[${index}]`, errors))
    return
  }
  if (!isObject(value)) return
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`
    if (FORBIDDEN_PROMOTION_FIELDS.has(key)) addError(errors, `promotion_field_forbidden:${childPath}`)
    else rejectPromotionFields(child, childPath, errors)
  }
}

function validateGateInput(input) {
  const errors = []
  if (!isObject(input)) return ['invalid_object:input']
  for (const [key, value] of Object.entries({
    attempt: input.attempt,
    workUnit: input.workUnit,
    parentVerification: input.parentVerification,
    previousAttempt: input.previousAttempt,
    budget: input.budget,
  })) {
    rejectPromotionFields(value, key, errors)
  }
  validateAttempt(input.attempt, errors)
  validateWorkUnit(input.workUnit, errors)
  validateParentVerification(input.parentVerification, errors, input.childEnvelope !== undefined && input.childEnvelope !== null)
  validatePreviousAttempt(input.previousAttempt, errors)
  if (input.budget !== undefined && (!isObject(input.budget) || !isBoolean(input.budget.checkpointDue))) addError(errors, 'invalid_budget')
  return unique(errors)
}

function normalizeInputIdentity(input) {
  return {
    refId: input.refId.trim(),
    identity: input.identity.trim(),
    ...(input.resolution === undefined ? {} : { resolution: input.resolution }),
  }
}

export function buildAttemptStateIdentity(attempt) {
  const errors = []
  validateAttempt(attempt, errors)
  if (errors.length > 0) throw new Error(`attempt identity invalid: ${errors.join(', ')}`)
  const action = attempt.action
  const basis = attempt.basis
  const environment = attempt.environment
  const identity = {
    schemaVersion: BOUNDED_CONTINUATION_GATE_VERSION,
    action: {
      actionId: action.actionId.trim(),
      kind: action.kind.trim(),
      command: normalizeNoise(action.command),
      args: stableValue(action.args || []),
      toolVersion: action.toolVersion?.trim() || null,
    },
    relevantInputs: attempt.inputs.map(normalizeInputIdentity).sort((left, right) => left.refId.localeCompare(right.refId)),
    basis: {
      branch: basis.branch.trim(),
      basisHead: basis.basisHead.toLowerCase(),
      scopedWorktreeState: basis.scopedWorktreeState,
      scopedWorktreeDigest: basis.scopedWorktreeDigest.trim(),
      ...(basis.observedHeadRelevant === true ? { observedHead: basis.observedHead.toLowerCase() } : {}),
    },
    environment: {
      runtime: environment.runtime.trim(),
      platform: environment.platform.trim(),
      dependencyIdentity: environment.dependencyIdentity.trim(),
      sourceIdentity: environment.sourceIdentity.trim(),
      networkCondition: environment.networkCondition,
    },
  }
  return identity
}

export function buildAttemptIdentity(attempt) {
  return {
    ...buildAttemptStateIdentity(attempt),
    failure: {
      class: attempt.failure.class,
      stage: attempt.failure.stage,
      code: attempt.failure.code.trim(),
      exitCode: attempt.failure.exitCode ?? null,
      signal: attempt.failure.signal?.trim() || null,
      signature: normalizeFailureSignature(attempt.failure.signature || attempt.failure.message || attempt.failure.code),
    },
  }
}

export const canonicalBoundedContinuationJson = value => canonicalSubagentEvidenceJson(value)

function sha256(value) {
  return createHash('sha256').update(canonicalBoundedContinuationJson(value)).digest('hex')
}

export function attemptStateFingerprint(attempt) {
  return sha256(buildAttemptStateIdentity(attempt))
}

export function attemptFingerprint(attempt) {
  return sha256(buildAttemptIdentity(attempt))
}

function progressSnapshot(workUnit, previousAttempt) {
  const previousIds = new Set(previousAttempt?.progressIds || [])
  const collect = values => values.filter(item => item.verified === true).map(item => item.id).filter(id => !previousIds.has(id))
  const newEvidenceIds = collect(workUnit.progress.newEvidence)
  const newArtifactIds = collect(workUnit.progress.newArtifacts)
  const validatedFactIds = collect(workUnit.progress.validatedFacts)
  const blockerReductionIds = workUnit.progress.blockerReductions
    .filter(item => item.verified === true && BLOCKER_STATUSES.has(item.from) && BLOCKER_STATUSES.has(item.to) && item.from !== item.to)
    .filter(item => {
      const rank = { open: 2, pending: 1, resolved: 0 }
      return rank[item.to] < rank[item.from] && !previousIds.has(item.id)
    })
    .map(item => item.id)
  const frontier = workUnit.progress.nextFrontier
  const frontierAvailable = isObject(frontier) && frontier.checkable === true && frontier.authorized === true
  const frontierNotActionable = isObject(frontier) && !frontierAvailable
  const frontierNew = frontierAvailable && frontier.id !== (previousAttempt?.frontierId || null)
  const currentProgressIds = [...new Set([...newEvidenceIds, ...newArtifactIds, ...validatedFactIds, ...blockerReductionIds])]
  const progressIds = [...new Set([...(previousAttempt?.progressIds || []), ...currentProgressIds])].sort()
  return {
    newEvidenceIds,
    newArtifactIds,
    validatedFactIds,
    blockerReductionIds,
    frontierId: frontierAvailable ? frontier.id : null,
    frontierActionId: frontierAvailable ? frontier.actionId : null,
    frontierAvailable,
    frontierNotActionable,
    frontierNew,
    currentProgressIds,
    progressIds,
    hasVerifiedProgress: currentProgressIds.length > 0 || frontierNew,
  }
}

function authorityBoundary() {
  return { ...BOUNDED_CONTINUATION_AUTHORITY_BOUNDARY }
}

function baseResult({ decision, reasons, attemptFp = null, stateFp = null, previousAttempt = null, errors = [], progress = null, checkpointDue = false, checkpointCount = 0, attemptIdentityChanged = false, sameAttempt = false }) {
  return {
    gateVersion: BOUNDED_CONTINUATION_GATE_VERSION,
    decision,
    reasonCodes: unique(reasons),
    attemptFingerprint: attemptFp,
    stateFingerprint: stateFp,
    previousAttemptFingerprint: previousAttempt?.fingerprint || null,
    attemptIdentityChanged,
    sameAttempt,
    progress,
    checkpoint: {
      automaticRetry: false,
      checkpointDue,
      recheckCount: checkpointCount,
    },
    errors: [...errors],
    authorityBoundary: authorityBoundary(),
  }
}

function parentBlockerSnapshot(workUnit) {
  const blockingUnknowns = workUnit.unknowns.filter(item => item.blocksParent === true).map(item => item.id)
  const blockingBlockers = workUnit.blockers.filter(item => item.blocksParent === true && item.status !== 'resolved').map(item => item.id)
  return { blockingUnknowns, blockingBlockers, hasBlocking: blockingUnknowns.length > 0 || blockingBlockers.length > 0 }
}

function unresolvedReason(snapshot, reasons) {
  if (snapshot.hasBlocking) addReason(reasons, 'unresolved_parent_blocker')
}

function pendingFailureDecision({ failureClass, sameAttempt, previousAttempt, reasons }) {
  if (sameAttempt && (previousAttempt?.recheckCount || 0) >= 1) {
    addReason(reasons, `external_${failureClass}_unresolved`)
    return 'stop_blocked'
  }
  addReason(reasons, `${failureClass}_failure_recheck`)
  return 'recheck_required'
}

export function evaluateBoundedContinuation(input = {}) {
  const inputErrors = validateGateInput(input)
  if (inputErrors.length > 0) {
    return baseResult({ decision: 'recheck_required', reasons: ['gate_input_invalid'], errors: inputErrors, checkpointDue: input?.budget?.checkpointDue === true })
  }

  let attemptFp
  let stateFp
  try {
    attemptFp = attemptFingerprint(input.attempt)
    stateFp = attemptStateFingerprint(input.attempt)
  } catch (error) {
    return baseResult({ decision: 'recheck_required', reasons: ['attempt_identity_invalid'], errors: [error.message], checkpointDue: input.budget?.checkpointDue === true })
  }

  const previousAttempt = input.previousAttempt || null
  const sameAttempt = Boolean(previousAttempt && previousAttempt.fingerprint === attemptFp)
  const attemptIdentityChanged = Boolean(previousAttempt && previousAttempt.fingerprint !== attemptFp)
  const relevantStateChanged = Boolean(previousAttempt && previousAttempt.stateFingerprint !== stateFp)
  const progress = progressSnapshot(input.workUnit, previousAttempt)
  const reasons = []
  const checkpointDue = input.budget?.checkpointDue === true
  if (checkpointDue) addReason(reasons, 'budget_checkpoint')
  if (attemptIdentityChanged) addReason(reasons, 'attempt_identity_changed')
  if (relevantStateChanged) addReason(reasons, 'relevant_state_changed')
  if (progress.newEvidenceIds.length > 0) addReason(reasons, 'new_evidence')
  if (progress.newArtifactIds.length > 0) addReason(reasons, 'new_artifact')
  if (progress.validatedFactIds.length > 0) addReason(reasons, 'validated_fact')
  if (progress.blockerReductionIds.length > 0) addReason(reasons, 'blocker_reduced')
  if (progress.frontierNew) addReason(reasons, 'new_checkable_frontier')
  if (progress.frontierNotActionable) addReason(reasons, 'frontier_not_actionable')

  if (input.childEnvelope !== undefined && input.childEnvelope !== null) {
    const childErrors = checkSubagentEvidenceContract(input.childEnvelope)
    if (childErrors.length > 0) {
      return baseResult({ decision: 'recheck_required', reasons: ['child_contract_invalid'], attemptFp, stateFp, previousAttempt, progress, errors: childErrors, checkpointDue })
    }
  }

  const parentVerification = input.parentVerification
  if (parentVerification && parentVerification.status !== 'verified') {
    addReason(reasons, parentVerification.status === 'pending' ? 'parent_verification_pending' : 'parent_verification_rejected')
    return baseResult({ decision: 'recheck_required', reasons, attemptFp, stateFp, previousAttempt, progress, checkpointDue, checkpointCount: (previousAttempt?.recheckCount || 0) + 1 })
  }

  const failureClass = input.attempt.failure.class
  if (PENDING_FAILURE_CLASSES.has(failureClass)) {
    const decision = pendingFailureDecision({ failureClass, sameAttempt, previousAttempt, reasons })
    return baseResult({ decision, reasons, attemptFp, stateFp, previousAttempt, progress, checkpointDue, checkpointCount: decision === 'recheck_required' ? (sameAttempt ? (previousAttempt?.recheckCount || 0) + 1 : 1) : previousAttempt?.recheckCount || 1 })
  }

  const blockerSnapshot = parentBlockerSnapshot(input.workUnit)
  if (failureClass === 'deterministic') {
    if (sameAttempt) {
      addReason(reasons, 'same_deterministic_failure')
      unresolvedReason(blockerSnapshot, reasons)
      return baseResult({ decision: 'stop_blocked', reasons, attemptFp, stateFp, previousAttempt, progress, checkpointDue, checkpointCount: previousAttempt?.recheckCount || 1 })
    }
    const safePivot = progress.frontierNew && progress.frontierAvailable && progress.frontierActionId !== input.attempt.action.actionId
    if (safePivot) {
      addReason(reasons, 'deterministic_failure_pivot')
      return baseResult({ decision: 'continue', reasons, attemptFp, stateFp, previousAttempt, progress, checkpointDue })
    }
    addReason(reasons, 'deterministic_failure_checkpoint')
    unresolvedReason(blockerSnapshot, reasons)
    return baseResult({ decision: 'recheck_required', reasons, attemptFp, stateFp, previousAttempt, progress, checkpointDue, checkpointCount: 1 })
  }

  const scope = input.workUnit.scope
  if (progress.hasVerifiedProgress && progress.frontierAvailable) {
    return baseResult({ decision: 'continue', reasons, attemptFp, stateFp, previousAttempt, progress, checkpointDue })
  }

  if (scope.acceptanceComplete === true && scope.objectiveUnmet === false && !blockerSnapshot.hasBlocking) {
    addReason(reasons, 'scope_complete')
    return baseResult({ decision: 'stop_complete', reasons, attemptFp, stateFp, previousAttempt, progress, checkpointDue })
  }

  unresolvedReason(blockerSnapshot, reasons)
  addReason(reasons, 'no_safe_frontier')
  return baseResult({ decision: 'stop_blocked', reasons, attemptFp, stateFp, previousAttempt, progress, checkpointDue })
}
