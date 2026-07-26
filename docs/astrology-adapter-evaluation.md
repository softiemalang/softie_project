# Phase Astro-0 · Natal Astrology Adapter 평가

조사 기준일: 2026-07-26
상태: 설계 전용. 제품 활성화, 의존성 설치, 천문 계산 구현 없음.

## 1. 결론

우선안은 **Swiss Ephemeris 공식 C 코어를 고정 버전으로 사용하고, 프로젝트가 소유하는 최소 WebAssembly 바인딩을 통해 브라우저에서 실행하는 방식**이다.

다만 이 선택은 다음 조건을 모두 충족한 뒤에만 채택한다.

1. Astrodienst와 Swiss Ephemeris Professional License 계약을 완료하거나, 서비스 전체를 AGPL 호환 방식으로 공개한다.
2. 공식 소스 커밋, 빌드 도구, WASM 바이너리, ephemeris 데이터 파일을 해시로 고정한다.
3. 요청한 Swiss Ephemeris 모드가 Moshier 등으로 조용히 fallback되지 않았음을 반환 플래그와 오류 문자열로 확인한다.
4. 현재 Vite 5.4 프로젝트에서 WASM 및 데이터 파일의 로컬·Preview·Production 로딩을 검증한다.
5. Golden Fixture의 regression 및 독립 외부 대조 Gate를 통과한다.

따라서 현재 판정은 **조건부 채택 권장**이다. 라이선스가 정리되기 전에는 Astro-1의 제품 구현을 시작하지 않는다.

`@swisseph/browser`는 빠른 기술 검증 후보로는 유용하지만, 제품 우선안으로 바로 채택하지 않는다. npm 패키지와 Wrapper 저장소 자체가 AGPL-3.0이고 비교적 새 프로젝트이므로, Astrodienst의 Professional License만 구매해도 Wrapper 코드의 AGPL 의무가 자동으로 사라지는지 확인할 수 없다. Wrapper 저작권자의 별도 허가가 없다면 내부 최소 바인딩이 더 명확하다.

Astronomy Engine은 MIT, 브라우저 친화성, 독립적인 행성 위치 대조 측면에서 강점이 있지만, 공식 API 범위에 Placidus 하우스·ASC·MC가 포함되지 않는다. Natal 전체 엔진으로는 제외하고 Astro-2의 행성 위치 교차 검증 후보로 남긴다.

## 2. 현재 저장소 구조

### 2.1 실제 제품 경로

```text
InterpretationPrepPage
  -> prepareThreeSystemInterpretationData()
     -> saju: 실제 계산
     -> ziwei: experimental 계산
     -> astrology: 고정된 차단 descriptor
  -> createUnifiedInterpretationContext()
     -> saju + ziwei만 available
  -> buildChatHandoffPackage()
     -> astrology 상태 문구만 출력
```

현재 `src/interpretationPrep/threeSystemPrepPipeline.js`의 `buildAstrologySystem()`은 다음을 반환한다.

- `status: simulation_blocked`
- `verificationStatus: unsupported_for_interpretation`
- `confidence: not_available`
- `availableForChat: false`
- `calculationResult: null`
- `interpretationContext: null`

따라서 `src/astrology/planetResolver.js`와 `houseResolver.js`의 Simulation 값은 제품 준비 파이프라인에서 호출되지 않는다.

### 2.2 Simulation 생성 위치

| 파일 | 현재 동작 | 실제 Adapter 도입 시 처리 |
| --- | --- | --- |
| `src/astrology/planetResolver.js` | 날짜를 수치 seed로 바꿔 10개 천체 황경·역행을 생성 | 제품 경로에서 영구 차단. `blockedSimulationAdapter` 또는 Lab 명칭으로 격리 |
| `src/astrology/houseResolver.js` | 출생시각 seed로 ASC·MC와 등간격 12 cusp 생성 | 제품 경로에서 영구 차단. 실제 house API로 교체 |
| `src/astrology/aspectResolver.js` | 전달된 황경에서 주요 각 계산. `applying: true` 고정 | 황경 기반 각 계산 일부 재사용 가능. applying/separating은 속도 근거로 새로 계산하거나 `null` |
| `src/astrology/astrologyPatternContext.js` | 검증 여부와 무관하게 원소·양태·하우스 축·각 패턴 파생 | 검증된 CalculationContext만 입력하도록 Gate 추가 후 재사용 |
| `src/astrology/astrologyContract.js` | 출생시각만 있으면 기본 `high/verified/completed` | 기본 승격 제거. Adapter 메타데이터와 Activation Gate 없이는 Context 생성 거부 |

