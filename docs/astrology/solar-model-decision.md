# Solar Model Decision & Evaluation Matrix v0

## 1. 개요
본 문서는 Mallang Solar Position Core v0의 역법 계산 모델을 확정하기 위해 검토한 5개 천문 모델 후보(Candidate A~E)의 명세, 출처, 라이선스, 좌표/시간 계약, 정확도 및 평가 매트릭스를 기록합니다.

Mallang의 대원칙에 따라, **라이선스가 명확하지 않거나 수치적/물리적 기준계가 모호한 모델은 억지로 선정하지 않고 `blocked` 상태로 유지**합니다.

---

## 2. 평가 매트릭스 기준 (100점 만점)

1. **License Clarity & Runtime Control (25점)**: 명시적 라이선스 문서 존재, 재배포 및 상용 런타임 이용 법적 근거.
2. **Astronomical Accuracy (20점)**: 1900–2100 기간 내 선언된 모델 정확도.
3. **1900–2100 Coverage (10점)**: 지원 기간의 완결성 및 경계 안정성.
4. **Coordinate / Frame Clarity (10점)**: 원점, 참조 틀(Frame/Equinox), 중심(Center)의 명확성.
5. **Position & Velocity Support (10점)**: 위치 및 분석적/수치적 속도 미분 지원.
6. **Official Provenance (10점)**: IAU/IMCCE/NASA JPL 등 공식 발표 기관 출처.
7. **Implementation Auditability (10점)**: 코드 및 계수의 가독성, 감사 가능성, clean-room 재현성.
8. **Maintenance Cost (5점)**: 계수 데이터 용량, 번들 크기, 유지보수 복잡도.

### 감점 및 Disqualification 규칙
- **런타임 라이선스 미확인**: 런타임 후보 자격 박탈 (`Disqualified`)
- **프로젝트 Clean-room 및 C/Fortran 포팅 금지 정책 위배**: 런타임 후보 거부 (`Rejected by Policy`)
- **Earth vs EMB (Earth-Moon Barycenter) 전환 미구현/모호성**: 궤도 변환 감사 항목 감점
- **속도 미분 경로 누락**: 최대 75점 제약
- **외부 런타임 바이너리/커널 필요**: Runtime Control 항목 최대 5/25점 제한

---

## 3. 후보 모델별 상세 평가

### Candidate A — VSOP87 계열 (IMCCE / Bureau des Longitudes)
- **공식 출처**: IMCCE / Bureau des Longitudes (`ftp.imcce.fr/pub/ephem/planets/vsop87/`)
- **IMCCE 공식 Solution별 정의**:
  - `VSOP87`: heliocentric elliptic variables, equinox and ecliptic J2000
  - `VSOP87A`: heliocentric rectangular variables, equinox and ecliptic J2000
  - `VSOP87B`: heliocentric spherical variables, equinox and ecliptic J2000
  - `VSOP87C`: heliocentric rectangular variables, equinox and ecliptic of date
  - `VSOP87D`: heliocentric spherical variables, equinox and ecliptic of date
  - `VSOP87E`: barycentric rectangular variables, equinox and ecliptic J2000
- **좌표계 및 Frame / Equinox 명확화**:
  - VSOP87 시리즈 전체를 단순히 `ICRF`라고 표현하지 않으며, J2000 황도·춘분점 좌표와 ICRF를 동일시하지 않습니다.
  - `VSOP87A.ear` (Earth)와 `VSOP87A.emb` (Earth-Moon Barycenter)는 엄연히 별도의 공식 계수 아티팩트이며, Earth/EMB 구분은 적절한 solution 및 아티팩트 선택으로 해결할 수 있습니다.
  - **VSOP87D**: heliocentric spherical of date 구면좌표로 점성학용 황경/황위 후보가 될 수 있으나, Raw Layer A의 ICRF 직교벡터 계약과는 다른 native output 형태입니다.
  - **VSOP87A**: heliocentric rectangular J2000 직교좌표로 Raw Layer A 후보가 될 수 있으나, J2000 황도 좌표계를 ICRF 관성계로 변환하는 별도의 독립 검증된 변환(transform)이 필요합니다.
- **라이선스 및 런타임 자격 상태**:
  - `licenseStatus`: `unresolved` (공식 README에 상용/재배포 라이선스 문구 미표기)
  - `runtimeEligibility`: `blocked`
  - `selectionStatus`: `blocked_by_license`
- **평가 점수**:
  - License Clarity: 0/25 (Disqualified by rule: `licenseStatus: unresolved`)
  - Astronomical Accuracy: 20/20
  - Coverage: 10/10
  - Coordinate Clarity: 9/10 (J2000 황도 $\rightarrow$ ICRF 변환 정의 필요)
  - Position/Velocity: 10/10
  - Provenance: 10/10
  - Auditability: 8/10
  - Maintenance: 3/5 (계수 용량 수 MB)
  - **총점**: Disqualified (공식 재배포/상용 라이선스 미확인으로 박탈)

---

### Candidate B — JPL Approximate Planetary Positions (Table 1 EM Bary research)
- **공식 출처**: NASA JPL Solar System Dynamics (SSD) 공식 명세
- **원점 및 좌표계**: Sun-centered heliocentric Keplerian elements, mean ecliptic and equinox of J2000, TDB 시간척도. J2000 황도 벡터를 ICRF 벡터와 동일시하지 않습니다.
- **명목 오차 및 정확도 평가 정정**:
  - 공식 JPL 표는 1800~2050년 EM barycenter에 대해 명목 heliocentric longitude error를 **20 arcsec** ($20'' = 0.005555...^{\circ}$)로 제시합니다.
  - 2026-07-28 외부 Horizons 연구는 model/center/total 오차를 분리해 검증했습니다. total 최대 각오차 0.008013도와 최대 황경오차 0.008011도는 0.01도 이내였지만, total p99 각오차는 **0.006731도**로 사전 기준 0.005도를 초과했습니다.
