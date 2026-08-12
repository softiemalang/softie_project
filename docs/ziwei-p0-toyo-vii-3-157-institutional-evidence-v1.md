# Ziwei P0 TOYO VII-3-157 institutional evidence v1

## 결론

이 문서는 기존 Ziwei P0 source-identity/local-reconciliation/field-kit artifact를 수정하지 않는 additive successor다. 사용자에게 제공된 2026-08-12 東洋文庫 담당자 회신을 `institution_staff_direct_report` source로 정규화하고, 기존 `src-toyo-1646` physical-witness candidate에 연결한다.

새 report source는 새 physical witness가 아니다. 현재 graph는 다음과 같이 변한다.

| packet | claims | sources | observations | relations | blockers |
| --- | ---: | ---: | ---: | ---: | ---: |
| current local frontier | 30 | 13 | 40 | 130 | 11 |
| this institutional successor | 30 | 14 | 44 | 134 | 11 |
| additive delta | 0 | 1 institutional report | 4 | 4 | 0 |

`physicalWitnessCount`는 1로 유지되고, `physicalWitnessesAdded`와 `independentPhysicalWitnessesAdmitted`는 모두 0이다. 네 개 relation은 영향을 받는 기존 claim ID를 명시하지만 claim status를 올리는 semantic relation이 아니다. source identity/context, reported inscription, future acquisition route, negative semantic boundary를 기록하는 provenance relation이다.

## 회신 provenance

회신의 Gmail metadata와 아래 excerpts는 이번 작업의 입력으로 사용자가 제공했다. raw Gmail message bytes는 저장소에 없으며, Gmail을 이 materializer가 다시 취득하지 않는다.

- message id: `19ff4725ca62e800`
- thread id: `19feb2ee1dcf009c`
- received: `2026-08-12`
- subject: `Re: 所蔵資料 VII-3-157『新刊希夷陳先生紫微斗數全集』の書誌・閲覧についてのお問い合わせ`
- responder: 清水信子 / Nobuko Shimizu
- institution: 公益財団法人 東洋文庫
- role: 図書部資料整理課兼閲覧複写課長・主幹研究員
- email: `n-shimizu@toyo-bunko.or.jp`
- item: `VII-3-157`, `新刊希夷陳先生紫微斗數全集`

보존한 핵심 문구는 다음과 같다.

1. `データが重複していたためで、実際は1点です。`
2. `一見したところ、巻頭に続く編著者事項に「金陵益軒唐謙梓」とございます。`

두 번째 문구의 `一見したところ`는 제한된 확인 범위를 나타내므로 제거하거나 확정 표현으로 바꾸지 않았다. 정확한 丁/folio와 page image가 회신에 포함되지 않았으므로 locator는 `巻頭に続く編著者事項` 수준으로 남겼다.

## source / witness / observation 층위

새 source `src-toyo-vii-3-157-institutional-reply-20260812`는 다음처럼 분리된다.

- `institution staff direct inspection/report`: 담당자가 자료를 살펴본 뒤 보고한 물리적 item 수와 표기 존재.
- `catalog metadata`: 기존 `src-toyo-80941-catalog`(鈔本)과 `src-toyo-80943-catalog`(寫本) row. 두 row는 여전히 metadata다.
- `physical witness identity`: 기관 report가 `VII-3-157`의 실제 소장 실물은 1점이라고 확인한다. 이는 기존 `src-toyo-1646` 하나에 대한 identity reconciliation이며 새 실물의 추가가 아니다.
- `textual inscription observation`: 담당자가 권두 인접 편저자 사항에서 `金陵益軒唐謙梓`가 보인다고 보고한 bounded presence observation이다. 연구자가 원본 leaf를 직접 읽은 observation은 아니다.
- `lineage inference`: 수행하지 않았다. 이 report만으로 원각본/원간본, 후대 鈔本/寫本 여부, NARA/Nanyang/Nanbei와의 계통을 추론하지 않는다.
- `semantic authority`: 부여하지 않았다. 十二宮, 安天府, 四化, 命主·身主 위치는 직접 확인되지 않았다.

추가로 회신의 절차 정보도 별도 boundary observation으로 보존했다. 원칙적으로 원본을 먼저 열람하고 해당 丁을 확인한 뒤 복사를 신청할 수 있으며, 복사 丁수 제한과 종이 출력 원칙이 있다는 점은 future acquisition route이지 image-level reuse permission이 아니다.

## reconciliation 결과

### source identity / duplicate rows

