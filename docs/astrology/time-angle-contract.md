# Mallang Time & Angle Core v0 Contract

## 1. Overview
`Mallang Time & Angle Core v0`는 정규화된 UTC 시각, 관측지 위경도, 외부에서 명시적으로 공급받은 시간척도 offset(DUT1, TT-UTC)을 입력받아 Julian Date, Earth Rotation Angle, Greenwich/Local Mean Sidereal Time, Mean Midheaven(MC), Mean Ascendant(ASC)를 계산하는 순수 결정론적 천문 코어 모듈입니다.

- **Rule Set Version**: `mallang-time-angle-core-v0`
- **Model ID**: `iau2000-era__iau2006-gmst-mean-obliquity`
- **Calendar Model**: `proleptic-gregorian-v0` (지원 범위: 1900-01-01 ~ 2100-12-31)
- **Sidereal Time & Obliquity Type**: `mean` (Apparent / Nutation 미포함)

---

## 2. Input Contract Schema
- `schemaVersion`: `"astrology-time-angle-input-v0"` (필수)
- `calendar`: `"proleptic_gregorian"` (필수)
- `candidateId`, `inputStatus`, `verificationStatus`: 상태 유지
- `utc`: `{ year, month, day, hour, minute, second }` (숫자 직접 검증, 문자열/Date 객체 파싱 금지)
- `location`: `{ geographicLatitudeDegrees, longitudeDegreesEast }` (동경 양수, 서경 음수)
- `timeScaleOffsets`: `{ ut1MinusUtcSeconds, ttMinusUtcSeconds, sourceStatus }`

---

## 3. Output Contract Schema
- `schemaVersion`: `"astrology-time-angle-result-v0"`
- `ruleSetVersion`: `"mallang-time-angle-core-v0"`
- `modelId`: `"iau2000-era__iau2006-gmst-mean-obliquity"`
- `availableForInterpretation`: `false`
- `integrationStatus`: `"not_connected"`
- `calendar`: `{ availability, julianDateUtc, epistemicStatus, ruleId, ruleSetVersion, sourceRefs }`
- `timeScales`: `{ julianDateUt1, julianDateTt, deltaTSeconds }`
- `earthOrientation`: `{ earthRotationAngleDegrees, meanObliquityDegrees, greenwichMeanSiderealTimeDegrees, localMeanSiderealTimeDegrees }`
- `angles`: `{ midheaven, ascendant }`
- `rawAngles`: 후속 Raw Chart Composer 공급용 (`ascendant`, `midheaven` available 시에만 필드 포함, blocked 시 0 생성 금지)

---

## 4. Verification & Readiness Statuses
- **formulaConformanceStatus**: `confirmed` (지시서 명시 수식 및 상수의 수치 일치 검증 완료)
- **externalAstronomicalValidationStatus**: `confirmed_for_declared_mean_model` (IAU SOFA 2023-10-11 & Swiss Ephemeris v2.10.03 오프라인 회귀 fixture 검증 완료)
- **serviceIntegrationStatus**: `not_connected` (서비스 API/UI 및 Prep 파이프라인 미연결)
- **availableForInterpretation**: `false` (해석 결과 생성 및 전달 불가)

---

## 5. Operational Boundaries
- 본 v0 코어는 서비스 파이프라인, Prep Pipeline, DB, UI, 외부 API에 자동 연결되지 않습니다.
- 실제 천체(태양/달/행성) 위치 계산이나 하우스 커스프(Placidus 등) 계산을 포함하지 않습니다.
