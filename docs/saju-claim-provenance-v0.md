# 사주 claim-level provenance v0

이 계약은 기존 `systems.saju.features[*]`의 claim·의미 후보를 새로 만들거나 검증 승격하지 않고, 현재 구조와 계산 경로를 기계적으로 추적한다. 대표 artifact는 `artifacts/saju-claim-provenance-v0.json`이며, 현재 유효한 내부 사주 fixture 12개에서 관측된 stable claim ID 43개를 inventory하고 각 claim의 occurrence별 경로를 보존한다. 이는 모든 가능한 미래 입력의 feature ID 열거가 아니라 현재 저장소 fixture/handoff 관측 범위다.

## 경계

- stable `claimId`는 기존 feature의 `id`이며 `claimText`와 occurrence의 `claimText`는 기존 `statement`의 원문 보존이다. stable `occurrenceId`와 source location은 claim ID와 분리해 추적한다. record의 `claimText`는 대표 표시일 뿐 occurrence 원문을 대체하지 않으며 서로 다른 원문을 자동 등가 claim으로 판정하지 않는다. raw text에는 `isVerifiedFact=false`와 `raw_text_not_verified_fact_or_interpretation` 소비 제한이 붙는다.
- `calculationRefs`, `ruleRefs`, `fixtureRefs`, `externalEvidenceRefs`, `traditionalSourceRefs`는 서로 다른 evidence kind와 verification scope를 유지한다.
- 내부 fixture는 `regression_fixture_only`이며 독립 외부 검증이 아니다.
- 외부 7/7 match는 fixture 선언 필드 범위의 `calculation_externally_matched_scoped` 관측일 뿐 claim-level `verified`가 아니다. source byte hash/snapshot이 없으므로 `external_evidence_unhashed`이다.
- 전통 규칙의 저자·판본·페이지/절/표 identity와 source byte hash가 없으므로 각 rule source는 `traditional_source_unresolved`이다.
- 모든 claim의 현재 `verificationStatus`는 `unverified`이고 artifact verdict는 `saju_claim_provenance_partial_unverified`이다.

## 결정성·검사

Materializer는 claim/evidence index를 stable id로 정렬하고 canonical JSON을 사용한다. `contentSha256`는 hash field를 제외한 canonical content의 SHA-256이다. `artifactByteSha256`는 해당 content에 hash field를 추가하기 직전의 canonical artifact preimage hash로, self-referential hash를 피하기 위한 명시적 scope다.

```sh
node scripts/materialize-saju-claim-provenance-v0.mjs
node scripts/check-saju-claim-provenance-v0.mjs
node --test test/sajuClaimProvenance.test.js
```

Checker는 source identity 없는 연결, 내부 fixture의 외부 승격, scoped match의 verified 승격, 계산/규칙 단절, unresolved gap 은폐, claim 중복/누락/비결정렬, 자연어 조언·ranking·prompt 필드 삽입을 fail-closed로 거부한다.
