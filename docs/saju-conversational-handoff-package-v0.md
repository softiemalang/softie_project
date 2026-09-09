# Saju Conversational Handoff Package v0

## 목적

`saju-conversational-handoff-package-v0`는 FACT-only Public Base와 이미 계산·검증된 Saju lineage evidence envelope를 대화 모델에 함께 전달하는 canonical handoff 계약이다. 이 패키지는 기존 FACT, source-bounded evidence, composition, unresolved/conflict와 각각의 provenance를 보존하며, 새로운 계산이나 의미를 만들지 않는다.

패키지는 다음을 포함한다.

- `evidenceConsumption`: 기존 handoff evidence와 Constitution 입력, evidence별 소비 guidance
- `conversationalUseContract`: 대화 모델이 evidence 종류별로 사용할 수 있는 범위
- `interpretationHypothesisContract`: hypothesis를 자동 생성하거나 개인 결론으로 확정하지 않는 조건
- `boundary`: 재계산·의미 추가·cross-lineage synthesis·개인화 엔진을 수행하지 않는 경계
- `readiness`: 제한된 evidence 소비 가능 여부와 개인 적용 전제

## 소비 권한

| 종류 | 허용되는 사용 | 금지되는 사용 |
| --- | --- | --- |
| FACT | 포함된 값을 확정된 입력/계산 사실로 보고 | 값에서 개인 특성·길흉을 직접 확정 |
| 문헌 근거 | source와 locator 범위 안에서 설명 | 원문 밖의 현대적 의미 보충 또는 다른 lineage와 병합 |
| source-local composition | 해당 source/lineage가 닫은 결과를 그 범위에서 설명 | 공통 규칙·개인 의미로 자동 승격 |
| unresolved | 미결정 상태와 부족한 조건을 그대로 알림 | 추정·재계산으로 빈칸 보완 |
| conflict | 충돌하는 신호와 provenance를 함께 보존 | 승자 선택·충돌 은폐·다수결 합성 |

모든 source-derived 설명은 source/lineage와 locator를 함께 유지한다. 서로 다른 체계의 결과가 비슷해 보여도 상호검증이나 다수결로 취급하지 않는다.

## 실제 질문 경계

`나는 어떤 사람이야?`와 같은 개인 정체성·성향 질문에서 모델은 다음 순서만 수행할 수 있다.

1. 패키지에 포함된 관련 FACT 값을 확인해 보고한다.
2. 해당 FACT에서 분리된 source-bounded evidence와 locator 범위를 설명한다.
3. unresolved 또는 conflict가 있으면 그 상태를 고친 척하지 않고 밝힌다.
4. 개인 경험과 맥락을 확인한 뒤에야 대화상 hypothesis를 검토할 수 있음을 알린다.

이 질문에 대해 패키지만으로 성격·길흉·예측·개인 판정을 확정하지 않는다. 자동 hypothesis 생성, 응답 저장·분류, 개인화 전략 선택과 실제 대화 흐름은 이 계약과 엔진의 책임 범위 밖이다.

## 현재 readiness

- 제한된 FACT/source-bounded evidence 소비: `ready`
- 개인 적용을 포함한 conversational interpretation activation: `not ready`
- `user_experience_not_provided`: 사용자 경험·맥락이 아직 제공되지 않음
- `explicit_interpretation_hypothesis_not_submitted`: 명시적 hypothesis가 제출되지 않음

위 상태는 기존 계산·provenance·activation을 변경하지 않는다. unresolved/conflict는 개별 evidence에 보존되며, 이를 이유로 사실을 삭제하거나 임의로 해결하지 않는다.

## 검증

실제 production fixture에서 package를 생성하고 JSON을 fresh file로 다시 읽어 소비했다. embedded handoff evidence와 Constitution 입력의 보존, source 격리, unresolved/conflict 보존, `나는 어떤 사람이야?` 시나리오의 개인화 중단 경계를 확인하며 canonical 재직렬화와 SHA가 일치해야 한다.

구현은 [`src/interpretationPrep/sajuConversationalHandoffPackage.js`](../src/interpretationPrep/sajuConversationalHandoffPackage.js), 회귀 검증은 [`test/sajuConversationalHandoffPackage.test.js`](../test/sajuConversationalHandoffPackage.test.js)에 있다.
