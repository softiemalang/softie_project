# Ziwei twelve major-star placement evidence v0

## Verdict

`complete_ziwei_twelve_major_star_placement_evidence_without_promotion`

This is a source/provenance and production-comparison result only. It does not change the production calculation, public contract, readiness, grounding, activation, or source promotion boundary.

## Scope and source identity

The fixed basis is HEAD `64e63e99d04708013c5e480baf4b7782ed5c2c44`. The two external PDFs were re-hashed from their original absolute paths and checked with `pdfinfo`:

- Ming Nanyang Hall edition: 528 pages, unencrypted, SHA-256 `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc`.
- Nanbeishanren edition: 219 pages, unencrypted, SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`.

The PDFs remain read-only and external. No PDF bytes were copied into the repository. Thumbnail screening covered all pages of both PDFs. Direct high-resolution review covered the core rule pages: Ming p148 and p172, and Nanbeishanren p11–p13. OCR was used only as an exploration aid; canonical text in the artifact comes from direct visual review.

## Source locators and transcription

Nanbeishanren p11 / printed 三十一 contains `起紫微五訣`; p12 / printed 三十三 contains `起紫微簡索表`; p13 contains the two scanned leaves, printed 三十五 and 三十四. The 三十五 leaf gives the Ziwei series sequence, and the 三十四 leaf gives `甲六、安天府`, the corrected source Tianfu root table, and the Tianfu series verse.

The Ming p148 direct review locates the core Ziwei/Tianfu series verses. Ming p172 contains `安天府圖`, preserved as example-only diagram evidence. The Ming printed page number was not legible in the direct capture, so the artifact records `printedPage: null` and an explicit uncertainty rather than guessing a printed folio number.

The raw edition strings and normalized rules are separate. Normalized offsets are Ziwei-relative reverse offsets `天機 -1, 太陽 -3, 武曲 -4, 天同 -5, 廉貞 -8`, and Tianfu-relative forward offsets `太陰 +1, 貪狼 +2, 巨門 +3, 天相 +4, 天梁 +5, 七殺 +6, 破軍 +10`. The corrected Tianfu root successor is retained beside its predecessor; it is not silently substituted into the old artifact.

## Production derivation

The actual call path is `resolve14MajorStars -> calculateZiweiBranch/calculateTianfuBranch -> series offsets -> majorStars[id].palaceBranch`. The exact file hashes, symbols, line locations, equations, and output field are in `productionDerivationTrace`.

## Comparison and transformation search

The existing source fixture domain is the deterministic 5 bureaus × 30 lunar days = 150 rows. Twelve target stars are compared for each edition, preserving 1,800 occurrences per edition and 3,600 combined. Every occurrence retains raw source branch, normalized rule, production branch, source references, production code references, raw equality, rotation-06 comparison, and residual.

Ziwei-series results are raw exact for all 5 × 150 observations per edition. Tianfu-series results are raw unequal because the corrected source root is `output = mod(4 - ziwei)` while production uses `output = mod(10 - ziwei)`. A single global rotation-06 maps all seven Tianfu target-star placements across all 150 fixture rows in each edition, with no case-specific correction. This is `equivalent_representation_proven`, with semantic palace identity still blocked.

The finite search records rotations 0–11, same/reverse traversal, affine reflection, branch-base shifts 0–11, four page/table reading orders, zero-/one-based index conventions, and the three root-convention labels. Exact-fit candidates and non-fit counterexamples are materialized; no candidate is selected by manually tuning an individual case. The first raw Tianfu counterexample is retained in `minimumCounterexamples`.

## Validation and boundary

The materializer is run twice and the output bytes must match. The positive checker validates PDF identity, page/encryption metadata, 150-row and 3,600-occurrence coverage, sourceRefs and codeRefs, normalized rules, finite search, verdict boundaries, artifact identity, and byte-equivalent re-materialization. The negative checker mutates required hashes, rows, rules, references, counts, search axes, semantic boundary, and artifact identity and requires every mutation to fail.

No production calculation, public contract, readiness, grounding, activation, or source-promotion state is changed. The remaining research boundary is semantic identity of the palace coordinate convention, not numerical placement correspondence.
