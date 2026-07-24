---
# Design Tokens
name: softie-project
version: 3.1.0
status: design-contract
adoption: new-and-explicitly-redesigned-surfaces
source:
  title: "Apple iOS 27 UI Kit"
  file: "../softie_design/Apple iOS 27 UI Kit.sketch"
  sha256: "5941547509b49a3756667905f18492dfdf4e59a977de1deacccfcf7ff94ac295"
  sketch-version: "2026.2"
  sketch-build: 231037
  pages: 34
  shared-swatches: 107
  text-styles: 105
  layer-styles: 42
tokens:
  color:
    light:
      background-primary: "#FFFFFF"
      background-secondary: "#F2F2F7"
      grouped-primary: "#F2F2F7"
      grouped-secondary: "#FFFFFF"
      label-primary: "#000000"
      label-secondary: "rgba(60, 60, 67, 0.60)"
      label-tertiary: "rgba(60, 60, 67, 0.30)"
      label-quaternary: "rgba(60, 60, 67, 0.18)"
      fill-primary: "rgba(120, 120, 120, 0.20)"
      fill-secondary: "rgba(120, 120, 128, 0.16)"
      fill-tertiary: "rgba(118, 118, 128, 0.12)"
      fill-quaternary: "rgba(116, 116, 128, 0.08)"
      separator: "rgba(0, 0, 0, 0.12)"
      separator-opaque: "#C6C6C8"
      accent: "#0088FF"
      destructive: "#FF383C"
      success: "#34C759"
      warning: "#FF8D28"
    dark:
      background-primary: "#000000"
      background-secondary: "#1C1C1E"
      grouped-primary: "#000000"
      grouped-secondary: "#1C1C1E"
      grouped-tertiary: "#2C2C2E"
      elevated-primary: "#1C1C1E"
      elevated-secondary: "#2C2C2E"
      label-primary: "#FFFFFF"
      label-secondary: "rgba(235, 235, 245, 0.60)"
      label-tertiary: "rgba(235, 235, 245, 0.30)"
      label-quaternary: "rgba(235, 235, 245, 0.16)"
      fill-primary: "rgba(120, 120, 128, 0.36)"
      fill-secondary: "rgba(120, 120, 128, 0.32)"
      fill-tertiary: "rgba(118, 118, 128, 0.24)"
      fill-quaternary: "rgba(118, 118, 128, 0.18)"
      separator: "rgba(255, 255, 255, 0.12)"
      separator-opaque: "#38383A"
      accent: "#0091FF"
      destructive: "#FF4245"
      success: "#30D158"
      warning: "#FF9230"
    liquid-label:
      light-primary: "#1A1A1A"
      light-secondary: "#727272"
      dark-primary: "#EDEDED"
      dark-secondary: "#8A8A8A"
  typography:
    family: "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Segoe UI', sans-serif"
    large-title: "34px/41px 700"
    title-1: "28px/34px 400"
    title-2: "22px/28px 700"
    title-3: "20px/25px 400"
    headline: "17px/22px 600"
    body: "17px/22px 400"
    callout: "16px/21px 400"
    subheadline: "15px/20px 400"
    footnote: "13px/18px 400"
    caption-1: "12px/16px 500"
    caption-2: "11px/13px 600"
  metrics:
    mobile-reference-source: "402px"
    mobile-regression-width: "390px"
    content-inset: "16px"
    touch-target-min: "44px"
    row-default: "52px"
    row-large: "68px"
    input-height: "52px"
    button-small-visual: "28px"
    button-regular-visual: "34px"
    button-large-visual: "50px"
    tab-bar-glass-height: "62px"
  spacing:
    1: "4px"
    2: "8px"
    3: "12px"
    4: "16px"
    5: "20px"
    6: "24px"
    8: "32px"
    10: "40px"
  radius:
    control: "17px"
    group: "22px"
    sheet: "28px"
    pill: "999px"
  material:
    regular-web-blur: "24px"
    regular-web-saturation: "120%"
    liquid-web-blur: "15px"
    liquid-web-saturation: "140%"
    fallback: "opaque background-secondary/elevated"
  motion:
    web-fast: "160ms"
    web-standard: "240ms"
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
legacy-themes:
  atmospheric:
    status: existing-implementation-only
    selector: "data-design-theme='atmospheric'"
    api: "ag-*"
  warm-classic:
    status: existing-screens-only
