# Historical basis validity contract v1

This contract separates a historical artifact's provenance validity from its
status as a current artifact. It is a local, stateless classification helper;
it is not a readiness, semantic-authority, activation, scheduler, or retry
system.

## Statuses

`src/artifactIdentity.js` exposes `classifyHistoricalBasisValidity` and the
following statuses:

- `historical_valid`: the artifact's payload and integrity are verified, its
  relevant inputs are traceable to the recorded basis or still match current
  bytes, and a parent has supplied an explicit, verified replay result from
  the pinned basis.
- `current_compatible`: the artifact's payload and integrity are verified,
  every relevant input matches current bytes, and the relevant checker
  identity is verified. Ancestry by itself cannot produce this status.
- `replay_required`: the artifact is not declared corrupt, but replay or
  identity evidence is insufficient. Missing checker identity, changed input
  bytes, or absent parent-verified replay belongs here.
- `invalid`: a fail-closed integrity/provenance failure was observed, such as
  an invalid basis, payload hash mismatch, structural artifact identity
  mismatch, or failed integrity result. This fourth outcome is intentionally
  separate so `replay_required` is never used as a corruption claim.

The classifier returns fatal `errors` separately from non-fatal
`reasons`. A `replay_required` result may have reasons and must not be treated
as a failed artifact without an additional corruption finding.

No status promotes `current artifact`, readiness, semantic authority, or
activation. In particular:

```text
historical_valid != current artifact
current_compatible != domain readiness
gate/checker PASS != production activation
```

## Materialization boundary

The Ziwei materializers retain strict exact mode as the default. An exact
materialization/replay requires both the current checkout and `origin/main` to
equal the pinned `BASIS_HEAD`.

`{ mode: 'historical_reference' }` is an explicit descendant-reference path.
It requires the expected branch and pinned basis to be an ancestor of the
current and `origin/main` heads, then permits the existing checker to compare
the frozen artifact against a deterministic reference rebuild. It does not
rewrite the artifact, update `BASIS_HEAD`, or assert `historical_valid` or
`current_compatible`.

An exact replay remains the source of the `historicalReplay` evidence passed to
the classifier. The classifier does not infer replay success from ancestry or
from a current checker returning no errors.

## Identity requirements

Classification requires the existing artifact identity contract, including:

- a resolvable pinned generation basis and descendant ancestry;
- the declared artifact/materializer identity and payload hash;
- current or pinned-basis byte identity for each relevant input;
- a verified integrity result; and
- a verified checker/materializer semantics identity for
  `current_compatible`, or explicit parent-verified pinned replay for
  `historical_valid`.

The current worktree may contain unrelated dirty or untracked files. They are
not relevant unless they are declared artifact inputs. A relevant materializer
or checker whose bytes cannot be established at the pinned basis is not
guessed to be compatible; the result is `replay_required`.

The contract is intentionally stateless. Replay evidence is supplied by the
parent caller and is not persisted in a registry, JSONL log, or artifact
schema. Child observations remain evidence for parent verification; they do
not promote a parent goal or any domain authority.
