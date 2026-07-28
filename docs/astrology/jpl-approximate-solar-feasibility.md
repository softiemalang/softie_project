# JPL Approximate EM Bary Solar Feasibility Research

## Outcome

`technicalModelStatus: rejected`

JPL Solar System Dynamics의 *Approximate Positions of the Planets* Table 1에서
`EM Bary` 항목을 Earth 중심의 태양 위치 대용으로 쓸 수 있는지, 제품 코드와
분리된 연구 구현으로 검증했다. 최대 오차 두 항목은 통과했지만 p99 3차원
각오차가 사전 고정 기준을 넘었다. 따라서 이 모델은 Mallang Solar Position
Core v0의 runtime 후보로 승격하지 않는다. 허용오차 확대, Horizons 잔차 보정,
날짜 제외는 수행하지 않았다.

```text
solarModelDecisionStatus: blocked
technicalModelStatus: rejected
rightsReviewStatus: pending
formulaConformanceStatus: research_prototype_only
externalVectorValidationStatus: completed_rejected_against_threshold
externalLongitudeValidationStatus: completed_rejected_in_J2000_ecliptic_frame
speedValidationStatus: research_result_recorded
serviceIntegrationStatus: not_connected
availableForInterpretation: false
```

## Model and research contract

- Model: JPL SSD Approximate Positions, Table 1, `EM Bary`; Table 2b terms were
  not used.
- Native output: Sun-centered, heliocentric geometric Earth-Moon-barycenter
  vector in mean ecliptic and equinox of J2000, in AU.
- Time argument: JDTDB, `T = (JDTDB - 2451545.0) / 36525`.
- Research domain: 1900-01-01T00:00:00 TDB through
  2049-12-31T23:59:59 TDB. The official Table 1 interval was not silently
  extended to the end of 2050.
- Kepler solve: mean anomaly normalized to [-180, +180] degrees; official
  `E0 = M + (180/pi)e sin(M)` starting estimate; Newton-Raphson; 20-iteration
  finite limit; 1e-8 degree convergence tolerance; throw on non-convergence.
  Near -180, 0, +180 degrees, low/EMB-range eccentricities, negative-J2000
  dates, and research endpoints all converged.
- No production source, dependency, coefficients, raw Horizons response, or
  external implementation was added to this repository.

The independent temporary implementation remains at
`/tmp/mallang-jpl-solar-feasibility/` for review. It uses only Node built-ins.

## Horizons oracle contracts and collection result

All requests used `EPHEM_TYPE=VECTORS`, `REF_SYSTEM=ICRF`,
`REF_PLANE=ECLIPTIC`, `VEC_CORR=NONE`, `OUT_UNITS=AU-D`, `TIME_TYPE=TDB`,
`VEC_TABLE=3`, `CSV_FORMAT=YES`, and Gregorian calendar mode.

| Oracle | Target / center | Purpose | Returned samples | Header result |
| --- | --- | --- | ---: | --- |
| A | Earth-Moon Barycenter (3) / Sun (10) | Approximate-model intrinsic error | 57,153 | passed |
| B | Sun (10) / Earth-Moon Barycenter (3) | EMB-to-Sun sign and center-substitution comparison | 57,153 | passed |
| C | Sun (10) / Earth (399) | Practical Earth-center proxy comparison | 57,153 | passed |

All 189 cached response chunks were checked for target, center, J2000 ecliptic
reference wording and ICRF x-axis, geometric/no-correction mode, AU-D units,
TDB start/stop times, and a DE ephemeris source. No contract mismatch was
accepted. Responses were sequentially requested with bounded retry/backoff and
request/response hashes; cache was reused on reruns.

## Sampling

| Phase | Samples / rule |
| --- | --- |
| Fixed | 7 specified TDB instants |
| Daily grid | 54,787 dates, 1900-01-01 through 2049-12-31 at 00:00 TDB |
| Worst-case refinement | 247 unique 6-hour instants from merged +/-3-day windows around daily top 25 |
| Range boundaries | 115 unique 6-hour instants around the 1900 start, J2000, and 2049 end |
| Fractional | 2,000 deterministic fractional-day instants; seed `0x6d2b79f5` |
| Total | 57,052 unique instants after expected cross-phase overlap removal |

The five phase lists contain 57,156 planned rows before any deduplication.
Three fixed/boundary overlaps were merged before the combined discrete request,
so each Oracle received and returned 57,153 rows. The remaining 101 returned
row repetitions are expected cross-phase overlaps: 34 between daily and the
combined fixed/boundary/fractional request, plus 67 between daily and the
worst-case dense request. They are not Horizons header rows or overlapping
chunks. The final audit terminology is therefore:

```text
missing timestamps: 0
unexpected duplicate timestamps: 0
expected cross-phase overlaps removed: 101
final unique timestamps: 57,052
```

The practical comparison is `negate(approximate Sun->EMB)`, compared with
Oracle C's Earth->Sun vector. Angular differences use normalized vectors,
clamped dot products, and circular longitude differences.

## Error decomposition

Values below are absolute degrees unless noted. Each primary metric provides
the required min, mean, median, p90, p95, p99, p99.9, max, and RMS statistics
over the same 57,052 unique instants.

### A. Approximate EMB model versus exact EMB

| Metric | Min | Mean | Median | p90 | p95 | p99 | p99.9 | Max | RMS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3D angle (deg) | 0.000002 | 0.002008 | 0.001743 | 0.003952 | 0.004644 | 0.005720 | 0.006248 | 0.006325 | 0.002424 |
| J2000 longitude (deg) | 0.000000 | 0.001939 | 0.001688 | 0.003927 | 0.004626 | 0.005712 | 0.006243 | 0.006315 | 0.002390 |

