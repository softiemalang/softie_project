# Astronomy Model Provenance & Formulas v0

## ERFA/DE405 provenance closure

The official NAIF `de405.cmt` records `NIOSPK`, source
`/usr2/nio/gen/de405.nio`, creation `1999-10-03/14:31:58.00`, the
body/time interval, and an abbreviated NIOSPK command log. The downloaded
`de405.bsp` is 10,898,432 bytes with SHA-256
`30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89`; its MD5
`26d9596d003d6bf3b1c0b33e9567275b` matches the official NAIF checksum.
However, the original NIO artifact, its hash/content, the exact NIOSPK
version, and the complete conversion command/options are unavailable.
Therefore A/B/C are not all satisfied and the final state is
`blocked_by_de405_spk_provenance_gap`; no SPK regeneration is permitted.

Official sources: [NAIF de405.cmt](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.cmt),
[NAIF checksum list](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/aa_checksums.txt),
and [NAIF DE405 directory](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/).

The JPL full-range binary is the primary full-range oracle when read by the
official JPL reader. It is not evidence that the historical NIOSPK conversion
can be reproduced and is not a substitute for the separate NAIF SPK provenance
record. No runtime model is selected.

## DE405 validation hierarchy and CSPICE contract (2026-07-28)

The primary numerical oracle for pvh-only is the official JPL DE405 binary read
by the official `testeph.f` reader. The validated `testpo.405` run has 7,214
rows, zero failures, tolerance `1e-13` AU/AU-day, maximum residual
`5.3291e-14`, and identical O0/O2 output hashes. pvh-only is position/velocity
component bit-identical to the official full reader with status mismatch 0 on
the declared common timestamp set.

The NAIF DE405 SPK read by official CSPICE is a separate official conversion
artifact, not an oracle for identical floating-point representation. It is an
independent cross-reference and anomaly detector. The observed 36,525-row
Sun-to-Earth baseline (position norm maximum `0.0091509078` km; velocity norm
maximum `1.8229023e-9` km/s; status mismatch 0) is not, by itself, evidence of
a pvh-only implementation error.

### Source-role and coverage correction (2026-07-29)

The JPL binary `lnxp1600p2200.405` plus the official JPL reader is the
`primary_oracle` for the full `1900-01-01` through `2101-01-01` service range.
The SHA-matched NAIF `de405.bsp` plus CSPICE N0067 is only an
`independent_cross_reference` over its verified `1950-01-01 00:00:41.183 ET`
through `2050-01-01 00:01:04.183 ET` coverage. CSPICE is never canonical,
never `primary_oracle`, and never a fallback. The JPL reader
target/center/time-scale semantic contract is confirmed in
`docs/astrology/de405-jpl-official-reader-contract.md`; production selection
remains blocked pending pipeline implementation.

The contract is Gate A artifact integrity (JPL binary hash, NAIF SPK hash,
timestamp/fixture hash, coverage, metadata); Gate B official-reader
self-validation (complete `testpo.405`, row count, zero failures, declared
tolerance, compiler reproducibility); Gate C production equivalence (full
reader/pvh-only bit-identical position and velocity, zero status mismatches,
matching coverage/count); and Gate D CSPICE independent cross-reference
(counts, timestamp identity, status, distributions, worst vector, temporal
windows, drift, adjacent changes, segment continuity, and versioned baseline
fingerprint). A manifest mismatch stops later gates. Gate C keeps bit identity;
it is not replaced by a looser tolerance.

The historical CSPICE strict thresholds `1e-6` km and `1e-12` km/s are not Gate
C approval criteria. Gate D numeric promotion is currently
`blocked_by_cross_reference_numeric_policy_gap` because repeatability runs,
platform/compiler variation, and a justified independent hard ceiling are not
available. No runtime approval follows from this document.

## 1. Clean Room Implementation Principles
- 외부 천문 라이브러리(Swiss Ephemeris, Astronomy Engine, IAU SOFA, ERFA, NOVAS, Meeus 구현체 등) 코드 및 원격 API를 복사/포팅/사용하지 않았습니다.
- 본 수식과 상수는 지시서에 명시된 결정론적 공식만을 근거로 작성되었습니다.

---

## 2. Formulas & Mathematical Definitions

### A. Julian Date UTC (proleptic Gregorian)
$$a = \lfloor \frac{14 - M}{12} \rfloor$$
$$y = Y + 4800 - a, \quad m = M + 12a - 3$$
$$\text{JDN} = D + \lfloor \frac{153m + 2}{5} \rfloor + 365y + \lfloor \frac{y}{4} \rfloor - \lfloor \frac{y}{100} \rfloor + \lfloor \frac{y}{400} \rfloor - 32045$$
$$\text{JD}_{\text{UTC}} = \text{JDN} - 0.5 + \frac{\text{hour} \times 3600 + \text{minute} \times 60 + \text{second}}{86400}$$

### B. Time Scales
$$\text{JD}_{\text{UT1}} = \text{JD}_{\text{UTC}} + \frac{\text{DUT1}}{86400}$$
$$\text{JD}_{\text{TT}} = \text{JD}_{\text{UTC}} + \frac{\text{TT\_OFFSET}}{86400}$$
$$\Delta T = \text{TT\_OFFSET} - \text{DUT1}$$

### C. IAU 2000 Earth Rotation Angle (ERA)
$$d_{\text{UT1}} = \text{JD}_{\text{UT1}} - 2451545.0$$
$$\text{ERA}_{\text{raw}} = 0.7790572732640 + 1.00273781191135448 \times d_{\text{UT1}}$$
$$\text{ERA}_{\text{turns}} = \text{ERA}_{\text{raw}} - \lfloor \text{ERA}_{\text{raw}} \rfloor$$
$$\text{ERA}_{\text{degrees}} = \text{normalizeDegrees360}(\text{ERA}_{\text{turns}} \times 360)$$

