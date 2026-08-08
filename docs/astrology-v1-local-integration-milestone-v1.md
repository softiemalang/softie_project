# Astrology v1 local integration milestone

verdict=partial_astrology_v1_local_integration_milestone_advanced_uncommitted
schema=tri-system-readiness-handoff-v1

This additive artifact is a repository-only reconciliation of the existing Saju, Ziwei, and Western astrology calculation, evidence, claim, readiness, and handoff boundaries. It does not rewrite historical artifacts, acquire sources, call an LLM, create interpretation text, or activate delivery.

## Contract boundary

`src/interpretationPrep/triSystemReadinessContract.js` keeps calculation facts, source evidence, deterministic relations, and interpretation separate. It preserves conflicting or unresolved evidence in parallel, records stable claim count separately from observed/calculated counts, and requires every domain to carry its own readiness, grounding, activation, and blocker state.

The common envelope is `availableForInterpretation=false` and `integrationStatus=not_connected`. Domain readiness is not aggregated or copied across domains. A source reference is byte-linked evidence, not claim verification; a numeric relation is not semantic authority; and a fixture is not independent authority.

The runtime prep/handoff path also carries a machine-readable `evidenceBoundary` for each domain. It distinguishes calculation facts, unresolved source evidence, deterministic relations, and the still-uncreated interpretation/personal-meaning layer. The logical references are calculation/context paths, not independent source authority.

## Current local disposition

| Domain | Local state | Common envelope | Remaining frontier |
|---|---|---|---|
| 사주 | calculation and 43-claim/126-occurrence inventory preserved; five local PDFs now have byte-bound visual locator observations, but edition identity and claim support remain unresolved | blocked | identified source edition, claim-level support, and independent oracle |
| 자미두수 | scoped major-star evidence and 14-claim packet preserved; stable claim boundary and semantic/source authority blocked | blocked | external source/oracle/semantic authority |
| 서양 점성학 | local research packet/readiness is complete and hash-linked; delivery/activation remains blocked | blocked | True Node authority/licensing, human review, explicit activation |

The generated artifact records historical `baseHead` values as historical snapshots when they differ from the current checkout. No predecessor artifact is rewritten to make it current. The Saju source observation packet is additive and does not rewrite the earlier `saju-v1-local-frontier-v0` baseline.

## Reproduction and checking

```text
node scripts/materialize-astrology-v1-local-integration-milestone-v1.mjs
node scripts/check-astrology-v1-local-integration-milestone-v1.mjs
```

The materializer uses only repository files listed in its input manifest and emits an exact-byte integrity sidecar. The checker validates schema, contract boundaries, current evidence bytes, artifact identity, deterministic content, and the blocked common envelope.
