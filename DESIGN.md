---
# Design Tokens
name: softie-project
version: 2.4.1
adoption: new-and-redesigned-surfaces
tokens:
  colors:
    atmosphere-fallback: "#5b5848"
    canvas: "#11120f"
    atmosphere-overlay: "rgba(18, 18, 13, 0.40)"
    surface-glass: "rgba(45, 41, 34, 0.66)"
    surface-glass-strong: "rgba(37, 34, 29, 0.82)"
    surface-operational: "rgba(17, 17, 14, 0.52)"
    surface-selected: "rgba(219, 204, 175, 0.20)"
    surface-liquid: "rgba(32, 29, 23, 0.44)"
    surface-liquid-strong: "rgba(32, 29, 23, 0.50)"
    text: "#f4eee4"
    text-muted: "#d0c7b9"
    text-tertiary: "#a39b8c"
    brand: "#d5c5aa"
    brand-hover: "#e3d7c0"
    accent: "#d8c9ae"
    line: "rgba(238, 229, 210, 0.14)"
    line-strong: "rgba(238, 229, 210, 0.31)"
    line-liquid: "rgba(255, 246, 228, 0.42)"
    highlight-liquid: "rgba(255, 255, 255, 0.34)"
    focus: "#fff1d2"
  semantic:
    success: "#b8c8a5"
    success-soft: "rgba(134, 153, 111, 0.22)"
    warning: "#d6b37e"
    warning-soft: "rgba(186, 143, 78, 0.20)"
    danger: "#d7a0a0"
    danger-soft: "rgba(161, 84, 85, 0.22)"
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
    shadow-glass: "0 26px 70px rgba(13, 12, 9, 0.28)"
    shadow-control: "0 8px 24px rgba(18, 16, 12, 0.16)"
    shadow-liquid: "0 30px 72px rgba(10, 9, 7, 0.34)"
    glass-blur: "24px"
    glass-saturation: "118%"
    liquid-blur: "16px"
    liquid-saturation: "132%"
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
      text: "#2f2a22"
      min-height: "44px"
      rounded: "{rounded.control}"
    card-primary:
      background: "{colors.surface-glass}"
      border: "1px solid {colors.line}"
      rounded: "{rounded.card}"
      blur: "{elevation.glass-blur}"
    card-liquid:
      background: "{colors.surface-liquid}"
      border: "1px solid {colors.line-liquid}"
      rounded: "{rounded.card}"
      blur: "{elevation.liquid-blur}"
    input:
      background: "{colors.surface-operational}"
      border: "1px solid {colors.line}"
      min-height: "44px"
      rounded: "{rounded.control}"
reference-implementations:
  - route: "/interpretation-prep"
    role: "complex utility and form"
    stylesheet: "src/interpretationPrep/interpretationPrep.css"
    atmosphere-image: "src/scheduler/assets/scheduler-atmosphere-v4.jpg"
  - route: "/"
    role: "editorial service index"
    stylesheet: "src/styles.css"
    atmosphere-image: "src/scheduler/assets/scheduler-atmosphere-v4.jpg"
  - route: "/scheduler"
    role: "dense operational workflow"
    stylesheet: "src/styles.css"
    atmosphere-image: "src/scheduler/assets/scheduler-atmosphere-v4.jpg"
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

기본 디자인 방향은 **Warm Nostalgic Atmospheric Glass**입니다.

- **Warm Nostalgic:** 빛바랜 필름처럼 따뜻한 올리브·세피아·크림 계열이 정서를 만듭니다.
- **Atmospheric:** 저채도 사진 또는 차분한 단색 캔버스가 화면의 깊이를 만듭니다.
- **Selective Glass:** 유리는 주요 계층에만 사용하고 모든 요소를 투명하게 만들지 않습니다.
- **Editorial:** 넓은 여백, 명확한 제목, 작은 키커로 정보에 리듬을 만듭니다.
- **Operational:** 입력과 긴 결과는 안정적인 표면과 높은 대비를 우선합니다.
- **Soft:** 모서리, 그림자, 상태색은 부드럽고 절제된 형태를 유지합니다.

목표는 “조용하고 오래된 사진 같은 온기”와 “도구로서의 명확성”을 동시에 확보하는 것입니다. 장식이 기능을 가리거나 가독성을 희생해서는 안 됩니다.

## 2. Color system

### Default palette