- **결격 사유 및 제약 사항**:
  1. 20 arcsec 오차는 보장된 최대 오차가 아닌 명목 오차(nominal model error)임.
  2. Earth-Moon Barycenter(EMB)를 Earth 대용으로 쓴 total proxy가 p99 기준에 실패했습니다.
  3. 이 결과에 맞춘 섭동 보정 또는 경험적 잔차 보정은 이번 후보 검증 범위에서 금지됩니다.
  4. native frame은 J2000 황도이며 of-date/tropical 변환 및 별자리 경계 안정성은 미구현입니다.
  5. 향후 타 행성 확장 시 정밀도 부족.
- **라이선스 및 런타임 자격 상태**:
  - `rightsReviewStatus`: `pending`
  - `runtimeEligibility`: `rejected_for_current_threshold`
  - `selectionStatus`: `rejected`
  - 기술 검증 결과만으로 copyright, redistribution, commercial runtime permission을 확정하지 않습니다.
- **평가 점수**:
  - License Clarity: 25/25
  - Astronomical Accuracy: 0/20 (사전 p99 proxy 기준 실패)
  - Coverage: 0/10 (검증 범위 후보로 채택 불가)
  - Coordinate Clarity: 6/10 (EMB $\rightarrow$ Earth proxy 명시 및 검증은 완료했으나 정확도 기준 실패)
  - Position/Velocity: 8/10
  - Provenance: 10/10
  - Auditability: 10/10
  - Maintenance: 5/5
  - **총점**: Rejected (사전 total practical p99 기준 실패)

---

### Candidate C — IAU SOFA EPV00 계열
- **공식 출처**: IAU Standards of Fundamental Astronomy (SOFA)
- **공식 오차 선언 정정**:
  - `declaredAccuracy`: official limited-precision routine; exact bound not yet transcribed from the authoritative routine preamble
  - (SOFA 공식 문서가 EPV00을 limited precision ephemeris 루틴으로 분류하므로, 근거 없는 `< 0.001 arcsec` 표기를 제거함)
- **라이선스 상태와 프로젝트 정책의 분리**:
  - `licenseStatus`: `verified_permissive_with_derived-work_conditions`
  - `commercialUsePermission`: `allowed_subject_to_SOFA_terms`
  - `runtimeEligibility`: `rejected_by_project_clean_room_policy`
  - `selectionStatus`: `rejected`
- **거부 사유 정정**:
  - SOFA 라이선스가 런타임 구현을 법적으로 금지해서가 아니라, **Mallang의 프로젝트 자체 Clean-room 정책**에 따라 SOFA C/Fortran 구현을 JavaScript로 직역/포팅하지 않고 외부 알고리즘 구조를 런타임 코드에 복제하지 않기 때문입니다.
  - SOFA는 런타임 코드가 아닌 **외부 검증 오라클 및 수치 비교 기준**으로만 사용됩니다.

---

### Candidate D — JPL DE / NAIF SPICE Runtime
- **공식 출처**: NASA JPL Planetary Ephemeris (DE440/DE441), NAIF SPICE Toolkit
- **정확도**: 최고 정밀도
- **라이선스 상태**: Public Domain (NASA/JPL)
- **거부 사유**: 수십~수백 MB 바이너리 커널 의존성으로 브라우저/모바일 런타임 부적합.
- **선정 상태**: `rejected`

---

### Candidate E — Swiss Ephemeris Runtime
- **공식 출처**: Astrodienst Swiss Ephemeris
- **라이선스 상태**: AGPL v3 / Commercial
- **거부 사유**: AGPL 라이선스 및 C-lib/WASM 외부 바이너리 의존성으로 런타임 사용 제외.
- **선정 상태**: `rejected` (외부 점성학 검증 오라클 전용)

---

## 4. 최종 결정 및 선택 상태 (Decision Summary)

### `solarModelDecisionStatus: blocked`

- **이유**:
  1. 고정확도 독립 구현 후보인 **VSOP87**은 공식 재배포/상용 런타임 이용 라이선스가 `unresolved` 상태입니다.
  2. **JPL Approximate Positions Table 1 EM Bary**는 Horizons 검증을 완료했으나 total practical 3D angular p99가 0.006731도로 0.005도 기준을 초과해 거부되었습니다. 최대값 통과만으로 후보를 채택하지 않습니다.
  3. 따라서 Minimum Selection Threshold를 만족하는 최종 런타임 모델이 현재 확정되지 않아 `blocked` 판정을 유지합니다.

---

## 5. 차단 해제 및 후속 수립 절차 (Action Items for Resolution)

1. **IMCCE/IAU 공식 라이선스 확인 요청**: VSOP87 계수 파일 재배포권 공식 문서화 확인.
2. **대체 모델 평가**: 동일한 사전 기준과 권리 검토를 적용하되, 이번 Table 1 EM Bary 후보에 Horizons 맞춤 보정을 추가하지 않습니다.
3. **권리 검토 분리**: 기술적으로 통과하는 별도 후보가 생겨도 runtime 권한을 독립적으로 검토합니다.

상세 연구 설계, 오라클 계약, 통계 및 산출물 해시는
[jpl-approximate-solar-feasibility.md](./jpl-approximate-solar-feasibility.md)에 보존합니다.
