# Astrology Timezone Resolver Decision

기준일: 2026-07-26
결정: `temporal-polyfill@1.0.1`을 Astro-1 채택 후보로 고정하되, 의존성 추가는 별도 사용자 승인 후 수행한다.

## 요구 계약

입력 현지 시각을 바로 UTC 하나로 바꾸지 않는다.

```js
{
  status: 'exact | gap | overlap | unsupported',
  localDateTime,
  timeZone,
  candidates: [
    { utcInstant, offset, timeZone }
  ],
  runtimeProvenance: {
    resolver,
    resolverVersion,
    node,
    icu,
    tzdb,
    browser
  }
}
```

- exact: 후보 1개
- gap: 후보 0개, 자동 보정 금지
- overlap: 후보 2개를 모두 보존
- unknown/range birth time: 별도의 interval/candidate 계약 사용

## 후보 비교

| 후보 | gap/overlap 제어 | IANA | 브라우저/Node | 크기·라이선스 | 판정 |
| --- | --- | --- | --- | --- |
| native Temporal | `disambiguation` 제공 | 지원 | 주요 브라우저 전체 기준 미충족 | 추가 번들 없음 | 제외 |
| `temporal-polyfill@1.0.1` | earlier/later/reject로 명시 가능 | host Intl 사용 | Safari 14+, Node 16+ 표방 | 19.6 kB min+gzip, MIT | 채택 후보 |
| `@js-temporal/polyfill@0.5.1` | 명시 가능 | 지원 | 브라우저/Node | 약 52.1 kB min+gzip, ISC | 대안 |
| Luxon | `getPossibleOffsets()` 제공 | host Intl | 브라우저/Node | MIT | 기능은 가능하나 계약이 Temporal보다 분산 |
| `@date-fns/tz` | offset scan 가능 | host Intl | 브라우저/Node | MIT | local wall-time 후보 API를 직접 구성해야 함 |
| `date-fns-tz` | 포맷/변환 중심 | host Intl | 브라우저/Node | MIT + date-fns peer | ambiguity 보존이 직접적이지 않아 제외 |

자료:

- [MDN Temporal.ZonedDateTime and disambiguation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime)
- [`temporal-polyfill` package](https://www.npmjs.com/package/temporal-polyfill)
- [Luxon API](https://moment.github.io/luxon/api-docs/index.html)
- [`@date-fns/tz`](https://github.com/date-fns/tz)

native Temporal은 MDN 기준 Limited Availability이므로 단독 채택하지 않는다.

## 실제 gap/overlap Spike

제품 의존성을 변경하지 않고 `/tmp`에 `temporal-polyfill@1.0.1`을 설치해 실행했다.

Runtime:

```json
{
  "node": "v22.20.0",
  "icu": "77.1",
  "tzdb": "2025b",
  "nativeTemporal": false
}
```

결과:

| case | 결과 |
| --- | --- |
| New York 2024-02-01 12:00 | exact, `2024-02-01T17:00:00Z` |
| New York 2024-03-10 02:30 | gap, 후보 없음 |
| New York 2024-11-03 01:30 | overlap, `05:30Z`와 `06:30Z` 보존 |
| Seoul 1988-05-08 02:30 | gap, 후보 없음 |

구현 방식:

1. `earlier`와 `later`를 각각 계산
2. 둘을 원래 local wall time으로 round-trip
3. 둘 다 일치하고 Instant가 다르면 overlap
4. 둘 다 일치하며 같으면 exact
5. 둘 다 원래 local time과 다르면 gap

`compatible` 기본값이나 implicit earlier를 사용하지 않는다.

## tzdb provenance

Polyfill은 자체 tzdb를 고정하지 않고 런타임 `Intl` 데이터에 의존한다.

- Node: `process.versions.node`, `icu`, `tz`를 기록
- 브라우저: user agent, engine version, timezone ID, fixture 결과, build/deploy fingerprint를 기록
- 동일 입력을 Node, Safari, Chromium에서 교차 실행
- runtime tzdb version을 직접 제공하지 않는 브라우저는 “version unavailable”로 기록하고 known transition fixture fingerprint로 보완

## 역사 시간대 한계

- 1970년 이전 데이터는 runtime과 `backzone` 구성 차이 가능성이 더 크다.
- 국가별 역사 표준시와 정치적 변경은 tzdb 업데이트로 달라질 수 있다.
- 한국 1987~1988 DST는 반드시 Golden Fixture에 유지한다.
- runtime 간 후보가 다르면 자동 확정하지 않고 `needs_verification`과 후보를 보존한다.

## Gate

```json
{
  "timezoneResolverDecision": "pass",
  "candidate": "temporal-polyfill@1.0.1",
  "dependencyInstalledInProduct": false,
  "gapDetection": "pass",
  "overlapDetection": "pass",
  "tzdbProvenance": "runtime_recorded"
}
```

제품 의존성 설치와 lockfile 변경은 Astro-1 승인 시 별도로 수행한다.
