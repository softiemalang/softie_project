# OSV-Scanner 읽기 전용 취약점 감사 파일럿

## 판정

`complete_osv_scanner_readonly_pilot_uncommitted`

이 문서는 2026-08-01 온라인 OSV.dev 데이터베이스 snapshot에 대한 npm lockfile 감사 기록이다. 취약점 발견은 감사 결과이며 실행 실패가 아니다. 이번 파일럿에서는 의존성이나 lockfile을 수정하지 않았다.

## 도구 정보

- 도구: OSV-Scanner V2
- 설치 버전: `2.4.0` (`osv-scalibr 0.4.5`)
- binary: `/opt/homebrew/bin/osv-scanner`
- 설치 방식: Homebrew formula `osv-scanner 2.4.0`
- major version: `2`
- 라이선스: Apache-2.0
- 공식 stable 비교: 로컬 Homebrew formula 정보가 stable `2.4.0`을 표시했다. formula API 재조회는 DNS 오류로 확인하지 못했다.
- upstream 수정 여부: 확인된 수정 없음
- fork 생성 여부: 없음

Homebrew 설치 중 Homebrew 자체가 `osv-scanner` formula에 대해 자동 cleanup을 실행했다. 다른 formula의 update/upgrade는 수행하지 않았다.

## 목적과 범위

이 파일럿은 `package-lock.json`에 고정된 npm 의존성만 OSV 데이터베이스와 대조하고, fixed version과 advisory alias를 수집하며, `npm audit` 결과와 교차검증하기 위한 것이다. 결과는 AI가 검토할 dependency 범위를 줄이는 데 사용한다.

스캔 대상은 저장소 루트의 `package-lock.json` 하나뿐이다. 저장소 재귀 source scan, `node_modules/`, DE405 `artifacts/`, native `build/`, C·Fortran source, container/image, 운영 서버, Supabase/원격 DB, 전역 패키지, vendored dependency, SBOM, Git history는 스캔하지 않았다.

## 네트워크·개인정보 경계

- 온라인 OSV.dev API(`api.osv.dev`)를 사용했다.
- package name, version, ecosystem 같은 lockfile metadata가 전송될 수 있다.
- source code 본문은 전송하지 않았다.
- vendored C/C++ 파일 hash scan은 수행하지 않았다.
- offline database는 다운로드하거나 사용하지 않았다.
- deps.dev license scan과 container scan은 수행하지 않았다.
- `--recursive`, `--licenses`, `--all-packages`, `--call-analysis`, `--offline*`, `fix` 경로는 사용하지 않았다.

## 실행법

```bash
npm run audit:security
```

특정 binary를 지정할 수도 있다.

```bash
OSV_SCANNER_BIN=/path/to/osv-scanner npm run audit:security
```

wrapper는 먼저 lockfile JSON과 OSV-Scanner major version `2`를 확인한 뒤 다음 명령을 안전한 argument 배열로 실행한다.

```bash
osv-scanner scan -L package-lock.json --format table
```

scanner status `0`은 알려진 finding 없음, `1`은 finding 존재를 의미한다. wrapper는 두 경우 모두 status `0`으로 끝낸다. scanner가 `2` 이상으로 끝나거나 signal/spawn/lockfile/version 오류가 발생하면 wrapper도 non-zero로 끝난다. 원래 scanner status는 터미널에 출력한다.

## 초기 결과

두 번의 사람용 scan은 모두 scanner status `1`, wrapper status `0`이었다. 두 번의 JSON scan도 모두 scanner status `1`이고 JSON parse에 성공했다. 두 JSON의 package·version·ecosystem·source·vulnerability group·alias·severity 구조를 정규화한 결과는 일치했다.

- scanned packages: `229`
- affected packages: `5`
- vulnerability groups: `9`
- unique OSV IDs: `9`
- critical: `0`
- high: `4`
- moderate/medium: `4`
- low: `1`
- unknown: `0`
- fix available: `9`
- no fix listed: `0`
- direct dependencies: `1` (`vite`)
- transitive dependencies: `4` (`@babel/core`, `esbuild`, `postcss`, `ws`)
- production dependencies: `1` (`ws`)
- dev-only dependencies: `4`
- reachability: `reachability_not_evaluated`

