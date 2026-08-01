# Dependency audit orphan analysis

판정: `complete_legacy_module_analysis_with_external_verification_required`

이번 보완의 artifact schema version은 `2`다. 기존 29건의 상위 `classification`과 집계는 유지하고, 세 legacy module에 `contractStatus`, export·참조·runtime path·Git 이력·외부 계약 위험 필드를 추가했다.

## 기준선

- branch: `main`
- HEAD: `fae15f6aa1cf881e2a4b077462b0547a313e725e`
- `origin/main...main`: `0 0`
- audit command: `npm run audit:dependencies`
- audit exit code: `0`
- reported orphan count: `29`
- classified count: `29`

이 audit의 orphan은 npm package가 아니라 `src/`, `test/`, `scripts/`, `tools/` 내부의 JavaScript 모듈 파일이다. 따라서 결과만으로 dependency 삭제 후보로 해석하지 않았다. `.dependency-cruiser.cjs`는 해당 경로를 그래프로 검사하고 npm dependency 내부는 따라가지 않으며, `no-orphans`는 informational severity다.

## 분류 집계

| classification | count | 판정 |
| --- | ---: | --- |
| `confirmed_unused` | 0 | 고신뢰 삭제 후보 없음 |
| `direct_runtime_use` | 0 | 일반 앱 runtime importer는 확인되지 않음 |
| `direct_devtool_use` | 10 | test discovery, node:test, artifact test 경로에서 직접 실행 |
| `dynamic_or_fallback_use` | 0 | 이번 29건 중 별도 분류가 필요한 동적 로더 없음 |
| `native_or_generated_use` | 9 | C/native build producer 또는 generated runner 경로 |
| `transitive_only_or_manifest_mismatch` | 0 | npm dependency 항목이 아니므로 해당 없음 |
| `audit_false_positive` | 7 | npm/lifecycle/manual/child-process entrypoint를 import graph가 모델링하지 못함 |
| `unresolved` | 3 | interpretation-prep 및 personal reference의 외부·legacy 계약 미확정 |

## 고신뢰 삭제 후보

없음. `confirmed_unused`는 0건이다. 이번 결과에는 삭제를 승인할 수 있는 package 항목도 없고, orphan 파일 중에서도 사용 계약이 없는 것으로 확정된 항목은 없다.

## 유지해야 하는 항목

- `scripts/patch-rollup-native.mjs`: `package.json`의 `postinstall` lifecycle에서 실행되며 Rollup native fallback을 패치한다.
- DE405 `scripts/*`: npm script, 문서화된 수동 runner, test가 `child_process`로 호출하는 evidence/verifier entrypoint다.
- DE405 `tools/*/build.mjs` 및 `tools/de405-jpl-reader/run.mjs`: native C build, generated binary, JPL runner adapter의 producer/consumer 경로다.
- `test/*` 및 `test/helpers/*`: `npm test`의 recursive discovery 또는 artifact test discovery와 path-based subprocess 호출로 실행된다.
- `src/scheduler/googleOAuthTokens.test.js`: `src/` 아래 standalone node:test 파일이며 default `test/` discovery 밖에 있지만 테스트 코드다.

## audit 오탐 7건

다음 파일은 실제 실행 계약이 확인되어 `audit_false_positive`로 분류했다.

- `scripts/check-de405-edge-composition-residual-freshness.mjs` — `package.json:32`의 freshness check entrypoint.
- `scripts/fetch-de405-jpl-sources.mjs` — `package.json:67` 및 JPL reader README의 source-fetch command.
- `scripts/generate-de405-cross-reference.mjs` — `docs/astrology/de405-raw-cross-reference-generation.md:3,16`의 개발용 generator.
- `scripts/patch-rollup-native.mjs` — `package.json:68`의 `postinstall` lifecycle.
- `scripts/run-osv-security-audit.mjs` — `package.json:58`의 security audit entrypoint.
- `scripts/verify-de405-jpl-cspice-overlap.mjs` — `test/de405JplCspiceOverlapEvidence.test.js:8,42`에서 subprocess로 실행.
- `scripts/verify-de405-jpl-full-materialization.mjs` — 자체 generator/validator subprocess 경로를 가진 full-materialization verifier.

공통 원인은 npm script, lifecycle hook, 수동 documented command, 또는 `child_process` 경로가 JavaScript import edge가 아니라는 점이다.

## unresolved legacy module 계약 판정

### `src/interpretationPrep/sessionPromptAdapter.js`

