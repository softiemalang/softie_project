# Phase Astro-0 · Natal Astrology Adapter 계약

상태: 설계안. 아직 구현 또는 활성화되지 않음.

## 1. 설계 원칙

1. UI, 시간대 해석, 천문 계산, 프로젝트 Context 변환, Chat formatting을 분리한다.
2. 천문 엔진에는 확정된 UTC Instant만 전달한다.
3. local time이 gap/overlap이면 임의로 하나를 선택하지 않는다.
4. Adapter의 자기 주장만으로 `verified` 또는 `availableForChat`이 되지 않는다.
5. 검증 registry의 artifact hash와 실행 중 artifact hash가 일치해야 한다.
6. 행성, 각도, 하우스는 서로 다른 availability와 confidence를 가질 수 있다.
7. aspect와 원소·양태는 천문 엔진 값이 아니라 프로젝트 RuleSet의 파생값임을 분리한다.
8. Natal 단계에서 transit 또는 현재 시기 값을 만들지 않는다.

## 2. 권장 파일 구조

```text
src/astrology/
├── adapters/
│   ├── astrologyAdapterContract.js
│   ├── verifiedEphemerisAdapter.js
│   └── blockedSimulationAdapter.js
├── time/
│   └── astrologyTimeResolver.js
├── validation/
│   ├── astrologyActivationRegistry.js
│   ├── astrologyGoldenFixtures.js
│   └── astrologyValidationRunner.js
├── astrologyPipeline.js
├── astrologyContract.js
├── astrologyPatternContext.js
└── astrologyTopicSelector.js
```

`planetResolver.js`와 `houseResolver.js`는 Lab Simulation 자산으로 보존하되 제품 `astrologyPipeline.js`가 import하지 않는다.

## 3. 두 단계 입력 계약

### 3.1 Public Headless Pipeline

UI는 다음 계약만 호출한다.

```js
prepareNatalAstrology({
  subjectName,
  birthDate,          // YYYY-MM-DD, 현지 달력 날짜
  birthTime,          // HH:mm[:ss] 또는 null
  birthTimeAccuracy,  // exact | range | unknown
  birthTimeRange,     // { start, end } 또는 null
  timezone,           // IANA ID
  latitude,
  longitude,
  elevationMeters,
  disambiguation,     // reject | explicit_offset | preserve_candidates
  explicitOffset,     // overlap 사용자가 확인한 경우에만
  zodiac: 'tropical',
  coordinateSystem: 'geocentric',
  houseSystem: 'placidus',
  nodeType: 'true',
})
```

Public Pipeline의 책임:

- 문자열과 좌표 범위 검증
- IANA timezone 기반 현지 시각 해석
- UTC candidate 생성
- Adapter 호출
- candidate consensus와 uncertainty 생성
- Activation Gate와 입력별 eligibility 판정

### 3.2 Low-level Ephemeris Adapter

실제 천문 엔진에는 timezone을 다시 해석시키지 않는다.

```js
calculateNatalChart({
  utcInstant,         // ISO 8601 Z 또는 epoch milliseconds
  latitude,
  longitude,
  elevationMeters: 0,
  zodiac: 'tropical',
  coordinateSystem: 'geocentric',
  houseSystem: 'placidus',
  nodeType: 'true',
  requestedEphemerisMode: 'swisseph',
})
```

Adapter는 local date/time을 받지 않는다. `utcInstant`가 없거나 Z/epoch로 확정되지 않았으면 거부한다.

## 4. 시간대와 좌표 계약

### 4.1 저장해야 하는 값

```js
{
  localDateTime: '1987-10-11T02:30:00',
  timezone: 'Asia/Seoul',
  timezoneDatabase: {
    provider: 'IANA',
    version: 'runtime-reported-or-build-pinned',
  },
  resolutionStatus: 'ambiguous',
  utcCandidates: [
    { utcInstant: '...', offset: '+10:00', assumption: 'earlier_offset' },
    { utcInstant: '...', offset: '+09:00', assumption: 'later_offset' },
  ],
  latitude: 37.57,
  longitude: 126.97,
}
```

### 4.2 상태

