# Saju v1 local frontier v0

This is an additive, fail-closed inventory derived from `artifacts/saju-claim-provenance-v0.json`. It is not a replacement for the canonical claim artifact and does not promote any claim, readiness, grounding, or activation state.

## Current boundary

- Canonical inventory: 43 claims and 126 occurrences.
- Claim-level classical verification: 0 claims established.
- Taxonomy: 0 `locally_supported`, 1 `partially_supported`, 36 `source_unresolved`, 2 `implementation_policy_only`, and 4 `interpretation_noncanonical`.
- The one partial claim has only a scoped external day-pillar match; it does not verify the full day-master claim.
- Internal fixtures remain regression evidence, not independent truth evidence.
- Source packets use candidate titles and search anchors only. No page, chapter, section, edition, source byte, or locator is marked observed or verified.

## What the packets require

Each packet records the canonical claim IDs, the classical principle or wording still needed, candidate source families, candidate search anchors, conflict criteria, and implementation coefficients that must stay separate from classical authority. A future worker must observe the actual source bytes/pages before changing any `sourceAuthorityStatus`, `locatorStatus`, or claim taxonomy state.

The packet set covers: four-pillars/calendar, candidate boundaries, element counting, ten gods, branch relations, 格局, 神煞, strength, 用神, and timing. The remaining frontier is external primary/classical source observation, an independent broader calendar/time oracle, user policy decisions where applicable, and explicit readiness/production approval.

## Validation contract

`scripts/materialize-saju-v1-local-frontier-v0.mjs` is deterministic and binds the current canonical claim artifact plus the Saju calculation consumers. `scripts/check-saju-v1-local-frontier-v0.mjs` checks claim identity/order, taxonomy distribution, source non-observation, content identity, exact artifact bytes, and materializer agreement. The artifact is at `artifacts/saju-v1-local-frontier-v0/complete.json` with an exact-byte integrity sidecar.
