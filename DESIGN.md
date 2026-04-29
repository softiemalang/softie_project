---
# Design Tokens
name: softie-project
version: 1.0.0
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
  typography:
    font-family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    size-base: "16px"
    size-hero: "2.35rem"
    size-section: "1.8rem"
    size-card: "1.28rem"
    size-small: "0.78rem"
  spacing:
    layout-padding-mobile: "1rem"
    layout-padding-desktop: "1.5rem"
    gap-standard: "1rem"
    gap-tight: "0.85rem"
  borders:
    radius-card: "28px"
    radius-item: "18px"
    radius-control: "14px"
    radius-pill: "999px"
  elevation:
    shadow-card: "0 18px 48px rgba(92, 74, 43, 0.08)"
    blur-standard: "14px"
---

# Design System

이 프로젝트의 공식 디자인 가이드라인입니다. 모든 UI 변경 및 추가 작업 시 이 문서를 진실의 원천(Source of Truth)으로 삼습니다.

## Overview
- **방향성:** 따뜻함(Warm), 부드러움(Soft), 깨끗함(Clean).
- **분위기:** 차분하고 가독성이 높으며 시각적 노이즈가 적은 환경 (Calm, Low-clutter).

## Colors
프로젝트는 부드러운 미색 배경과 차분한 그린/브라운 톤을 사용합니다.
- **Brand:** `#1f6f5f` (주요 버튼, 활성 상태)
- **Background:** `#f5efe7` (기본 배경색)
- **Surface:** 글래스모피즘 효과가 적용된 반투명 카드 배경.

## Typography
시스템 폰트를 기반으로 하며, 제목은 강한 볼드와 좁은 자간을 선호합니다.
- **Hero:** `2.35rem`, `-0.04em` letter-spacing.
- **Eyebrow:** 소문자 대신 대문자와 넓은 자간을 사용하는 작은 레이블.

## Layout
- **Container:** `760px` 또는 `860px` 최대 너비를 가지는 중앙 정렬 레이아웃.
- **Responsive:** 모바일(700px 미만)에서는 모든 요소가 세로로 쌓이는(Stack) 구조로 전환됩니다.

## Elevation & Depth
- **Shadows:** 매우 부드럽고 넓게 퍼지는 그림자를 사용하여 카드가 떠 있는 느낌을 줍니다.
- **Blur:** 배경에 `14px` 블러를 적용하여 깊이감을 강조합니다.

## Shapes
- **Radius:** 모든 코너는 둥글게 처리합니다. 카드(`28px`), 버튼/입력창(`14px`) 등 관대한 곡률을 유지합니다.

## Components
- **Buttons:** 둥근 모서리, 적절한 내부 여백, 명확한 상태 변화(Hover/Active).
- **Cards:** 반투명 배경, 부드러운 그림자, 명확한 시각적 위계.
- **Forms:** 일관된 입력창 높이와 둥근 모서리, 가독성 높은 레이블 배치.

## Do's and Don'ts
- **Do:** 모든 UI 요소에 `border-radius`를 적용하세요.
- **Do:** 색상 변수(`var(--brand)` 등)를 사용하여 일관성을 유지하세요.
- **Don't:** 원색(Pure Blue, Pure Red 등)이나 각진 모서리를 사용하지 마세요.
- **Don't:** 그림자를 너무 어둡거나 딱딱하게 표현하지 마세요.

## Implementation guidance
- **CSS:** `:root`에 정의된 CSS 변수를 우선 사용합니다.
- **React:** 컴포넌트 내부에서 인라인 스타일보다는 클래스 기반 스타일링을 지향합니다.

## When to update DESIGN.md
- 새로운 재사용 가능한 디자인 패턴이 도입될 때.
- 기존 디자인 토큰(색상, 간격 등)이 변경될 때.
