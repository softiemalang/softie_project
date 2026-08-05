# Ziwei Tianfu convention provenance and relation packet v0

This additive packet is based on `75ce8619fd087699919bae14989813f551b87667`. Its verdict is `complete_ziwei_tianfu_convention_provenance_evidence_uncommitted` and its semantic gate is `blocked_semantic_identity_insufficient`.

The repository origin is reproducible: `7d2fb8fccc65ab34efea93ea2d16f94fb526417c` first introduced `src/ziwei/starPlacementRules.js` and `src/ziwei/starResolver.js`, including `traditional_v1`, `opposite_yin_shen_axis`, and `(10 - ziweiIndex) mod 12`. `1b30485389c3ffd1e65751220d2b7ac7db6000fd` only added resolver input validation and failure output; it did not change the Tianfu formula, branch enum, or call path. Neither commit supplies a source-page, edition, or shared palace-coordinate citation. This is Git provenance, not traditional authority.

The neutral model stores raw source and integrated values separately. Both expose branch label and ordinal (`子=0 … 亥=11`), while traversal direction, base, rotation, label mapping, and palace identity are independent fields. The source table is represented as `output = mod(4 - input)` (base `辰`, reverse); the integrated rule as `output = mod(10 - input)` (the `寅+申` axis, reverse). Exhaustive identity, fixed rotations, reflections, inverse mapping, 144 input/output enum relabel pairs, and source-base-direction candidates are compared across all 150 bureau/day rows.

The numeric relation is exact: `rotation-06` covers 150/150 with residual 0, and `source-base-direction` also covers 150/150 when evaluated from the shared Ziwei input. This proves a full-domain transform relation, not that a source branch token and an integrated branch token denote the same real palace. Therefore palace-semantic equivalence remains unresolved and no rule is selected or changed.

The packet links the existing source-chain and Tianfu discrepancy artifacts by exact file-byte SHA-256 and preserves their 150-row first-divergence (`bureau-2-day-01`) and prior 25/125 original-baseline result. Stable claims remain 0; readiness remains `not_safe_to_start`, grounding `blocked`, and activation `experimental`. Promotion would require independent source review, sufficient source edition/lineage and immutable-witness linkage for palace identity, and an authoritative shared palace-coordinate mapping.

Materializer: `scripts/materialize-ziwei-tianfu-convention-provenance-v0.mjs`; checker: `scripts/check-ziwei-tianfu-convention-provenance-v0.mjs`; negative inventory: `scripts/check-ziwei-tianfu-convention-provenance-negative-v0.mjs`.
