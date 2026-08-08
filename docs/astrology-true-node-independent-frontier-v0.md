# Western True Node independent-oracle frontier v0

기준 checkout: `main` at `9bf27518632e709cf22aa7babc43f277e59f962d`

상태: `partial_western_true_node_independent_oracle_frontier_uncommitted`

## Current result

The repository now contains an isolated experimental candidate and a
deterministic comparison artifact. The candidate is not connected to
production calculation, readiness, interpretation, or activation.

The candidate uses the official JPL DE405 reader's geocentric Moon state and
derives the instantaneous ascending node from the orbital-plane normal:

```text
h = r × v
n_ascending = k × h
longitude = atan2(n_y, n_x)
```

`v` is the inertial velocity expressed in date axes. The moving-date-frame
derivative used for longitude speed is intentionally not used for the physical
orbital-plane normal.

Materialization and checking:

```sh
node scripts/materialize-astrology-true-node-independent.mjs
node scripts/check-astrology-true-node-independent.mjs
```

The output is
`artifacts/astrology-true-node-independent-v0/complete.json`.

## Independence assessment

| Axis | Result | Boundary |
|---|---|---|
| Data source | partial | DE405 and Swiss compressed artifacts are distinct local artifacts, but shared upstream lineage is not disproven |
| Algorithm | independent candidate | cross-product derivation does not call Swiss's node routine |
| Executable/provider | independent | official JPL Fortran reader versus Swiss WASM C build |
| Frozen fixture | deterministic comparison | fixture identity is reproducible evidence, not an independent authority |
| Semantic authority | blocked | the repository does not prove this osculating definition equals Swiss `SE_TRUE_NODE` or an external published True Node definition |

Candidate inventory:

| Candidate | Current role | Independence boundary |
|---|---|---|
| JPL DE405 state-derived node | experimental candidate | independent state reader and node derivation, but semantic authority unproven |
| NAIF `de405.bsp` + CSPICE N0067 | overlap control | DE405-family cross-reference only; not a True Node oracle |
| Swiss `SE_TRUE_NODE` | comparison reference | same-engine regression/reference path, not independent authority |
| Astrolog Matrix `-Yn` | rejected candidate | observed output exists, but `ComputeLunar()` definition/accuracy equivalence is unproven and Swiss/Placalc lineage is not closed |

The correct qualification is therefore
`blocked_semantic_identity_insufficient`. Numeric match is not treated as
independence, and independent implementation is not treated as astronomical
authority.

## Comparison boundary

The materializer compares against Swiss `SE_TRUE_NODE` through the existing
WASM smoke binding, with requested/effective flags checked so Moshier fallback
cannot silently enter the corpus. Differences are cyclic angular differences;
no acceptance tolerance is declared and no tolerance is widened.

The corpus is a deterministic 10-day TDB grid over the repository's DE405
1900–2101 service interval. It uses the repository's periodic TDB−TT fixture
and a fixed synthetic TT−UTC value, so it is suitable for algorithmic
comparison but is not a historical UTC conversion or production readiness
fixture. The artifact preserves each sample's TDB/TT/UT values, JPL record
selection metadata, both longitudes, raw and cyclic differences, and Swiss
effective flags.

The current 7,342-row materialization observed a maximum cyclic difference of
`18.635712528976` arcsec, median `11.664927884066856` arcsec, 95th percentile
`17.304343789919585` arcsec, and minimum `0.005991956140860566` arcsec. The
first non-identical row is the 1900 service-start sample; no raw-vs-cyclic
wrap disagreement occurred. These are descriptive measurements only: there
is no pass/fail tolerance.

The artifact also preserves the worst row (`true-node-01354`, JPL outer
record `3848`, subinterval `0`) and a diagnostic-only argument-shift probe.
Calling the same Swiss `swe_calc_ut` smoke binding with `jdTt` instead of the
canonical `jdUt` argument shifts the Swiss reference by at most
`0.687765504426352` arcsec across the corpus, while the candidate residual
against that shifted reference still reaches `18.805456843938373` arcsec.
This is not a Swiss TT evaluation and is not a convention correction; it is a
mechanical bound showing that this argument shift alone cannot explain the
observed residual. The frame/node-definition boundary remains unresolved.

The exact service-boundary probes are also present: 1900 start, start plus one
second, 2101 exclusive end minus one second, and the exact 2101 exclusive end.
All four evaluated successfully through the JPL reader and Swiss reference
with effective flags `258`.

The local CSPICE DE405 overlap control covers 3,653 Moon-state samples from
the verified 1950–2050 overlap. Its maximum JPL-vs-CSPICE Moon position norm
residual is `6.582017698547343e-8` km, maximum velocity norm residual is
`1.875559235249198e-13` km/s, and the largest induced candidate-node
difference is `1.2278178473934531e-9` arcsec. This isolates the tiny
representation/provider residual from the much larger JPL-derived-candidate
versus Swiss `SE_TRUE_NODE` discrepancy; it does not make CSPICE an
independent True Node authority because both are DE405-family state paths.

The current production relation is explicit: `BODY_ORDER` contains the ten
planetary bodies but not `true_node`; Rule Core lists both `true_node` and
`mean_node` as unsupported. There is therefore no production True Node
numeric result to compare, and the experimental artifact cannot be consumed
by production readiness or activation.

## Repository-wide Western boundary reconciliation

The current source of truth for the calculation boundary is
`src/astrology/astrologyEphemerisCore.js`: it accepts an injected verified
DE405 evaluator, emits ten planetary bodies, and keeps interpretation and
integration blocked. `src/astrology/astrologyRuleCore.js` independently keeps
`true_node` and `mean_node` in `UNSUPPORTED_BODIES`. The legacy
`src/astrology/astrologyContract.js` still describes a Placidus/pending
contract; its existing adapter and readiness documentation explicitly keep
that path separate from the DE405 research-only path, so it was not rewritten
as part of this frontier.

The local Western provider boundary is therefore: JPL DE405 plus its official
reader is the full-range calculation source; CSPICE N0067 is an overlap-only
DE405-family cross-reference; Swiss WASM is a same-engine `SE_TRUE_NODE`
comparison reference; and Astrolog is an unaccepted observation with
definition, accuracy, executable provenance, and licensing boundaries still
open. The existing verified readiness artifacts continue to report blocked
service activation and do not authorize a provider swap.

Some broader inventory artifacts carry older generation markers (for example,
the tri-system inventory document records a historical basis HEAD). They are
not used as current True Node authority: current code, current local runner
identities, and the current True Node artifact above take precedence, while
historical artifact bytes remain unchanged.

## Exact frontier blocker

The remaining blocker is not a numeric tolerance. To qualify an independent
True Node oracle, Flash/user acquisition must provide at least one of:

1. a source-backed, license-usable mathematical definition of geocentric
   tropical lunar True Node, including instantaneous versus smoothed meaning,
   ascending-node convention, time scale, frame/equinox, nutation/aberration,
   and expected accuracy; or
2. an independent executable/data source that directly emits that same defined
   quantity, with source/version, raw machine-readable output, artifact hashes,
   license/deployment terms, and a corpus covering the required date range and
   boundary cases.

The acquired oracle must be compared on identical epochs and conventions. A
Swiss-derived fixture or another wrapper around Swiss does not satisfy this
condition. Until that evidence is acquired, `independentTrueNodeReference`
remains `pending`; no production provider, tolerance, readiness, or activation
change is authorized.
