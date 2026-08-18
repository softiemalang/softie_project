import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SUBAGENT_AUTHORITY_BOUNDARY,
  SUBAGENT_EVIDENCE_SCHEMA,
  SUBAGENT_EVIDENCE_VERSION,
  SUBAGENT_FORBIDDEN_ACTIONS,
  canonicalSubagentEvidenceJson,
  checkSubagentEvidenceContract,
  isSafeSubagentReference,
  subagentEvidenceContentSha256,
} from '../src/subagentEvidenceContract.js'

const hash = character => character.repeat(64)
const head = character => character.repeat(40)

function envelope(overrides = {}) {
  const base = {
    schemaVersion: SUBAGENT_EVIDENCE_SCHEMA,
    contractVersion: SUBAGENT_EVIDENCE_VERSION,
    identity: {
      childId: 'child-001',
      taskId: 'task-001',
      parentGoalId: 'goal-001',
      researchUnitId: 'research-unit-001',
    },
    scope: {
      assigned: 'Inspect the bounded contract surface and run local checks only.',
      allowedActions: ['read', 'inspect', 'run_local_checks'],
      forbiddenActions: [
        'edit',
        'install',
        'remote',
        'destructive',
        'claim_promotion',
        'semantic_authority_promotion',
        'readiness_promotion',
        'activation',
        'production',
      ],
      outOfScope: [],
    },
    basis: {
      branch: 'main',
      basisHead: head('a'),
      observedHead: head('b'),
      worktreeState: 'clean',
    },
    inputRefs: [{
      refId: 'input-1',
      pathOrUri: 'src/artifactIdentity.js',
      locator: 'file:156-175',
      access: 'bytes',
      byteSha256: hash('1'),
    }],
    inspectedRefs: [{
      refId: 'inspect-1',
      pathOrUri: 'docs/astrology/interpretation-handoff-v1.md',
      locator: 'file:3-16',
      access: 'text',
      byteSha256: null,
    }],
    artifactRefs: [{
      refId: 'artifact-1',
      path: 'artifacts/example/complete.json',
      artifactId: 'example-artifact-v1',
      schemaVersion: 'example-artifact-v1',
      byteSha256: hash('2'),
      integrityRef: 'artifacts/example/complete.json.integrity.json',
      role: 'existing_canonical',
    }],
    observations: [{
      id: 'obs-1',
      statement: 'The child inspected the declared handoff document.',
      evidenceRefs: ['inspect-1'],
    }],
    inferences: [{
      id: 'inf-1',
      statement: 'The handoff boundary should remain a parent-owned decision.',
      basedOn: ['obs-1'],
      authority: 'non_authoritative',
    }],
    validations: [{
      id: 'check-1',
      kind: 'checker',
      scope: 'The local checker exited successfully for the declared artifact.',
      result: 'passed',
      command: 'node scripts/check-example.mjs',
      exitCode: 0,
      evidenceRefs: ['inspect-1', 'artifact-1'],
    }],
    unknowns: [],
    blockers: [],
    status: 'completed',
    error: null,
    cancellation: null,
    authorityBoundary: { ...SUBAGENT_AUTHORITY_BOUNDARY },
    summary: 'The child returned bounded execution evidence for parent review.',
    parentVerification: {
      status: 'pending',
      mode: 'none',
      recheckedValidationIds: [],
      reason: null,
    },
  }
  return { ...base, ...overrides }
}

function assertRejected(candidate, label) {
  const errors = checkSubagentEvidenceContract(candidate)
  assert.ok(errors.length > 0, `${label}: expected rejection`)
  return errors
}

test('completed, completed_with_unknowns, failed, and cancelled envelopes pass', () => {
  assert.deepEqual(checkSubagentEvidenceContract(envelope()), [])

  const withUnknowns = envelope({
    status: 'completed_with_unknowns',
    unknowns: [{
      id: 'unknown-1',
      statement: 'The parent has not independently rerun the checker.',
      blocksParent: true,
      nextCheck: 'Parent reruns the checker against the referenced artifact.',
      evidenceRefs: ['artifact-1'],
    }],
  })
  assert.deepEqual(checkSubagentEvidenceContract(withUnknowns), [])

  const failed = envelope({
    status: 'failed',
    validations: [{
      ...envelope().validations[0],
      result: 'failed',
      exitCode: 1,
    }],
    error: {
      code: 'checker_failed',
      message: 'The local checker returned a non-zero exit code.',
      validationIds: ['check-1'],
    },
  })
  assert.deepEqual(checkSubagentEvidenceContract(failed), [])

  const cancelled = envelope({
    status: 'cancelled',
    cancellation: { reason: 'Parent cancelled after the scope changed.', partialResult: true },
  })
  assert.deepEqual(checkSubagentEvidenceContract(cancelled), [])
})

test('manual review can pass without a process exit code', () => {
  const manualReview = envelope({
    validations: [{
      ...envelope().validations[0],
      kind: 'manual_review',
      command: 'Parent directly reviewed the exact declared locator.',
      exitCode: null,
    }],
  })
  assert.deepEqual(checkSubagentEvidenceContract(manualReview), [])
})

test('canonical serialization is deterministic and uses a final LF', () => {
  assert.equal(canonicalSubagentEvidenceJson({ b: 2, a: 1 }), '{"a":1,"b":2}\n')
  assert.match(subagentEvidenceContentSha256(envelope()), /^[a-f0-9]{64}$/)
})

