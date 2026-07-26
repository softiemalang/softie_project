# 자미두수 출생 명반 코어 준비 상태 보고서

> **최종 판정 요약**
>
> | 항목 | 상태 |
> |---|---|
> | `exactSingleTimePath` | `ziwei_natal_core_conditionally_ready` |
> | `candidateBoundaryPath` | `safely_blocked` |
> | `overallNatalCoreStatus` | `ziwei_natal_core_conditionally_ready` |
> | `externalValidationStatus` | `pending` |
> | `timingStatus` | `unsupported` |
> | `brightnessStatus` | `unsupported` |
> | `extendedMinorStarsStatus` | `unsupported` |
>
> `ziwei_natal_core_conditionally_ready`는 단일 확정 입력 경로에 대한 고정 RuleSet 계산 계약이 정립되어 있으나,
> 독립 외부 명반 출처와의 전수 대조 검증은 수행 대기 중(`pending`)임을 의미합니다.

---

## 1. 코어 동결 및 검증 범위 (v1 Scope)

### 1.1 출생 명반 포국 수식 계약 (Single Primary Chart)

다음 계산 수식 및 배치 구조는 고정 RuleSet 버전(`ziwei-fixed-ruleset-experimental-v1`) 기반으로 일관되게 동작합니다:

| 기능 | 상태 |
|---|---|
| 음력 달력 변환 연동 (`solar2lunar`) | ✅ conditionally_ready |
| 명궁(命宮) 및 신궁(身宮) 지지 산출 | ✅ conditionally_ready |
| 인두자(寅頭字) 기반 명궁 천간 도출 | ✅ conditionally_ready |
| 60갑자 납음 오행국(수이·목삼·금사·토오·화육) 산출 | ✅ conditionally_ready |
| 명궁 기준 12궁 시계방향 1:1 배치 | ✅ conditionally_ready |
| 음력 일수 및 오행국 기준 자미·천부성 도출 | ✅ conditionally_ready |
| 14주성 전체 12궁 배치 (동궁/공궁 포국) | ✅ conditionally_ready |
| 생년 천간(10간) 기준 생년 사화(록·권·과·기) 4개 매핑 | ✅ conditionally_ready |
| 6길성 보조성(좌보·우필·문창·문곡·천괴·천월) 배치 | ✅ conditionally_ready |
| 삼방사정(본궁·대궁·삼합궁) 및 인접궁 구조 산출 | ✅ conditionally_ready |
| 궁별 성요 Context 및 주제별 해석 패턴 생성 | ✅ conditionally_ready |

---

## 2. 안전 차단 정책 (Fail-Closed Boundaries)

### 2.1 입력 불확실성 및 후보 조건 차단 (`candidateBoundaryPath`)

다음 입력 조건에서는 단일 명반으로 축약하거나 듀얼 재계산 미구현 상태에서 primary 명반의 해석 근거를 Chat에 전달하지 않도록 **완전히 차단(`safely_blocked`)**합니다:

| 불확실성 조건 | 처리 방식 | 상태 |
|---|---|---|
| 출생시각 미상 (`timeAccuracy !== 'exact'`) | Chat handoff 차단 | `availableForChat: false`, `candidate_required` |
| 자시 경계 (`23:00~01:00`) | Chat handoff 차단 | `availableForChat: false`, `candidate_required` |
| 윤달 출생 (`isLeapMonth: true`) | Chat handoff 차단 | `availableForChat: false`, `candidate_required` |
| 필수 계산 인자 누락 | 명반 생성 중단 | `chart: null`, `inputStatus: 'missing_input'` |

---

## 3. 미지원 범위 (Explicitly Excluded)

다음 기능은 현재 버전에서 구현되지 않았으며, 명시적으로 지원 범위에서 제외됩니다:

| 제외 항목 | 처리 상태 |
|---|---|
| 운한(運限) 계산 (대한·소한·유년·유월·유일·유시, 대운 이동, 유년 사화) | `timingStatus: unsupported` |
| 묘왕리함(廟旺利陷, Brightness/Dignity) 밝기 체계 | `brightnessStatus: unsupported` (`null` 처리) |
| 6살성 및 잡성 (록존·경양·타라·화성·영성·지공·지겁·천마·홍란·천희 등) | `extendedMinorStarsStatus: unsupported` |
| 궁간 사화 (자화/유화 등 궁 천간 기반 사화) | `unsupported` |

---

## 4. 독립 외부 검증 현황 (External Validation Status)

> **`externalValidationStatus: pending`**

- **externally verified fixture 수**: **0개** (독립 외부 문헌/명반 출처와 직접 전수 대조 완료된 fixture 없음)
- **regression-only fixture 수**: **6개** (`knownCharts.js` 3개 + `starPlacementCharts.js` 3개 - 내부 계산 수식 고정용 기준값)
- **해석 벤치마크 케이스 수**: **5개** (`benchmarkCases.js` 5개)
- **검증 설명**: 현재 저장소의 모든 자미두수 픽스처는 고정 RuleSet의 코드 재현성을 확인하기 위한 `regression_only` 가공 데이터이며, 독립 외부 만세력/자미두수 명반 출처와의 정합성 입증 완료를 의미하지 않습니다.

---

## 5. 5대 상태 계약 (State Contract) 명세

자미두수의 모든 산출 결과는 5개 차원의 per-result 상태 계약을 따릅니다:

```
stateContract {
  inputStatus:          'valid' | 'missing_input' | 'unknown_birth_time' | 'invalid'
  calculationStatus:    'calculated' | 'partial' | 'unsupported' | 'failed'
  verificationStatus:   'needs_external_verification' | 'candidate_required'
  interpretationStatus: 'experimental' | 'candidate_only'
  confidence:           'medium' | 'low'
}
```

- **정상 단일입력**: `inputStatus: 'valid'`, `calculationStatus: 'calculated'`, `verificationStatus: 'needs_external_verification'`, `interpretationStatus: 'experimental'`, `confidence: 'medium'`
- **후보 필요조건**: `verificationStatus: 'candidate_required'`, `interpretationStatus: 'candidate_only'`, `confidence: 'low'`
- **미상/누락입력**: `inputStatus: 'missing_input'`, `calculationStatus: 'partial'`, `interpretationStatus: 'candidate_only'`, `confidence: 'low'`
- **승격 금지**: 자미두수 내부 산출 및 전파 경로에서 자동으로 `verified`나 `high`로 승격하지 않습니다.
