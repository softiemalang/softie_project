# 사주 verification vocabulary·source identity reconciliation v1

## 판정

`saju_scoped_external_matches_but_claim_level_verification_unproven`

조사 HEAD와 기계 판정의 전체 내용은 [`artifacts/saju-verification-reconciliation-v1.json`](../artifacts/saju-verification-reconciliation-v1.json)에 고정되어 있습니다. 이 문서와 artifact는 기존 계산·규칙·fixture 기대값·계약을 수정하지 않은 읽기 전용 조사 결과입니다.

현재 증거는 서로 다른 두 층입니다.

- `sajuValidationFixtures.js`의 13개는 엔진 출력과 내부 기대값을 비교하는 회귀 fixture입니다. 12개는 `regression_only`, 1개는 `pending_external_verification`이며, 독립 문헌 identity가 없습니다. 회귀 테스트 통과는 이 엔진과 기대값의 일관성만 보여 줍니다.
- `externalValidationFixtures.js`의 7개는 HKO 2026 자료 5개와 IANA timezone 토론 자료 2개를 선언하고, 현재 runner가 선언 필드에서 7/7 match를 관측합니다. 이는 `scoped_external_reference_match`로 기록할 수 있으나, 전통 명리 규칙 전체 또는 claim-level `verified`를 의미하지 않습니다.

따라서 tri-system baseline의 `partial / implemented_unverified`는 유지할 근거가 있습니다. 외부 fixture의 범위 내 비교는 통과했지만, 전통 규칙의 문헌 판본·직접 locator·source byte identity가 구현 규칙과 연결되어 있지 않고, 내부 회귀 fixture는 순환 검증이기 때문입니다.

## vocabulary 판정

| 현재 표현 | 실제 의미 | 증거 수준 | reconciliation |
|---|---|---|---|
| `regression_only` | 현재 엔진의 내부 기대값 회귀 고정 | 내부 회귀 | 유지. 독립 검증으로 부르지 않음 |
| `verified_reference` / `verified` | 외부 fixture 선언 또는 per-result 상태로 혼용 | 과부하 | 범위·source identity·관측 결과를 함께 표기 |
| `scoped_external_validation_passed` | 선언된 외부 fixture 필드의 실행 대조 통과 | 범위 한정 외부 대조 | claim-level verified로 승격하지 않음 |
| `experimental` | 파생 규칙/해석 후보의 분리 상태 | 실험·미검증 | 적절. 외부 fixture match가 이를 승격하지 않음 |
| `canonical` | repository source-of-truth 선택 | repository identity | 전통적 권위나 source byte canonicality로 해석하지 않음 |
| `confirmed` | 사주 계약에서 확정된 의미 없음 | 미정 | 독립 source + 재현 대조가 있을 때만 도입 검토 |
| `production` | 코드가 production 경로에 있다는 뜻 | 검증 등급 아님 | 정확성 근거로 사용하지 않음 |

## source identity inventory 요약

외부 fixture는 publisher/author, title, edition/version, publication date, URL, accessed date, page/table/section, rule settings를 기록합니다. 다만 HKO PDF와 IANA 토론 자료의 실제 retrieval byte hash/immutable snapshot은 저장소에 없으므로 source identity는 완전한 재현 identity가 아닙니다. IANA 자료는 공식 tzdb release가 아닌 Tier 2 community discussion입니다.

내부 engine에는 `SAJU_ENGINE_VERSION = 2.5`, calculation profile `softie-kst-apparent-solar-v1`, profile/rule versions가 있습니다. 이는 구현 identity이지 전통 문헌 identity가 아닙니다. profile·relation·timing 규칙에 저자, 문헌명, 판본, 번역본, 페이지/절/표 연결은 발견되지 않았습니다. 추정 문헌을 연결하지 않고 `unresolved_source_identity`로 남깁니다.

## gap 및 순환 검증

- 12개 내부 regression fixture: expected 값이 같은 repository engine의 결과와 비교되므로 circular validation입니다.
- `val-pending-external`: 외부 source identity와 재현 대조가 없습니다.
- 7개 external fixture: 관측 match는 확인되지만 declared `verified_reference`는 fixture 선언에 의존하는 vocabulary입니다. runner는 실제 비교를 수행하므로 observed evidence는 유효하되, 전체 규칙 검증을 의미하지 않습니다.
- 전통 규칙: source edition/author/locator 단절. 강약·격국·용신·신살·관계·대운 규칙은 implementation version만으로 문헌 검증 상태가 되지 않습니다.
- 문서 간 차이: final readiness의 `pending`과 external report의 `scoped_external_validation_passed`는 scope를 분리하면 양립하지만, `verified`를 전역 의미로 읽으면 과대 표현입니다.

## 기존 파일을 수정하지 않고 적용 가능한 vocabulary 계약 초안

새 claim/provenance 구현에 다음 상태를 사용하도록 권장합니다.

- `internal_regression`: repository-owned expected와 일치. independent source 없음.
- `scoped_external_reference_match`: 명시된 외부 source와 명시 필드가 규칙/설정 범위 내에서 재현 대조됨. universal verified 아님.
- `source_identity_incomplete`: source 표기는 있으나 edition, locator, retrieval identity 또는 재현성이 불완전함.
- `rule_derivation_unverified`: 구현 규칙 버전으로 결정론적 파생은 되었으나 전통 source identity 미확정.
- `experimental_unverified`: 실험/휴리스틱 결과.
- `unresolved_source_identity`: source를 찾지 못했거나 확인할 수 없어 추정·대체·승격하지 않음.

최소 claim provenance는 stable source identity, precise locator, retrieval hash/snapshot, 적용 규칙·학파·설정, implementation identity, independence/circularity 선언, expected/actual/tolerance/observed status를 포함해야 합니다.

## 재현 및 checker

```sh
node scripts/generate-saju-verification-reconciliation.mjs
node scripts/check-saju-verification-reconciliation.mjs
node --test test/sajuVerificationReconciliation.test.js
```

generator는 현재 Git HEAD와 audited source file SHA-256을 artifact에 기록하며 timestamp나 임의값을 넣지 않습니다. checker는 HEAD, source hash, fixture count, runner summary, 문서 경계(`pending`, `Tier 2`)를 다시 확인합니다.
