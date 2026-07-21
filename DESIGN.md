---
# Design Tokens
name: softie-project
version: 2.0.0
adoption: new-and-redesigned-surfaces
tokens:
  colors:
    atmosphere-fallback: "#778397"
    canvas: "#111722"
    atmosphere-overlay: "rgba(12, 17, 26, 0.38)"
    surface-glass: "rgba(22, 27, 36, 0.62)"
    surface-glass-strong: "rgba(27, 32, 42, 0.78)"
    surface-operational: "rgba(9, 13, 20, 0.42)"
    surface-selected: "rgba(236, 226, 245, 0.18)"
    text: "#fbf9fb"
    text-muted: "#dddce2"
    text-tertiary: "#b1b2bc"
    brand: "#e6d5ef"
    brand-hover: "#f0e3f5"
    accent: "#eadcf2"
    line: "rgba(255, 255, 255, 0.15)"
    line-strong: "rgba(255, 255, 255, 0.34)"
    focus: "#fff4ff"
  semantic:
    success: "#a7dfc5"
    success-soft: "rgba(117, 195, 158, 0.18)"
    warning: "#f1d09b"
    warning-soft: "rgba(228, 184, 109, 0.18)"
    danger: "#ffb6bd"
    danger-soft: "rgba(236, 127, 139, 0.18)"
  typography:
    font-family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    size-base: "16px"
    size-hero: "clamp(1.45rem, 4.2vw, 2.65rem)"
    size-section: "clamp(1.3rem, 2.2vw, 1.8rem)"
    size-card: "1.15rem"
    size-small: "0.78rem"
    weight-bold: "700"
    weight-medium: "550"
    tracking-display: "-0.04em"
    tracking-kicker: "0.1em"
  spacing:
    layout-padding-mobile: "1rem"
    layout-padding-desktop: "clamp(1.25rem, 3vw, 2.5rem)"
    section-gap: "1.15rem"
    gap-standard: "1rem"
    gap-tight: "0.75rem"
    content-inset: "clamp(1.2rem, 2.5vw, 1.7rem)"
  rounded:
    hero: "28px"
    card: "26px"
    item: "18px"
    control: "14px"
    pill: "999px"
  elevation:
    shadow-glass: "0 26px 70px rgba(12, 17, 27, 0.24)"
    shadow-control: "0 8px 24px rgba(15, 18, 28, 0.12)"
    glass-blur: "24px"
    glass-saturation: "118%"
    highlight: "inset 0 1px 0 rgba(255, 255, 255, 0.20)"
  motion:
    duration-fast: "180ms"
    easing-standard: "ease"
  layout:
    content-simple: "760px"
    content-utility: "860px"
    content-wide: "1180px"
    breakpoint-stack: "700px"
    breakpoint-split: "960px"
    mobile-reference: "390px"
  components:
    button-primary:
      background: "{colors.brand}"
      text: "#28232f"
      min-height: "44px"
      rounded: "{rounded.control}"
    card-primary:
      background: "{colors.surface-glass}"
      border: "1px solid {colors.line}"
      rounded: "{rounded.card}"
      blur: "{elevation.glass-blur}"
    input:
      background: "{colors.surface-operational}"
      border: "1px solid {colors.line}"
      min-height: "44px"
      rounded: "{rounded.control}"
reference-implementations:
  - route: "/interpretation-prep"
    role: "complex utility and form"
    stylesheet: "src/interpretationPrep/interpretationPrep.css"
    atmosphere-image: "src/interpretationPrep/assets/prep-atmosphere.jpg"
  - route: "/"
    role: "editorial service index"
    stylesheet: "src/styles.css"
    atmosphere-image: "src/pages/assets/home-atmosphere.jpg"
legacy-theme:
  name: warm-classic
  status: existing-screens-only
  background: "#f5efe7"
  surface: "rgba(255, 252, 248, 0.88)"
  brand: "#1f6f5f"
---

# Softie Design System

이 문서는 프로젝트의 디자인 진실의 원천(Source of Truth)입니다. 새로운 페이지와 명시적으로 리뉴얼하는 화면은 이 가이드를 기본값으로 사용합니다.

