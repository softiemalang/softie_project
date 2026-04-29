---
# Design Tokens
name: softie-project
version: 1.2.0
tokens:
  colors:
    background: "#f5efe7"
    surface: "rgba(255, 252, 248, 0.88)"
    surface-strong: "#fffdf9"
    text: "#1f2937"
    text-muted: "#6b6258"
    brand: "#1f6f5f"
    brand-soft: "#e7f3ef"
    accent: "#9a3412"
    danger: "#b01646"
    line: "#e7ddd0"
    success: "#166534"
    warning: "#9a3412"
  typography:
    font-family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    size-base: "16px"
    size-hero: "2.35rem"
    size-section: "1.8rem"
    size-card: "1.28rem"
    size-small: "0.78rem"
    weight-bold: "700"
    weight-medium: "550"
  spacing:
    layout-padding-mobile: "1rem"
    layout-padding-desktop: "1.5rem"
    gap-standard: "1rem"
    gap-tight: "0.85rem"
    content-inset: "0.34rem"
  rounded:
    card: "28px"
    item: "18px"
    control: "14px"
    pill: "999px"
  elevation:
    shadow-card: "0 18px 48px rgba(92, 74, 43, 0.08)"
    blur-standard: "14px"
  components:
    button-primary:
      backgroundColor: "{colors.brand}"
      textColor: "#ffffff"
      rounded: "{rounded.control}"
    card:
      backgroundColor: "{colors.surface}"
      rounded: "{rounded.card}"
    input:
      backgroundColor: "rgba(255, 255, 255, 0.88)"
      rounded: "{rounded.control}"
---

# Design System

이 프로젝트의 공식 디자인 가이드라인입니다. 모든 UI 변경 및 추가 작업 시 이 문서를 진실의 원천(Source of Truth)으로 삼습니다.

## Overview
- **방향성:** 따뜻함(Warm), 부드러움(Soft), 깨끗함(Clean).
- **분위기:** 차분하고 가독성이 높으며 시각적 노이즈가 적은 환경 (Calm, Low-clutter, Not flashy).

## Colors
프로젝트는 부드러운 미색 배경과 차분한 그린/브라운 톤을 사용합니다.
- **Brand:** `#1f6f5f` (주요 버튼, 활성 상태, 긍정적 지표)
- **Background:** `#f5efe7` (기본 배경색. 바닥 글래디언트 조합 포함)
- **Surface:** 글래스모피즘 효과가 적용된 반투명 카드 배경 (`rgba(255, 252, 248, 0.88)`).
- **Semantic:**
  - Success: `#166534` (완료 상태)
  - Warning/Accent: `#9a3412` (주의, 강조)
  - Danger: `#b01646` (삭제, 치명적 오류)

## Typography
시스템 폰트를 기반으로 하며, 제목은 강한 볼드와 좁은 자간을 선호합니다.
- **Hero Title:** `2.35rem`, `-0.04em` letter-spacing.
- **Section Title:** `1.8rem`.
- **Eyebrow/Kicker:** `0.78rem`, `700` weight, `0.1em` letter-spacing, Uppercase.
- **Body:** `1rem` (또는 `16px`), line-height `1.5` 권장.

## Layout
- **App Shell:** 최대 너비 `760px` (기본) 또는 `860px` (스케줄러). 중앙 정렬.
- **Grid/Stack:** 요소 간 간격은 주로 `0.85rem` (tight) 또는 `1rem` (standard)을 사용합니다.
- **Responsive:**
  - **Desktop (>= 700px):** 가로 배열 및 그리드 활용.
  - **Mobile (< 700px):** 모든 요소가 세로로 쌓이는(Stack) 구조로 전환. 버튼 너비 100% 확장.

## Elevation & Depth
- **Shadows:** 매우 부드럽고 넓게 퍼지는 그림자를 사용하여 카드가 떠 있는 느낌을 줍니다. (`0 18px 48px rgba(92, 74, 43, 0.08)`)
- **Blur:** 배경에 `14px` 블러를 적용하여 깊이감을 강조합니다. (`backdrop-filter: blur(14px)`)

## Shapes
- **Radius:** 모든 코너는 둥글게 처리합니다.
  - 대형 카드/히어로: `28px`
  - 일반 아이템/결과행: `18px`
  - 버튼/입력창/컨트롤: `14px`
  - 배지/필/상태표시: `999px` (Pill)

## Components
- **Buttons:**
  - Primary: `var(--brand)` 배경, 흰색 텍스트.
  - Soft/Ghost: `#f3ece2` 배경, `#5b4a35` 텍스트.
  - Disabled: `opacity: 0.45`.
- **Cards:** 반투명 배경(`var(--surface)`), 연한 테두리(`1px solid rgba(255,255,255,0.65)`).
- **Forms:**
  - Input/Select: `14px` radius, `1px solid var(--line)`, `min-height: 42px`.
  - 내부 패딩: `0.82rem 1rem`.
- **Pills/Badges:** `999px` radius, `0.5rem 0.8rem` 패딩, 시각적 위계에 따른 배경색 적용.

## Do's and Don'ts
- **Do:** 모든 UI 요소에 `border-radius`를 적용하세요. 각진 모서리는 금지입니다.
- **Do:** 텍스트 색상은 `var(--text)`를 기본으로 하고, 부연 설명은 `var(--muted)`를 사용하세요.
- **Do:** 글래스모피즘 효과(`background` + `backdrop-filter`)를 적극 활용하세요.
- **Don't:** 원색(Pure Blue, Pure Red 등)을 사용하지 마세요. 대신 채도가 조절된 세만틱 컬러를 사용하세요.
- **Don't:** 그림자를 너무 어둡거나 딱딱하게 표현하지 마세요. (Alpha 0.1 이하 권장)
- **Don't:** 레이아웃 여백을 임의로 줄이지 마세요. 시각적 여유가 중요합니다.

## Implementation guidance
- **CSS Variables:** `:root`에 정의된 CSS 변수를 최우선으로 사용합니다.
- **Utility Classes:** `.subtle`, `.pill`, `.card` 등 기존 클래스를 재사용하세요.
- **React:** 스타일 수정 시 가급적 기존 CSS 클래스를 활용하고, 새로운 스타일이 필요하면 `styles.css`에 공통 규칙을 추가한 뒤 적용하세요.

## When to update DESIGN.md
- 새로운 재사용 가능한 디자인 패턴(예: 탭, 아코디언 등)이 도입될 때.
- 기존 디자인 토큰(색상, 곡률 등)의 기본값이 변경될 때.
- AI 에이전트가 디자인 가이드를 오해하거나 불충분하다고 판단되는 사례가 발견될 때.
