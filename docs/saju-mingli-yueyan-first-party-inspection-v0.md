# 《命理約言》 first-party institutional inspection v0

## Result

The National Library of China (NLC) first-party item identity is confirmed, but the actual target page is not accessible in the current external session. Therefore no new direct P0 timing observation is admitted and no readiness or production state changes.

The official record is [精选命理约言](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=17jh002578), `data_416 / 17jh002578 / 109774.0`. Directly recorded fields are `(清)陈素庵原著`, `民国二十四年[1935]`, `韦氏命苑[发行者]`, `1册`, and `命书`. The official cover image is separately recorded and visibly reads `精選命理約言`.

This closes item identity and recorded bibliography only. `民国二十四年[1935]` is not promoted to a physical production date, edition genealogy, or textual authority.

## Target-page access and exact scope

The official reader exposes the item and the recorded PDF path, but its `permissionNew` response for the current session is `success=false` with `对不起，您没有访问权限。。`. The recorded direct PDF endpoint returns HTTP 404. No authorized first-party target-page bytes were obtained.

Consequently, the exact 〈起運法〉 target page, printed folio, surrounding text, and target-page locator remain unresolved. The following seven fields remain unresolved rather than negative:

| Field | Direct first-party observation | Status |
|---|---|---|
| 起運法 | none | access blocked |
| 順逆 | none | access blocked |
| 節選択 | none | access blocked |
| 三日一歲 | none | access blocked |
| 一日四月 | none | access blocked |
| 一時辰十日 | none | access blocked |
| worked example | none | access blocked |

## Mirror locator boundary

The Commons PDF that claims the same NLC identifier was visually reviewed only as a locator lead. Its PDF p.34 / printed folio `一七` shows `看運法一` and candidate direction text; p.35 / printed folio `一八` shows `看運法二` and initial/middle/late-cycle text. These pages are retained as `MIRROR_DERIVED_LOCATOR_ONLY`.

They are not a first-party physical witness, not independent corroboration, and not proof that `看運法` is the requested `〈起運法〉` section. No requested numeric unit, named 節 selection, or worked example is promoted from the mirror. The access failure is not a whole-volume negative.

## Reconciliation and readiness

- Gemini v7 remains `untrusted_candidate_only`; stale parent-rejected claims are not reintroduced.
- The parent claim `claim.E.mingli-yueyan-direct-observation` remains `unresolved` before and after this inspection.
- Existing 《淵海子平》, 《三命通會》, 《神峰通考》, and 《五行精紀》 evidence is unchanged. Existing parent ANU timing observations remain the authoritative baseline; this artifact adds no semantic equivalence edge.
- Physical-item, digital-derivation, edition/textual-lineage, and semantic-corroboration are separate and all remain unresolved for this candidate.
- Canonical transmission edges added: `0`.
- Stable claim promotion: `0`; `availableForInterpretation=false`; semantic authority `not_established`; production activation `blocked`.
- Typed H/E/L/S/I/P gate counts are byte-preserved before and after; no gate is promoted.

## Next P0 acquisition requirement

Use an authorized NLC reader session, institutional workstation/login, or institution-provided PDF/IIIF/page-image export for `data_416 / 17jh002578 / 109774.0`. The acquisition must include the exact 〈起運法〉 leaf, printed folio, page image bytes, and the surrounding leaves needed to read heading and paragraph context. Edition/physical provenance chronology and textual lineage must be acquired separately; catalog date, cover, mirror, e-text, and textual similarity do not satisfy those gates.

## Artifacts and validation

- Artifact: `artifacts/saju-mingli-yueyan-first-party-inspection-v0/complete.json`
- Integrity sidecar: `artifacts/saju-mingli-yueyan-first-party-inspection-v0/complete.json.integrity.json`
- Materializer: `scripts/materialize-saju-mingli-yueyan-first-party-inspection-v0.mjs`
- Checker: `scripts/check-saju-mingli-yueyan-first-party-inspection-v0.mjs`
- Negative checker: `scripts/check-saju-mingli-yueyan-first-party-inspection-negative-v0.mjs`
- Focused test: `test/sajuMingliYueyanFirstPartyInspection.test.js`

The artifact and integrity sidecar are additive. No staging, commit, push, deploy, or remote database operation was performed.
