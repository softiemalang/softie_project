# Ziwei palace-coordinate semantic identity evidence packet v0

Verdict: `complete_ziwei_palace_coordinate_semantic_identity_evidence_uncommitted`.
Semantic gate: `blocked_semantic_identity_insufficient`.
Basis HEAD: `a4cbf12b0a79c443e823b552631ae9c505e0127d`.

This is an additive, source-first audit packet. It does not modify production calculation, enum/API/schema, fixtures, tolerance, readiness, grounding, activation, or any existing artifact. The authoritative local PDF is `/Users/softie/Documents/命-南北山人_紫微斗数全书.pdf`, 219 pages, SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`.

## Evidence boundary

The packet records five page-region witnesses:

- p7 `十二宮冠蓋`: the rendered diagram shows a 12-cell perimeter of branch labels. The observed clockwise physical sequence is `巳, 午, 未, 申, 酉, 戌, 亥, 子, 丑, 寅, 卯, 辰`. It does not visibly bind those cells to the repository's palace names.
- p8 `定命、身二宮`: `寅起月`, `命宮逆數`, and `身宮順數` provide traversal vocabulary and direction. They do not directly declare that the repository's palace-name ordinal is the same coordinate frame.
- p11 `起紫微五訣` and p12 `起紫微簡索表`: direct 紫微 star-to-branch rule/table evidence, retained as branch/ordinal evidence only.
- p13 `甲六、安天府`: direct 12-row 紫微→天府 branch table, retained as raw source table order and branch/ordinal evidence only.

Each witness stores page, rendered region, PDF identity, and rendered review hash in `sourceWitnessIndex.json`. OCR remains exploration-only and is not canonical. The earlier 219-page screening result is linked and explicitly marked unmodified.

## Coordinate inventory and answer to the five questions

The repository's `BRANCHES` enum is `子丑寅卯辰巳午未申酉戌亥` with zero-based ordinal 0..11. `ZIWEI_PALACE_DEFINITIONS` has 12 default labels at `defaultIndex` 0..11, but no canonical branch-to-palace-name mapping. `ziweiResolver` anchors the array at the computed 命宮 branch and increments branch positions; `starResolver` resolves a palace by matching a caller-provided palace branch. Positional opposite/trine helpers use array index arithmetic. These are repository conventions, not source authority.

The p7 diagram's branch labels can be mechanically indexed as physical diagram slots, but that is a branch-to-diagram-position relation, not a palace semantic relation. The source and production contexts therefore stay separate: raw ordinal, branch label, diagram position, palace name, source direction, and production direction are independent fields in every row.

The exhaustive related domain contains 150 rows: bureaus 2..6 × lunar days 1..30. All 170 candidates are applied to all 150 rows:

- 0/150 raw Tianfu identity;
- `rotation-06`: 150/150, residual 0;
- `source-base-direction`: 150/150, residual 0;
- the 12 enum relabelings equivalent to output offset 6 also fit 150/150;
- identity, the remaining 11 fixed rotations, all 12 reflection rotations, and inverse mapping fail at a recorded first divergence.

`rotation-06` is therefore a full-domain numeric transform. Current evidence cannot decide whether it is merely a coordinate re-expression or a genuinely different palace placement, because no admitted witness establishes the semantic identity of the branch tokens, diagram slots, and palace names across source and production. The prior 150-row first divergence and the prior integrated 25/125 baseline remain preserved in their original artifacts.

The same unresolved boundary applies to the shared coordinate question for 命宮, 身宮, and 12-palace labels: p8 is direct evidence for traversal wording, while the repository has direct evidence for branch calculation and positional indexing, but there is no direct shared semantic mapping witness. No semantic claim is stable; readiness remains `not_safe_to_start`, grounding `blocked`, activation `experimental`.

## Claim ledger and graph

`claimLedger.json` separates four claim types: direct source witness, repository convention, exact transform, and semantic unresolved. `relationGraph.json` links only declared nodes and rejects dangling relations. `blockerRegistry.json` keeps P0 `blocker-palace-semantic-identity` open and records the decision `continue_blocked`.

## User source-acquisition brief

Priority P0 is an immutable, readable scan that shows the complete 12-palace label-to-branch correspondence, including direction/order and any 命宮·身宮 anchor, with edition/title/author/volume/page or folio metadata and file SHA-256. Search keywords are `紫微斗數 十二宮 宮位 地支`, `十二宮冠蓋 宮名`, `定命身二宮`, `命宮逆數 身宮順數`, and `寅起月`.

Minimum capture is the complete p7 diagram plus adjacent explanatory leaf, complete p8 rule text and any linked table, and the title/edition/folio metadata. Accept actual scan bytes with visible glyphs, page identity, complete layout/table boundaries, and independently reviewable mapping. Reject preview/catalog-only material, OCR-only transcription, partial crops hiding labels or direction, inferred source identity, and manual exceptions.

## Human review handoff

Reviewers must decide whether p7 asserts palace names or only branch/compass positions; whether p8's 命宮·身宮 frame is the same frame as the 12-palace semantic labels; and whether any candidate can be semantically accepted or rejected from new evidence. They must preserve raw values, all 170 candidates, all 150 rows, first divergences, sourceRefs, and hashes. Production selection, compatibility aliases, readiness activation, confidence scores, interpretation, and LLM calls are out of scope.

Materializer: `scripts/materialize-ziwei-palace-coordinate-semantic-identity-v0.mjs`.
Checker: `scripts/check-ziwei-palace-coordinate-semantic-identity-v0.mjs`.
Negative checker: `scripts/check-ziwei-palace-coordinate-semantic-identity-negative-v0.mjs`.
