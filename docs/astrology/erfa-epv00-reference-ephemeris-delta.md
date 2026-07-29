# ERFA EPV00 Reference-Ephemeris Delta Diagnosis

## 2026-07-28 provenance closure

The existing NAIF SPK is verified against the official directory checksum, but
the original NIO, exact NIOSPK version, and complete conversion command/options
are not available. The SPK-regeneration provenance prerequisites therefore
remain incomplete and no regeneration was attempted.
The final status is `blocked_by_de405_spk_provenance_gap`.

## Decision

### Source hierarchy decision

The official JPL DE405 binary plus official JPL reader is the primary oracle
for pvh-only production accuracy. The official `testpo.405` evidence is 7,214
rows, zero failures, tolerance `1e-13` AU/AU-day, maximum residual
`5.3291e-14`, with identical O0/O2 output hashes. pvh-only is position/velocity
component bit-identical to the official full reader with status mismatch 0.
This direct comparison is the production accuracy Gate C.

The official NAIF DE405 SPK plus CSPICE is a separate converted artifact and an
independent cross-reference, not a strict-equality oracle for the JPL binary.
The old `1e-6` km / `1e-12` km/s check remains historical diagnostic evidence,
not a Gate C approval condition. Gate D jointly evaluates sample/timestamp
identity, status, component/norm distributions, worst epoch/vector,
start/middle/end windows, drift, adjacent changes, segment continuity, and a
versioned baseline fingerprint. A single position threshold is not a
replacement policy.

The hierarchy is confirmed. Gate D numeric promotion remains
`blocked_by_cross_reference_numeric_policy_gap` because repeatability and an
independent hard ceiling have not yet been evidenced.

## 2026-07-28 reader/CSPICE contract re-investigation

The CSPICE calls are target 399/center 10 for Sun→Earth, 399/0 for
SSB→Earth, 10/0 for SSB→Sun, and 10/399 for Earth→Sun, in J2000 and km/km/s.
The official reader uses target 3 (EMB), 10 (Moon), 11 (Sun), and 12 (SSB),
with `Earth = EMB - geocentricMoon/(1+EMRAT)` and header `EMRAT=81.30056`.
The SPK contains one J2000/type-2 segment per object, including 399←3 and
301←3; its internal Earth/Moon/EMRAT identity closes to machine precision.

Correctly paired over all 36,525 rows, the Sun→Earth position residual is
p95 0.0091486 km, p99 0.0091503 km, max 0.0091509 km (worst JD 2433833,
components +0.002111/-0.008169/-0.003543 km); velocity p95/p99/max are
1.8215e-9/1.8225e-9/1.8229e-9 km/s. Start, middle, and end windows are the
same magnitude; fitted drift is 8.27e-13 km/day and no segment-boundary jump
was found. This strongly supports a DE405→SPK representation/conversion
difference, not a mapping or time-offset error. The NIOSPK comment identifies
`/usr2/nio/gen/de405.nio` and the 1999 creation, but the source NIO file and
exact NIOSPK version/options are unavailable; root cause remains unconfirmed.

This out-of-repository diagnosis confirms the algebraic separation between
ERFA's heliocentric Earth model and its SSB-to-Sun contribution for the
selected artifact's 1950–2050 subset. The subset NAIF `de405.bsp` artifact
covers only 1950-01-01 through 2050-01-01. An official JPL full-range candidate
has been acquired and declares coverage through 2201-02-20, but has not yet
been numerically validated by an executable official reader in this study.
Therefore no sample was silently removed and no threshold was changed;
pvh-only production implementation is **not** selected because runtime
selection remains separately blocked by unresolved SPK provenance and Gate D
numeric policy.

```text
solarModelDecisionStatus: provisional
adaptationConformanceStatus: confirmed_against_erfa_v2_0_1
heliocentricVectorValidationStatus: passed_against_current_Horizons_DE441
earthToSunVectorValidationStatus: passed_against_current_Horizons_DE441
barycentricVectorValidationStatus: existing_spk_overlap_only
de405ModelCoverage: 1599-12-09 through 2201-02-20
subsetDe405ArtifactCoverage: 1950-01-01 through 2050-01-01
fullRangeDe405ArtifactStatus: official_testpo_validated
fullRangeDe405DeclaredCoverage: 1599-12-09 through 2201-02-20
officialDe405ReaderStatus: passed_full_jpl_testpo_and_spk_overlap
de405DirectValidationStatus: pvh_only_bit_identical_to_official_full_reader
technicalModelStatus: blocked_by_de405_spk_provenance_gap
validationHierarchyStatus: confirmed
cspiceAnomalyPolicyStatus: blocked_by_cross_reference_numeric_policy_gap
referenceEphemerisDeltaAttribution: confirmed_for_1950_2050_subset
referenceEphemerisDeltaStatus: existing_spk_only_regeneration_blocked_by_provenance_gap
runtimeSelectionStatus: not_selected
productionOutputScope: not_implemented
frameTransformStatus: not_implemented
noticeIntegrationStatus: pending
serviceIntegrationStatus: not_connected
availableForInterpretation: false
```

