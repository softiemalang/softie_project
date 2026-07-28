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

4. **태양 위치 (Solar Position Core v0 사전 준비 상태)**:
   - ERFA EPV00은 후속 feasibility 후보일 뿐이며, 독립 Horizons 검증과 adapted-source notice 설계 전까지 `availableForInterpretation: false` 상태를 고정 유지합니다.
   - Raw Ephemeris Vector (Layer A)만 산출되고 황도 세차 변환(Layer B) 또는 검증이 완료되지 않은 경우 점성학 해석에 사용할 수 없습니다 (`availableForInterpretation: false`).
   - Apparent Position 보정(Layer C: 광행차, 광시차, 장동)은 v0 미지원으로 처리하며, 미지원 보정이 적용된 것처럼 추정하지 않습니다.
   - `boundaryRisk: near_boundary` 또는 `indeterminate` 판정 시 단일 황도 12별자리 위치를 확정된 수치로 간주하지 않고 경계 메타데이터를 포함합니다.
   - JPL Approximate Positions Table 1 EM Bary proxy는 2026-07-28 Horizons
     연구에서 total practical p99 기준에 실패했으므로 `technicalModelStatus: rejected`이며,
     runtime fallback 또는 해석용 대체값으로 사용하지 않습니다.
   - ERFA EPV00 후보를 이유로 JPL 후보의 거부 결과를 되돌리거나, ERFA를 runtime fallback으로 연결하지 않습니다.
   - ERFA EPV00의 2026-07-28 reference-delta diagnosis는 선택한 NAIF DE405 subset artifact의 1900–2100 coverage가 불완전하고, 확보한 공식 JPL full-range candidate를 읽을 `gfortran`·`flang`·`f77` 기반 공식 reader toolchain이 없어 `blocked_by_incomplete_de405_diagnosis` 상태입니다. full-range artifact 부재가 원인은 아니며, 비공식 parser나 wrapper를 사용하지 않았습니다. Subset SSB→Sun 진단이나 pvh-only temporary extraction을 production 또는 fallback에 연결하지 않습니다.

## 5. 후속 과제
- 사전 기준을 통과하는 대체 태양 모델의 기술 검증 및 별도 권리 검토
- Placidus, Koch, Regiomontanus 등 하우스 시스템 도입
- 노드, 키론 및 소행성 연산 지원
- Aspect 패턴 (Stellium, Grand Trine, T-Square 등) 탐지
- 디스포지터 체인 및 천체 조화도 점수화
