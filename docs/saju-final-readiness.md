# 사주 코어 최종 준비 상태 보고서

> **최종 판정 요약**
>
> | 항목 | 상태 |
> |---|---|
> | `coreContractStatus` | `saju_core_frozen` |
> | `externalValidationStatus` | `pending` |
> | `experimentalModulesStatus` | `isolated_experimental` |
>
> `saju_core_frozen`은 내부 계산 계약과 불확실성 전달 구조의 동결을 의미하며,
> 독립 외부 정확성 인증 완료를 의미하지 않습니다.

---

## 1. 동결된 코어 범위 (Frozen Core)

다음 모듈과 계약은 동결 상태입니다. 외부 근거 없이 변경하지 않습니다.

### 1.1 사주 4기둥 계산 계약

| 기능 | 상태 |
|---|---|
| 연주·월주·일주·시주 계산 | ✅ frozen |
| 입춘 기준 절기월 전환 | ✅ frozen |
| 진태양시(True Solar Time) 보정 | ✅ frozen |
| 국내 기준 도시 경도 보정 | ✅ frozen |
| 야자시/조자시 분기 | ✅ frozen |
| 음력→양력 변환 (lunar2solar) | ✅ frozen |
| 오행·음양·십성·지장간 | ✅ frozen |
| 천간 관계 (합·충) | ✅ frozen |
| 지지 관계 (합·충·형·파·해) | ✅ frozen |
| 12운성 | ✅ frozen |

### 1.2 운 계산 계약

| 기능 | 상태 |
|---|---|
| 대운 (기준일 → isActive) | ✅ frozen |
| 세운·월운·일진 | ✅ frozen |
| 대운 역·순행 방향 계산 | ✅ frozen |

### 1.3 상태 계약 (State Contract)

5개 차원의 per-result 상태 계약이 모든 파이프라인 단계에서 보존됩니다.

```
stateContract {
  inputStatus:        'valid' | 'unknown_birth_time' | 'missing_input' | 'invalid'
  calculationStatus:  'calculated' | 'partial' | 'unsupported' | 'failed'
  verificationStatus: 'verified' | 'needs_verification' | 'candidate_required'
  interpretationStatus: 'ready' | 'experimental' | 'candidate_only'
  confidence:         'high' | 'medium' | 'low'
}
```

**계약 보존 경로**: `calculateSajuSystem()` → `buildInterpretationContext()` → `prepareThreeSystemInterpretationData()` → Export/Chat handoff

### 1.4 불확실성 전달 계약

다음 불확실성 유형은 `calculationUncertainty`에서 `InterpretationContext` → Export payload → Chat handoff까지 손실 없이 전달됩니다.

| 불확실성 유형 | 전달 필드 |
|---|---|
| 출생시각 미상 | `stateContract.inputStatus = 'unknown_birth_time'`, `verificationStatus = 'candidate_required'` |
| 시각 범위 입력 | `stateContract.verificationStatus = 'candidate_required'` |
| 절기 경계 (±20분) | `calculationUncertainty.solarTermBoundary.status = 'candidate_required'` |
| 역사 표준시 (1961-08-10 이전) | `calculationUncertainty.historicalTimezone.requiresVerification = true`, `stateContract.verificationStatus = 'needs_verification'` |
| DST 중복 구간 | `calculationUncertainty.historicalTimezone.candidates` (2개), `stateContract.verificationStatus = 'candidate_required'` |
| 진태양시 자정 경계 | `raw.timeBoundary.ziPeriodLabel` |

### 1.5 Capability Layer 계약

`engineCapabilities.js`의 `defaultStatus: 'complete'`는 사주 계산 기능이 연결된 상태임을 나타내는 **capability layer** 기본값입니다. 개별 계산 결과의 `stateContract.verificationStatus`와 독립적입니다.

- `defaultStatus: 'complete'` → 계산 기능 연결됨 (capability)
- `stateContract.verificationStatus: 'needs_verification'` → 특정 결과의 외부 검증 필요 (per-result)
- 두 레이어는 서로 덮어쓰지 않습니다.

---

## 2. 실험 모듈 범위 (Experimental Modules)

다음 모듈은 핵심 계산과 **분리된 실험적 파생 분석**입니다. 핵심 `stateContract.verificationStatus`를 승격하지 않습니다.

| 모듈 | 위치 | 상태 |
|---|---|---|
| 강약 (surface-support-heuristic) | `raw.experimental.strength` | `confidence: 'low'`, `epistemicMetadata` 포함 |
| 격국 | `raw.experimental.gyeokguk` | `confidence: 'low'`, `epistemicMetadata` 포함 |
| 용신/희신 | `raw.experimental.yongShin` | `confidence: 'low'`, `epistemicMetadata` 포함 |
| 신살 | `raw.experimental.shinsal` | `confidence: 'low'` |
| 고차 종격/가종격 후보 | `raw.experimental.gyeokguk.specialStructureCandidate` | `epistemicStatus: 'candidate'`, 자동 확정 불가 |

### 2.1 실험 모듈 분리 보장

- 출생시각 미상 시 `guardUnknownBirthTimeExperimental()`이 `raw.experimental` 전체를 `null`로 초기화합니다.
- `raw.experimental` 존재가 핵심 `stateContract.verificationStatus`를 변경하지 않습니다.
- Export payload에서 실험 항목은 항상 `[Experimental]` 라벨로 표시됩니다.
- Chat handoff Markdown에서 `[Experimental · low]` 태그가 명시됩니다.