### 2.3 Simulation 차단 위치

| 경계 | 현재 보장 | 남은 취약점 |
| --- | --- | --- |
| `threeSystemPrepPipeline.js` | 제품 descriptor를 항상 차단 상태로 생성 | 실제 Adapter 연결 시 중앙 Gate가 아직 없음 |
| `unifiedInterpretationContext.js` | legacy Astrology Context는 `adapterVerified === true`가 없으면 제외 | descriptor 경로는 `availableForChat: true`와 Context만으로 통과 가능 |
| `chatHandoffPackage.js` | 실제 값 대신 “Simulation 차단” 상태만 출력 | 추후 formatter는 중앙 eligibility 확인 뒤에만 호출해야 함 |
| `engineCapabilities.js` | `astrology.calculation: false` | 검증 보고서와 연동되지 않은 정적 Boolean |

### 2.4 재사용 가능한 계약

다음 개념과 구조는 유지할 수 있다.

- `systemType: astrology`
- tropical / geocentric / placidus / true node 기본 프로필
- `planets`, `angles`, `houses`, `aspects`, `elementsAndModalities`
- `candidateSetConsensus`, `candidateFacts`, `uncertainFactors`
- `calculationConfidence.stateContract`
- `astrologyPatternContext`의 파생 패턴 구조
- Availability-aware Unified Context의 체계별 독립 근거 원칙

다음은 의미 보강 또는 교체가 필요하다.

- `degree`는 `degreeInSign`, `longitude`는 `[0, 360)`로 명확히 구분한다.
- `planet`/`isRetrograde`와 새 공통 계약의 `id`/`retrograde`를 Adapter 정규화 단계에서 통일한다.
- 입력에 IANA timezone, 확정 UTC Instant, timezone database version을 기록한다.
- `calculationMeta`에 Adapter·엔진·바이너리·데이터 파일·RuleSet·검증 보고서 식별자를 넣는다.
- `confidence`는 출생시각 유무만으로 정하지 않고 행성/각도/하우스 구성요소별로 분리한다.
- `applying`은 현재처럼 상수로 만들지 않는다.
- 미지원 값에 `"unknown"` 같은 그럴듯한 사실 문자열을 넣지 않고 `null`과 status를 사용한다.

### 2.5 사주·자미두수와 결합되는 경계

세 체계의 결합은 `createUnifiedInterpretationContext()`에서만 일어난다. 실제 Astrology Adapter는 사주·자미두수 계산 모듈을 import하지 않는다.

- 각 체계의 원본 계산과 InterpretationContext는 독립적으로 유지한다.
- `availableSystems` 선정 시 Astrology Activation Gate를 검증한다.
- 공통 테마는 사용 가능한 체계가 2개 이상일 때만 만든다.
- `unified_3system`은 세 체계가 모두 eligibility를 통과한 경우에만 가능하다.
- 한 체계의 용어를 다른 체계의 인과 근거로 변환하지 않는다.

## 3. 현재 테스트가 보장하는 것

### 보장

- seed 행성·하우스 결과에 `simulation_only`와 `availableForInterpretation: false`가 표시된다.
- 제품 three-system pipeline에서 Astrology가 `simulation_blocked`이고 Context가 `null`이다.
- Unified Context와 Chat Handoff에서 Astrology Simulation 값이 제외된다.
- 현재 제품은 `unified_2system`으로 동작한다.
- `Sun in`, `arcminute_level` 같은 가짜 fallback 표현이 Handoff에 나오지 않는다.
- 단순 프론트가 Lab Session UI를 import하지 않는다.

### 보장하지 않음

