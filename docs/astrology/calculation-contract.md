# Astrology Rule Core v0 Calculation Contract

## 1. 개요
본 문서는 `Mallang Astrology Rule Core v0` (`mallang-astrology-rule-core-v0`)의 도출 규칙 및 입출력 데이터 계약을 정의합니다.

## 2. 핵심 원칙 및 경계
- **v0는 천체 위치를 자체 계산하지 않는다**: 실제 태양, 달, 행성, ASC, MC의 천체 위치 계산은 본 규칙 코어 범위 밖이며 외부에서 검증된 천문 원시값(`astrology-raw-chart-v0`)을 입력받습니다.
- **입력 좌표계 및 원시값 계약**: 열대황도(tropical), 지구중심(geocentric), 날짜 기준 황도(ecliptic-of-date) 원시값을 입력 계약으로 받습니다.
- **하우스 시스템**: v0 규칙 코어는 **Whole Sign 하우스** 시스템 하나만 지원합니다.
- **후속 과제**: 실제 천문 계산 엔진(Astronomy Core) 구현 및 Placidus 등 여타 하우스 시스템 연산은 후속 작업으로 이관됩니다.
- **외부 코드 미포함**: Swiss Ephemeris, Astronomy Engine, IAU SOFA 등 외부 천문 라이브러리나 출처 불명의 라이선스 코드가 포함되지 않았습니다.

## 3. 입출력 규격 및 도출 규칙
- **입력 스키마**: `astrology-raw-chart-v0`
- **입력 상태 보존**: `candidateId`, `inputStatus`, `verificationStatus`는 파생 과정에서 임의로 승격되거나 변경되지 않으며 그대로 보존됩니다.
- **별자리 판정**: 황경 `[0, 360)` 범위를 `[0, 30)` 등의 반열린 구간으로 나누어 결정론적으로 별자리와 내부 도수를 결정합니다. 경계 1 arcminute 이내일 경우 `near_sign_boundary` 상태를 기록합니다.
- **운동 상태**: 일일 황경 속도(`longitudeSpeedDegreesPerDay`)와 `MOTION_EPSILON_DEGREES_PER_DAY` (0.0000001)를 비교하여 `direct`, `retrograde`, `stationary`, `unavailable`을 판정합니다.
- **Whole Sign 하우스**: ASC 별자리를 1하우스로 하여 천체 별자리 인덱스와의 상대 차이로 1~12하우스를 계산합니다. ASC 누락 시 `houses` 기능은 `blocked` 처리됩니다.
- **주요 Aspect & Phase**: 5대 Major Aspect(conjunction, sextile, square, trine, opposition)에 대한 Orb 매칭 및 상대 속도 기반 `applying`, `separating`, `exact`, `indeterminate`, `unavailable` Phase를 계산합니다.
- **룰러 및 분포**: ASC 별자리의 전통/현대 차트 룰러를 도출하며, 지원 10대 천체 및 개인 5대 천체의 원소·양식·극성을 가중치 없이 집계합니다.