test('child cannot complete parent verification or promote authority', () => {
  const parentVerification = envelope({ parentVerification: { status: 'verified_by_parent', mode: 'direct_recheck', recheckedValidationIds: ['check-1'], reason: 'verified' } })
  assertRejected(parentVerification, 'parent verification')

  for (const [label, mutate] of [
    ['child pass promotion', value => { value.authorityBoundary.childPassIsParentGoalPass = true }],
    ['semantic authority promotion', value => { value.authorityBoundary.semanticAuthority = 'established' }],
    ['readiness promotion', value => { value.authorityBoundary.readinessPromotion = true }],
    ['activation promotion', value => { value.authorityBoundary.activation = true }],
  ]) {
    const candidate = structuredClone(envelope())
    mutate(candidate)
    assertRejected(candidate, label)
  }
})

test('every forbidden action category remains explicit in the child scope', () => {
  for (const action of SUBAGENT_FORBIDDEN_ACTIONS) {
    const candidate = structuredClone(envelope())
    candidate.scope.forbiddenActions = candidate.scope.forbiddenActions.filter(value => value !== action)
    assertRejected(candidate, `missing forbidden action ${action}`)
  }
})

test('observation, inference, and validation boundaries are structurally separate', () => {
  const observationWithInferenceAuthority = structuredClone(envelope())
  observationWithInferenceAuthority.observations[0].authority = 'non_authoritative'
  assertRejected(observationWithInferenceAuthority, 'observation/inference mixing')

  const inferenceWithoutObservationBasis = structuredClone(envelope())
  inferenceWithoutObservationBasis.inferences[0].basedOn = ['inspect-1']
  assertRejected(inferenceWithoutObservationBasis, 'inference basis')

  for (const key of ['command', 'scope', 'result']) {
    const incomplete = structuredClone(envelope())
    delete incomplete.validations[0][key]
    assertRejected(incomplete, `incomplete passed validation ${key}`)
  }
})

test('basis, hash, and reference path checks fail closed', () => {
  for (const [label, mutate] of [
    ['missing basis head', value => { delete value.basis.basisHead }],
    ['invalid basis head', value => { value.basis.basisHead = 'not-a-head' }],
    ['invalid observed head', value => { value.basis.observedHead = '0'.repeat(39) }],
    ['invalid source hash', value => { value.inputRefs[0].byteSha256 = 'not-a-sha256' }],
    ['unsafe local path', value => { value.inputRefs[0].pathOrUri = '../outside.json' }],
    ['unsafe absolute path', value => { value.artifactRefs[0].path = '/outside.json' }],
    ['unsafe URI scheme', value => { value.inspectedRefs[0].pathOrUri = 'javascript:alert(1)' }],
    ['artifact payload copy', value => { value.artifactRefs[0].payload = { claims: [] } }],
    ['readiness payload copy', value => { value.readiness = { status: 'complete' } }],
  ]) {
    const candidate = structuredClone(envelope())
    mutate(candidate)
    assertRejected(candidate, label)
  }
})

test('status and detail consistency is fail-closed', () => {
  const completedWithBlockingUnknown = envelope({
    unknowns: [{
      id: 'unknown-1',
      statement: 'A blocking unknown was omitted from the parent decision.',
      blocksParent: true,
      nextCheck: 'Parent must inspect the artifact.',
      evidenceRefs: ['artifact-1'],
    }],
  })
  assertRejected(completedWithBlockingUnknown, 'completed with blocking unknown')

  const completedWithoutUnknown = envelope({ status: 'completed_with_unknowns' })
  assertRejected(completedWithoutUnknown, 'completed_with_unknowns without unknown')

  const failedWithoutError = envelope({ status: 'failed' })
  assertRejected(failedWithoutError, 'failed without error')

  const cancelledWithoutReason = envelope({ status: 'cancelled' })
  assertRejected(cancelledWithoutReason, 'cancelled without reason')

  const failedWithCancellation = envelope({
    status: 'failed',
    error: { code: 'failed', message: 'failed', validationIds: [] },
    cancellation: { reason: 'also cancelled', partialResult: true },
  })
  assertRejected(failedWithCancellation, 'failed with cancellation')

  const cancelledWithError = envelope({
    status: 'cancelled',
    error: { code: 'failed', message: 'failed', validationIds: [] },
    cancellation: { reason: 'cancelled', partialResult: true },
  })
  assertRejected(cancelledWithError, 'cancelled with error')
})

test('unknown schema, version, and enum values are rejected', () => {
  for (const [label, mutate] of [
    ['unknown schema', value => { value.schemaVersion = 'subagent-evidence-contract-v9' }],
    ['unknown contract version', value => { value.contractVersion = '9.9.9' }],
    ['unknown status', value => { value.status = 'verified_by_parent' }],
    ['unknown worktree state', value => { value.basis.worktreeState = 'dirty-but-safe' }],
    ['unknown access', value => { value.inspectedRefs[0].access = 'oracle' }],
    ['unknown action', value => { value.scope.allowedActions.push('deploy') }],
    ['unknown validation result', value => { value.validations[0].result = 'accepted' }],
  ]) {
    const candidate = structuredClone(envelope())
    mutate(candidate)
    assertRejected(candidate, label)
  }
})

test('safe references accept repository paths and HTTP(S) locators only', () => {
  assert.equal(isSafeSubagentReference('artifacts/example/complete.json'), true)
  assert.equal(isSafeSubagentReference('https://example.com/source?page=1'), true)
  assert.equal(isSafeSubagentReference('../outside.json'), false)
  assert.equal(isSafeSubagentReference('/outside.json'), false)
  assert.equal(isSafeSubagentReference('file:///outside.json'), false)
  assert.equal(isSafeSubagentReference('javascript:alert(1)'), false)
  assert.equal(isSafeSubagentReference('https://user:password@example.com/source'), false)
})
