# Solar Model Decision & Evaluation Matrix v0

## 2026-07-28 decision update

The overlap re-investigation separates the failure from the model itself:
Earth/EMB/Moon/EMRAT contracts and time input are consistent, while the SPK
conversion provenance is incomplete. The existing historical decision remains
`blocked_by_de405_reader_contract_mismatch`, and this provenance task ends at
the stronger reproduction status `blocked_by_de405_spk_provenance_gap`.

The official NAIF artifact/checksum and existing-SPK reader comparison are
verified. The 36,525-row existing-SPK overlap has status mismatch 0, but fails
the unchanged gates (position component max `0.0090330839 km`; velocity
component max `1.8221868e-9 km/s`). Original NIO, exact NIOSPK version, and
the complete conversion command/options remain unavailable, so no regeneration
or production implementation is approved.

### DE405 oracle-role decision

The official JPL DE405 binary and official JPL reader are the primary oracle
for pvh-only. The official `testpo.405` run passed all 7,214 rows with zero
failures, tolerance `1e-13` AU/AU-day, maximum residual `5.3291e-14`, and
identical O0/O2 output hashes. pvh-only is bit-identical to the official full
reader for position and velocity, with status mismatch 0. This direct
equivalence is the production accuracy Gate C.

The NAIF DE405 SPK/CSPICE result is a separate official conversion artifact and
is retained as Gate D independent cross-reference. The old `1e-6` km /
`1e-12` km/s strict equality is not a production approval requirement and its
failure is not interpreted as a pvh-only defect. Gate D instead requires a
versioned baseline fingerprint plus distribution, drift, continuity, segment,
status, and timestamp-shape checks. Repeatability and hard-ceiling evidence is
not yet sufficient to set its numeric envelope, so the policy remains
`blocked_by_cross_reference_numeric_policy_gap`.

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

### Candidate C — ERFA EPV00 controlled adaptation
- **공식 출처**: ERFA v2.0.1 `eraEpv00`, IAU SOFA terms and ERFA's SOFA-Board-permitted BSD distribution.
- **기술 계약**: 1900-2100 TDB two-part JD 입력, BCRS-oriented heliocentric/barycentric Earth position and velocity (AU, AU/day). 공식 DE405 비교 최대치는 heliocentric 11.2 km, barycentric 13.4 km입니다.
- **라이선스와 정책 판정**:
  - `licenseStatus`: `BSD-3-Clause_with_SOFA_heritage_notice`
  - `commercialUsePermission`: `allowed`
  - `runtimeEligibility`: `candidate_for_controlled_adaptation`
  - `selectionStatus`: `selected_for_feasibility`
- 이는 production 채택이 아닙니다. ERFA 코드·계수는 아직 저장소에 포함되지 않았고, 정확한 Earth(399) vector, 속도, frame transform, bundle 크기는 독립 Horizons feasibility를 통과해야 합니다.

---

### Candidate D — JPL DE / NAIF SPICE Runtime
- **공식 출처**: NASA JPL Planetary Ephemeris (DE440/DE441), NAIF SPICE Toolkit
- **정확도**: 최고 정밀도
- **권리 상태**: reviewed official availability/provenance pages alone do not establish Mallang's compact-coefficient extraction and redistribution rights.
- **거부 사유**: full kernel is tens to hundreds of MB and requires a reader; compact-subset redistribution rights remain unresolved.
- **선정 상태**: `blocked_by_rights_and_architecture`

---

### Candidate E — Swiss Ephemeris Runtime
- **공식 출처**: Astrodienst Swiss Ephemeris
- **라이선스 상태**: AGPL v3 / Commercial
- **거부 사유**: AGPL 라이선스 및 C-lib/WASM 외부 바이너리 의존성으로 런타임 사용 제외.
- **선정 상태**: `rejected` (외부 점성학 검증 오라클 전용)

---

## 4. 최종 결정 및 선택 상태 (Decision Summary)

### `solarModelDecisionStatus: provisional`

- **이유**:
  1. 고정확도 독립 구현 후보인 **VSOP87**은 공식 재배포/상용 런타임 이용 라이선스가 `unresolved` 상태입니다.
  2. **JPL Approximate Positions Table 1 EM Bary**는 Horizons 검증을 완료했으나 total practical 3D angular p99가 0.006731도로 0.005도 기준을 초과해 거부되었습니다. 최대값 통과만으로 후보를 채택하지 않습니다.
  3. ERFA EPV00 controlled adaptation의 C→JavaScript 일치성과 DE441 `pvh` gate는 통과했습니다. 선택한 NAIF DE405 subset artifact의 1950–2050 coverage에서는 공식 reader 진단도 통과하고 SSB→Sun 계층 원인을 지지하지만, 기존 SPK의 strict overlap은 component gate를 실패했습니다. 원본 NIO·정확한 NIOSPK 버전·전체 변환 명령이 검증되지 않아 `technicalModelStatus: blocked_by_de405_spk_provenance_gap`이며 production runtime 모델·of-date transform·interpretation 사용은 아직 확정되지 않았습니다.

---

## 5. 차단 해제 및 후속 수립 절차 (Action Items for Resolution)

1. **IMCCE/IAU 공식 라이선스 확인 요청**: VSOP87 계수 파일 재배포권 공식 문서화 확인.
2. **ERFA EPV00 temporary feasibility**: ERFA v2.0.1과 임시 JavaScript adaptation의 일치, 1900-2100 Horizons Earth(399) 벡터·속도·frame 검증, bundle 측정, notice 설계를 수행합니다.
3. **권리 검토 분리**: feasibility 통과 뒤에도 실제 adapted source/coefficients의 고지와 배포 검토를 독립적으로 완료합니다.

ERFA의 component 분해, 공식 DE405/CSPICE provenance, coverage 제한, 통계 및
임시 산출물 해시는
[erfa-epv00-reference-ephemeris-delta.md](./erfa-epv00-reference-ephemeris-delta.md)에 보존합니다.

후보 권리표와 정책 판정은
[solar-alternative-model-survey.md](./solar-alternative-model-survey.md)에 보존합니다.
