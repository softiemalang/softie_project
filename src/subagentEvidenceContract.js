import { createHash } from 'node:crypto'

export const SUBAGENT_EVIDENCE_SCHEMA = 'subagent-evidence-contract-v0'
export const SUBAGENT_EVIDENCE_VERSION = '0.1.0'

export const SUBAGENT_EVIDENCE_STATUSES = Object.freeze([
  'completed',
  'completed_with_unknowns',
  'failed',
  'cancelled',
])

export const SUBAGENT_ALLOWED_ACTIONS = Object.freeze([
  'read',
  'inspect',
  'read_bytes',
  'visual_review',
  'run_local_checks',
  'materialize_temp',
])

export const SUBAGENT_FORBIDDEN_ACTIONS = Object.freeze([
  'edit',
  'install',
  'remote',
  'destructive',
  'claim_promotion',
  'semantic_authority_promotion',
  'readiness_promotion',
  'activation',
  'production',
])

export const SUBAGENT_REQUIRED_FORBIDDEN_ACTIONS = Object.freeze([
  'edit',
  'install',
  'remote',
  'destructive',
  'readiness_promotion',
  'activation',
])

export const SUBAGENT_REF_ACCESS = Object.freeze([
  'bytes',
  'text',
  'visual',
  'locator_only',
])

export const SUBAGENT_ARTIFACT_ROLES = Object.freeze([
  'existing_canonical',
  'child_output',
  'locator_only',
])

export const SUBAGENT_VALIDATION_KINDS = Object.freeze([
  'command',
  'test',
  'checker',
  'manual_review',
])

export const SUBAGENT_VALIDATION_RESULTS = Object.freeze([
  'passed',
  'failed',
  'skipped',
  'not_run',
])

export const SUBAGENT_BLOCKER_STATUSES = Object.freeze([
  'open',
  'pending',
  'resolved',
])

export const SUBAGENT_AUTHORITY_BOUNDARY = Object.freeze({
  envelopeRole: 'execution_provenance_only',
  observationAuthority: 'child_reported_only',
  inferenceAuthority: 'non_authoritative',
  validationAuthority: 'check_scope_only',
  sourceEvidence: 'not_created',
  semanticAuthority: 'not_established',
  claimPromotion: false,
  readinessPromotion: false,
  activation: false,
  childPassIsParentGoalPass: false,
})

const HASH = /^[a-f0-9]{64}$/
const HEAD = /^[0-9a-f]{40}$/
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/
const CONTROL = /[\u0000-\u001f\u007f]/
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key)
const nonEmptyString = value => typeof value === 'string' && value.trim().length > 0 && !CONTROL.test(value)
const isId = value => typeof value === 'string' && ID.test(value)
const isHash = value => typeof value === 'string' && HASH.test(value)
const isHead = value => typeof value === 'string' && HEAD.test(value)
const isEnum = (value, values) => values.includes(value)

const ordered = value => {
  if (Array.isArray(value)) return value.map(ordered)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
}

/**
 * Stable JSON follows the repository artifact convention: recursively sorted
 * object keys, preserved array order, JSON, and one final LF. This is a
 * serialization helper only; v0 does not put a self-hash in the envelope.
 */
export const canonicalSubagentEvidenceJson = value => `${JSON.stringify(ordered(value))}\n`
export const subagentEvidenceContentSha256 = value => createHash('sha256')
  .update(canonicalSubagentEvidenceJson(value))
  .digest('hex')

export function isSafeSubagentRepoRelativePath(value) {
  if (!nonEmptyString(value) || value.startsWith('/') || value.startsWith('~') || value.includes('\\') || /^[A-Za-z]:/.test(value)) return false
  const segments = value.split('/')
  return segments.length > 0 && segments.every(segment => segment.length > 0 && segment !== '.' && segment !== '..')
}

export function isSafeSubagentReference(value) {
  if (!nonEmptyString(value)) return false
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) {
    try {
      const url = new URL(value)
      return (url.protocol === 'http:' || url.protocol === 'https:')
        && nonEmptyString(url.hostname)
        && !url.username
        && !url.password
    } catch {
      return false
    }
  }
  return isSafeSubagentRepoRelativePath(value)
}

const add = (errors, code) => {
  if (!errors.includes(code)) errors.push(code)
}

