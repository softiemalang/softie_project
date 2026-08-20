# Gemini witness dossier parent adjudication v2

This is a versioned parent-direct continuation for the user-supplied Gemini 3.7 Flash High v3 candidate packet. The v1 dossier is preserved; this v2 records the direct evidence boundary that changed in Unit A and the resulting bounded B–E decisions.

The candidate packet remains `untrusted_candidate_only`. Candidate counts, verdicts, and completion claims are not imported as evidence. The artifact does not grant canonical-text status, semantic authority, `availableForInterpretation`, implementation-safe grounding, production, or activation.

## Source categories and gates

Every evidence record uses exactly one of these categories:

`DIRECT_OFFICIAL_SCAN`, `DIRECT_DERIVATIVE_SCAN`, `INSTITUTIONAL_METADATA`, `PHYSICAL_ITEM_CANDIDATE`, `BIBLIOGRAPHIC_WITNESS`, `INFERENCE`, `UNRESOLVED`.

Every claim separately carries `H/E/L/S/I/P` and the independence axes `physical-item`, `digital-derivation`, `edition/textual-lineage`, and `semantic-corroboration`. A distinct institution or digital object does not automatically satisfy textual-lineage or semantic-corroboration independence.

## Unit decisions

| Unit | Parent-verified scope | Remaining boundary |
| --- | --- | --- |
| A | [Jangseogak K3-437](https://jsg.aks.ac.kr/dir/view?dataId=LIB_116678) official scan, rendered pp.71–72, directly shows `卷三十三 / 論大運` and the requested worked-example fragments. The [NLC record](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_892&fid=411999013122) maps `114503.0` to 第4卷; its [public derivative](https://commons.wikimedia.org/wiki/File:NLC892-411999013122-114503_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC4%E5%86%8A.pdf) shows the same target family at pp.105–106. | The two scans are not normalized to identical wording: Jangseogak shows `二十九日申時立春`, while the NLC derivative shows `二十九日立春` and later `至二十九日申時止`. Physical-item and digital-path axes are recorded separately from edition/textual lineage and semantic corroboration. Kyujanggak [奎中1822-v.1-5](https://kyudb.snu.ac.kr/book/view.do?book_cd=GC01822_00) remains metadata-only; no actual 卷33 target scan was inspected. |
| B | The [NCL 耕寸集 record](https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?item=00ccfe6380184da28912a57393deb2d7fDI2NTQ0NQ2.PBlfBdELN3au83ZWddAblOP5Y3FBX8h5SLzXyf79aB4_&image=1&page=1030&SourceID=1&HasImage=) records `石研齋/秦氏印`; the derivative page 1 shows a seal-impression block. The Sinica authority record attributes `石研齋` to 秦恩復 (1760–1843). | This is a provenance candidate only. No seal-application chronology or ownership chain establishes TAQ 1843, an early copy date, or textual lineage. |
| C | 1895 報暉草堂 and 1923 紹興育新書局 are retained as third-party bibliographic witnesses/leads. The bounded Shanghai Library API search did not produce exact item-level records/pages for either date. | No physical item, institutional item ID, physical description, digital reproduction, or target-page collation was admitted. The two labels do not establish two independent physical or textual lineages. |
| D | The [Waseda official record](https://www.wul.waseda.ac.jp/kotenseki/html/bunko19/bunko19_f0111/index.html) and hosted scan show `正月甲木`, `二月甲木`, and `三月甲木` on rendered pp.9–11. | The official imprint is `[出版地不明 : 出版者不明]`. The exact `光緒十二年歲次丙戌孟秋之月楚南余春台序` phrase was not observed in the bounded opening-page inspection (pp.2–3). Even if later found, a preface date would not alone date the current copy. |
| E | The audit stores the requested source categories, six gates, and four independence axes as separate machine-readable fields. | The overall “all units resolved” claim remains unsupported; promotion and activation remain blocked. |

## Byte identities

The parent-observed scan identities are frozen in `artifacts/saju-gemini-witness-dossier-adjudication-v2/complete.json`:

- Jangseogak K3-437 PDF: 134 pages, SHA-256 `335a1c03c7af246969e00667d6a4d9756b19c19d93539223bb871c47001a24cd`.
- NLC 114503.0 derivative PDF: 114 pages, SHA-256 `6519fbdc0fa25272bf6aae0fdac8c73107c0f6b852a1b0beebc655344ec2812d`.
- NCL 06599 derivative PDF: 103 pages, SHA-256 `8d6a42e1a6aa5675f978256349c9fcc145550a1c29c3947c425d3f611bfb27a3`.
- Waseda `bunko19_f0111` PDF: 108 pages, SHA-256 `123ce84b44bd20ecfdd6538bffc413a5e3948598315cd99f857a5c985c7257ae`.

OCR and transmitted web text remain locator-only. No scan payload is copied into the artifact; only source identities, hashes, bounded locators, and observations are recorded.

## Readiness boundary

`promotionReadyClaimIds=[]`, `stableClaimPromotionCount=0`, `availableForInterpretation=false`, `semanticAuthority=not_established`, `implementationSafeGrounding=not_established`, and `productionActivation=blocked`.

The generated artifact is materialized by `scripts/materialize-saju-gemini-witness-dossier-adjudication-v2.mjs` and checked by `scripts/check-saju-gemini-witness-dossier-adjudication-v2.mjs`.
