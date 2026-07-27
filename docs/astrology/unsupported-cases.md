# Astrology Core Unsupported Cases & Fail-Closed Behavior Policy

## 1. 개요
본 문서는 `Mallang Astrology Rule Core v0`에서 의도적으로 미지원하거나 차단(blocked/unavailable/unsupported) 처리하는 항목과 그 대응 정책을 정리합니다.

## 2. 미지원 천체 및 포인트 (v0)
다음 항목들은 v0 입력에 포함되더라도 전체 차트 연산을 실패시키지 않으며, 해당 천체에 대해 `{ availability: "unsupported", reason: "unsupported_body" }` 상태를 반환하고 기본 분포/Aspect 집계에서 제외합니다.

- `true_node`, `mean_node`
- `chiron`
- `lilith`
- `asteroids` (Ceres, Pallas, Juno, Vesta 등)
- `fixed_stars` (항성)
- `arabic_parts` (Part of Fortune 등)
- `vertex`

## 3. 정보 누락 시의 상태 처리
1. **ASC(Ascendant) 누락시**:
   - 별자리 및 운동 상태 연산: `available`
   - Whole Sign 하우스: `{ availability: "blocked", reason: "ascendant_unavailable", fallbackApplied: false }`
   - 차트 룰러: `{ availability: "blocked", reason: "ascendant_unavailable" }`
   - body <-> angle Aspect: `{ phase: "unavailable", phaseReason: "angle_phase_not_supported_v0" }`
   - 임의로 하우스를 추측하거나 Placidus/Equal 등 타 시스템으로 fallback하지 않습니다.

2. **일일 속도(longitudeSpeedDegreesPerDay) 누락시**:
   - 별자리 및 하우스 연산: `available`
   - 운동 상태: `{ motionState: "unavailable", availability: "unavailable", reason: "speed_unavailable" }`
   - Aspect Phase: `{ phase: "unavailable", phaseReason: "speed_unavailable" }`
   - 하루 뒤 위치를 임의 추정하여 phase를 판정하지 않습니다.

3. **MC(Midheaven)**:
   - MC를 강제로 10하우스로 간주하지 않으며, 각도 포인트 배치로서만 다룹니다.

## 4. 후속 과제
- Placidus, Koch, Regiomontanus 등 하우스 시스템 도입
- 노드, 키론 및 소행성 연산 지원
- Aspect 패턴 (Stellium, Grand Trine, T-Square 등) 탐지
- 디스포지터 체인 및 천체 조화도 점수화