---

# Softie Design System — iOS 27

이 문서는 Softie의 새 화면과 명시적으로 리뉴얼하는 화면을 위한 디자인 진실의 원천입니다. 기준 자료는 사용자가 추가한 Apple 공식 `Apple iOS 27 UI Kit.sketch`이며, 문서의 수치와 색상은 해당 Sketch 패키지의 공유 스와치·텍스트 스타일·컴포넌트 프레임에서 추출했습니다.

이 시스템의 목표는 iOS 화면을 픽셀 단위로 복제하는 것이 아닙니다. Apple의 **명확한 정보 위계, 동적 색상, 콘텐츠 중심 표면, 선택적 Liquid Glass, 일관된 컨트롤 크기**를 React/Vite 웹 앱에 맞게 번역합니다.

## 1. Design direction

기본 방향은 **Native Clarity with Selective Liquid Glass**입니다.

- **Content first:** 장식보다 일정, 상태, 입력값, 다음 행동이 먼저 읽혀야 합니다.
- **System hierarchy:** 크기, 굵기, 동적 레이블 색상으로 위계를 만들고 카드와 그림자를 반복하지 않습니다.
- **Adaptive:** Light/Dark를 각각 설계합니다. 한 모드의 색을 반전해 다른 모드를 만들지 않습니다.
- **Selective glass:** Liquid Glass는 내비게이션과 떠 있는 컨트롤에 집중합니다. 본문 전체를 유리 카드로 덮지 않습니다.
- **Concentric geometry:** 컨테이너와 내부 컨트롤의 곡률은 같은 중심을 공유하는 것처럼 정렬합니다.
- **Operational calm:** 모바일에서 짧게 사용하는 도구답게 한 화면의 선택지와 강조점을 줄입니다.

Softie의 개성은 시스템 UI를 변형하는 장식보다 카피, 콘텐츠, 이미지 선택, 데이터 표현에서 만듭니다.

## 2. Source fidelity and web adaptation

### Source-exact facts

- 공식 예제 iPhone 아트보드는 `402×874pt`입니다.
- 기본 텍스트 필드는 `288×52pt`, 좌우 인셋은 `16pt`입니다.
- 기본 목록 행은 `52pt`, 큰 행은 `68pt`입니다.
- 버튼의 시각 높이는 Small `28pt`, Regular/Medium `34pt`, Large `50pt`입니다.
- iPhone 탭 바의 Glass 묶음은 `346×62pt`이며 개별 탭은 `54–72pt` 폭을 사용합니다.
- 공유 타입 역할은 Large Title `34/41`, Title 1 `28/34`, Title 2 `22/28`, Title 3 `20/25`, Headline/Body `17/22`를 중심으로 구성됩니다.
- 공식 Liquid Glass Medium 스타일은 custom glass blur `15`, saturation `1.4`, distortion `0.3`, depth `0.9`를 포함합니다.
- 공식 Regular Material은 blur `75`를 사용하고, Light는 흰색 혼합 레이어, Dark는 검정 반투명 레이어로 모드별 광학 특성을 다르게 만듭니다.

### Web adaptation rules

- CSS `backdrop-filter`는 Sketch의 distortion, depth, 조명 효과를 동일하게 재현하지 못합니다. 웹 구현은 **시각적 등가물**이며 Apple 렌더러와 픽셀 일치를 주장하지 않습니다.
- `pt`는 이 프로젝트의 CSS에서 기본적으로 `px`와 1:1 설계 단위로 번역하되, 브라우저 확대와 사용자 글꼴 설정을 막지 않습니다.
- Apple 플랫폼 글꼴은 `-apple-system`으로 사용합니다. SF Pro 폰트 파일을 저장소에 복사하거나 웹폰트로 재배포하지 않습니다.
- 앱의 실제 회귀 기준은 기존 지원 폭 `390px`과 소스 기준 `402px`를 모두 사용합니다.
- 값이 Source-exact 목록에 없으면 이 문서의 수치는 Softie 웹 구현 규칙이지 Apple의 공식 수치가 아닙니다.

## 3. Color system

색상은 용도가 아니라 외형으로 이름 짓지 않습니다. `label-secondary`를 임의의 회색으로 바꾸거나 Light 토큰을 Dark에서 재사용하지 않습니다.

