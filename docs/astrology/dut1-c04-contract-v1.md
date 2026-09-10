# Astrology DUT1 C04 contract v1

## Decision

The DUT1 provider is closed as an internal, offline, source-bounded provider
for the pinned IERS EOP 20u24 C04 snapshot. It is not a prediction service and
it does not replace the existing time-angle, ephemeris, or activation
contracts. The three time-scale components can be checked as one immutable
bundle, but the bundle remains `publicReleaseAllowed: false` until the data
redistribution terms are independently confirmed.

The implemented provider returns a source-bounded `UT1−UTC` value together
with the source formal-error fields and correction provenance. It does not
turn a formal error into an absolute truth bound. A downstream discrete FACT
or boundary claim must apply its own uncertainty guard and remain blocked when
stability cannot be proved.

## Pinned C04 snapshot

| Field | Fixed value |
|---|---|
| Product | `EOP 20u24 C04 (IAU2000A, dPsi, dEps) 0hUTC - one file (1962-now)` |
| IERS product id | `256` |
| Data URL | `https://datacenter.iers.org/data/256/eopc04_20u24.dPsi_dEps.1962-now.txt` |
| Metadata URL | `https://datacenter.iers.org/versionMetadata.php?filename=latestVersionMeta%2F256_EOP_C04_20u24_dPsi_dEps_62-NOW_IAU2000256.txt` |
| Metadata date | `2026-09-09` |
| Local asset | `api/provider/iers/eopc04_20u24.dPsi_dEps.1962-now.txt` |
| Asset SHA-256 | `24db7a8042c65fa9a94fcd4ac98b0872d775e94134061f8508289cea9d9f95b5` |
| Asset size | `5,168,691` bytes |
| Rows | `23,598` daily rows |
| Coverage | MJD UTC `37665.0` through `61262.0`, inclusive |
| Snapshot cutoff | `2026-08-10T00:00:00Z` |

The snapshot header identifies daily samples at 0h UTC and the `UT1−UTC` and
`UT1−UTC Er` columns. The current source-side endpoint is fixed by the
snapshot's last row; no latest URL, network access, prediction, or local
fixture value is accepted.

## Deterministic calculation path

For an input UTC instant in the snapshot range:

1. Validate a strict UTC ISO-8601 value. `second=60`, malformed dates,
   non-finite values, and dates outside the snapshot fail closed.
2. At an exact C04 0h row, use the row's published `UT1−UTC` value. At a
   non-exact epoch, use the four-point Lagrange window `k−1,k,k+1,k+2` from
   the IERS EOP Product Center `INTERP.F` path.
3. A non-exact endpoint without two rows on each side is blocked. The
   interpolation window must remain within one UTC−TAI history segment;
   windows crossing a UTC offset discontinuity are blocked. There is no
   extrapolation.
4. Add the verified 71-term `PMUT1_OCEANS` correction from `INTERP.F` and the
   11-term axial libration correction from `UTLIBR.F`. The correction order is
   interpolation → ocean tide → axial libration.
5. Return the value in SI seconds, the source nodes/weights, UTC−TAI segment,
   formal-error fields, correction values, and every source/hash reference.

The result is intentionally not an instantaneous “truth” label. It is a
reproducible application of the pinned C04 snapshot and IERS model sources.

## Source and correction identity

| Role | Source identity and locator | SHA-256 |
|---|---|---|
| C04 daily observed/combined series | IERS EOP C04 product 256; data header and daily rows | `24db7a8042c65fa9a94fcd4ac98b0872d775e94134061f8508289cea9d9f95b5` |
| UTC−TAI segment history | IERS `UTC-TAI.history`, 1962 onward segment table | `54e702abdc388ae3bf8cfc5f126900a5277829ad90e80f6773df6e714a133642` |
| Four-point interpolation and ocean terms | IERS EOP Product Center `INTERP.F`, `LAGINT` and `PMUT1_OCEANS`, 71 terms | `9ff5f893ac06c8d4123ec45cecde4df99f18cb2f3b19518bcd7494b6aa35b4e6` |
| Axial libration | IERS Conventions 2010 `UTLIBR.F`, Table 5.1b terms and routine body | `f523335d552ac14b661121a081ad799382312d819853c674bc0102484b5e2406` |
| Fundamental arguments | IERS Conventions 2010 `FUNDARG.F` | `18263cbb1289e222e6ee6e59d52beb343eb77a63ed3212e4f05a4c85d475ae78` |

