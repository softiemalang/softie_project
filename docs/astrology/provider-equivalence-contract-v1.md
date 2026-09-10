# Astrology Provider Equivalence Contract v1

## Scope

This is an offline candidate contract for comparing an alternate technical
provider with the existing CSPICE/DE405 reference fixture. It does not select
a provider, alter the Rule Core, change activation, or authorize production or
interpretation use.

The contract separates two questions:

1. **Implementation parity** — whether two implementations produce the same
   bit stream. An alternate provider does not receive this claim from close
   numbers. Provider provenance hashes and executable hashes are therefore not
   required to be equal, but provider/source identity must remain explicit.
2. **FACT equivalence** — whether the alternate provider preserves the raw
   technical contract closely enough and produces the same downstream
   numerical and discrete FACTs under the existing Rule Core.

The audit found no tracked active provider-equivalence contract that defined
`0.001 km`, `1e-9 km/s`, and `1e-9°` as release guarantees. Those values are
treated as the preceding task-local scratch gate, not as an established
scientific or production requirement. The older JPL-reader/CSPICE overlap
candidate is a separate, rejected candidate and is not silently reused here.

## Independent basis fixed before alternate-provider re-evaluation

The raw ceiling is based on the pre-existing 36,525-row CSPICE/JPL
cross-reference baseline, not on an alternate-provider observation:

The machine-readable baseline is
`test/fixtures/astrology/de405/baseline.json`; the downstream and boundary
bases are the existing `solar-position-contract.md`,
`solar-validation-plan.md`, and Rule Core implementations. The baseline itself
is historical observed evidence, not a mathematical error bound, so the
resulting envelope remains candidate-only.

| Quantity | Existing baseline maximum | Candidate ceiling |
|---|---:|---:|
| Position component | `0.0090330839 km` | `0.01 km` |
| Position norm | `0.0091509078 km` | `0.01 km` |
| Velocity component | `1.8221868e-9 km/s` | `2e-9 km/s` |
| Velocity norm | `1.8229023e-9 km/s` | `2e-9 km/s` |

The angular ceiling `0.01°` is the existing astrology-use tolerance. The
`1/60°` sign and Aspect boundary markers and the `1e-7°/day` motion epsilon
remain the downstream Rule Core boundaries. The `0.02°` Aspect numerical
ceiling is derived as two times the per-body `0.01°` longitude ceiling; it is
not fitted to a comparison result.

The repository explicitly keeps the raw and derived tolerance statuses
provisional and requires more than one scalar threshold for DE405 cross-
reference promotion. Accordingly, this document records a candidate envelope,
not an active production accuracy decision.

## Required equivalence

An alternate provider comparison must use the same declared semantic inputs:

- DE405 source identity and verified coverage;
- UTC/ET and TDB time semantics;
- Earth geocenter observer `399`;
- geometric `NONE` state in `J2000/ICRF`;
- target and barycenter mapping;
- the existing transform and `mallang-astrology-rule-core-v0` contract.

Raw numerical bounds are:

```text
position component max absolute error <= 0.01 km
position norm max absolute error <= 0.01 km
velocity component max absolute error <= 2e-9 km/s
velocity norm max absolute error <= 2e-9 km/s
```

Derived numerical bounds are:

```text
longitude max absolute error <= 0.01°
longitude speed max absolute error <= 1e-7°/day
Aspect angular-distance max absolute error <= 0.02°
Aspect orb max absolute error <= 0.02°
```

Every maximum metric, including both Aspect metrics, is required in a
materialized summary and must be finite and non-negative. Missing metrics,
negative maxima, any discrete/boundary mismatch, or an inconsistent semantic
provenance summary fails closed.

The following are exact, regardless of numerical tolerance:

- body and angle sign, sign index, and `boundaryStatus`;
- direct/retrograde/stationary state and retrograde flag;
- Aspect presence, identity, classification, orb-boundary status, and phase;
- Whole Sign house assignment;
- traditional and modern chart-ruler mapping;
- distribution counts and tie state;
- provider semantic identity and provenance consistency.

Any mismatch fails closed. A `near_sign_boundary` or `near_orb_boundary`
result is preserved and is not promoted to a confirmed boundary-independent
FACT. A motion result at the Rule Core epsilon is likewise not made more
precise by provider agreement.

## What this contract does not do

It does not:

- require equal provider, runner, asset, or provenance hashes;
- convert a numerical match into source authority;
- add True Node, semantic source, personal interpretation, prediction, or
  activation;
- permit a provider to replace the current CSPICE/JPL route;
- waive platform variation, immutable asset, ABI, licensing, or deployment
  checks.

The machine-readable contract and fail-closed summary checker are in
`scripts/lib/astrology-provider-equivalence-contract.mjs`. This contract is
candidate-only until a fresh-process platform matrix, provider packaging, and
the existing release gates independently pass.
