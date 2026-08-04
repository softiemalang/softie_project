# 자미두수 외부 fixture 6건 독립 reconciliation v1

`verdictToken=ziwei_fixture_reconciliation_partial_unresolved`
기준 HEAD=`ae72cb6e1b9252f53676fefb6c777301d8965d6d`

이 작업은 기존 계산·규칙·fixture 기대값을 변경하지 않고, 저장소에 선언된 외부 fixture 6건을 fixture별 evidence record로 재검토한다. [machine-readable artifact](../artifacts/ziwei-fixture-reconciliation-v1/complete.json), [integrity sidecar](../artifacts/ziwei-fixture-reconciliation-v1/complete.json.integrity.json)가 단일 결과물이다.

artifact identity는 `artifact-identity-v1`을 사용한다. historical `basisHead`는 domain 판정의 기준으로 보존하고, freshness는 `generation.baseHead`, 실제 입력 byte hash, payload hash, contract/materializer version으로 검사한다. `includedCommit=null`이며 later checkout HEAD 자체는 stale 사유가 아니다.

## 결론

- 6건 모두 `verified`로 승격하지 않았다. before/after 모두 `verified=0`, `pending=6`이다.
- 4개 표 fixture는 기존 resolver의 제한된 field observation은 얻었지만, exact edition, immutable retrieval bytes, 외부 implementation/version이 없어 primary `source_identity_unresolved`다.
- 2개 worked-chart fixture는 원문이 요구하는 재현 입력이 완전하지 않다. `birthYearStem` 누락 때문에 현재 resolver contract가 입력을 거부하므로 primary `configuration_mismatch`이며, source identity도 unresolved다.
- 첫 4건은 observed field 값을 기대값과 비교했다. bureau, Ziwei branch, minor-star branches는 관측값이 일치했다. four-transformations는 외부 기대값의 한국어 type과 local resolver의 `hua_lu` 등 machine type이 달라 exact JSON은 `observed_mismatch`로 남겼다. 이는 계산 오류나 rule variant로 단정하지 않고 `schema_or_rule_scope_difference_unresolved`로 기록했다.
- `scoped_independent_match`는 0건이다. local resolver 호출은 independent oracle이 아니며, “부분 관측 일치”를 전체 명반·규칙·의미 claim 검증으로 확대하지 않았다.

## Fixture 판정

| fixture | 비교 범위 | 관측 | primary | 독립성 |
|---|---|---|---|---|
| `ziwei-ext-table-bureau-lookup` | bureau name/number | match | `source_identity_unresolved` | `not_established` |
| `ziwei-ext-table-ziwei-placement` | Ziwei branch | match | `source_identity_unresolved` | `not_established` |
| `ziwei-ext-table-four-transformations` | four transformations exact serialized fields | mismatch (type identifier scope) | `source_identity_unresolved` | `not_established` |
| `ziwei-ext-table-minor-stars` | six minor-star branches | match | `source_identity_unresolved` | `not_established` |
| `ziwei-ext-chart-sample-classic-1-mingshen` | ming/shen branch | not compared; required stem missing from local contract | `configuration_mismatch` | `not_established` |
| `ziwei-ext-chart-sample-classic-1-bureau` | bureau name/number | not compared; birth-year stem is null | `configuration_mismatch` | `not_established` |

각 record는 원본 선언의 title/author/document/volume/section/URL/access date, 입력 calendar/timezone/gender/time/leap-month/hour/day boundary, expected/observed, compared fields, rule metadata, independence, unresolved reason을 보존한다. source는 `紫微斗數全書` CText URL을 선언하지만 exact edition/base copy는 확정하지 않는다.

## Retrieval 및 byte evidence

명시된 fixture URL에 한해 2026-08-04 read-only retrieval을 시도했지만, 현재 실행 환경의 safe URL 경계에서 원문을 열 수 없었다. 따라서 원문을 성공적으로 확인했다고 기록하지 않았고, 원본 bytes를 저장하지 않았으며 external byte hash는 `null`이다. artifact의 SHA-256은 repository source files의 실제 bytes와 canonical `complete.json` bytes만 대상으로 한다. 기존 fixture source 파일의 기대값은 변경하지 않았다.

## Before / after 및 provenance 영향

기존 pending 6건이 pending이었던 이유는 exact source identity/retrieval identity와 독립 external oracle이 닫히지 않았기 때문이다. 이번 reconciliation은 그 gap을 fixture별로 분리해 기록했지만 해소하지 않았다. 내부 `knownCharts` 3건과 `starPlacementCharts` 3건은 계속 `regression_only`이고 외부 근거로 승격하지 않았다.

따라서 stable claim boundary는 추가되지 않았고, claim provenance blocker는 `blocked`로 유지된다. 이 산출물은 claim, grouping, 관계, 해석, prompt, readiness, activation을 생성하거나 구현하지 않는다.

## Determinism 및 negative contract

materializer는 fixture ID 및 canonical object key를 정렬하고 generation timestamp를 쓰지 않는다. 같은 HEAD에서 두 번 materialize한 `complete.json`은 byte-identical이어야 한다. negative fixture/checker는 내부 결과의 외부 위장, source/version 누락, 설정 불일치 은폐, scoped match의 전체 검증 확대, rule variant 삭제, verified 승격, 비결정적 정렬/출력을 모두 검출한다.

검사는 다음과 같다.

```sh
node scripts/materialize-ziwei-fixture-reconciliation-v1.mjs
node scripts/check-ziwei-fixture-reconciliation-v1.mjs
node scripts/check-ziwei-fixture-reconciliation-negative-v1.mjs
node --test test/ziweiFixtureReconciliation.test.js
```

### 변경 경계

추가 파일은 reconciliation artifact/문서/materializer/checker/negative fixture/targeted test뿐이다. 계산·규칙·기존 fixture 기대값·handoff·package 설정과 현재 DE405 등 비대상 worktree 변경은 보존한다. stage, commit, push, deploy, remote DB 변경은 수행하지 않았다.