| 상태 | 의미 | 처리 |
| --- | --- | --- |
| `resolved` | UTC Instant 하나 | 단일 chart 계산 가능 |
| `ambiguous` | DST overlap 등으로 2개 이상 | 모든 후보 계산 후 consensus만 사용 |
| `nonexistent` | DST gap | 자동 보정 금지, 사용자 확인 필요 |
| `historical_needs_verification` | tzdb 이전 기록 또는 지역 표준시 불확실 | 후보 보존, confidence 하향 |
| `unknown_time` | 출생시각 없음 | local day 범위로 행성 후보만 검토, 각도·하우스 미지원 |
| `range_time` | 시간 범위 | 범위 candidate 계산, 안정적인 사실만 consensus |

### 4.3 구현 방침

- IANA timezone을 프로젝트가 UTC로 해석한다.
- 기본 disambiguation은 `reject` 또는 `preserve_candidates`다. JavaScript `Date`의 암묵적 earlier/later 선택을 사용하지 않는다.
- Temporal API는 gap/overlap을 표현할 수 있지만 2026-07-26 기준 일부 주요 브라우저에서 제한적이므로, Astro-1에서 native Temporal만 전제하지 않는다.
- timezone resolver의 구현체와 tzdb version을 계산 메타데이터에 기록한다.
- 위도는 `[-90, 90]`, 경도는 `[-180, 180]` 범위로 검증한다. 동경 양수, 서경 음수 계약을 고정한다.
- 한국 전용 사주 입력 제한과 Astrology의 해외 IANA/좌표 범위는 별도 계약으로 유지한다.

### 4.4 출생시각 미상

- 특정 임의 시각, 특히 정오를 “출생 행성 위치”로 확정하지 않는다.
- local date가 만드는 전체 UTC 범위를 candidate interval로 보존한다.
- interval 안에서 변하지 않는 sign/retrograde만 consensus 사실 후보가 될 수 있다.
- 달처럼 빠른 천체는 degree range와 sign candidates를 보존한다.
- ASC, MC, house cusp, planet house는 `unavailable: birth_time_required`다.

## 5. Adapter 출력 계약

```js
{
  adapter: {
    id: 'softie-swiss-wasm',
    adapterVersion: 'semver',
    engine: 'swiss-ephemeris',
    engineVersion: 'exact',
    sourceCommit: 'git-sha',
    licenseMode: 'professional | agpl',
    licenseDecisionId: 'internal-record-id',
    calculationModeRequested: 'swisseph',
    calculationModeEffective: 'swisseph',
    binarySha256: 'sha256',
    dataFiles: [
      { name: '...', sha256: 'sha256' },
    ],
  },
  inputBasis: {
    utcInstant: '...Z',
    julianDayUt: 0,
    localDateTime: '...',
    timezone: 'Area/City',
    timezoneDatabaseVersion: '...',
    latitude: 0,
    longitude: 0,
    elevationMeters: 0,
  },
  chartSystem: {
    zodiac: 'tropical',
    coordinateSystem: 'geocentric',
    houseSystemRequested: 'placidus',
    houseSystemEffective: 'placidus',
    nodeType: 'true',
    positionFrame: 'ecliptic_of_date',
  },
  planets: [
    {
      id: 'sun',
      longitude: 0,
      latitude: 0,
      distanceAu: 0,
      longitudeSpeed: 0,
      sign: 'aries',
      degreeInSign: 0,
      retrograde: false,
      sourceStatus: 'calculated',
    },
  ],
  angles: {
    ascendant: { longitude: 0, sign: 'aries', degreeInSign: 0 },
    mc: { longitude: 0, sign: 'aries', degreeInSign: 0 },
  },
  houses: [
    {
      house: 1,
      cuspLongitude: 0,
      sign: 'aries',
      degreeInSign: 0,
    },
  ],
  aspects: [],
  elementsAndModalities: {
    elements: { fire: 0, earth: 0, air: 0, water: 0 },
    modalities: { cardinal: 0, fixed: 0, mutable: 0 },
    ruleSetVersion: '...',
  },
  componentAvailability: {
    planets: { status: 'available', confidence: 'pending_gate' },
    node: { status: 'available', confidence: 'pending_gate' },
    angles: { status: 'available', confidence: 'pending_gate' },
    houses: { status: 'available', confidence: 'pending_gate' },
    aspects: { status: 'derived', confidence: 'pending_gate' },
  },
  calculationMeta: {
    status: 'adapter_connected_unverified',
    confidence: 'not_available',
    verificationStatus: 'unverified',
    warnings: [],
    engineReturnFlags: [],
    engineErrors: [],
    sourceVersions: {},
  },
}
```