function shape(value, path, required, allowed, errors) {
  if (!isObject(value)) {
    add(errors, `${path}_not_object`)
    return false
  }
  required.forEach(key => {
    if (!has(value, key)) add(errors, `missing_field:${path}.${key}`)
  })
  Object.keys(value).forEach(key => {
    if (!allowed.includes(key)) add(errors, `unknown_field:${path}.${key}`)
  })
  return true
}

function stringField(value, path, errors) {
  if (!nonEmptyString(value)) add(errors, `invalid_string:${path}`)
}

function idField(value, path, errors) {
  if (!isId(value)) add(errors, `invalid_id:${path}`)
}

function enumField(value, path, values, errors) {
  if (!isEnum(value, values)) add(errors, `invalid_enum:${path}`)
}

function arrayField(value, path, errors) {
  if (!Array.isArray(value)) add(errors, `invalid_array:${path}`)
}

function validateReferenceList(values, path, knownIds, errors, { required = false } = {}) {
  if (!Array.isArray(values)) return
  if (required && values.length === 0) add(errors, `missing_reference:${path}`)
  const seen = new Set()
  values.forEach((value, index) => {
    if (!isId(value)) {
      add(errors, `invalid_reference_id:${path}[${index}]`)
      return
    }
    if (seen.has(value)) add(errors, `duplicate_reference:${path}:${value}`)
    seen.add(value)
    if (!knownIds.has(value)) add(errors, `dangling_reference:${path}:${value}`)
  })
}

function validateScope(scope, errors) {
  if (!shape(scope, 'scope', ['assigned', 'allowedActions', 'forbiddenActions', 'outOfScope'], ['assigned', 'allowedActions', 'forbiddenActions', 'outOfScope'], errors)) return
  stringField(scope.assigned, 'scope.assigned', errors)
  arrayField(scope.allowedActions, 'scope.allowedActions', errors)
  arrayField(scope.forbiddenActions, 'scope.forbiddenActions', errors)
  arrayField(scope.outOfScope, 'scope.outOfScope', errors)

  if (Array.isArray(scope.allowedActions)) {
    const allowed = new Set()
    scope.allowedActions.forEach((action, index) => {
      if (!SUBAGENT_ALLOWED_ACTIONS.includes(action)) add(errors, `invalid_enum:scope.allowedActions[${index}]`)
      if (allowed.has(action)) add(errors, `duplicate_action:scope.allowedActions:${action}`)
      allowed.add(action)
    })
    if (scope.allowedActions.length === 0) add(errors, 'scope_allowed_actions_empty')
  }

  if (Array.isArray(scope.forbiddenActions)) {
    const forbidden = new Set()
    scope.forbiddenActions.forEach((action, index) => {
      if (!SUBAGENT_FORBIDDEN_ACTIONS.includes(action)) add(errors, `invalid_enum:scope.forbiddenActions[${index}]`)
      if (forbidden.has(action)) add(errors, `duplicate_action:scope.forbiddenActions:${action}`)
      forbidden.add(action)
      if (Array.isArray(scope.allowedActions) && scope.allowedActions.includes(action)) add(errors, `action_both_allowed_and_forbidden:${action}`)
    })
    SUBAGENT_REQUIRED_FORBIDDEN_ACTIONS.forEach(action => {
      if (!forbidden.has(action)) add(errors, `scope_forbidden_action_missing:${action}`)
    })
  }

  if (Array.isArray(scope.outOfScope)) {
    scope.outOfScope.forEach((item, index) => {
      const path = `scope.outOfScope[${index}]`
      if (!shape(item, path, ['kind', 'statement', 'refs'], ['kind', 'statement', 'refs'], errors)) return
      enumField(item.kind, `${path}.kind`, ['observation', 'proposal'], errors)
      stringField(item.statement, `${path}.statement`, errors)
      arrayField(item.refs, `${path}.refs`, errors)
    })
  }
}

