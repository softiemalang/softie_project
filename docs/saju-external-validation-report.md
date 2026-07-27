# 사주 독립 외부 검증 Fixture Pack v1 보고서 (개정판 2)

> **안내**: 이전 Runner 초안 결과는 자기대조·ID 정규화·출처 재현성 문제가 확인되어 무효 처리되었으며, 본 보고서는 프로덕션 모듈 실제 재실행 결과로 전면 개정되었습니다.
> `independentSourceCount: 4`, IANA Tier 1 등 이전 수치는 전부 제거되었습니다.

## 1. 개요 및 요약

- **검증 수행일**: 2026-07-27
- **대상 프로덕션 모듈**: `src/saju/engine/fourPillars.js`, `src/saju/engine/solarTerms.js`, `src/interpretationPrep/lunarConverter.js`, `src/interpretationPrep/sajuAdapter.js`
- **단일 원천 파일**: `src/saju/engine/externalValidationFixtures.js`

### 집계 수치 (실제)

| 항목 | 수치 |
|---|---|
| fixtureCount | 7 |
| uniqueReferenceDocumentCount | 3 |
| independentPublisherCount | 2 |
| observedMatches | 7 |
| observedMismatches | 0 |
| verifiedMatches (`verified_reference` 기준) | 7 |
| verifiedMismatches | 0 |

> **verified 집계 정책**: `declaredReviewStatus === 'verified_reference'`인 fixture만 `verifiedMatches / verifiedMismatches`에 집계합니다. Tier 2 자료도 `verified_reference`로 명시 등록된 경우 포함합니다. `draft / disputed / unknown / pending_source_review` 상태는 무조건 제외됩니다.

---

## 2. 출처 Tier별 집계

| Source Tier | fixtureCount | observedMatches | observedMismatches |
|---|---|---|---|
| Tier 1 (HKO 천문대 공식 자료) | 5 | 5 | 0 |
| Tier 2 (IANA tz 메일링리스트 토론 자료) | 2 | 2 | 0 |

---

## 3. 잠정 관측 일치 범위 / 출처 검토 대기

### 3.1 잠정 관측 일치 범위 (observedMatches)

| Fixture ID | 검증 유형 | 출처 | Source Tier | 검증 필드 | 실제 대조 결과 |
|---|---|---|---|---|---|
| `saju-ext-hko-2026-spring-commences` | `astronomical_reference` | Hong Kong Observatory Almanac 2026 | Tier 1 | 입춘 절기명 + 절입시각 (오차 ±15분 이내) | `matched` |
| `saju-ext-hko-2026-02-01-day-pillar` | `calendar_conversion_reference` | Hong Kong Observatory Almanac 2026 | Tier 1 | 일진 간지 (`병오`) | `matched` |
| `saju-ext-hko-2026-lunar-new-year` | `calendar_conversion_reference` | Hong Kong Observatory Gregorian-Lunar Table | Tier 1 | 음력 1월 1일 → `2026-02-17` | `matched` |
| `saju-ext-hko-2026-sixth-month-start` | `calendar_conversion_reference` | Hong Kong Observatory Gregorian-Lunar Table | Tier 1 | 음력 6월 1일 → `2026-07-14` | `matched` |
| `saju-ext-hko-2026-sixth-month-midpoint` | `calendar_conversion_reference` | Hong Kong Observatory Gregorian-Lunar Table | Tier 1 | 음력 6월 16일 → `2026-07-29` | `matched` |
| `saju-ext-iana-seoul-1987-dst-overlap` | `timezone_reference` | IANA tz 메일링리스트 2019-08-07 | **Tier 2** | DST 중복시각 → `dst_ambiguous_local_time` | `matched` |
| `saju-ext-iana-seoul-1987-dst-gap` | `timezone_reference` | IANA tz 메일링리스트 2019-08-07 | **Tier 2** | DST 갭시각 → `dst_nonexistent_local_time` | `matched` |

### 3.2 IANA DST 출처 상태

IANA tz 메일링리스트 2019-08-07 자료는 공식 tzdb 릴리스 파일이 아닌 커뮤니티 토론 자료입니다. `Tier 2 / community_tz_discussion`으로 등록되었으나 `verified_reference` 상태이며, 관측 결과(실제 `assessHistoricalSeoulTime()` 반환값)와 일치합니다.

공식 tzdb 릴리스(예: tzdata 2024a `asia` 파일)로 재확인하면 `Tier 1`으로 승격 가능합니다.

---

## 4. 미검증 범위 (Pending)

- 1951~2050년 KASI 한국천문연구원 전수 음양력 대조
- 1901~1950년 역사적 표준시 변경 구간 전수 명식
- 사주 강약·격국·용신·신살 (Experimental 모듈 유지)

---

## 5. 향후 게이트 승인 권고

현재 사주 코어는 `scoped_external_validation_passed`로 산출되었으나, 위 미검증 범위 및 IANA Tier 2 자료 재확인 완료 전까지 `docs/saju-final-readiness.md`의 `externalValidationStatus`는 **`pending`** 상태를 안전하게 유지합니다.
