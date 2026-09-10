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

After civil-time resolution, the route consumes the immutable offline
`astrology-time-scale-bundle-v1` for `DUT1`, `TT−UTC`, and `TDB−TT`. The
bundle is source-relative and supports only `1962-01-01T00:00:00.000Z` through
`2026-08-10T00:00:00.000Z` inclusive. It verifies the C04 snapshot,
UTC−TAI history, HF2002/IERS/TN36/IAU 2006 B3 bridge, component identities,
and all declared asset hashes before returning time values. No fixture time
value is reused for arbitrary input.

The resulting ET is checked against the immutable DE405 coverage and is then
evaluated by the pinned jplephem/NumPy provider using the existing two-part JD
ABI. The existing raw chart, Rule Core chart, source-relative boundary
assessment, and FACT-only handoff are emitted without semantic interpretation.
The central Rule Core values remain available as source-relative technical
FACTs; the separate boundary assessment remains `indeterminate` when no final
observable interval is supplied.

Requests outside the time-scale snapshot, at a C04 interpolation boundary
without the required neighbour window, across a protected UTC−TAI segment
boundary, outside DE405 coverage, or with any missing/tampered dependency are
blocked. No prediction, extrapolation, implicit offset, or runtime download is
used.

The user-input response schema is
`astrology-jplephem-user-input-handoff-v1`. A complete response contains one
canonical input and the unchanged existing verified response nested as
`verifiedResponse`; it does not duplicate or rewrite the FACT packet. Both the
canonical input and outer response have content hashes. A blocked response
contains no `verifiedResponse` and retains the reason and input-boundary
state.

## Provenance and forbidden behavior

The canonical input retains the location source and coordinate-source hashes,
TZif asset hash and IANA release label, Python runtime identity, time-scale
bundle/component identities, DE405 source identity/SHA, coverage, and
deterministic source references. Missing or changed contract, location source,
timezone asset, time-scale asset, BSP, provider, or packet integrity fails
closed.

The boundary never uses implicit UTC or timezone, coordinates from the caller,
an implicit fold choice, gap adjustment, zero DUT1/TT−UTC, an estimated TDB−TT,
runtime provider download, or out-of-coverage extrapolation. It does not alter
FACT semantics, source authority, interpretation activation, True Node, or
personalization.

## Readiness result

The arbitrary-date technical vertical slice is locally executable and reuses
the verified Linux/Vercel-compatible jplephem producer. Internal technical
FACT readiness is `ready_source_relative` for the stated interval, subject to
the existing local/Linux/Preview parity and fail-closed checks. Public
redistribution of the complete time-scale bundle remains a separate
external-review gate; interpretation activation remains unchanged and
blocked.
