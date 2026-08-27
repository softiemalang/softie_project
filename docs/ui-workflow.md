# Softie UI 작업 프로세스

이 문서는 기존 Softie UI를 보존하면서 새 UI 작업이 실제 토큰과 공용 CSS API를 먼저 재사용하도록 하는 짧은 실행 절차다. 값의 원천은 [`DESIGN.md`](../DESIGN.md)와 [`src/styles.css`](../src/styles.css)이며, [`ui-system.json`](./ui-system.json)은 AI와 사람이 빠르게 찾아갈 수 있는 인덱스다. 인덱스에는 토큰 값을 복사하지 않는다.

## 기준 우선순위

1. 현재 route 구현과 runtime CSS
2. `DESIGN.md`
3. `docs/ui-system.json`과 이 문서
4. SEED를 포함한 외부 참고 자료

SEED에서 차용한 것은 `Foundations → Components → Patterns`로 질문을 좁히는 구조, 원문을 복사하지 않는 문서 인덱스, 그리고 코드를 수정하지 않는 Doctor형 진단이다. Softie의 색·간격·곡률·모션·기존 컴포넌트 값은 SEED 값으로 대체하지 않는다.

## Apple HIG 품질 검토 게이트

Apple의 [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)는 외형, 색, 토큰, 플랫폼 자산을 복제하는 기준이 아니라 UI 품질을 점검하는 외부 참고 기준으로만 사용한다. 현재 route 구현과 runtime CSS, `DESIGN.md`, `docs/ui-system.json`, 이 문서의 우선순위를 바꾸지 않으며, HIG의 pt·폰트·재질·모션 값을 Softie 토큰으로 옮기지 않는다. 아래 게이트는 새 화면과 명시적 리뉴얼에서 `pass / gap / n/a`로 기록한다.

- **`target / spacing`:** 주요 조작 요소는 기존 Softie `44px` 터치 영역과 인접 요소 사이의 비중첩·충분한 간격을 확인한다. 보이는 캡슐을 작게 유지하는 기존 compact pattern을 유지하며, Apple의 `pt` 값을 웹 `px`로 변환하거나 새 전역 토큰을 만들지 않는다.
- **`semantic state / no-color-only`:** `default / hover / focus / selected / disabled / loading / empty / error`를 확인한다. 상태·선택·오류는 텍스트, 테두리, 아이콘, 위치 또는 native semantics 중 두 번째 신호를 가지며 색상만으로 전달하지 않는다. hover가 touch·keyboard 경로의 유일한 피드백이 되지 않게 한다.
- **`200% 확대 / 긴 한글 / 390px 폭`:** 프로젝트 검증 기준으로 200% 브라우저 확대와 긴 한글 문구에서 핵심 정보·라벨·오류·주요 액션이 잘리지 않고 재배치되는지 확인한다. `390px`에서 가로 overflow와 화면 밖 조작이 없어야 하며, 실패 시 전체 타입·간격 토큰을 키우지 않고 해당 route의 원인을 feature-local로 좁힌다.
- **`reduced motion / transparency / forced colors`:** reduced motion에서는 이동·scale·depth·parallax·animated blur를 제거하고 상태 의미를 정적 highlight·color·opacity 등으로 보존한다. reduced transparency에서는 glass를 더 불투명한 표면과 선명한 경계로 대체할 수 있어야 하며, forced colors에서도 focus·그룹·상태 경계가 남는지 확인한다.
- **`modal focus lifecycle`:** 시각적으로 떠 있는 패널의 `role="dialog"`와 accessible name을 확인하고, `aria-modal="true"`는 실제 배경 비활성화, 진입 포커스, Tab containment, Escape 닫기, trigger 포커스 복귀가 모두 있을 때만 사용한다. 닫기·취소·완료의 의미를 분명히 하고 모달을 중첩하지 않는다. 일부 수명주기만 있는 경우 `gap`으로 남긴다.
- **`content surface / functional glass`:** 입력·데이터 행·반복 목록·긴 결과는 기존 Operational Surface를 우선하고, glass는 명령·내비게이션·저밀도 핵심 표면에만 제한한다. glass를 반복 중첩하지 않으며, `Warm Liquid Glass`는 Apple 외형이 아닌 Softie 고유의 선택적 표면으로 취급한다.

