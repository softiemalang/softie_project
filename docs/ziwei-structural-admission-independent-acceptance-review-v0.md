# Ziwei structural admission guard: independent acceptance review v0

기준 HEAD `cf40bda8a2620e3b8074ece9b81303de9b13b9fb`에서 structural admission guard pilot을 별도 경로로 다시 adversarial 검토한 결과다. 이 문서는 pilot의 원문·provenance·판정 의미를 수정하지 않으며, 자미두수 내용의 사실성이나 전통적 정답을 검증하지 않는다. 판정 범위는 구조적 제한과 비개입 경계뿐이다.

## Verdict

`ziwei_structural_admission_guard_pilot_independent_review_partial_unverified`

후보 occurrence 4개는 누락·중복 없이 독립적으로 열거되었고, 모두 atomic `admissionUnit` 안에서 `isStableClaim=false`, `rawText.isVerifiedFact=false`, `sourceIdentity=unresolved_source_identity`, `independentVerification=false`를 유지한다. raw-only 및 guard/occurrence 분리 소비, binding 교체, 부분 직렬화는 checker와 negative fixture에서 거부된다.

pilot·audit·provenance는 artifact-identity-v1의 generation base object, 실제 입력 byte hash, payload hash, contract/materializer version을 모두 통과한다. historical base head가 현재 HEAD와 다르다는 사실만으로 stale 처리하지 않는다.

## 항목별 판정

| 판정 | 수 | 의미 |
|---|---:|---|
| `accepted` | 11 | 현재 serialized boundary가 요구된 제한을 보존함 |
| `accepted_with_declared_limit` | 5 | 제한은 보존되지만 upstream audit 또는 pilot-only 경계에 한정됨 |
| `gap` | 0 | artifact identity 계약이 충족됨 |
| `violation` | 0 | 선언된 우회가 모두 checker에 의해 차단됨 |
| `not_applicable` | 0 | 해당 없음 |

검토 항목 전체는 machine-readable artifact의 `findings`에 있으며, 후보별 결과는 atomic `admissionUnit`을 포함한 `candidateRecords`에 있다. 후보 수와 반복 빈도는 신뢰도·중요도·우선순위로 사용하지 않는다.

## Negative coverage

독립 negative checker는 raw text 단독 추출, guard/occurrence 분리 소비, stable claim·verified fact 승격, source unresolved 은폐, context/mustNotAssume 삭제, 병합·대표 문장, pilot-only 제거, 후보 외 occurrence, 전체 readiness 확대, 질문·해석·조언·prompt 삽입, occurrence/guard binding 교체, 필수 guard 누락, 부분 직렬화, self-referential HEAD 계약을 각각 변형해 실패를 요구한다. 원문 텍스트를 대표 문장으로 합치거나 새 claim·관계·해석을 만들지 않는다.

## 제한과 결론

`stableClaimBoundary=0`, source identity는 `unresolved_source_identity`, readiness/grounding은 계속 `not_safe_to_start`, activation은 `experimental`이다. source를 검색·추정·연결하지 않았으며, 후보 4개를 나머지 15개나 자미두수 전체로 확대하지 않는다. 사용자 삶·성격·미래에 대한 적용은 context dependency와 `mustNotAssume`에 의해 금지된다.

따라서 structural review 자체는 `violation=0`, `gap=0`으로 종료되지만, 후보 4개 한정 grounding subset의 실제 구현·착수는 **불가**다. 이 review는 사실성·독립 truth validation을 대신하지 않는다.

Materializer: `scripts/materialize-ziwei-structural-admission-independent-acceptance-review-v0.mjs`
Checker: `scripts/check-ziwei-structural-admission-independent-acceptance-review-v0.mjs`
Negative fixture/checker: `test/fixtures/ziwei/structural-admission-independent-acceptance-review-negative-v0.json`, `scripts/check-ziwei-structural-admission-independent-acceptance-review-negative-v0.mjs`