### 필수 불변식

- 모든 longitude는 finite number이고 `[0, 360)`이다.
- `degreeInSign === longitude % 30`은 정규화 허용 오차 안에서 일치한다.
- 정확한 시각/좌표이고 Placidus가 성공한 경우 house는 정확히 12개다.
- `houseSystemEffective !== houseSystemRequested`이면 houses/angles를 성공으로 처리하지 않는다.
- 요청/실제 ephemeris mode 불일치는 전체 계산 실패다.
- 역행은 `longitudeSpeed < 0` 근거로 만들고 speed를 함께 보존한다.
- `applying`을 계산하지 못하면 `null`이다.
- 오류 문자열 또는 fallback flag를 버리지 않는다.

## 6. Aspect와 파생 Feature 계약

Swiss Ephemeris는 위치와 속도의 근거를 제공하고, natal aspect 선정은 프로젝트 RuleSet이 담당한다.

```js
{
  bodyA: 'venus',
  bodyB: 'mars',
  type: 'square',
  exactAngle: 90,
  actualAngle: 0,
  orb: 0,
  applying: true | false | null,
  ruleSetVersion: 'softie-natal-aspects-v1',
  source: 'derived_from_verified_longitudes',
}
```

- 허용 orb는 별도 versioned RuleSet에 둔다.
- `applying`은 상대 angular speed와 aspect error의 시간 방향으로 계산한다.
- 현재 `aspectResolver.js`의 `applying: true` 상수는 제품에 재사용하지 않는다.
- 원소·양태 count도 포함 천체 목록과 가중치 RuleSet을 명시한다.
- pattern context는 `activationGate.status === passed`인 Context만 받는다.

## 7. Candidate와 Uncertainty 계약

```js
{
  candidates: [
    {
      candidateId,
      inputAssumption,
      utcInstant,
      chart,
    },
  ],
  candidateSetConsensus: {
    factual: {
      stablePlanets: [],
      signConsensus: {},
      retrogradeConsensus: {},
      angles: null,
      houses: null,
    },
    ranges: {
      moonLongitude: { min, max, wrapsZero, signCandidates: [] },
    },
  },
  candidateFacts: [],
  uncertainFactors: [
    {
      field: 'utc_instant',
      reason: 'dst_overlap',
      impact: ['moon', 'ascendant', 'mc', 'houses', 'aspects'],
      candidateIds: [],
    },
  ],
}
```

- candidate 수가 2개 이상이면 서로 다른 값을 단일 factual 값으로 올리지 않는다.
- 원형 각도의 min/max는 0° 경계를 고려한 circular range로 표현한다.
- 출생시각 범위가 넓으면 샘플링만으로 “변하지 않음”을 선언하지 않는다. extrema 또는 충분성 증명이 필요하다.
- 각도·하우스 불확실성은 행성 위치 confidence를 자동으로 낮추지 않고 구성요소별로 유지한다.

## 8. CalculationContext 매핑

### 유지

- `systemType`
- `subjectName`
- `chartSystem`
- `planets`
- `angles`
- `houses`
- `aspects`
- `elementsAndModalities`
- `candidateSetConsensus`, `candidateFacts`, `uncertainFactors`
- `calculationConfidence.stateContract`

### 추가

```js
{
  adapterIdentity,
  inputBasis,
  componentAvailability,
  calculationMeta,
  activationGate: {
    registryId,
    status,
    checkedArtifactFingerprint,
  },
}
```

### 변경

- `createAstrologyCalculationContext()`는 `calculationMeta`가 없으면 `verified`를 기본값으로 만들지 않는다.
- `confidence`와 `verificationStatus`는 필수 입력 또는 중앙 Gate의 결과다.
- `createAstrologyInterpretationContext()`는 `unknown` 문자열 대신 null/status를 보존한다.
- `adapterVerified`는 호출자가 넘기는 자유 Boolean이 아니라 registry 검증 결과의 파생값이다.

## 9. Activation Gate

### 9.1 상태 흐름

