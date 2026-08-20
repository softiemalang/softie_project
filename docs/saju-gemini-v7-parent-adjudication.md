# Gemini v7 parent adjudication

상태: `completed_bounded`

Gemini v7 전체는 `untrusted_candidate_only`로 취급했다. 이 문서는 Luna v1–v6 parent adjudication과 기존 typed-readiness artifact를 기준으로, v7 후보를 source/claim 단위로 다시 확인한 결과다. 후보 packet 자체는 현재 checkout에서 읽을 수 있는 파일로 제공되지 않았으므로, packet의 결론을 canonical payload로 import하지 않았다.

## 결론 요약

v7 overlay는 38 claims를 보유한다.

| 상태 | 수 | 의미 |
| --- | ---: | --- |
| `kept` | 10 | 직접 확인된 bounded observation 또는 metadata field |
| `corrected` | 5 | observation은 남기되 v7 해석/범위를 축소 |
| `rejected` | 16 | parent 기준으로 canonical scope에서 거부 |
| `unresolved` | 7 | 필요한 first-party page, dating, lineage 또는 authority 부재 |

`availableForInterpretation=false`, `productionActivation=blocked`, `semanticAuthority=not_established`, `stableClaimPromotionCount=0`이다. v7은 canonical procedure, source authority, interpretation readiness를 변경하지 않는다.

## Claims kept / corrected / rejected / unresolved

### Kept

- `claim.A.yuanhai-乙丑男-chain`
- `claim.A.yuanhai-甲子女-chain`
- `claim.A.shenfeng-page-order-and-wording`
- `claim.B.anu-206524-item-identity`
- `claim.B.anu-12juan-metadata`
- `claim.B.anu-current-original-v1-v12`
- `claim.B.anu-xudishan-collection-relation`
- `claim.C.gengcun-seal-provenance-candidate`
- `claim.D.waseda-direct-record`
- `claim.D.waseda-seasonal-pages`

### Corrected

- `claim.A.sanming-rule-family`
- `claim.A.sanming-literal-one-day-four-month`
- `claim.C.gengcun-seal-owner-equals-dating`
- `claim.D.full-genealogy-directly-supported`
- `claim.F.hukun-1776-secondary-reading`

### Rejected

- `claim.A.shenfeng-standard-fixture`
- `claim.A.same-worked-example-independent-corroboration`
- `claim.A.wuxingjingji-same-procedure-auto-merge`
- `claim.B.anu-42211-item-identity`
- `claim.B.anu-catalog-extent-to-public-count`
- `claim.C.gengcun-TAQ-1843`
- `claim.C.gengcun-TPQ-1578`
- `claim.C.gengcun-qin-enfu-dating`
- `claim.C.gengcun-content-parallel-dating`
- `claim.D.waseda-cover-to-physical-date`
- `claim.D.digital-physical-map-as-transmission`
- `claim.E.gengcun-seasonal-block`
- `claim.E.ctext-e-text-as-historical-witness`
- `claim.E.preface-cover-as-physical-edition-date`
- `claim.F.hukun-1773`
- `claim.F.gemini-v7-wholesale-resolution`

### Unresolved

- `claim.A.sanming-literal-time-unit-ten-day`
- `claim.C.gengcun-dating-gate`
- `claim.E.mingli-yueyan-direct-observation`
- `claim.F.1895-baohui-first-party-item`
- `claim.F.1923-yuxin-first-party-item`
- `claim.F.hukun-1776-first-party`
- `claim.F.actual-target-pages`

## Unit A — 大運 exact source/variant map

### 《淵海子平》

Parent-verified NLC 99036 scan p.50–51 retains the two source-bounded chains:

| Example | Observed chain | Scope |
| --- | --- | --- |
| 乙丑男命 | `十五日 → 五三十五 → 五歲 → 逆行丁丑` | `manual_visual_locator_only`; printed-folio and edition crosswalk unresolved |
| 甲子女命 | `得九日 → 三三單九 → 三歲 → 逆行乙丑` | literal variant retained; no arithmetic normalization into another printed string |

The page context retains the `餘皆倣此` observation. These are not promoted to a universal calculation fixture.

### 《神峰通考》

The actual bounded scan page is p.22, with surrounding p.20–24 checked. The page layout records:

- volume/folio: `神峰通考 卷四`, folio mark `二〇`;
- headings: `月令詳辨`, `起大運法陽男陰女`, `起大運法陰男陽女`, `子平舉要`;
- example order: a preceding `甲子陽男` forward example, then target `乙丑男`, then target `甲子女`;
- target variants: `五三十五`, `三三單九`, `餘皆倣此`;
- surrounding setup: `甲己之年丙作首`, `乙庚之歲戊為頭`, and `正月建丙寅 / 戊寅` material.

