# Ziwei occurrence-level provenance v0

`ziwei-occurrence-level-provenance-v0`는 기존 자미두수 의미 후보 19개의 원문 occurrence를 claim으로 통합하지 않고, 현재 저장소의 입력·계산·규칙·fixture 경로와 unresolved 상태를 보존하는 계약이다. 기준 HEAD는 `4b062131ae4f1f7b0932708809399b92dbe06469`이며, 현재 checkout의 artifact identity는 별도로 실제 materialization HEAD와 byte hash를 기록한다.

## 경계

- 19개 occurrence는 `source.file#source.exportName#source.slot`의 SHA-256 앞 16자리로 stable ID를 만든다. 원문 text는 정규화하지 않는다.
- 각 record는 `rawText.isVerifiedFact=false`, source location, feature/rule/calculation references, fixture/external evidence references, `source_identity_unresolved`, partial completeness, unresolved gaps, conflation prohibition을 가진다.
- stable claim ID 필드는 `null`이고 stable claim boundary는 0이다. 서로 다른 원문을 병합하거나 빈도·개수로 ranking하지 않는다.
- 내부 fixture는 `regression_only`; 외부 fixture는 `verified: 0`, `pending: 6`, `not_independently_verified`이다. scoped observed match는 occurrence 또는 체계 전체 검증으로 승격하지 않는다.
- 기준선 source identity inventory 32개(7 local rule/calculation source + 6 declared external fixture + 19 meaning occurrence)는 모두 `unresolved_source_identity`로 보존한다.

상태 vocabulary는 `occurrence_identified`, `occurrence_provenance_partial`, `source_identity_unresolved`, `regression_only`, `configuration_mismatch`, `not_independently_verified`, `claim_grouping_blocked`를 구별한다. `configuration_mismatch`는 기존 외부 fixture 상태를 evidence scope에서 보존하는 vocabulary이며, source identity를 추정하지 않는다.

## 산출과 검사

- 대표 artifact: [`artifacts/ziwei-occurrence-level-provenance-v0/complete.json`](../artifacts/ziwei-occurrence-level-provenance-v0/complete.json)
- materializer: `node scripts/materialize-ziwei-occurrence-provenance-v0.mjs`
- checker: `node scripts/check-ziwei-occurrence-provenance-v0.mjs`
- negative checker: `node scripts/check-ziwei-occurrence-provenance-negative-v0.mjs`
- targeted test: `node --test test/ziweiOccurrenceProvenance.test.js`

`evidenceIndex`는 occurrence에서 rule/calculation/fixture/source로 역추적하고 다시 occurrence ID로 돌아오는 인덱스다. artifact payload content hash와 complete JSON의 실제 byte hash는 `artifact-identity-v1` 및 integrity sidecar로 분리한다. 반복 materialization은 timestamp와 insertion-order에 의존하지 않는다.

이 계약은 계산 readiness, grounding, interpretation, prompt, UI/API/DB, LLM, activation을 구현하지 않는다. occurrence-level provenance만으로는 source identity·독립 oracle·claim boundary가 닫히지 않으므로 readiness/grounding 착수는 안전하지 않다.
