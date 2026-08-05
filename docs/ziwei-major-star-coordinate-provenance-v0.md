# Ziwei major-star coordinate provenance and readiness packet v0

This additive packet is based on local `main` HEAD `d5f2853ca6a995301d01129f45d6a41bf67328e5`. It does not change the production rule, API/schema, enum, baseline, readiness, grounding, or activation state.

## Coordinate convention finding

The source witnesses are the secured PDF `/Users/softie/Downloads/命-南北山人_紫微斗数全书.pdf` (SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`, 219 pages): p11/三十一/起紫微五訣, p12/三十三/起紫微簡索表, p13/三十四/甲六、安天府, with render/crop hashes retained in `sourceEvidenceIndex.json`. The source evidence establishes branch labels, branch order, bases, and traversal wording/table order. It does not establish a shared mapping from those branch tokens to the repository’s semantic palace identities.

The repository independently exposes `子..亥` as a zero-based branch enum, uses 寅 as the 紫微 calculation base, defines the integrated Tianfu equation as `mod(10 - ziwei)`, and places all 14 stars through two offset series. `starResolver` then finds `palaceId/name` from the caller-provided `palaces` array by matching `palace.branch`; the 12 palace definitions and positional opposite/trine helpers do not provide a canonical branch-to-palace identity map. Therefore both source and integrated conventions are only partially defined, and palace semantic identity remains unresolved.

## 14-star coverage

紫微 is directly source-backed and compares 150/150 exact by raw branch. In the current major-star raw coordinate comparison, 天府 is directly source-backed with 0/150 exact and 150/150 mismatches. The earlier Tianfu discrepancy artifact separately recorded 25 matches / 125 mismatches for its prior integrated-original baseline; that was a different comparison baseline and must not be mixed with the current neutral-coordinate result. In the current comparison, `rotation-06` and `source-base-direction` each explain all 150 rows with residual 0. This is a numeric coordinate relation only. The other 12 stars have integrated offsets and dependency edges but no securely transcribed direct source rule in the admitted witness set; they remain `source_unresolved`, not inferred from the Tianfu relation.

The dependency graph has two roots: 紫微 → 天機·太陽·武曲·天同·廉貞 and 天府 → 太陰·貪狼·巨門·天相·天梁·七殺·破軍. The Tianfu semantic blocker therefore reaches all eight Tianfu-series stars; the missing source rules independently block the remaining five Ziwei-series dependents. Stable claims remain 0, readiness `not_safe_to_start`, grounding `blocked`, and activation `experimental`.

## Decision packet

- Retain integrated: preserves current numeric behavior but keeps the semantic blocker.
- Replace with source rules: requires source rules for affected stars, shared palace identity, approved migration, and a fresh baseline; not implemented.
- Compatibility layer: could preserve both raw systems, but requires an explicitly authorized contract/consumer design; not implemented.
- Continue blocked: acquire admissible palace-identity evidence and the unresolved-star rules without changing production.

Materializer: `scripts/materialize-ziwei-major-star-coordinate-provenance-v0.mjs`.
Checker: `scripts/check-ziwei-major-star-coordinate-provenance-v0.mjs`.
Negative checker: `scripts/check-ziwei-major-star-coordinate-provenance-negative-v0.mjs`.
