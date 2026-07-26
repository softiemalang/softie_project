# Phase Astro-0 · Natal Astrology 검증 계획

상태: 검증 설계. Golden 값 자체는 아직 수집하지 않았으며 허용 오차도 확정하지 않았다.

## 1. 검증 목표

검증은 서로 다른 네 질문을 분리한다.

1. **Adapter regression**: Wrapper가 선택한 Swiss Ephemeris 함수, flag, index, 단위를 정확히 mapping하는가?
2. **Astronomical external check**: 행성 위치가 독립적인 천문 기준과 일치하는가?
3. **Astrological chart check**: ASC·MC·Placidus cusp·True Node가 독립 기준 명반과 일치하는가?
4. **Product safety check**: 불확실성, fallback, 라이선스, artifact, 배포 Gate가 우회되지 않는가?

`npm test` 통과나 같은 엔진의 `swetest` 일치만으로 `externally_verified`를 선언하지 않는다.

## 2. 출처 등급

| 등급 | 출처 | 용도 | 독립 검증 인정 |
| --- | --- | --- | --- |
| A | NASA JPL Horizons, USNO NOVAS 같은 공식 천문 기준 | 행성·달 위치와 운동 교차 대조 | 해당 항목에 인정 |
| B | Swiss Ephemeris 공식 `swetest`와 Programmer's Documentation | Adapter 함수/flag/UT/index 회귀 | 엔진 독립성은 없음 |
| C | 독립 구현의 명반 출력과 설정이 공개된 reference | ASC·MC·house·node end-to-end 대조 | provenance 확인 후 인정 |
| D | Astrodienst chart | 제품 end-to-end 대조에 유용하나 Swiss 기반 | 독립 엔진 검증으로는 불인정 |
| E | 블로그, 캡처만 있는 앱, 출처 불명 계산기 | 참고 | 불인정 |

Astrology 활성화에는 다음이 모두 필요하다.

- 모든 필수 필드에 B 등급 regression fixture
- 행성·달에 A 등급 external fixture
- ASC·MC·Placidus·True Node에 검증 가능한 C 등급 fixture
- D 등급 end-to-end 명반 비교는 추가 안전망으로 권장

독립 Placidus/True Node 기준 출처는 Astro-1 종료 전에 확정해야 한다. 확정하지 못하면 Gate는 `regression_verified`에서 멈춘다.

## 3. Golden Fixture 계약

```js
{
  id: 'astro-golden-...',
  description: '...',
  input: {
    localDateTime: 'YYYY-MM-DDTHH:mm:ss',
    timezone: 'Area/City',
    explicitOffset: '+09:00',
    latitude: 0,
    longitude: 0,
    elevationMeters: 0,
    zodiac: 'tropical',
    coordinateSystem: 'geocentric',
    houseSystem: 'placidus',
    nodeType: 'true',
  },
  expected: {
    utcCandidates: [],
    planets: {},
    node: {},
    angles: {},
    houses: [],
    aspects: [],
  },
  tolerance: {
    planetaryLongitudeDeg: null,
    moonLongitudeDeg: null,
    nodeLongitudeDeg: null,
    anglesDeg: null,
    houseCuspsDeg: null,
    aspectAngleDeg: null,
    retrogradeExact: true,
  },
  source: {
    tier: 'A | B | C | D',
    organization: '...',
    url: '...',
    capturedAt: '...',
    queryOrSettings: {},
    rawArtifactPath: '...',
    artifactSha256: '...',
  },
  sourceVersion: '...',
  verificationStatus: 'pending | reviewed | accepted | rejected',
  reviewer: null,
  notes: [],
}
```

원본 응답, 명반 PDF/텍스트, query parameter를 별도 fixture artifact로 보존한다. 사람이 전사한 숫자만 저장하지 않는다.

## 4. 검증 필드

### 4.1 UTC 및 입력

- local date/time + IANA timezone -> UTC candidate
- offset와 UTC Instant
- Julian Day UT
- 위도·경도 부호
- 요청 zodiac/coordinate/house/node type
- tzdb provider/version

### 4.2 행성 및 Node

- Sun, Moon, Mercury, Venus, Mars
- Jupiter, Saturn, Uranus, Neptune, Pluto
- True Node 또는 제품에서 고정한 node type
- ecliptic longitude
- sign과 degreeInSign 정규화
- longitude speed
- retrograde Boolean exact match
- requested/effective ephemeris mode

