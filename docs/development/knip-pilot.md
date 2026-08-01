# Knip 미사용 코드·의존성 읽기 전용 감사 파일럿

## 판정

이 문서는 삭제나 자동 정리를 수행하지 않는 Knip baseline 감사의 실행 범위와 초기 결과를 기록한다. Knip issue는 사람의 후속 검토 후보이며, 그 자체로 dead code 또는 삭제 대상으로 판정하지 않는다.

## 도구 정보

- 도구: Knip `6.31.0`
- `package.json` range: `^6.31.0`
- license: ISC
- license file: `node_modules/knip/LICENSE` 확인
- Node engines: `^20.19.0 || >=22.12.0`; 현재 Node `v22.20.0`과 호환
- peer dependencies: 없음
- upstream: `webpro-nl/knip` npm 패키지에서 설치; upstream source 수정 및 fork 없음
- 자동 수정: 사용하지 않음

## 목적과 실행

Knip을 사용해 미사용 파일·export·dependency/devDependency, unlisted dependency, unresolved import, binary 및 기타 후보를 수집한다. 이 파일럿은 `npm test`, build, CI, hook을 차단하지 않는다.

```bash
npm run audit:unused
```

JSON 보고서는 저장소에 생성하지 않고 임시 경로에 생성한다.

```bash
npx --no-install knip \
  --config knip.jsonc \
  --no-exit-code \
  --no-progress \
  --reporter json \
  > /tmp/softie-knip-audit.json
```

`--no-exit-code`는 issue가 있어도 report-only 실행을 허용한다. Knip 실행 자체의 오류를 성공으로 간주하지 않는다.

## 분석 범위

- 브라우저 애플리케이션 entry: `index.html`이 로드하는 `/src/main.jsx`를 Knip의 Vite/index.html 자동 발견에 맡김
- test entry: 기본 suite의 `test/**/*.test.js` 및 artifact suite의 `test/de405-artifacts/**/*.test.js`
- package script entry: `package.json`의 `node scripts/...`, `node tools/...`, build/materialize/analyze/check/test 명령을 Knip package-script parser가 발견하도록 유지
- manual entry: 없음
- project: `src`, `scripts`, `tools`, `test`의 JavaScript 계열 파일
- 제외: `node_modules`, `dist`, `build`, `coverage`, `artifacts`
- native/C/Fortran/binary: JavaScript 분석 범위 밖. native build와 spawn 관계는 결과 분류에서 별도 확인

초기 인벤토리는 JavaScript 계열 파일 316개였다.

| root | files | `.js` | `.jsx` | `.mjs` | `.cjs` |
|---|---:|---:|---:|---:|---:|
| `src` | 135 | 98 | 37 | 0 | 0 |
| `scripts` | 79 | 0 | 0 | 79 | 0 |
| `tools` | 14 | 0 | 0 | 14 | 0 |
| `test` | 88 | 86 | 0 | 2 | 0 |
| **합계** | **316** | **184** | **37** | **95** | **0** |

symlink은 확인되지 않았다. 기본 test discovery helper는 63개 파일을, artifact discovery helper는 13개 파일을 발견했다.

## Zero-config 관찰

설정 파일 작성 전 zero-config 실행은 exit 0, JSON 파싱 성공, 150 issue였다. root 파일·`public/`·`scratch/`가 섞여 프로젝트 경계가 부정확했으므로 최종 baseline으로 사용하지 않았다. zero-config 결과에서 `src/main.jsx`가 자동 발견되었고, 설정 후 중복 entry hint가 발생해 명시 entry에서 제거했다.

## 최종 감사 결과

두 번의 JSON 실행은 모두 exit 0이고 구조적 결과가 byte-independent하게 동일했다. 의미 없는 출력 순서나 실행 시간 필드는 비교 대상에 넣지 않았다.

| issue type | count | 초기 해석 |
|---|---:|---|
| files | 30 | 수동·동적·legacy·미사용 후보 혼재; 삭제하지 않음 |
| exports | 170 | 내부 helper/public contract/test·dynamic 후보 혼재; export 변경하지 않음 |
| dependencies | 0 | 없음 |
| devDependencies | 2 | `@rollup/wasm-node`, `openai`; 각각 동적/postinstall 또는 Supabase 범위 차이 확인 필요 |
| unlisted | 0 | 없음 |
| unresolved | 1 | test가 spawn하는 native build binary 경로; JavaScript import 오류로 단정하지 않음 |
| binaries | 0 | 별도 binary issue 없음 |
| other | 1 | `fresh`/`validateNeighborhoodFreshness` duplicate export group |