- 실제 천문 정확도, UTC 변환, 역사 시간대, Placidus, True Node 정확성
- ephemeris 파일 누락 시 fallback 탐지
- WASM의 Vite 5.4 및 Vercel Production 로딩
- 독립 명반과의 일치
- 역행, applying/separating, 고위도 오류 처리
- Wrapper와 Swiss Ephemeris의 라이선스 충족
- descriptor가 임의로 `availableForChat: true`를 주장하는 경우의 중앙 Gate

또한 현재 Lab 테스트에는 잘못된 안전 신호가 있다.

- `astrologyContract.js`는 계산 메타데이터가 없어도 출생시각이 있으면 `high/verified`로 기본화한다.
- `astrologyResolvers.test.js`는 Simulation 값을 CalculationContext로 넣고 `high`를 기대한다.
- `astrologyQualityBenchmark`는 실제 천문 정확도가 아니라 seed 자료에 대한 문구 안전성을 평가한다.
- `aspectResolver.js`는 모든 각을 applying으로 표시한다.
- `astrologyPromptAdapter.js`의 timing 문구는 Natal 단계에서도 transit을 언급한다.

이 테스트들은 Lab 회귀 자산으로 보존하되, Golden Fixture 검증의 증거로 사용하지 않는다.

## 4. 런타임 및 배포 전제

현재 프로젝트는 React 18 + Vite 5.4의 정적 SPA이며 `vercel.json`에는 SPA rewrite만 있다.

- 브라우저 계산은 출생정보를 외부 계산 API에 보내지 않는 장점이 있다.
- Vite는 precompiled WASM을 asset으로 다룰 수 있지만, 설치 후보가 현재 Vite 5.4에서 실제로 빌드되는지는 별도 spike가 필요하다.
- Vercel은 Vite 정적 배포와 WASM 사용을 지원하지만, 제품 경로가 브라우저 WASM이면 핵심 검증 대상은 `dist`의 WASM/data asset URL, MIME, cache, CSP, Preview/Production fetch이다.
- CDN에서 ephemeris 파일을 런타임 로드하지 않는다. 버전 변동, 장애, CORS, 무결성 문제를 피하기 위해 허가된 파일을 프로젝트 배포 artifact에 고정한다.
- Adapter는 해석 자료 생성 시 lazy-load하고, 초기 페이지 번들에는 포함하지 않는다.

## 5. 후보 비교

| 항목 | Swiss Ephemeris 공식 C | `@swisseph/browser` | Astronomy Engine JS |
| --- | --- | --- | --- |
| 판정 | **조건부 채택 권장 · 우선 엔진** | 보류 · spike 후보 | Natal 전체 엔진으로 제외 |
| 공식성 | Astrodienst 공식 소스 | 제3자 TypeScript/WASM Wrapper | 공식 프로젝트 저장소 |
| 라이선스 | AGPL 또는 Professional License | npm/저장소 AGPL-3.0 + Swiss 조건 | MIT |
| 공개·상업 서비스 | AGPL 전체 의무 또는 계약 필요 | Wrapper 권리와 Swiss 권리를 각각 확인 | MIT 고지 조건 |
| 브라우저 | 직접 지원 아님. WASM 빌드 필요 | 지원 명시 | 지원 |
| Node | 네이티브/WASM 바인딩 필요 | 별도 `@swisseph/node` | 지원 |
| Vite | 내부 WASM asset spike 필요 | 현대 bundler 지원을 주장하나 Vite 5.4 검증 필요 | 일반 ESM/JS |
| Vercel | 정적 WASM/data asset으로 가능성 높음. 실배포 검증 필요 | 정적 브라우저 방식 가능성 높음. 실배포 검증 필요 | 정적 JS로 단순 |
| WASM/네이티브 | 브라우저는 WASM 필요 | WASM 포함 | 불필요 |
| 데이터 파일 | Swiss 모드에 필요. 선택 기간에 따라 고정 | Moshier 내장, Swiss 파일 선택 로드 | 불필요 |
| 확인된 크기 | 선택 build/data 범위에 따라 측정 필요 | 프로젝트 설명: 약 250KB gzip, Swiss 파일 약 2MB | 공식 설명: minified JS 약 116KB |
| 행성 황경 | 지원 | 지원 주장 | geocentric vector/좌표로 구성 가능 |
| 속도·역행 | longitude speed 지원. 음수 여부로 판정 | longitudeSpeed 노출 주장. export audit 필요 | state/vector 차분 또는 속도 처리 설계 필요 |
| True/Mean Node | `SE_TRUE_NODE`, `SE_MEAN_NODE` 지원 | 상위 문서는 lunar node를 주장하나 실제 export audit 필요 | Natal node longitude API 확인 안 됨 |
| ASC·MC | house API 지원 | 반환 명시 | 공식 API 범위에 없음 |
| Placidus 12 cusp | 지원 | 지원 명시 | 공식 API 범위에 없음 |
| 고위도 | 극권 밖 Placidus 실패 시 ERR와 Porphyry 값 반환 | 원본 오류·fallback 노출 여부 audit 필요 | 해당 없음 |
| 시간대 | UT 입력. 지역 시간대는 호출자 책임 | UTC Date/JD 입력. 호출자 책임 | UTC 입력, timezone 정보 없음 |
| 타입 | C | TypeScript 선언 제공 | TypeScript 소스·선언 제공 |
| 유지보수 | 장기간 사용, 공식 repo 갱신 | 2026년 기준 신생 패키지. npm 1.3.0, 버전·tarball 고정 필요 | 장기 관리, 다언어 교차 테스트 |
| 정확도 근거 | 공식 문서와 JPL 기반 ephemeris | Swiss 기반이라는 주장 외 Wrapper mapping은 별도 검증 필요 | 공식 README가 NOVAS/JPL 대조와 ±1 arcminute 목표 명시 |
| 독립 대조 | `swetest` 및 JPL Horizons와 비교 가능 | `swetest`로 Wrapper mapping 대조 가능 | Swiss 결과의 행성 교차 검증 후보 |

