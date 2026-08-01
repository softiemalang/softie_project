# Knip 고신뢰 후보 로컬 정밀 감사

## 기준점

- repository: `/Users/softie/Documents/softie_project`
- branch: `main`
- source HEAD: `fd444eb3505deb2f73f901f22fc89a1b69775d91`
- `origin/main...main`: `0 0` (동기화됨)
- Node: `v22.20.0`
- npm: `10.9.3`
- Knip: `6.31.0`
- network: 사용하지 않음
- registry, OSV API, npm audit, OpenAI API, credential: 사용하지 않음
- pre-existing untracked DE405 artifact/native `build/` 산출물: 보존

Knip JSON은 `/tmp/softie-knip-triage.ZfSD5Q/knip-1.json` 및
`knip-2.json`으로 두 번 수집했다. 두 실행 모두 exit 0, stderr 없음이었다.
원문 JSON SHA-256은 파일 배열 순서 차이로 달랐지만, 고신뢰 후보의 이름·경로·line/column·issue shape를 정규화한 결과는 일치했다. 두 실행 모두 configuration hint는 없었고, baseline 후보도 사라지거나 새로 생기지 않았다.

## 후보 요약

| 후보 | Knip issue | 판정 | 증거 등급 | 후속 작업 |
|---|---|---|---|---|
| `@rollup/wasm-node` | unused devDependency, `package.json:76:6` | `intentional_dynamic_dependency` | high | `no_change_required` |
| `openai` | unused devDependency, `package.json:81:6` | `likely_unused_dependency` | high | `remove_unused_openai_dev_dependency` 별도 작업 |
| `tools/de405-cspice-runner/build/de405-canonical-v2-runner` | unresolved, `test/de405-artifacts/de405SelectionTrace.test.js` | `generated_artifact_reference` | high | `keep_report_only` |
| `fresh` / `validateNeighborhoodFreshness` | duplicate export, `scripts/lib/de405-center-leg0-record-neighborhood.mjs` | `public_contract_alias` | high | `no_change_required` |

## `@rollup/wasm-node`

- root 선언: `devDependencies`, declared range `4.60.2`
- lock/install: `4.60.2`, root direct dev dependency, `npm ls`와 `npm explain`에서 다른 dependency chain 없음
- tracked references: `scripts/patch-rollup-native.mjs`가 문자열로 fallback require를 삽입하며, 문서와 `package.json`에도 계약이 기록됨
- postinstall 관계: `package.json`의 `postinstall`이 `node scripts/patch-rollup-native.mjs`를 실행함
- fallback path: 현재 `node_modules/rollup/dist/native.js`에 `require('@rollup/wasm-node/dist/native.js')` 존재
- module resolve/load: package JSON 및 `dist/native.js` resolve 성공, module load 성공, `parse`, `parseAsync`, `xxhash*` export 확인
- patch 멱등성: before/after-1/after-2 SHA-256 모두 `ff131d75f18e8691bb09d7e309d0c655b77f2062439ab21bf7411dc713379442`
- 판정: `intentional_dynamic_dependency`

이 dependency는 직접 ES import가 아니라 Rollup native optional dependency 실패 또는 지원되지 않는 platform/architecture에서 동적으로 선택되는 fallback이다. 현재 Mac에서 native Rollup이 정상이어도 postinstall이 해당 fallback 경로를 유지하는 것이 계약이다. package를 제거하면 patch script 자체는 참조를 삽입할 수 있지만 fallback module은 사라진다. 따라서 현재 환경의 일반 build가 즉시 실패한다고 단정할 수는 없으나, native optional 설치 실패/비지원 환경에서는 fallback이 깨진다. 제거하지 않는다.

## `openai`

- root 선언: `devDependencies`, declared range `^6.34.0`
- lock/install: `6.34.0`, root direct dev dependency, `npm ls`와 `npm explain`에서 다른 package 요구 없음
- 전체 tracked source 검색: `from/require/import('openai')`, dynamic import, `new OpenAI`, `npm:openai`, `jsr:openai` 결과 없음
- 확인된 사용 형태: Supabase Edge Function의 `OPENAI_API_KEY`와 `fetch('https://api.openai.com/...')` 직접 호출
- Edge runtime: `supabase/functions/_shared/saju-evaluator-logic.ts` 및 `generate-fortune-report/index.ts`가 Deno `fetch`와 `Deno.env`를 사용함. `supabase` 아래 별도 Deno/package import map 또는 `openai` npm import는 확인되지 않음
- root package 필요 여부: 확인되지 않았으며, 확인된 Edge 호출 경로에는 필요하지 않음
- module-load probe: `openai` module load와 export 확인은 성공했지만 package 사용의 근거로 해석하지 않음
- 판정: `likely_unused_dependency`

