# Bounded Continuation + Quality Gate v0

This document defines the parent-owned continuation boundary for `/goal` work
units. It is a workflow decision helper, not a domain truth, readiness, or
activation validator.

The implementation is intentionally stateless:

```text
parent checkpoint input + current work-unit result
  -> deterministic decision + reason codes + attempt fingerprints
```

No registry, JSONL event log, daemon, scheduler, retry loop, or runtime API is
required. The parent passes the previous checkpoint explicitly when it wants
to suppress a repeated attempt.

## Decisions

`evaluateBoundedContinuation` returns exactly one of:

| Decision | Meaning |
|---|---|
| `continue` | Parent-verified progress exists and an authorized, checkable next frontier is available. |
| `stop_complete` | The declared scope is complete and no parent-blocking unknown or blocker remains in scope. |
| `stop_blocked` | The scope remains unmet and no safe next frontier exists, or a bounded repeated failure remains unresolved. |
| `recheck_required` | The child result, parent verification, basis/state, or failure classification is not sufficient for a terminal decision. |

`stop_complete` is scoped completion only. It does not mean domain readiness.
`stop_blocked` is an evidence-backed current-state blocker, not a permanent
truth claim.

## Parent input boundary

The helper takes an `attempt`, `workUnit`, optional `childEnvelope`, optional
parent verification overlay, an optional previous checkpoint, and an optional
budget checkpoint:

```js
evaluateBoundedContinuation({
  attempt: {
    action: { actionId, kind, command, args, toolVersion },
    inputs: [{ refId, identity, resolution }],
    basis: {
      branch,
      basisHead,
      scopedWorktreeState,
      scopedWorktreeDigest,
      observedHeadRelevant,
      observedHead,
    },
    environment: {
      runtime,
      platform,
      dependencyIdentity,
      sourceIdentity,
      networkCondition,
    },
    failure: { class, stage, code, signature, exitCode, signal },
  },
  workUnit: {
    progress: {
      newEvidence: [{ id, verified }],
      newArtifacts: [{ id, verified }],
      validatedFacts: [{ id, verified }],
      blockerReductions: [{ id, from, to, verified }],
      nextFrontier: { id, actionId, checkable, authorized } || null,
    },
    unknowns: [{ id, blocksParent }],
    blockers: [{ id, status, blocksParent }],
    scope: { acceptanceComplete, objectiveUnmet },
  },
  previousAttempt: {
    fingerprint,
    stateFingerprint,
    progressIds,
    frontierId,
    recheckCount,
  } || null,
  budget: { checkpointDue } || undefined,
})
```

The `verified` progress flags are parent-owned assertions. They must only be
set after the existing materializer/checker, artifact identity, or required
parent recheck has supplied the supporting evidence. The helper does not make
the domain assertion itself.

## Attempt identity

`attemptFingerprint` hashes a canonical, recursively key-sorted JSON projection
of action identity, relevant input identities, effective basis, dependency and
environment identity, and normalized failure signature. Input collections are
sorted by `refId`; array order inside command arguments is preserved.

The projection deliberately excludes unrelated fields such as timestamps,
process IDs, temporary paths, token/turn counts, and unrelated dirty paths.
`observedHead` is included only when `observedHeadRelevant` is true. The
`scopedWorktreeDigest`, not global dirty state, represents relevant worktree
condition.

`attemptStateFingerprint` uses the same projection without the failure. This
lets the parent distinguish a changed source/basis/environment from a changed
error message in the same relevant state.

Input identities, dependency identities, source identities, and command
arguments are preserved as identities. Only the action command and failure
signature receive runtime-noise normalization. Duplicate input reference IDs
are rejected.

## Failure handling

- The first complete deterministic failure requests a parent checkpoint.
- The same deterministic fingerprint after that checkpoint becomes
  `stop_blocked` with `same_deterministic_failure`.
- A deterministic failure may `continue` only by pivoting to a new authorized
  frontier with a different action identity; it never authorizes an immediate
  retry of the failed action.
- Transient, flaky, aggregate, and unknown failures first return
  `recheck_required`.
- If the same fingerprint remains after one explicit parent checkpoint, the
  helper returns an external/unresolved blocker reason. This is not an
  automatic retry policy.

An aggregate non-zero test result must be classified by scope before it can be
used for continuation. A single aggregate exit code is insufficient.

## Subagent relationship

When `childEnvelope` is supplied, the helper first runs
`checkSubagentEvidenceContract`. A malformed envelope returns
`recheck_required`. A valid child envelope still requires a separate,
parent-owned verification overlay before its progress can be used.

The child contract remains unchanged. In particular:

```text
child PASS != parent goal PASS
gate decision != domain readiness
gate decision != production activation
```

The helper does not accept or produce readiness, semantic-authority,
activation, or canonical artifact payload fields.

## Context and sibling write-surface boundary

The gate consumes the context needed for one declared work unit; it is not a
reason to preload unrelated domain knowledge. Additional source, dependency,
or checker context should be retrieved only when the next check declares that
need and should be represented in the work-unit evidence or references.

The gate is not a scheduler and does not certify that sibling work is safe to
run concurrently. The parent may parallelize only read-only work or work with
explicitly disjoint temporary surfaces. Shared or unknown surfaces, tracked or
canonical artifact writes, and publication are serialized and parent-owned.
`continue` therefore means a safe next frontier for this work unit, not
permission to overlap another work unit's write surface.

## Budget

`budget.checkpointDue` adds an audit reason and prompts parent state
re-evaluation. It cannot by itself produce `stop_complete`, `stop_blocked`, or
any readiness/activation result.

## Implementation boundary

The v0 surface is limited to:

- `src/boundedContinuationGate.js`
- `test/boundedContinuationGate.test.js`
- this document
- the parent `/goal` instruction in `AGENTS.md`

Existing subagent contract, artifact identity, materializer/checker, readiness,
activation, runtime, and remote/production structures remain unchanged.