function validateBasis(basis, errors) {
  if (!shape(basis, 'basis', ['branch', 'basisHead', 'observedHead', 'worktreeState'], ['branch', 'basisHead', 'observedHead', 'worktreeState'], errors)) return
  if (!nonEmptyString(basis.branch) || /[\\\s]/.test(basis.branch)) add(errors, 'invalid_basis_branch')
  if (!isHead(basis.basisHead)) add(errors, 'invalid_basis_head')
  if (!isHead(basis.observedHead)) add(errors, 'invalid_observed_head')
  enumField(basis.worktreeState, 'basis.worktreeState', ['clean', 'dirty', 'unknown'], errors)
}

function validateRefCollection(refs, path, errors, knownIds) {
  arrayField(refs, path, errors)
  if (!Array.isArray(refs)) return
  refs.forEach((ref, index) => {
    const refPath = `${path}[${index}]`
    if (!shape(ref, refPath, ['refId', 'pathOrUri', 'locator', 'access', 'byteSha256'], ['refId', 'pathOrUri', 'locator', 'access', 'byteSha256'], errors)) return
    idField(ref.refId, `${refPath}.refId`, errors)
    if (knownIds.has(ref.refId)) add(errors, `duplicate_reference_id:${ref.refId}`)
    else knownIds.add(ref.refId)
    if (!isSafeSubagentReference(ref.pathOrUri)) add(errors, `unsafe_reference:${refPath}.pathOrUri`)
    stringField(ref.locator, `${refPath}.locator`, errors)
    enumField(ref.access, `${refPath}.access`, SUBAGENT_REF_ACCESS, errors)
    if (ref.byteSha256 !== null && !isHash(ref.byteSha256)) add(errors, `invalid_sha256:${refPath}.byteSha256`)
    if (ref.access === 'bytes' && !isHash(ref.byteSha256)) add(errors, `byte_reference_hash_missing:${refPath}`)
    if (ref.access === 'locator_only' && ref.byteSha256 !== null) add(errors, `locator_reference_hash_forbidden:${refPath}`)
  })
}

function validateArtifactRefs(refs, errors, knownIds) {
  arrayField(refs, 'artifactRefs', errors)
  if (!Array.isArray(refs)) return
  refs.forEach((ref, index) => {
    const path = `artifactRefs[${index}]`
    if (!shape(ref, path, ['refId', 'path', 'artifactId', 'schemaVersion', 'byteSha256', 'integrityRef', 'role'], ['refId', 'path', 'artifactId', 'schemaVersion', 'byteSha256', 'integrityRef', 'role'], errors)) return
    idField(ref.refId, `${path}.refId`, errors)
    if (knownIds.has(ref.refId)) add(errors, `duplicate_reference_id:${ref.refId}`)
    else knownIds.add(ref.refId)
    if (!isSafeSubagentRepoRelativePath(ref.path)) add(errors, `unsafe_artifact_path:${path}.path`)
    stringField(ref.artifactId, `${path}.artifactId`, errors)
    stringField(ref.schemaVersion, `${path}.schemaVersion`, errors)
    if (ref.byteSha256 !== null && !isHash(ref.byteSha256)) add(errors, `invalid_sha256:${path}.byteSha256`)
    if (ref.integrityRef !== null && !isSafeSubagentRepoRelativePath(ref.integrityRef)) add(errors, `unsafe_integrity_path:${path}.integrityRef`)
    enumField(ref.role, `${path}.role`, SUBAGENT_ARTIFACT_ROLES, errors)
    if (ref.role === 'existing_canonical') {
      if (!isHash(ref.byteSha256)) add(errors, `canonical_artifact_hash_missing:${path}`)
      if (!isSafeSubagentRepoRelativePath(ref.integrityRef)) add(errors, `canonical_artifact_integrity_missing:${path}`)
    }
    if (ref.role === 'child_output' && !isHash(ref.byteSha256)) add(errors, `child_artifact_hash_missing:${path}`)
    if (ref.role === 'locator_only' && (ref.byteSha256 !== null || ref.integrityRef !== null)) add(errors, `locator_artifact_identity_forbidden:${path}`)
  })
}

function registerItemId(value, path, errors, ids) {
  idField(value, path, errors)
  if (!isId(value)) return
  if (ids.has(value)) add(errors, `duplicate_evidence_id:${value}`)
  ids.add(value)
}