The official IERS Conventions 2010 software sources retain their original
license text. The Python implementation uses renamed routines and records
the source/difference boundary; it does not claim IERS authorship or
endorsement. The C04 guide and IERS Conventions Chapter 5 directly specify
that daily published EOP omit the diurnal/sub-diurnal ocean contribution and
that the ocean and libration terms are added after interpolation.

## Uncertainty and discrete-Fact boundary

C04's `UT1−UTC Er` is required, finite, and non-negative. It is retained for
the exact source row or every interpolation node. The provider deliberately
does not invent a single interpolated sigma or call the formal error an
absolute bound: the C04 guide explains that formal errors represent internal
precision and are usually not realistic. Therefore:

- missing, non-finite, or negative formal error blocks the provider;
- missing or hash-mismatched correction assets block the provider;
- a provider result may be consumed as a source-bounded DUT1 value with
  uncertainty metadata;
- a downstream sign, angle, aspect, house, or other discrete boundary result
  needs a separate guard; this contract does not silently certify it;
- no existing numeric tolerance, fixture, or fallback was changed.

The official `UTLIBR.F` truncation is recorded as `0.033 microseconds` in
UT1. No stronger total ocean-model or C04 absolute-error guarantee is
asserted.

## Three-component immutable bundle

`api/provider/astrology-time-scale-bundle-v1.json` binds:

- this C04 DUT1 contract and its snapshot/correction assets;
- the existing TT−UTC definition using the pinned UTC−TAI history and
  `TT = TAI + 32.184 s`;
- the existing `tdb-tt-bridge-contract-v1` with its HF2002 source identity and
  two-part JD guarantee.

The bundle requires each component contract, asset hash, coverage, source
identity, and uncertainty state to verify before use. Component hashes need
not be equal across distinct providers; each identity and hash is preserved.

## Release and readiness decision

The technical offline provider path is reproducible and fail-closed for its
declared snapshot and non-discontinuity interpolation windows. Public or
Vercel redistribution is **not** cleared by this commit:

- the C04 data page documents online distribution, but the inspected pinned
  data/readme/metadata did not state an explicit redistribution license;
- `UTC-TAI.history` likewise has no explicit redistribution terms in the
  inspected file;
- IERS Conventions software conditions are present for `UTLIBR.F` and
  `FUNDARG.F`, while the official `INTERP.F` file carries no embedded license
  notice.

Consequently the bundle is `internal_offline_external_review_required` and
arbitrary-date producer promotion remains blocked. The next required action
is written confirmation of the data and EOP Product Center redistribution
terms, followed by the existing producer's independent consumer-level
uncertainty/boundary validation. No activation, semantic interpretation, or
main push is part of this contract.

## Official references

- [IERS EOP C04 product](https://hpiers.obspm.fr/eop-pc/products/combined/C04.html)
- [IERS C04 guide](https://hpiers.obspm.fr/eoppc/eop/eopc04_05/C04.guide.pdf)
- [IERS Conventions 2010 Chapter 5](https://iers-conventions.obspm.fr/content/chapter5/icc5.pdf)
- [IERS `UTLIBR.F`](https://iers-conventions.obspm.fr/content/chapter5/software/UTLIBR.F)
- [IERS `FUNDARG.F`](https://iers-conventions.obspm.fr/content/chapter8/software/FUNDARG.F)
- [IERS Bulletin C product metadata](https://datacenter.iers.org/productMetadata.php?id=16)
