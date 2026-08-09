# Western True Node independent-oracle frontier v2

Access date: 2026-08-09 (Asia/Seoul). This is a research/evidence ledger, not
a production, readiness, interpretation, or activation decision.

Status: `partial_western_true_node_independent_oracle_frontier_advanced_uncommitted`

## Result

The frontier now has a bounded, raw public-oracle corpus at
`artifacts/astrology-true-node-horizons-erfa-v1/complete.json` with the raw
Horizons responses beside it. The materializer and checker are:

```sh
DE405_TRUE_NODE_HORIZONS_VECTORS_RAW_INPUT=/path/to/vectors.json \
DE405_TRUE_NODE_HORIZONS_ELEMENTS_RAW_INPUT=/path/to/elements.json \
node scripts/materialize-astrology-true-node-horizons-erfa-v1.mjs
node scripts/check-astrology-true-node-horizons-erfa-v1.mjs
```

Without raw-input variables, the materializer makes a public read-only
Horizons request using `curl --insecure`. That transport detail is preserved
as `tlsVerification: disabled_explicitly_for_local_certificate_chain`; no
credential or secret was used. Re-running with the same raw bytes produced
byte-identical raw files and canonical artifact bytes.

## Primary definitions and source inspection

The official Swiss Ephemeris documentation describes the traditional lunar
True Node as the osculating node of the Moon's momentary orbit and distinguishes
the ecliptic plane from a momentary solar plane. The pinned official source
(`aloistr/swisseph` commit
`59ac051b5a5812c684973ca0fcedb1c8c3e9c5dc`) was read locally at the relevant
implementation points:

| Question | Observation | Admission |
|---|---|---|
| Node geometry | `lunar_osc_elem` uses the geocentric Moon position and velocity. Its tangent/ecliptic-plane intersection is algebraically direction-equivalent to `k × (r × v)` when the z velocity is nonzero. | Direct source observation plus deterministic derivation; semantic identity still unresolved. |
| Light-time | Unless `SEFLG_TRUEPOS` is set, Swiss applies a Moon light-time correction before the osculating element calculation. The source comment describes the node effect as milliarcsecond-scale. | Direct source observation; insufficient alone to explain the former multi-arcsecond residual. |
| Date frame | `swi_plan_for_osc_elem` precesses to equator of date, applies the ecliptic transform, and applies nutation unless `SEFLG_NONUT` is set. | Direct source observation. |
| Default precession/obliquity | The default model is Vondrák et al. 2011 (`SEMOD_PREC_DEFAULT=SEMOD_PREC_VONDRAK_2011`), including `swi_ldp_peps` for mean obliquity. | Direct source observation; a major remaining frame hypothesis, not an oracle. |
| Horizons meaning | Horizons `ELEMENTS` returned geometric osculating elements with `OM` in the ecliptic of J2000.0; `VECTORS` returned geometric ICRF state vectors with `VEC_CORR=NONE`. Both used JDTDB. | Direct raw public observation; same-family JPL corroboration only. |
| ERFA meaning | ERFA `moon98` is an analytic GCRS Moon state path derived from SOFA/Meeus-style series, not a direct True Node provider. | Independent algorithmic negative control; not high-precision authority. |

