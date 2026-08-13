# Subagent Evidence Contract v0

`subagent-evidence-contract-v0` is a child-to-parent execution provenance
envelope. It records what a child was assigned, which checkout and references
it used, which bounded checks it ran, and what remains unknown. It is not a
source-evidence, semantic-authority, readiness, activation, or parent-goal
contract.

The central invariant is:

```text
child PASS != parent goal PASS
```

The validator checks structure and declared boundaries only. It does not
decide whether an observation is true, whether a source is authoritative, or
whether a domain artifact is ready for interpretation or activation.

## v0 envelope

The child submission has these required top-level fields:

| Field | Contract |
|---|---|
| `schemaVersion`, `contractVersion` | Fixed schema and `0.1.0` contract version. Unknown fields are rejected. |
| `identity` | `childId`, `taskId`, `parentGoalId`, `researchUnitId`. |
| `scope` | Assigned question, enumerated allowed/forbidden actions, and out-of-scope observations or proposals. The baseline mutation, remote, readiness, activation, and installation actions are forbidden. |
| `basis` | `branch`, independent `basisHead`, independent `observedHead`, and `worktreeState` (`clean`, `dirty`, or `unknown`). |
| `inputRefs`, `inspectedRefs` | Reference ID, repository-relative path or HTTP(S) URI, locator, access mode, and optional actual byte SHA-256. `bytes` access requires a SHA-256. |
| `artifactRefs` | Path, artifact ID, schema version, byte SHA-256, integrity-sidecar reference, and role. Canonical artifacts are referenced, never copied. |
| `observations` | Direct child-reported statements with evidence reference IDs. They have no inference or authority fields. |
| `inferences` | Separate non-authoritative statements based only on observation IDs. |
| `validations` | Check kind, command, scope, result, exit code, and evidence references. A passed check requires a command, scope, exit code `0`, and evidence. |
| `unknowns`, `blockers` | Explicit unresolved items, parent impact, next check, status, and references. |
| `status` | One of `completed`, `completed_with_unknowns`, `failed`, `cancelled`. |
| `error`, `cancellation` | Status-specific detail. Failed results require `error`; cancelled results require `cancellation`. |
| `authorityBoundary` | Fixed, fail-closed execution-only boundary. |
| `summary` | Human-readable summary; not a truth source. |
| `parentVerification` | Child submission must be exactly `pending` with no parent recheck or decision. |

There is deliberately no general `conclusions` field. Conclusions are either
observations or explicitly non-authoritative inferences.

## Boundary rules

`authorityBoundary` is fixed to:

```json
{
  "envelopeRole": "execution_provenance_only",
  "observationAuthority": "child_reported_only",
  "inferenceAuthority": "non_authoritative",
  "validationAuthority": "check_scope_only",
  "sourceEvidence": "not_created",
  "semanticAuthority": "not_established",
  "claimPromotion": false,
  "readinessPromotion": false,
  "activation": false,
  "childPassIsParentGoalPass": false
}
```

The envelope must not contain copied canonical payloads or domain fields such
as claims, relations, readiness objects, activation objects, source evidence,
or interpretation payloads. Existing canonical artifacts may be referenced by
path, artifact ID, schema version, exact byte SHA-256, and integrity sidecar
path. Their existing materializer/checker remains authoritative.

The envelope's own self-hash is not required in v0. The exported canonical
serializer uses recursively sorted object keys, preserved array order, JSON,
and one final LF. If an envelope is later persisted as an artifact, its exact
bytes may receive a separate integrity sidecar; that does not change the
domain artifact identity contract.

## Status consistency

- `completed` rejects any `unknown` with `blocksParent: true` and cannot carry
  error or cancellation detail.
- `completed_with_unknowns` requires at least one unknown and cannot carry
  error or cancellation detail.
- `failed` requires an error and cannot carry cancellation detail.
- `cancelled` requires a cancellation reason and cannot carry error detail.
- A passed validation must have a command, scope, result, exit code `0`, and
  at least one evidence reference.

`assigned` and `running` are dispatch/runtime states, not final v0 envelope
statuses. `verified_by_parent` and `rejected_by_parent` are parent-owned
decisions and cannot be submitted by a child.

## Parent verification policy

1. A complete low-risk structural observation with a valid scope, basis, and
   references can be used as a lead or reference. It does not pass the goal.
2. An existing canonical artifact can be accepted after checking its path,
   schema, artifact identity, exact byte hash, integrity sidecar, and basis
   rules with the existing checker.
3. A result affecting calculation, claim/source relation, semantic authority,
   readiness, or activation requires parent re-reading of the exact locator and
   re-running the critical checker or command.
4. A passed validation without command/scope/evidence, a hash mismatch, an
   invalid basis, mixed observation/inference fields, or unsafe path is
   rejected or directly rechecked.
5. Out-of-scope implementation, remote/destructive action, and readiness or
   activation promotion are rejected as child results. They may be returned as
   a proposal for a separate parent decision.

The parent may create a separate verification overlay after these checks. The
child envelope itself remains a pending submission.

## Default `/goal` subagent operation

Use this contract for delegated independent investigation, analysis, or
verification when the coordination cost is justified. Do not dispatch a
subagent for a simple task whose result does not need a separate evidence
boundary.

1. The parent gives the child an assigned question, allowed actions, forbidden
   actions, checkout basis, and explicit out-of-scope proposals.
2. The child returns the complete envelope through the existing orchestration
   result channel. A lifecycle receipt such as `worker_done` or
   `outcome: succeeded` is transport metadata, not contract status; keep it
   separate from the envelope.
3. The parent parses the exact envelope and runs
   `checkSubagentEvidenceContract` or `assertSubagentEvidenceContract` before
   using any child result. A failed structural check means reject or direct
   recheck.
4. The parent keeps `parentVerification` pending on the child envelope and
   records any verification decision outside the child submission. Low-risk
   structure may be reference-checked; canonical artifacts require identity,
   byte-hash, integrity, and basis checks; calculation or semantic impact
   requires direct locator review and a critical-check rerun.

The validator is a structural and boundary gate, not a truth, source-authority,
readiness, or activation gate. Applying this rule does not require a Luna
runtime, wrapper, persistent registry, JSONL event log, daemon, or schema
change.

## Implementation boundary

The v0 implementation is intentionally limited to:

- `src/subagentEvidenceContract.js`: constants, safe reference checks,
  canonical serialization, and structural validator.
- `test/subagentEvidenceContract.test.js`: positive lifecycle cases and
  fail-closed negative cases.
- This document.

It does not modify Luna runtime, subagent dispatch, wrappers, registries,
JSONL event sourcing, daemon/background workers, existing artifact identity,
astrology readiness schemas, or remote/production state.
