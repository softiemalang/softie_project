# Solar Alternative Model Survey v0

## Purpose and current contract

This survey selects one offline model candidate for a later *temporary*
feasibility validation. It does not implement a production Solar Position Core,
copy an external source file or coefficient array, change an accuracy threshold,
or make astronomy available for interpretation.

```text
solarModelDecisionStatus: provisional
technicalModelStatus: blocked_by_incomplete_de405_diagnosis
runtimeSelectionStatus: not_selected
de405ModelCoverage: 1599-12-09 through 2201-02-20
subsetDe405ArtifactCoverage: 1950-01-01 through 2050-01-01
fullRangeDe405ArtifactStatus: acquired_unvalidated
fullRangeDe405DeclaredCoverage: 1599-12-09 through 2201-02-20
officialDe405ReaderStatus: blocked_by_fortran_compiler_unavailable
de405DirectValidationStatus: blocked_by_official_reader_toolchain_unavailable
referenceEphemerisDeltaAttribution: confirmed_for_1950_2050_subset
algorithmLineage: ERFA v2.0.1 eraEpv00 / SOFA 20231011-derived
adaptationPolicy: controlled_permissive_adaptation
copyrightOwnership: upstream ERFA copyright and BSD-3-Clause terms retained
patentClause: none_explicit
candidateStatus: selected_for_feasibility
productionSelectionStatus: not_selected
availableForInterpretation: false
```

The ERFA reference-delta diagnosis found that the selected official NAIF DE405
artifact covers only 36,525 of the mandatory 73,051 cached dates. Its covered
span supports the SSB→Sun explanation and passes the declared ERFA-vs-DE405
diagnostic gates. The official JPL full-range candidate is acquired with
declared 1599–2201 coverage, but `gfortran`, `flang`, and `f77` are unavailable
for the official JPL reader; numerical full-range validation therefore remains
blocked and the runtime model is not selected.
The previously rejected paths remain rejected: IMCCE VSOP87 distribution rights
are unresolved for this project; JPL Approximate Table 1 EM Bary failed the
predeclared practical p99 criterion; Swiss Ephemeris has an AGPL/commercial
runtime dependency; and NLR SPA's supplied source is internal, noncommercial,
and non-redistributable without a commercial license.

## Candidates and scoring

Scores use the predeclared 100-point weights: rights/commercial use 25,
astronomical accuracy 25, runtime control 15, 1900-2100 range 10,
position/velocity 10, auditability 5, bundle/performance 5, and maintenance 5.
Hard gates override a numeric score.

| Candidate / route | Score | Selection status | Outcome |
| --- | ---: | --- | --- |
| ERFA v2.0.1 `eraEpv00`, controlled JavaScript adaptation | 95 | `selected_for_feasibility` | Single next candidate |
| Direct SOFA EPV00-derived implementation | 82 | `blocked_by_architecture` | Same numerical model; no practical advantage over ERFA BSD route |
| NLR SPA supplied source | 44 | `rejected_by_license` | Explicit noncommercial/no-redistribution terms |
| DE440 full SPICE kernel runtime | 54 | `blocked_by_architecture` | 114 MB kernel plus reader/runtime dependency |
| DE440 Sun/Earth compact coefficient subset | 48 | `blocked_by_rights` | Extraction/repackaging rights not established by the reviewed official pages |
| JPL Approximate Table 1 EM Bary | rejected | `rejected` | Existing practical p99 failure; not reconsidered |
| IMCCE VSOP87 coefficient distribution | blocked | `blocked_by_rights` | Existing individual-authorization burden; not reconsidered |

No Candidate E was added: no additional project met every official-source,
explicit-license, offline-runtime, Earth-vector, velocity, and 1900-2100 gate
without duplicating the ERFA/SOFA numerical lineage.

## ERFA EPV00: selected feasibility candidate

### Identity and technical contract

- Project/release/routine: ERFA v2.0.1, `eraEpv00` (`src/epv00.c`).
- Lineage: simplified VSOP2000 solution, derived with SOFA Board permission.
  ERFA's repository identifies v2.0.1 as corresponding to SOFA Issue
  2023-10-11 apart from documented ERFA additions/bug fixes.
- Input: two-part Julian Date, native TDB. The official preamble states TT can
  be used instead of TDB for most applications; the future feasibility must
  retain the explicit chosen time-scale contract.
- Output: heliocentric Earth position/velocity and barycentric Earth
  position/velocity, in AU and AU/day, oriented with respect to the BCRS.
