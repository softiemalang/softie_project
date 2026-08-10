# Ziwei P0 claim-source identity frontier v1

## 결론

판정은 `complete_ziwei_p0_claim_source_identity_frontier_exhausted_uncommitted`이다. 이는 자미두수 claim/source identity에 대해 현재 공개적으로 자동 조사 가능한 frontier를 소진했다는 뜻이며, claim의 semantic authority·readiness·interpretation·production activation을 승인했다는 뜻이 아니다.

기준 checkout은 `main`, `HEAD`와 `origin/main`은 모두 `823a6a17dbdd4eee22685f053c6cffa3e79baefd`이다. 기존 artifact와 readiness는 수정하지 않았고, `-.jpg`는 보존했다. 원본 PDF/JPEG는 실제 byte hash와 외부 locator만 기록했으며 Git에 편입하지 않았다.

결정론적 companion bundle은 7개 research unit(조사 → source identity → direct observation → lineage/independence → claim relation → checker/test → impact)과 다음 수치를 고정한다.

- claim 30건: 명궁/신궁·12궁 3, 14주성 14, Tianfu convention/placement/rotation-06 3, 보조성 2, 四化 aggregate/labels 5, 命主·身主 2, calendar/time input 1
- source identity row 13건: Nanbei/Nanyangtang local PDF, NARA record 및 두 IIIF item, Toyo/AKS manuscript candidate 및 catalog rows, 공개 text/catalog locator
- 실제 page/leaf 직접 관찰 row 26건, claim-source relation 116건, blocker 11건
- stable claim 0건, semantic authority 0건, interpretation-eligible 0건, production activation 0건

전체 행은 [`claim-source-matrix.json`](../artifacts/ziwei-p0-claim-source-identity-frontier-v1/claim-source-matrix.json), [`source-lineage-inventory.json`](../artifacts/ziwei-p0-claim-source-identity-frontier-v1/source-lineage-inventory.json), [`observations.json`](../artifacts/ziwei-p0-claim-source-identity-frontier-v1/observations.json), [`relations.json`](../artifacts/ziwei-p0-claim-source-identity-frontier-v1/relations.json), [`blockers.json`](../artifacts/ziwei-p0-claim-source-identity-frontier-v1/blockers.json)에 있다.

## source / edition / lineage

### NARA·Nanyangtang 계열

공식 [NARA catalog record F1000000000000101426](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html)은 `新鋟希夷陳先生紫微斗数全書`, 내각문고 `子060-0001`, 진박(송) 선/반희윤(명) 보정, 2 volume, 명간, 7권으로 catalog identity를 제공한다. 두 IIIF item은 record 4468520(129 canvases)과 4469314(137 canvases)이며, 같은 catalog record의 volume pair이므로 independent witness로 세지 않았다.

직접 관찰한 NARA leaf는 4468520의 84–86(五行局/branch/day grids), 87–88(安天府圖 및 祿·科·權·忌 surface), 89–92(rule/example)와 4469314의 64–80(repeated chart examples)이다. 이들은 branch/day/bureau, Tianfu, 四化, chart surface를 보여주지만, 12개 궁명·branch glyph·물리 slot·ordinal·base direction·production enum을 한 번에 묶는 완전한 semantic diagram은 제공하지 않았다.

