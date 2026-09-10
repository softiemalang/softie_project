# Astrology user-input normalization contract v1

This is a strict input boundary for the CSPICE-free jplephem producer. It
accepts a selected verified Korean 시·군·구 and a structured local civil time;
it does not accept user-supplied UTC, timezone, latitude, longitude, offsets,
or provider identity.

## Contract

The request schema is `astrology-jplephem-user-input-request-v1`:

```json
{
  "schemaVersion": "astrology-jplephem-user-input-request-v1",
  "userInput": {
    "localDateTime": {"year": 2000, "month": 1, "day": 1, "hour": 21, "minute": 0, "second": 0},
    "locationId": "sgg:41210",
    "fold": null
  }
}
```

The location ID is resolved from the existing 252-row verified administrative
snapshot. The resulting coordinates are labeled
`administrative_area_representative_point`; they are calculation coordinates,
not an exact street address. The timezone is derived from that location and is
fixed to `Asia/Seoul` within this supported Korea-only scope.

Civil-time resolution reads the pinned `Asia/Seoul` TZif asset and round-trips
both fold values. An exact local time yields one UTC candidate. A DST gap yields
no candidate and is rejected. An overlap preserves both candidates and requires
an explicit `fold` of `0` or `1`; no earlier/later or compatible fallback is
chosen.

## Verified handoff boundary

The current verified time-scale evidence is intentionally only the existing
provider-equivalence fixture. A normalized UTC instant can reach the existing
packet producer only when it exactly matches one of that fixture's UTC rows.
That preserves the already verified `UT1−UTC`, `TT−UTC`, and `TDB−TT` values,
DE405 coverage, raw chart, Rule Core chart, and FACT-only handoff without
estimating or substituting a time-scale value.

For any other exact local time, the response contains a `blocked` canonical
input with `time_scale_evidence_unavailable`. It does not emit a packet. This
is the current production blocker for arbitrary-date input: a pinned,
source-identified time-scale provider covering the required dates is not yet
part of the verified bundle. DE405 coverage is checked only after exact
time-scale materialization; out-of-coverage requests remain blocked and are
never extrapolated.

The user-input response schema is
`astrology-jplephem-user-input-handoff-v1`. A complete response contains one
canonical input and the unchanged existing verified response nested as
`verifiedResponse`; it does not duplicate or rewrite the FACT packet. Both the
canonical input and outer response have content hashes. A blocked response
contains no `verifiedResponse` and retains the reason and input-boundary
state.

## Provenance and forbidden behavior

The canonical input retains the location source and coordinate-source hashes,
TZif asset hash and IANA release label, exact Python runtime identity, fixture
time-scale references, DE405 source identity/SHA, coverage, and deterministic
source references. Missing or changed contract, location source, timezone
asset, fixture, BSP, provider, or packet integrity fails closed.

The boundary never uses implicit UTC or timezone, coordinates from the caller,
an implicit fold choice, gap adjustment, zero DUT1/TT−UTC, an estimated TDB−TT,
runtime provider download, or out-of-coverage extrapolation. It does not alter
FACT semantics, source authority, interpretation activation, True Node, or
personalization.

## Readiness result

The exact fixture-date vertical slice is locally executable and can be tested
in a Linux Vercel Preview. Astrology technical FACT production readiness for
arbitrary user dates remains `NO-GO` until the time-scale provider closes the
date/range evidence boundary and the same local/Linux/Preview parity checks
are rerun for that range.
