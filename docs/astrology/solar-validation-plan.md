# Solar Position Validation Plan & Oracle Specs v0

## 1. 개요
본 문서는 `Mallang Solar Position Core v0` 구현체의 독립 검증을 위해 1차 오라클(JPL Horizons), 2차 오라클(IAU SOFA), 점성학 오라클(Swiss Ephemeris)의 역할 분담, API/파라미터 표준 계약, 검증 픽스처(Fixture) 범주, 정확도 허용 오차(Tolerance) 및 승격 기준을 정의합니다.

본 검증 데이터 생성 및 오라클 호출은 저장소 외부 임시 작업공간에서 독립 수행되며, 저장소 런타임 코드에 외부 엔진 라이브러리가 포함되지 않도록 Clean-Room 원칙을 엄격히 준수합니다.

---

## 2. 외부 오라클 역할 및 파라미터 계약

### A. Primary Oracle — NASA JPL Horizons (Layer A Vector Validation)
JPL Horizons는 Layer A (Raw Geocentric Geometric Solar Vector)의 주 오라클로 사용됩니다.

#### Horizons 파라미터 계약
- `COMMAND`: `'10'` (Sun)
- `CENTER`: `'500@399'` (Earth Geocenter)
- `EPHEM_TYPE`: `'VECTORS'`
- `REF_SYSTEM`: `'ICRF'`
- `REF_PLANE`: `'FRAME'`
- `VEC_CORR`: `'NONE'` (Geometric vector)
- `OUT_UNITS`: `'AU-D'` (AU and days)
- `TIME_TYPE`: `'TDB'`
- `VEC_TABLE`: `'3'` (Position & Velocity)
- `CSV_FORMAT`: `'YES'`

#### Horizons 응답 헤더(Header) 검증 필수 계약
요청 파라미터 전달만으로 계약 충족을 간주하지 않으며, **반드시 실제 Horizons 응답 텍스트 헤더에서 다음 항목을 검증**합니다.
1. `Target body name`: `Sun (10)`
2. `Center body name`: `Earth (399)`
3. `Center-site name`: `BODY CENTER` 또는 `GEOCENTRIC`
4. `Reference frame/plane`: `ICRF frame`
5. `Corrections`: `geometric / NONE`
6. `Units`: `AU and days`
7. `Time scale`: `TDB`

---

### B. Secondary Oracle — IAU SOFA (Mathematical Reference)
- **역할**: 고정확도 좌표 변환 및 역표 수식의 2차 교차 검증 (C 참조 수식)
- **제약**: 저장소 포함 금지, 런타임 호출 금지, C/Fortran 포팅 금지. 비-게이팅(non-gating) 보조 검증 전용.

---

### C. Astrology-facing Oracle — Swiss Ephemeris (Layer B Longitude Validation)
Layer B의 geometric, geocentric, tropical, mean-equinox-of-date 태양 위치를 검증하는 플래그 계약을 정의합니다.

#### 유효 Swiss Ephemeris 플래그 계약
- `SEFLG_SWIEPH`: Swiss Ephemeris 기본 역표 데이터 사용
- `SEFLG_SPEED`: 황경 이동 속도 산출
- `SEFLG_TRUEPOS`: True geometric position / 광시차(light-time) 보정을 적용하지 않음
- `SEFLG_NONUT`: Mean equinox of date (장동 Nutation 제거)
- **기본 암묵적 플래그 (Default behavior)**:
  - `tropical`: default (`SEFLG_SIDEREAL` 미지정)
  - `geocentric`: default (`SEFLG_HELCTR`, `SEFLG_BARYCTR`, `SEFLG_TOPOCTR` 미지정)

#### 플래그 주의사항 및 개별 역할 구분
- 존재하지 않는 비공식 플래그(`SEFLG_TROPICAL`, `SEFLG_NOLIGHT` 등) 사용을 엄격히 금지합니다.
- **개별 플래그의 명확한 역할 분리**:
  - `SEFLG_TRUEPOS`: True geometric position을 산출하며 광시차(light-time) 보정이 적용되지 않음.
  - `SEFLG_NOABERR`: 연주 광행차(annual aberration) 보정을 비활성화함.
  - `SEFLG_NOGDEFL`: 태양 중력에 의한 빛 굴절(gravitational light-deflection) 보정을 비활성화함.
  - `geocentric`: `SEFLG_HELCTR`, `SEFLG_BARYCTR`, `SEFLG_TOPOCTR`를 지정하지 않은 기본 동작임.
  - `topocentric parallax`: 계산이 geocentric 기본 동작이기 때문에 적용되지 않는 것이며, `SEFLG_TRUEPOS` 설정에 의해 제거되는 것이 아님.
