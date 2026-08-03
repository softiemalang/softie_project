# 세 체계 준비 상태 조사 기준선 v1

<!-- tri-system-readiness: verdict=tri_system_preparation_baseline_partial head=acb1af9f7ad393cea23d8d9949660c9bcfe37beb -->

## 판정

현재 저장소의 종합 준비도는 tri_system_preparation_baseline_partial이다. 이는 세 체계를 하나의 엔진으로 합칠 준비가 되었다는 뜻이 아니다. 서양 점성학은 독립적인 packet/context/readiness/claim graph/grounding과 checker·artifact가 존재하지만 activation은 여전히 차단되어 있다. 사주와 자미두수는 실제 계산·규칙·해석 준비 경로가 있으나 동일한 provenance·claim·materialized readiness 계층은 확인되지 않는다.

## 계층 매트릭스

| 체계 | 계산 | claim/의미 후보 | provenance | 관계 | context/readiness | handoff/grounding | materialization/checker | 종합 |
|---|---|---|---|---|---|---|---|---|
| 사주 | partial | partial | partial | implemented_unverified | partial | partial | absent / partial | partial |
| 자미두수 | implemented_unverified | partial | partial | implemented_unverified | partial | partial | absent / partial | partial |
| 서양 점성학 | verified | verified | verified | verified | verified | verified | verified / verified | verified |

세부 13계층, 파일·export·테스트·artifact 연결, gap 및 순서는 [machine-readable inventory](../artifacts/tri-system-readiness-v1/inventory.json)에 고정한다. `scripts/materialize-tri-system-readiness.mjs`는 artifact의 generation base/input identity와 계약/materializer version을 확인한 뒤 현재 HEAD 차이만으로 stale 처리하지 않고 동일 inventory byte hash와 요약을 결정론적으로 materialize하는 deterministic materializer다.

## 데이터 흐름과 핵심 근거

- 사주 흐름: normalized input → `calculateFourPillars` → `calculateSajuSystem`/`buildInterpretationContext` → `prepareThreeSystemInterpretationData` → chat handoff. 근거: `saju-core`, `saju-pipeline`, `saju-handoff`.
- 자미두수 흐름: 사주 결과의 연간·연지·시지 + local lunar conversion → `resolveZiweiChart`/star resolvers → `createZiweiCalculationContext`/`createZiweiInterpretationContext` → prompt/handoff. 근거: `ziwei-core`, `ziwei-pipeline`, `ziwei-handoff`.
- 서양 점성학 흐름: verified provider/raw chart → interpretation packet → context/readiness → claim relation graph → handoff/conformance → conversation grounding. 근거: `astrology-packet`, `astrology-context`, `astrology-readiness`, `astrology-graph`, `astrology-grounding`.

## 핵심 근거와 불일치

- 사주는 `calculateFourPillars`와 `prepareThreeSystemInterpretationData`가 실제로 연결되고, `stateContract`가 테스트된다. 그러나 `docs/saju-final-readiness.md`는 외부 검증을 `pending`으로 기록하는 반면 `docs/saju-external-validation-report.md`는 7개 fixture를 `verifiedMatches`로 집계한다. 이 조사에서는 불일치를 해소하지 않고 `partial`로 유지한다. 근거: `saju-core`, `saju-pipeline`, `saju-validation`.
- 자미두수는 `resolveZiweiChart`, 14주성·사화·6길성 resolver와 고정 RuleSet, exact-time pipeline 및 fail-closed candidate 경로가 있다. 하지만 source audit의 `verifiedMatches`는 0이고 `pending_source_review`가 남아 있어 `implemented_unverified` 이상으로 올리지 않는다. 근거: `ziwei-core`, `ziwei-pipeline`, `ziwei-validation`.
- 서양 점성학은 53개 claim node, relation graph, `sourceRefs`, hash-linked readiness와 deterministic grounding artifact 및 negative checker evidence가 모두 있다. 다만 packet의 `usable:false`, `serviceEligibility:"blocked"`는 유지되므로 이는 local evidence readiness이지 사용자 전달/production readiness가 아니다. 근거: `astrology-packet`, `astrology-readiness`, `astrology-graph`, `astrology-grounding`.

## 공통 envelope 결정

지금은 착수 차단이다. 공통 envelope를 먼저 만들면 사주·자미두수에 없는 sourceRefs/claim/readiness 계층을 문서상으로 채운 것처럼 보이거나 세 체계의 개념적 동등성을 암시할 위험이 있다. 사주와 자미두수의 native evidence contract·external validation 경계를 먼저 고정해야 한다. 이와 병행 가능한 작업은 각 체계의 독립 artifact/checker 설계이며, 계산·규칙·claim 생성·UI/API/DB/LLM/production activation은 조사 범위 밖이다.

## 권장 다음 작업 단위

다음 /goal은 사주 validation 문서·fixture의 verification vocabulary와 source identity를 read-only로 reconciliation하고, 결과를 별도 evidence artifact와 checker로 확정한다가 적절하다. 이 작업이 완료되기 전에는 사주 준비도를 verified로 승격하지 않는다.
