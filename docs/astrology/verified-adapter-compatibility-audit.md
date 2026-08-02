# Verified Astrology Adapter v1 compatibility audit

## Decision

`astrology-raw-chart-v1` and `astrology-rule-chart-v0` are compatible with the
service only through the additive `verified-astrology-adapter-v1` dry-run
contract. The adapter produces a verified calculation context, but it does not
activate interpretation or any production service path.

The legacy contract remains unchanged: `western_tropical_placidus_v1`,
`placidus`, and `ephemerisSource: pending`. `planetResolver.js`,
`houseResolver.js`, and `aspectResolver.js` remain simulation-only assets.

## Consumer inventory

| Consumer | Current meaning | Boundary result |
| --- | --- | --- |
| `src/astrology/astrologyContract.js` | legacy planet/angle/house context; birth time can imply high confidence | not called by verified adapter |
| `src/astrology/planetResolver.js` | date-seed simulated bodies | legacy-only; never fallback |
| `src/astrology/houseResolver.js` | seeded equal-interval house simulation | legacy-only; not Whole Sign |
| `src/astrology/aspectResolver.js` | legacy aspect projection and hardcoded applying semantics | legacy-only; Rule Core aspect phase preserved separately |
| `src/astrology/astrologyPromptAdapter.js` | prompt payload over legacy interpretation context | not called; activation remains blocked |
| `src/interpretationPrep/threeSystemPrepPipeline.js` | production Prep placeholder with simulation blocked status | not called |
| `src/interpretationPrep/unifiedPromptAdapter.js` / `sessionPromptAdapter.js` | production prompt/handoff consumers | not called |
| `src/lib/supabase.js` and API modules | persistence/service boundaries | not called |

The machine-readable decision table is
`docs/astrology/verified-adapter-compatibility-matrix.json`.

## Semantic gaps and non-coercion rules

- Whole Sign is not labelled or serialized as Placidus.
- Verified DE405 canonical-v2 provenance is not represented as `pending` or simulated.
- Rule Core orb and speed-derived phase are retained; legacy applying rules are not reused.
- Evidence status and explicit time/location/evidence completeness control status; birth-time presence alone never raises confidence or eligibility.
- Raw v1 and Rule Core v0 documents, hashes, source references, body speed/motion, angles, houses, aspects, rulers, and distribution remain versioned and lossless.
- A complete calculation is `calculationStatus: verified`, while `availableForInterpretation: false`, `integrationStatus: not_connected`, and `serviceEligibility: blocked` remain mandatory until a separately authorized activation contract exists.

## Contamination shield

The adapter rejects approximate/simulated ephemeris, legacy Placidus simulation,
date-seed provenance, missing or hardcoded aspect phase provenance, raw/rule hash
mismatch, v0-as-v1 inputs, incomplete availability/verification, Whole Sign /
Placidus mislabelling, and frozen-frame speed provenance. The static checker
`scripts/check-verified-astrology-boundary.mjs` verifies that the adapter has no
legacy resolver, Prep, prompt, API, DB, storage, or fetch dependency and that
production consumers do not import it.

## Dry-run evidence

`scripts/materialize-verified-astrology-dry-run.mjs` reads only the synthetic
golden fixture, recomputes Rule Core, and materializes the small JSON/Markdown
evidence under `artifacts/`. It contains no personal birth information,
generated interpretation, or local absolute paths. The output is deliberately
not wired to Prep, prompt, API, UI, or DB.