- Earth identity: the routine explicitly calls its heliocentric arrays
  `Sun-to-Earth` and returns Earth position/velocity, not an `EM Bary` output.
  It exposes no separate Moon contribution. A future Horizons comparison with
  Earth (399), rather than merely an EMB comparison, is required to verify that
  the operational result satisfies the desired geocentric use case.
- Direction: the supplied heliocentric `Sun-to-Earth` vector can be negated to
  form an Earth-to-Sun vector. This is a documented vector-direction operation,
  not an empirical residual correction.
- Frame boundary: BCRS-compatible vectors are not a mean ecliptic/equinox of
  date or tropical longitude. A later, separately validated frame transform is
  still required before zodiac-boundary work.

### Official declared accuracy

The EPV00 preamble reports comparisons with JPL DE405 over 1900-2100:

| Output | Position RMS / maximum | Velocity RMS / maximum |
| --- | --- | --- |
| Heliocentric Earth | 3.7 / 11.2 km | 1.4 / 5.0 mm/s |
| Barycentric Earth | 4.6 / 13.4 km | 1.4 / 4.9 mm/s |

The routine returns a warning outside 1900-2100. Its declared heliocentric
maximum is far below a 0.005-degree angular-scale threshold at roughly 1 AU,
but this is not a substitute for the required 1900-2100 Horizons regression:
the future test must measure final Earth-to-Sun vector, longitude, velocity,
and frame-conversion effects.

### Runtime size and audit facts

Temporary inspection of the official v2.0.1 tag retained no source in the
repository. `epv00.c` is 150,627 bytes and contains 18 coefficient arrays:
5,853 doubles (1,951 harmonic triplets), or 46,824 bytes as raw IEEE-754
doubles before JavaScript representation, minification, and compression.
This is small enough to be a plausible browser candidate, but a later adapted
implementation must measure its actual parsed and gzip bundle size.

Temporary artifact record (retrieved 2026-07-28T10:49:53Z):

