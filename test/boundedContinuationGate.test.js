import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BOUNDED_CONTINUATION_AUTHORITY_BOUNDARY,
  CONTINUATION_DECISIONS,
  attemptFingerprint,
  attemptStateFingerprint,
  canonicalBoundedContinuationJson,
  evaluateBoundedContinuation,
} from '../src/boundedContinuationGate.js'
import {
  SUBAGENT_AUTHORITY_BOUNDARY,
  SUBAGENT_EVIDENCE_SCHEMA,
  SUBAGENT_EVIDENCE_VERSION,
} from '../src/subagentEvidenceContract.js'

const hash = character => character.repeat(64)
const head = character => character.repeat(40)

function attempt(overrides = {}) {
  const base = {
    action: {
      actionId: 'source-check',
      kind: 'check',
      command: 'node scripts/check-source.mjs',
      args: ['--source', 'source-1'],
      toolVersion: 'checker-v1',
    },
    inputs: [
      { refId: 'input-2', identity: hash('2'), resolution: 'resolved' },
      { refId: 'input-1', identity: hash('1'), resolution: 'resolved' },
    ],
    basis: {
      branch: 'main',
      basisHead: head('a'),
      scopedWorktreeState: 'clean',
      scopedWorktreeDigest: hash('3'),
      observedHeadRelevant: false,
      observedHead: head('b'),
    },
    environment: {
      runtime: 'node-22',
      platform: 'darwin-arm64',
      dependencyIdentity: hash('4'),
      sourceIdentity: 'source-1',
      networkCondition: 'local',
    },
    failure: {
      class: 'none',
      stage: 'none',
      code: 'none',
      signature: 'none',
      exitCode: 0,
      signal: null,
    },
  }
  return {
    ...base,
    ...overrides,
    action: { ...base.action, ...(overrides.action || {}) },
    basis: { ...base.basis, ...(overrides.basis || {}) },
    environment: { ...base.environment, ...(overrides.environment || {}) },
    failure: { ...base.failure, ...(overrides.failure || {}) },
    inputs: overrides.inputs || base.inputs,
  }
}

function workUnit(overrides = {}) {
  const base = {
    progress: {
      newEvidence: [],
      newArtifacts: [],
      validatedFacts: [],
      blockerReductions: [],
      nextFrontier: null,
    },
    unknowns: [],
    blockers: [],
    scope: {
      acceptanceComplete: false,
      objectiveUnmet: true,
    },
  }
  return {
    ...base,
    ...overrides,
    progress: { ...base.progress, ...(overrides.progress || {}) },
    scope: { ...base.scope, ...(overrides.scope || {}) },
  }
}

function previousFrom(result) {
  return {
    fingerprint: result.attemptFingerprint,
    stateFingerprint: result.stateFingerprint,
    progressIds: result.progress?.progressIds || [],
    frontierId: result.progress?.frontierId || null,
    recheckCount: result.checkpoint.recheckCount,
  }
}

function childEnvelope() {
  return {
    schemaVersion: SUBAGENT_EVIDENCE_SCHEMA,
    contractVersion: SUBAGENT_EVIDENCE_VERSION,
    identity: { childId: 'child-001', taskId: 'task-001', parentGoalId: 'goal-001', researchUnitId: 'unit-001' },
    scope: {
      assigned: 'Inspect a bounded local contract surface.',
      allowedActions: ['read', 'inspect', 'run_local_checks'],
      forbiddenActions: ['edit', 'install', 'remote', 'destructive', 'claim_promotion', 'semantic_authority_promotion', 'readiness_promotion', 'activation', 'production'],
      outOfScope: [],
    },
    basis: { branch: 'main', basisHead: head('a'), observedHead: head('b'), worktreeState: 'clean' },
    inputRefs: [{ refId: 'input-1', pathOrUri: 'src/artifactIdentity.js', locator: 'file:1-10', access: 'bytes', byteSha256: hash('1') }],
    inspectedRefs: [{ refId: 'inspect-1', pathOrUri: 'docs/subagent-evidence-contract-v0.md', locator: 'file:1-10', access: 'text', byteSha256: null }],
    artifactRefs: [{ refId: 'artifact-1', path: 'artifacts/example/complete.json', artifactId: 'example-v1', schemaVersion: 'example-v1', byteSha256: hash('2'), integrityRef: 'artifacts/example/complete.json.integrity.json', role: 'existing_canonical' }],
    observations: [{ id: 'obs-1', statement: 'The child inspected the declared contract.', evidenceRefs: ['inspect-1'] }],
    inferences: [],
    validations: [{ id: 'check-1', kind: 'checker', scope: 'The declared local checker completed.', result: 'passed', command: 'node scripts/check-example.mjs', exitCode: 0, evidenceRefs: ['inspect-1', 'artifact-1'] }],
    unknowns: [],
    blockers: [],
    status: 'completed',
    error: null,
    cancellation: null,
    authorityBoundary: { ...SUBAGENT_AUTHORITY_BOUNDARY },
    summary: 'The child returned bounded execution evidence.',
    parentVerification: { status: 'pending', mode: 'none', recheckedValidationIds: [], reason: null },
  }
}