기존 화면은 자동으로 재스타일링하지 않습니다. `warm-classic`을 사용하는 기존 페이지는 기능과 시각 상태를 확인하면서 라우트 단위로 점진적으로 전환합니다.

## 1. Core direction

기본 디자인 방향은 **Atmospheric Glass**입니다.

- **Atmospheric:** 저채도 사진 또는 차분한 단색 캔버스가 화면의 정서를 만듭니다.
- **Selective Glass:** 유리는 주요 계층에만 사용하고 모든 요소를 투명하게 만들지 않습니다.
- **Editorial:** 넓은 여백, 명확한 제목, 작은 키커로 정보에 리듬을 만듭니다.
- **Operational:** 입력과 긴 결과는 안정적인 표면과 높은 대비를 우선합니다.
- **Soft:** 모서리, 그림자, 상태색은 부드럽고 절제된 형태를 유지합니다.

목표는 “몽환적인 분위기”와 “도구로서의 명확성”을 동시에 확보하는 것입니다. 장식이 기능을 가리거나 가독성을 희생해서는 안 됩니다.

## 2. Color system

### Default palette

- **Canvas:** `#111722`
- **Atmosphere fallback:** `#778397`
- **Atmosphere overlay:** `rgba(12, 17, 26, 0.38)`
- **Primary glass:** `rgba(22, 27, 36, 0.62)`
- **Strong glass:** `rgba(27, 32, 42, 0.78)`
- **Operational surface:** `rgba(9, 13, 20, 0.42)`
- **Selected surface:** `rgba(236, 226, 245, 0.18)`
- **Primary text:** `#fbf9fb`
- **Secondary text:** `#dddce2`
- **Tertiary text:** `#b1b2bc`
- **Brand/primary action:** `#e6d5ef`
- **Accent:** `#eadcf2`

순색이나 네온은 기본 팔레트로 사용하지 않습니다. 상태색은 반드시 텍스트·아이콘·테두리 같은 두 번째 신호와 함께 사용합니다.

## 3. Atmospheric imagery

사진은 장식이 아니라 최상위 배경 레이어입니다.

- 새벽, 안개, 물, 흐린 초원, 저채도 자연처럼 피사체가 조용한 이미지를 선호합니다.
- 중앙과 주요 텍스트 뒤는 낮은 대비여야 합니다.
- 배경에는 단색 반투명 오버레이를 적용해 화면 전체의 텍스트 대비를 안정화합니다.
- 화면별 이미지가 없다면 `atmosphere-fallback` 또는 `canvas`를 사용합니다.
- 실제 사진 자산 없이 CSS 그래디언트·도형·임시 박스로 사진 분위기를 흉내 내지 않습니다.
- 사진 위에 텍스트가 직접 놓이는 경우에도 본문은 반드시 읽을 수 있어야 합니다.

`prep-atmosphere.jpg`는 방향을 보여주는 기준 자산이지 모든 페이지에 강제로 재사용하는 공용 배경은 아닙니다. 새 기능은 맥락에 맞는 승인된 이미지 또는 단색 fallback을 선택합니다.

## 4. Surface hierarchy

한 화면에서는 다음 세 단계만 사용합니다.

1. **Atmosphere / Canvas:** 사진 또는 단색 바닥 레이어.
2. **Primary Glass:** 히어로, 내비게이션, 주요 섹션 카드. `surface-glass`와 `blur(24px)`를 기본으로 사용합니다.
3. **Operational Surface:** 입력창, 데이터 행, 펼침 영역, 긴 결과. `surface-operational` 또는 `surface-glass-strong`을 사용합니다.

유리 패널 안에 또 다른 유리 패널을 반복해서 중첩하지 않습니다. 내부 요소는 더 단단한 표면이나 구분선으로 정리합니다.

## 5. Typography