- 최종 상태: `active_contract`
- 신뢰도: `high`
- 현재 사용 경로: `node scratch/sessionConversationLoopEvaluation.js`와 `node scratch/sessionQualityBenchmarkEvaluation.js`가 import하고 각각 conversation-loop 및 session benchmark prompt를 생성한다 (`scratch/sessionConversationLoopEvaluation.js:8,37`, `scratch/sessionQualityBenchmarkEvaluation.js:8,21`).
- 실행 성격: production UI importer는 아니지만 현재 저장소의 실행 가능한 평가 계약이다. `scratch/`가 dependency audit 검사 범위 밖이라 orphan으로 보고됐다.
- 공개 API: package exports, Vite alias/entry 노출 없음.
- Git 근거: `d287c89b`에서 session evaluation scripts와 함께 도입됐다.
- 권장: `keep`.

### `src/interpretationPrep/userInsightMemory.js`

- 최종 상태: `active_contract`
- 신뢰도: `high`
- 현재 사용 경로: `node scratch/userInsightMemoryEvaluation.js`가 `createEmptyUserInsightProfile`, `extractUserInsights`, `clearUserInsightProfile`을 import해 profile 생성·추출·초기화와 schema pipeline을 검증한다 (`scratch/userInsightMemoryEvaluation.js:7,15,27,38`).
- 실행 성격: DB persistence나 production runtime caller는 없지만 현재 실행 가능한 UX-4 평가 계약이다. `scratch/` 제외 때문에 audit graph에는 들어오지 않는다.
- 공개 API: package exports, Vite alias/entry 노출 없음.
- Git 근거: `d287c89b`에서 해당 평가 script와 함께 도입됐다.
- 권장: `keep`.

### `src/saju/personal/softiePersonalReference.js`

- 최종 상태: `unresolved_external_dependency`
- 신뢰도: `medium`
- 내부 사용: 현재 static/dynamic import 없음. package exports와 Vite entry 노출도 확인되지 않았다.
- 기록된 계약: 파일 자체가 `/softie-fortune` 전용 개인 reference이며 common saju engine 이후의 personalization layer라고 선언한다 (`src/saju/personal/softiePersonalReference.js:1-11`). Git commit `1af593ee`에서 personal fortune reference 문서로 도입됐다.
- 현재 활성 `/softie-fortune` 경로: UI가 `softiePersonalRag: true`로 report를 요청하고 (`src/saju/SoftieFortunePage.jsx:249`), API가 Edge Function을 호출하며 (`src/saju/api.js:344-357`), Edge Function은 feature flag와 외부 Discovery Engine 검색을 통해 snippets를 prompt에 주입한다 (`supabase/functions/generate-fortune-report/index.ts:584-603,793-905`). 대상 JS module 자체는 이 경로에 연결되지 않는다.
- 외부 계약 위험: `high`. 별도 datastore, deployment, legacy client가 이 versioned reference를 소비하는지는 저장소 내부만으로 확정할 수 없다.
- 권장: `verify_external_consumer`; 외부 소비자와 migration/deprecation 상태 확인 전 삭제하지 않는다.

## 다음 작업 권장 순서

1. `softiePersonalReference.js`를 소비할 수 있는 외부 datastore, 별도 배포 프로젝트, legacy client의 존재와 종료/deprecation 기록을 확인한다. 이번 작업에서는 외부 시스템에 접근하지 않았다.
2. 두 active evaluation contract는 `scratch/` 실행 경로를 유지하고, 필요하면 별도 후속 작업에서 audit 검사 범위와 report-only 정책을 설계한다.
3. 외부 소비 확인 전에는 세 파일 모두 삭제·deprecation·export 변경을 수행하지 않는다.

## 검증 결과

- JSON parse 및 구조 검증: 통과. `reportedCount = items.length = classifiedCount = 29`, summary 합계 `29`.
- 각 item의 classification, confidence, recommendedNextAction, evidence: 통과.
- 세 대상의 path, exports, static/dynamic references, contractStatus, runtimePath, Git history, externalContractRisk: 기록 완료.
- 존재하지 않는 evidence path/line: 확인 범위 내에서 없음.
- `package.json`, `package-lock.json`, source, test, script, tool, config: 수정하지 않음.
- 기존 DE405 artifact/native/generated/untracked 파일: 보존.

전체 회귀 검증 결과와 명령별 상태는 최종 작업 보고에 기록한다. 이 artifact 생성 자체로 dependency, lockfile, audit 설정 또는 코드는 변경하지 않았다.