The permitted selection string
`selected_for_solar_raw_core_implementation_pvh_only` is not used. The next
single task remains a complete official-reference diagnosis; it must not add a
frame transform, tropical longitude, apparent-Sun calculation, residual
correction, or production Solar Core.

## Question and vector contracts

The research tested whether the prior 141.863 km `pvb` residual is already in
ERFA heliocentric `pvh`, or is introduced by its derived SSB-to-Sun term.

| Label | Meaning |
| --- | --- |
| ERFA `pvh` / Horizons A / DE405 A405 | Sun→Earth |
| ERFA `pvb` / Horizons B / DE405 B405 | SSB→Earth |
| `pvb - pvh` / B−A / S405 | SSB→Sun |
| `-pvh` / Horizons C / C405 | Earth→Sun |

Solar Raw Core would require only the last product: negate **both** `pvh`
position and velocity. `pvb` is not a Solar Raw Core output. That narrower
contract does not erase the already-declared barycentric gate.

## Timestamp and DE441 cache contract

The existing cached Horizons API v1.2 responses were reused without a new
request. Their headers record DE441, ICRF, geometric vectors, AU/day, and TDB.
All three Oracles A/B/C have 73,051 rows. The sorted unique TDB set is
identical for every Oracle and has SHA-256
`4f61dc287a90a360ea6fd6764a5f99aaca90ffafcb98eb06cff53eba17b2a542`.

| Dataset | Requested / returned | Common with A/B/C |
| --- | ---: | ---: |
| Full ERFA adaptation | 73,051 / 73,051 | 73,051 |
| Horizons A, B, C | 73,051 each | 73,051 |
| pvh-only adaptation | 73,051 daily; 83,338 broader C/JS set | 73,051 daily |
| Official DE405 runner | 73,051 requested; 36,525 returned | 36,525 |

The missing timestamps for the **selected NAIF artifact** are recorded rather
than discarded: 18,263 from
JD TDB `2415020`–`2433282`, and 18,263 from `2469808`–`2488070`, for 36,526
missing rows. The runnable central interval is 36,525 daily timestamps.

## Official DE405 and CSPICE provenance

| Artifact | Record |
| --- | --- |
| Kernel | `/tmp/mallang-erfa-epv00-feasibility/de405/de405.bsp` |
| Publisher / directory | NASA JPL NAIF, generic kernels / planets / `a_old_versions` |
| Retrieval | 2026-07-28 UTC |
| Size / SHA-256 | 10,898,432 B / `30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89` |
| Official checksum verification | NAIF `aa_checksums.txt` MD5 `26d9596d003d6bf3b1c0b33e9567275b`; local MD5 matches |
| Coverage reported by official `brief` | 1950-01-01 00:00:41.183 through 2050-01-01 00:01:04.183 ET |
| Reader | official NAIF CSPICE N0067 MacIntel package, `/tmp/.../de405/cspice/cspice.tar` |
| CSPICE package size / SHA-256 | 112,442,368 B / `c65e72fb7891010d44650cdb6bc1781eb4b37e1017a7a45ab61fd93e266e1785` |
| Architecture and compiler | Apple Silicon arm64 host; Apple clang 21.0.0; x86_64 runner under Rosetta |

The official source-package native build was attempted in `/tmp` but did not
finish within the controlled command window. The official x86_64 N0067 library
was then used through Rosetta; no third-party wrapper, SPK parser, package, or
system installation was used. The minimal runner used `spkez_c`, `J2000`,
`NONE`, and `ET=(JD_TDB-2451545.0)*86400`.

