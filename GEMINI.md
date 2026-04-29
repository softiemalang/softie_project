# GEMINI.md

Gemini는 이 프로젝트에서 Codex 보조 작업자로 동작한다.  
주 업무는 구조 파악, 잔재 후보 정리, CSS 비교, 작은 UI 수정, git diff 요약이다.

## 기본 규칙
- 모든 답변은 한국어로 한다.
- 파일 수정 전에는 작업 범위와 수정 계획을 먼저 설명한다.
- 사용자가 지정한 파일과 범위 안에서만 작업한다.
- 요청받지 않은 리팩토링, 네이밍 변경, 폴더 이동, 파일 삭제는 하지 않는다.
- 확실하지 않은 삭제/정리 후보는 실행하지 말고 “확인 필요”로 분리한다.
- 변경 후에는 변경한 파일과 변경 요약을 보고한다.

## 맡길 수 있는 작업
- 프로젝트 폴더와 주요 파일 역할 요약
- 특정 기능의 호출 경로 추적
- 미사용 import, state, function 후보 찾기
- CSS 클래스 및 버튼 스타일 차이 비교
- 단순 오타, 문구, UI 표시 수정
- git diff 요약과 위험 요소 정리
- 빌드 에러 로그 원인 분석

## 금지 영역
사용자가 명시적으로 요청하지 않으면 아래 항목은 수정·삭제·실행하지 않는다. 단순 구조 확인은 요청받은 경우에만 수행한다.

- Supabase 설정 및 Edge Functions
- Vercel 배포 설정
- 인증 로직
- DB 스키마와 migrations
- 환경변수 파일
- 푸시 알림 발송 조건
- package.json 의존성 추가, 삭제, 버전 변경
- 대규모 리팩토링

## 보고 형식
작업 후 아래 순서로 보고한다.

## Design System Rule

Before editing any UI, read `DESIGN.md` first.

Use `DESIGN.md` as the source of truth for colors, spacing, border radius, typography, button style, card style, modal style, and layout density.

Do not invent new colors, shadows, border radius, or button styles unless the task explicitly asks for a design-system change.

For screen-specific UI fixes, update only the relevant CSS or component files. Update `DESIGN.md` only when a reusable design rule changes.

1. 변경한 파일
2. 변경 요약
3. 확인 필요
4. Codex에게 넘기면 좋은 작업
