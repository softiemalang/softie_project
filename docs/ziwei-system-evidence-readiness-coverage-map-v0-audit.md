# Ziwei system evidence/readiness coverage map v0

이 문서는 `artifacts/ziwei-system-evidence-readiness-coverage-map-v0/complete.json`의 감사 경계다. 새 원문 검색·채택, production 계산, API/schema/enum/tolerance/baseline, readiness·grounding·activation, 기존 `ziwei-major-star-claim-readiness-reconciliation-v0`의 수정은 하지 않는다.

## Canonical boundary

13개 domain, domain별 1개 coverage claim, 7개 blocker, 7개 backlog item, 4개 source-acquisition plan을 materializer가 실제 repository path와 actual-byte SHA-256에서 만든다. 자미·천부·14주성은 기존 reconciliation/source-chain artifact를 authoritative link로 참조한다. raw occurrence는 stable claim으로 재분류하지 않는다.

## Mechanical audit

- materializer: `scripts/materialize-ziwei-system-evidence-readiness-coverage-map-v0.mjs`
- checker: `scripts/check-ziwei-system-evidence-readiness-coverage-map-v0.mjs`
- negative checker: `scripts/check-ziwei-system-evidence-readiness-coverage-map-negative-v0.mjs`
- 보호 범위: `src/ziwei`, Ziwei tests/fixtures, 기존 `artifacts/ziwei-*` 참조 및 reconciliation 핵심 JSON
- checker가 basis HEAD, path existence, protected hashes, enum, count, graph dangling edge, claim sourceRef, blocker link을 거부한다.

## Interpretation boundary

`verified_within_scope`는 deterministic local comparison/contract 범위일 뿐 전통적 진실성이나 해석 readiness를 뜻하지 않는다. `blocked`와 `research_only`는 기존 evidence/readiness 경계를 보존한다. P0는 fan-out과 safety boundary, P1은 source acquisition 가능성, P2는 구현·fixture·외부 대조 필요성, Deferred는 production 선택/계약 변경 필요성으로만 분류했다.

## Human review

다음 연구 단위는 (1) 궁 좌표-의미 mapping witness, (2) occurrence source identity/claim boundary audit, (3) 외부 독립 oracle 및 사화·보조성 source witness다. 사용자가 자료를 직접 찾을 시점은 P0 identity/claim 경계를 먼저 검토하고 acquisition acceptance criteria를 충족하는 immutable scan을 확보할 수 있을 때다.