function validateObservations(observations, errors, evidenceIds) {
  arrayField(observations, 'observations', errors)
  if (!Array.isArray(observations)) return
  observations.forEach((item, index) => {
    const path = `observations[${index}]`
    if (!shape(item, path, ['id', 'statement', 'evidenceRefs'], ['id', 'statement', 'evidenceRefs'], errors)) return
    registerItemId(item.id, `${path}.id`, errors, evidenceIds)
    stringField(item.statement, `${path}.statement`, errors)
    arrayField(item.evidenceRefs, `${path}.evidenceRefs`, errors)
    if (Array.isArray(item.evidenceRefs) && item.evidenceRefs.length === 0) add(errors, `observation_evidence_missing:${path}`)
  })
}

function validateInferences(inferences, errors, evidenceIds, observationIds) {
  arrayField(inferences, 'inferences', errors)
  if (!Array.isArray(inferences)) return
  inferences.forEach((item, index) => {
    const path = `inferences[${index}]`
    if (!shape(item, path, ['id', 'statement', 'basedOn', 'authority'], ['id', 'statement', 'basedOn', 'authority'], errors)) return
    registerItemId(item.id, `${path}.id`, errors, evidenceIds)
    stringField(item.statement, `${path}.statement`, errors)
    arrayField(item.basedOn, `${path}.basedOn`, errors)
    if (Array.isArray(item.basedOn) && item.basedOn.length === 0) add(errors, `inference_basis_missing:${path}`)
    enumField(item.authority, `${path}.authority`, ['non_authoritative'], errors)
    if (Array.isArray(item.basedOn)) {
      item.basedOn.forEach(id => {
        if (!isId(id) || !observationIds.has(id)) add(errors, `inference_basis_not_observation:${path}`)
      })
    }
  })
}

function validateValidations(validations, errors, evidenceIds, validationIds) {
  arrayField(validations, 'validations', errors)
  if (!Array.isArray(validations)) return
  validations.forEach((item, index) => {
    const path = `validations[${index}]`
    if (!shape(item, path, ['id', 'kind', 'scope', 'result', 'command', 'exitCode', 'evidenceRefs'], ['id', 'kind', 'scope', 'result', 'command', 'exitCode', 'evidenceRefs'], errors)) return
    registerItemId(item.id, `${path}.id`, errors, evidenceIds)
    if (isId(item.id)) validationIds.add(item.id)
    enumField(item.kind, `${path}.kind`, SUBAGENT_VALIDATION_KINDS, errors)
    stringField(item.scope, `${path}.scope`, errors)
    stringField(item.command, `${path}.command`, errors)
    enumField(item.result, `${path}.result`, SUBAGENT_VALIDATION_RESULTS, errors)
    if (item.exitCode !== null && (!Number.isInteger(item.exitCode) || item.exitCode < 0)) add(errors, `invalid_exit_code:${path}.exitCode`)
    arrayField(item.evidenceRefs, `${path}.evidenceRefs`, errors)
    if (item.result === 'passed') {
      if (item.evidenceRefs?.length === 0) add(errors, `passed_validation_evidence_missing:${path}`)
      if (item.exitCode !== 0) add(errors, `passed_validation_exit_code_invalid:${path}`)
    }
    if ((item.kind === 'command' || item.kind === 'test' || item.kind === 'checker') && (item.result === 'passed' || item.result === 'failed') && !Number.isInteger(item.exitCode)) add(errors, `validation_exit_code_missing:${path}`)
    if (item.kind === 'manual_review' && item.exitCode !== null) add(errors, `manual_review_exit_code_forbidden:${path}`)
    if ((item.result === 'skipped' || item.result === 'not_run') && item.exitCode !== null) add(errors, `unexecuted_validation_exit_code:${path}`)
  })
}

function validateUnknowns(unknowns, errors, evidenceIds) {
  arrayField(unknowns, 'unknowns', errors)
  if (!Array.isArray(unknowns)) return
  unknowns.forEach((item, index) => {
    const path = `unknowns[${index}]`
    if (!shape(item, path, ['id', 'statement', 'blocksParent', 'nextCheck', 'evidenceRefs'], ['id', 'statement', 'blocksParent', 'nextCheck', 'evidenceRefs'], errors)) return
    registerItemId(item.id, `${path}.id`, errors, evidenceIds)
    stringField(item.statement, `${path}.statement`, errors)
    if (typeof item.blocksParent !== 'boolean') add(errors, `invalid_boolean:${path}.blocksParent`)
    stringField(item.nextCheck, `${path}.nextCheck`, errors)
    arrayField(item.evidenceRefs, `${path}.evidenceRefs`, errors)
  })
}