## 6. 후보별 상세 판단

### 6.1 Swiss Ephemeris 공식 C · 조건부 채택 권장

장점:

- 행성, True Node, 속도, ASC, MC, Placidus cusp를 한 엔진에서 제공한다.
- `swe_calc_ut()`와 house 함수가 UT 입력을 명확히 요구한다.
- longitude speed를 반환하므로 역행 판정의 근거를 보존할 수 있다.
- house 오류와 고위도 fallback이 공식 문서에 명시되어 있다.
- `swetest`로 바인딩과 플래그 mapping을 회귀 대조할 수 있다.

제약:

- public service 활성화 전에 AGPL 또는 Professional License 중 하나를 선택해야 한다.
- 현재 프로젝트의 비공개·상업 가능성을 고려하면 Professional License가 현실적인 우선 경로다.
- WASM 빌드·Emscripten glue·데이터 파일 배포를 프로젝트가 관리해야 한다.
- 요청 ephemeris 파일이 없으면 Moshier로 fallback할 수 있으므로 반환 플래그와 경고를 강제 검사해야 한다.
- Placidus는 극권 밖에서 계산 실패할 수 있고 Swiss는 ERR와 함께 Porphyry cusp를 반환한다. 이를 Placidus 결과로 저장하면 안 된다.

### 6.2 `@swisseph/browser` · 보류

장점:

- 브라우저, WASM, TypeScript, Placidus, ASC·MC 사용 예시가 있다.
- npm 기준 2026-07-26 현재 1.3.0이며 의존성 수가 적다.
- Vite 같은 bundler에서 WASM 자동 로딩을 표방한다.

보류 사유:

- npm 패키지와 저장소가 AGPL-3.0이다.
- Swiss Professional License는 Swiss 본체 권리이며, 제3자 Wrapper 고유 코드의 AGPL 의무까지 자동으로 해소한다고 단정할 수 없다.
- 공식 저장소의 package snapshot과 npm 최신 버전 사이에 시차가 있어 설치 tarball을 직접 감사해야 한다.
- 브라우저 테스트가 수동 HTML 중심으로 보이며, Golden Fixture 수준의 mapping 검증은 별도로 필요하다.
- True Node export, 오류 문자열, 실제 사용 ephemeris flag, 고위도 ERR/fallback 노출을 확인해야 한다.

조건부 재평가 조건:

