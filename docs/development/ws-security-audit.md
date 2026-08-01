# `ws@8.20.0` production 경로 보안 감사

감사일: 2026-08-01 (Asia/Seoul)

## 결론

- `ws`는 root 직접 dependency가 아니다.
- lockfile production graph에는 존재한다. 이유는 `@supabase/realtime-js@2.104.1`이 `ws@^8.18.2`를 일반 dependency로 선언하기 때문이다. `openai@6.34.0`도 `ws@^8.18.0` optional peer를 선언한다.
- 현재 브라우저 production bundle의 sourcemap 15개에는 `ws` source가 없고, `ws` server 구현도 포함되지 않는다.
- 현재 프로젝트 소스에는 Node production/SSR/serverless WebSocket 경로 또는 `ws` 직접 import가 확인되지 않았다.
- Node 22의 `globalThis.WebSocket`이 존재하며, 설치된 Supabase Realtime 선택 로직은 native WebSocket을 우선한다. `ws`는 Node <22에서 사용자가 transport로 명시하는 fallback이다.
- 따라서 현재 프로젝트에서 advisory의 공격 조건과 연결되는 runtime 경로는 확인되지 않았다. 그래도 production graph에 남은 vulnerable package를 유지할 이유는 없으므로, 최소 수정은 `ws`만 `8.21.1` 이상으로 lockfile refresh하는 것이다.

최종 분류:

```text
partial_ws_candidate_validation_incomplete
registry/API DNS failure prevented lockfile-refresh candidate validation
ws_not_in_browser_bundle
ws_node_runtime_not_evidenced
advisory_attack_condition_not_evidenced
```

`npm` registry와 OSV API가 이 실행 환경에서 DNS 해석되지 않아 실제 lockfile refresh, candidate OSV 재스캔, npm audit 결과는 미검증이다. 따라서 `8.21.1`은 검증 완료된 수정안이 아니라 현재 parent range와 공식 advisory/release metadata 분석에 기반한 최소 권고 후보다.

## 기준점

| 항목 | 결과 |
|---|---|
| branch | `main` |
| source HEAD | `f0af1cf23f8df84305228252341cce7f47d9eaa7` |
| `origin/main...main` | `0 0` |
| Node / npm | `v22.20.0` / `10.9.3` |
| OSV-Scanner | `2.4.0` |
| Vite | `6.4.3` |
| installed `ws` | `8.20.0`, one deduped instance |
| root `dependencies.ws` / `devDependencies.ws` | 없음 / 없음 |
| lockfile `node_modules/ws.dev` | 없음 (`dev` metadata 없음) |
| lockfile `node_modules/ws.optional` / `peer` | 없음 / 없음 |
| `ws` integrity | `sha512-sAt8BhgNbzCtgGbt2OxmpuryO63ZoDk/sqaB/znQm94T4fCEsy/yV+7CdC1kJhOU9lboAEU7R3kquuycDoibVA==` |

기존 DE405/artifact/native `build/` untracked 산출물은 보존했고 감사 문서 외 root tracked 파일은 변경하지 않았다.

## Dependency chain

```text
root dependencies.@supabase/supabase-js ^2.49.8
  → @supabase/supabase-js@2.104.1
  → @supabase/realtime-js@2.104.1
  → ws@^8.18.2
  → ws@8.20.0
```

보조 chain:

```text
root devDependencies.openai ^6.34.0
  → openai@6.34.0
  → optional peer ws@^8.18.0
  → ws@8.20.0
```

즉 `ws`는 `openai`만으로 유입되는 dev-only package가 아니다. Supabase Realtime의 일반 dependency edge 때문에 동일 instance가 production graph에 있다. `npm ls ws --all`과 `npm explain ws`에서 duplicate version은 확인되지 않았다.

## 프로젝트 사용과 runtime 도달성

직접 확인된 root source 사용:

