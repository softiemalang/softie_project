# Ziwei NARA IIIF leaf-map and semantic-witness frontier v1

## Result

This additive evidence package records a complete, deterministic leaf-map comparison between the two public NARA IIIF volume viewers for `新锓希夷陈先生紫微斗数全书` and the local Nanyangtang 528-page PDF. The reconnaissance frontier is exhausted within the reachable material, but semantic identity remains blocked.

The package is deliberately uncommitted and does not change the production rule contract, public contract, readiness, interpretation, or any earlier Ziwei artifact.

Verdict: `complete_ziwei_nara_iiif_leafmap_semantic_witness_frontier_exhausted_uncommitted`

Semantic status: `blocked_semantic_identity_insufficient`

## Witness and provenance

The NARA record is [F1000000000000101426](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html), file `1078787`, call number `子０６０－０００１`. The two IIIF manifests are:

- volume 1, item `4468520`, 129 canvases, manifest SHA-256 `732991ca47aefc323e2095a93202fd301421ad8b92994c63caae2a94acf75af`;
- volume 2, item `4469314`, 137 canvases, manifest SHA-256 `3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560`.

Every 266 leaf images was reviewed as an external 1200px locator image. Selected semantic, chart, and boundary leaves were also reviewed through the native `full/max/0/native.jpg` endpoint; native image bytes and dimensions are recorded in `captureReview.nativeSamples`. Original NARA images stay outside the repository.

The comparison PDF is the explicitly configured `nanyangtang_quanbao_528p` source. Its actual bytes were read and hashed as SHA-256 `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc`, with 528 pages and `Encrypted: no`. No inferred home/download path or substitute PDF was used.

NARA record-level reuse metadata and item-viewer image-level settings are kept separate. This package does not promote image redistribution or licensing conclusions beyond the existing acquisition-route boundary.

## Deterministic concordance

NARA photographs open-book spreads. The local PDF is a traditional-reading-order derivative, so a spread's visual-right page precedes its visual-left page in the local page sequence. The explicit exceptions are:

| NARA side | Local result |
| --- | --- |
| v1 c1 visual-right | omitted blank/background side |
| v1 c129 visual-left | omitted outside-book/background side |
| v2 c2 visual-right | omitted blank/background side |
| v2 c136 visual-left | blank side retained as local page 527 |
| v2 c137 visual-left | omitted outside-book/background side |

The resulting map has 528 local pages, 532 NARA side slots, and four declared omitted side slots. Local pages 1–528 occur exactly once. Relation counts are: `same_text_different_capture` 522, `probable_correspondence` 6 (covers/blank boundary pages), `exact_same_leaf` 0, and `unresolved` 4 (the four omitted NARA side slots, not ambiguous local page assignments).

The boundary anchors are local pages 254–258 and 526–528. Semantic/chart anchors include local pages 167 (`五行局`/branch chart), 172 (`安天府圖`), 175 (branch/day grid), and selected volume-2 chart pages 382–405. They support sequence correspondence only; they are not independent semantic oracles.

## Semantic result

The NARA material visibly contains bureau charts, branch/day grids, `安天府圖`, transformation tables, rule/example prose, and repeated natal-chart examples. It does not directly provide a complete, accepted binding for all twelve palace names to branches, physical slots, direction/cycle, and the repository production ordinal.

The required complete binding count is `0/12`. The existing `rotation-06` and source-base-direction relations remain representation-only diagnostics (`150/150` numeric matches); this NARA witness does not authorize either relation as semantic truth.

NARA volume 1 and volume 2 are the two volumes of the same catalog record and edition pair. Their agreement is therefore not an independent second oracle. The local Nanyang PDF is a comparison derivative, not a third independent authority.

The package preserves the fail-closed impact boundary: stable claims `0`, readiness `not_safe_to_start`, grounding `blocked`, activation `experimental`, production/public/readiness/contract mutation `false`.

## Files and checks

The materializer, checker, negative checker, and additive artifact are:

- `scripts/materialize-ziwei-nara-iiif-leafmap-semantic-witness-v1.mjs`
- `scripts/check-ziwei-nara-iiif-leafmap-semantic-witness-v1.mjs`
- `scripts/check-ziwei-nara-iiif-leafmap-semantic-witness-v1-negative.mjs`
- `artifacts/ziwei-nara-iiif-leafmap-semantic-witness-v1/`

The artifact records the actual NARA manifest/capture-index byte hashes, selected native image hashes/dimensions, actual local PDF hash, every leaf/canvas locator, every local-page relation, semantic observations, predecessor byte protection, and artifact identity. Rendered images and original NARA bytes are external temporary evidence only.

Run with the verified PDF source configuration:

```sh
PDF_SOURCE_NANYANGTANG_PATH="/Users/softie/Documents/malang_lab/documents/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf" \
  node scripts/check-ziwei-nara-iiif-leafmap-semantic-witness-v1.mjs
PDF_SOURCE_NANYANGTANG_PATH="/Users/softie/Documents/malang_lab/documents/新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf" \
  node scripts/check-ziwei-nara-iiif-leafmap-semantic-witness-v1-negative.mjs
```
