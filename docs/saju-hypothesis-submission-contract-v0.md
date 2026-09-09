# Saju Hypothesis Submission / Validation Contract v0

## 목적

`saju-hypothesis-submission-v0`는 대화 모델이 외부에서 제출한 user context와 interpretation hypothesis를 기존 canonical conversational handoff package에 대조하는 입력 계약이다. 엔진은 hypothesis를 만들거나 사용자 응답을 저장·분류하지 않고, 제출물이 현재 handoff의 FACT·source-bounded evidence·source-local composition에 실제로 연결되는지만 판정한다.

검증 대상은 다음 경계를 가진다.

- FACT는 제출된 `factRefs`와 Base evidence가 서로 정확히 연결되어야 한다.
- 문헌·composition evidence는 포함된 source/locator 범위와 동일한 lineage 안에서만 사용한다.
- `sourceScope`는 참조된 source/locator의 정확한 합집합이어야 하며 일반화는 금지된다.
- unresolved와 conflict는 `preservation`에 그대로 열거해야 하며 semantic basis로 사용할 수 없다.
- hypothesis는 `status: hypothesis`, `assertion.mode: tentative`, `personalConclusion: forbidden`이어야 한다.
- user context는 `reported_context_only_not_fact_or_interpretation_confirmation`으로 취급한다.

## 판정

| 결과 | 의미 |
| --- | --- |
| `accepted_bounded_hypothesis` | FACT와 available source-bounded basis가 닫혀 있어 해당 source 범위의 잠정 가설 대화만 허용 |
| `requires_user_confirmation` | 근거는 있으나 user context가 없거나 중립/충돌하거나 unresolved/conflict가 보존되어 개인 적용 전 확인 필요 |
| `blocked` | semantic basis 부족, provenance/scope 불일치, 과잉 개인화, cross-lineage synthesis 또는 conflict 해소 시도 |

`accepted_bounded_hypothesis`도 확정적 개인 판정을 뜻하지 않는다. 사용자가 보고한 경험은 해석의 확인값이 아니며, 제출 validator는 `personalApplicationReady: false`를 유지한다.

## 제출 구조

제출물은 `schemaVersion`, `version`, `kind`, `submissionId`, `userContext`, `hypothesis`만 가진다.

- `userContext`: `not_provided` 또는 `reported`; reported entry는 id·사용자 statement·supports/neutral/conflicts 관계·대상 hypothesis id를 명시한다.
- `hypothesis`: Base `factRefs`, handoff evidence `evidenceIds`, available semantic/composition `semanticBasisIds`, 보존할 conflict/unresolved 목록, 정확한 `sourceScope`, tentative `assertion`을 명시한다.
- `assertion.applicationMode`는 source-bounded discussion 또는 user-context comparison만 허용한다.

검증기는 원문 statement의 진실성이나 사용자의 경험을 분류하지 않는다. statement를 FACT·문헌 주장·확정된 개인 특성으로 승격하지 않고, 구조화된 제출 선언과 기존 Constitution 결과의 경계만 적용한다.

## 실제 시나리오

synthetic user context로 `나는 어떤 사람이야?` 흐름을 재현했다.

1. 같은 lineage의 semantic result와 source-local composition, 필요한 Base FACT를 제출하고 사용자가 직접 보고한 context가 연결되면 `accepted_bounded_hypothesis`가 된다.
2. 같은 근거라도 context가 없으면 `requires_user_confirmation`으로 멈춘다.
3. structural result만 있고 semantic basis가 없으면 `blocked`다.
4. definitive personalisation 선언이나 두 lineage의 semantic evidence를 합치면 fail-closed `blocked`다.
5. 실제 lineage conflict를 포함한 제출은 양쪽 provenance와 `preserved_tension`을 유지한 채 `requires_user_confirmation`이며, winner를 만들 수 없다.

제출 JSON은 fresh file로 다시 읽어 검증하며 canonical 재직렬화와 byte SHA가 일치해야 한다. validator에는 response storage/classification, personalization, recalculation, activation mutation 경로가 없다.

## readiness

- submission validation contract: `ready`
- accepted bounded hypothesis discussion: 제출별로 근거가 닫힌 경우에만 `true`
- personal application: 항상 `false`
- conversational interpretation activation: 기존 handoff처럼 `false` 유지

정확한 activation blocker는 `submission_cannot_promote_runtime_activation`이며, accepted 결과에서도 `personal_application_requires_confirmation`이 남는다. 외부 제출 하나가 production activation이나 기존 계산·provenance 경계를 승격하지 않는다.

구현은 [`src/interpretationPrep/sajuHypothesisSubmissionContract.js`](../src/interpretationPrep/sajuHypothesisSubmissionContract.js), E2E fixture는 [`test/sajuHypothesisSubmissionContract.test.js`](../test/sajuHypothesisSubmissionContract.test.js)에 있다.