- `src/lib/supabase.js`에서 `@supabase/supabase-js`를 import한다.
- `src/`, `scripts/`, `tools/`, `test/`에서 `ws` 직접 import, `WebSocketServer`, Node `createServer`/`listen` production 경로는 확인되지 않았다.
- `openai`는 root browser source에서 import되지 않는다. Supabase Edge Functions의 OpenAI 사용은 `openai` npm client가 아니라 `fetch`이며, 이 감사 범위의 local Node runtime 경로가 아니다.

설치된 `@supabase/realtime-js@2.104.1`의 `WebSocketFactory`는 다음 순서로 동작한다.

1. browser/global native `WebSocket` 확인
2. Node 22+에서 native `WebSocket` 확인
3. 그 외 Node에서는 사용자가 `transport: ws`를 명시해야 함

현재 Node는 `globalThis.WebSocket`을 제공한다. 프로젝트에는 `transport: ws`를 명시하는 코드가 없다. 실제 외부 WebSocket 연결, realtime subscribe, message send는 수행하지 않았다.

## Browser production bundle

`git archive HEAD`로 `/tmp` 격리 snapshot을 만들고 현재 lockfile로 `npm ci`한 뒤 `npm run build -- --sourcemap`을 실행했다.

- sourcemap 수: 15
- `node_modules/ws/` 또는 `ws/lib/` source match: 0
- `WebSocketServer`, `perMessageDeflate`, `Receiver`, `Sender`, `buffer-util`, `utf-8-validate` server implementation source content: 0
- 일반 `dist` bundle 검색에서도 해당 `ws` 구현 문자열: 없음

판정: `ws_not_in_browser_bundle`.

이는 lockfile production 분류와 별개의 사실이다. bundle에 없다는 사실만으로 Node runtime 안전 업데이트를 생략하지 않는다.

## Advisory

2026-08-01 현재 공식 자료에서 `8.20.0`에 해당하는 최소 수정선은 `8.21.1`이다.