const verifiedParent = { status: 'verified', mode: 'direct_recheck', recheckedValidationIds: ['check-1'] }

test('exports the four parent-owned decisions and stable canonical JSON', () => {
  assert.deepEqual(CONTINUATION_DECISIONS, ['continue', 'stop_complete', 'stop_blocked', 'recheck_required'])
  assert.equal(canonicalBoundedContinuationJson({ b: 2, a: 1 }), '{"a":1,"b":2}\n')
})

test('attempt identity ignores input ordering, timestamps, pid, temp paths, and unrelated dirty state', () => {
  const first = attempt({
    unrelatedDirtyState: ['docs/unrelated.txt'],
    failure: { class: 'deterministic', stage: 'check', code: 'MISSING_SOURCE_FILE', signature: '2026-08-13T12:00:00.000Z pid=41 at /tmp/run-a/source.pdf' },
  })
  const second = attempt({
    unrelatedDirtyState: ['src/unrelated.js', 'test/unrelated.test.js'],
    inputs: [...first.inputs].reverse(),
    failure: { class: 'deterministic', stage: 'check', code: 'MISSING_SOURCE_FILE', signature: '2026-08-14T19:30:05.000Z pid=902 at /private/tmp/run-b/source.pdf' },
  })
  assert.equal(attemptFingerprint(first), attemptFingerprint(second))
  assert.equal(attemptStateFingerprint(first), attemptStateFingerprint(second))
})

test('actual evidence and an authorized checkable frontier allow continuation', () => {
  const result = evaluateBoundedContinuation({
    attempt: attempt(),
    workUnit: workUnit({
      progress: {
        newEvidence: [{ id: 'evidence-1', verified: true }],
        nextFrontier: { id: 'frontier-1', actionId: 'next-source-check', checkable: true, authorized: true },
      },
    }),
  })
  assert.equal(result.decision, 'continue')
  assert.ok(result.reasonCodes.includes('new_evidence'))
  assert.ok(result.reasonCodes.includes('new_checkable_frontier'))
  assert.equal(result.checkpoint.automaticRetry, false)
})

test('repeating the same successful scan with no new progress does not continue', () => {
  const first = evaluateBoundedContinuation({
    attempt: attempt(),
    workUnit: workUnit({
      progress: {
        newEvidence: [{ id: 'evidence-1', verified: true }],
        nextFrontier: { id: 'frontier-1', actionId: 'next-source-check', checkable: true, authorized: true },
      },
    }),
  })
  const second = evaluateBoundedContinuation({
    attempt: attempt(),
    previousAttempt: previousFrom(first),
    workUnit: workUnit({
      progress: {
        newEvidence: [{ id: 'evidence-1', verified: true }],
        nextFrontier: { id: 'frontier-1', actionId: 'next-source-check', checkable: true, authorized: true },
      },
    }),
  })
  assert.equal(second.decision, 'stop_blocked')
  assert.ok(second.reasonCodes.includes('no_safe_frontier'))
  assert.deepEqual(second.progress.newEvidenceIds, [])
})

test('the first deterministic failure requests a checkpoint and the same failure then blocks', () => {
  const failedAttempt = attempt({
    failure: { class: 'deterministic', stage: 'source_resolution', code: 'MISSING_SOURCE_FILE', signature: 'source PDF is absent' },
  })
  const first = evaluateBoundedContinuation({ attempt: failedAttempt, workUnit: workUnit() })
  assert.equal(first.decision, 'recheck_required')
  assert.ok(first.reasonCodes.includes('deterministic_failure_checkpoint'))
  assert.equal(first.checkpoint.recheckCount, 1)

  const second = evaluateBoundedContinuation({
    attempt: failedAttempt,
    previousAttempt: previousFrom(first),
    workUnit: workUnit(),
  })
  assert.equal(second.decision, 'stop_blocked')
  assert.ok(second.reasonCodes.includes('same_deterministic_failure'))
  assert.equal(second.checkpoint.automaticRetry, false)
})

