# Ziwei P0 TOYO_1646 extended observation v0

## Result

This is an additive follow-up to [`ziwei-p0-claim-source-identity-frontier-v1`](../docs/ziwei-p0-claim-source-identity-frontier-v1.md). It visually reviews eight pre-existing TOYO_1646 JPEG cache files that were not included in the predecessor's 15-image visual sample: `0002`, `0009`, `0010`, `0011`, `0012`, `0013`, `0019`, and `0020`. It also rechecks the actual bytes and hashes of all 15 predecessor-reviewed files, so the bounded local cache frontier is 23 hash-verified JPEGs.

The result is bounded direct observation only:

- all 23 cache JPEG bytes are read from an explicitly configured `TOYO_1646_CACHE_DIR` and SHA-256 checked; the eight new visual rows are separated from the 15 predecessor rows;
- the images remain outside Git and no acquisition is performed;
- OCR/transcription remains locator-only;
- TOYO_1646 remains `independent_physical_witness_candidate_not_admitted_as_independent_oracle`;
- no semantic authority, stable claim, blocker closure, readiness, grounding, activation, or `rotation-06` promotion is made.

Verdict: `complete_ziwei_p0_toyo_1646_extended_observation_bounded_unresolved`

## What the additional leaves show

The blank/opening spread (`0002`) adds physical-object context but no readable rule or coordinate legend. The pages `0009`–`0013` visibly add named-star, branch/year, 流年, palace/branch, and dense rule/example surfaces. The later pages `0019`–`0020` visibly add `形性賦` and `星垣論` star-property/interpretive prose. These observations are useful for locating candidate material, but they do not provide a complete source-identified placement rule, a complete 12-palace semantic map, or an edition/colophon/lineage decision.

In particular, the added pages do not close:

- the exact TOYO manuscript date, colophon, edition family, or textual lineage to NARA/Nanbei/Nanyangtang;
- the complete binding of palace names, branch glyphs, physical slots, ordinal, and traversal/base direction;
- all major-star placement rules, a complete auxiliary-star rule witness, or the 10-stem × 4 transformation table;
- the legacy/source-aligned Tianfu convention or the semantic meaning of `rotation-06`;
- an independent external oracle, calendar/time source, or image-reuse permission.

## Impact

The predecessor remains byte-preserved at 30 claims, 13 sources, 26 observations, 116 relations, and 11 blockers. This additive packet contributes 8 new visual observation rows and 8 bounded relation rows, giving a combined audit view of 34 observations and 124 relations without adding claims or sources. The 15 predecessor image hashes are rechecked from `source-lineage-inventory.json`; they are not reclassified as new visual observations. No blocker is closed; stable claims and semantic authority remain zero, readiness remains `not_safe_to_start`, grounding remains `blocked`, and `rotation-06` remains representation-only.

The recheck found one historical ledger discrepancy: predecessor leaf `0085` records a malformed 62-character value ending `75ae6e`, while the actual cached JPEG hashes to `3f315cfc53f1a97417e7212e6c0cbbc6d01cf4831e3853e825969c2f75aeae6e`. The predecessor is not rewritten. Both values are retained with the decision `historical_record_mismatch_preserved`; the actual byte hash is used only for this additive cache audit, not as a semantic or edition-authority claim.

## Reproducibility and checks

The materializer fails closed unless `TOYO_1646_CACHE_DIR` is explicitly supplied and every one of the 23 required cache files matches its recorded actual-byte hash. Viewer leaves outside this pre-existing cache are not acquired or inferred. For the current local cache:

```sh
TOYO_1646_CACHE_DIR=/private/tmp \
  node scripts/materialize-ziwei-p0-toyo-1646-extended-observation-v0.mjs
TOYO_1646_CACHE_DIR=/private/tmp \
  node scripts/check-ziwei-p0-toyo-1646-extended-observation-v0.mjs
TOYO_1646_CACHE_DIR=/private/tmp \
  node scripts/check-ziwei-p0-toyo-1646-extended-observation-v0-negative-v0.mjs
```

The materializer, checker, negative checker, test, and artifact are:

- `scripts/materialize-ziwei-p0-toyo-1646-extended-observation-v0.mjs`
- `scripts/check-ziwei-p0-toyo-1646-extended-observation-v0.mjs`
- `scripts/check-ziwei-p0-toyo-1646-extended-observation-v0-negative-v0.mjs`
- `test/ziweiP0Toyo1646ExtendedObservation.test.js`
- `artifacts/ziwei-p0-toyo-1646-extended-observation-v0/`

The negative checker rejects semantic-authority and independence promotion, image storage, hash damage, invented folio identity, OCR canonicalization, blocker closure, readiness promotion, predecessor-boundary damage, and timestamps.
