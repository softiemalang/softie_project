# Mallang Time & Angle Core v0 Validation Report

## 1. Test Verification Overview
- **Execution Command**: `npm test`
- **Total Test Cases**: 277 passed / 0 failed
- **New Unit & Integration Tests**: 19 test cases added in `test/astrologyTimeAngleCore.test.js`

---

## 2. Key Numerical Validation Results

| Target Property | Test Condition / Input | Computed Value | Analytical Expectation | Absolute Error / Tolerance | Status |
|---|---|---|---|---|---|
| **J2000 JD UTC** | 2000-01-01 12:00:00 UTC | `2451545.0` | `2451545.0` | `< 1e-9 day` | ✅ Pass |
| **Unix Epoch JD UTC** | 1970-01-01 00:00:00 UTC | `2440587.5` | `2440587.5` | `< 1e-9 day` | ✅ Pass |
| **J2000 ERA** | JD UT1 = `2451545.0` | `280.46061837504°` | `280.46061837504°` | `< 1e-9 deg` | ✅ Pass |
| **J2000 Mean Obliquity** | JD TT = `2451545.0` | `23.439279444444445°` | `84381.406"` | `< 1e-6 arcsec` | ✅ Pass |
| **J2000 GMST** | JD UT1=2451545.0, TT=2451545.0 | `280.4606224044844°` | `280.4606224044844°` | `< 1e-9 deg` | ✅ Pass |
| **MC Cardinal Cases** | LMST 0°, 90°, 180°, 270° | `0°`, `90°`, `180°`, `270°` | Exact Quadrants | `< 1e-9 deg` | ✅ Pass |
| **ASC Cardinal Cases** | Lat 0°, LMST 0°, 90°, 180°, 270° | `90°`, `180°`, `270°`, `0°` | Exact Quadrants (+180° East) | `< 1e-9 deg` | ✅ Pass |

---

## 3. Availability Matrix & Fail-Closed Behavior
- **UTC Invalid**: 모든 파생 계산 즉시 차단 (`availability: "invalid"` / `"blocked"`).
- **DUT1 누락**: JD UT1, ERA 차단. JD TT 및 Mean Obliquity 독립 계산 가능.
- **TT-UTC 누락**: JD TT, Mean Obliquity 차단. JD UT1 및 ERA 독립 계산 가능.
- **위치 누락**: LMST, MC, ASC 차단. GMST까지 계산 가능.
- **위도 누락, 경도 존재**: LMST, MC 계산 가능, ASC 차단 (`latitude_unavailable`).
- **극점 (|latitude| >= 90 - 1e-10)**: MC 계산 가능, ASC 차단 (`ascendant_undefined_at_geographic_pole`).

---

## 4. External Astronomical Validation Summary
- **External Validation Status**: `externalAstronomicalValidationStatus: confirmed_for_declared_mean_model`
- **Primary Oracles**: IAU SOFA (2023-10-11 ANSI C), Swiss Ephemeris (v2.10.03 `swe_houses_armc`), USNO Data Service (v4.0.1)
- **SOFA Fixture Pass Rate**: 8 / 8 passed (Julian Date `< 1e-9 day`, ERA `< 1e-9 deg`, Obliquity `< 1e-10 deg`, GMST `< 1e-9 deg`)
- **Swiss Ephemeris Pass Rate**: 12 / 12 passed (Mean ASC `< 1e-7 deg`, Mean MC `< 1e-7 deg`)
- **Full Report**: 상세 출처, 오차 분포, Provenance 및 제외 범위는 [docs/astrology/time-angle-external-validation.md](file:///Users/softie/Documents/softie_project/docs/astrology/time-angle-external-validation.md) 문서 참조.