`de405_runner.c` SHA-256 is
`3313aa74a680e8ce4fcec4faa57af8a4e2c7efef60bff366db99cd758e7c1800`;
the x86_64 runner SHA-256 is
`744b1b78330cce3f04a1bcb320a7b52a9d42092a27f1ac78cb5740d89efee282`.
Its 36,525-row JSONL result has SHA-256
`ad21cd8232e6011d1dca29fefb23ccc7dee2346506718c8d21dde91289ae83e1`.

The runner's required internal identities passed across every covered row:
`B405 = A405 + S405` and `C405 = -A405`. Maximum component closure was
`2.9802322387695312e-8 km` for position and
`3.552713678800501e-15 km/s` for velocity, within the `1e-6 km` and
`1e-12 km/s` limits.

### Full-range official JPL candidate investigation

The official JPL SSD distribution supplies `header.405`, 20-year ASCII blocks,
the `asc2eph.f` conversion utility, `testeph.f` reader/test utility, and a
little-endian binary candidate
`/tmp/mallang-erfa-epv00-feasibility/de405/full-range/lnxp1600p2200.405`.
The candidate is 55,900,416 B with SHA-256
`7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7`.

Official JPL `header.405` declares DE405 start JED `2305424.5` (1599-12-09),
end JED `2525008.5` (2201-02-20), 32-day Chebyshev blocks, and Earth/Sun/SSB
constants. Official `testpo.405` identifies the downloaded Linux candidate as
`DE-0405LE-0405` with the same endpoints. The JPL reader contract identifies
Earth as target 3, Sun as 11, and SSB as 12, returning AU and AU/day.

This is provenance and format evidence for a separate full-range candidate,
not evidence that it reproduces the historical NIOSPK SPK. The existing SPK
overlap used the executable official CSPICE reader; no regenerated SPK was
available to compare because A/B/C were incomplete.
No unofficial parser, wrapper, PyPI package, MATLAB, GitHub conversion, or
third-party artifact was substituted. NAIF TOBIN was used only to inspect a
SPICE transfer-format `.xsp` file; it is not a JPL binary ephemeris reader and
does not replace official JPL `testeph.f` validation.

## Residual identity on all DE441 timestamps

For every one of the 73,051 timestamps, the following were evaluated in AU
and AU/day:

```text
R_pvh = ERFA_pvh - DE441_pvh
R_pvb = ERFA_pvb - DE441_pvb
R_sun = (ERFA_pvb - ERFA_pvh) - (DE441_pvb - DE441_pvh)
closure = R_pvb - (R_pvh + R_sun)
```

| Residual vector norm | Mean km | p95 km | p99 km | Maximum km |
| --- | ---: | ---: | ---: | ---: |
| `R_pvh` | 3.651 | 6.579 | 8.295 | 11.823 |
| `R_pvb` | 120.001 | 133.224 | 138.173 | 141.863 |
| `R_sun` | 119.623 | 132.438 | 137.796 | 138.286 |

The identity passes: position component maximum
`1.734723475976807e-18 AU`, velocity component maximum
`1.6940658945086007e-21 AU/day`, and non-finite count 0. These are below
the hard limits `5e-15 AU`, `5e-16 AU/day`, and 0. This proves that the large
barycentric residual is algebraically carried primarily by the SSB-to-Sun
layer, not hidden in the `pvh` residual.

The prior all-range DE441 `pvh` acceptance remains intact: position maximum
11.823 km, velocity maximum 4.848 mm/s, and prior cached angular maximum
0.000004676 degrees. Earth→Sun sign validation remains exact in parsed
Horizons values.

## Direct ERFA-to-DE405 diagnostic (coverage-limited)

ERFA used the official `ERFA_DAU = 149597870.7 km` conversion from
ERFA v2.0.1 `src/erfa.h`; this is also the AU value in the cached Horizons
headers. Statistics below use the 36,525 covered timestamps only.

| Vector | Position mean / p95 / p99 / max (km) | Velocity mean / p95 / p99 / max (mm/s) | Angular p99 / max (deg) |
| --- | --- | --- | --- |
| pvh vs A405 | 3.279 / 6.285 / 8.018 / **11.227** | 0.001230 / 0.002337 / 0.003000 / **0.004998** | 0.000003030 / 0.000004245 |
| pvb vs B405 | 4.017 / 7.653 / 10.059 / **12.215** | 0.001228 / 0.002337 / 0.003000 / **0.004921** | 0.000003709 / 0.000004512 |
| SSB→Sun | 2.191 / 4.133 / 4.803 / 5.186 | 0.000130 / 0.000223 / 0.000256 / 0.000328 | 0.001589 / 0.002582 |
| Earth→Sun | same as pvh | same as pvh | same as pvh |

