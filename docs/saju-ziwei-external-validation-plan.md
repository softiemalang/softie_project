# 사주·자미두수 독립 외부 검증 체계 마스터 플랜 v1

## 1. 개요 및 비전

본 문서 구조는 사주(Saju) 및 자미두수(Ziwei Dou Shu) 계산 코어의 내부 회귀 테스트와 독립 외부 검증을 완전 분리하고, 학술·공식 출처 기반 대조 픽스처(Provenance Fixture Pack)를 체계적으로 관리하기 위한 통합 마스터 플랜입니다.

---

## 2. 출처 등급 (Source Tiering) 정의

| 등급 | 정의 | 대표 출처 예시 | 검증 취급 정책 |
|---|---|---|---|
| **Tier 1** | 공공기관·공식 천문대·표준시 법령·국제표준 공식 릴리스 | 한국천문연구원(KASI), 홍콩천문대(HKO Almanac), IANA tzdb 공식 릴리스 파일 | 공식 검증 근거로 사용 |
| **Tier 2** | 출판된 명리/자미 고전 원전 및 서지 정보가 명시된 전문서, **추적 가능한 공식 프로젝트 메일링리스트·공개 토론 자료** | 《紫微斗數全書》 (1550년 명문해본), IANA tz 메일링리스트 공개 토론 스레드, 공식 표준 기구 토론 아카이브 | 원전 규칙표·예제·정책 검증 근거로 사용. `declaredReviewStatus: 'verified_reference'`로 등록된 경우 `verifiedMatches` 집계에 **포함**. 공식 릴리스 Tier 1과는 `coverageBySourceTier`로 분리하여 표시. |
| **Tier 3** | 산출 규칙/버전이 일부 확인되나 내부 산출이 불투명한 계산기 | 계산 로직이 미공개된 웹/앱 만세력 | `verified_match` 불인정 (`supporting_reference_only`로 한정) |
| **Tier 4** | 출처·판본·규칙체계를 확인할 수 없는 계산 결과 | 무작위 블로그/온라인 포럼 캡처 | 검증 근거 사용 완전 금지 (`invalid_reference`) |

### 2.1 Tier 2 verified_reference 정책 (상세)

- **포함 조건**: `sourceTier: 'Tier 2'`이고 `declaredReviewStatus: 'verified_reference'`인 fixture는 `verifiedMatches / verifiedMismatches` 집계에 포함됩니다.
- **Tier 분리 집계**: `coverageBySourceTier`는 Tier 1과 Tier 2를 독립 키로 집계하여 공식 릴리스 기반 검증과 토론 자료 기반 검증을 보고서에서 명확히 구분합니다.
- **Tier 2 예시**: IANA tz 메일링리스트 2019-08-07 토론 스레드는 공식 tzdb 릴리스 파일(Tier 1)이 아닌 Tier 2 자료입니다. 공식 tzdb 릴리스 파일(예: tzdata 2024a `asia` 파일)로 재확인하면 Tier 1으로 승격 가능합니다.
- **미확정 상태 제외**: `draft / disputed / unknown / pending_source_review / pending` 상태는 Tier와 무관하게 `verifiedMatches / verifiedMismatches`에서 무조건 제외됩니다.

---

## 3. 검증 유형 (Reference Type) 및 Provenance 데이터 구조

모든 외부 검증 Fixture는 다음 6가지 검증 유형으로 구분되며, 표준 메타데이터(Provenance Schema)를 포함합니다:

### 3.1 검증 유형 (Reference Types)
1. `astronomical_reference`: 절기 입절 시각, 태양 황경, 균시차 등 공식 천문 계산값
2. `calendar_conversion_reference`: 음양력 변환, 일진 간지, 월건 간지 대조표
3. `timezone_reference`: 역사적 표준시 자오선, DST 서머타임 중복/불가능 시각
4. `ruleset_table_reference`: 자미두수 오행국, 14주성 포국표, 생년십간 사화표, 6길성 배치표
5. `worked_chart_reference`: 고전 원전에 수록된 풀이 완료된 명식/명반 실례
6. `boundary_contract`: 윤달·자시·시각미상 차단 수칙 (안전 계약 픽스처 - 대조 건수 집계에서 제외)

---

## 4. 비교 Runner 및 필드 단위 `observedComparison` 구조

Runner는 작성자가 선언한 `declaredReviewStatus`에 의존하지 않고, 생산 코드 엔진 출력과 외부 기대값(`expected`)을 실제 실행하여 필드 단위로 대조합니다.

### 4.1 필드별 상태 (Field Status)
- `matched`: 범위 내 완전 일치
- `mismatched`: 불일치 발생 (사유 기록 필수)
- `disputed`: 학파/역법/규칙 차이로 인한 대립
- `pending`: 검증 대기

### 4.2 Fixture 전체 상태 (Overall Status)
- `matched_within_declared_scope`: 선언된 검증 필드 범위 안에서 완전 일치
- `mismatched_within_declared_scope`: 선언된 필드 범위 안에서 불일치
- `partial_match`: 일부 필드 일치, 일부 필드 불일치
- `disputed`: 규칙 상이로 인한 판정 보류
- `pending`: 외부 출처 확보 대기
- `out_of_scope`: 계산 코어 지원 범위 외

---

## 5. 불일치 분류 체계 (Mismatch Categorization)

엔진 결과와 외부 기준 간 불일치 발생 시 원인을 아래 6개 카테고리로 분류하고, **승인 없이 계산식을 수정하지 않습니다**:

1. `engine_defect_suspected`: 엔진 계산 로직의 오류로 의심되는 경우
2. `reference_defect_suspected`: 외부 레퍼런스 표기 오기/오탈자
3. `rule_set_difference`: 학파간 포국/배치 규칙 상이 (예: 안자미/안천부 수식 차이)
4. `boundary_policy_difference`: 자시/야자시/조자시, 윤달 처리 방침 차이
5. `source_not_reproducible`: 외부 출처 산출 로직 재현 불가
6. `needs_investigation`: 추가 학술 조사 필요

---

## 6. 승인 게이트 및 readiness 보존 수칙

1. **자동 승격 금지**: Fixture Pack 및 Runner를 작성했다는 이유만으로 `docs/saju-final-readiness.md` 및 `docs/ziwei-final-readiness.md`의 `externalValidationStatus: pending`을 자동 승격하지 않습니다.
2. **범위 한정 상태**: 자동 검증 결과는 `externalFixturePackStatus: started` 및 `scoped_external_validation_passed` 상태로 수록되며, `validatedScopes`와 `unvalidatedScopes`를 투명하게 공표합니다.
3. **최종 종합 판정**:
   - `EXTERNAL_FIXTURE_PACK_READY_FOR_REVIEW`: 모든 Fixture가 범주 내 완전 검증됨
   - `PARTIAL_FIXTURE_PACK_REFERENCE_GAP`: 일부 검증 성공했으나 불일치/미검증 레퍼런스 존재 (현재 상태)
   - `BLOCKED_BY_UNRELIABLE_REFERENCE`: 검증 출처 신뢰성 부족
   - `BLOCKED_BY_ENGINE_MISMATCH`: 심각한 엔진 계산 결함 발견
