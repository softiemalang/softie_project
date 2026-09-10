# TDB−TT bridge contract v1

## Decision

The bridge is a source-bounded technical component only. It accepts a
midnight-normalized two-part `JD(TT)` and returns geocentric `TDB−TT` in SI
seconds. It does not change the dated user-input contract, the DE405 provider
contract, output tolerances, activation, or semantic interpretation.

The path is:

```text
HF2002_IERS.F (TCB−TCG at geocenter)
  → IERS TN36 Eq. 10.1 (TCG−TT)
  → IERS TN36 Eq. 10.5 geocenter composition
  → IAU 2006 B3 / TN36 Eq. 10.3 (TCB→TDB)
  → TDB−TT
```

`HF2002_IERS.F` is read as a pinned source asset and its byte length and
SHA-256 are checked on every calculation. The Python routine has a new name;
the original source, including the intact IERS software license, remains
beside the derived implementation. No runtime download, zero value, `TT≈TDB`
proxy, or simple sinusoid is available.

## Fixed quantities

| Quantity | Contract value | Source locator |
|---|---:|---|
| `LG` | `6.969290134e−10` | IERS Chapter 1 Table 1.1; TN36 Eq. 10.1 |
| `LC` | `1.48082686741e−8` | IERS Chapter 1 Table 1.1; TN36 Eq. 10.5 |
| `LB` | `1.550519768e−8` | IERS Chapter 1 Table 1.1; TN36 Eq. 10.3 |
| `TDB0` | `−6.55e−5 s` | IERS Chapter 1 Table 1.1; TN36 Eq. 10.3 |
| `T0` | `2443144.5003725` | TN36 Eq. 10.1 and Eq. 10.5 |
| linear correction | `1.15e−16 × (TT−T0)` | HF2002_IERS.F lines 112–115, 755; TN36 §10.1 |
| day | `86400 s` | Julian-day unit in the source equations |

The source declares the HF2002 coefficients in microseconds, radians, and
radians per Julian millennium since J2000. The derived implementation parses
those values as binary64, performs the source arithmetic with
`math.sin`/`math.cos`, and returns seconds. The runtime guard requires an
IEEE-754 binary64-compatible CPython float (`radix=2`, 53-bit significand,
`max_exp=1024`).

## Two-part time ABI

The jplephem producer now calls
`compute_and_differentiate(tdb1, tdb2)` on every SPK segment. ET seconds are
split using an exact integer-day primary near the requested epoch and a
fractional-day secondary in `[0,1)`. The producer checks a conservative
binary64 conversion bound against the existing `1.770977 μs` time budget.
There is no one-part call path.

This representation bound is distinct from the provider-equivalence raw and
derived tolerances. It is a representation guarantee, not a relaxation of
any provider threshold. The two-part split is tested at the model interval
endpoints and across the existing DE405 fixture ET values. The test also
checks the interval-wide binary64 upper bound: the largest ET ULP at either
model endpoint plus the largest possible fractional-day secondary ULP is
`0.9536791126 μs`, below the fixed budget.

## Evidence and boundaries

The official `XHF2002_IERS.F` driver vectors (1600–2200) are preserved in
`api/provider/hf2002-iers-test-vectors-v1.json`. The expected HF values are
the source's `TCB−TCG` vectors. The accompanying bridge values are explicitly
derived by applying the fixed equations; they are not copied from the old
DE405 fixture's `TDB−TT` field.

The source reports an HF2002 fit RMS of `0.453 ns` and maximum error of
`2.248 ns` against TE405 over 1600–2200. This is model accuracy information,
not a claim that the current user-input provider contract covers all of that
interval. The existing dated provider/UTC/DUT1 contract remains the authority
for arbitrary user input; a bridge value alone does not open that producer.

Missing or altered source, non-finite input, a non-normalized pair, outside
model coverage, and non-binary64 runtime all fail closed. A bridge PASS closes
only the TDB−TT computation and the two-part jplephem input representation;
it does not advance DUT1, leap-second snapshot, provider-bundle, production,
activation, True Node, or semantic gates.

Official references:

- [IERS Technical Note 36, Chapter 10](https://iers-conventions.obspm.fr/content/chapter10/tn36_c10.pdf), §10.1, Eqs. 10.1–10.5.
- [IERS numerical standards](https://iers-conventions.obspm.fr/content/chapter1/icc1.pdf), Table 1.1.
- [Pinned HF2002_IERS.F source](https://iers-conventions.obspm.fr/content/chapter10/software/HF2002_IERS.F).
