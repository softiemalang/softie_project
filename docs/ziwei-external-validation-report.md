# 자미두수 독립 외부 검증 Fixture Pack v1 보고서 (원전 감사 개정판 4)

> **안내**: 본 보고서는 자미두수 외부 Fixture 6건에 대한 CText 공개 디지털 전사본(《紫微斗數全書》)의 서지 정보, 권차, 표, 행 대조 및 전사 감사 결과를 반영하여 동기화된 보고서입니다.

## 1. 개요 및 요약

- **검증 수행일**: 2026-07-27
- **대상 프로덕션 모듈**: `src/ziwei/fiveElementResolver.js`, `src/ziwei/starResolver.js`, `src/ziwei/transformationResolver.js`, `src/ziwei/minorStarResolver.js`, `src/ziwei/ziweiResolver.js`
- **단일 원천 파일**: `src/ziwei/externalZiweiFixtures.js`
- **전사본 Source Audit 보고서**: `docs/ziwei-source-audit-report.md`
- **정확한 저본·판본**: `pending_exact_edition_review`
- **판본 출판연도**: `pending` (`prefaceDate: 1550` 서문 연도만 기록)

### 집계 수치 (실제 Runner 동기화)

| 항목 | 수치 |
|---|---|
| totalFixtureCount | **6** |
| evaluatedFixtureCount | **4** |
| excludedFromValidationCount | **2** |
| excludedBoundaryContractsCount | **0** |
| notEvaluableSourceGapCount | **2** |
| pendingSourceReviewCountTotal | **6** |
| pendingSourceReviewCountEvaluated | **4** |
| observedMatches | **4** |
| observedMismatches | **0** |
| verifiedMatches | **0** (`pending_source_review` 안전 보존) |
| verifiedMismatches | **0** |
| outOfScope | **2** (`source_locator_unverified` 1건 + `insufficient_reproducible_input` 1건) |

> **verified 집계 정책**: `declaredReviewStatus === 'verified_reference'`인 fixture만 `verifiedMatches / verifiedMismatches`에 집계합니다. 자미두수 6건은 모두 `pending_source_review`이므로 verifiedMatches/verifiedMismatches 양쪽에서 엄격히 제외됩니다.

---

## 2. 출처 Tier별 집계

| Source Tier | totalFixtureCount | evaluatedFixtureCount | observedMatches | observedMismatches |
|---|---|---|---|---|
| Tier 2 (《紫微斗數全書》 CText 공개 디지털 전사본) | 6 | 4 | 4 | 0 |

---

## 3. 잠정 관측 결과 / 출처 검토 상세

> **중요**: 모든 자미두수 Fixture는 `pending_source_review` 상태입니다. 아래 결과는 **current transcription 대비 observed match 결과**이며, 원문 스캔 이미지/행 재검토 완료 전까지 verified로 간주하지 않습니다.

| Fixture ID | 검증 유형 | 검증 필드 | 잠정 관측 결과 | 전사본 서지 및 감사 결과 |
|---|---|---|---|---|
| `ziwei-ext-table-bureau-lookup` | `ruleset_table_reference` | 오행국 (`수이국 2`) | `observed: matched` | 卷一 · 五行局起例表 (甲己丙寅頭 丙子水二局) |
| `ziwei-ext-table-ziwei-placement` | `ruleset_table_reference` | 자미성 위치 (`id: ziwei` → `申`) | `observed: matched` | 卷一 · 定紫微星所在表 (水二局 15日 在申, 16日 在酉) |
| `ziwei-ext-table-four-transformations` | `ruleset_table_reference` | 사화 (갑간 `염정·파군·무곡·태양`) | `observed: matched` | 卷一 · 安十干四化星訣 (甲廉破武陽) |
| `ziwei-ext-table-minor-stars` | `ruleset_table_reference` | 6길성 위치 (`좌보·우필·문창·문곡·천괴·천월`) | `observed: matched` | 卷一 · 安諸吉星訣 (좌보 申, 우필 午, 문창 辰, 문곡 戌, 천괴 丑, 천월 未) |
| `ziwei-ext-chart-sample-classic-1-mingshen` | `worked_chart_ming_shen_reference` | 명궁·신궁 (`丑 / 未`) | `out_of_scope` | 卷二 · 五月午時安命在丑身在未例 (`source_locator_unverified`) |
| `ziwei-ext-chart-sample-classic-1-bureau` | `worked_chart_bureau_reference_pending` | 오행국 (`목삼국 3`) | `out_of_scope` | 卷二 · 五月午時安命在丑身在未例 (`insufficient_reproducible_input`) |

---

## 4. 미평가 출처 Gap 분석 (Out of Scope 2건)

1. **명신궁 픽스처 (`ziwei-ext-chart-sample-classic-1-mingshen`)**:
   - 《紫微斗數全書》 卷二 「安身命例」 수식은 5월 午시 적용 시 명궁 **子** / 신궁 **子**를 산출합니다.
   - "五月午時安命在丑身在未例" 문구는 정본 스캔/위치 미확정 상태로 `source_locator_unverified` 판정 및 미평가 차단(`out_of_scope`) 처리되었습니다. 엔진 결함으로 단정하지 않습니다.
2. **오행국 픽스처 (`ziwei-ext-chart-sample-classic-1-bureau`)**:
   - 원문 소제목에 생년천간이 누락되어 있어 명궁천간 및 오행국(목삼국) 재현이 불가능합니다 (`input.birthYearStem: null`).
   - `insufficient_reproducible_input` 판정 및 미평가 차단(`out_of_scope`) 처리되었습니다.

---

## 5. 최종 판정 및 후속 조치 권고

- **동적 게이트 상태**: `external_fixture_pack_started`
- **최종 판정**: **`PARTIAL_FIXTURE_PACK_REFERENCE_GAP`**
- **권고사항**:
  1. 원전 스캔 이미지/행 및 위치 재검토 전까지 `declaredReviewStatus`를 `pending_source_review`로 유지합니다.
  2. `docs/ziwei-final-readiness.md`의 `externalValidationStatus`는 **`pending`**으로 보존합니다.
  3. `independentlyReproducible: 'pending'` — 판본·페이지·표·원문 전사를 독립 확인하기 전까지 `true`를 사용하지 않습니다.
