# 사주 엔진 검증 구조 보완 walkthrough

## 범위

이번 변경은 사주 해석 기능을 추가하지 않고, 기존 명식 계산을 유지하면서 확정값·후보값·실험값의 경계를 정리하는 데 한정했다. 신살 규칙이나 신규 해석 규칙은 추가하지 않았다.

## 주요 설계 결정

### 1. 핵심 계산 프로필

- `SAJU_CALCULATION_PROFILE`을 추가해 `Asia/Seoul`, 동경 135도 기준 자오선, 경도 보정·NOAA 균시차, 진태양시 자정 기준 자시 규칙을 하나의 프로필 ID로 기록한다.
- `calculateFourPillars`가 직접 `YYYY-MM-DD`, 실제 달력 날짜, `HH:MM`, 시간대와 옵션 범위를 검증한다.
- 메타데이터의 `solarTimeMethod`와 `appliedCorrections`는 실제 적용된 보정과 일치한다. 태양시 보정을 끈 경우 `civil time only`로 기록한다.
- 프로필용 지장간 표는 core engine의 `HIDDEN_STEMS`에서 투영해 중복 상수표를 제거했다.

### 2. 후보별 계산 파이프라인

`systems.saju.raw.candidates`에 후보별 입력, 네 기둥, 일간, 대운, 강약·격국·용신을 분리 저장한다.

- 절기 경계, DST, 국내 위치, 출생시각 미상 후보를 같은 구조로 보존한다.
- 명식 네 기둥 문자열이 같은 후보는 중복 제거한다.
- `candidateComparison.common`에는 모든 후보가 공유하는 값, `candidateComparison.differences`에는 후보별 차이를 저장한다.
- 원자료의 `calculationUncertainty`는 DST 중복 시간처럼 명식이 같아지는 경우에도 시간 해석 후보를 별도로 보존한다.
- UI와 conversation export는 동일한 `raw.candidates`와 `raw.candidateComparison`을 사용한다.

### 3. 음력 변환 상태

음력 변환은 다음 상태를 사용한다.

- `verified`: 독립 외부 대조가 완료된 경우에만 사용
- `pending`: 현재 1951~2050 로컬 테이블처럼 대조 범위는 있으나 전수 검증 전인 경우
- `out_of_scope`: 현재 외부 대조 범위 밖인 경우

현재 구현에서는 독립 대조가 완료된 범위를 `verified`로 표시하지 않는다. 출처 문구도 KASI 일치로 오해할 수 없도록 `KASI comparison pending`으로 정리했다.
구현 내부에서도 KASI 검증 완료를 뜻하는 이름을 사용하지 않고 `isInKasiReferenceRange`로 구분해, 참조 범위와 검증 완료 상태가 섞이지 않도록 했다.

### 4. 실험적 파생 판정

강약·격국·용신은 계속 `Experimental` 휴리스틱으로 유지한다. 후보 상태에서는 단일 실험 판정을 UI·conversation export에 확정값처럼 내보내지 않으며, 후보별 결과는 후보 데이터 안에서만 비교할 수 있다. 용신 confidence는 `high`, `medium`, `low`를 그대로 표시한다.
지원 범위 패널에서도 이 세 판정과 기존 신살 프로필을 구조 계산 목록과 분리해 `실험적 파생 판정 (Experimental)`로 표시한다.

### 5. 독립 검증 fixture

`src/saju/engine/externalValidationFixtures.js`에 현재 엔진 출력과 분리된 외부 기준 fixture를 추가했다.

- HKO 2026 절기·일주 기준
- HKO 2026 음양력 변환 경계
- IANA Seoul 1987 DST 중복·존재하지 않는 시간대

각 fixture는 source URL과 함께 저장하며, 회귀 fixture와 외부 검증 fixture를 구분한다.
절기 fixture는 실제 황경 경계 탐색 테스트에 연결해 공개 시각과 엔진 경계의 허용 오차를 검증한다.

## 검증 명령

- `npm test`
- `npm run build`
- `git diff --check`

커밋·푸시는 승인 전 수행하지 않는다.

## 남은 리스크

- 음력 테이블은 아직 `verified` 범위가 없다.
- 강약·격국·용신의 고전 체계 정합성은 검증 대상이 아니라 여전히 실험 영역이다.
- DST 중복 시간은 두 시간 해석을 보존하지만, 두 해석이 동일 명식으로 귀결되면 후보 파이프라인에서는 중복 제거된다. 시간 해석 자체는 원자료 uncertainty에 남는다.