function validateBlockers(blockers, errors, evidenceIds) {
  arrayField(blockers, 'blockers', errors)
  if (!Array.isArray(blockers)) return
  blockers.forEach((item, index) => {
    const path = `blockers[${index}]`
    if (!shape(item, path, ['id', 'statement', 'status', 'nextCheck', 'evidenceRefs'], ['id', 'statement', 'status', 'nextCheck', 'evidenceRefs'], errors)) return
    registerItemId(item.id, `${path}.id`, errors, evidenceIds)
    stringField(item.statement, `${path}.statement`, errors)
    enumField(item.status, `${path}.status`, SUBAGENT_BLOCKER_STATUSES, errors)
    stringField(item.nextCheck, `${path}.nextCheck`, errors)
    arrayField(item.evidenceRefs, `${path}.evidenceRefs`, errors)
  })
}

function validateError(value, errors, validationIds) {
  if (value === null) return
  if (!shape(value, 'error', ['code', 'message', 'validationIds'], ['code', 'message', 'validationIds'], errors)) return
  stringField(value.code, 'error.code', errors)
  stringField(value.message, 'error.message', errors)
  arrayField(value.validationIds, 'error.validationIds', errors)
  if (Array.isArray(value.validationIds)) validateReferenceList(value.validationIds, 'error.validationIds', validationIds, errors)
}

function validateCancellation(value, errors) {
  if (value === null) return
  if (!shape(value, 'cancellation', ['reason', 'partialResult'], ['reason', 'partialResult'], errors)) return
  stringField(value.reason, 'cancellation.reason', errors)
  if (typeof value.partialResult !== 'boolean') add(errors, 'invalid_boolean:cancellation.partialResult')
}

function validateAuthorityBoundary(value, errors) {
  if (!shape(value, 'authorityBoundary', Object.keys(SUBAGENT_AUTHORITY_BOUNDARY), Object.keys(SUBAGENT_AUTHORITY_BOUNDARY), errors)) return
  if (canonicalSubagentEvidenceJson(value) !== canonicalSubagentEvidenceJson(SUBAGENT_AUTHORITY_BOUNDARY)) add(errors, 'authority_boundary_promoted_or_mutated')
}

function validateParentVerification(value, errors) {
  if (!shape(value, 'parentVerification', ['status', 'mode', 'recheckedValidationIds', 'reason'], ['status', 'mode', 'recheckedValidationIds', 'reason'], errors)) return
  if (value.status !== 'pending') add(errors, 'parent_verification_child_owned')
  if (value.mode !== 'none') add(errors, 'parent_verification_mode_set_by_child')
  if (!Array.isArray(value.recheckedValidationIds) || value.recheckedValidationIds.length > 0) add(errors, 'parent_rechecks_set_by_child')
  if (value.reason !== null) add(errors, 'parent_verification_reason_set_by_child')
}

function validateStatus(envelope, errors) {
  enumField(envelope.status, 'status', SUBAGENT_EVIDENCE_STATUSES, errors)
  const blockingUnknown = Array.isArray(envelope.unknowns) && envelope.unknowns.some(item => item?.blocksParent === true)
  if (envelope.status === 'completed' && blockingUnknown) add(errors, 'completed_with_blocking_unknown')
  if (envelope.status === 'completed' && (envelope.error !== null || envelope.cancellation !== null)) add(errors, 'completed_failure_detail_present')
  if (envelope.status === 'completed_with_unknowns' && (!Array.isArray(envelope.unknowns) || envelope.unknowns.length === 0)) add(errors, 'completed_with_unknowns_missing_unknown')
  if (envelope.status === 'completed_with_unknowns' && (envelope.error !== null || envelope.cancellation !== null)) add(errors, 'completed_with_unknowns_failure_detail_present')
  if (envelope.status === 'failed' && !isObject(envelope.error)) add(errors, 'failed_error_missing')
  if (envelope.status === 'failed' && envelope.cancellation !== null) add(errors, 'failed_cancellation_detail_present')
  if (envelope.status === 'cancelled' && !isObject(envelope.cancellation)) add(errors, 'cancelled_reason_missing')
  if (envelope.status === 'cancelled' && envelope.error !== null) add(errors, 'cancelled_error_detail_present')
}

