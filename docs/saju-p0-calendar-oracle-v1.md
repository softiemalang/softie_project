# SAJU-P0-CALENDAR-ORACLE v1

상태: `complete_saju_p0_calendar_oracle_frontier_exhausted_uncommitted`

이 문서는 기존 Saju evidence/readiness/artifact를 덮어쓰지 않는 versioned successor다. 현재 `main` checkout의 `b4d063c6f2e8972e8735b53687d43fdc9643fee8`와 `origin/main`을 기준으로 조사·materialize했으며, commit/push/deploy/remote DB/production activation/readiness promotion은 수행하지 않았다.

## 1. 재구성한 blocker와 판정 기준

최신 P0 dossier의 현재 blocker는 `saju-b-calendar-boundaries` (`P0`)다. 기존 Saju frontier는 local converter/fixtures와 제한된 외부 관찰만 있고, 절기·음력·윤달·자시·역사 표준시에 대한 독립 oracle/source identity가 production contract를 직접 권한 부여하기에는 부족하다고 판정한다.

이 연구 단위의 accept criteria는 다음과 같이 재구성했다.

- 공식 provider identity와 실제 범위를 확인한다.
- 경계 입력을 같은 의미·timezone·time basis로 반환하는 oracle을 확보한다.
- 윤달, 절기 경계, 입춘/연말·연초, 자정/시간대 경계와 adversarial rows를 포함한다.
- raw response의 byte hash, 요청 identity, parsed output, source 의미와 재사용 경계를 보존한다.

Reject criteria도 적용했다. consumer 만세력/상업 계산기/스크린샷만으로 source authority를 만들지 않았고, time metadata 없는 output을 instant-sensitive Bazi month/year/day-boundary 증명으로 사용하지 않았다. KASI 서비스의 2050 범위를 2100으로 조용히 extrapolate하지 않았으며, HKO와 USNO가 서로 같은 source family를 명시하는 경우 독립 oracle 두 개로 세지 않았다.

## 2. 조사한 공식 oracle