### D. IAU 2006 Mean Obliquity ($\epsilon$)
$$T = \frac{\text{JD}_{\text{TT}} - 2451545.0}{36525}$$
$$\epsilon'' = 84381.406 - 46.836769 T - 0.0001831 T^2 + 0.00200340 T^3 - 0.000000576 T^4 - 0.0000000434 T^5$$
$$\epsilon^{\circ} = \frac{\epsilon''}{3600}$$

### E. IAU 2006 Greenwich Mean Sidereal Time (GMST) & LMST
$$\text{GMST}_{\text{corr}}'' = 0.014506 + 4612.156534 T + 1.3915817 T^2 - 0.00000044 T^3 - 0.000029956 T^4 - 0.0000000368 T^5$$
$$\text{GMST}^{\circ} = \text{normalizeDegrees360}\left(\text{ERA}^{\circ} + \frac{\text{GMST}_{\text{corr}}''}{3600}\right)$$
$$\text{LMST}^{\circ} = \text{normalizeDegrees360}(\text{GMST}^{\circ} + \lambda_{\text{east}})$$

### F. Mean Midheaven (MC)
$$\theta = \text{LMST}_{\text{radians}}, \quad \epsilon = \epsilon^{\circ}_{\text{radians}}$$
$$\text{MC}_{\text{radians}} = \text{atan2}(\sin\theta, \cos\theta \cos\epsilon)$$
$$\text{MC}^{\circ} = \text{normalizeDegrees360}(\text{MC}_{\text{radians}} \times \frac{180}{\pi})$$

### G. Mean Ascendant (ASC)
$$\phi = \text{geographic\_latitude}_{\text{radians}}$$
$$\text{ASC}_{\text{base}} = \text{atan2}(-\cos\theta, \sin\theta \cos\epsilon + \tan\phi \sin\epsilon)$$
$$\text{ASC}^{\circ} = \text{normalizeDegrees360}((\text{ASC}_{\text{base}} \times \frac{180}{\pi}) + 180)$$
- **Geographic Pole Restriction**: $90^{\circ} - |\text{latitude}| \le 10^{-10}$ 인 경우 ASC 계산 불가 (`blocked`).

---

## 3. External Validation Oracles & License Boundaries
- 본 코어 구현체는 저장소 밖에서 일회성 수치 비교용으로 실행한 **IAU SOFA (2023-10-11 ANSI C)** 및 **Swiss Ephemeris (v2.10.03)** 외부 오라클 결과와 검증되었습니다.
- 외부 라이브러리 소스, 바이너리, 헤더, wrapper, 런타임 호출은 저장소에 전혀 포함되지 않았습니다.
- IAU SOFA 공식 라이선스 및 제3자 지적재산권 고지는 [THIRD_PARTY_NOTICES.md](file:///Users/softie/Documents/softie_project/THIRD_PARTY_NOTICES.md) 및 [docs/astrology/licenses/IAU-SOFA-LICENSE.txt](file:///Users/softie/Documents/softie_project/docs/astrology/licenses/IAU-SOFA-LICENSE.txt)에 보존되어 있습니다.
- 상세 오라클 출처 및 수치 검증 결과는 [docs/astrology/time-angle-external-validation.md](file:///Users/softie/Documents/softie_project/docs/astrology/time-angle-external-validation.md) 문서 참조.

---

## 4. Solar Position Core Model Status (v0 Pre-implementation)
- 태양 위치 계산 모델 후보 조사 결과 ERFA EPV00 controlled adaptation은 feasibility 단계에만 있습니다. 기존 NAIF DE405 SPK의 공식 comment/checksum과 기존 CSPICE overlap은 확인했지만, 원본 NIO·정확한 NIOSPK 버전·전체 변환 명령이 없어 `technicalModelStatus: blocked_by_de405_spk_provenance_gap`입니다. 재생성·strict regenerated-overlap·production runtime 연결은 수행하지 않습니다.
- 표준 좌표·시간 계약 및 층위 구조는 [docs/astrology/solar-position-contract.md](file:///Users/softie/Documents/softie_project/docs/astrology/solar-position-contract.md)를 따르며, 구현 전 `availableForInterpretation: false` 상태로 보존됩니다.
- 오라클 검증 설계 및 표준 파라미터 규격은 [docs/astrology/solar-validation-plan.md](file:///Users/softie/Documents/softie_project/docs/astrology/solar-validation-plan.md)에 수립되어 있습니다.

### Evidence manifest closure (2026-07-29)

The manifest records hashes recomputed from the identified temporary artifacts.
The JPL full-range binary is `de405/full-range/lnxp1600p2200.405`, 55,900,416
bytes, SHA-256
`7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7`.
It is identified by official `header.405`/`testpo.405` and read by the
official `testeph.f` reader.

The 36,525-row fixture is `reference-delta/de405-covered-timestamps.txt`.
Its entire raw byte stream is hashed: one ASCII decimal JD per row, LF
endings, trailing LF, ascending order, no duplicates. SHA-256:
`f3198ef890e61b4a60f38d27ec9e6a69540759a444d3541ca32c5833e6241377`.

The official reader hashes cover the complete raw stdout files
`de405/official-reader/test-o0.stdout` and `test-o2.stdout`, without
normalization. Each has 233 lines and SHA-256
`9a7e04ad5e56025169196a6863ff832e1fdc7aa4dba2ba16b8c6465bbc7f8995`.
`shasum -a 256` and `openssl dgst -sha256` agreed for all targets.
