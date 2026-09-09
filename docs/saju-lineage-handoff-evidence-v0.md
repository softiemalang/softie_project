# Saju Lineage Handoff Evidence v0

이 계약은 공개 `Deterministic Base v0`와 별도로, 이미 계산·검증된 사주 lineage 결과를 대화 계층에 전달하기 위한 envelope다. 공개 Base의 `INPUT`·`FACT` 값이나 계산 경계를 복제·변경하지 않으며, 이 envelope 자체가 source authority나 개인 해석을 승격하지 않는다.

## 경계

- 입력은 현재 grammar가 만든 structural result, source-bounded semantic result, semantic lexicon result, source-local composition result뿐이다. 누락된 결과를 다시 계산하거나 다른 결과로 대체하지 않는다.
- `evidence`에는 결과 payload와 각 결과의 `sourceRefs`, locator, upstream provenance를 보존한다. `state`에는 executable/adopted 결과와 함께 prerequisite gap, unresolved, unsupported, blocked, not-applicable, ambiguous, conflict 상태를 원래 범주별로 보존한다.
- 결과의 `sourceIds`·`locatorIds`·source byte hash·lineage는 현재 frozen grammar catalog과 대조한다. 알 수 없는 source/locator, hash mismatch, payload와 provenance의 불일치, 공통 후보의 존재는 fail-closed다.
- `commonCandidates`는 현재 비어 있어야 한다. 서로 다른 lineage의 결과를 합치거나 승자를 고르지 않는다. conflict는 `preserved_tension`으로만 전달한다.

## Constitution adapter

`adaptSajuLineageHandoffEvidenceToConstitution`는 다음 두 층을 별도 evidence kind로 만든다.

1. Base의 실제 존재하는 `systems.*.fact`와 `normalizedInput.*` 참조는 `base_fact`로 전달한다. 값은 Base에 남고, adapter가 재계산하지 않는다.
2. 각 structural/semantic/lexicon/composition 결과와 미해결 상태는 개별 `literature_claim`으로 전달한다. source-derived 결과만 `semanticBasisEligible`로 표시하며, structural result와 unresolved/unsupported/conflict 상태는 의미 근거로 열지 않는다.

adapter는 hypothesis를 만들지 않는다. 사용자 경험이 없고 Constitution의 `interpretation_hypothesis`가 별도로 제출되지 않은 경우의 판정은 `facts_only_no_semantic_interpretation`이다. 따라서 이 계약을 소비하는 AI는 Base FACT, source-derived evidence, unresolved/conflict 상태를 구분해 읽을 수 있지만, FACT 존재만으로 개인 의미를 만들거나 누락된 composition을 보완할 수 없다.

## 파일 소비 순서

```text
public Deterministic Base
  + precomputed Saju lineage results
  → build envelope
  → export JSON
  → fresh-file read and validate provenance/state
  → Constitution evidence adapter
  → facts/evidence separation check
  → user-experience gate before any later hypothesis
```

구현은 [`src/interpretationPrep/sajuLineageHandoffEvidence.js`](../src/interpretationPrep/sajuLineageHandoffEvidence.js), 실제 fixture 회귀는 [`test/sajuLineageHandoffEvidence.test.js`](../test/sajuLineageHandoffEvidence.test.js)에서 수행한다. 이 계약은 공개 Base의 JSON/Markdown export, 계산 FACT, astrology activation, Constitution 자체의 의미 규칙을 변경하지 않는다.