| ID | 영향 버전 | 수정 버전 | 공격 조건과 영향 | 프로젝트 applicability |
|---|---|---:|---|---|
| [GHSA-58qx-3vcg-4xpx / CVE-2026-45736](https://github.com/websockets/ws/security/advisories/GHSA-58qx-3vcg-4xpx) | `>=8.0.0 <8.20.1` | `8.20.1` | `websocket.close()`에 TypedArray reason을 전달하는 misuse에서 uninitialized memory disclosure. 공식 advisory는 CVSS 4.4, 높은 attack complexity와 높은 privilege를 기재한다. | `ws` 직접 호출, Node server/client, TypedArray close reason 사용이 확인되지 않음: `not_applicable_runtime_path` |
| [CVE-2026-62389](https://osv.dev/vulnerability/CVE-2026-62389) | `<8.21.1` | `8.21.1` | 미완료 fragmented WebSocket message를 반복해 `Receiver` buffer를 누적시키는 memory exhaustion DoS. 공격은 WebSocket receiver/server 경로에 네트워크로 도달해야 한다. | Node WebSocket server 또는 `ws` transport 경로가 확인되지 않음: `not_applicable_runtime_path` |

`ws@8.21.1` release는 empty fragments를 limit에 포함하고 `maxBufferedChunks`/`maxFragments` 기본값을 낮춘다. 두 advisory의 수정선을 모두 만족하는 최소 target으로 사용한다. 이전 advisory를 ignore하거나 “runtime 미도달”만으로 finding을 무시하지 않는다.

## 수정 버전과 parent range

현재 parent 선언은 다음과 같다.

```text
@supabase/realtime-js@2.104.1: ws ^8.18.2
openai@6.34.0: ws ^8.18.0 (optional peer)
```

두 range 모두 `8.21.1`을 허용한다. `ws@8.21.1`의 Node engine은 현재 Node 22와 호환되는 `>=10.0.0` 계열이다. parent가 취약 버전을 exact pin하지 않으므로 parent update는 필요하지 않다.

## 후보 비교

| 후보 | 변경 방식 | root manifest | target/resolved `ws` | security validation | tests/build | 판정 |
|---|---|---|---:|---|---|---|
| A | transitive lockfile refresh | 변경 없음 | target 후보 `8.21.1` | range 판정 통과; 실제 resolver/OSV는 DNS로 미검증 | root baseline 통과; candidate refresh 후 재실행 필요 | 부분 검증 |
| B | 최소 root direct ancestor update | 불필요 | 평가하지 않음 | A가 range상 가능하므로 불필요 | 평가하지 않음 | 사용하지 않음 |
| C | root exact override | 변경 발생 | 가능하나 불필요 | parent contract를 우회하므로 평가하지 않음 | 평가하지 않음 | 우선 선택 아님 |

후보 A의 정확한 실행 범위는 다음과 같다.

```text
package-lock.json
  node_modules/ws entry의 version/resolved/integrity만을 중심으로 갱신
package.json
  변경 없음
```

실제 실행 시 `npm update ws --package-lock-only --ignore-scripts`로 시작하고, `npm ci`, `npm ls ws --all`, `npm explain ws`, OSV/npm audit, 전체 회귀 검증을 다시 수행한다. 설명되지 않는 lockfile churn이나 `npm ls` invalid가 나오면 후보 A를 승인하지 않는다.

## Validation record

통과:

- `npm run audit:dependencies`: exit 0; 0 errors / 0 warnings
- `npm run audit:unused`: exit 0; 기존 unused 보고만 출력
- `npm run test:properties`: 3 passed / 0 failed
- `npm test`: 302 passed / 0 failed
- `npm run test:de405:artifacts`: 25 passed / 0 failed
- `npm run build`: pass
- `git diff --check`: pass
- bundle snapshot sourcemap audit: 15 maps, `ws` matches 0
- `npm ls ws --all`: one `8.20.0` instance, invalid 없음

실패 또는 미검증:

- `npm run audit:security`: 두 번 모두 exit 2; `api.osv.dev` DNS failure로 scanner 실행 오류. vulnerability 0건으로 해석하지 않음.
- `npm audit --json`: registry DNS failure로 audit endpoint 오류(status 1).
- `npm view ws...`: registry DNS failure.
- candidate A network resolver: registry DNS failure. offline retry도 packument metadata가 없어 `8.20.0`에서 갱신되지 않음.
- candidate-specific OSV/npm audit, tests/build/dev smoke after a changed lockfile: target lockfile이 생성되지 않아 미실행.

## 최종 권고와 위험

권고 전략은 `transitive_lockfile_refresh` 후보이며 target 후보는 `ws@8.21.1`이다. 이는 검증 완료된 수정안이 아니다. root `package.json`이나 direct ancestor를 업데이트하지 않고 `package-lock.json`만 갱신하는 것이 가장 작은 변경으로 분석되었지만, 실제 resolve 결과·lockfile churn·finding 0건·후보 회귀검증은 DNS 정상화 후 별도 후속 작업에서 확인해야 한다. Override는 parent range가 이미 target을 허용하므로 장기 해결책으로 선택하지 않는다.

현재 runtime 위험도는 `not_evidenced`다. 다만 production graph에 있는 package이므로, 향후 Node 21 이하 runtime에서 `transport: ws`를 명시하거나 별도 server/SSR/WebSocket endpoint를 추가하면 applicability를 다시 평가해야 한다. `ws@8.21.1`로 갱신한 뒤에도 실제 WebSocket 통합 동작은 별도 loopback/integration 작업에서 검증해야 하며, 이번 감사에서는 외부 연결이나 credential 사용을 하지 않았다.

이번 작업에서는 commit, push, deploy, root dependency 변경, override, 원격 DB 변경을 수행하지 않았다.