- 기본 글꼴은 시스템 산세리프를 사용해 한글 가독성과 성능을 확보합니다.
- 히어로 제목은 가능한 한 한 줄로 유지하고, 모바일에서는 크기를 줄여 억지 줄바꿈을 피합니다.
- 제목은 `700`, 좁은 자간 `-0.04em`을 기본으로 합니다.
- 영문 키커는 `0.78rem`, `700`, `0.1em`, Uppercase를 사용합니다.
- 본문은 최소 `16px`, 권장 line-height `1.55–1.7`을 사용합니다.
- 세리프 글꼴은 에디토리얼 콘텐츠의 짧은 표시 제목에만 선택적으로 허용하며, 입력·데이터·상태 UI에는 사용하지 않습니다.

## 6. Layout and density

- **Simple page:** 최대 `760px`
- **Utility page:** 최대 `860px`
- **Wide/split workspace:** 최대 `1180px`
- **Mobile reference:** `390px`
- **Stack breakpoint:** `<700px`
- **Split workspace breakpoint:** `>=960px`

모바일에서는 콘텐츠를 한 열로 쌓되, 관련 선택지가 짧으면 2–3열 캡슐형 그룹을 유지할 수 있습니다. 주요 액션은 화면 밖으로 밀리거나 가로 스크롤을 만들면 안 됩니다.

## 7. Shape, depth, and motion

- 히어로 `28px`, 주요 카드 `26px`, 내부 항목 `18px`, 컨트롤 `14px`, 배지는 pill 형태를 사용합니다.
- 그림자는 넓고 부드럽게 퍼지게 하며 딱딱한 검은 외곽선을 만들지 않습니다.
- 유리 표면은 얇은 밝은 테두리와 상단 하이라이트로 경계를 보여줍니다.
- 기본 전환은 `180ms ease`를 사용하며 위치 변화는 작게 유지합니다.
- `prefers-reduced-motion`에서는 전환과 애니메이션 시간을 사실상 제거합니다.

## 8. Component defaults

### Buttons

- Primary는 밝은 펄 라벤더 배경과 어두운 텍스트를 사용합니다.
- Secondary/Ghost는 투명 배경과 밝은 테두리를 사용합니다.
- 최소 높이는 `44px`이며 모바일 터치 영역을 줄이지 않습니다.
- Hover, active, focus, disabled 상태를 모두 정의합니다.

### Cards

- 주요 카드는 `Primary Glass`를 사용합니다.
- 긴 본문이나 데이터 목록은 더 불투명한 `Operational Surface`를 사용합니다.
- 카드가 많아질수록 그림자를 반복하지 말고 구분선과 표면 차이로 계층을 표현합니다.

### Forms

- Input/Select/Textarea는 최소 높이 `44px`, radius `14px`를 사용합니다.
- 입력 표면은 배경 사진보다 충분히 어둡고 안정적이어야 합니다.
- 라벨은 placeholder로 대체하지 않습니다.
- 선택 상태는 배경, 테두리, 텍스트 중 최소 두 가지 신호로 표시합니다.

### Tabs and segmented controls

- 바깥 컨테이너는 조용한 operational surface를 사용합니다.
- 선택된 항목만 밝은 테두리와 라벤더 표면으로 들어 올립니다.
- 선택 여부는 색상만으로 전달하지 않으며 키보드 포커스를 제공합니다.

### Status and feedback

- Success, warning, danger는 채도가 낮은 semantic 색상을 사용합니다.
- 상태 배지는 텍스트를 항상 포함합니다.
- 오류 메시지는 문제와 다음 행동을 함께 설명합니다.

## 9. Accessibility baseline

- 일반 본문은 WCAG AA 기준 `4.5:1` 이상, 큰 텍스트는 `3:1` 이상을 목표로 합니다.
- 주요 컨트롤과 터치 영역은 최소 `44×44px`입니다.
- 포커스는 `2px` 밝은 외곽선과 `3px` 간격을 기본으로 합니다.
- hover만으로 핵심 정보를 노출하지 않습니다.
- 상태·선택·오류는 색상만으로 구분하지 않습니다.
- `390px`에서 가로 스크롤, 잘린 텍스트, 화면 밖 주요 액션이 없어야 합니다.
- `forced-colors`와 `prefers-reduced-motion`을 고려합니다.

## 10. Do and don't

### Do