| package | version | scope | environment | OSV ID | aliases | CVSS | fixed version |
|---|---:|---|---|---|---|---:|---|
| `@babel/core` | `7.29.0` | transitive | dev-only | `GHSA-4x5r-pxfx-6jf8` | `CVE-2026-49356` | 3.2 | `7.29.6` |
| `esbuild` | `0.21.5` | transitive | dev-only | `GHSA-67mh-4wv8-2f99` | — | 5.3 | `0.25.0` |
| `postcss` | `8.5.10` | transitive | dev-only | `GHSA-6g55-p6wh-862q` | `CVE-2026-45623` | 7.5 | `8.5.12` |
| `postcss` | `8.5.10` | transitive | dev-only | `GHSA-r28c-9q8g-f849` | — | 7.5 | `8.5.18` |
| `vite` | `5.4.21` | direct | dev-only | `GHSA-4w7w-66w2-5vf9` | `CVE-2026-39365` | 6.3 | `6.4.2` |
| `vite` | `5.4.21` | direct | dev-only | `GHSA-fx2h-pf6j-xcff` | `CVE-2026-53571` | 8.2 | `6.4.3` |
| `vite` | `5.4.21` | direct | dev-only | `GHSA-v6wh-96g9-6wx3` | `CVE-2026-53632` | 5.5 | `6.4.3` |
| `ws` | `8.20.0` | transitive | production | `GHSA-58qx-3vcg-4xpx` | `CVE-2026-45736` | 4.4 | `8.20.1` |
| `ws` | `8.20.0` | transitive | production | `GHSA-96hv-2xvq-fx4p` | `CVE-2026-48779` | 7.5 | `8.21.0` |

Direct/transitive scope is based on root `package.json` declarations and lockfile graph traversal. Production/dev scope is based on lockfile metadata and graph reachability. JavaScript vulnerable-function reachability was not evaluated, so a finding does not by itself establish exploitability.

## npm audit 교차검증

`npm audit --json`도 실행했으며 audit command status는 `1`이었다. 이는 findings가 있다는 의미로 기록하고 자동 수정은 수행하지 않았다.

- total: `5` package-level vulnerability records
- low: `1`
- moderate: `1`
- high: `3`
- critical: `0`
- dependencies observed: `229` (`prod 19`, `dev 211`, `optional 93`)
- fix performed: 없음

OSV와 npm audit은 동일한 5개 package와 9개 advisory condition을 가리켰다. OSV는 9 vulnerability group과 CVSS score를 표시했고, npm audit은 package-level record와 npm severity를 표시해 숫자와 grouping이 다르다. 이 차이만으로 어느 데이터베이스가 더 정확하다고 판단하지 않는다.

- common findings: `9` advisory conditions across `5` packages
- OSV-only findings: `0` observed
- npm-audit-only findings: `0` observed
- alias grouping difference: OSV GHSA/CVE alias grouping과 npm advisory/source grouping이 다름
- severity difference: OSV CVSS와 npm severity는 같은 척도로 단순 비교하지 않음
- extraction difference: 두 도구 모두 lockfile에서 `229` packages를 추출했으나 결과 표기/grouping이 다름
- unresolved discrepancies: 없음. reachability와 실제 호출 여부는 미평가.

## 운영 원칙

- report-only로 사용한다.
- `npm audit fix`, `npm install`, `npm update`, `osv-scanner fix`를 사용하지 않는다.
- ignore configuration이나 `osv-scanner.toml`을 만들지 않는다.
- dependency 수정, severity gate, CI/hook 연결, 정기 검사 승격은 별도 승인 작업이다.
- 온라인 advisory 결과는 DB 갱신 시점에 따라 달라질 수 있다.

## 평가

이번 도입은 전체 저장소가 아니라 lockfile의 `229` package와 실제 영향이 보고된 `5` package로 검토 범위를 좁혔다. 가장 중요한 별도 감사 후보는 CVSS 8.2의 `vite@5.4.21` finding과 production 경로에 있는 `ws@8.20.0` findings다. 다만 reachability, 실행 환경별 exploitability, 수정 전략은 이번 파일럿에서 판단하지 않았다. 상시 검사나 CI 연결은 별도 승인 후 설계해야 한다.