test('a relevant source identity change re-evaluates instead of suppressing the new attempt', () => {
  const failedAttempt = attempt({ failure: { class: 'deterministic', stage: 'source_resolution', code: 'MISSING_SOURCE_FILE', signature: 'source PDF is absent' } })
  const first = evaluateBoundedContinuation({ attempt: failedAttempt, workUnit: workUnit() })
  const changed = attempt({
    environment: { sourceIdentity: 'source-2' },
    failure: { class: 'deterministic', stage: 'source_resolution', code: 'MISSING_SOURCE_FILE', signature: 'source PDF is absent' },
  })
  const result = evaluateBoundedContinuation({ attempt: changed, previousAttempt: previousFrom(first), workUnit: workUnit() })
  assert.equal(result.decision, 'recheck_required')
  assert.ok(result.reasonCodes.includes('relevant_state_changed'))
  assert.equal(result.sameAttempt, false)
})

test('a relevant observed HEAD changes identity only when the basis contract marks it relevant', () => {
  const relevantA = attempt({ basis: { observedHeadRelevant: true, observedHead: head('b') } })
  const relevantB = attempt({ basis: { observedHeadRelevant: true, observedHead: head('c') } })
  assert.notEqual(attemptStateFingerprint(relevantA), attemptStateFingerprint(relevantB))

  const diagnosticA = attempt({ basis: { observedHeadRelevant: false, observedHead: head('b') } })
  const diagnosticB = attempt({ basis: { observedHeadRelevant: false, observedHead: head('c') } })
  assert.equal(attemptStateFingerprint(diagnosticA), attemptStateFingerprint(diagnosticB))
})

test('transient, flaky, aggregate, and unknown failures require a checkpoint before unresolved blocking', () => {
  for (const failureClass of ['transient', 'flaky', 'aggregate', 'unknown']) {
    const failedAttempt = attempt({ failure: { class: failureClass, stage: 'check', code: `${failureClass.toUpperCase()}_FAILURE`, signature: 'external condition unavailable' } })
    const first = evaluateBoundedContinuation({ attempt: failedAttempt, workUnit: workUnit() })
    assert.equal(first.decision, 'recheck_required', failureClass)
    assert.ok(first.reasonCodes.includes(`${failureClass}_failure_recheck`), failureClass)
    const second = evaluateBoundedContinuation({ attempt: failedAttempt, previousAttempt: previousFrom(first), workUnit: workUnit() })
    assert.equal(second.decision, 'stop_blocked', failureClass)
    assert.ok(second.reasonCodes.includes(`external_${failureClass}_unresolved`), failureClass)
  }
})

test('a deterministic failure may pivot to a new authorized frontier without retrying the same action', () => {
  const result = evaluateBoundedContinuation({
    attempt: attempt({ failure: { class: 'deterministic', stage: 'check', code: 'MISSING_SOURCE_FILE', signature: 'source PDF is absent' } }),
    workUnit: workUnit({
      progress: {
        nextFrontier: { id: 'frontier-2', actionId: 'inspect-source-manifest', checkable: true, authorized: true },
      },
    }),
  })
  assert.equal(result.decision, 'continue')
  assert.ok(result.reasonCodes.includes('deterministic_failure_pivot'))
})

test('scope completion is terminal only when parent blockers are absent', () => {
  const complete = evaluateBoundedContinuation({
    attempt: attempt(),
    workUnit: workUnit({ scope: { acceptanceComplete: true, objectiveUnmet: false } }),
    budget: { checkpointDue: true },
  })
  assert.equal(complete.decision, 'stop_complete')
  assert.ok(complete.reasonCodes.includes('scope_complete'))
  assert.ok(complete.reasonCodes.includes('budget_checkpoint'))

  const blocked = evaluateBoundedContinuation({
    attempt: attempt(),
    workUnit: workUnit({
      scope: { acceptanceComplete: true, objectiveUnmet: false },
      unknowns: [{ id: 'unknown-1', blocksParent: true }],
    }),
  })
  assert.equal(blocked.decision, 'stop_blocked')
  assert.ok(blocked.reasonCodes.includes('unresolved_parent_blocker'))
})

test('budget checkpoints do not change a decision that the work-unit evidence already determines', () => {
  const input = {
    attempt: attempt(),
    workUnit: workUnit({
      progress: {
        newEvidence: [{ id: 'evidence-2', verified: true }],
        nextFrontier: { id: 'frontier-4', actionId: 'next-local-check', checkable: true, authorized: true },
      },
    }),
  }
  const withoutBudget = evaluateBoundedContinuation(input)
  const withBudget = evaluateBoundedContinuation({ ...input, budget: { checkpointDue: true } })
  assert.equal(withoutBudget.decision, 'continue')
  assert.equal(withBudget.decision, withoutBudget.decision)
  assert.ok(withBudget.reasonCodes.includes('budget_checkpoint'))
})