export function checkSubagentEvidenceContract(envelope) {
  const errors = []
  const rootAllowed = ['schemaVersion', 'contractVersion', 'identity', 'scope', 'basis', 'inputRefs', 'inspectedRefs', 'artifactRefs', 'observations', 'inferences', 'validations', 'unknowns', 'blockers', 'status', 'error', 'cancellation', 'authorityBoundary', 'summary', 'parentVerification']
  const rootRequired = [...rootAllowed]
  if (!shape(envelope, 'root', rootRequired, rootAllowed, errors)) return errors.sort()
  if (envelope.schemaVersion !== SUBAGENT_EVIDENCE_SCHEMA) add(errors, 'schema_version_mismatch')
  if (envelope.contractVersion !== SUBAGENT_EVIDENCE_VERSION) add(errors, 'contract_version_mismatch')

  if (shape(envelope.identity, 'identity', ['childId', 'taskId', 'parentGoalId', 'researchUnitId'], ['childId', 'taskId', 'parentGoalId', 'researchUnitId'], errors)) {
    Object.keys(envelope.identity).forEach(key => idField(envelope.identity[key], `identity.${key}`, errors))
  }
  validateScope(envelope.scope, errors)
  validateBasis(envelope.basis, errors)

  const referenceIds = new Set()
  validateRefCollection(envelope.inputRefs, 'inputRefs', errors, referenceIds)
  validateRefCollection(envelope.inspectedRefs, 'inspectedRefs', errors, referenceIds)
  validateArtifactRefs(envelope.artifactRefs, errors, referenceIds)

  const evidenceIds = new Set()
  const observationIds = new Set()
  validateObservations(envelope.observations, errors, evidenceIds)
  if (Array.isArray(envelope.observations)) envelope.observations.forEach(item => { if (isId(item?.id)) observationIds.add(item.id) })
  validateInferences(envelope.inferences, errors, evidenceIds, observationIds)
  const validationIds = new Set()
  validateValidations(envelope.validations, errors, evidenceIds, validationIds)
  validateUnknowns(envelope.unknowns, errors, evidenceIds)
  validateBlockers(envelope.blockers, errors, evidenceIds)

  if (Array.isArray(envelope.scope?.outOfScope)) envelope.scope.outOfScope.forEach(item => validateReferenceList(item.refs, 'scope.outOfScope.refs', referenceIds, errors))
  if (Array.isArray(envelope.observations)) envelope.observations.forEach(item => validateReferenceList(item.evidenceRefs, 'observations.evidenceRefs', referenceIds, errors, { required: true }))
  if (Array.isArray(envelope.inferences)) envelope.inferences.forEach(item => validateReferenceList(item.basedOn, 'inferences.basedOn', observationIds, errors, { required: true }))
  if (Array.isArray(envelope.validations)) envelope.validations.forEach(item => validateReferenceList(item.evidenceRefs, 'validations.evidenceRefs', new Set([...referenceIds, ...evidenceIds]), errors))
  if (Array.isArray(envelope.unknowns)) envelope.unknowns.forEach(item => validateReferenceList(item.evidenceRefs, 'unknowns.evidenceRefs', new Set([...referenceIds, ...evidenceIds]), errors))
  if (Array.isArray(envelope.blockers)) envelope.blockers.forEach(item => validateReferenceList(item.evidenceRefs, 'blockers.evidenceRefs', new Set([...referenceIds, ...evidenceIds]), errors))

  stringField(envelope.summary, 'summary', errors)
  validateError(envelope.error, errors, validationIds)
  validateCancellation(envelope.cancellation, errors)
  validateAuthorityBoundary(envelope.authorityBoundary, errors)
  validateParentVerification(envelope.parentVerification, errors)
  validateStatus(envelope, errors)
  return [...new Set(errors)].sort()
}

export function assertSubagentEvidenceContract(envelope) {
  const errors = checkSubagentEvidenceContract(envelope)
  if (errors.length > 0) throw new Error(`subagent evidence contract invalid: ${errors.join(', ')}`)
  return true
}