root Node/Vite project에서 package를 import하지 않고 Edge Function이 HTTP API를 직접 호출하므로 Knip의 unused 판정은 현재 저장소 근거와 일치한다. 제거는 별도의 dependency 변경 work order에서 수행한다. 그 작업 전에는 실제 배포 pipeline이 root `node_modules`를 Edge bundle에 주입하지 않는지 배포 설정을 별도로 확인해야 한다.

## Native binary unresolved

- path: `tools/de405-cspice-runner/build/de405-canonical-v2-runner`
- 참조: `test/de405-artifacts/de405SelectionTrace.test.js`의 `spawnSync` 및 여러 DE405 분석/검증 script의 실행 파일 path
- producer: `tools/de405-cspice-runner/build.mjs`, package script `de405:v2:build-runner`
- producer contract: `CSPICE_DIR`의 N0067 include/static libraries를 확인한 뒤 C compiler로 `tools/de405-cspice-runner/src/de405_canonical_v2.c`를 build directory에 생성
- generated 상태: 현재 Mach-O arm64 실행 파일이며 `.gitignore`의 `tools/de405-cspice-runner/build/` 규칙으로 제외됨
- 실행 검증: `--version` probe가 `de405-canonical-v2-runner`, CSPICE `N0067`을 반환했고 artifact suite의 selection-trace spawn test가 통과함
- 실제 broken path: 아님. JavaScript module import가 아니라 generated executable path의 `spawnSync` 대상임
- 판정: `generated_artifact_reference`
- Knip 권고: `keep_report_only`. 이 issue만 좁혀 숨기는 configuration 변경은 가능하더라도 생성물과 producer/consumer 관계를 가리는 비용이 있다. 이번 baseline에는 configuration hint도 없으므로 `knip.jsonc`를 변경하지 않는다.

## Duplicate export

- file: `scripts/lib/de405-center-leg0-record-neighborhood.mjs`
- 정의: `fresh`는 line 234의 freshness function, `validateNeighborhoodFreshness`는 line 238의 `export const ... = fresh`
- binding identity: export presence/type 모두 확인, `module.fresh === module.validateNeighborhoodFreshness`는 `true`
- consumers: `scripts/check-de405-center-leg0-record-neighborhood-freshness.mjs`는 `fresh`를 import하고, `test/de405-artifacts/de405CenterLeg0RecordNeighborhood.test.js`는 `validateNeighborhoodFreshness`를 import함
- 계약 근거: generic checker entrypoint에는 `fresh`, 분석 전용 artifact test에는 구체적인 `validateNeighborhoodFreshness`라는 이름이 사용됨
- 판정: `public_contract_alias`
- 정리 권고: 삭제·이름 변경하지 않는다. 동일 binding이지만 현재 서로 다른 consumer가 있고, alias 제거는 consumer contract 변경이 된다.

## 검증

- `npm run audit:dependencies`: pass, exit 0; 29 informational no-orphans, 0 errors/warnings
- `npm run audit:unused`: pass, exit 0; baseline issue 출력은 실패가 아님
- `npm run test:properties`: pass, 3/3
- `npm test`: pass, 302/302
- `npm run test:de405:artifacts`: pass, 25/25
- `npm run build`: pass, Vite 6.4.3 production build
- Knip JSON 2회: pass, 각 exit 0/stderr 없음; 후보 구조 동일
- `git diff --check`: pass
- protected files: 변경하지 않음

## 다음 작업

1. `remove_unused_openai_dev_dependency`: 별도 승인된 dependency 변경 작업에서 배포 pipeline/runtime 경계를 확인한 뒤 `package.json`과 lockfile을 함께 갱신하고 검증한다.
2. `no_change_required` for `@rollup/wasm-node`: postinstall fallback 계약 때문에 유지한다.
3. `keep_report_only` for generated native binary: producer/consumer가 명확하고 현재 path가 정상이다.
4. `no_change_required` for `fresh` alias: 두 이름이 현재 consumer contract로 사용된다.

남은 uncertainty는 `openai` 제거 전 배포 pipeline이 root dependency를 별도로 bundle하는지에 한정된다. 이번 로컬 감사에서는 네트워크·배포·원격 상태를 사용하지 않았다.