### 4.3 각도와 하우스

- ASC
- MC
- 12 cusp
- 요청/실제 house system 일치
- 고위도 오류 코드
- Porphyry 등 자동 fallback 차단

### 4.4 Aspect

- conjunction, sextile, square, trine, opposition
- body pair
- exact angle
- actual angular distance
- orb
- applying/separating 또는 null
- aspect RuleSet version

### 4.5 파생 분포

- 포함 천체 목록
- fire/earth/air/water count
- cardinal/fixed/mutable count
- 가중치가 있다면 가중치 RuleSet

## 5. 필수 사례 매트릭스

| 유형 | 목적 | 기대 상태 |
| --- | --- | --- |
| 일반적인 정확한 출생시각 | 전체 happy path | planets/angles/houses available |
| 23:59 / 00:01 | 현지 날짜 경계 | 올바른 UTC date |
| UTC 날짜가 현지 날짜와 다른 사례 | timezone 변환 | source local과 UTC 분리 |
| DST 시작 gap 직전/내부/직후 | nonexistent local time | 내부 시각 자동 확정 금지 |
| DST 종료 overlap 직전/내부/직후 | 2개 Instant | candidate 보존 |
| 한국 1987 DST 시작 | 기존 특별 경계 | IANA 및 외부 기록 대조 |
| 한국 1987 DST 종료 | 중복 시각 | 두 UTC candidate |
| 한국 1988 DST 시작/종료 | 역사 규칙 | candidate/gap |
| 1961 이전 한국 | 역사 표준시 | needs_verification 가능 |
| 고위도 극권 인근 | Placidus 안정성 | 성공 또는 명시 오류 |
| 극권 밖 Placidus 불가 | fallback 탐지 | houses unavailable, Porphyry 미채택 |
| 남반구 | 좌표 부호와 cusp 순서 | 독립 명반 일치 |
| 서경 지역 | 경도 부호 | 독립 명반 일치 |
| 출생시각 미상 | 부분 계산 | angles/houses unavailable |
| 출생시각 범위 | 후보 consensus | 변동값 단일화 금지 |
| 행성 0° 경계 | sign 정규화 | circular 비교 |
| 행성 정지점 인근 | 역행 경계 | speed와 Boolean 대조 |
| aspect orb 경계 안/밖 | RuleSet | 포함/제외 정확성 |

최소 fixture 수는 숫자로 고정하지 않는다. 위 각 행에 일반·경계 양쪽을 충분히 포함하고, 모든 필수 필드가 적어도 한 번 이상 독립 검증될 때까지 늘린다.

## 6. 허용 오차 결정 방식

Phase Astro-0에서는 근거 없는 단일 숫자를 만들지 않는다. 각 fixture의 tolerance는 다음 순서로 확정한다.

1. 비교하는 두 출처가 같은 좌표계와 보정 옵션을 사용하는지 확인한다.
2. 공식 출처가 공개한 정확도 상한을 수집한다.
3. reference 출력 자릿수의 반올림 오차를 계산한다.
4. Adapter 직렬화 자릿수와 부동소수점 오차를 확인한다.
5. 아래 식으로 항목별 근거를 문서화한다.

```text
tolerance =
  published source error bound
  + reference rounding bound
  + adapter serialization bound
  + documented integration margin
```

통합 margin은 실제 fixture 분포를 보기 전에 정하지 않는다.

### 항목별 분리

- 일반 행성 황경
- 달 황경
- True Node 황경
- ASC·MC
- Placidus cusp
- actual aspect angle
- orb
- longitude speed
- retrograde Boolean은 허용 오차 없이 exact
- sign/house assignment은 경계 tolerance와 별도로 exact/candidate 판정

모든 필수 tolerance가 numeric이고 근거 URL 또는 artifact를 가질 때만 external Gate를 실행한다. `null`, `TBD`, 출처 없는 tolerance가 하나라도 있으면 Gate는 pending이다.

Astronomy Engine의 공식 ±1 arcminute 목표는 Astronomy Engine 자체의 대조 범위로만 사용한다. Swiss Adapter의 승인 tolerance로 그대로 복사하지 않는다.

## 7. Circular angle 비교