Additional metrics: latitude mean/p95/p99/max/RMS =
0.000307/0.000852/0.001028/0.001181/0.000403 deg; distance
mean/p95/p99/max/RMS = 0.000015350/0.000036269/0.000044588/0.000052466/
0.000018846 AU; vector-component magnitude mean/p95/p99/max/RMS =
0.000040875/0.000082974/0.000100905/0.000111847/0.000046350 AU.

Angular threshold exceedances: 0.001 deg 40,598 (71.160%), 0.005 deg 1,848
(3.239%), 0.01 deg 0. Worst refined instant: 1939-05-25 06:00 TDB
(JD 2429408.75), 0.006325 deg (22.770 arcsec).

### B. Exact Earth/EMB center substitution

| Metric | Min | Mean | Median | p90 | p95 | p99 | p99.9 | Max | RMS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3D angle (deg) | 0.000007 | 0.001158 | 0.001277 | 0.001776 | 0.001825 | 0.001878 | 0.001905 | 0.001913 | 0.001280 |
| J2000 longitude (deg) | 0.000000 | 0.001148 | 0.001272 | 0.001772 | 0.001821 | 0.001874 | 0.001901 | 0.001912 | 0.001275 |

Distance mean/p95/p99/max/RMS =
0.000019701/0.000031798/0.000032718/0.000033010/0.000021918 AU. Correction
vector magnitude max is 0.000033033 AU. Angular threshold exceedances: 0.001
deg 35,822 (62.788%), 0.005 deg 0, 0.01 deg 0. Worst instant:
2028-12-24 00:00 TDB (JD 2462129.5), 0.001913 deg (6.887 arcsec).

### C. Practical approximate-EMB-as-Earth proxy

| Metric | Min | Mean | Median | p90 | p95 | p99 | p99.9 | Max | RMS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3D angle (deg) | 0.000002 | 0.002267 | 0.001937 | 0.004498 | 0.005269 | 0.006731 | 0.007744 | 0.008013 | 0.002751 |
| J2000 longitude (deg) | 0.000000 | 0.002198 | 0.001888 | 0.004480 | 0.005250 | 0.006721 | 0.007744 | 0.008011 | 0.002719 |

Additional metrics: latitude mean/p95/p99/max/RMS =
0.000324/0.000866/0.001082/0.001325/0.000418 deg; distance
mean/p95/p99/max/RMS = 0.000023781/0.000054352/0.000066582/0.000083221/
0.000028891 AU; vector-component magnitude mean/p95/p99/max/RMS =
0.000050154/0.000096438/0.000120410/0.000141708/0.000056071 AU.

Angular threshold exceedances: 0.001 deg 43,071 (75.494%), 0.005 deg 3,688
(6.464%), 0.01 deg 0. Worst refined instant: 1939-05-26 00:00 TDB
(JD 2429409.5), 0.008013 deg (28.848 arcsec).

**Maximum total 3D angular error <= 0.01 degree: yes.**

**Maximum total J2000 longitude error <= 0.01 degree: yes.**

**p99 total 3D angular error <= 0.005 degree: no (0.006731 degree).**

This p99 failure is sufficient for rejection under the predeclared conjunctive
criteria. The dense and range-end checks did not reveal an unexplained jump;
they confirm the observed error envelope rather than curing it.

## Speed research

Central finite differences of the approximate EMB vector were compared to
Oracle A's Horizons vector velocity over 54,785 interior daily instants. The
reported error includes the approximate-position model's error; it is not an
analytic velocity implementation.

| Step | Vector-speed mean / p99 / max (AU/day) | Longitude-speed mean / p99 / max (deg/day) |
| --- | --- | --- |
| 1 day | 0.000000969 / 0.000001730 / 0.000001920 | 0.000032237 / 0.000090975 / 0.000105415 |
| 6 hours | 0.000000552 / 0.000001150 / 0.000001270 | 0.000032340 / 0.000091489 / 0.000106491 |
| 1 hour | 0.000000552 / 0.000001152 / 0.000001269 | 0.000032347 / 0.000091554 / 0.000106557 |

Six hours and one hour are materially indistinguishable at the displayed
precision; one day is worse for vector velocity. This is recorded as
`finite_difference_viable_for_validation_only`, not as a runtime selection:
the position model itself is rejected and no analytic velocity contract exists.

## Provenance, rights, and limitations

- Official technical sources: JPL SSD Approximate Positions and JPL Horizons
  API/System manual. Their URLs and request parameters are retained in the
  temporary result provenance; external prose and raw bulk responses are not
  copied here.
- Temporary research files include `jplApproximateEmb.mjs`,
  `horizonsClient.mjs`, `runValidation.mjs`, `analyzeResults.mjs`, `cache/`,
  and `results/`. Result/script artifact hashes are recorded in
  `/tmp/mallang-jpl-solar-feasibility/results/artifact-provenance.json`.
- Final result summary SHA-256:
  `47fd80f5aac1caf3120d318bdc0b1d0ad9034892893b45d087821877fbb8697f`.
  Script hashes and per-response hashes remain in the temporary provenance.
- `rightsReviewStatus: pending`. This technical rejection neither clears nor
  decides copyright, redistribution, commercial runtime, or permission status.
- This work only compares J2000 ecliptic geometric vectors. It does not
  implement mean ecliptic/equinox of date, tropical longitude, zodiac-boundary
  stability, apparent corrections, nutation, aberration, light-time, or a Moon
  model.

## Decision

`runtimeSelectionStatus: rejected_for_this_candidate_and_threshold`

No reduced date range is asserted: the predeclared full-range criterion failed,
and this study did not define a non-arbitrary reduced-range rule. The next
permitted direction is an alternative model evaluation, not a fitted correction
to this one.