### 파일 후보

- 8개 `scripts/` 파일은 package script에 직접 연결되지 않거나 문서·artifact producer·다른 script/test의 경로 문자열로 실행된다. 특히 `generate-de405-jpl-canonical-v2.mjs`, `validate-de405-jpl-canonical-v2.mjs`, `verify-de405-jpl-cspice-overlap.mjs`, `tools/de405-jpl-reader/run.mjs`는 test·문서·spawn 근거가 확인되어 entrypoint 오탐 후보로 분류했다.
- `tools/de405-boundary-resolver/build.mjs`와 `tools/de405-jpl-reader/run.mjs`는 native build/runner 수동 진입점 후보이다.
- `src/interpretationPrep/**`, `src/pages/**`, `src/saju/**`, `src/scheduler/**` 후보는 현재 정적 애플리케이션 graph에서 도달하지 않는 것으로 보고되었으나 route·legacy·향후 계약 여부를 별도 검토해야 한다. 삭제·이동하지 않았다.
- `@rollup/wasm-node`는 `scripts/patch-rollup-native.mjs`의 문자열 기반 postinstall patch 대상이고, `openai`는 Supabase Edge Function이 HTTP API를 직접 호출하는 구조라 현재 JS/Vite project 범위만으로 unused라고 단정하지 않는다.
- unresolved 후보 `tools/de405-cspice-runner/build/de405-canonical-v2-runner`는 artifact test가 spawn하는 생성 native binary이며 `build/`는 project에서 제외했다. 경로 문자열 해석 한계/생성물 관계로 기록한다.

### Export 후보

170개가 보고되었으며, DE405 script library constants/helpers, astrology/interpretation/saju/scheduler public-looking helpers가 포함된다. barrel/public API, test-only 사용, 동적 property access, 문서·외부 계약 여부를 확인하지 않은 상태에서는 실제 미사용으로 판정하지 않는다.

### dependency 결과

현재 결과에는 unused production dependency, unlisted dependency, unresolved JavaScript module import, binary issue가 없다. duplicate export group 하나는 `scripts/lib/de405-center-leg0-record-neighborhood.mjs`의 `fresh`/`validateNeighborhoodFreshness`이며 별도 후속 검토 대상으로만 남긴다.

## dependency-cruiser 교차검증

기준선 `npm run audit:dependencies`는 exit 0, `0 errors / 0 warnings`였고 orphan 수동 검토 정보는 28개였다.

| file | dependency-cruiser | Knip | execution evidence | classification |
|---|---|---|---|---|
| `src/interpretationPrep/sessionPromptAdapter.js` | orphan | unused file | `scratch/` 평가 파일에서 import; 기본 suite에는 미포함 | `manual_review_required` |
| `src/interpretationPrep/userInsightMemory.js` | orphan | unused file | `scratch/` 평가 파일에서 import; 기본 suite에는 미포함 | `manual_review_required` |
| `src/saju/personal/softiePersonalReference.js` | orphan | unused file | 코드 import 미확인; 문서·personal contract 성격 확인 필요 | `public_contract_candidate` |
| `src/scheduler/googleOAuthTokens.test.js` | orphan | Knip unused file 미보고 | `src/**/*.test.js`이며 기본 `test/` discovery에는 미포함; 직접 node:test 파일 | `manual_review_required` |

두 도구가 공통으로 후보를 보고한 파일도 삭제하지 않았다.

## npm audit

설치 전 audit endpoint는 초기 sandbox에서 registry DNS 오류로 실패했다. Knip 설치 후 `npm audit`는 exit 1(취약점 존재)이며 `info 0 / low 1 / moderate 1 / high 3 / critical 0 / total 5`를 보고했다. 설치 로그도 동일하게 5건을 보고했으며 신규 high/critical 증가를 입증하는 차이는 확인되지 않았다. `npm audit fix`는 실행하지 않았다.

## 제한과 다음 단계

- issue 수집과 반복 실행 안정성은 확인했지만, issue 하나하나가 실제 dead code라는 의미는 아니다.
- 기존 DE405 artifact 및 native `build/` 산출물은 읽거나 재생성·삭제하지 않았다.
- 다음 단계는 이 baseline 후보를 파일·export·dependency 단위로 사람이 개별 검토하는 것이며, 이번 파일럿에서 삭제·정리·ignore 추가는 하지 않는다.