`src-toyo-80941-catalog`와 `src-toyo-80943-catalog`는 서로 다른 physical witness로 세지 않는다. 기관의 직접 보고에 따라 `VII-3-157`의 실제 physical item 수는 1점이다. 이로써 다음의 좁은 질문은 bounded하게 정리됐다.

`鈔本 row + 寫本 row = DB 중복 데이터이며 실제 소장 실물 1점`.

이는 top-level `blocker-source-identity-unresolved`를 닫지 않는다. 여전히 edition/date, 원간본인지 후대 필사본인지, colophon, 정확한 leaf/folio, textual transmission lineage, source authority가 없다.

### reported inscription

`金陵益軒唐謙梓` 표기 존재는 기관 담당자의 제한된 직접 확인 report로 추가됐다. 이것은 `textual inscription presence`의 uncertainty를 줄이지만 다음을 증명하지 않는다.

- VII-3-157이 金陵益軒唐謙梓의 원각본이라는 것
- 후대 鈔本/寫本이 아니라는 것
- 저자/편저자 표기의 역사적 권위나 판본 lineage
- 본문 rule, 十二宮 semantic map, Tianfu coordinate, 四化, 命主·身主

### claim 상태

기존 claim-source matrix는 수정하지 않았다. 30 claims 모두 `successorStatus == predecessorStatus`이고, `claimStatusChanges`, `claimsAdded`, `claimsPromoted`, `directSemanticClaimSupportAdded`는 빈 값 또는 0이다. 기존 TOYO candidate를 source context로 갖는 29 claims에는 institutional report context가 부착됐지만, 그 context는 semantic claim support가 아니다. unsupported calendar claim도 그대로 보존된다.

### blocker 상태

닫힌 top-level blocker는 없다.

- `blocker-source-identity-unresolved`: `blocked` 유지. physical item count의 duplicate-row sub-boundary만 bounded하게 정리됐고 edition/lineage/leaf/authority는 열려 있다.
- `blocker-image-reuse-rights`: `needs_human_review` 유지. 열람·종이 복사 절차는 permission/redistribution license가 아니다.
- palace semantic, direct rule, Tianfu raw/rotation-06, 四化, 身主 24-row, oracle, calendar 등 나머지 blocker도 모두 기존 상태 유지. semantic-limit report가 오히려 해당 page-level observation이 아직 없음을 명시한다.

따라서 `blockersClosed: []`, `blocked: 10`, `needs_human_review: 1`이다. `resolvedSubBoundaries`의 duplicate-row 항목은 top-level blocker closure가 아니다.

## field kit 영향

기존 `ziwei-p0-evidence-acquisition-field-kit-v1`의 bytes는 수정하지 않았다. 새 artifact의 `field-kit-impact.json`은 다음만 additive하게 기록한다.

- identity/lineage target: 같은 duplicate-row 질문은 다시 요청하지 않지만, target 자체는 `action_required`.
- palace semantic map와 Tianfu adjudicator target: `action_required`; report는 필요한 page-level semantic observation이 없음을 확인할 뿐이다.
- image reuse target: `human_policy_review`; 기관의 copy route를 reuse permission으로 승격하지 않는다.

다음 사람의 실제 조사에는 기관 열람을 통해 exact 丁/folio와 전체 page/adjacent context를 확보하고, identity/lineage/semantic/rights를 별도 gate로 검토하는 일이 남아 있다.

## 보존·검증 경계

- predecessor artifacts와 기존 field kit bytes를 덮어쓰지 않았다.
- raw Gmail bytes, source PDF, TOYO image를 Git에 저장하지 않았다.
- 기존 보호 asset `-.jpg`의 canonical rendered asset byte hash `26896bdc877cd977a5e2e88abc1d7409d021a0ee1ffaacd708ad1dd3f987843f`를 확인했다.
- readiness는 `not_safe_to_start`, grounding은 `blocked`, activation은 `experimental_only`, `rotation-06`은 `representation_only`다.
- production, interpretation, remote DB, deploy, commit, push는 수행하지 않았다.

재현 명령:

```sh
node scripts/materialize-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1.mjs
node scripts/check-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1.mjs
node scripts/check-ziwei-p0-toyo-vii-3-157-institutional-evidence-v1-negative-v0.mjs
node --test test/ziweiP0ToyoVii3157InstitutionalEvidence.test.js
```

materializer는 user-supplied provenance를 deterministic JSON과 integrity sidecar로 정규화하지만, 외부 메일/자료를 취득하거나 semantic authority를 자동 판정하지 않는다.