- 분위기 이미지와 정보 표면의 역할을 분리합니다.
- 히어로와 주요 섹션에만 유리 효과를 집중합니다.
- 복잡한 데이터일수록 내부 표면의 대비를 높입니다.
- 여백과 타이포그래피로 먼저 계층을 만들고 장식은 나중에 추가합니다.
- 실제 사용 상태와 긴 콘텐츠로 모바일·데스크톱을 검증합니다.

### Don't

- 모든 카드와 버튼에 blur와 그림자를 반복하지 않습니다.
- 검정 단색 카드가 화면 전체를 지배하게 만들지 않습니다.
- CSS 그래디언트나 장식 도형으로 사진 자산을 대체하지 않습니다.
- 네온, 순색, 강한 광택, 두꺼운 그림자를 기본 스타일로 사용하지 않습니다.
- 투명도를 높이는 대신 텍스트 대비를 희생하지 않습니다.

## 11. Adoption and implementation

- 이 가이드는 **새 페이지와 명시적으로 리뉴얼하는 페이지의 기본값**입니다.
- 기존 `warm-classic` 화면은 자동 변경하지 않고 라우트 단위로 마이그레이션합니다.
- 새 화면은 기능별 shell 클래스로 범위를 제한한 뒤 검증되면 공통 토큰으로 승격합니다.
- 공통 토큰과 재사용 컴포넌트는 `src/styles.css`에서 관리합니다.
- 기능 전용 스타일과 이미지 자산은 해당 기능 폴더에 둡니다.
- `/interpretation-prep`은 복잡한 입력·결과 도구의 reference implementation입니다.
- `/` 홈은 서비스 인덱스와 에디토리얼 히어로의 reference implementation입니다.

두 화면은 같은 토큰과 표면 계층을 공유하지만 맥락에 맞는 배경 이미지와 밀도를 사용합니다. 새 화면은 둘 중 더 가까운 정보 구조를 기준으로 삼고, 외형을 그대로 복제하지 않습니다.

### Reusable CSS API

- `data-design-theme="atmospheric"`: 기존 공통 변수(`--surface`, `--text`, `--brand` 등)를 Atmospheric Glass 토큰으로 연결합니다.
- `.ag-shell`: 사진 또는 단색 atmosphere와 대비 오버레이를 제공하는 전체 화면 shell입니다.
- `.ag-layout`: 최대 너비와 safe-area를 포함한 공통 콘텐츠 레이아웃입니다.
- `.ag-glass`, `.ag-glass-strong`: 주요 글라스와 더 안정적인 강한 글라스 표면입니다.
- `.ag-operational-surface`: 입력·데이터·긴 결과를 위한 내부 표면입니다.
- `.ag-primary-action`, `.ag-secondary-action`: 공통 버튼 상태를 제공합니다.
- `.ag-segmented`: 탭·라디오형 선택 그룹의 공통 컨테이너입니다.
- `.ag-kicker`, `.ag-status`: 키커와 텍스트 기반 상태 배지입니다.

새 페이지는 theme attribute와 필요한 `ag-*` 패턴만 선택해 사용합니다. 기존 `.hero`, `.card`, `button` 전역 클래스에는 Atmospheric Glass를 자동 적용하지 않습니다.

## 12. Definition of done

새 화면은 다음 조건을 만족해야 디자인 완료로 봅니다.

- 배경, primary glass, operational surface의 세 계층이 명확합니다.
- 핵심 정보와 주요 액션이 첫 화면에서 이해됩니다.
- hover, focus, selected, disabled, error 상태가 존재합니다.
- `390px`, `768px`, `1280px`에서 레이아웃을 확인했습니다.
- 핵심 흐름이 실제 데이터로 동작합니다.
- 브라우저 콘솔 오류가 없습니다.
- 접근성 기준과 reduced-motion 동작을 확인했습니다.

## When to update DESIGN.md

- 기본 토큰, 공통 컴포넌트, 표면 계층이 변경될 때.
- 새 재사용 패턴이나 공식적인 테마 변형이 도입될 때.
- reference implementation이 바뀌거나 더 대표적인 화면이 생길 때.
- 실제 구현 과정에서 이 문서가 모호하거나 서로 충돌한다고 확인될 때.