| Artifact | Publisher / pinned source | Size | SHA-256 |
| --- | --- | ---: | --- |
| EPV00 source | ERFA v2.0.1 [`src/epv00.c`](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/src/epv00.c) | 150,627 B | `4568b28026cd83800b4a4f66d44f8f3451d7306f1c3fcf7e4cd6bfeb206dde57` |
| License | ERFA v2.0.1 [`LICENSE`](https://raw.githubusercontent.com/liberfa/erfa/v2.0.1/LICENSE) | 2,651 B | `b1858f9a263f22c438a455a32945da51a31a0ae25a21055da13bb7ed57cc3b51` |

The temporary files remain only in `/tmp/mallang-solar-candidate-survey/`.

### Rights record: ERFA route

| Field | Record |
| --- | --- |
| Copyright holder | NumFOCUS Foundation in ERFA source/license; SOFA heritage acknowledged |
| License identifier | BSD-3-Clause terms in ERFA `LICENSE` |
| Official license source | `github.com/liberfa/erfa` `LICENSE`; ERFA is listed by SOFA as a re-licensed implementation |
| Commercial use | Allowed: BSD terms impose no noncommercial limitation |
| Modification | Allowed, subject to retained notices/conditions |
| Source redistribution | Allowed with copyright, conditions, and disclaimer retained |
| Binary/browser redistribution | Allowed with those notices reproduced in accompanying materials |
| Attribution | Retain BSD notices; SOFA-heritage acknowledgement should identify a library *derived from SOFA*, not SOFA itself |
| Endorsement restriction | SOFA Board, IAU, and contributor names cannot endorse/promote derived products without permission |
| Patent clause | No express patent grant identified in the BSD-3-Clause text reviewed |
| Warranty | As-is; warranty and liability disclaimer required |
| Runtime eligibility | `candidate`, only through a controlled Mallang-owned adaptation; no external runtime engine |
| Remaining ambiguity | Future implementation must preserve notices and document all departures; legal review remains appropriate before shipping adapted coefficients |

Required future Mallang notices are: ERFA BSD notice, SOFA heritage statement,
non-endorsement language, pinned upstream tag/checksum, and a description of
Mallang modifications and differences. No notice is added to
`THIRD_PARTY_NOTICES.md` yet because no ERFA material is in the repository.

## Direct SOFA EPV00 route

Direct SOFA EPV00 is the same numerical model, not a second independent
astronomy candidate. SOFA permits commercial use, copying/distribution, and
adaptation, but derived work must identify its SOFA derivation and non-
endorsement, describe differences in source, avoid `iau`/`sofa` name prefixes,
avoid origin misrepresentation/patent claims, and reproduce the requirements
in further source distributions. SOFA also states that modifications are
discouraged because its original distribution is a reference standard.

ERFA has the same SOFA heritage but a BSD-3-Clause redistribution path
specifically designed for mutable open-source distributions. It therefore has
lower notice ambiguity, clearer versioning, and better auditability for a
controlled adaptation. Direct SOFA provides no compensating numerical or
runtime benefit and is not selected.

## Rejected or blocked routes

### NLR SPA

NLR states SPA covers years -2000 through 6000 with +/-0.0003 degree solar
zenith/azimuth uncertainty. Its supplied software notice nevertheless limits
use to internal, noncommercial purposes, prohibits redistribution, requests a
commercial license for commercial use, and requires the notice to be accessible
to end users. It also provides observer-facing solar angles rather than the
required offline Earth vector plus analytic velocity contract. Published
mathematics does not grant redistribution rights to a new runtime
implementation or its coefficient tables.

### DE440 / NAIF compact subset

JPL documents DE440 as a Chebyshev representation of Cartesian positions and
velocities, normally in 32-day intervals, with TDB days; DE440 spans 1550-2650.
NAIF lists `de440.bsp` at 114 MB and `de440s.bsp` at 31 MB. This confirms the
technical quality and explains why a compact Sun/Earth subset is attractive.

However, the reviewed JPL/NAIF/PDS pages establish provenance and availability,
not an explicit permission for Mallang to extract, transform, and redistribute
a new coefficient subset. Full-kernel browser runtime is also outside the
offline no-external-engine architecture. Both routes remain blocked until the
relevant artifact's redistribution and derivative-data rights are established.

## Development policy decision

| Policy | Result |
| --- | --- |
| Strict clean-room only | Preserves the sharpest ownership boundary, but keeps excluding an officially accurate, fully auditable, permissively licensed model and repeats coefficient-rights research. |
| Controlled permissive adaptation | Pins one explicit permissive upstream release, retains required notices, documents differences, contains no runtime dependency, and still requires independent Horizons validation. |

```text
recommendedDevelopmentPolicy: controlled_permissive_adaptation
external_runtime_engine_dependency: false
permissively_licensed_algorithm_lineage: true
Mallang_owned_integration_and_state_contract: true
```

This policy is limited to explicit permissive terms. It does not authorize
unlicensed coefficient copying, ERFA implementation work before a separately
approved feasibility task, or any claim that the model is already selected for
production.

## Final decision and next single task

```text
preferredCandidate: ERFA EPV00 controlled JavaScript adaptation
candidateStatus: selected_for_feasibility
solarCandidateSurveyStatus: completed
```

The only next task is `ready_for_erfa_epv00_feasibility`: create a temporary
JavaScript adaptation outside the repository, compare it with ERFA v2.0.1,
then validate 1900-2100 Earth-to-Sun position and analytic velocity against
Horizons. It must separately measure frame transforms and bundle size, retain
notice design, and leave production implementation, interpretation, and
runtime inclusion out of scope.

The subsequent feasibility and coverage-limited reference-delta results are
recorded in [erfa-epv00-solar-feasibility.md](./erfa-epv00-solar-feasibility.md)
and [erfa-epv00-reference-ephemeris-delta.md](./erfa-epv00-reference-ephemeris-delta.md):
the adaptation conforms to ERFA v2.0.1, but the full mandatory DE405 diagnosis
is `blocked_by_incomplete_de405_diagnosis`.

## Official sources

- IAU SOFA: [current software](https://www.iausofa.org/current-software),
  [terms and conditions](https://www.iausofa.org/terms-and-conditions), and
  [other implementations](https://www.iausofa.org/other-implementations).
- ERFA: [v2.0.1 release](https://github.com/liberfa/erfa/releases/tag/v2.0.1),
  [`LICENSE`](https://github.com/liberfa/erfa/blob/v2.0.1/LICENSE), and
  [`src/epv00.c`](https://github.com/liberfa/erfa/blob/v2.0.1/src/epv00.c).
- NLR: [SPA source page and software notice](https://midcdmz.nlr.gov/spa/).
- JPL SSD: [planetary ephemeris export information](https://ssd.jpl.nasa.gov/planets/eph_export.html)
  and [DE440/DE441 documentation](https://ssd.jpl.nasa.gov/doc/de440_de441.html).
- NAIF: [generic-kernel information](https://naif.jpl.nasa.gov/naif/data_generic.html)
  and [planetary SPK directory](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/).

These sources were used only for this survey. No external source, coefficient,
binary, kernel, package, or network test dependency is included in this
repository.