test('verified blocker reduction is progress, while invalid gate input fails closed', () => {
  const reduced = evaluateBoundedContinuation({
    attempt: attempt(),
    workUnit: workUnit({
      progress: {
        blockerReductions: [{ id: 'blocker-1', from: 'open', to: 'resolved', verified: true }],
        nextFrontier: { id: 'frontier-5', actionId: 'next-local-check', checkable: true, authorized: true },
      },
    }),
  })
  assert.equal(reduced.decision, 'continue')
  assert.ok(reduced.reasonCodes.includes('blocker_reduced'))

  const invalid = evaluateBoundedContinuation({ attempt: {}, workUnit: {} })
  assert.equal(invalid.decision, 'recheck_required')
  assert.ok(invalid.reasonCodes.includes('gate_input_invalid'))
  assert.equal(invalid.attemptFingerprint, null)
})

test('promotion fields and incomplete direct parent rechecks fail closed', () => {
  const promoted = evaluateBoundedContinuation({
    attempt: attempt(),
    workUnit: workUnit({
      progress: {
        newArtifacts: [{ id: 'artifact-promotion', verified: true, artifactPayload: { readiness: 'ready' } }],
      },
    }),
  })
  assert.equal(promoted.decision, 'recheck_required')
  assert.ok(promoted.errors.includes('promotion_field_forbidden:workUnit.progress.newArtifacts[0].artifactPayload'))

  const incompleteRecheck = evaluateBoundedContinuation({
    attempt: attempt(),
    childEnvelope: childEnvelope(),
    parentVerification: { status: 'verified', mode: 'direct_recheck', recheckedValidationIds: [] },
    workUnit: workUnit({ progress: { newEvidence: [{ id: 'evidence-3', verified: true }] } }),
  })
  assert.equal(incompleteRecheck.decision, 'recheck_required')
  assert.ok(incompleteRecheck.errors.includes('parent_verification_recheck_missing'))

  const duplicateInputs = attempt({ inputs: [attempt().inputs[0], attempt().inputs[0]] })
  assert.throws(() => attemptFingerprint(duplicateInputs), /duplicate_input_ref/)
})

test('unverified, invalid, or unauthorized child/frontier results do not pass the gate', () => {
  const invalidChild = evaluateBoundedContinuation({
    attempt: attempt(),
    childEnvelope: { schemaVersion: 'not-contract' },
    parentVerification: verifiedParent,
    workUnit: workUnit({ progress: { newEvidence: [{ id: 'evidence-1', verified: true }] } }),
  })
  assert.equal(invalidChild.decision, 'recheck_required')
  assert.ok(invalidChild.reasonCodes.includes('child_contract_invalid'))

  const pendingChild = evaluateBoundedContinuation({
    attempt: attempt(),
    childEnvelope: childEnvelope(),
    parentVerification: { status: 'pending', mode: 'none', recheckedValidationIds: [] },
    workUnit: workUnit({ progress: { newEvidence: [{ id: 'evidence-1', verified: true }] } }),
  })
  assert.equal(pendingChild.decision, 'recheck_required')
  assert.ok(pendingChild.reasonCodes.includes('parent_verification_pending'))

  const unauthorizedFrontier = evaluateBoundedContinuation({
    attempt: attempt(),
    workUnit: workUnit({
      progress: {
        newEvidence: [{ id: 'evidence-1', verified: true }],
        nextFrontier: { id: 'frontier-1', actionId: 'remote-deploy', checkable: true, authorized: false },
      },
    }),
  })
  assert.equal(unauthorizedFrontier.decision, 'stop_blocked')
  assert.ok(unauthorizedFrontier.reasonCodes.includes('frontier_not_actionable'))
})

test('parent verification enables a valid child result without changing the child contract', () => {
  const result = evaluateBoundedContinuation({
    attempt: attempt(),
    childEnvelope: childEnvelope(),
    parentVerification: verifiedParent,
    workUnit: workUnit({
      progress: {
        newArtifacts: [{ id: 'artifact-1', verified: true }],
        nextFrontier: { id: 'frontier-3', actionId: 'next-local-check', checkable: true, authorized: true },
      },
    }),
  })
  assert.equal(result.decision, 'continue')
  assert.deepEqual(result.authorityBoundary, BOUNDED_CONTINUATION_AUTHORITY_BOUNDARY)
  assert.equal(result.authorityBoundary.domainReadiness, 'not_evaluated')
  assert.equal(result.authorityBoundary.productionActivation, false)
  assert.equal(result.authorityBoundary.childPassIsParentGoalPass, false)
})
