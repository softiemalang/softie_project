# Ziwei readiness admission blocker audit v0

기준 HEAD는 `034ea3015875d52643341613547aec583747976e`이다. 이 문서는 기존 `ziwei-occurrence-level-provenance-v0`의 19개 occurrence를 claim으로 병합하지 않고, readiness/grounding 진입 전에 어떤 admission이 차단되는지만 판정한다. 계산·규칙·fixture·원문·provenance의 domain 의미는 변경하지 않는다.

## 최종 판정

19개 모두 stable claim이 아니다. 4개는 연결된 외부 fixture가 `verified: 0`, `pending: 6`인 상태에서 외부 근거 없이는 admission할 수 없다. 3개는 broad topic label이라 stable semantic boundary 없이는 전달할 수 없다. 8개는 운명·건강·관계·재물·이동·주거·부모·자녀로 raw text가 사용자 사실이나 예측으로 오독될 위험이 있어 현재 제외한다. 나머지 4개는 정확한 occurrence와 provenance를 보존하고 구조적 guard를 적용할 때에만 literal reference로 제한적으로 전달할 수 있다.

따라서 `readiness`와 `grounding` 설계의 착수 verdict는 `not_safe_to_start`다. admission 기준상 외부 evidence 필수 목록은 15개(변환 4개, broad topic 3개, high-risk 제외 8개)이며, 이 중 primary blocker가 외부 evidence인 것은 변환 4개다. 구조적 guard만으로 가능한 목록은 4개, 현재 제외 목록은 8개다. 제한적 occurrence reference contract의 조사 자체는 가능하지만, claim-level readiness/grounding이나 activation으로 확장할 수 없다.

## Admission 규칙

- `blocked_external_evidence_required`: `TRANSFORMATION_LABELS` 4개. 외부 edition/retrieval bytes, 독립 oracle·version·settings, field-level comparison이 닫히기 전에는 전달하지 않는다.
- `blocked_claim_boundary_required`: `TOPIC_PALACE_PATTERNS` 3개. label과 related palace 구조를 semantic claim으로 읽지 않으며, 명시적 semantic unit·scope·sourceRefs 없이는 전달하지 않는다.
- `excluded_currently` (primary blocker `raw_text_misread_risk`): `life`, `spouse`, `children`, `wealth`, `health`, `travel`, `property`, `parents` 8개. 현재 admission에서 제외한다. 상태와 blocker를 분리해 “제외”와 “오독 위험”을 같은 원인으로 뭉개지 않는다.
- `eligible_after_structural_guard`: `siblings`, `friends`, `career`, `mind` 4개. exact raw text, location, occurrence ID, unresolved source, regression-only fixture 상태를 그대로 표시하는 reference-only 경계에서만 가능하다.

모든 record는 `rawTextVerifiedFact: false`, `sourceIdentity: unresolved_source_identity`, `stableClaimId: null`, `internalFixture: regression_only`를 유지한다. 사용자가 제공하지 않은 맥락을 occurrence나 빈도로 추정하지 않는다. 어떤 제한적 전달도 사실·전통적 합의·성격·삶·미래·발현 강도로 표현할 수 없다.

## 산출물과 검증

- machine-readable artifact: `artifacts/ziwei-readiness-admission-blocker-audit-v0/complete.json`
- materializer: `scripts/materialize-ziwei-readiness-admission-blocker-audit-v0.mjs`
- checker: `scripts/check-ziwei-readiness-admission-blocker-audit-v0.mjs`
- negative checker/fixture: `scripts/check-ziwei-readiness-admission-blocker-negative-v0.mjs`, `test/fixtures/ziwei/readiness-admission-blocker-negative-v0.json`
- targeted test: `test/ziweiReadinessAdmissionBlockerAudit.test.js`

materialization은 occurrence ID lexicographic order, exact raw text, no timestamp를 사용한다. canonical payload hash와 complete JSON actual-byte hash는 분리한다. negative fixture는 blocked-to-ready promotion, invented claim boundary, hidden unresolved source, raw text factification, missing user-context dependency, deleted external-evidence requirement, frequency admission, forced blocker combination, nondeterministic sort를 모두 검출해야 한다.

기존 package.json 및 비대상 Strategy-C/DE405 변경은 보존하며, stage·commit·push·deploy·remote DB 변경은 수행하지 않는다.