This establishes occurrence, order, visible wording variants, headings, and surrounding paragraph/layout only. The v7 “standard fixture” interpretation and same-case independent corroboration are rejected. Same worked example is a dependence/lineage candidate, not an independent oracle.

### 《三命通會》

The ANU V2 direct scan inspection covers p.57–60, with the `論大運` section on p.58–59. The following remain separate observations:

- direct: `順逆` direction family;
- direct: preceding/next `節` selection language;
- direct: `三日為一歲` relation family;
- direct: worked example presence;
- derived only: `一日四月` as a restatement of the three-days/one-year relation;
- not admitted: exact literal `一日四月` from this inspection;
- not admitted: exact literal `一時辰十日`, modern first-start timestamp, rounding, or production procedure.

### 《五行精紀》

The v4/v5 parent baseline is preserved. It is not automatically merged with the three witnesses above merely because a similar timing procedure is suspected.

## Unit B — ANU metadata regression

The parent baseline remains byte-preserved: Handle `1885/206524`, directly verified public PDF files `b22343921_v.1.pdf`–`b22343921_v.5.pdf`, and a catalog extent listing twelve juan without then admitting public v6–v12.

The current first-party ANU item record confirms the same item identity, `12 v.` metadata, `Xu Dishan` relation, and the 2020 digitisation statement. The current ORIGINAL-bundle API separately enumerates 12 PDF and 12 TIFF bitstreams, v1–v12; bounded HEAD checks for v6–v12 returned HTTP 200. This is a current API/file-list observation, not an inference from the catalog extent. The official item is the [ANU Open Research Repository record](https://openresearch-repository.anu.edu.au/items/e0d2d017-f99d-4818-af29-d18754f7e5cd), and the current file enumeration is exposed by its [ORIGINAL bundle API](https://openresearch-repository.anu.edu.au/server/api/core/bundles/c11f2f3d-396b-43b1-b5b1-d2ce29a3f047/bitstreams?size=100).

Disposition:

- `1885/42211`: rejected as current item identity; the first-party handle probe returned 404.
- `1885/206524`: kept as the current item identity.
- `12 juan`: kept as catalog metadata only.
- current public v1–v12 file enumeration: kept as a separate first-party API observation.
- printed volume/content mapping and page inspection for v6–v12: unresolved.
- `Xu Dishan` / collection relation: kept as metadata only, not physical provenance or textual genealogy.

The negative rule `catalog extent 12 → public 12 volumes` remains enforced even though the current file-list API independently supplies a v1–v12 enumeration.

## Unit C — 《耕寸集》 dating regression

`石研齋／秦氏印` remains a catalog/provenance candidate only. Seal attribution is not seal application date, and seal application date is not manuscript production date.

- TAQ 1843: rejected.
- TPQ 1578: rejected and marked as cross-text contamination risk.
- 秦恩復 lifespan: rejected as a manuscript/seal dating proof.
- content parallel: rejected as a canonical dating proof.
- dating gate: unresolved.

No new actual source/title citation or authoritative provenance chronology was obtained. The next date decision requires authorized target folios or an authoritative provenance chronology.

## Unit D — decontaminated lineage edges

Each edge is claim-typed. None is included in the canonical graph.

| Edge | Status | Canonical graph | Reason |
| --- | --- | --- | --- |
| 欄江網 → 造化元鑰 | `BIBLIOGRAPHIC_CLAIM_ONLY` | no | metadata/genealogy lead, not a direct transmission page |
| 欄江網 → 耕寸集 | `UNSUPPORTED` | no | no direct source/title or item-level transmission record |
| 耕寸集 → 子平真詮 | `HYPOTHESIS` | no | content/title association lacks a dated transmission witness |
| 1776 manuscript → 1895 edition | `HYPOTHESIS` | no | secondary preface reading plus unresolved edition candidate |
| 1776 manuscript → 1923 edition | `HYPOTHESIS` | no | secondary preface reading plus unresolved edition candidate |
| 造化元鑰 → 窮通寶鑑 | `BIBLIOGRAPHIC_CLAIM_ONLY` | no | later/editorial genealogy is not direct copy evidence |
| 窮通寶鑑 → 徐樂吾系 | `BIBLIOGRAPHIC_CLAIM_ONLY` | no | attribution/genealogy statement is not a direct transmission proof |

No arrow is promoted from title similarity, editor statement, later preface, secondary genealogy, or a digital/physical relationship map. `canonicalEdges=[]`.

## Unit E — Waseda and 《命理約言》

The official [Waseda bunko19_f0111 record](https://www.wul.waseda.ac.jp/kotenseki/html/bunko19/bunko19_f0111/index.html) and bounded scan observations retain:

- `新鐫命理秘訣`;
- `集賢堂`;
- `余星堂鑑定` / `余春台輯` / `曾寄廛校閲` wording;
- `正月甲木`, `二月甲木`, `三月甲木` pages.

They do not establish 光緒原刊, full genealogy, copy date, or physical edition date. Cover, plate-heart, catalog, and page observations stay separate.

`《命理約言》` remains `P0_acquisition_lead_only`. The related public mirror of `《精選命理約言》` is not the required first-party institutional item plus actual target page. Therefore no new observation is admitted for `起運法`, `三日一歲`, `一日四月`, or `一時辰十日`.

## Unit F — 《子平真詮》 1895 / 1923

- `1895 報暉草堂`: unresolved; no first-party item/page/date identity admitted.
- `1923 育新書局`: unresolved; no first-party item/page/date identity admitted.
- `胡焜序 1773`: rejected.
- `胡焜序 1776`: retained only as a corrected secondary/e-text reading; not a first-party original-page date and not a physical edition date.

The original preface page and target edition pages were not admitted. Therefore no edition genealogy, 用神, 相神, or 行運 claim is promoted.

## Typed reconciliation and promotion

The authoritative 13-claim typed-readiness baseline is unchanged. Counts are shown as `satisfied / conflicted / unresolved`:

| Gate | Before | After | Change |
| --- | --- | --- | --- |
| H | `13 / 0 / 0` | `13 / 0 / 0` | none |
| E | `12 / 0 / 1` | `12 / 0 / 1` | none |
| L | `1 / 0 / 12` | `1 / 0 / 12` | none |
| S | `11 / 1 / 1` | `11 / 1 / 1` | none |
| I | `0 / 0 / 13` | `0 / 0 / 13` | none |
| P | `0 / 1 / 12` | `0 / 1 / 12` | none |

Independence is represented separately as `physical-item`, `digital-derivation`, `edition/textual-lineage`, and `semantic-corroboration`. No axis is counted as independent. `L/I/P` and promotion do not change because their required gates are not closed.

## Negative checks

The checker rejects all ten required unsafe transitions:

1. Gemini v7 wholesale import;
2. catalog extent 12 → public 12-volume transition;
3. same worked case → independent lineage;
4. text abbreviation → independence;
5. seal owner lifespan → manuscript TAQ;
6. metadata → transmission genealogy;
7. cover/preface → physical edition date;
8. ctext/e-text → historical physical witness;
9. hypothesis edge → canonical graph;
10. historical rule → production authority.

## Real blockers and next P0 acquisition

- Obtain authorized 《耕寸集》 target folios containing an actual source/title citation or an authoritative provenance chronology.
- Download and hash-check ANU v6–v12, then inspect the required pages and establish a printed-volume/folio crosswalk; API availability alone is not page evidence.
- Obtain a first-party institutional item and actual target page for 《命理約言》 before testing any timing wording.
- Obtain first-party item/page evidence for the 1895 and 1923 《子平真詮》 candidates and the original 胡焜序 page.
- Close the four independence axes and direct transmission edges separately; do not use same-case agreement, metadata, or later genealogy as substitutes.

These blockers are evidence/authority blockers, not a readiness failure of the bounded artifact. No production activation or interpretation availability is authorized by this audit.

## Artifact and validation

Materialized files:

- `artifacts/saju-gemini-v7-parent-adjudication/complete.json`
- `artifacts/saju-gemini-v7-parent-adjudication/complete.json.integrity.json`

Artifact identity:

- schema: `saju-gemini-v7-parent-adjudication`
- version: `7.0.0`
- basis HEAD: `99e6cc624a1510487ad8bcf65347b3ee5f4e524e`
- content payload SHA-256: `719f23c4883ecedcb1e113a4a257c455ee5a158c5f28c289a1e647c003bd275a`
- complete.json byte SHA-256: `76add867e33c35286788a5e899a3ee66f626959f657ef6fe11ab0f4dc61e8d0d`

Checks run:

- `node --check` for the v7 module, materializer, checker, negative checker, and test: pass.
- `npm run test:saju:gemini-v7-parent`: pass, 5/5 tests.
- `npm run materialize:saju:gemini-v7-parent`: pass.
- `npm run check:saju:gemini-v7-parent`: pass; replay, artifact identity, payload hash, and integrity sidecar pass.
- `npm run check:saju:gemini-v7-parent:negative`: pass; 10/10 unsafe mutations rejected.
- `npm test`: fail at repository level, 802 tests total / 762 pass / 38 fail / 2 skipped; the failures are existing source-fixture availability failures (`PDF_SOURCE_NANBEI_PATH`, `PDF_SOURCE_NANYANGTANG_PATH`, and `TOYO_IMAGE_MISSING`), with no v7 test failure.
- `npm run build`: pass (`vite build`, 156 modules transformed).
- `git diff --check`: pass; task files contain no trailing whitespace.

No staging, commit, push, deploy, or remote database operation is part of this artifact.
