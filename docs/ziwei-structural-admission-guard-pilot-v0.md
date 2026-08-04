# Ziwei structural admission guard pilot v0

이 pilot은 readiness·grounding·activation을 열지 않는다. 기존 `ziwei-readiness-admission-blocker-audit-v0`의 `categoryLists.structuralGuardPossible`를 입력으로 읽어 `eligible_after_structural_guard`인 occurrence 4개만 1:1 materialize하는 격리된 literal-reference 계약이다. 후보 목록을 수동으로 복제하거나 추가하지 않는다.

## Guard 계약

각 record는 `admissionUnit` 하나만 제공한다. 이 versioned unit 안에 occurrence/provenance reference와 원문, 전체 guard, pilot-only scope, `mustNotAssume`, 사용자 context 의존성, standalone/raw-text-only 금지와 conflation prohibition이 함께 직렬화된다. occurrence ID·provenance occurrence ID·occurrence hash·guard hash·unit hash를 binding하며, 누락·교체·부분 직렬화·후보 외 ID를 checker가 거부한다. 원문은 `isVerifiedFact: false`, guard는 `isStableClaim: false`, source identity는 `unresolved_source_identity`, independent verification은 `false`다.

Reference consumer는 검증된 `admissionUnit`만 반환하며 raw-text-only accessor나 guard 없는 payload 계약은 제공하지 않는다. 질문·해석·조언·ranking·prompt를 만들지 않으며, 어떤 pilot 결과도 전체 readiness/grounding으로 확대하지 않는다.

## 결과와 제한

후보 4개는 모두 `limited_admission_possible`이다. 이는 사용자가 제공한 context가 있을 때에도 exact occurrence/provenance를 붙인 literal reference만 의미하며, 사실·성격·삶의 결론·미래 예측이 아니다. guard 또는 provenance를 입증할 수 없으면 `pilot_reblocked`로 fallback한다. source identity 32/32 unresolved, stable claim boundary 0, 독립 검증 0, readiness/grounding `not_safe_to_start`, activation `experimental`은 유지된다.

## 산출물과 검증

- artifact: `artifacts/ziwei-structural-admission-guard-pilot-v0/complete.json`
- materializer/checker: `scripts/materialize-ziwei-structural-admission-guard-pilot-v0.mjs`, `scripts/check-ziwei-structural-admission-guard-pilot-v0.mjs`
- reference consumer: `scripts/lib/ziwei-structural-admission-guard.mjs`
- negative fixture/checker: `test/fixtures/ziwei/structural-admission-guard-pilot-negative-v0.json`, `scripts/check-ziwei-structural-admission-guard-pilot-negative-v0.mjs`
- targeted test: `test/ziweiStructuralAdmissionGuardPilot.test.js`

canonical payload hash와 `complete.json` actual-byte hash를 분리하고, 반복 materialization은 byte-identical이어야 한다. artifact-identity-v1은 generation base object, 실제 입력 byte hash, payload hash, contract/materializer version을 검증하며 current HEAD와의 단순 불일치를 stale 판정으로 사용하지 않는다. 이 변경은 기존 audit/provenance/domain artifact의 의미를 수정하지 않는다.