### Light

| Role | Value | Use |
| --- | --- | --- |
| Background primary | `#FFFFFF` | 일반 페이지 바닥 |
| Grouped background | `#F2F2F7` | 설정, 폼, 그룹 목록 바닥 |
| Grouped secondary | `#FFFFFF` | 그룹 내부 표면 |
| Label primary | `#000000` | 제목, 현재 값, 핵심 본문 |
| Label secondary | `rgba(60, 60, 67, 0.60)` | 설명, 메타데이터 |
| Label tertiary | `rgba(60, 60, 67, 0.30)` | 비활성 보조 정보 |
| Fill secondary | `rgba(120, 120, 128, 0.16)` | 비강조 컨트롤 배경 |
| Separator | `rgba(0, 0, 0, 0.12)` | 목록 구분선 |
| Accent | `#0088FF` | 기본 상호작용, 선택, 포커스 |
| Destructive | `#FF383C` | 삭제와 파괴적 동작 |

### Dark

| Role | Value | Use |
| --- | --- | --- |
| Background primary | `#000000` | 기본 바닥 |
| Background secondary | `#1C1C1E` | 일반 보조 표면 |
| Grouped tertiary | `#2C2C2E` | 중첩된 운영 표면 |
| Label primary | `#FFFFFF` | 제목, 현재 값, 핵심 본문 |
| Label secondary | `rgba(235, 235, 245, 0.60)` | 설명, 메타데이터 |
| Label tertiary | `rgba(235, 235, 245, 0.30)` | 비활성 보조 정보 |
| Fill secondary | `rgba(120, 120, 128, 0.32)` | 비강조 컨트롤 배경 |
| Separator | `rgba(255, 255, 255, 0.12)` | 목록 구분선 |
| Accent | `#0091FF` | 기본 상호작용, 선택, 포커스 |
| Destructive | `#FF4245` | 삭제와 파괴적 동작 |

### Semantic use

- Accent는 한 화면의 주요 상호작용에만 사용합니다. 제목과 장식에 반복하지 않습니다.
- Success는 Light `#34C759`, Dark `#30D158`을 사용하되 텍스트나 아이콘을 함께 표시합니다.
- Warning은 Light `#FF8D28`, Dark `#FF9230`을 사용합니다. 단순 대기 상태를 오류처럼 표현하지 않습니다.
- Destructive는 실제 데이터 삭제, 구독 해제, 방 나가기처럼 되돌리기 어려운 행동에만 사용합니다.
- 사진 위 텍스트는 사진 자체에 직접 의존하지 않습니다. 읽기 가능한 Material 또는 불투명 표면을 먼저 제공합니다.
- `color-scheme: light dark`와 모드별 변수 집합을 사용합니다. CSS 필터로 전체 화면을 반전하지 않습니다.

## 4. Typography

공식 타입 역할을 그대로 이름으로 사용합니다.

| Role | Size / line-height | Default weight | Use |
| --- | --- | --- | --- |
| Large Title | `34px / 41px` | `700` | 페이지의 한 가지 큰 제목 |
| Title 1 | `28px / 34px` | `400` | 주요 화면 제목 |
| Title 2 | `22px / 28px` | `700` | 큰 섹션 제목 |
| Title 3 | `20px / 25px` | `400` | 카드·시트 제목 |
| Headline | `17px / 22px` | `600` | 행 제목, 강조 값 |
| Body | `17px / 22px` | `400` | 입력값, 본문, 일반 목록 |
| Callout | `16px / 21px` | `400` | 짧은 설명, 보조 컨트롤 |
| Subheadline | `15px / 20px` | `400` | 메타데이터 |
| Footnote | `13px / 18px` | `400` | 도움말, 각주 |
| Caption 1 | `12px / 16px` | `500` | 배지, 짧은 보조 라벨 |
| Caption 2 | `11px / 13px` | `600` | 공간이 제한된 시스템 메타 |

