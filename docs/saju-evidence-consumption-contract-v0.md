# Saju Evidence Consumption / Conversational Use Contract v0

이 계약은 공개 `Deterministic Base`와 이미 생성된 Saju lineage evidence를 대화 모델에 전달할 때, 각 evidence를 어떤 범위로 사용할 수 있는지만 고정한다. 사용자 응답 저장, 응답 분류, 개인화, 질문 흐름, 실제 hypothesis 생성은 구현하지 않고 대화 계층의 책임으로 남긴다.

## 소비 클래스

| 클래스 | 확정 사실 사용 | source-bounded 설명 | 가설 제안 | 사용자 맥락 | 개인화 |
| --- | --- | --- | --- | --- | --- |
| `fact` | 포함된 Base 값에 한해 가능 | Base 값 보고만 가능 | FACT만으로 금지 | 사실 보고에는 불필요 | 확정적 개인화 금지 |
| `literature_evidence` | 불가 | source/locator·lineage 범위에서 가능 | `available` semantic basis일 때 별도 Constitution gate 뒤에만 조건부 | 개인 적용 전에 필요 | 확정적 개인화 금지 |
| `source_local_composition` | 불가 | 미리 계산된 동일 source/lineage 조합과 chain만 가능 | 별도 Constitution gate 뒤에만 조건부 | 개인 적용 전에 필요 | 확정적 개인화 금지 |
| `unresolved` | 불가 | 미해결·미지원·차단·후보·모호·비적용 상태만 보고 | 차단 | 빈칸을 채우지 않은 채 확인 필요 | 확정적 개인화 금지 |
| `conflict` | 불가 | 양쪽 근거와 보존된 tension만 보고 | 충돌 보존 중 차단 | 적용 전 필요하나 source 충돌을 임의 해소하지 않음 | 확정적 개인화 금지 |

구조 결과는 `literature_evidence`로 전달되지만 semantic meaning으로 읽지 않는다. `source_local_composition`은 source가 직접 닫은 precomputed chain만 가리키며, 미해결 composition을 새로 합성하지 않는다. `unresolved`와 `conflict`는 데이터 손실 없이 상태로 전달할 뿐 의미 근거로 승격하지 않는다.

## 모델 소비 규칙

- `fact`는 포함된 값과 FACT 참조를 그대로 보고할 수 있다. 값의 존재만으로 성격·길흉·예측·개인 특성을 만들지 않는다.
- `literature_evidence`와 `source_local_composition`은 원문 범위, source identity, locator, lineage, upstream provenance를 함께 확인하며 source 주장 또는 계산된 source-local 결과로만 설명한다. 이를 공개 Base FACT나 보편 법칙으로 바꾸지 않는다.
- `available` semantic evidence가 있다는 사실만으로 응답을 확정하지 않는다. 별도 Constitution hypothesis와 사용자 맥락 gate가 제출되기 전에는 자동 가설을 만들지 않는다.
- `unresolved`·`unsupported`·`blocked`·`candidate`·`ambiguous`·`not_applicable`는 그대로 알리고 추정·재계산·대체·자유로운 문헌 보간을 하지 않는다.
- `conflict`는 어느 한쪽을 제거하거나 승자로 만들지 않는다. 서로 다른 lineage의 일치는 상호검증·다수결이 아니다.

계약의 `permission`은 `confirmedFact`, `sourceBoundedExplanation`, `hypothesisProposal`, `userContextRequirement`, `definitivePersonalization`을 evidence별로 보존한다. `modelPolicy`는 위 규칙을 요약하며, 대화 모델의 실제 응답 선택이나 사용자 기록을 대신하지 않는다.

이 계약의 `boundedEvidenceConsumptionReady`는 FACT 보고와 source-bounded 상태·결과 설명을 위한 준비만 뜻한다. `interpretationHypothesisReady`는 계속 `false`이며, 사용자 맥락과 별도 Constitution hypothesis 없이 개인 해석을 시작할 수 있다는 뜻이 아니다.

구현과 fresh-file 회귀는 [`src/interpretationPrep/sajuEvidenceConsumptionContract.js`](../src/interpretationPrep/sajuEvidenceConsumptionContract.js) 및 [`test/sajuEvidenceConsumptionContract.test.js`](../test/sajuEvidenceConsumptionContract.test.js)에서 수행한다. 이 계약은 계산, 공개 Base, lineage grammar, source authority, activation, readiness를 승격하지 않는다.
