# Astrology Ephemeris Core v0 (research-only)

This document records the unconnected research core added for `astrology-raw-chart-v0`.
It is not a production or interpretation activation contract.

## Model

- Input: proleptic-Gregorian UTC, explicit `UT1-UTC`, explicit `TT-UTC`, explicit
  `TDB-TT`, observer longitude/latitude, and a DE405 kernel.
- Ephemeris time: `ET = (JD(TT) - 2451545.0) * 86400 + (TDB-TT)`.
  `TDB-TT` is never silently treated as zero; the adapter rejects it when absent.
- State source: the verified DE405 canonical-v2 evaluator only.
- State semantics: geometric, geocentric, J2000/ICRF equatorial state, `NONE`
  aberration, km and km/s, observer 399 (Earth).
- Target mapping: `1,2,4,5,6,7,8,9` are Mercury through Pluto system
  barycenters; `10` is Sun; `301` is Moon. The canonical evaluator's Earth
  center chain is retained by the evaluator's target/observer query and is
  recorded in provenance. No body state is synthesized in JavaScript.
- Coordinate conversion: IAU 2006 Fukushima-Williams mean precession angles
  followed by the Time & Angle Core's IAU 2006 mean obliquity rotation to mean
  ecliptic/equinox of date. Nutation, aberration, light-time, topocentric
  parallax, and refraction are excluded.
- Longitude speed: instantaneous state-vector projection,
  `lambda_dot = (x * vy - y * vx) / (x^2 + y^2)`, converted from radians/second
  to degrees/day. No finite-difference step or wrap correction is used.

## Status boundaries

The raw composer and Rule Core adapter are always marked
`availableForInterpretation: false` and `integrationStatus: not_connected`.
Missing evaluator/kernel, missing time offsets, unverified selection evidence,
invalid state, and coverage failures return a blocked result. The legacy
date-seed simulation resolver and service/Prep paths are not imported.

The current repository contract treats CSPICE N0067 `de405.bsp` as an
overlap-only independent cross-reference (approximately 1950-2050), while the
full-range official JPL reader remains a separate canonical production path.
The Node adapter therefore remains research-only and does not promote the
CSPICE overlap profile to service canonical status.

## Validation boundary

The offline regression fixture uses captured DE405 canonical-v2 state rows and
checks deterministic body ordering, fail-closed behavior, raw chart material
identity, and Rule Core order independence. The live adapter was also exercised
against the hash-verified local kernel at J2000 (10/10 `verified` state rows;
Rule Core consumed 10 bodies; ASC/MC were available).

Independent IAU SOFA/ERFA `pmat06` + `obl06` fixture comparison is recorded as
a candidate envelope: the three transform fixtures' observed maximum longitude
error is approximately `2.03e-6 degree` (worst:
`sofa_pmat06_future`); the maximum speed error is approximately
`2.71e-11 degree/day`. The captured DE405 Sun end-to-end fixture is within
`1e-9 degree` and `1e-12 degree/day`. These are validation-candidate bounds
only; they do not activate service or interpretation use.
