# 자미두수 공개 전사본 Source Audit v1 보고서 (개정판 4)

> **개요**: 본 보고서는 현재 `pending_source_review` 상태인 자미두수 외부 Fixture 6건에 대해 CText 공개 디지털 전사본(《紫微斗數全書》)의 서지 정보, 권차, 표, 행 대조 및 수식 파라미터를 재검토하고 Evidence Matrix를 작성한 결과를 기록합니다.

---

## 1. 감사 요약 (Audit Summary)

- **감사 대상 총 Fixture 수**: 6개 (`totalFixtureCount: 6`)
- **검증 평가 Fixture 수**: 4개 (`evaluatedFixtureCount: 4` - 4개 표대조 항목)
- **미평가 차단 Fixture 수**: 2개 (`excludedFromValidationCount: 2`, `notEvaluableSourceGapCount: 2` - 고전예제 명신궁 출처미확정 1건 + 오행국 입력불충분 1건)
- **검토 전사본**: CText 공개 디지털 전사본 (《紫微斗數全書》 / CText Digital Edition)
- **정확한 저본·판본**: `pending_exact_edition_review`
- **판본 출판연도**: `pending` (`prefaceDate: 1550` 서문 연도만 기록)
- **관측 대조 결과**: `observedMatches: 4`, `observedMismatches: 0`, `outOfScope: 2`
- **verifiedMatches**: **0건** (`declaredReviewStatus: pending_source_review` 안전 보존)
- **엔진 수식 수정 수**: **0건** (프로덕션 계산 로직 변경 0건 준수)

---

## 2. Evidence Matrix

| Fixture ID | 규칙 | 입력 충분성 | 전사본 서지 정보 | 원문 위치 | observed | source verdict | engine verdict | 최종 상태 |
|---|---|---|---|---|---|---|---|---|
| `ziwei-ext-table-bureau-lookup` | 오행국 60갑자 표 | 충분 | CText 공개 디지털 전사본 (prefaceDate: 1550, edition: pending_exact_edition_review) | 卷一 · 五行局起例表 (甲己丙寅頭 丙子水二局) | `matched` | `provisional_transcription_match` | `observed_match_pending_source_review` | `pending_source_review` |
| `ziwei-ext-table-ziwei-placement` | 자미성 포국표 | 충분 | CText 공개 디지털 전사본 (prefaceDate: 1550, edition: pending_exact_edition_review) | 卷一 · 定紫微星所在表 (水二局 十五日 在申) | `matched` (기대값 `酉`→`申` 정정 후) | `provisional_transcription_match` | `observed_match_pending_source_review` (`reference_transcription_conflict` 정정) | `pending_source_review` |
| `ziwei-ext-table-four-transformations` | 생년십간 사화표 | 충분 | CText 공개 디지털 전사본 (prefaceDate: 1550, edition: pending_exact_edition_review) | 卷一 · 安十干四化星訣 (甲廉破武陽) | `matched` | `provisional_transcription_match` | `observed_match_pending_source_review` | `pending_source_review` |
| `ziwei-ext-table-minor-stars` | 6길성 포국표 | 충분 | CText 공개 디지털 전사본 (prefaceDate: 1550, edition: pending_exact_edition_review) | 卷一 · 安諸吉星訣 (左輔辰順, 右弼戌逆, 昌戌逆, 曲辰順, 魁鉞丑未) | `matched` (기대값 월/시 오기 정정 후) | `provisional_transcription_match` | `observed_match_pending_source_review` (`reference_transcription_conflict` 정정) | `pending_source_review` |
| `ziwei-ext-chart-sample-classic-1-mingshen` | 고전 예제 명신궁 | 충분 (월·시) | CText 공개 디지털 전사본 (prefaceDate: 1550, edition: pending_exact_edition_review) | 卷二 · 五月午時安命在丑身在未例 | `out_of_scope` | `source_locator_unverified` | `not_evaluable_pending_source_resolution` | `pending_source_review` (`isExcludedFromValidationCount: true`) |
| `ziwei-ext-chart-sample-classic-1-bureau` | 고전 예제 오행국 | 불충분 | CText 공개 디지털 전사본 (prefaceDate: 1550, edition: pending_exact_edition_review) | 卷二 · 五月午時安命在丑身在未例 (생년천간 누락) | `out_of_scope` | `insufficient_reproducible_input` | `not_evaluable_missing_stem_input` | `pending_source_review` (`isExcludedFromValidationCount: true`) |

