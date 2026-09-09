# Saju Per-Hypothesis Discussion Authorization Contract v0

## Purpose

`saju-hypothesis-discussion-authorization-v0` is the bounded permission layer
above [`saju-hypothesis-submission-validation-v0`](./saju-hypothesis-submission-contract-v0.md).
An external conversational consumer submits one current validated hypothesis,
one user confirmation state for that hypothesis, and the fixed discussion
scope. The contract returns a permission for that hypothesis only. It does not
generate a hypothesis, store or classify a response, personalize a result, or
change global interpretation activation.

The supplied validation is re-run against the current canonical handoff
package. A permission is not issued when the embedded validation is missing,
stale, tampered, or detached from the current handoff.

## Request boundary

The request has exactly these top-level fields:

- `schemaVersion`, `version`, `kind`, `authorizationId`
- `hypothesisValidation`: the prior validator's complete `validation` object
- `userConfirmation`: `{ hypothesisId, state, scope, basis }`
- `requestedUse`: `{ hypothesisId, action, scope, otherHypotheses, personalApplication, globalActivation }`

`userConfirmation` must name the same hypothesis, use
`basis: external_user_confirmation`, and use `scope: this_hypothesis_only`.
The only accepted states are `confirmed`, `uncertain`, and `declined`.
`requestedUse` is intentionally fixed to discussion of the same hypothesis;
other hypotheses, definitive personal application, and global activation are
not requestable values.

Confirmation is a user gate, not source validation. It cannot promote a
literature claim to a FACT, resolve an unresolved prerequisite, select a side
of a preserved conflict, or create cross-lineage agreement.

## Permission matrix

| Confirmation / validated state | Permission | Allowed scope |
| --- | --- | --- |
| `confirmed` + non-blocked validation with no preserved unresolved/conflict boundary | `discussion_allowed` | Discuss the one hypothesis tentatively within its declared FACT, source/locator, and explicit user-context scope; personal use is bounded comparison only |
| `uncertain` + non-blocked validation | `explore_only` | Report and inspect the declared basis, but do not apply the hypothesis to the user |
| `declined` + non-blocked validation | `reject` | Report the rejection boundary only; do not treat the hypothesis as usable |
| any confirmation + blocked validation | `reject` | Confirmation cannot unlock missing semantic basis, invalid provenance, forbidden personalization, or cross-lineage synthesis |
| `confirmed` + preserved unresolved/conflict or conflicting reported context | `explore_only` | Keep the boundary/tension visible; confirmation cannot repair or resolve it |

`discussion_allowed` is not a definitive interpretation result. It authorizes
only a tentative discussion of one submitted hypothesis and comparison with
explicitly reported user context. It never authorizes a personality trait,
fortune, prediction, unstated personal attribute, or other definitive personal
conclusion.

## Output and invariants

The authorization carries:

- a single-hypothesis `scope` with the exact FACT refs, evidence ids,
  source/locator scope, and user-context ids;
- a separate `preservation` ledger for unresolved evidence, conflict ids,
  conflict state, and user-context decision;
- `decision.permission` with `discussion_allowed`, `explore_only`, or
  `reject`, plus explicit allowed and forbidden uses;
- a fixed `boundary` and `readiness` record.

For every valid request:

- `scope.hypothesisIds` contains exactly one id and
  `scope.otherHypothesisIds` is empty;
- `personalApplicationReady` is `false`;
- `conversationalInterpretationActivationReady` is `false` and
  `globalActivationPromotion` is `false`;
- unresolved/conflict state is copied from the validated result without a
  winner or repair;
- no recalculation or cross-lineage merge occurs.

An invalid request yields no authorization object and the `reject` permission.
The output validator also rejects scope, policy, provenance, or activation
tampering.

## Conformance verification

The synthetic E2E fixture materializes the existing Base, lineage evidence
envelope, conversational handoff package, and prior submission validation. It
then verifies:

1. fresh-file request consumption and canonical reserialization/byte SHA
   parity for a confirmed bounded discussion;
2. the `confirmed` / `uncertain` / `declined` state matrix;
3. preserved conflict and unresolved evidence remaining `explore_only` even
   after confirmation;
4. rejection of cross-hypothesis, definitive-personalization, and global
   activation requests;
5. rejection of stale validation and tampered authorization output; and
6. a blocked structural-only submission remaining rejected despite confirmation.

No conversational model, response store, response classifier, or
personalization engine is part of this contract.

Implementation: [`src/interpretationPrep/sajuHypothesisDiscussionAuthorizationContract.js`](../src/interpretationPrep/sajuHypothesisDiscussionAuthorizationContract.js)

E2E fixture: [`test/sajuHypothesisDiscussionAuthorizationContract.test.js`](../test/sajuHypothesisDiscussionAuthorizationContract.test.js)