- **Canvas — Forest Charcoal:** `#11120f`
- **Atmosphere fallback — Faded Olive:** `#5b5848`
- **Atmosphere overlay — Sepia Shadow:** `rgba(18, 18, 13, 0.40)`
- **Primary glass — Smoked Taupe:** `rgba(45, 41, 34, 0.66)`
- **Strong glass — Dark Walnut Smoke:** `rgba(37, 34, 29, 0.82)`
- **Operational surface — Ink Olive:** `rgba(17, 17, 14, 0.52)`
- **Selected surface — Aged Parchment:** `rgba(219, 204, 175, 0.20)`
- **Primary text — Warm Ivory:** `#f4eee4`
- **Secondary text — Linen Beige:** `#d0c7b9`
- **Tertiary text — Weathered Stone:** `#a39b8c`
- **Brand/primary action — Parchment Cream:** `#d5c5aa`
- **Accent — Soft Oat:** `#d8c9ae`
- **Success — Muted Sage:** `#b8c8a5`
- **Warning — Honey Ochre:** `#d6b37e`
- **Danger — Dusty Rose:** `#d7a0a0`

순색이나 네온은 기본 팔레트로 사용하지 않습니다. 상태색은 반드시 텍스트·아이콘·테두리 같은 두 번째 신호와 함께 사용합니다.

## 3. Atmospheric imagery

사진은 장식이 아니라 최상위 배경 레이어입니다.

- 어두운 숲, 늦은 오후의 길, 실내 전구빛, 오래된 패브릭, 빛바랜 꽃처럼 피사체가 조용하고 온도가 따뜻한 이미지를 선호합니다.
- 필름 그레인, 낮은 채도, 깊은 그림자는 허용하지만 본문 뒤의 명암 변화는 과하지 않아야 합니다.
- 중앙과 주요 텍스트 뒤는 낮은 대비여야 합니다.
- 배경에는 단색 반투명 오버레이를 적용해 화면 전체의 텍스트 대비를 안정화합니다.
- 화면별 이미지가 없다면 `atmosphere-fallback` 또는 `canvas`를 사용합니다.
- 실제 사진 자산 없이 CSS 그래디언트·도형·임시 박스로 사진 분위기를 흉내 내지 않습니다.
- 사진 위에 텍스트가 직접 놓이는 경우에도 본문은 반드시 읽을 수 있어야 합니다.

홈·해석 준비 도구·스케줄러의 승인된 공용 기준 배경은 `scheduler-atmosphere-v4.jpg`입니다. 낡은 토프 패브릭, 작은 곰 인형, 헤드폰과 악기처럼 개인 작업실을 암시하는 피사체를 사용하되, 화면 중앙과 상단은 글라스 카드가 안정적으로 읽히도록 어둡고 단순한 면을 남깁니다. 곰 인형은 카메라와 직접 눈을 맞추지 않고 화면 왼쪽 아래를 향해 조용한 보조 피사체로 머물게 합니다. 피사체보다 **olive-charcoal 그림자, cocoa·taupe 중간색, aged cream 하이라이트, 잔잔한 필름 입자**를 핵심 자산 특성으로 봅니다.

- 모바일 크롭을 우선하며, 피사체는 오른쪽 아래에 작게 배치합니다.
- 배경 사진 자체가 이미 어두우면 `background-blend-mode`로 추가 착색하지 않고 낮은 강도의 단색 오버레이만 사용합니다.
- 승인된 세 기준 화면은 같은 사진을 사용해 제품의 정서를 연결하되, 오버레이 강도와 글라스 불투명도는 정보 밀도에 맞게 조절합니다.
- 긴 페이지에서도 사진이 문서 높이만큼 늘어나지 않도록 배경 사진 레이어는 viewport에 고정합니다.
- 아직 `warm-classic`을 쓰는 기존 도구는 기능 상태를 확인한 뒤 라우트 단위로 전환합니다.
- 사용자 제공 사진은 분위기와 팔레트 참고 자료로만 사용하고 제품 자산에 직접 복사하지 않습니다.

## 4. Surface hierarchy

한 화면에서는 다음 세 단계만 사용합니다.

1. **Atmosphere / Canvas:** 사진 또는 단색 바닥 레이어.
2. **Primary Glass:** 히어로, 내비게이션, 주요 섹션 카드. `surface-glass`와 `blur(24px)`를 기본으로 사용합니다.
3. **Operational Surface:** 입력창, 데이터 행, 펼침 영역, 긴 결과. `surface-operational` 또는 `surface-glass-strong`을 사용합니다.

유리 패널 안에 또 다른 유리 패널을 반복해서 중첩하지 않습니다. 내부 요소는 더 단단한 표면이나 구분선으로 정리합니다.

### Warm Liquid Glass variant

Warm Liquid Glass는 따뜻한 사진의 색과 형태가 패널 안에서도 보이도록 투명도와 가장자리 빛을 강화한 선택적 변형입니다.