---

## 3. 외부 검증 현황 (External Validation Status)

> **`externalValidationStatus: pending`**

### 3.1 회귀 검증 픽스처 현황

현재 `src/interpretationPrep/fixtures/sajuValidationFixtures.js`에는 **13개 내부 회귀 검증 픽스처**가 있습니다.

- `verificationStatus: 'regression_only'`: 12개 (현재 엔진 계산 계약의 일관성을 확인하는 내부 기준)
- `verificationStatus: 'pending_external_verification'`: 1개 (외부 근거 또는 학술 검토 대기)
- `verificationStatus: 'verified'` (독립 외부 출처 대조 완료): **0개**

**중요**: `regression_only` 픽스처는 현재 엔진 계산 계약의 일관성을 확인하는 내부 테스트 기준이며, 독립 외부 출처와 대조 완료된 검증값이 아닙니다.

### 3.2 음력 변환 검증 범위

| 범위 | 상태 |
|---|---|
| 1951~2050년 (KASI 비교 대기) | `verificationStatus: 'pending'` |
| 1901~1950년, 2051~2100년 | `verificationStatus: 'out_of_scope'` (외부 전통 명리 음양력 대조 테이블 사용) |

---

## 4. 알려진 제한 (Known Limitations)

### 4.1 시간 및 역사 표준시 제한

| 제한 항목 | 내용 |
|---|---|
| 1961-08-10 이전 출생 | 자오선 변경 이력으로 인해 `verificationStatus: 'needs_verification'` 자동 부여 |
| 1987~1988 DST | 중복 구간(02:00~02:59) → `verificationStatus: 'candidate_required'` (2개 후보 생성) |
| 출생시각 미상 | 시주 제외, 12개 시주 후보 생성, 강약·격국·용신·신살 미산출 |
| 절기 입절 ±20분 경계 | `solarTermBoundary.status: 'candidate_required'` |

### 4.2 지역 및 입력 제한

| 제한 항목 | 내용 |
|---|---|
| 지역 보정 | 국내 기준 도시 (서울, 부산, 광주 등) 한정. 해외 출생지 지원 없음 |
| 계산 범위 | 양력 1901년~2100년 |
| 음력 범위 | 1901년~2100년 (로컬 음력 테이블 기준) |

### 4.3 미지원 기능

- 해외 출생지 경도/위도 자유 입력
- 확장 신살 (귀문관살, 화개살 등 주요 신살 외)
- 고차 종격·가종격 자동 확정 판정
- 자미두수: 독립 외부 명반과의 대조 검증 전 (실험적)
- 서양 점성학: Ephemeris Adapter 미연결 (차단됨)

---

## 5. 향후 변경 허용 조건

### 5.1 핵심 코어 변경 허용 조건 (현재 동결)

다음 조건이 충족된 경우에만 핵심 코어를 변경할 수 있습니다:
- 독립 외부 출처(한국천문연구원, 학술 문헌 등)와의 대조 결과 근거 제시
- 변경 전 `regression_only` 픽스처의 기대값 재검토 및 갱신
- 변경된 픽스처의 `verificationStatus` 적절히 업데이트

### 5.2 실험 모듈 업데이트 허용 조건

- 강약·격국·용신 알고리즘 개선: 내부 `epistemicMetadata` 필드 갱신 동반 필수
- `confidence: 'low'` 또는 `epistemicStatus: 'candidate'` 해제 불가 (외부 검증 없이)
- 핵심 `stateContract.verificationStatus` 영향 없어야 함

### 5.3 신규 기능 추가 허용 조건

- 외부 검증 Ephemeris Adapter: `adapterVerified: true` 계약 충족 시 점성학 `availableForChat` 승격 가능
- 확장 신살 추가: 전통 명리 문헌 출처 및 `epistemicMetadata` 포함 필수
- 해외 출생지 지원: 경도/위도 기반 진태양시 보정 검증 후 추가 가능

---

## 6. 감사 수행 내역

**감사 일시**: 2026-07-27

**발견 및 수정 사항**:

| 항목 | 발견 | 조치 |
|---|---|---|
| `interpretationContext.js` stateContract fallback | `\|\| 'verified'`/`\|\| 'high'`가 `needs_verification` 상태 암묵 승격 가능 | `?? null`로 교체, 5개 필드 정확 보존 |
| `threeSystemPrepPipeline.js` status 매핑 | `needs_verification` → `'available'`로 잘못 매핑 | `verificationStatus` 변수화 후 `status` 파생 |
| `sajuValidationFixtures.js` 헤더 | `Golden & Regression Cases` 문구 | `내부 회귀 검증 픽스처`로 교체 |
| `engineCapabilities.js` | capability layer 의미 주석 없음 | 레이어 구분 주석 추가 |
| `statusResolver.js` | per-result state layer 설명 없음 | 5개 필드 계약 주석 추가 |
| 테스트 누락 | 상태 계약 전달·보존 검증 없음 | `test/sajuCoreContract.test.js` 8개 테스트 추가 |

**검증 결과**:
- `npm test`: 204/204 통과 (실패 0개)
- `npm run build`: 성공
- `git diff --check`: 이상 없음

---

*이 문서는 `coreContractStatus: saju_core_frozen` 판정의 근거 기록입니다.*
