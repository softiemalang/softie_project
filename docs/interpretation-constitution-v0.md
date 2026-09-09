# Interpretation Constitution v0

이 계약은 freeze된 `Deterministic Base v0`를 해석 입력으로 사용할 때 사주·점성학·향후 자미두수가 공통으로 지켜야 하는 해석 전 경계다. 도메인별 상징 사전, 문헌 의미표, 해석 결과, activation/readiness 승격은 포함하지 않는다.

## 1. 기본 선언

1. Base의 `systems.*.fact`는 입력 사실이다. 값이 존재한다는 사실만으로 그 값의 의미, 개인 특성, 미래, 심리 또는 운명을 확정하지 않는다.
2. 해석 산출물은 FACT가 아니라 `interpretation_hypothesis`로만 시작한다. 단일 FACT를 개인 특성의 결론으로 바꾸지 않는다.
3. 문헌 주장, 현대적 synthesis, AI 추론, 사용자 경험은 각각 별도 evidence kind로 보존한다. 한 evidence에 여러 종류를 합쳐 기록하지 않는다.
4. 미지원·미검증 값은 누락된 값을 채우는 재료가 아니다. 해당 항목은 `blocked` 또는 `not provided`로 남기고 추정·재계산하지 않는다.

## 2. 실행 흐름

```text
frozen Base
  → public Base 계약 확인
  → 요청한 FACT path의 실제 존재 확인
  → FACT만으로 semantic meaning을 추정하지 않음
  → 별도 semantic candidate basis 확인
  → hypothesis만 생성
  → 일치는 priority만 상승
  → 충돌은 tension으로 보존
  → 사용자 경험을 개인 적용의 우선 신호로 확인
```

### Base → 해석 가능성 판정

- Base가 canonical public projection이 아니면 중단한다.
- 요청한 FACT path가 없으면 중단한다. 다른 체계의 값, 과거 결과, 임의 계산으로 대체하지 않는다.
- FACT만 있고 별도 semantic candidate basis가 없으면 `facts_only_no_semantic_interpretation`으로 종료한다.
- `available`로 명시된 semantic basis가 있어도 결과 상태는 `hypothesis_only`다. `candidate`·`unverified`·`unsupported` 자료는 기록만 하고 의미 근거로 사용하지 않는다. 확정 FACT, authority, readiness, activation으로 승격하지 않는다.

### 근거 조합

- `base_fact`, `literature_claim`, `modern_synthesis`, `ai_inference`, `user_experience`를 별도 그룹으로 전달한다.
- 여러 근거의 일치는 `priority_only`다. `confirmed`, `certain`, `majority`, `winner`로 기록하지 않는다.
- 서로 다른 체계의 같은 방향 신호는 `not_intervalidation_or_vote`로 기록한다. 상호검증·다수결·독립 oracle로 계산하지 않는다.
- AI 추론은 새로운 FACT나 semantic basis가 아니다.

### 불확실성·충돌·사용자 확인

- `supports`와 `conflicts`를 모두 유지한다. 충돌을 삭제하거나 승자를 고르지 않고 `preserved_tension`으로 남긴다.
- 사용자 경험이 없으면 개인 적용 전에 질문한다.
- 사용자 경험이 후보와 충돌하면 후보를 사실로 밀어붙이지 않고 사용자 경험 우선으로 적용을 보류한다.
- 사용자 경험이 후보와 맞아도 confirmation이 아니라 contextual support다.

## 3. 금지 범위

Constitution은 계수·십성·행성·하우스·성요의 의미표를 제공하지 않는다. 따라서 이 계약만으로 특정 상징을 성격·관계·직업·미래의 의미로 번역할 수 없다. 그 의미층을 추가할 때도 위 evidence 분리와 hypothesis-only 경계를 통과해야 한다.

기계 검사는 [`src/interpretationConstitution.js`](../src/interpretationConstitution.js), 최소 회귀는 [`test/interpretationConstitution.test.js`](../test/interpretationConstitution.test.js)에서 수행한다.
