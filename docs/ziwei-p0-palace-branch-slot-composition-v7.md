# Ziwei P0 palace branch-slot composition v7

v7 is an additive successor to v6. It records a bounded catalog-level comparison of the exact 1871 and 1883 CiNii records and three additional catalog acquisition routes. It does not add page bytes, a new direct scan witness, a graph source, a semantic claim, a physical chart slot, or a production ordinal.

## Result

The v7 graph remains unchanged from v6:

- `30` claims;
- `19` sources;
- `55` observations;
- `146` relations;
- `11` open blockers;
- `0` independent physical witnesses admitted;
- `0` production ordinal bindings;
- `0` semantic-authority promotions;
- readiness `not_safe_to_start`;
- grounding `blocked`;
- activation `experimental_only`;
- rotation 06 `representation_only`.

The v7 frontier has nine reviewed candidates and eight acquisition leads. All frontier candidates remain outside the graph.

## 1871 ↔ 1883 catalog-format comparison

The [CiNii 1871 record](https://ci.nii.ac.jp/ncid/BD19656670) reports `左右双辺有界10行21字注文双行`, inner frame `16.0×10.9cm`, `白口単黒魚尾`, and `23.6x15.0cm` for one bound volume.

The [CiNii 1883 record](https://ci.nii.ac.jp/ncid/BB19945538) reports the same `左右双辺有界10行21字注文双行` description, inner frame `15.9×11.1cm`, `単魚尾`, and `23.4×15.1cm`; it records the six-part extent as `13, 27, 18, 6, 18, 6丁`.

This closes only a narrow catalog metadata comparison:

- the shared row/character and double-ruled description is a bounded bibliographic match;
- the dimensions, inner-frame measurements, fish-tail wording, and extent metadata differ or are reported at different granularity;
- no page-text, colophon-image, source-byte, block-identity, or independent-lineage conclusion follows;
- the comparison does not bind a palace name to a branch token, physical chart slot, or production ordinal.

## Additional catalog routes

The [1902 CiNii record](https://ci.nii.ac.jp/ncid/BA85312898) and its [Kyushu University OPAC record](https://catalog.lib.kyushu-u.ac.jp/opac_openurl/?ncid=BA85312898) identify a one-volume `游藝録 6巻` copy at Kyushu University. The OPAC resolves to a catalog/handle landing page, not page-image bytes.

The [1897 CiNii record](https://ci.nii.ac.jp/ncid/BA90448039) identifies a one-volume composed `春在堂全書` record containing `游藝録 6卷` at Bukkyo University. No public page-image or downloadable scan route was located.

The [NDL 1882 record](https://ndlsearch.ndl.go.jp/books/R100000002-I000007637258) identifies `光緒8重定刊` and records the catalog note `同治十年秋八月曾國藩署檢`, but the record exposes no PID, IIIF manifest, or page-image route.

The NDL manuscript route `2606209` was rechecked through the NDL Search HTML, PID route, IIIF manifest, DOI-shaped route, OAI-shaped route, and known viewer/download route patterns. The catalog HTML exposes a nominal IIIF field and `PDM`/internet-public metadata, but `https://dl.ndl.go.jp/api/iiif/2606209/manifest.json` returned `404` with `{"itemId":"info:ndljp/pid/2606209","checkResult":"NG"}`; no page bytes were acquired. The compiled-volume PID `2610509` has the same manifest result. The NDL catalog/access surface is therefore still an acquisition lead, not a page witness.

The anonymous Korean `紫微斗數方書` scan was also directly re-reviewed at the v6-held-out pages. Pages 5–8 visibly contain rule/order surfaces such as `定十二宮法`, named palace order, branch tokens, and `安天府法`, but no single source surface visibly joins all named palaces, branch perimeter, physical chart slot, and production ordinal. It remains held outside the graph.

## Authority boundary

The derived research composition is not semantic authority. The direct Nanbei perimeter, the direct Youyi named-palace/relative-order surfaces, the NLC same-edition scan, the Zhejiang late-reprint scan, the NARA chart-example surfaces, and the catalog comparison remain separate evidence roles. The branch-to-physical-slot join remains a composed inference across surfaces. The exact 1871 impression remains unacquired at page-byte level.

No production rule, source-authority field, readiness state, remote database, deployment, commit, or push was changed.

## Validation

The v7 materializer is deterministic and network-free at materialization time. Its checker must verify the v6 predecessor byte identity, the three catalog-only candidates, the catalog-format comparison boundary, all unchanged graph/readiness counts, protected-asset hash, and integrity sidecars. The negative checker must reject catalog-to-page promotion, lineage promotion, graph admission, readiness promotion, and generated timestamps.

OCR/search-index text remains locator-only and is not canonical semantic evidence.