- 서비스가 AGPL 호환이거나 Wrapper 저작권자의 별도 상용 허가 확보
- exact version tarball과 source tag 대응 확인
- Vite 5.4 build 및 Vercel Preview spike 통과
- 요청/실제 ephemeris mode와 fallback을 API에서 검증 가능

### 6.3 Astronomy Engine · 제품 Natal Adapter로 제외

장점:

- MIT 라이선스
- 브라우저와 Node를 모두 지원하며 WASM·외부 데이터 파일이 없다.
- 공식 프로젝트가 NOVAS, JPL Horizons 등과의 검증 방법과 정확도 목표를 공개한다.
- 소형 번들과 장기 유지보수 측면이 좋다.

제외 사유:

- 공식 기능/API 목록에 ASC, MC, Placidus 또는 기타 astrology house 계산이 없다.
- True Node의 Natal 황경과 역행 Boolean을 바로 제공하는 계약도 확인되지 않았다.
- 부족한 부분을 프로젝트 자체 수학으로 구현하면 새 점성학 계산 규칙을 만들게 되고 검증 범위가 크게 늘어난다.

따라서 Astro-2에서 Swiss의 행성 황경을 독립적으로 교차 점검하는 보조 도구 후보로만 평가한다.

### 6.4 기타 Swiss WASM Wrapper · 초기 제외

검색된 일부 community Wrapper는 README에서 MIT와 Swiss의 dual license를 혼용하거나, embedded Swiss C의 실제 재배포 조건을 명확히 분리하지 않는다. 또한 package provenance와 장기 관리 상태가 충분하지 않다. Phase Astro-0에서는 후보를 늘리지 않고 공식 코어와 `@swisseph/browser`만 평가한다.

## 7. 권장 배포 방식

```text
Vite lazy chunk
  -> internal verifiedEphemerisAdapter
     -> pinned WASM glue
     -> pinned swisseph.wasm
     -> pinned ephemeris data files
  -> normalized project contract
```

원칙:

- 모든 artifact에 SHA-256과 source version을 기록한다.
- data 파일을 임의 CDN에서 가져오지 않는다.
- requested mode와 effective mode가 다르면 계산 전체를 실패 처리한다.
- 브라우저 계산과 Node 검증 runner가 동일 Golden Fixture를 사용한다.
- Vercel Preview에서 production asset 경로와 캐시를 먼저 검증한다.
- server-side Adapter는 개인정보·cold start·native binary 복잡도 때문에 기본안이 아니다. 브라우저 방식이 실패할 때만 별도 ADR로 검토한다.

## 8. 공식 출처

- [Swiss Ephemeris 공식 저장소](https://github.com/aloistr/swisseph)
- [Swiss Ephemeris Programmer's Documentation](https://www.astro.com/swisseph/swephprg.pdf)
- [Swiss Ephemeris Professional License](https://www.astro.com/swisseph/secont_e.pdf)
- [`@swisseph/browser` npm](https://www.npmjs.com/package/@swisseph/browser)
- [`@swisseph/browser` 저장소](https://github.com/swisseph-js/swisseph/tree/main/packages/browser)
- [Astronomy Engine 공식 저장소](https://github.com/cosinekitty/astronomy)
- [Astronomy Engine MIT License](https://github.com/cosinekitty/astronomy/blob/master/LICENSE)
- [Vite WebAssembly 지원](https://vite.dev/guide/features.html#webassembly)
- [Vercel WebAssembly 문서](https://vercel.com/docs/functions/runtimes/wasm)
- [IANA Time Zone Database](https://www.iana.org/time-zones)
- [Temporal.ZonedDateTime ambiguity 설명](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime)
- [JPL Horizons 공식 문서](https://ssd.jpl.nasa.gov/horizons/manual.html)

## 9. 이번 Phase에서 유지되는 상태

- `ENGINE_CAPABILITIES.astrology.calculation === false`
- `status === simulation_blocked`
- `availableForChat === false`
- Astrology `calculationResult`와 `interpretationContext`는 `null`
- Unified Context는 `unified_2system`
- Chat Handoff에는 Astrology 실제 값이 없음
- 프론트 UI 변경 없음