528-page Nanyangtang PDF는 실제 byte hash `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc`를 가진 local derivative이다. NARA metadata를 가리키지만, 그 derivative가 어느 item/leaf의 동일 scan인지 byte-level lineage를 닫지 못했으므로 NARA와 같은 lineage candidate이며 independent로 세지 않았다. 219-page Nanbei PDF의 hash는 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`이고, p.4/p.7/p.8/p.11–13의 diagram/traversal/star-table surface만 bounded observation으로 남겼다.

### Toyo Bunko·AKS candidate

공식 [Toyo Bunko catalog result](https://www.toyo-bunko.org/open/KansekiAllQueryResult.php?ORDERBY1=&UNIT=20&andor=1&bKanjiSeiki=&iPage=4048&iTotal=86958&navizonestart=405&searchtype=keyword&sw1=)와 [한국학중앙연구원/AKS viewer](http://kostma.korea.ac.kr/viewer/viewerDes?uci=RIKS%2BCRMA%2BKSM-WZ.0000.0000-20140423.TOYO_1646)의 `TOYO_1646`는 `新刊希夷陳先生紫微斗數全集`, `VII-3-157`, 1책/100장 필사본 catalog/image route를 제공한다. NARA의 명간 2 volume record와 물리적으로 다른 witness candidate로 분리했다.

viewer의 실제 JPEG를 read-only로 관찰하고 image file number와 SHA-256을 기록했다. 직접 관찰한 0001, 0003–0008, 0014–0018, 0085, 0088, 0100에는 다음 surface가 있다.

- 0001/0003: 표지·소장처·holding mark
- 0004/0008: 주성·보조성 vocabulary와 安天府 관련 surface
- 0005/0006: branch/day 및 水二局·金四局·木三局·土五局·火六局 grid surface
- 0007: 身命, 寅起正月, 命逆, 身順 및 12-cell relation surface
- 0015–0017/0085/0088/0100: 命宮·十二宮 및 `命之` chart examples
- 0018: 化祿·化權·化科·化忌 vocabulary/table surface

이 candidate는 판본 연대·colophon·textual lineage·semantic authority·image reuse permission을 닫지 못했다. 그러므로 `independent_physical_witness_candidate_not_admitted_as_independent_oracle`로만 기록했다. 공개 viewer 접근은 reuse permission과 동일하지 않으므로 이미지는 `/private/tmp` 밖으로 복제하지 않았고 repository에도 저장하지 않았다.

## claim relation boundary

14주성은 local numeric comparison과 source/chart surface가 존재하지만, 각 star의 original-text placement rule, exact edition, leaf/folio, semantic coordinate frame을 모두 닫은 source witness는 없다. 보조성도 좌보·우필 등 vocabulary/table surface까지이며 full rule witness가 아니다.

Tianfu는 legacy `(10-Z)%12`와 source-aligned `(4-Z)%12` convention을 함께 보존한다. `rotation-06`의 150/150 numeric relation은 deterministic representation relation일 뿐 semantic/source authority가 아니다. 命宮/身宮은 traversal 문구와 선택 table을 직접 관찰했지만 궁명·branch·production ordinal의 완전한 identity map은 없다. 四化는 label 및 일부 table surface까지 확인했지만 10 stem × 4 전체 표의 source identity/leaf/authority는 미해결이다.

OCR·전사는 locator-only이다. title match, same scan/mirror, same catalog record, visual correspondence, numeric agreement는 independent witness 또는 semantic authority로 승격하지 않는다. 기존 `stableClaimCount=0`, readiness `not_safe_to_start`, grounding `blocked`를 유지한다.

## frontier와 사람의 다음 자료

NARA official record/IIIF, local Nanbei/Nanyangtang, Toyo/AKS, CText, Google Books, Shidian/Wikisource, NDL, Taiwan digital archive의 공개 metadata/text/image route를 조사했다. 현재 공개 경계에서 새로 전진한 것은 Toyo physical witness candidate이며, 그 이상은 다음 외부 자료 없이는 닫히지 않는다.

1. 기관이 제공하거나 reuse 권리를 명시한 원본 scan, edition/date/volume/folio/colophon과 복제 허가.
2. 12개 궁명·branch glyph·physical slot·ordinal·base direction·production coordinate를 하나의 완전한 readable diagram/table로 연결하는 leaf.
3. legacy/source-aligned Tianfu를 판정하는 source-identified anchor/direction rule과 독립 판본.
4. 14주성 placement, 보조성, 10 stem × 4 四化의 source-identified full tables.
5. 독립 oracle의 implementation/version/settings/retrieval identity와 calendar/time input source.

## 검증 계약

- `scripts/materialize-ziwei-p0-claim-source-identity-frontier-v1.mjs`: source/observation/relation/blocker companion materializer; timestamp/network/acquisition 금지
- `scripts/check-ziwei-p0-claim-source-identity-frontier-v1.mjs`: artifact identity, HEAD/origin, claim coverage, lineage/independence, direct-vs-catalog, unresolved boundary, protected changes, integrity sidecar 검증
- `scripts/check-ziwei-p0-claim-source-identity-frontier-negative-v1.mjs`: stable claim, claim/source identity, locator/provenance, same-record independent, OCR canonical, rotation semantic, Git image, unsupported claim removal, blocker removal, readiness promotion mutation을 모두 거부
- `test/ziweiP0ClaimSourceIdentityFrontier.test.js`: determinism, coverage, readiness boundary, negative mutation

materialization artifact 자체는 stage/commit/push/deploy/remote DB/production activation을 기록하거나 수행하지 않으며, publication audit은 이 frontier artifact의 생성 계약과 별도로 수행한다.