- 실제 `input`, `select`, `textarea`는 iOS Safari 자동 확대를 막기 위해 `16px` 이상을 유지합니다.
- 기본 자간은 `normal`입니다. 현재의 과도한 `-0.04em` 제목과 영문 대문자 키커는 신규 화면의 기본 패턴이 아닙니다.
- 한 화면에는 Large Title을 하나만 사용합니다. 운영 화면은 Title 2 또는 Title 3부터 시작해도 됩니다.
- 본문을 Caption 크기로 줄여 밀도를 확보하지 않습니다. 행 구조와 정보 우선순위를 먼저 정리합니다.
- 한글은 시스템 한글 글꼴로 자연스럽게 대체되며, SF Pro의 영문 수치만 맞추기 위해 별도 글꼴을 강제하지 않습니다.

## 5. Layout and density

- 모바일은 `402px` 공식 아트보드를 설계 기준으로 보고 `390px`에서 반드시 회귀 확인합니다.
- 기본 좌우 콘텐츠 인셋은 `16px`입니다.
- 공통 간격은 `4, 8, 12, 16, 20, 24, 32, 40px`만 사용합니다. 새 임의 간격은 두 화면 이상에서 필요성이 확인된 뒤 추가합니다.
- 페이지는 safe area를 존중하고 하단 고정 컨트롤은 `env(safe-area-inset-bottom)`을 포함합니다.
- 기본 목록 행과 텍스트 필드는 `52px`, 두 줄 정보나 큰 썸네일 행은 `68px`를 사용합니다.
- 하나의 모바일 화면에서 주요 액션은 원칙적으로 하나입니다.
- 그룹형 화면은 큰 카드 여러 개보다 `grouped background → section → row` 구조를 우선합니다.
- 데스크톱에서는 모바일 UI를 무한히 늘리지 않습니다. 단순 폼 `680px`, 운영 도구 `860px`, 분할 작업공간 `1180px`을 상한의 출발점으로 사용합니다.
- `>=960px`에서만 분할 레이아웃을 고려합니다. 그 전에는 한 열의 읽기 순서를 유지합니다.

## 6. Materials and Liquid Glass

### Material

Material은 콘텐츠와 배경을 분리하는 시스템 표면입니다. 목록, 긴 결과, 입력 영역처럼 읽기가 우선인 곳은 일반 Material 또는 불투명 배경을 사용합니다.

- Light Regular Material은 밝은 혼합 레이어와 강한 배경 블러를 사용합니다.
- Dark Regular Material은 검정 기반의 반투명 레이어로 대비를 확보합니다.
- 웹에서는 기본 근사값으로 `backdrop-filter: blur(24px) saturate(120%)`를 사용하고, 모드별 반투명 배경을 별도로 둡니다.
- 콘텐츠 대비가 부족하면 블러를 높이는 대신 표면 불투명도를 먼저 높입니다.

### Liquid Glass

Liquid Glass는 탐색과 조작 계층을 띄우는 광학적 재료입니다.

사용:

- 하단 탭 바
- 상단 툴바
- 떠 있는 검색·필터 컨트롤
- 작은 segmented control
- 시트의 고정 액션 영역
- 화면당 한 개의 핵심 Glass Prominent 버튼

사용하지 않음:

- 모든 콘텐츠 카드
- 긴 목록의 각 행
- 입력 필드 전체
- 표와 긴 결과
- 중첩된 글라스 안의 또 다른 글라스
- 배경 맥락 없이 단독으로 놓이는 장식 캡슐

웹 근사 구현은 `blur(15px) saturate(140%)`를 출발점으로 삼되, distortion과 depth를 가짜 CSS 그림자로 과장하지 않습니다. 얇은 내부 하이라이트와 모드별 fill만 사용하고, `backdrop-filter` 미지원 환경에서는 불투명한 `background-secondary`로 대체합니다.

## 7. Shape and elevation

- 작은 독립 컨트롤은 pill 또는 capsule 형태를 사용합니다.
- 그룹 목록과 시트는 바깥 컨테이너와 안쪽 행의 곡률을 동심 형태로 맞춥니다.
- Softie 웹 기본값은 컨트롤 `17px`, 그룹 `22px`, 시트 `28px`, pill `999px`입니다. 이는 공식 컴포넌트의 형태를 웹에서 일관되게 재사용하기 위한 프로젝트 토큰입니다.
- 임의의 `26–28px` 대형 카드 radius를 모든 곳에 반복하지 않습니다.
- 구분은 그림자보다 배경 단계, 인셋, separator로 만듭니다.
- 그림자는 떠 있는 메뉴, 시트, 팝오버처럼 실제 고도 차이가 있을 때만 사용합니다.
- 한 컨테이너에 테두리, 강한 그림자, 고대비 fill, blur를 모두 겹치지 않습니다.

