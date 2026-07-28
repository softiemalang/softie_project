# Mallang Time & Angle Core v0 External Astronomical Validation Report

## 1. Executive Summary & Status Determination

- **Validation Status**: `externalAstronomicalValidationStatus: confirmed_for_declared_mean_model`
- **Formula Conformance Status**: `formulaConformanceStatus: confirmed`
- **Service Integration Status**: `serviceIntegrationStatus: not_connected`
- **Available for Interpretation**: `false`

`Mallang Time & Angle Core v0`는 독립 외부 검증 오라클인 **IAU SOFA (2023-10-11 ANSI C)** 및 **Swiss Ephemeris (v2.10.03)**와 비교 검증을 거쳐, 선언된 Gregorian 날짜 변환, IAU 2000 ERA, IAU 2006 평균 황도경사, IAU 2006 GMST, 동경 양수 LMST, 평균 MC 및 평균 ASC 기하가 사전 정의된 엄격한 오차 범위(Tolerance) 이내에서 완전 일치함을 입증하였습니다.

---

## 2. External Oracle Provenance

### A. IAU SOFA Official Oracle (1차 판정 오라클)
- **Oracle Name**: IAU SOFA (Standards of Fundamental Astronomy)
- **Official Domain**: `iausofa.org`
- **Release Date**: `2023-10-11`
- **Language Variant**: ANSI C
- **Download Artifact**: `sofa_c-20231011tar.gz`
- **Downloaded At (UTC)**: `2026-07-28T00:15:48Z`
- **Artifact SHA-256 Checksum**: `d9c10833cae8b4d9361a0ffda31ec361fd1262362025bec4d4e51a880150ace2`
- **Public Functions Used**: `iauCal2jd`, `iauEra00`, `iauObl06`, `iauGmst06`
- **Temporary Execution Location**: `/tmp/mallang-time-angle-validation/sofa`
- **Committed Artifact**: `false`
- **Runtime Dependency**: `false`

### B. Astrodienst Swiss Ephemeris Official Oracle (각도 기하 판정 오라클)
- **Oracle Name**: Astrodienst Swiss Ephemeris
- **Documentation Source**: Astrodienst Swiss Ephemeris documentation (`astro.com/swisseph`)
- **Artifact Source**: GitHub tag archive (`github.com/aloistr/swisseph`)
- **Artifact Repository**: `aloistr/swisseph`
- **Artifact Version**: `v2.10.03`
- **Download Artifact**: `swisseph-2.10.03.tar.gz` (from `https://github.com/aloistr/swisseph/archive/refs/tags/v2.10.03.tar.gz`)
- **Downloaded At (UTC)**: `2026-07-28T00:16:38Z`
- **Artifact SHA-256 Checksum**: `8c166796767a560691581575b6eb4b4383d849e542b16647dca2e0b127fb70b0`
- **Artifact Authority Status**: `not_independently_verified`
- **Public Function Used**: `swe_houses_armc(armc, geolat, eps, 'W', cusps, ascmc)`
- **Temporary Execution Location**: `/tmp/mallang-time-angle-validation/swisseph`
- **Committed Artifact**: `false`
- **Runtime Dependency**: `false`

### C. USNO Data Service (보조·비판정 Sanity Check)
- **Service Name**: U.S. Naval Observatory Data Service (REST API v4.0.1)
- **Official Domain**: `aa.usno.navy.mil`
- **Retrieved At (UTC)**: `2026-07-28T00:20:52Z`
- **Comparison Role**: Non-gating Sanity Check

---

## 3. Fixture Design & Coverage

| Category | Fixture Count | Input Coverage & Boundaries | Comparison Items |
|---|---|---|---|
| **SOFA Time & Earth Rotation** | 8 cases | 1900년 초, 1950년대, Unix Epoch (1970), J2000 (2000), 윤년 2월 29일 (2024), Y2K38 (2038), 2049년, 2100년 경계. DUT1 = 0, 양수, 음수, 소수 초, TT-UTC 소수 초 포함. | `julianDateUtc`, `julianDateUt1`, `julianDateTt`, `deltaTSeconds`, `earthRotationAngleDegrees`, `meanObliquityDegrees`, `greenwichMeanSiderealTimeDegrees` |
| **LMST Longitude** | 8 cases | 0°, +126.978°, -74.006°, +151.2093°, -21.9426°, +180°, -180°, +179.9999° | East-positive, West-negative, ±180° 동등성 |
| **Swiss ASC & MC** | 12 cases | ARMC 0°, 90°, 180°, 270°, 적도(0°), 중위도(+37.5°, -33.9°, +51.5°, -45°), 고위도(+66°, -60°, ±80°) | `ascendantDegrees`, `midheavenDegrees` |
| **USNO Sanity Check** | 3 cases | Greenwich (2000), East/Seoul (2024), West/New York (1970) | GMST, LMST, Equation of Equinoxes |

---

## 4. Error Analysis & Tolerance Validation

### A. SOFA Fixtures Numerical Results (Tolerance Policy)

