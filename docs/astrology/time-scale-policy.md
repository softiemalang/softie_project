# Mallang Time Scale Policy v0

## 1. Roles of Time Scales (UTC, UT1, TT)
- **UTC (Coordinated Universal Time)**: Civil 입력 시각의 기준 척도입니다.
- **UT1 (Universal Time 1)**: 지구 자전각(Earth Rotation Angle, ERA) 계산에 사용되는 천문 자전 시간척도입니다.
- **TT (Terrestrial Time)**: 평균 황도경사 및 GMST 다항식 계산에 사용되는 주시(행성시) 시간척도입니다.

---

## 2. External Offset Supply Rationale
- `DUT1` ($UT1 - UTC$) 및 $TT - UTC$ ($64.184\text{s} + \Delta T$ 관련) 수치는 지구 자전 불규칙성과 윤초 삽입에 의해 유동적입니다.
- v0 모듈 내부에서 네트워크 IERS 조회, 윤초 테이블, 암묵적 추정 공식을 내장하지 않으며, 제3의 Data Provider나 Fixture에서 명시적으로 공급받도록 설계되었습니다.

---

## 3. Strict No-Zero Fallback Policy
- `ut1MinusUtcSeconds` 또는 `ttMinusUtcSeconds`가 누락된 경우, 모듈은 **절대 0초를 암묵적으로 대입하지 않습니다**.
- 누락된 offset에 의존하는 하위 계산 항목(UT1, TT, ERA, Mean Obliquity, GMST, LMST, MC, ASC 등)은 `availability: "blocked"`로 명시 처리하고 사유(`ut1_minus_utc_unavailable` 등)를 투명하게 보존합니다.