## 8. Component rules

### Buttons

- 계층은 `Glass Prominent → Bordered/Glass → Borderless` 순서입니다.
- 파괴적 버튼은 같은 구조에서 Destructive 색으로 의미만 바꿉니다.
- 시각 높이는 Small `28px`, Regular `34px`, Large `50px`를 사용합니다.
- Small/Regular 버튼도 투명한 바깥 hit area를 포함해 최소 `44×44px`을 보장합니다.
- 주요 폼 제출은 Large 또는 너비가 충분한 Regular을 사용합니다.
- 아이콘만 있는 버튼에는 접근 가능한 이름을 제공합니다.
- pressed, focus-visible, disabled, loading 상태를 모두 정의합니다.

### Text fields

- 기본 높이는 `52px`, 좌우 인셋은 `16px`, 입력 글자는 Body `17/22`입니다.
- 라벨을 placeholder로 대체하지 않습니다.
- 기본 구조는 하단 separator 또는 안정적인 grouped fill입니다. 모든 입력을 두꺼운 카드로 만들지 않습니다.
- 오류는 색상, 아이콘 또는 텍스트 중 두 가지 이상의 신호로 표시하고 다음 행동을 설명합니다.

### Lists

- 기본 행은 `52px`, 큰 행은 `68px`입니다.
- 한 행의 leading, title/subtitle, trailing value/accessory 역할을 명확히 구분합니다.
- separator는 콘텐츠 시작점에 맞춰 inset할 수 있습니다.
- 행 전체가 이동 동작이면 내부에 동일한 목적의 중복 버튼을 넣지 않습니다.
- swipe action을 웹에 그대로 흉내 내기보다 명시적 메뉴나 안전한 보조 액션을 제공합니다.

### Tabs and segmented controls

- iPhone 하단 탭은 2–5개를 사용합니다. 선택된 항목은 색상과 형태를 함께 바꿉니다.
- 하단 Glass 묶음의 시각 높이는 `62px`를 기준으로 하고 safe area는 별도로 더합니다.
- 현재 위치를 탭 색상만으로 알리지 않습니다.
- segmented control은 짧고 상호 배타적인 선택에만 사용합니다. 긴 라벨은 탭 또는 목록으로 전환합니다.

### Toggles

- Boolean 설정에만 사용하며 즉시 적용되는 상태여야 합니다. 저장 버튼이 필요한 선택에는 checkbox 또는 명시적 폼을 사용합니다.
- 시각 트랙이 `28px`여도 전체 행 또는 라벨을 포함한 hit area는 최소 `44px`입니다.
- On/Off는 색상과 knob 위치를 함께 바꾸고, 접근 가능한 이름과 현재 상태를 제공합니다.

### Search and date/time controls

- 검색은 목록 탐색 맥락에서만 제공하며, 입력 중 결과 수·빈 상태·지우기 동작을 함께 설계합니다.
- 날짜·시간은 브라우저의 네이티브 입력을 우선하고 `52px` 필드 높이와 Body 타입을 유지합니다.
- 스케줄러처럼 날짜와 시간이 핵심인 화면은 compact picker를 단독 액션처럼 사용하지 않고 현재 값, 시간대, 저장 결과를 함께 보여줍니다.
- 지원되지 않는 브라우저에서는 검증된 텍스트 입력으로 대체하며 포맷 예시와 오류 복구를 제공합니다.

### Sheets, alerts, and menus

- 모바일의 복잡한 보조 작업은 중앙 모달보다 bottom sheet를 우선합니다.
- Alert는 짧은 확인과 위험 경고에만 사용합니다. 폼 전체를 Alert에 넣지 않습니다.
- 파괴적 액션은 일반 액션과 시각적으로 분리하고 가능하면 취소를 제공합니다.
- 메뉴 항목은 기본, 선택, 비활성, 파괴적 상태를 구분합니다.

### Status and feedback

- 상태는 색상만으로 전달하지 않고 짧은 텍스트와 아이콘을 함께 사용합니다.
- 로딩 중에는 버튼의 폭과 레이아웃을 유지합니다.
- 빈 상태는 큰 장식보다 제목, 이유, 다음 행동 순으로 구성합니다.
- 오류 메시지는 발생 사실보다 복구 방법을 먼저 이해할 수 있어야 합니다.

