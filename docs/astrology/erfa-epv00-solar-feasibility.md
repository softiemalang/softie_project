# ERFA EPV00 Solar Feasibility v0

## Scope and decision

This is an out-of-repository research validation only. No Solar Core, frame
transform, apparent-Sun calculation, package, runtime dependency, ERFA source,
coefficient array, binary, or Horizons response is included in this repository.

```text
algorithmLineage: ERFA v2.0.1 eraEpv00 / SOFA 20231011-derived
adaptationType: controlled JavaScript adaptation
copyrightOwnership: upstream ERFA copyright retained
license: BSD-3-Clause terms retained
endorsement: none
patentClause: none_explicit
candidateStatus: selected_for_feasibility
productionSelectionStatus: not_selected
candidateRejectionStatus: not_rejected
technicalModelStatus: blocked_by_incomplete_de405_diagnosis
runtimeSelectionStatus: not_selected
availableForInterpretation: false
```

The adaptation itself passed. The subsequent official-DE405 diagnosis confirms
the component identity and passes for the selected NAIF artifact's 1950–2050
coverage, but that subset artifact does not cover 36,526 mandatory 1900–2100
samples. The official JPL full-range candidate is acquired with declared
1599–2201 coverage, but `gfortran`, `flang`, and `f77` are unavailable, so it
has not been numerically validated by an executable official reader. This work
therefore
does **not** authorize production implementation or alter any threshold. This
is not a rejection of ERFA or its heliocentric `pvh` model.

## Baseline and provenance

| Field | Record |
| --- | --- |
| Requested baseline | ERFA v2.0.1 |
| Latest release observed | v2.0.1 |
| Baseline upgrade decision | `not_in_scope` |
| Tag commit | `944bc0956f1d236e5982ee63930e060e60ec85f9` |
| SOFA lineage | 20231011 |
| `src/epv00.c` SHA-256 | `4568b28026cd83800b4a4f66d44f8f3451d7306f1c3fcf7e4cd6bfeb206dde57` |
| `LICENSE` SHA-256 | `b1858f9a263f22c438a455a32945da51a31a0ae25a21055da13bb7ed57cc3b51` |
| Official validation source | `src/t_erfa_c.c`, `t_epv00` |
| Official test input | `2400000.5 + 53411.52501161` TDB |
| Official tolerances | position `1e-14` AU; velocity `1e-15` AU/day |

All retained research artifacts are under
`/tmp/mallang-erfa-epv00-feasibility/`, including the downloaded archive, C
runner, JS source, results, request cache, and SHA-256 records. The C source
and JS adaptation hashes are respectively
`4568b280…dde57` and `44501d79a9cc410799ea5d52b231f23be246dabb879c3ad963c4c912d8e7932e`.

## C reference and controlled JavaScript adaptation

Apple clang 21.0.0 on arm64 Darwin compiled the minimal official-source runner
with `-O0 -ffp-contract=off` and `-O2 -ffp-contract=off -fno-vectorize
-fno-slp-vectorize -fno-unroll-loops -fno-inline -fno-builtin`. Binary hashes:
O0 `e85355b3433a3ad40c3663f3e2986fd2ab98e11737b6560ec6e190533adc52d6`,
O2 `b996c4efe3a543c5e7eb0d35ec9d74e59cc3891a49757f5055c4911c5daf2aaf`.

The official test passed in both C and JS: maximum official expected-value
difference was `6.8833827526759706e-15`. O0/O2 were exactly equal for every
tested component. The JS source preserves 5,853 coefficient decimals (SHA-256
of ordered decimal stream `a5bfc18a65625638ce4904eb49038876c6632abaaa465eb9fa249a1b69ed1392`),
array order, loop order, summation order, status rule, and orientation matrix.
No external runtime dependency is used.

| C/JS conformance metric | Result | Gate |
| --- | ---: | ---: |
| Unique TDB timestamps | 83,338 | — |
| Position component maximum | `2.220446049250313e-16` AU | `<= 5e-13` AU |
| Velocity component maximum | `6.938893903907228e-18` AU/day | `<= 5e-14` AU/day |
| Maximum ULP distance | 118 | reported |
| Status mismatches / non-finite | 0 / 0 | 0 / 0 |
| Result | pass | pass |

Samples: fixed 11 rows (one internal duplicate), all 73,051 one-day rows,
10,000 deterministic fractional rows, and 291 one-hour boundary rows; 15
expected cross-phase overlaps were removed. The reference uses J2000 split.
The source status rule is exactly `abs(((date1-2451545)+date2)/365.25) <= 100`:
supported inclusive JD range `2415020.0` through `2488070.0`; warnings occur
at least by `2415019.9583333335` and `2488070.0416666665` in the one-hour
boundary scan. A separate all-four-split report and TT/TDB conversion study
remain incomplete; raw TDB use is not thereby promoted to a TT policy.

## Horizons daily acceptance result

Only after the C/JS gates passed, three sequential, cached Oracle calls were
made for the complete C-status-0 range at one-day spacing. API version was
`1.2`; all headers identified DE441, ICRF, geometric vector type, AU-D, and
the requested target/center pairs. All three returned 73,051 rows and the
sorted timestamp hash was identical:
`4f61dc287a90a360ea6fd6764a5f99aaca90ffafcb98eb06cff53eba17b2a542`.

