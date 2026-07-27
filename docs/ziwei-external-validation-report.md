# 자미두수 독립 외부 검증 Fixture Pack v1 보고서 (개정판 2)

> **안내**: 이전 Runner 초안 결과는 자기대조·ID 정규화·출처 재현성 문제가 확인되어 무효 처리되었으며, 본 보고서는 프로덕션 모듈 실제 재실행 결과로 전면 개정되었습니다.
> `independentSourceCount: 1`(제목 문자열 집계) 등 이전 표현은 전부 제거되었습니다.

## 1. 개요 및 요약

- **검증 수행일**: 2026-07-27
- **대상 프로덕션 모듈**: `src/ziwei/fiveElementResolver.js`, `src/ziwei/starResolver.js`, `src/ziwei/transformationResolver.js`, `src/ziwei/minorStarResolver.js`, `src/ziwei/ziweiResolver.js`
- **단일 원천 파일**: `src/ziwei/externalZiweiFixtures.js`

### 집계 수치 (실제)

| 항목 | 수치 |
|---|---|
| fixtureCount | 5 |
| uniqueReferenceDocumentCount | 1 (`doc-ziwei-quan-shu`) |
| independentPublisherCount | 1 (`pub-quan-shu-classic`) |
| pendingSourceReviewCount | 5 (전체) |
| observedMatches | **2** |
| observedMismatches | **3** |
| verifiedMatches | **0** (모두 `pending_source_review`) |
| verifiedMismatches | **0** |

> **verified 집계 정책**: `declaredReviewStatus === 'verified_reference'`인 fixture만 `verifiedMatches / verifiedMismatches`에 집계합니다. 자미두수 5건은 모두 `pending_source_review`이므로 verifiedMatches/verifiedMismatches 양쪽에서 엄격히 제외됩니다.

---

## 2. 출처 Tier별 집계

| Source Tier | fixtureCount | observedMatches | observedMismatches |
|---|---|---|---|
| Tier 2 (《紫微斗數全書》 明文海本 / Classic Text Project) | 5 | 2 | 3 |

---

## 3. 잠정 관측 결과 / 출처 검토 대기

> **중요**: 모든 자미두수 Fixture는 `pending_source_review` 상태입니다. 아래 결과는 **잠정 관측 대조 결과**이며, 원문 스캔 이미지/행 재검토 완료 전까지 verified로 간주하지 않습니다.

| Fixture ID | 검증 유형 | 검증 필드 | 잠정 관측 결과 | 불일치 사유 |
|---|---|---|---|---|
| `ziwei-ext-table-bureau-lookup` | `ruleset_table_reference` | 오행국 (`수이국 2`) | `observed: matched` | 없음 |
| `ziwei-ext-table-four-transformations` | `ruleset_table_reference` | 사화 (갑간 `염정·파군·무곡·태양`) | `observed: matched` | 없음 (의미 기반 성명 대조 적용) |
| `ziwei-ext-table-ziwei-placement` | `ruleset_table_reference` | 자미성 위치 (`id: ziwei` → `酉`) | `observed: mismatched` | `needs_investigation` |
| `ziwei-ext-table-minor-stars` | `ruleset_table_reference` | 6길성 위치 (`좌보·우필·문창·문곡·천괴·천월`) | `observed: mismatched` | `needs_investigation` |
| `ziwei-ext-chart-sample-classic-1` | `worked_chart_reference` | 고전 명반 (命丑 身未 목삼국) | `observed: mismatched` | `needs_investigation` |

---

## 4. 대조 불일치 분석 (Mismatch — 잠정 관측 기준)

1. **자미성 위치**: 수이국 15일 기준 출처 vs 엔진 산출 위치 불일치. 오행국·음력일 매핑 파라미터 해석 차이 조사 필요.
2. **6길성 포국**: 문창/문곡 포국 인덱싱 차이 발생. 5월 오시 공식 및 인덱싱 재검토 필요.
3. **고전 예제 명반**: 명궁 丑/신궁 未/목삼국 vs 엔진 명궁 子/신궁 子/수이국. 명궁 산출 수식 및 인덱스 파라미터 해석 차이 조사 필요.

---

## 5. 잠정 관측 일치 범위 / 미검증 범위

### 5.1 잠정 관측 일치 범위 (출처 검토 대기)
- 60갑자 납음 오행국 표 - 甲子 수이국 매핑 관측 일치
- 생년십간 사화표 - 갑간 사화 의미 기반 성명 대조 관측 일치

### 5.2 미검증 범위 (Pending Reference Gap)
- 14주성 포국 수식 전수 고전 명반 대조
- 자미두수 운한, 묘왕리함, 6살성 및 잡성 (`unsupported` 유지)

---

## 6. 최종 판정 및 후속 조치 권고

- **동적 게이트 상태**: `external_fixture_pack_started`
- **최종 판정**: **`PARTIAL_FIXTURE_PACK_REFERENCE_GAP`**
- **권고사항**:
  1. 원전 스캔 이미지/행 재검토 전까지 `declaredReviewStatus`를 `pending_source_review`로 유지합니다.
  2. `docs/ziwei-final-readiness.md`의 `externalValidationStatus`는 **`pending`**으로 보존합니다.
  3. `independentlyReproducible: 'pending'` — 판본·페이지·표·원문 전사를 독립 확인하기 전까지 `true`를 사용하지 않습니다.