---

## 3. 오호둔(五虎遁) 및 납음(納音) 도출 검증

- **오호둔 법칙**: 甲/己년은 丙寅宮에서 시작합니다 (甲己之年丙作首).
  - 寅宮 = 丙寅
  - 卯宮 = 丁卯
  - 辰宮 = 戊辰
  - 巳宮 = 己巳
  - 午宮 = 庚午
  - 未宮 = 辛未
  - 申宮 = 壬申
  - 酉宮 = 癸酉
  - 戌宮 = 甲戌
  - 亥宮 = 乙亥
  - 子宮 = 丙子
  - 丑宮 = **丁丑** (Note: 乙丑은 丙/辛년의 결과이며, 甲년의 丑宮 명궁 천간은 丁丑입니다).
- **납음오행**: 丙子·丁丑 澗下水 → **水二局 2** (甲년 명궁 丑은 水二局에 대응합니다).
- **木三局 丑宮 대응 검증**:
  - 木三局 丑宮의 60갑자 납음은 **癸丑 桑柘木**입니다 (壬子·癸丑 桑柘木).
  - 丑宮이 癸丑이 되려면 寅宮 시작 천간이 壬寅이어야 하므로, 이는 **丁/壬년** 생의 결과입니다.
  - 壬丑은 壬(양간) + 丑(음지) 조합으로 60갑자 체계상 불가능한 간지 조합입니다.
- **결론**: 원문 예제 "五月午時 安命在丑身在未例"에서 목삼국(木三局) 산출은 생년천간 甲 조합으로는 재현이 불가능하며(`insufficient_reproducible_input`), bureau 픽스처를 분리하여 `out_of_scope`로 처리합니다.

---

## 4. Fixture별 정밀 감사 상세 (Detailed Findings)

### 4.1 `ziwei-ext-table-bureau-lookup` (오행국 대조)
- **입력**: `birthYearStem: '甲'`, `mingGongBranch: '子'`
- **원문 구절**: 《紫微斗數全書》 卷一 · 五行局起例表: "甲己之年丙作首" (인궁 丙寅 시작 → 자궁 丙子). 丙子 澗下水 (水二局 2).
- **분석**: 연간 甲과 명궁 子 조합 시 명궁 간지는 丙子가 되며, 납음오행은 간하수(水二局 2)입니다. 현 전사본 대비 observed match가 확인되었습니다.
- **판정**: `sourceVerdict: provisional_transcription_match`, `engineVerdict: observed_match_pending_source_review`.

### 4.2 `ziwei-ext-table-ziwei-placement` (자미성 포국 대조)
- **입력**: `bureauNumber: 2` (수이국), `lunarDay: 15`
- **초안 기대값**: `ziweiPalaceBranch: '酉'`
- **원문 구절**: 《紫微斗數全書》 卷一 · 定紫微星所在表: 水二局 十四日在申, 十五日在申, 十六日在酉.
- **분석**: 원문표 수이국 15일의 자미성 위치는 **申**입니다 (16일이 酉). 초기 초안 기대값 `酉`는 16일의 행을 오기한 `reference_transcription_conflict`로 확인되었습니다. 프로덕션 엔진(`calculateZiweiBranch(2, 15)`) 산출값(`申`)과 현 전사본이 일치합니다.
- **조치**: Fixture 기대값을 원문 기준인 `'申'`으로 정정하였습니다.
- **판정**: `sourceVerdict: provisional_transcription_match`, `engineVerdict: observed_match_pending_source_review`.

### 4.3 `ziwei-ext-table-four-transformations` (사화 대조)
- **입력**: `birthYearStem: '甲'`
- **원문 구절**: 《紫微斗數全書》 卷一 · 安十干四化星訣: "甲廉破武陽" (甲: 廉貞化祿, 破軍化權, 武曲化科, 太陽化忌).
- **분석**: 엔진 산출 결과(염정 화록, 파군 화권, 무곡 화과, 태양 화기)와 현 전사본이 일치합니다.
- **판정**: `sourceVerdict: provisional_transcription_match`, `engineVerdict: observed_match_pending_source_review`.