0°/360° 경계 때문에 단순 절댓값을 사용하지 않는다.

```js
angularError = Math.min(
  Math.abs(actual - expected),
  360 - Math.abs(actual - expected),
)
```

house cusp 순서는 house number로 비교한다. 배열 index와 C API의 1-based cusp index 혼동을 별도 regression으로 검사한다.

## 8. Validation Runner 출력

```js
{
  reportId,
  generatedAt,
  adapterFingerprint,
  sourceFixtureSetVersion,
  counts: {
    total,
    passed,
    failed,
    pending,
  },
  fieldCoverage: {},
  boundaryCoverage: {},
  failures: [
    {
      fixtureId,
      field,
      expected,
      actual,
      error,
      tolerance,
      source,
    },
  ],
  gates: {
    regression: 'pass | fail | pending',
    external: 'pass | fail | pending',
  },
}
```

Runner는 report JSON과 사람이 읽는 Markdown summary를 함께 만든다. Activation Registry는 report의 hash와 adapter fingerprint를 참조한다.

## 9. Gate 기준

### Regression Gate

- 모든 B 등급 fixture 통과
- 요청/effective ephemeris mode 일치
- engine warning/error가 기대값과 일치
- 1-based/0-based, UT/ET, east/west sign mapping 통과
- 브라우저와 Node runner의 정규화 결과 일치

### External Gate

- 필수 field coverage 100%
- 필수 boundary category coverage 100%
- accepted fixture failure 0
- numeric tolerance와 근거가 모든 비교 필드에 존재
- 독립성이 확인되지 않은 출처만으로 통과 불가
- reviewer 2인의 provenance 및 결과 승인

### Deployment Gate

- Vite 5.4 production build 통과
- Vercel Preview에서 WASM/data 200 응답
- 올바른 Content-Type과 asset URL
- CDN fallback 없음
- offline 또는 네트워크 차단 시 명시적 실패
- 브라우저 새로고침·lazy-load 반복에서 동일 fingerprint
- Production과 local Golden smoke fixture 결과 동일

## 10. 제품 안전 회귀

검증 전:

- `availableForChat: false`
- `engineCapabilities.astrology.calculation: false`
- `unified_2system`
- Handoff에 행성·ASC·house 문자열 없음
- seed Simulation import 없음

검증 후에도 입력별로:

- unknown time이면 angles/houses 미출력
- ambiguous time이면 후보 또는 consensus만 출력
- 고위도 fallback이면 Placidus로 표시하지 않음
- timing mode에서 transit 미출력
- 세 체계 용어를 직접 혼합하지 않음

## 11. 출처 정책

- 공식 문서·공식 저장소·공식 API를 우선한다.
- API query와 response를 raw artifact로 보존한다.
- 웹 서비스 결과에는 capture date, settings, timezone, house system, zodiac를 기록한다.
- 같은 Swiss Ephemeris 기반 서비스끼리의 일치는 external independence로 세지 않는다.
- 출처 이용약관이 자동 저장·재배포를 금지하면 fixture에 원본을 커밋하지 않고 내부 검증 기록과 hash만 보존한다.
- 개인의 실제 출생정보 대신 공개 가능하거나 합성된 fixture를 사용한다.

## 12. 공식 기준 후보

- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/manual.html): 행성·달의 observer-centered ecliptic 위치
- [USNO NOVAS](https://aa.usno.navy.mil/software/novas_info): 독립 천문 계산 참고
- [Swiss Ephemeris `swetest` 및 Programmer's Documentation](https://www.astro.com/swisseph/swephprg.pdf): Adapter regression
- [Astrodienst Extended Chart](https://www.astro.com/cgi/genchart.cgi?lang=en): end-to-end 명반 대조. Swiss 기반이므로 독립 엔진 증거는 아님
- [Astronomy Engine](https://github.com/cosinekitty/astronomy): 행성 위치 교차 검증 후보. Placidus 검증에는 사용 불가

## 13. 자미두수 후속 검증 기록

이번 Phase에서는 계산을 변경하지 않는다. 별도 Ziwei Validation에서 다음을 외부 명반과 대조한다.

- 입춘과 음력 설 사이 출생의 연간·연지 기준
- 윤달
- 자시 경계
- 사화 연간 기준
- 오행국별 대표 사례
- 14주성 대표 배치