```text
simulation_blocked
  -> adapter_connected_unverified
  -> regression_verified
  -> externally_verified
  -> available
```

상태는 단일 문자열만으로 결정하지 않는다.

```js
{
  licenseGate: 'pass | fail | pending',
  artifactGate: 'pass | fail | pending',
  nonSimulationGate: 'pass | fail',
  regressionGate: 'pass | fail | pending',
  externalValidationGate: 'pass | fail | pending',
  deploymentGate: 'pass | fail | pending',
  fallbackGate: 'pass | fail',
  inputResolutionGate: 'pass | partial | fail',
  requiredDataGate: 'pass | partial | fail',
}
```

### 9.2 중앙 판정

정적 검증 결과는 `astrologyActivationRegistry.js`에 다음 fingerprint로 등록한다.

```text
adapter id/version
+ source commit
+ WASM sha256
+ ephemeris data sha256 set
+ engine version
+ aspect ruleset version
+ timezone resolver version
+ validation report id
```

실행 중 Adapter 결과의 fingerprint가 registry와 정확히 일치해야 한다.

```js
adapterVerified =
  licenseGate === 'pass'
  && artifactGate === 'pass'
  && nonSimulationGate === 'pass'
  && regressionGate === 'pass'
  && externalValidationGate === 'pass'
  && deploymentGate === 'pass'
  && fallbackGate === 'pass'

availableForChat =
  adapterVerified
  && inputResolutionGate !== 'fail'
  && requiredDataGate !== 'fail'
  && interpretationContext !== null
```

부분 입력은 검증된 consensus 행성 근거가 있을 때만 `availableForChat: true`가 가능하며, angles/houses는 별도 미지원으로 남는다.

### 9.3 검증 전 불변식

- `availableForChat: false`
- `ENGINE_CAPABILITIES.astrology.calculation: false`
- Unified Context 공통 테마 제외
- Chat Handoff 실제 값 미출력
- UI 지원 표시 없음

### 9.4 Unified Context 보강

현재 descriptor 정규화는 `availableForChat`과 Context만으로 Astrology를 통과시킬 수 있다. Astro-2에서 다음 중앙 predicate를 추가한다.

```js
isAstrologyEligibleForUnified(system) {
  return system.availableForChat === true
    && system.context
    && system.context.activationGate?.status === 'passed'
    && activationRegistry.matches(system.context)
}
```

Legacy `adapterVerified` Boolean 단독 opt-in은 제거하거나 Lab 전용으로 제한한다.

## 10. 향후 Chat Formatter 계약

Astro-3 이전에는 구현하지 않는다.

- `formatAstrologyStatus(system)`
- `formatAstrologyFull(system)`
- `formatAstrologyQuickFacts(system)`
- `formatAstrologyTopic(system, topic)`

선별 기준:

| 주제 | 근거 |
| --- | --- |
| personality | Sun, Moon, ASC, 원소·양태, 개인행성 주요 aspect |
| career | MC, 2·6·10 house, Saturn, Jupiter, 관련 aspect |
| relationship | Moon, Venus, Mars, 7 house, 관련 aspect |
| timing | Natal 단계에서는 미지원. Transit 값을 추정하지 않음 |

Formatter는 `isAstrologyEligibleForUnified()`가 false면 상태만 출력한다.

## 11. 오류 코드

최소 오류:

- `ASTRO_LICENSE_NOT_APPROVED`
- `ASTRO_ADAPTER_UNVERIFIED`
- `ASTRO_ARTIFACT_MISMATCH`
- `ASTRO_EPHEMERIS_FALLBACK`
- `ASTRO_EPHEMERIS_FILE_MISSING`
- `ASTRO_TIMEZONE_INVALID`
- `ASTRO_LOCAL_TIME_AMBIGUOUS`
- `ASTRO_LOCAL_TIME_NONEXISTENT`
- `ASTRO_BIRTH_TIME_REQUIRED_FOR_HOUSES`
- `ASTRO_PLACIDUS_UNAVAILABLE_AT_LATITUDE`
- `ASTRO_HOUSE_SYSTEM_FALLBACK`
- `ASTRO_REQUIRED_BODY_MISSING`
- `ASTRO_GOLDEN_GATE_FAILED`

오류는 빈 chart나 completed status로 변환하지 않는다.
