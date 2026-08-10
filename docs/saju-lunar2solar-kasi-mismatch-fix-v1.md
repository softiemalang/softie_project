# KASI `lunar2solar` 1900 boundary fix v1

상태: `complete_saju_lunar2solar_kasi_mismatch_fix_frontier_exhausted_uncommitted`

이 문서는 기존 [`saju-p0-calendar-oracle-v1`](../artifacts/saju-p0-calendar-oracle-v1/complete.json)를 수정하지 않는 versioned successor다. 동일한 captured corpus를 network 재조회 없이 다시 비교했고, commit/push/deploy/remote DB/production activation/readiness promotion은 수행하지 않았다.

## Root cause

`src/interpretationPrep/lunarConverter.js`는 `solarlunar` 계열의 1900–2100 table과 offset algorithm을 사용한다. 이 구현은 1900년 음력 1월 1일을 양력 1900-01-31에 놓는다. `lunar2solar`에 있던 다음 조건은 그 양력 기준일의 숫자 `31`을 음력 day 하한으로 잘못 적용했다.

```js
(y === 2100 && m === 12 && d > 1) || (y === 1900 && m === 1 && d < 31)
```

따라서 실제로는 유효한 음력 1900-01-01..29를 전부 거부했다. v1 KASI capture에는 그중 1900-01-02..29만 포함되어 있어 정확히 28건이 `-1`로 관찰됐다. 이 조건은 `lunarConverter.js`가 최초 추가된 `92d3f7ae2c19c8a8f4c183664946e085519ae973`에서 처음 등장했고, 그 이전 file history에는 선행 구현이 없다. 같은 계열의 공개 구현도 `solar2lunar`의 양력 하한과 `lunar2solar`의 상한을 같은 조건으로 기술하고 있어, 복사 과정에서 좌표계가 혼동된 것으로 판단된다. [solarlunar lineage](https://app.unpkg.com/solarlunar@3.1.0/files/dist/solarlunar.cjs)

수정은 `lunar2solar`의 잘못된 1900 하한 절만 제거했다. `solar2lunar`의 양력 최소값 1900-01-31과 `lunar2solar`의 상한 2100-12-01은 유지했다. 2100-12-02는 2101년으로 넘어가므로 계속 `-1`이어야 한다.

## Supported range

- table: lunar years 1900–2100, 201 entries
- solar supported interval: 1900-01-31 through 2100-12-31, inclusive
- lunar supported interval: 1900-01-01 through 2100-12-01, inclusive
- 1900 lunar month 1: 29 days; lunar 1900-01-01 → solar 1900-01-31, lunar 1900-01-29 → solar 1900-02-28
- solar 1900-01-30, lunar 1900-01-30, lunar 2100-12-02, and year 2101 inputs remain fail-closed

## Evidence

- 수정 전 28건 fixture: [`before-fixture.json`](../artifacts/saju-lunar2solar-kasi-mismatch-fix-v1/before-fixture.json)
- 전체 동일 corpus successor comparison: [`comparison.json`](../artifacts/saju-lunar2solar-kasi-mismatch-fix-v1/comparison.json)
- 1:1 before/after delta: [`delta.json`](../artifacts/saju-lunar2solar-kasi-mismatch-fix-v1/delta.json)
- boundary, leap/month-length, negative, round-trip frontier: [`frontier.json`](../artifacts/saju-lunar2solar-kasi-mismatch-fix-v1/frontier.json)
- machine-readable root-cause report: [`report.json`](../artifacts/saju-lunar2solar-kasi-mismatch-fix-v1/report.json)
- successor complete/checker contract: [`complete.json`](../artifacts/saju-lunar2solar-kasi-mismatch-fix-v1/complete.json)

동일 1,456 cases의 결과는 다음과 같다.

| category | v1 | successor |
|---|---:|---:|
| `exact_match` | 1,358 | 1,386 |
| `within_defined_tolerance` | 29 | 29 |
| `semantic_mismatch` | 30 | 2 |
| `oracle_scope_insufficient` | 36 | 36 |
| `authority_unresolved` | 3 | 3 |

변경된 case는 v1의 28개 identity와 정확히 같고, 신규 mismatch는 0개다. 남은 두 `semantic_mismatch`인 `tz-rok-1951-dst-start`와 `tz-seoul-1954-offset-change`는 기존 historical timezone fail-closed 정책으로 보존했다. 子時/야자시/day boundary/true-solar-time 및 기타 Saju authority blocker도 승격하지 않았다.

## Reproduction

```sh
node scripts/materialize-saju-lunar2solar-kasi-mismatch-fix-v1.mjs
node scripts/check-saju-lunar2solar-kasi-mismatch-fix-v1.mjs
node --test test/sajuLunar2solarKasiMismatchFix.test.js
```

materializer는 v1 `corpus.json`과 v1 pre-fix `comparison.json`만 사용하며 network fetch를 수행하지 않는다. 1900-01-31부터 2100-12-31까지 73,384개 solar date round-trip sweep도 failure 0으로 완료했다.

기존 v1 complete artifact의 `EXPECTED_HEAD=b4d063c6...`는 현재 기준 `18be2ff...`와 다른 historical fixed-HEAD drift다. v1 artifact와 integrity sidecar는 byte-for-byte 보존했고, 옛 artifact를 green을 위해 갱신하지 않았다. 기존 v1 checker 자체는 이 pre-existing drift 때문에 complete-content 두 건이 실패하며, successor checker는 이를 별도 drift로 기록하고 v1 bytes 보존을 검증한다.