### 4.4 `ziwei-ext-table-minor-stars` (6길성 포국 대조)
- **입력**: `birthYearStem: '甲'`, `lunarMonth: 5`, `hourBranch: '午'`
- **원문 구절**: 《紫微斗數全書》 卷一 · 安諸吉星訣
  - 천괴·천월: "甲戊庚牛羊" (甲년: 天魁在丑, 天鉞在未) → 丑, 未
  - 좌보: "左輔辰上順連月" (辰宮 1월 시작 順行 5월) → 辰(1) 巳(2) 午(3) 未(4) **申(5)**
  - 우필: "右弼戌上逆連月" (戌宮 1월 시작 逆行 5월) → 戌(1) 酉(2) 申(3) 未(4) **午(5)**
  - 문창: "文昌戌上逆行時" (戌宮 子시 시작 逆行 午시[7번째]) → 戌(1) 酉(2) 申(3) 未(4) 午(5) 巳(6) **辰(7)**
  - 문곡: "文曲辰上順行時" (辰宮 子시 시작 順行 午시[7번째]) → 辰(1) 巳(2) 午(3) 未(4) 申(5) 酉(6) **戌(7)**
- **분석**: 5월 午시 6길성 배치는 **좌보 申, 우필 午, 문창 辰, 문곡 戌, 천괴 丑, 천월 未**입니다. 엔진 산출값과 현 전사본 위치가 일치합니다. 초안 기대값은 1월/子시 위치를 오기한 `reference_transcription_conflict`였습니다.
- **조치**: Fixture 기대값을 원전 기준 위치로 정정하였습니다.
- **판정**: `sourceVerdict: provisional_transcription_match`, `engineVerdict: observed_match_pending_source_review`.

### 4.5 `ziwei-ext-chart-sample-classic-1-mingshen` 및 `bureau` (고전 예제 분리 대조)
- **4.5.1 명신궁 Fixture (`ziwei-ext-chart-sample-classic-1-mingshen`)**:
  - **입력**: `lunarMonth: 5`, `hourBranch: '午'`
  - **원문 공식 대조**: 《紫微斗數全書》 卷二 「安身命例」 수식(寅起生月 順查, 生月起子時 逆查命宮, 順查身宮)에 5월 午시 적용 시 명궁 **子** / 신궁 **子**가 산출됩니다.
  - **현상**: "五月午時安命在丑身在未例" 텍스트는 해당 권차 내 공식 수식과 충돌하며 정본 스캔 및 서지 위치가 미확정 상태입니다.
  - **판정**: `sourceVerdict: source_locator_unverified`, `engineVerdict: not_evaluable_pending_source_resolution`, `isExcludedFromValidationCount: true` (`out_of_scope`). 엔진 결함으로 단정하지 않습니다.
- **4.5.2 오행국 Fixture (`ziwei-ext-chart-sample-classic-1-bureau`)**:
  - **입력**: `birthYearStem: null` (생년천간 누락)
  - **기대값**: `bureauName: '목삼국'`, `bureauNumber: 3`
  - **판정**: `sourceVerdict: insufficient_reproducible_input`, `engineVerdict: not_evaluable_missing_stem_input`, `isExcludedFromValidationCount: true` (`out_of_scope`).

---

## 5. 최종 결론 및 동적 게이트 상태

- **엔진 코드 변경**: **0건**
- **totalFixtureCount**: 6개
- **evaluatedFixtureCount**: 4개
- **excludedFromValidationCount**: 2개
- **excludedBoundaryContractsCount**: 0개
- **notEvaluableSourceGapCount**: 2개
- **observedMatches**: 4개
- **observedMismatches**: 0개
- **verifiedMatches**: **0건** (`declaredReviewStatus: pending_source_review` 안전 보존)
- **종합 게이트 상태**: **`PARTIAL_FIXTURE_PACK_REFERENCE_GAP`** (미평가 출처 gap 및 pending_source_review로 인해 ready 승격 차단)