The selected-artifact gates pass: ERFA vs DE405 `pvh`, `pvb`, and SSB→Sun all
pass for its 1950–2050 coverage (`pvh <=15 km, <=7 mm/s`; `pvb <=20 km,
<=7 mm/s`; SSB→Sun is reported without a new threshold). Their worst position
timestamps are JD TDB `2452683` (pvh) and `2452697` (pvb). This is strong
subset evidence of alignment with DE405, not a substitute for a full
1900–2100 reader validation.

## DE405-to-DE441 descriptive delta (coverage-limited)

| Vector | Position mean / p95 / p99 / max (km) | Velocity mean / p95 / p99 / max (mm/s) | Position angular p99 / max (deg) |
| --- | --- | --- | --- |
| Sun→Earth | 1.090 / 1.474 / 1.577 / 1.627 | 0.000217 / 0.000294 / 0.000314 / 0.000327 | 0.000000605 / 0.000000632 |
| SSB→Earth | 118.833 / 125.734 / 126.648 / 127.134 | 0.000218 / 0.000300 / 0.000317 / 0.000331 | 0.000047736 / 0.000049211 |
| SSB→Sun | 118.841 / 125.711 / 126.692 / 126.907 | 0.000019 / 0.000022 / 0.000024 / 0.000025 | 0.058507 / 0.152856 |
| Earth→Sun | same as Sun→Earth | same as Sun→Earth | same as Sun→Earth |

For the same 1950–2050 subset, the difference between ERFA→DE441 `pvb`
residual and DE405→DE441 barycentric-Earth delta has maximum 12.215 km;
the analogous SSB→Sun remainder has maximum 5.186 km. This supports the
SSB→Sun attribution on covered dates; accordingly
`referenceEphemerisDeltaAttribution: confirmed_for_1950_2050_subset`. It
cannot be promoted to the requested all-range causal conclusion until the
official full-range candidate is executed and validated. The all-range 141.863
km worst residual is at JD TDB `2415620`, outside the selected NAIF artifact
coverage.

## pvh-only extraction and size measurement

The temporary pvh-only source at
`/tmp/mallang-erfa-epv00-feasibility/pvh-only/mallangSolarPvhOnly.mjs` keeps
only the nine `e0/e1/e2` heliocentric arrays, original decimal spelling and
order, loop/summation order, BCRS orientation matrix, velocity, and status
rule. It excludes all SSB→Sun arrays and `pvb` output.

| Check | Result |
| --- | ---: |
| Source SHA-256 | `04f6a8c5e1d511c32e5f375c1fc18519e5020a4816edcbdbe3142260de1a3ac2` |
| Full vs pvh-only samples | 83,338 (including all 73,051 daily) |
| Position / velocity component maximum | 0 AU / 0 AU/day |
| Status mismatches / non-finite | 0 / 0 |
| Bit-identical components | 250,014 / 250,014 position; 250,014 / 250,014 velocity |
| Extraction gate | pass |
| Full / pvh-only source bytes | 120,499 / 81,498 |
| Full / pvh-only coefficient count | 5,853 / 3,969 |
| Full / pvh-only gzip bytes | 42,666 / 29,323 |
| Full / pvh-only Brotli bytes | 31,756 / 22,015 |
| 100,000 evaluations, full / pvh-only | 6,355.794 ms / 4,747.947 ms |
| Sustained full / pvh-only speed | 15,734 / 21,062 evaluations/s |

These are temporary Node 22.20.0 Apple Silicon measurements, not a production
bundle claim. No coefficient, source, binary, cache, or performance artifact
is committed.

## Method, limitations, and repository safety

For every distribution, values are sorted ascending and quantiles use linear
interpolation at index `p*(n-1)`; all reported samples are finite, so the
non-finite exclusion count is zero. The subset-artifact gap is not an
exclusion rule. Full-range DE405 data are already acquired, but official reader
toolchain absence blocks their numerical validation in this temporary
environment.

The research adds no production code, ERFA source or coefficients, DE405
kernel, CSPICE source/binary, Horizons bulk data, package/lock change, runtime
dependency, threshold change, residual correction, or frame transform. It
does not make solar positions available for interpretation.