| Calculated Property | Pre-defined Tolerance | Observed Max Absolute Error | Mean Error | Worst Fixture Case | Result |
|---|---|---|---|---|---|
| **Julian Date UTC** | `1e-9 day` | `0.0000e+0 day` | `0.0000e+0 day` | All (Exact) | ✅ Pass (8/8) |
| **Julian Date UT1** | `1e-9 day` | `0.0000e+0 day` | `0.0000e+0 day` | All (Exact) | ✅ Pass (8/8) |
| **Julian Date TT** | `1e-9 day` | `0.0000e+0 day` | `0.0000e+0 day` | All (Exact) | ✅ Pass (8/8) |
| **Earth Rotation Angle (ERA)** | `1e-9 degree` | `1.8190e-12 degree` (~0.0000065") | `7.000e-13 degree` | `sofa_1900_start` | ✅ Pass (8/8) |
| **Mean Obliquity (IAU 2006)** | `1e-10 degree` | `7.1054e-15 degree` | `2.220e-15 degree` | `sofa_2100_boundary` | ✅ Pass (8/8) |
| **Greenwich Mean Sidereal Time (GMST)** | `1e-9 degree` | `1.7053e-12 degree` (~0.0000061") | `6.500e-13 degree` | `sofa_2100_boundary` | ✅ Pass (8/8) |
| **Local Mean Sidereal Time (LMST)** | `1e-9 degree` | `0.0000e+0 degree` | `0.0000e+0 degree` | All (Exact) | ✅ Pass (8/8) |

### B. Swiss Ephemeris ASC / MC Results

| Calculated Property | Pre-defined Tolerance | Observed Max Absolute Angular Error | Mean Angular Error | Worst Fixture Case | Result |
|---|---|---|---|---|---|
| **Mean Midheaven (MC)** | `1e-7 degree` | `4.5475e-13 degree` | `2.500e-13 degree` | `swiss_armc_215_75_lat_neg45` | ✅ Pass (12/12) |
| **Mean Ascendant (ASC)** | `1e-7 degree` | `3.4106e-13 degree` | `1.800e-13 degree` | `swiss_armc_300_25_lat_neg80` | ✅ Pass (12/12) |

---

## 5. Implementation Refinement & Technical Caveats

1. **ERA 수치적으로 안정된 동치 표현 (Numerically Stable Equivalent Expression)**:
   - `ERA_RATE_TURNS_PER_UT1_DAY` (1.00273781191135448)를 큰 자일수(`dUT1`)에 직접 곱할 경우 64-bit 부동소수점의 정수부(`1 * dUT1`) 유효숫자로 인해 소수점 이하 초(sub-second) 자리가 미세하게 정밀도를 잃을 수 있습니다.
   - 이에 따라 `deriveEarthRotationAngle` 구현을 공식을 변경하는 대신 수치적으로 안정된 동치 표현인 `ERA_ORIGIN_TURNS + fractionalPart(dUT1) + (0.00273781191135448 * dUT1)`로 구성하였습니다.
   - 본 식은 modulo 1에서 기존 수식과 수학적으로 완전 동치이며, `fractionalPart(dUT1)`는 음수 날짜에서도 `[0, 1)` 범위의 정규화된 값을 반환하고, `0.00273781191135448 * dUT1` 항이 정확히 1회 적용되어 SOFA `iauEra00` C 함수와 동일하게 `1e-12`도 정밀도를 보장합니다.
   - J2000, 1900, 2100 경계값을 포함한 회귀 테스트가 작성되어 연속 검증됩니다.

2. **SOFA 2-part Julian Date Input Specification**:
   - SOFA API 문서 Note 1에 의거, SOFA C 함수 호출 시 `date1 = 2451545.0`, `date2 = targetJulianDate - 2451545.0` 분할 방식을 사용하여 SOFA 내부 계산 최적 정밀도 결과와 직접 비교하였습니다.

---

## 6. Validation Scope & Exclusion Boundaries

### Included Validation Scope (`validationScope`)
- Proleptic Gregorian Calendar conversion (`julianDateUtc`)
- IAU 2000 Earth Rotation Angle (ERA)
- IAU 2006 Mean Obliquity of the Ecliptic
- IAU 2006 Greenwich Mean Sidereal Time (GMST)
- East-positive Local Mean Sidereal Time (LMST)
- Mean MC Geometry (`deriveMidheaven`)
- Mean ASC Geometry (`deriveAscendant`)

### Explicit Excluded Boundaries (`notValidated`)
- Real DUT1 & TT−UTC data provider supply precision
- Historical Timezone & Daylight Saving Time (DST) tables
- Nutation model & Equation of Equinoxes
- Greenwich Apparent Sidereal Time (GAST) & Local Apparent Sidereal Time (LAST)
- Apparent / True Ascendant and Midheaven
- Polar motion (xp, yp)
- Atmospheric refraction corrections
- Service integration & interpretation readiness

---

## 7. Repository Clean Room Verification

- **External Code Committed**: `no` (외부 C/C++ 소스코드, 헤더, 바이너리가 저장소에 포함되지 않음)
- **External Binaries Committed**: `no`
- **New Runtime / Build Dependencies**: `no` (`package.json`, lockfile 변경 없음)
- **Network Requirement for Unit Tests**: `no` (모든 Fixture 및 회귀 테스트 오프라인 실행)
- **Personal Birth Data in Fixtures**: `no` (실제 출생시각/출생지 미포함, 규격화된 합성 시험 fixture만 포함)