## 9. Motion and interaction

- 웹 전환은 빠른 피드백 `160ms`, 일반 상태 변화 `240ms`를 기본으로 합니다. 이 값은 Softie 웹 근사 규칙이며 Sketch 소스의 공식 duration이 아닙니다.
- hover는 포인터 환경의 보조 피드백일 뿐이며 핵심 상태를 담지 않습니다.
- pressed 상태는 작은 scale 또는 fill 변화 하나로 충분합니다.
- 시트와 메뉴는 출발 위치가 이해되는 짧은 이동을 사용합니다.
- `prefers-reduced-motion: reduce`에서는 이동과 확대를 제거하고 즉시 또는 짧은 opacity 전환으로 대체합니다.

## 10. Accessibility baseline

- 모든 상호작용의 hit area는 최소 `44×44px`입니다.
- 일반 텍스트는 WCAG AA `4.5:1`, 큰 텍스트와 UI 경계는 `3:1` 이상을 목표로 합니다.
- `focus-visible`은 accent 기반 `2px` 외곽선과 충분한 offset으로 명확히 표시합니다.
- Dynamic Type에 대응하도록 텍스트 컨테이너를 고정 높이로 자르지 않습니다.
- 브라우저 확대, `200%` 텍스트 확대, 긴 한글 라벨에서 핵심 액션이 잘리지 않아야 합니다.
- `forced-colors`, `prefers-contrast`, `prefers-reduced-transparency`, `prefers-reduced-motion`을 고려합니다.
- 투명도 감소 환경에서는 Glass를 불투명한 secondary/elevated 표면으로 대체합니다.

## 11. Product-specific guidance

### Scheduler

- 이벤트 목록은 `52/68px` 행과 grouped section을 기본 구조로 사용합니다.
- 시간, 장소, 참석 상태 중 한 가지만 Headline로 두고 나머지는 Secondary/Subheadline로 낮춥니다.
- 생성·수정은 bottom sheet 또는 독립 페이지를 사용하고, 첫 화면에는 가장 빈번한 액션만 남깁니다.
- 알림과 위험 상태는 시스템 semantic 색상과 텍스트를 함께 사용합니다.

### Lead sheet

- 공연 중 판독성이 우선이므로 콘텐츠 영역에는 Liquid Glass를 사용하지 않습니다.
- 자동 저장, 로컬 데이터, 복구 상태는 항상 텍스트로 확인할 수 있어야 합니다.
- 백업과 복원은 명확한 확인, 결과, 복구 경로를 제공합니다.

### Home and utility tools

- 홈은 서비스 카드의 장식 경쟁을 줄이고 단순한 목록 또는 grouped collection으로 정리합니다.
- 해석 준비처럼 입력이 긴 도구는 `52px` 필드와 명확한 섹션 헤더를 사용합니다.
- 사진은 선택적 브랜드 콘텐츠로 사용할 수 있지만, 전체 제품의 필수 배경 레이어가 아닙니다.

## 12. Adoption and implementation

이 문서는 디자인 계약이며 아직 전체 코드에 구현되었다는 뜻이 아닙니다.

- 현재 `data-design-theme="atmospheric"`과 `.ag-*` API는 기존 홈·스케줄러 화면의 레거시 구현입니다.
- 기존 화면은 이 문서 변경만으로 자동 재스타일링하지 않습니다.
- 새 iOS 27 스타일은 기능 단위로 설계·구현·검증한 뒤 공통 토큰으로 승격합니다.
- 첫 구현 시 `src/styles.css`에 모드별 semantic token을 추가하고 `data-design-theme="ios27"` 범위 안에서만 적용합니다.
- 레거시 `warm-classic`과 `atmospheric` 토큰은 참조 화면이 모두 마이그레이션되기 전까지 삭제하지 않습니다.
- UI/CSS 마이그레이션과 스케줄러·인증·Supabase 비즈니스 로직 변경은 별도 작업으로 유지합니다.
- route-local 값이 두 화면 이상에서 검증된 뒤에만 공통 컴포넌트 또는 토큰으로 승격합니다.

권장 순서는 작은 utility 화면 → 홈 → 스케줄러입니다. 스케줄러는 상태와 데이터 밀도가 높으므로 마지막에 운영 흐름을 보존하며 전환합니다.