원문을 확인할 때는 [접근성](https://developer.apple.com/design/human-interface-guidelines/accessibility), [레이아웃](https://developer.apple.com/design/human-interface-guidelines/layout), [재질](https://developer.apple.com/design/human-interface-guidelines/materials), [모달](https://developer.apple.com/design/human-interface-guidelines/modality), [모션](https://developer.apple.com/design/human-interface-guidelines/motion)만 해당 게이트의 근거로 연결한다. Apple UI Kit, SF Symbols, Apple 폰트, 새 디자인·아이콘 의존성은 이 문서의 채택 대상이 아니다.

## 작업 전 5분

1. `git status --short --branch`로 기존 변경을 확인하고, 그 변경을 이번 UI 작업의 결과로 섞지 않는다.
2. 대상 route를 `신규/명시적 리뉴얼`과 `기존 화면 유지` 중 하나로 분류한다. 기존 화면은 자동 재스타일링하지 않는다.
3. `docs/ui-system.json`에서 가장 가까운 reference route와 pattern을 고른다.
4. `rg -n -- "--ag-|\.ag-|\.card|\.soft-button" src/styles.css src/<feature>`로 실제 선언과 사용을 확인한다. 수치나 색을 기억해서 재입력하지 않는다.
5. 구현 전에 아래 작업 메모를 남긴다. 짧게 적어도 되지만 route, reference, 재사용할 pattern, 상태, 허용 파일은 반드시 포함한다.

```text
UI work packet
- route / feature:
- mode: new | explicit redesign | preserve legacy
- reference route and reason:
- reused tokens:
- reused patterns/selectors:
- states: default / hover / focus / selected / disabled / loading / empty / error
- Apple HIG gates: pass | gap | n/a; 근거/후속:
- mobile check: 390px
- allowed files:
- known exception or blocker:
```

## 구현 순서

### 1. Foundations

새 색·간격·radius·shadow를 만들기 전에 `--ag-*`와 기존 역할 토큰을 찾는다. 새 화면은 필요한 만큼만 `data-design-theme="atmospheric"`, `.ag-shell`, `.ag-layout`, `.ag-*` 패턴을 조합한다. 기존 `.app-shell`, `.card`, `.soft-button`, `.status`, `.subtle`, `.section-kicker`는 현재 화면의 동작을 보존하는 호환 계층으로 취급한다.

### 2. Components

현재 시각 공용 컴포넌트의 중심은 별도 React 패키지가 아니라 `src/styles.css`의 CSS API다.

- 표면: `.ag-glass`, `.ag-glass-strong`, `.ag-liquid-glass`, `.ag-operational-surface`
- 구조: `.ag-shell`, `.ag-layout`
- 액션/선택: `.ag-primary-action`, `.ag-secondary-action`, `.ag-segmented`
- 표시/상태: `.ag-kicker`, `.ag-status`
- 동작 요소: native `button`, `input`, `select`, `textarea`

feature JSX 컴포넌트는 해당 기능의 동작과 데이터 경계를 소유한다. 같은 이름의 JSX 컴포넌트를 새로 만들기 전에 위 CSS API와 기존 feature component가 충분한지 먼저 확인한다.

### 3. Patterns

컴포넌트를 조합할 때는 이미 검증된 reference route의 정보 구조를 따른다. `/`는 editorial index, `/interpretation-prep`는 복합 form/result, `/scheduler`는 dense operational workflow의 기준이다. 필요한 pattern이 없으면 먼저 feature-local class로 좁게 만들고, 두 번째 실제 사용과 검증이 생겼을 때만 shared CSS API 승격을 검토한다.

## 최소 검증

UI 파일을 바꾼 뒤 다음 순서로 실행한다.

```bash
npm run check:ui-system -- --changed --files src/path/ChangedPage.jsx src/path/changed.css
git diff --check
npm run build
```

관련 동작 테스트가 있으면 함께 실행한다. `check:ui-system`은 read-only이며 다음을 확인한다.

- registry가 실제 `DESIGN.md`, `src/styles.css`, route/style 파일을 가리키는지
- registry에 적힌 token과 selector가 실제 source에 존재하는지
- 새 JSX/CSS 줄에 raw color, one-off dimension, 새 inline visual style이 들어오지 않았는지

검사 실패를 숫자 조정이나 기존 화면 일괄 수정으로 숨기지 않는다. 정말 필요한 예외는 feature-local로 남기고 작업 메모에 이유·영향·후속 승격 조건을 적는다.

## 완료 기준

- 기존 route와 현재 진행 중인 변경을 보존했다.
- 가장 가까운 기존 pattern과 token을 먼저 재사용했다.
- default / hover / focus / selected / disabled와 loading·empty·error 상태를 확인했다.
- native control, 44px touch target, focus-visible, reduced-motion 규칙을 유지했다.
- `390px`에서 잘림과 가로 overflow가 없고, 필요하면 `768px`·`1280px`에서도 확인했다.
- `check:ui-system`, 관련 테스트, build, `git diff --check`의 결과를 pass/fail/skipped/not-verified로 구분했다.

## 승격과 문서 변경

토큰·공용 pattern·reference route를 실제로 바꾸는 일은 별도 UI 작업으로 취급한다. 그때만 `DESIGN.md`와 `docs/ui-system.json`을 함께 갱신하고, 기존 legacy 화면을 자동 변환하지 않는다. 한 번의 화면 작업에서 나온 유사 값이나 반복 사용만으로 새 공용 token을 만들지 않는다.
