# DE405 Source Role and Coverage Contract v2

## Decision

The service range remains `1900-01-01T00:00:00 TDB` inclusive through
`2101-01-01T00:00:00 TDB` exclusive. The two official DE405 representations
have different execution roles and are never combined into one canonical
JSONL artifact.

| Source | Reader | Role | Coverage role | Canonical eligible |
|---|---|---|---|---|
| JPL `lnxp1600p2200.405` | official JPL `testeph.f` reader | `primary_oracle` | `full_service_range` | full-range only |
| NAIF `de405.bsp` | CSPICE N0067 | `independent_cross_reference` | `overlap_only` | false |

JPL full-range is the only path that can produce a canonical service-range
artifact. The JPL reader pipeline is not implemented in this change and is
fail-closed. Its target/center/time-scale mapping remains explicitly
`unresolved` until the reader contract is confirmed.

## Source provenance

### JPL primary oracle

- File: `lnxp1600p2200.405`
- Size: `55,900,416` bytes
- SHA-256: `7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7`
- Reader source identity: official JPL `testeph.f`
- Recorded reader source SHA-256: `18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120`
- Recorded O2 reader binary SHA-256: `68b620e13ed8c038bc4c5e6d7481d86c0eaeba291147f352e6cbf5f8a60b8d20`
- Source coverage ET: `-1.2624811200000000e+10` through `6.3472464000000000e+09`

The service materialization contract is 7,342 timestamps, 10 targets, and
73,420 rows at an 864,000-second ET step. JPL full-range smoke is one row per
target at `-3.1557168000000000e+09` ET and remains test-only.

The JPL reader target/center/time-scale semantic contract is defined in
[`de405-jpl-official-reader-contract.md`](./de405-jpl-official-reader-contract.md).
Status: `jpl_official_reader_contract_ready`.

### CSPICE overlap cross-reference

- File: `de405.bsp`
- Size: `10,898,432` bytes
- SHA-256: `30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89`
- Toolkit: CSPICE N0067
- Coverage tool: official `spkobj_c` + `spkcov_c`
- Coverage tool output SHA-256: `168991f72cc0253e9843ef130514dd6cd64f632775c41ceae996911ea2597ae1`
- Coverage ET: `-1.5778799588160586e+09` through `1.5778800641839132e+09`
- Readable coverage: `1950-01-01 00:00:41.183 ET` through `2050-01-01 00:01:04.183 ET`

The only implemented CSPICE materialization profile is
`cspice-overlap-smoke`: ET `0.0000000000000000e+00`, 10 targets, 10 rows.
Coverage is verified in the Node layer before `spkez_c` is called. Coverage
failure never invokes the JPL reader.

## Profiles and manifest rules

- `jpl-full-range-regular-grid`: `primary_oracle`, `full_service_range`,
  `canonicalEligible: true`, `canonical: true`, `testOnly: false`.
- `jpl-full-range-smoke`: `primary_oracle`, `full_service_range`,
  `canonicalEligible: false`, `canonical: false`, `testOnly: true`.
- `cspice-overlap-smoke`: `independent_cross_reference`, `overlap_only`,
  `canonicalEligible: false`, `canonical: false`, `testOnly: true`,
  `evidenceType: overlap_smoke`.

Every manifest records `sourceRole`, `coverageRole`, `canonicalEligible`,
`evidenceType`, source and requested ET bounds, readable coverage bounds,
coverage tool/version/command, coverage output hash, `coverageVerified`, and
`fallbackAllowed: false`.
Missing coverage metadata, source hash/size mismatch, role mismatch, or
`canonical: true` on the CSPICE profile is a validator failure.

The CSPICE generator accepts only `cspice-overlap-smoke`. A JPL profile fails
with `jpl_official_reader_not_implemented`; it does not fall back to CSPICE.
No profile may mix source rows or promote overlap evidence to production.

## Shared row contract

The existing target order and row semantics remain unchanged: target IDs
`1, 2, 4, 5, 6, 7, 8, 9` are barycenters and `10, 301` are bodies; observer
is Earth `399`; frame is `J2000`; aberration correction is `NONE`; units are
km and km/s; values use decimal `%.16e` strings with LF and a trailing LF.

Legacy converted-SPK evidence remains `provenance_incomplete` and
`canonical: false`. Production/runtime selection remains blocked.