### Theme selection

- 기본 모드는 `prefers-color-scheme`을 따릅니다.
- 사용자 모드 선택을 추가할 경우 `system`, `light`, `dark` 세 값만 허용하고 같은 브라우저의 localStorage에 저장합니다.
- 초기 렌더 전에 저장값을 적용해 색상 깜빡임을 막되, 저장값이 없거나 손상되면 즉시 시스템 모드로 돌아갑니다.
- 브라우저 UI의 `theme-color`도 Light `#F2F2F7`, Dark `#000000`으로 모드별 선언합니다.

### Brand expression

- `system-blue`는 기본 상호작용 색이고 `product-tint`는 Softie 고유 강조가 실제 화면에서 대비 검증을 통과한 뒤 추가할 수 있는 별도 토큰입니다.
- 공식 시스템 색상 값을 브랜드 장식에 반복하지 않습니다. Softie의 개성은 문구, 콘텐츠 순서, 사진·아트워크 선택에서 표현합니다.
- 새 `product-tint`는 Light/Dark 값을 각각 정의하고 일반 텍스트 `4.5:1`, 큰 텍스트·UI 경계 `3:1` 조합을 검증해야 합니다.

### Migration matrix

| Route | Current | Target | Status |
| --- | --- | --- | --- |
| `/` | Atmospheric Glass | iOS 27 | Phase 1 implemented; validation evidence in `design-qa.md` |
| `/interpretation-prep` | Warm/Atmospheric utility | iOS 27 | Preserve until route-specific review |
| `/scheduler` | Atmospheric operational | iOS 27 | Planned after Home validation |
| `/lead-sheet` | Performance-focused legacy | iOS 27 content-first | Planned; data safety has priority |

각 라우트는 Light/Dark, `390px`, `402px`, 데스크톱, 핵심 상호작용, 콘솔 오류를 검증한 뒤 상태를 `Validated`로 바꿉니다.

### Reusable CSS API

- `data-design-theme="ios27"`: 새 semantic token 범위
- `.ios27-shell`: 시스템 canvas와 기본 전경색
- `.ios27-layout`: safe-area를 포함한 화면 레이아웃
- `.ios27-material`: 불투명 grouped content surface
- `.ios27-glass`: 탐색·떠 있는 조작용 Liquid Glass 근사
- `.ios27-action`, `.ios27-action-primary`, `.ios27-action-secondary`: 최소 `44px` 액션과 상태 표현

홈 화면은 이 API의 첫 참조 구현입니다. 라우트 전용 selector는 검증 없이 다른 화면에 복사하지 않고, 두 화면 이상에서 동일하게 필요한 패턴만 공통 API로 승격합니다.

## 13. Definition of done

새 화면 또는 마이그레이션 화면은 다음 조건을 모두 만족해야 합니다.

- Light와 Dark에서 각각 semantic token이 올바르게 적용됩니다.
- 정보 위계가 타입 역할과 label 단계만으로 이해됩니다.
- Liquid Glass가 탐색·떠 있는 조작 계층에만 사용됩니다.
- 기본 필드와 행은 `52px`, 큰 행은 `68px`, 터치 영역은 최소 `44px`입니다.
- `390px`, `402px`, `768px`, `1280px`에서 가로 스크롤과 핵심 액션 잘림이 없습니다.
- 긴 한글, 빈 상태, 오류, 로딩, disabled, selected, focus-visible 상태를 확인했습니다.
- Light/Dark 모두 텍스트 및 UI 대비 기준을 통과합니다.
- reduced motion, reduced transparency, 브라우저 확대에서 핵심 흐름이 유지됩니다.
- 실제 데이터와 주요 사용자 흐름이 기존과 동일하게 동작합니다.
- 브라우저 콘솔 오류가 없고 관련 빌드·테스트가 통과합니다.

## 14. When to update this file

- 공식 Apple UI Kit 소스가 교체되고 checksum 또는 토큰이 달라질 때
- 공통 semantic token이나 타입 역할이 변경될 때
- 두 개 이상의 화면에서 검증된 재사용 패턴이 생길 때
- 웹 근사값이 실제 Safari/Chrome 검증을 통해 조정될 때
- 기존 레거시 테마의 마이그레이션 상태가 바뀔 때
