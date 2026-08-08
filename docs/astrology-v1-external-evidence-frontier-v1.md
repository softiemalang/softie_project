# Astrology v1 external evidence frontier v1

Access date for the public sources below: 2026-08-09 (Asia/Seoul). This is a
research ledger, not an authority or activation decision. `direct_observation`,
`inherited_evidence`, `independent_corroboration`, `inference`, and
`unresolved` remain separate.

## Local corpus audit

| Domain | Local source identity | Observation and admission result |
|---|---|---|
| Saju | `三命通會.pdf`, SHA-256 `f09bce7c6dbe1e222746ad8c97f49d132ed4e8da6d3c1d0399b0824b3794593f`, 370 pages; `淵海子平.pdf`, SHA-256 `c6225b78d9d49282c5699b63315018a1e17ebf091c50ce4feb3dab465ec25a12`, 202 pages; `滴天髓.pdf`, SHA-256 `6285805c91b79f1b5bccdfce1cdab1d7ec684731160b4191a25e8f1d23c229dd`, 158 pages; `穷通宝鉴.pdf`, SHA-256 `36d54cdc995d203fdceafcb52b2a0d4f57093ab1765c532db5418b46a96c4b19`, 92 pages | Scan-first visual review confirms source files exist, but the current 43-claim/126-occurrence ledger still lacks verified book/chapter/page locators and claim-specific semantic review. No Saju canonical claim was promoted. |
| Saju | `子平真诠-沈孝瞻原著.pdf`, SHA-256 `449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692`, 27 pages | Locally available text source; edition and page-level claim linkage are not sufficient for direct admission in the current contract. |
| Ziwei | `命-南北山人_紫微斗数全书.pdf`, SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`, 219 pages; `新锓希夷陈先生紫微斗数全书.七卷.宋.陈抟撰.明.潘希尹补.明代南阳堂刊本.黑白版.pdf`, SHA-256 `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc`, 528 pages | Direct visual recheck of Nanbei pp. 21, 23-24 confirms legible four-transform heading and life/body-ruler text already recorded as direct observations. Nanyang pp. 151-152 remain ink-bleed/crop ambiguous for the 乙-癸 cells; no blocked cell was promoted. |
| Saju/Ziwei | `子平真诠`/`三命通會`/`命-南北山人...` corpus review | PDF text extraction was not treated as canonical; rendered page review was used for source legibility. OCR/search text remains exploration-only. |

## Public source research and admission

### Saju

| Source | Exact locator/context | Admission |
|---|---|---|
| [三命通會 scan record](https://commons.wikimedia.org/wiki/File:NLC416-13jh000624-42998_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf) | Wikimedia Commons record identifies a 345-page 1926 秦慎安校勘 scan from the National Library of China, published by 文明書局; the relevant page image was not acquired in this run. | `independent_corroboration/source_identity_only`; no claim locator or edition-byte linkage admitted. |
| [三命通會 catalog record](https://ndlsearch.ndl.go.jp/books/R100000136-I1970586434938919073) | National Diet Library metadata identifies `三命通會 12巻`, [明]育吾山人著, 同人堂, with a 1735 preface. | Catalog corroboration only; it does not bind the local PDF or a canonical claim occurrence. |
| [三命通會 text mirror](https://www.shidianguji.com/zh/book/SK1610/chapter/1kf5v6ol1yasl) | Public text page exposes the section `論支元六合`; related text pages expose `論人元司事`. | Transcription/search lead only. It is not a scan witness or claim-specific edition proof. |

The public scan and text mirror make the Saju search frontier more concrete,
but they do not close edition identity plus claim-specific locator,
transcription, and semantic verification for the 43 canonical claims. The
ledger therefore remains `source_candidate_locator_needed` /
`source_present_semantic_review_needed` as applicable; no readiness change.

### Ziwei

| Source | Exact locator/context | Admission |
|---|---|---|
| [Japanese National Archives digital record F1000000000000101426](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html) | Record identifies `新鋟希夷陳先生紫微斗數全書`, 明刊本, seven volumes/two books, with catalog rights metadata marked CC0; the associated image viewer was not readable from this environment (403 / 館内限定閲覧). | Source identity and rights metadata only. The p. 151 four-transform cells remain unresolved because the raw image could not be independently reviewed. |
| [Shuge source record](https://www.shuge.org/view/zi_wei_dou_shu_quan_shu/comment-page-1/) | Record labels the work `明代南陽堂刊本` and lists the seven-volume contents, including the volume containing the placement rules. | Bibliographic corroboration only; not a page-image witness. |
| [Ziwei text mirror](https://www.shidianguji.com/zh/book/SDZJ0170/chapter/1jvzooy7dkbhh) | Public transcription includes the `安身命例` passage describing 寅起生月、逆安命、順安身 and the intercalary-month note. | Independent text corroboration/search lead; no admission of a semantic source rule without page/edition image review. |

The official catalog reduces source-identity uncertainty but does not make the
unreadable p. 151 cells direct evidence. Tianfu's raw-formula contradiction,
rotation-06 semantic identity, and the remaining life/body/source-legibility
boundaries remain blocked; no Ziwei readiness promotion.

### Western True Node

| Source | Exact locator/context | Admission |
|---|---|---|
| [Swiss Ephemeris: Lunar and Planetary Nodes and Apsides](https://www.astro.com/swisseph-download/doc/swisseph.pdf) | Section 3, pp. 18-19: traditional true lunar node is described as the osculating node of the momentary lunar orbit, with ecliptic/nutation distinctions and a JPL-derived comparison discussion. | Definition corroboration, not an independent raw oracle because the local comparison reference is Swiss. |
| [Swiss Ephemeris Programmer's Manual](https://www.astro.com/swisseph/swephprg.pdf) | Flag table pp. 15-17 documents `SEFLG_NONUT=64` as no nutation / mean equinox of date; the body table identifies `SE_TRUE_NODE=11`. | Convention metadata admitted to the research diagnostic only. |
| [NASA/JPL Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html) | Section 2 documents instantaneous osculating elements, JDTDB epochs, and `OM` as longitude of ascending node. | Independent oracle lead only; no raw Horizons result was acquired because the available transport path was certificate-blocked and the browser tool rejected the complex API query. |

The successor artifact `artifacts/astrology-true-node-frame-diagnostic-v1/complete.json`
compares the inherited JPL state-derived candidate with Swiss flags
`2 | 64 | 256 = 322`, matching the candidate's mean-equinox/no-nutation frame.
The prior default comparison reached 18.635712528976 arcsec maximum; the
frame-matched diagnostic reaches 1.8031521231023362 arcsec maximum. This is a
bounded convention inference, not a semantic-identity or tolerance pass.
The preserved v0 artifact is not rewritten. `independentTrueNodeReference`
remains `pending`, production remains unsupported, and activation remains
false.

## Whole-state admission decision

| Domain | Evidence gain | Readiness result | Remaining dependency |
|---|---|---|---|
| Saju | Public scan/catalog/text candidates identified; no claim-level local or external locator admitted | Unchanged partial/blocked | Edition-linked page images or a source witness with exact book/chapter/page/folio, transcription review, and semantic claim adjudication; separate human/product policy for modern coefficients |
| Ziwei | Official catalog identity/rights metadata and text-mirror corroboration added; direct visual recheck preserves the unresolved cells | Unchanged partial/blocked | Legible high-resolution page images for Nanyang p. 151-152 or an independently reviewable witness; human adjudication of conflicting Tianfu convention and source authority |
| Western | Official definition/convention documentation and a reproducible frame diagnostic added | `independentTrueNodeReference: pending`; no production/readiness promotion | Independent raw True Node oracle or JPL Horizons corpus with exact convention/time-scale equivalence, source/version/license evidence, and human/product activation approval |

Further generic search without the blocked scan images, raw oracle output, or
edition-linked claim locators would repeat catalog/text corroboration rather
than increase admission strength. The frontier is therefore advanced but not
authorized for verified/readiness/activation promotion.
