# Ziwei P0 palace branch-slot composition v8

v8 is an additive successor to v7. It records two materially different research outcomes without promoting either to the semantic graph:

1. an official National Library of Korea `紫微數` collection figure was acquired and directly reviewed as one figure JPEG only;
2. a 1870 `十八飛星` / Hanyang University bibliographic route was identified through a secondary institutional record, without original page bytes.

The already-held-out `華山陳希夷先生飛星紫微斗數原旨` and anonymous Korean `紫微斗數方書` scans are not duplicated here. They remain v3/v6/v7-held candidates.

## Result

The v8 graph remains unchanged:

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

The v8 frontier has ten reviewed candidates, nine acquisition leads, and one frontier-only direct observation. All frontier candidates and the secondary lead remain outside the graph.

## NLC `紫微數`: direct figure-only observation

The [NLC official collection page](https://www.nl.go.kr/NL/contents/N20103000000.do?schIdSub=CO20211102161426612100&schM=contView) identifies `[조선의 천문학] 자미수(紫微數)`, reports unknown author/year and a missing or damaged head, and describes a sequence including `定十二宮`. The supplied figure is a single JPEG, not a complete scan. Its source bytes are recorded as:

- locator: `https://rm.nl.go.kr/imgs/images/000026/2021_dc_astro_math_28_i01.jpg`;
- control no: `KOL200200680`;
- dimensions: `491×741`;
- byte length: `351470`;
- SHA-256: `e56d1cc148c8166cc4c9507ca3cdab616f6c451bedf15db07753b6c43451115`.

Direct visual review establishes only:

- a circular diagram divided by radial lines into sectors;
- a central vertically arranged text block;
- visible sector glyphs, without safe promotion of their exact branch-token readings;
- no safely legible complete named-palace perimeter.

The page title and `定十二宮` sequence are official curator-page text, not a canonical transcription of the original figure. The figure-only boundary is therefore:

| Field | Direct observation | Binding result |
| --- | --- | --- |
| branch token | glyph-like sector labels are visible; exact tokens are not promoted | not bound |
| palace name | no complete named-palace perimeter is legible | not bound |
| physical slot | circular sector geometry is visible, but no named slot map is visible | not bound |
| ordinal/direction | no production ordinal or direction is visible/established | not bound |

This figure does not establish identity with Youyi Lu, Nanbei, Nanyangtang, or any existing graph source. It is retained as a direct figure-only observation, not a source graph observation or semantic witness.

The [NLC original-text access guide](https://www.nl.go.kr/NL/contents/N71240000000.do) also makes clear that original-text access can depend on public-domain and access conditions. The attempted full viewer route was not a substitute for missing source bytes.

## 1870 `十八飛星` acquisition lead

The [AKS Sillokwiki `紫微數` entry](https://dh.aks.ac.kr/sillokwiki/index.php/%EC%9E%90%EB%AF%B8%EC%88%98%28紫微數%29) is a secondary institutional bibliography that identifies `新刻合倂十八飛星策天紫微斗數全集`, dated 1870, as six volumes of woodblock printing and names Hanyang University Library as a holding. No original page image or downloadable source bytes were obtained in this session. It remains an acquisition lead only, not an original witness, independent lineage, source authority, or semantic authority.

## 1871 ↔ 1883 boundary retained

The v7 comparison remains unchanged. The [CiNii 1871 record](https://ci.nii.ac.jp/ncid/BD19656670) and [CiNii 1883 record](https://ci.nii.ac.jp/ncid/BB19945538) share the catalog description `左右双辺有界10行21字注文双行`, but report different dimensions, inner-frame measurements, fish-tail wording, and extent metadata. No direct 1871 page, colophon image, byte comparison, block identity, or independent-lineage conclusion follows.

The 1871/1883 catalog comparison does not bind palace name, branch token, physical chart slot, ordinal, or production direction.

## Binding and authority boundary

The existing direct named-palace corroboration, Nanbei branch/perimeter observations, Tianfu relation comparison, and composed 12-row matrix remain unchanged. The matrix still has `directSingleWitnessFullBindingCount=0`, `productionOrdinalBindingCount=0`, and `semanticAuthorityCount=0`. The NLC figure adds no Tianfu anchor and no direct four-field row. The 1870 lead adds no page observation.

Direct observation, catalog metadata, secondary bibliography, deterministic composition, lineage inference, semantic authority, readiness, and activation remain separate gates. No production rule, source-authority field, readiness state, remote database, deployment, commit, or push was changed.

## Validation contract

The v8 materializer is deterministic and network-free at materialization time. Its checker verifies:

- v7 predecessor content and byte identities;
- the figure JPEG locator, byte hash, dimensions, and full-scan boundary;
- the four figure-only non-binding fields;
- the 1870 secondary-lead no-bytes boundary;
- the retained 1871/1883 catalog-only lineage boundary;
- unchanged graph, Tianfu, binding, blocker, readiness, and activation counts;
- protected-asset hash and all integrity sidecars.

The negative checker rejects figure-to-source promotion, figure-to-four-field binding, secondary-lead promotion, 1871 byte-lineage promotion, graph admission, readiness/authority promotion, and generated timestamps. OCR or search-index text remains locator-only and is not canonical semantic evidence.