| Oracle | Target / center | Contract result |
| --- | --- | --- |
| A | Earth (399) / Sun (10) | pvh: Sun→Earth |
| B | Earth (399) / SSB (0) | pvb: SSB→Earth |
| C | Sun (10) / Earth (399) | `-pvh`: Earth→Sun |

| Result (daily, km or mm/s; angular degrees) | Mean | p95 | p99 | Maximum | Gate |
| --- | ---: | ---: | ---: | ---: | --- |
| A position error, km | 3.651 | 6.579 | 8.295 | 11.823 | pass (`<=25`, p99 `<=15`) |
| A velocity error, mm/s | 1.278 | 2.363 | 2.988 | 4.848 | pass (`<=15`, p99 `<=10`) |
| A angular separation | 0.000001191 | 0.000002415 | 0.000003195 | 0.000004676 | pass |
| B position error, km | 120.001 | 133.225 | 138.173 | 141.863 | **fail** (`<=30`) |
| B velocity error, mm/s | 1.278 | 2.366 | 2.991 | 4.767 | pass (`<=15`) |
| C position/velocity/angular | same as A | same as A | same as A | same as A | pass |

Oracle C equalled negative Oracle A for both position and velocity with a
maximum observed difference of zero in the parsed AU-D values. The worst A
position date was JD TDB `2430100`. The daily result already fails the
predeclared barycentric hard gate; therefore dense worst-case and additional
fractional Horizons phases were not used to relax, exclude, or mask it.
They remain required if a later DE405-vs-DE441 reference-delta investigation
resolves the mismatch.

## Solar Raw Core relevance and retained gate

Mallang Solar Raw Core requires the geometric **Earth→Sun raw vector**. It is
obtained by negating **both** ERFA `pvh` position and velocity; it is not a
`pvb` product. Oracle A (`pvh`, Sun→Earth) and Oracle C (`-pvh`, Earth→Sun)
both passed every predeclared current-Horizons DE441 position, velocity, and
angular gate.

The failed result is only `pvb` barycentric Earth **position**. `pvb` is not a
required Solar Raw Core product output. Nevertheless, the predeclared
barycentric gate is retained: it is neither deleted after the result nor used
to justify a tolerance expansion, residual correction, or date exclusion.
Production selection remains withheld until a complete DE405-to-DE441
reference-ephemeris-delta diagnosis resolves this distinction. The current
coverage-limited result is recorded in
[erfa-epv00-reference-ephemeris-delta.md](./erfa-epv00-reference-ephemeris-delta.md).

## Frame, performance, and notice plan

Raw output is geometric BCRS/ICRF-compatible Sun→Earth or SSB→Earth state at
TDB. Production astrology would separately require frame bias/precession to
mean equator/equinox of date, mean obliquity rotation, and tropical longitude;
none is implemented or validated here.

On Node 22.20.0 Apple Silicon, 10,000 evaluations took 524.983 ms and 100,000
took 5305.520 ms (18,848 evaluations/s). Unminified JS was 120,499 bytes;
gzip was 43,543 bytes. Brotli and a project-bundler minification measurement
were unavailable without adding tools, so are not claimed.

If a later approved implementation passes reference-delta review, it must add
the ERFA v2.0.1 BSD-3-Clause notice, NumFOCUS copyright, warranty disclaimer,
SOFA 20231011-derived wording, non-endorsement statement, upstream version,
and Mallang-specific modification description to `THIRD_PARTY_NOTICES.md`,
`docs/astrology/licenses/ERFA-LICENSE.txt`, and the production source header.
Those files are intentionally unchanged now.

## Final result and next task

```text
finalDecision: blocked_by_incomplete_de405_diagnosis
adaptationConformanceStatus: confirmed_against_erfa_v2_0_1
heliocentricVectorValidationStatus: passed_against_current_Horizons_DE441
earthToSunVectorValidationStatus: passed_against_current_Horizons_DE441
barycentricVectorValidationStatus: blocked_by_incomplete_de405_diagnosis
de405ModelCoverage: 1599-12-09 through 2201-02-20
subsetDe405ArtifactCoverage: 1950-01-01 through 2050-01-01
fullRangeDe405ArtifactStatus: acquired_unvalidated
fullRangeDe405DeclaredCoverage: 1599-12-09 through 2201-02-20
officialDe405ReaderStatus: blocked_by_fortran_compiler_unavailable
de405DirectValidationStatus: blocked_by_official_reader_toolchain_unavailable
technicalModelStatus: blocked_by_incomplete_de405_diagnosis
referenceEphemerisDeltaAttribution: confirmed_for_1950_2050_subset
productionSelectionStatus: not_selected
candidateRejectionStatus: not_rejected
speedValidationStatus: confirmed_for_raw_vector_velocity
frameTransformStatus: not_implemented
noticeIntegrationStatus: pending
serviceIntegrationStatus: not_connected
availableForInterpretation: false
```

The next single task is to make the located official full-range DE405 artifact
executable with an official JPL reader, then complete the DE405-to-DE441
Earth/Sun and barycentric-Earth delta under the same BCRS/TDB contracts for
all mandatory timestamps. It must not change thresholds, add residual
correction, or implement the Solar Core.
