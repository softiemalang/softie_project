# Solar Position Contract v0

## 1. 개요 및 목적
본 문서는 `Mallang Solar Position Core v0`의 좌표계, 원점, 시간척도, 물리적 위치 속성(position nature), 단위 및 레이어별 상태 표준 계약을 정의합니다.

제품 런타임의 독립성을 위해 외부 천문 런타임 엔진에 의존하지 않으며, 구현 전 수치·물리 계약을 고정하여 불명확한 추정이나 묵시적 변환(silent fallback)을 금지합니다.

---

## 2. 지원 범위
- **지원 날짜 범위**: `1900-01-01T00:00:00Z` ~ `2100-12-31T23:59:59Z`
- **대상 천체 (Target Body)**: `sun` (Solar System Body ID: 10)
- **관측자 중심 (Observer Center)**: `earth_geocenter` (Center Code: 500@399)

---

## 3. 계층 구조 (Layered Architecture)

### Layer A — Raw Solar Ephemeris (원시 역표 벡터)
기본 물리 역법 계산 결과로, 시간 및 직교좌표 벡터를 제공합니다.
- `targetBody`: `sun`
- `observerCenter`: `earth_geocenter`
- `positionNature`: `geometric`
- `referenceFrame`: ICRF 또는 명시적으로 문서화된 J2000 equatorial frame
- `timeArgument`: `TDB` (Barycentric Dynamical Time)
- `positionUnits`: `AU` (Astronomical Units)
- `velocityUnits`: `AU/day`
- `corrections`:
  - no light-time
  - no annual aberration
  - no gravitational deflection
  - no precession to date
  - no nutation
  - no atmospheric refraction

### Layer B — Mean Tropical Solar Position (평균 황도 위치)
점성학 기초 입력용 위치로, 평균 세차(mean precession of date)를 반영합니다.
- `zodiac`: `tropical`
- `reference`: mean ecliptic and equinox of date
- `longitudeDegrees`: `[0, 360)`
- `latitudeDegrees`: 평균 황도면에 대한 위도 (태양-지구 궤도면 미세 편차)
- `longitudeSpeedDegreesPerDay`: 일일 황경 이동 속도

### Layer C — Apparent Solar Position (진정 관측 위치)
광행차, 광시차, 장동(nutation)이 반영된 천문 관측용 위치입니다 (v0 미지원).
- light-time correction ($\approx 499.012\text{ s}$)
- annual aberration ($\approx 20.496''$)
- gravitational deflection
- nutation (true equinox of date)

---

## 4. 시간척도(Time Scale) 정책 및 TDB/TT 처리

1. **공식 입력 시간척도**: `TDB` (Barycentric Dynamical Time)
2. **Time & Angle Core 제공 시간척도**: `TT` (Terrestrial Time)
3. **TT/TDB 구분 및 대용(Proxy) 수치 산출 정책**:
   - $\text{TDB} - \text{TT}$ 차이는 지구 궤도 주기 운동에 따른 상대론적 변동으로 $|\text{TDB} - \text{TT}| < 1.7\text{ ms}$ 입니다.
   - 태양 황경 이동 속도 고려 시 $1.7\text{ ms}$에 의한 태양 위치 오차 추정치는 약 $0.00007''$ ($1.95 \times 10^{-8\circ}$) 입니다.
   - 본 추정치의 평가 상태:
     - `status`: `derived_upper-order estimate`
     - `externalValidationStatus`: `pending`
   - v0 정확도 목표범위 내에서 TT를 TDB의 근사값(proxy)으로 사용 시 아래 metadata를 명시해야 하며, TDB provider가 없고 TT proxy 옵션이 미지정된 경우 `calculationAvailability: blocked`를 반환합니다.

```json
{
  "timeArgumentRequested": "TDB",
  "timeArgumentProvided": "TT",
  "timeScaleApproximation": "tt_used_as_tdb",
  "approximationBoundDegrees": "0.0000001",
  "timeScaleValidationStatus": "pending"
}
```

---

## 5. 정확도 목표 정책 분리 (Tolerance Policy Dual-Layer)

천문 계산 정확도는 선택 모델의 수치 적합성과 서비스 목적 적합성을 명확히 분리하여 관리합니다.

1. **`modelConformanceTolerance`**: 선택한 천문 모델의 공식 선언 정확도 및 수치 구현 오차를 검증하는 기준.
2. **`astrologyUseTolerance`**: 최종 황경과 경계 분류가 점성학 서비스 목적에 충분한지 판단하는 기준 (0.01° 오차 범위).

현재 런타임 모델 미정 상태에서의 평가 메타데이터:
- `rawVectorToleranceStatus`: `provisional`
- `longitudeToleranceStatus`: `provisional`
- `speedToleranceStatus`: `provisional`

---

## 6. 경계 판정 메타데이터 (Boundary Risk Policy)

태양이 황도 12별자리(Sign) 경계 부근에 위치할 때 연산 오차로 인한 잘못된 분류를 방지하기 위해 경계 메타데이터를 포함합니다.

```json
{
  "nearestBoundaryDegrees": 0.0042,
  "declaredMaximumAngularErrorDegrees": 0.01,
  "boundaryRisk": "near_boundary"
}
```

- `boundaryRisk` 상태 값: `none`, `near_boundary`, `indeterminate`
- `near_boundary` 또는 `indeterminate` 상태일 때 단일 별자리 판정을 확정된 정보로 표기하지 않습니다.

---

## 7. Output Data & Evidence State Contract

```json
{
  "targetBody": "sun",
  "observerCenter": "earth_geocenter",
  "timeArgument": "TDB",
  "positionNature": "geometric",
  "referenceFrame": "ICRF",
  "position": { "x": 0.0, "y": 0.0, "z": 0.0, "unit": "AU" },
  "velocity": { "vx": 0.0, "vy": 0.0, "vz": 0.0, "unit": "AU/day" },
  "distanceAu": 1.0,
  "tropicalMeanEcliptic": {
    "longitudeDegrees": 0.0,
    "latitudeDegrees": 0.0,
    "longitudeSpeedDegreesPerDay": 0.9856
  },
  "status": {
    "solarModelDecisionStatus": "blocked",
    "formulaConformanceStatus": "not_implemented",
    "externalVectorValidationStatus": "pending",
    "externalLongitudeValidationStatus": "pending",
    "speedValidationStatus": "pending",
    "timeScaleValidationStatus": "pending",
    "serviceIntegrationStatus": "not_connected",
    "availableForInterpretation": false
  },
  "boundaryMetadata": {
    "nearestBoundaryDegrees": 0.0,
    "declaredMaximumAngularErrorDegrees": 0.01,
    "boundaryRisk": "indeterminate"
  }
}
```

---

## 8. 해석 사용 불가 규칙 (Unavailable for Interpretation)

다음 조건 중 하나라도 해당 시 `availableForInterpretation: false`로 고정합니다.
1. `solarModelDecisionStatus`가 `blocked`인 경우
2. `formulaConformanceStatus`가 `confirmed`가 아닌 경우
3. `externalVectorValidationStatus` 또는 `externalLongitudeValidationStatus`가 `confirmed_for_declared_model`이 아닌 경우
4. Layer B (Mean Tropical) 세차 변환 미적용 시 (Layer A 벡터만 존재 시)
5. `boundaryRisk`가 `indeterminate`인 경우
