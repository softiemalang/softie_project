# Ziwei palace semantic/source-authority frontier v1

이 additive packet은 두 허용 로컬 PDF의 actual bytes와 page metadata를 다시 확인하고, 원본 page를 110 dpi로 저장소 밖에서 렌더링해 직접 시각 검토한 결과를 materialize한다. OCR/text extraction은 사용하지 않았고, PNG는 Git에 저장하지 않는다.

## 닫힌 범위

- `命-南北山人_紫微斗数全书.pdf`: 219 pages, unencrypted, SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`. p1 title surface, p4 branch/trigram diagram, p7 十二宮冠蓋 12-cell branch diagram, p8 命宮·身宮 traversal, p10 命宮·身宮·五行局 table을 직접 검토했다.
- `新锓希夷陈先生紫微斗数全书…明代南阳堂刊本…pdf`: 528 pages, unencrypted, SHA-256 `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc`. p1/p2의 title/editor/print surface를 직접 검토했다.
- 따라서 source file identity와 visible title/print identity는 `direct_within_scope`로 전진한다. 이것은 edition lineage나 textual authority를 확정하지 않는다.

## 남은 semantic 경계

Nanbei p4/p7은 지지와 도식 칸을 보여주지만 12궁명 전체를 각 칸에 배치하지 않는다. p8은 寅 기점과 명궁 역수·신궁 순수의 branch traversal을 보여주지만, 이를 production의 palace enum/ordinal 의미와 연결하는 shared mapping은 제공하지 않는다. p10도 命宮·身宮 지지와 五行局 표를 보여주지만 궁명↔지지↔ordinal 전체 correspondence는 제공하지 않는다.

그러므로 다음은 모두 별도 claim으로 유지한다.

- `scan_witness_identity`: `direct_within_scope`
- `branch_diagram_observation`, `ming_shen_traversal_observation`: `direct_within_scope`
- `palace_semantic_identity`: `blocked_semantic_identity_insufficient`
- `cross_edition_semantic_identity`: `blocked_cross_edition_identity_unresolved`
- `production_source_authority`: `blocked_source_authority_not_established`

기존 palace-coordinate, life/body ruler, readiness coverage artifact는 predecessor input으로 actual-byte hash만 기록했으며 overwrite하지 않았다. 숫자 일치, `rotation-06`, branch 순환 일치, source presence, 표지 identity는 semantic authority로 승격하지 않는다. stable claim은 `0`, readiness는 `not_safe_to_start`, grounding은 `blocked`, activation은 `experimental`로 보존한다.

Materializer: `scripts/materialize-ziwei-palace-semantic-source-frontier-v1.mjs`

Checker: `scripts/check-ziwei-palace-semantic-source-frontier-v1.mjs`

Negative checker: `scripts/check-ziwei-palace-semantic-source-frontier-v1-negative.mjs`

## Historical `materialized_content` drift audit (2026-08-09)

기존 artifact는 재생성하거나 덮어쓰지 않고, 별도 임시 경로에서 현재 materializer를 두 번 실행해 비교했다.

- palace-coordinate historical artifact의 기존 byte SHA-256은 `4f9a62f5f14086fa8a34f650a9167036df45bcb9586ade8b888feac353260d9b`로 보존했다. 현재 checkout 재물질화는 두 번 모두 `ef3c8dd8d2c2f58f093e0140719cdaaa13b683ab94ca903ad1e6352e57ef13a0`였다.
- twelve-major-star historical artifact의 기존 byte SHA-256은 `bf3e6149eda8bd41e998cfb8abe32988af140cf349ef1f1c10868bf444dd473e`로 보존했다. 현재 checkout 재물질화는 두 번 모두 `d6c81d29e27796eb352e318d2da3a10b21962da99e1006db571fdcc4bcc885fe`였다.
- 두 artifact의 `generation.baseHead`는 각각 `a4cbf12…`와 `64e63e9…`이며, 현재 `45ceb1d…`까지의 history에서 `0967789 feat: add ziwei tianfu compatibility modes`가 palace-coordinate와 12-star가 참조하는 `starPlacementRules.js`/`starResolver.js`를 변경했다. palace-coordinate에는 `ziweiContract.js` 변경도 포함된다. 이 변경된 input byte hash가 historical artifact와 현재 materializer 결과의 차이를 만든다.
- Nanbei와 Nanyang PDF의 현재 실제 byte SHA-256은 각각 `4786a94a…`/219 pages와 `04e184c4…`/528 pages로 등록값과 일치했다. 따라서 PDF content/hash mismatch는 아니다. palace-coordinate의 historical `Documents` 경로와 현재 resolver가 기록한 `Downloads` metadata 경로 차이는 표현/환경 provenance 차이일 뿐 실제 PDF byte 차이가 아니다.
- 12-star artifact의 tracked source input 중 `twelveMajorStarPlacementEvidence.js`는 historical `baseHead`에는 아직 존재하지 않았지만 artifact에 기록된 byte hash와 현재 byte hash는 같다. 이는 generator가 그 시점의 working input을 포함해 생성된 역사적 provenance이며 현재 재물질화의 비결정성을 뜻하지 않는다.

따라서 기존 checker의 `materialized_content` 실패는 (1) historical artifact를 현재 checkout에서 재생성한 결과와 비교하는 역사적 drift, 그리고 palace-coordinate의 path metadata 표현 차이로 분류된다. 현재 materializer의 두 번 반복 byte identity로 비결정성은 배제했고, PDF hash/page 검증으로 source mismatch도 배제했다. 현재 production 의미나 readiness 계약을 고치기 위해 historical artifact를 갱신하지 않았다. 기존 CLI checker의 `materialized_content` failure는 이 보존된 historical basis를 현재 checkout과 혼합 replay하는 경계로 남긴다.
