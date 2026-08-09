# Western True Node independent-oracle frontier v3

Access date: 2026-08-09 (Asia/Seoul). This is a research/evidence ledger, not
a production, readiness, interpretation, licensing, or activation decision.

Status: `partial_western_true_node_semantic_residual_frontier_advanced_uncommitted`

## Expanded public corpus

The preserved v1 artifact remains the historical eight-row witness. The v2
artifact adds 134 deterministic rows spanning the inherited 1900-2101 DE405
service interval. It retains all eight historical indices and adds an evenly
spaced interval sample. Horizons `VECTORS` and `ELEMENTS` were acquired as
three sequential chunks of 64, 64, and 6 rows per type after an initial
single-list attempt returned only 80 rows; the truncated initial response is
not admitted into the v2 comparison. The admitted raw responses are kept
beside the canonical artifact with per-file byte size and SHA-256 identity.

```sh
DE405_TRUE_NODE_HORIZONS_OUTPUT=artifacts/astrology-true-node-horizons-erfa-v2/complete.json \
DE405_TRUE_NODE_HORIZONS_EXPECTED_SCHEMA=astrology-true-node-horizons-erfa-frontier-v2 \
node scripts/check-astrology-true-node-horizons-erfa-v1.mjs
```

Horizons was queried for geocentric Moon (301) relative to Earth (399),
JDTDB, geometric ICRF state vectors with `VEC_CORR=NONE`, and geometric
osculating elements in the J2000 ecliptic. The API documentation permits
discrete `TLIST` epochs, identifies vector `VEC_CORR=NONE` as geometric, and
documents `TIME_TYPE=TDB` for vector/element queries. These are direct public
interface observations, not an independent semantic True Node output.

## Expanded residual results

All results are descriptive and retain
`diagnostic_only_no_tolerance_pass`.

| Comparison | 134-row maximum | Admission |
|---|---:|---|
| Horizons J2000 `OM` vs vector-derived J2000 node | `8.185452315956354e-10"` | Raw Horizons internal consistency only |
| Horizons DE441 date candidate vs Swiss mean-equinox/no-nutation | `1.6422761457306478"` | Same-family corroboration plus deterministic derivation |
| Horizons DE441 date candidate vs Swiss default true-equinox/nutation | `18.677608743473684"` | Frame-convention comparison; not the product target frame |
| Horizons DE441 date candidate vs local DE405 date candidate | `0.11627137882896932"` | DE405/DE441 same-family state corroboration |
| ERFA `moon98` date candidate vs Swiss mean-equinox/no-nutation | `72.20445804505289"` | Independent analytic negative control, not a precision oracle |

The expanded corpus changes the worst mean-frame residual from the historical
eight-row `1.0702"` to `1.6423"`; it does not collapse the residual or justify
a tolerance. The DE441/local-DE405 state difference remains two orders of
magnitude below the default Swiss comparison residual, so ephemeris-family
state drift is not a sufficient explanation.

## Bounded hypotheses

| Hypothesis | Experiment | Result |
|---|---|---|
| Node geometry differs algebraically | Swiss source inspection of `lunar_osc_elem` and cross-product derivation | Simple tangent/intersection geometry is direction-equivalent under the stated non-degenerate condition; full semantic identity remains unresolved. |
| TT/UT argument mismatch | Preserved 7,342-row argument-shift probe | Maximum Swiss shift `0.687765504426352"`, below the former `18.6357"` residual; insufficient. |
| Nutation/equinox mismatch | Preserved 7,342-row `SEFLG_NONUT` comparison | Maximum fell from `18.635712528976"` to `1.8031521231023362"`; major contributor, not a correctness pass. |
| Swiss Vondrák-2011 date frame | Pinned Swiss source inspection plus the prior bounded eight-row local reconstruction | Remains a supported frame hypothesis; the experiment was not uniformly zero and has not been promoted into production transform code. |
| Swiss light-time correction | New 134-row `SE_TRUE_NODE` comparison with flags `322` and `338` (`SEFLG_TRUEPOS`) | Same-engine flag effect max `0.014527895200444618"`; candidate residual max changes `1.6422761457306478"` to `1.6396008296851505"`; insufficient alone. |

The light-time artifact records Swiss effective flags `322` and `1874`.
`1874` contains the requested true-position bits plus Swiss's derived
no-aberration/no-deflection bits; it is not treated as an exact integer echo
of the request.

Swiss's official source dispatches `SE_TRUE_NODE` through the lunar osculating
element path and documents geometric/apparent and mean/true-equinox flag
boundaries. That is direct source evidence about Swiss semantics, not an
independent oracle for the quantity being explained. The expanded Horizons
corpus likewise confirms raw JPL behavior but remains same-family
corroboration because local DE405 and public DE441 share JPL DE lineage.

## Independence and authority

| Candidate | Current classification | Boundary |
|---|---|---|
| Swiss `SE_TRUE_NODE` | comparison reference | The local experiment is explaining this result; Swiss source is not independent of that target. |
| Local DE405 state-derived node | independent algorithm/path candidate | State reader and cross-product path are distinct from Swiss, but semantic authority is unproven. |
| NASA/JPL Horizons DE441 vectors/elements | `same_family_corroboration` | Distinct endpoint and raw products, but shared JPL DE family and no direct tropical/date True Node field. |
| ERFA/SOFA `moon98` | `independent_analytic_negative_control` | Separate code/data path, but expanded residuals are tens of arcseconds and the API is not a True Node provider. |
| Astronomy Engine | rejected as high-precision node oracle | Official project scope advertises Moon vectors/events and approximately ±1 arcminute accuracy; its public node API is event-time search, not the required instantaneous tropical/date longitude. |

No candidate satisfies both independent implementation/data provenance and an
explicit, reviewable definition of the product's geocentric tropical
instantaneous True Node. `independentTrueNodeReference` therefore remains
`pending`; semantic authority, readiness, interpretation, and activation stay
blocked.

## Implemented evidence boundary

The materializer/checker now supports an explicit sample selection and
sequential raw-response chunks while keeping the historical v1 corpus intact.
The new light-time materializer/checker records the exact Swiss flag
comparison, effective flags, source artifact hashes, input artifact hash, and
canonical payload hash. No production body order, Rule Core support, provider,
tolerance, readiness, or activation path was changed.

The next non-busywork gain requires an external, independently reviewable
high-precision implementation or dataset that directly defines the same
quantity, or an independent adjudication that formally bridges Horizons/JPL
osculating `OM` to the product's tropical/equinox-of-date True Node semantics.
Additional sampling within the same JPL family without that bridge would not
increase authority.