Primary references: [Swiss Ephemeris node documentation](https://www.astro.com/swisseph-download/doc/swisseph.pdf), [Swiss Ephemeris Programmer's Manual](https://www.astro.com/swisseph/swephprg.pdf), [official Swiss source](https://github.com/aloistr/swisseph), [Horizons API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html), [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html), and [ERFA `moon98.c`](https://raw.githubusercontent.com/liberfa/erfa/master/src/moon98.c).

## Hypothesis cycle

| Hypothesis | Experiment | Result and boundary |
|---|---|---|
| Candidate node geometry is fundamentally different | Read `lunar_osc_elem`; compare its intersection construction with `k × (r × v)`. | Falsified as a simple algebraic explanation. This does not prove all frame, light-time, or state-construction semantics equal. |
| TT/UT argument mismatch explains the residual | Existing 7,342-row argument-shift probe. | Insufficient: max Swiss shift `0.687765504426352"`, while the inherited default residual reaches `18.635712528976"`. |
| Nutation/equinox mismatch explains the large residual | Existing 7,342-row `SEFLG_NONUT` mean-equinox comparison. | Major contributor: maximum falls to `1.8031521231023362"`; no semantic or tolerance pass. |
| Swiss's default Vondrák-2011 date frame remains relevant | Read the pinned source and run an eight-row DE441 state diagnostic with a local Vondrák reconstruction. | Supported as a remaining frame hypothesis, not uniformly complete. The observed Vondrák residuals against Swiss 322 were `0.053806, 0.821009, 0.102278, 0.242158, 0.010249, 0.092844, 0.153636, 0.044712"` for sample IDs `00000, 00440, 01354, 02367, 03670, 05000, 06000, 07341`. The corresponding repository IAU-2006 values were `0.752434, 0.712125, 0.094959, 0.179154, 0.140617, 0.429545, 0.510280, 0.955566"`. This was a bounded source inspection/diagnostic observation, not a promoted implementation. |
| Light-time explains the remaining residual alone | Read Swiss `lunar_osc_elem` source comments and retain the default geometric candidate. | Insufficient alone at the documented milliarcsecond scale; exact `TRUEPOS`/light-time equivalence remains a future controlled diagnostic, not a tolerance adjustment. |
| A distinct public JPL raw oracle resolves authority | Query Horizons `VECTORS` and `ELEMENTS` for eight inherited epochs from 1900-2101. | Raw material acquired. DE441 is a different service/data version from local DE405 but remains same JPL DE-family corroboration, not independent authority. |
| A separate analytic implementation supplies an independent check | Run PyERFA 2.0.1.5 `erfa.moon98` and derive the same experimental node. | Independent executable/model path, but low precision: maximum difference from Swiss 322 is `28.92438340040826"`. Negative control only. |

## Raw corpus comparison

The artifact has eight points, including the interval boundaries and the prior
DE405 residual samples. The Horizons J2000 `OM` agrees with the node derived
from the returned vector to a maximum of `4.092726157978177e-10"`, confirming
the two raw Horizons outputs are internally consistent under their published
J2000 ecliptic convention.

| Comparison | Max absolute difference | Interpretation |
|---|---:|---|
| Local DE405 candidate vs Swiss mean-equinox/no-nutation | `0.9555656965858361"` on this eight-row subset | Inherited same-family/local diagnostic subset. |
| Horizons DE441 vector-derived date candidate vs Swiss | `1.0702176164159027"` | Distinct public JPL path does not collapse the residual to zero; no authority claim. |
| Horizons DE441 vector-derived candidate vs local DE405 candidate | `0.11465191983006662"` | DE405/DE441 family/provider difference is small on this subset. |
| ERFA Moon98 candidate vs Swiss | `28.92438340040826"` | Independent analytic path is a useful negative control, not a precision oracle. |

These are descriptive values with
`diagnostic_only_no_tolerance_pass`. No offset, fitted tolerance, fallback, or
semantic alias was added.

## Independence and readiness decision

| Candidate | Admission | Why it is not authority |
|---|---|---|
| Swiss `SE_TRUE_NODE` | Comparison reference | It is the quantity being explained in this local path. |
| Local JPL DE405 state-derived node | Experimental independent algorithm/path | Definition, frame, and provider authority are not established. |
| NASA/JPL Horizons DE441 raw vectors/elements | `same_family_corroboration` | Distinct public service and raw formats, but DE441 and DE405 share the JPL DE family; Horizons does not directly publish the product's exact tropical/date True Node quantity. |
| ERFA/SOFA `moon98` | `independent_analytic_negative_control` | Separate code/data model, but official accuracy notes make it unsuitable for a high-precision True Node oracle. |

The product boundary is unchanged: `true_node` and `mean_node` remain
unsupported in Rule Core; the DE405 ephemeris body order remains the existing
ten bodies; `independentTrueNodeReference` remains `pending`; production,
readiness, interpretation, activation, and tolerance are unchanged.

## Western reassessment after the True Node cycle

The neighboring Western correctness surface was checked before stopping the
goal. The current evidence ledger already admits JPL Horizons for planetary and
Moon state reference, and Astrolog 8.00 Matrix-only for ASC, MC, and ordinary
Placidus cusp source/provenance, with explicit high-latitude fallback blocking.
Those are separate source claims and were not promoted by the True Node work.

No new independently actionable Western numerical blocker was found in that
reassessment. The remaining blockers are external or policy-bound: the Swiss
license/browser-asset decision, a TLS-verified and preferably full-corpus raw
Horizons acquisition path if it is needed as a long-term witness, and human
approval for any production activation. Continuing to sample the same DE family
without closing those boundaries would not increase correctness or evidence
strength.

## Remaining frontier and external dependencies

The local/public frontier is advanced but not semantically closed. The next
non-busywork gain requires one of:

1. an independently reviewable high-precision implementation or dataset that
   explicitly defines the same geocentric tropical True Node quantity,
   including state construction, instantaneous/osculating convention, frame,
   equinox, nutation, aberration/light-time, and time scale; or
2. a reproducible, TLS-verified raw acquisition path plus a full Horizons
   corpus and exact convention bridge, followed by independent adjudication of
   whether its osculating `OM` is the product's intended semantic quantity.

Swiss source redistribution/license packaging and any production activation
decision remain separate human/product dependencies. Additional numeric
sampling without closing those definition and independence gaps would be
busywork, so no production change is proposed.