| oracle | 의미·범위·time basis | 독립성 / 현재 contract equivalence | license·retention |
|---|---|---|---|
| [KASI 월별 음양력](https://astro.kasi.re.kr/life/pageView/5) | POST date service. Gregorian date, lunar date/윤달 marker, 표시 간지·weekday·Julian date. 페이지의 공개 입력 범위는 `-59-02`–`2050-12`; row 자체에는 시각·timezone·time scale이 없다. | 이 저장소와 독립된 국가기관 observation service지만 구현/data lineage는 페이지에서 확인되지 않았다. date-only lunar conversion에는 동등하나 instant-sensitive Bazi month/year와 子時에는 동등하지 않다. | bulk extraction/redistribution의 포괄 허가는 확인하지 못해 response body가 아니라 URL/request/hash/derived rows만 보존했다. |
| [KASI 2026 역서 목록](https://www.kasi.re.kr/kor/publication/post/publication?clsf_cd=pub005) / [PDF](https://www.kasi.re.kr/file/1762136558729_1.pdf) | 공식 연역서 locator. 확보한 PDF는 232쪽 image-based publication이며 page-level machine rows는 admitted하지 않았다. 실제 PDF SHA-256: `c192b67d54f4a39481dcfd0e76d74ab7131d52630a41ea0a73f25988cc4b958b`. | 공식 almanac authority evidence이나 이 pass에서는 method/frame/time-scale을 machine comparison으로 연결하지 못했다. | KASI page의 original-image 제공 및 무단 reproduction/redistribution 제한을 존중해 raw PDF를 repo에 넣지 않았다. |
| [KASI 음양력 대조증명서 신청](https://www.kasi.re.kr/kor/publication/pageView/131) | date-specific certificate request/fee channel. 공개 bulk corpus가 아니며 이번 pass에서 certificate output은 받지 않았다. | 수령한 certificate와 method/time metadata가 있으면 강한 row-level source가 될 수 있지만 현재는 scope insufficient다. | 신청·재사용 조건과 실제 발급물이 없으므로 reusable corpus로 승격하지 않았다. |
| [HKO 24 Solar Terms](https://www.hko.gov.hk/en/gts/astronomy/Solar_Term.htm) / [정의](https://www.hko.gov.hk/en/gts/time/24solarterms.htm) | 2026–2028 XML 각 24행, HKT `UTC+08:00`, 1분 표시 정밀도. 24개는 황도 15° 구간이며 production Bazi month-entry는 그중 12개 30° longitude만 사용한다. | 독립 endpoint/구현이지만 HKO가 HM Nautical Almanac Office와 USNO data basis를 명시하므로 USNO와는 same-family corroboration이다. event longitude/civil minute는 수치 비교 가능하나 production ephemeris/frame/time-scale 전체와의 semantic equivalence는 미해결이다. | 공개 service 접근은 확인했지만 raw output의 blanket redistribution license는 확인하지 못해 normalized rows와 hashes만 보존했다. |
| [USNO API documentation](https://aa.usno.navy.mil/data/api.html) / [Seasons API](https://aa.usno.navy.mil/api/seasons?year=2026) | `seasons` API version 4.0.1, 1700–2100, UTC output. equinox/solstice 4개씩만 제공하며 24절기 전체나 음력은 제공하지 않는다. | HKO와 endpoint는 별개지만 HKO가 USNO/HMNAO lineage를 밝히므로 독립성은 제한된다. HKO의 0/90/180/270° subset control에만 사용했다. | public API 접근은 확인했지만 별도 raw-data redistribution terms는 확인하지 못했다. |
| [KRISS UTC(KRIS)/KST 자료](https://www.kriss.re.kr/board.es?bid=0031&mid=a10603000000) | UTC(KRIS) time standard와 현재 KST `UTC+09:00` 관계. historical Seoul transition이나 Saju rule은 정의하지 않는다. | 독립 국가 time-standard authority다. 현재 standard offset 검증에는 동등하지만 historical offset/DST와 solar-time·子時 policy authority는 아니다. | time-service 사용 제한이 있어 bulk/high-precision reuse를 admitted하지 않았다. |
| [IANA tzdb releases](https://data.iana.org/time-zones/releases/) / [2026c Asia/Seoul](https://data.iana.org/time-zones/tzdb-2026c/asia) / [LICENSE](https://data.iana.org/time-zones/tzdb-2026c/LICENSE) | versioned civil-time rules. 1900년대 Seoul offset, 1951/1954 변화, 1961 stable offset, 1987–1988 ROK DST gap/fold를 source lines로 보존했다. astronomical event time source는 아니다. | repository/KASI/HKO astronomical path와 독립적인 civil-time rule source다. Asia/Seoul local civil-time status에는 동등하지만 Saju solar-time/day-rollover/야자시에는 동등하지 않다. | tzdb LICENSE의 public-domain data 조건을 확인했다(일부 code는 BSD-3-Clause). source release와 selected lines를 보존했다. |

KASI와 HKO/USNO의 공식성은 확인했지만, 공식성 자체가 고전 Saju 규칙의 semantic authority를 뜻하지는 않는다. 특히 달력 날짜, 천문 event, civil timezone, Saju 학파 규칙을 서로 다른 contract로 유지했다.

## 3. 결정적 corpus

입력은 `artifacts/saju-p0-calendar-oracle-v1/sourceInventory.json`과 `corpus.json`에 있다. materializer는 network fetch를 하지 않고 이 captured input만 읽는다.

- KASI 15개 월 요청, 454개 unique Gregorian rows. 1900, 1951, 1960, 1984, 1995, 2023, 2025, 2026, 2031, 2050을 포함하며 1900-02, 윤달, 연초/연말, 기존 regression에 연결되는 범위를 선택했다. 454 rows 각각에 solar→lunar, lunar→solar, KASI 표시 day pillar at `12:00 Asia/Seoul`을 적용했다. KASI leap-month rows 중 source sexagenary month가 비어 있는 54개도 보존했다.
- HKO 2026–2028 전 24절기 72 rows. Bazi month-entry 36개와 production이 직접 노출하지 않는 intermediate 36개를 분리했다. 입춘·경칩·청명 등 월 경계와 1분 표시 정밀도를 포함한다.
- USNO equinox/solstice 12 rows를 HKO의 같은 longitude와 control 비교했다.
- IANA/KRISS timezone 7 rows: 1951 DST gap, 1954 offset change, 1987/1988 DST gap/fold, 현재 KST.

각 capture에는 request URL/method, response byte length/SHA-256, parsed row count 또는 selected source lines를 보존했다. raw HTML/XML/API body와 KASI PDF는 repo에 복사하지 않았다.

## 4. 결과

총 1,456 comparison cases:

| 분류 | 수 | 의미 |
|---|---:|---|
| `exact_match` | 1,358 | 정의한 입력·출력 contract에서 exact 일치 |
| `within_defined_tolerance` | 29 | source의 1분 표시 정밀도 또는 repository 기존 `20 min` solar-term uncertainty 안. tolerance를 확대하지 않았다. |
| `semantic_mismatch` | 30 | 출력 차이 또는 production이 의도적으로 fail-closed하여 source transition을 직접 resolve하지 않는 경우 |
| `oracle_scope_insufficient` | 36 | HKO intermediate 12 terms × 3년; production boundary set 밖이라 비교 대상 contract가 없음 |
| `authority_unresolved` | 3 | 숫자 비교가 아니라 규칙 authority가 없는 contract |

주요 exact/near-exact 결과:

- KASI solar→lunar 454/454 exact.
- KASI day pillar at noon 454/454 exact. 이는 non-boundary noon의 표시 day-pillar 관찰이며 야자시/자정 정책을 증명하지 않는다.
- KASI lunar→solar 426 exact, 28 mismatch.
- HKO Bazi month-entry 36개는 longitude mapping mismatch 없이 모두 exact 또는 기존 20분 범위 안이다.
- HKO–USNO 12 controls는 10 exact, 2 within 60초다. 이는 HKO가 USNO lineage를 공개하므로 independent pass가 아니라 same-family corroboration이다.
- IANA 1987/1988 gap/fold와 현재 KST status는 현재 engine의 declared status와 일치했다.

### 반례와 원인

28개 mismatch는 모두 KASI 1900-02 rows의 reverse conversion이다. 현재 `lunar2solar`의 guard가 `1900`년 `1`월 `31`일 미만을 `-1`로 거부한다. KASI forward rows가 해당 lunar dates를 실제로 반환하므로, 이는 oracle disagreement가 아니라 production implementation guard의 재현 가능한 bug/coverage defect다. tolerance를 조정하거나 expected 값을 바꾸지 않았다.

1951 DST transition과 1954 offset change 두 rows는 IANA가 civil rule을 제공하지만 production이 1961-08-10 이전을 `historical_offset_unverified`로 fail-closed하는 사례다. 안전한 미지원 상태를 숫자 mismatch로 숨기지 않기 위해 `semantic_mismatch`로 남겼다. 이는 과거 offset을 production에 자동 활성화할 근거가 아니다.

## 5. 직접 검증된 contract와 남은 authority gap

현재 corpus로 직접 확인된 범위는 다음이다.

- KASI date-only Gregorian↔Korean lunar date/leap marker의 454 forward rows 및 426 inverse rows.
- KASI가 표시한 non-boundary noon sexagenary day와 현재 day-pillar 계산의 454 rows.
- repository가 사용하는 12개 Bazi month-entry longitude와 HKO 24-term event subset의 36 rows. 수치 event가 기존 20분 선언 범위 안이라는 것까지다.
- 현재 KST `UTC+09:00`, 1987/1988 DST gap/fold status.

다음은 아직 authority가 부족하다.

- KASI row는 date-only라서 입춘 전후의 year/month 간지 instant semantics를 adjudicate하지 못한다.
- 子時, 야자시/조자시, 자정 또는 solar-midnight day boundary는 천문 calendar output이 아니라 Saju rule 선택이다.
- longitude correction, equation-of-time, true-solar-time를 언제 적용할지에 대한 Saju policy authority가 없다.
- KASI full 1901–2100 machine-readable daily/solar-term corpus와 method/time-scale disclosure, bulk/reuse permission을 확보하지 못했다.
- HKO/USNO는 같은-family이며 24 terms 전체의 독립 double oracle이 아니다.
- pre-1961 Seoul historical civil time은 IANA evidence는 있으나 production contract가 intentionally unresolved다.

따라서 readiness와 production activation은 승격하지 않았다. 기존 claim-level classical verification 0, interpretation availability false, blocked 상태는 그대로다. 이 artifact의 완료 token은 연구 frontier의 소진을 뜻하며, Saju semantic authority 또는 production readiness 승인을 뜻하지 않는다.

## 6. 재현·검사 산출물

- acquisition: `scripts/acquire-saju-p0-calendar-oracle-v1.mjs`
- materializer: `scripts/materialize-saju-p0-calendar-oracle-v1.mjs`
- checker: `scripts/check-saju-p0-calendar-oracle-v1.mjs`
- deterministic inputs: `artifacts/saju-p0-calendar-oracle-v1/sourceInventory.json`, `corpus.json`
- result: `artifacts/saju-p0-calendar-oracle-v1/comparison.json`, `exceptions.json`, `complete.json`
- byte integrity sidecars: 각 위 JSON의 `.integrity.json`
- focused/negative tests: `test/sajuP0CalendarOracle.test.js`

checker는 source identity/coverage/retention metadata, corpus counts/uniqueness, input/output integrity, deterministic rematerialization, protected baseline hash, expected HEAD/main, readiness fail-closed flags, result counts와 mismatch cardinality를 검사한다. mutation된 complete/comparison은 expected canonical materialization과 달라져 reject되어야 한다.