- **Liquid surface:** `rgba(32, 29, 23, 0.44)`를 사용해 배경의 색과 큰 형태를 남깁니다.
- **Liquid strong surface:** 모달처럼 집중이 필요한 부유 패널에는 `rgba(32, 29, 23, 0.50)`를 사용합니다.
- **Edge light:** `rgba(255, 246, 228, 0.42)`의 얇은 외곽선과 `rgba(255, 255, 255, 0.34)`의 상단 하이라이트를 함께 사용합니다.
- **Optics:** `blur(16px)`, `saturate(132%)`를 기본으로 하며, 배경이 완전히 뭉개지지 않도록 일반 Primary Glass보다 블러를 낮춥니다.
- **Use for:** 로그인·계정 카드, 히어로 요약, 필터·설정·확인 모달, 화면당 한 개의 주요 폼처럼 정보 밀도가 낮은 핵심 표면.
- **Avoid for:** 반복 일정, 표·목록, 긴 결과, 작은 버튼처럼 한 화면에 많이 반복되거나 빠른 판독이 필요한 표면.
- Liquid Glass 내부 입력은 밝은 반투명 표면을 사용할 수 있지만, 텍스트 대비와 라벨은 Operational 기준을 유지합니다.

이 변형은 전체 화면을 유리로 만드는 새 기본 테마가 아니라, Warm Nostalgic Atmospheric Glass 안에서 중요도가 높은 표면에만 사용하는 강조 단계입니다.

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

- Primary는 빛바랜 양피지 크림 배경과 짙은 웜 차콜 텍스트를 사용합니다.
- Secondary/Ghost는 투명 배경과 밝은 테두리를 사용합니다.
- Primary와 폼 액션은 외형과 터치 영역 모두 최소 `44px`을 사용합니다.
- 카드 안에 반복되는 보조 액션은 터치 영역 `44px`을 유지하면서 보이는 캡슐을 `30–36px`로 줄일 수 있습니다. 상태 배지와 나란히 놓이는 액션은 `30–32px`, 독립적인 보조 액션은 `34–36px`을 권장합니다. 이때 인접 터치 영역은 겹치지 않고 `6–8px` 간격을 둡니다.
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
- 선택된 항목만 밝은 테두리와 에이지드 파치먼트 표면으로 들어 올립니다.
- 선택 여부는 색상만으로 전달하지 않으며 키보드 포커스를 제공합니다.

### Status and feedback

- Success, warning, danger는 채도가 낮은 semantic 색상을 사용합니다.
- 상태 배지는 텍스트를 항상 포함합니다.
- 오류 메시지는 문제와 다음 행동을 함께 설명합니다.

## 9. Accessibility baseline

- 일반 본문은 WCAG AA 기준 `4.5:1` 이상, 큰 텍스트는 `3:1` 이상을 목표로 합니다.
- 주요 컨트롤과 모든 터치 영역은 최소 `44×44px`입니다. 조밀한 보조 액션은 44px 투명 컨테이너 안에 더 작은 시각 요소를 배치합니다.
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
- Warm Nostalgic 팔레트는 `2.1.0`부터 Atmospheric Glass의 공식 기본 팔레트입니다.
- 기존 `warm-classic` 화면은 자동 변경하지 않고 라우트 단위로 마이그레이션합니다.
- 새 화면은 기능별 shell 클래스로 범위를 제한한 뒤 검증되면 공통 토큰으로 승격합니다.
- 공통 토큰과 재사용 컴포넌트는 `src/styles.css`에서 관리합니다.
- 기능 전용 스타일과 이미지 자산은 해당 기능 폴더에 둡니다.
- `/interpretation-prep`은 복잡한 입력·결과 도구의 reference implementation입니다.
- `/` 홈은 서비스 인덱스와 에디토리얼 히어로의 reference implementation입니다.
- `/scheduler`는 반복 이벤트, 상태 색상, 모바일 폼을 포함한 고밀도 operational workflow의 reference implementation입니다.

세 화면은 같은 토큰과 표면 계층을 공유하지만 맥락에 맞는 배경 이미지와 밀도를 사용합니다. 새 화면은 셋 중 더 가까운 정보 구조를 기준으로 삼고, 외형을 그대로 복제하지 않습니다.

### Reusable CSS API

- `data-design-theme="atmospheric"`: 기존 공통 변수(`--surface`, `--text`, `--brand` 등)를 Atmospheric Glass 토큰으로 연결합니다.
- `.ag-shell`: 사진 또는 단색 atmosphere와 대비 오버레이를 제공하는 전체 화면 shell입니다.
- `.ag-layout`: 최대 너비와 safe-area를 포함한 공통 콘텐츠 레이아웃입니다.
- `.ag-glass`, `.ag-glass-strong`: 주요 글라스와 더 안정적인 강한 글라스 표면입니다.
- `.ag-liquid-glass`: 로그인·히어로·모달처럼 밀도가 낮은 핵심 표면을 위한 고투명도 Glass 변형입니다.
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
- 새로운 사진 무드보드가 현재 기본 팔레트보다 프로젝트의 정서를 더 잘 대표하고, 실제 화면 검증까지 통과했을 때.
