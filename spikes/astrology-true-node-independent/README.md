# Experimental independent True Node frontier

This spike is isolated from `src/` and is not imported by the product
calculation, readiness, interpretation, or activation paths.

It derives an experimental osculating lunar ascending node from the official
JPL DE405 reader's geocentric Moon state:

1. transform the J2000/ICRF state to the repository's mean ecliptic and
   equinox of date axes;
2. compute the orbital-plane normal `h = r x v` using inertial velocity
   expressed in the date axes;
3. compute the ascending-node direction `k x h`; and
4. normalize its longitude to `[0, 360)`.

The candidate has an independent algorithm and executable/data path from the
Swiss WASM comparison reference, but the repository does not prove that this
osculating definition is identical to Swiss `SE_TRUE_NODE`. It therefore
remains `experimental_not_production`, and numeric agreement is not treated as
independent authority.

## Materialization

The materializer is offline-only and requires the existing local artifacts:

```sh
node scripts/materialize-astrology-true-node-independent.mjs
node scripts/check-astrology-true-node-independent.mjs
```

Defaults use the tracked DE405 JPL binary fixture, the existing local JPL
reader executable, the existing NAIF/CSPICE DE405 overlap artifacts, and the
existing generated Swiss WASM build. Override
`DE405_TRUE_NODE_JPL_RUNNER`, `DE405_TRUE_NODE_JPL_BINARY`,
`DE405_TRUE_NODE_CSPICE_RUNNER`, `DE405_TRUE_NODE_CSPICE_SPK`,
`DE405_TRUE_NODE_SWISS_BUILD`, or `DE405_TRUE_NODE_OUTPUT` when needed.

The comparison corpus is a deterministic 10-day TDB grid over the repository's
1900–2101 DE405 service interval. Swiss is called through the existing
`SE_TRUE_NODE` smoke binding as a regression reference only. The corpus uses
the repository's deterministic periodic TDB−TT model and a fixed synthetic
TT−UTC fixture; it is not a historical time-scale or production readiness
fixture. It also records exact service-start/end probes and a CSPICE overlap
control over the locally covered 1950–2050 interval. CSPICE is a DE405
representation cross-reference, not a second True Node authority.
