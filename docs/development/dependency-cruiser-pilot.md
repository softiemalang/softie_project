# dependency-cruiser 읽기 전용 구조 감사 파일럿

## 도구 정보

- 도구: dependency-cruiser
- 설치 버전: 18.1.0
- `package.json` range: `^18.1.0`
- 라이선스: MIT
- 라이선스 파일: `node_modules/dependency-cruiser/LICENSE` 확인
- Node: `v22.20.0`
- engines: `^22||^24||>=26` — 현재 Node와 호환
- upstream 수정: 없음
- 포크: 생성하지 않음

공식 npm 패키지를 로컬 `devDependency`로만 설치했다. 주요 직접 전이 의존성에는 `acorn`, `commander`, `enhanced-resolve`, `json5`, `semver`, `watskeburt` 등이 포함된다. 설치로 기존 직접 의존성의 버전은 변경되지 않았고, lockfile에는 dependency-cruiser와 그 전이 의존성만 추가됐다.

## 도입 목적

JavaScript 모듈 관계를 관찰해 순환 참조, 해석 불가능한 import, 미선언 npm 의존성, `src`에서 `test`로 향하는 의존성, 고아 모듈 후보를 수집한다. 결과는 AI 또는 사람이 후속 검토할 범위를 줄이는 baseline이며, 이번 파일럿에서는 어떤 규칙도 빌드 차단 조건으로 사용하지 않는다.

## 감사 범위

루트는 `src`, `scripts`, `tools`, `test`로 고정했다. 인벤토리에서 확인한 JavaScript 파일은 총 316개다.

| 루트 | 파일 수 |
|---|---:|
| `src` | 135 |
| `scripts` | 79 |
| `tools` | 14 |
| `test` | 88 |

확장자별 수는 `.js` 184, `.jsx` 37, `.mjs` 95, `.cjs` 0이다. symlink는 없었다. dependency-cruiser 결과에는 import graph에서 도달한 CSS 5개가 포함되어 총 321 modules로 보고됐다. `node_modules`, `dist`, `build`, `coverage`, `artifacts`, `.git`은 제외했고, `vite.config.*` 등 루트 설정 파일은 포함하지 않았다. C·Fortran 소스 내부 호출, 런타임 DB·네트워크 관계, 동적으로 계산되는 실행 관계도 범위 밖이다.

## 사용자 실행법

```bash
npm run audit:dependencies
```

이 명령은 `src scripts tools test`만 읽고, `/tmp`나 저장소 내부에 보고서 파일을 생성하지 않는다. JSON 결과가 필요하면 다음처럼 임시 경로에 생성한다.

```bash
npx depcruise \
  --config .dependency-cruiser.cjs \
  --output-type json \
  --output-to /tmp/softie-dependency-cruiser-audit.json \
  -- src scripts tools test
```

`warn`은 확인이 필요한 구조적 후보이고 `info`는 참고용 후보다. cycle은 의존성 경로가 다시 시작점으로 돌아오는 관계를, unresolved는 도구가 대상 모듈을 해석하지 못한 관계를 뜻한다. orphan은 그래프의 incoming/outgoing 관계만으로 판단하므로 삭제 대상이라는 뜻이 아니다. package script에서 직접 실행되는 파일, Node test runner가 직접 발견하는 테스트, 동적 경로로 호출되는 파일은 orphan으로 보일 수 있다.

AI에 전달할 때는 rule name, from, to, cycle, dependency type, 해당 파일의 역할을 우선 제공한다. 전체 JSON이 필요하면 위 `/tmp` 생성 명령의 결과를 전달한다.

## 초기 감사 결과

- 분석 module: 321
- 분석 dependency: 514
- 총 violation: 28
- error: 0, warn: 0, info: 28

| rule | severity | violations | enforcement |
|---|---:|---:|---|
| `no-circular` | warn | 0 | report only |
| `not-to-unresolvable` | warn | 0 | report only |
| `no-non-package-json` | warn | 0 | report only |
| `no-src-to-test` | warn | 0 | report only |
| `no-orphans` | info | 28 | report only |

### 순환 의존성

0건이다. production, tooling, test cycle 모두 확인되지 않았다.

### 해석 불가능한 import

0건이다. 실제 경로 오류나 동적/native/generated 관계로 분류할 항목은 이번 결과에 없었다.

### 미선언 의존성

0건이다. 실제 미선언 npm import 후보는 확인되지 않았다.

### `src` → `test`

0건이다. 생산 코드가 테스트 파일을 import하는 결과는 없었다.

### 고아 모듈 후보

28건이다.

- 의도된 실행 진입점: `scripts/`의 6개 검증·materialization·source-fetch 계열 스크립트. package script에서 호출되거나 수동 실행 명령으로 문서화된 파일들이다.
- 실험·probe/native 진입점: `tools/`의 9개 DE405 build/probe 파일. C·Fortran/native runner를 빌드하는 독립 진입점이며, JavaScript import graph 밖에서 호출된다.
- 독립 테스트·helper: `test/`의 9개 파일. Node test runner가 직접 발견하거나 다른 테스트가 경로로 실행하는 파일이다.
- 수동 검토 후보: `src/interpretationPrep/sessionPromptAdapter.js`, `src/interpretationPrep/userInsightMemory.js`, `src/saju/personal/softiePersonalReference.js`, `src/scheduler/googleOAuthTokens.test.js`. 현재 결과만으로 실제 dead code라고 확정하지 않으며, 동적 호출·test discovery·legacy 사용 여부를 별도 확인해야 한다.

따라서 이번 파일럿에서 삭제·이동·import 수정은 하지 않았다.

## 반복 실행

두 번 실행 모두 `321 modules / 514 dependencies / 28 violations`였고 규칙별·severity별 결과와 violation 집합이 일치했다. JSON 파일 전체 SHA-256은 실행 metadata 차이로 달랐지만, 구조적 결과 비교에서는 해당 비결정적 metadata를 제외했다.

## npm audit

설치 전 기준은 HEAD의 기존 `package.json`과 `package-lock.json`을 임시 복사한 읽기 전용 audit으로 복원해 확인했다. 설치 전후 모두 다음과 같았다.

- total: 5
- info: 0
- low: 1
- moderate: 1
- high: 3
- critical: 0
- delta: 0
- 새 high/critical: 없음
- `npm audit fix` 수행: 아니오

## 평가 및 다음 단계

이번 도구가 줄인 검토 범위는 네 개의 핵심 관계 규칙을 한 번에 확인해 cycle, unresolved, undeclared, `src`→`test` 후보가 없음을 보여준 점이다. 현재 가장 가치 있는 탐지는 orphan 목록이며, 특히 package script·native probe·test discovery를 그래프 밖 실행 관계와 대조할 수 있게 했다.

다음 단계에서 검토할 수 있는 강제 후보는 충분한 수동 검토 후 `no-circular`, `not-to-unresolvable`, `no-non-package-json`, `no-src-to-test`다. `no-orphans`는 현재 실행 모델에서 의도된 진입점과 동적 호출이 많으므로 계속 report-only로 유지한다. 이번 파일럿은 새 아키텍처 계약을 확정하지 않으며, CI·hook·`npm test`·`build`에도 연결하지 않는다.