- 오라클 호출 시 반환 구조체에서 아래 메타데이터를 필수 기록합니다.
  - `requestedFlags`: 요청 플래그 bitmask
  - `returnedFlags`: `swe_calc()`가 실제로 반환한 bitmask
  - `ephemerisActuallyUsed`: 실제 적용된 역표 소스
- 만약 Swiss Ephemeris가 요청 플래그를 비활성화하거나 타 역표(Moshier 등)로 fallback한 경우 해당 픽스처는 검증 채택에서 제외합니다.

---

## 3. Validation Fixture Design (검증 사례 카테고리)

### 1. 날짜 범위 및 에포크 (Date Coverage)
- `1900-01-01T00:00:00Z` (시작 경계)
- `1957-10-04T19:28:34Z` (스푸트니크 에포크)
- `1970-01-01T00:00:00Z` (Unix Epoch)
- `2000-01-01T12:00:00Z` (J2000.0 Standard Epoch)
- `2024-02-29T12:00:00Z` (윤년 2월 29일)
- `2038-01-19T03:14:07Z` (Y2038 boundary)
- `2050-06-21T18:00:00Z` (21세기 중반)
- `2100-12-31T23:59:59Z` (종료 경계)

### 2. 태양 궤도 위치 특수 지점 (Orbital Points)
- **근일점 (Perihelion)** / **원일점 (Aphelion)**
- **춘분점 (Vernal Equinox)** / **하지점 (Summer Solstice)** / **추분점 (Autumnal Equinox)** / **동지점 (Winter Solstice)**
- **황도 $0^{\circ}$ Wrap 부근**: 황경 $359.99^{\circ} \leftrightarrow 0.01^{\circ}$ 경계
- **별자리(Sign) $30^{\circ}$ 경계 부근**: 황경 $29.999^{\circ}, 30.001^{\circ}$ 등

### 3. 속도 산출 사례 (Velocity Test Cases)
- 분석적 미분 속도($\mathbf{v}_{\text{analytic}}$)와 수치 차분 속도($\mathbf{v}_{\text{finite\_diff}}$) 검증

---

## 4. 오차 정책 및 Tolerance 분리 (Dual-Layer Tolerance)

아직 런타임 모델이 확정되지 않았으므로 임의의 일률적 오차 기준을 강제하지 않으며, 정확도를 두 층위로 분리합니다.

1. **`modelConformanceTolerance`**: 선택한 역법 모델의 공식 선언 정밀도와 수치 구현 일치성을 검증하는 오차 기준.
2. **`astrologyUseTolerance`**: 점성학 서비스 분류 목적에 충분한지 평가하는 기준 (황경 오차 $0.01^{\circ}$ 이내).

현재 오차 평가 메타데이터 상태:
- `rawVectorToleranceStatus`: `provisional`
- `longitudeToleranceStatus`: `provisional`
- `speedToleranceStatus`: `provisional`

---

## 5. 검증 상태 승격 기준 (Status Upgrade Policy)

후속 구현 코드는 다음 기준을 충족해야 상태가 승격됩니다.

1. **`confirmed_for_declared_model`**:
   - 선택된 천문 모델의 공식 선언 오차에 부합하는 `modelConformanceTolerance`가 확정되고, 모든 검증 픽스처가 해당 오차 이내로 합격한 경우.
2. **`limited_for_astrology_use`**:
   - 황경 오차가 `astrologyUseTolerance` ($0.01^{\circ}$) 이내에 들어오나, 모델 자체 오차로 인해 `near_boundary` 경계 메타데이터가 동반되는 경우.
3. **`failed`**:
   - 황경 오차 $> 0.01^{\circ}$ 이거나 궤도 경계 부근에서 수치 수렴에 실패한 경우.
