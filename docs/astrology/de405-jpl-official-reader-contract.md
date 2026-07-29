# DE405 JPL Official Reader Contract

## 1. Purpose

This document defines the complete semantic contract between the canonical
DE405 v2 pipeline and the official JPL ephemeris reader (`testeph.f`). Every
claim is grounded in the official JPL source code and documentation, not in
external libraries or informal sources.

This contract resolves the `targetContractStatus: "unresolved"` recorded in the
existing manifest template and canonical v2 contract.

---

## 2. Official Sources Used

| Source | URL / Path | Role |
|---|---|---|
| `testeph.f` | `https://ssd.jpl.nasa.gov/ftp/eph/planets/fortran/testeph.f` | Official reader source |
| `userguide.txt` | `https://ssd.jpl.nasa.gov/ftp/eph/planets/fortran/userguide.txt` | Official user guide |
| `ascii_format.txt` | `https://ssd.jpl.nasa.gov/ftp/eph/planets/ascii/ascii_format.txt` | Official format spec |
| `eph_export.html` | `https://ssd.jpl.nasa.gov/planets/eph_export.html` | Official ephemeris overview |
| `lnxp1600p2200.405` | JPL SSD Linux binary distribution | DE405 binary |

---

## 3. Reader Identity

| Field | Value |
|---|---|
| Source file | `testeph.f` |
| Source URL | `https://ssd.jpl.nasa.gov/ftp/eph/planets/fortran/testeph.f` |
| Source last modified | `2019-03-29` (server date) |
| Source SHA-256 | `18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120` |
| Binary SHA-256 (O2, gfortran) | `68b620e13ed8c038bc4c5e6d7481d86c0eaeba291147f352e6cbf5f8a60b8d20` |
| Language | Fortran 77 |
| Version string in source | `March 25, 2013` (version comment); `March 2013` (fingerprint) |
| License | Caltech/JPL/NASA public domain (see source header) |
| Entry points | `PLEPH`, `DPLEPH`, `CONST`, `STATE`, `INTERP`, `SPLIT` |
| Platform config | `NRECL` (1 or 4), `KSIZE` (2036 for DE405), `FSIZER1`/`FSIZER2`/`FSIZER3` |
| Binary file name | `JPLEPH` (hardcoded default, user-configurable) |

---

## 4. Public API Contract

### 4.1 PLEPH — Primary entry point

```fortran
SUBROUTINE PLEPH ( ET, NTARG, NCENT, RRD )
```

| Argument | Type | Meaning |
|---|---|---|
| `ET` | `DOUBLE PRECISION` | Julian Ephemeris Date (JED) at which interpolation is wanted |
| `NTARG` | `INTEGER` | Target body number (see §5) |
| `NCENT` | `INTEGER` | Center body number (same numbering as NTARG) |
| `RRD(6)` | `DOUBLE PRECISION` | Output: position (1-3) and velocity (4-6) of NTARG relative to NCENT |

**Source reference**: `testeph.f` lines 434–640 (PLEPH subroutine).

### 4.2 DPLEPH — Two-part time entry point

```fortran
ENTRY DPLEPH ( ET2Z, NTARG, NCENT, RRD )
```

| Argument | Type | Meaning |
|---|---|---|
| `ET2Z(2)` | `DOUBLE PRECISION` | Two-part JED: `ET2Z(1) + ET2Z(2)` = epoch |
| Others | same as PLEPH | |

**Precision note** (from `userguide.txt` and source): For maximum interpolation
accuracy, set `ET2Z(1)` = most recent midnight at or before epoch
(`xxxxxxx.5d0`) and `ET2Z(2)` = remaining fractional day. Alternatively, set
`ET2Z(1)` = some fixed epoch and `ET2Z(2)` = elapsed interval.

### 4.3 CONST — Read ephemeris constants

```fortran
SUBROUTINE CONST(NAM, VAL, SSS, N)
```

| Output | Type | Meaning |
|---|---|---|
| `NAM(N)` | `CHARACTER*6` | Constant names |
| `VAL(N)` | `DOUBLE PRECISION` | Constant values |
| `SSS(3)` | `DOUBLE PRECISION` | (1) start JED, (2) end JED, (3) block step in days |
| `N` | `INTEGER` | Number of constants |

Key constants for this contract: `AU` (km per AU), `EMRAT` (Earth/Moon mass
ratio), `DENUM` (ephemeris number = 405).

### 4.4 STATE — Low-level interpolation

```fortran
SUBROUTINE STATE(ET2, LIST, PV, PNUT)
```

STATE reads the binary file and interpolates Chebyshev coefficients. It is
called internally by PLEPH. STATE is documented for backward compatibility
and is "not recommended for use by first-time users" (`userguide.txt`).

**Critical STATE semantics** (from source and `ascii_format.txt`):

- LIST(1-9): planets 1=Mercury through 9=Pluto — these are **system
  barycenters** (solar system barycentric or heliocentric depending on `BARY`)
- LIST(3) specifically: **Earth-Moon barycenter**, not Earth body center
- LIST(10): **geocentric Moon** — Moon position/velocity relative to Earth
- LIST(11): nutations
- LIST(12): librations

### 4.5 Common block STCOMX — Control flags

```fortran
COMMON/STCOMX/KM,BARY,PVSUN
```

| Flag | Type | Default | Meaning |
|---|---|---|---|
| `KM` | `LOGICAL` | `.FALSE.` | `.TRUE.` → output in km and km/sec; `.FALSE.` → output in AU and AU/day |
| `BARY` | `LOGICAL` | `.FALSE.` | `.TRUE.` → planet output center is SSB; `.FALSE.` → center is Sun |
| `PVSUN(6)` | `DOUBLE PRECISION` | (computed) | Barycentric position and velocity of the Sun (always computed) |

**Source reference**: `testeph.f` lines 892–905 (STATE common block documentation).

> **Critical**: These flags affect only the raw STATE output. PLEPH temporarily
> forces `BARY=.TRUE.` internally (line 572–573) to get barycentric coordinates,
> then computes target-relative-to-center externally. The `KM` flag, however,
> affects PLEPH output because it propagates through STATE.

---

## 5. Target Code Mapping

### 5.1 JPL Reader codes (PLEPH NTARG/NCENT)

From `testeph.f` lines 460–469 and `userguide.txt`:

| JPL Code | Meaning | Body type | NAIF ID equivalent |
|---:|---|---|---:|
| 1 | Mercury | planet/system barycenter | 1 |
| 2 | Venus | planet/system barycenter | 2 |
| 3 | Earth | body center (derived) | 399 |
| 4 | Mars | planet/system barycenter | 4 |
| 5 | Jupiter | planet/system barycenter | 5 |
| 6 | Saturn | planet/system barycenter | 6 |
| 7 | Uranus | planet/system barycenter | 7 |
| 8 | Neptune | planet/system barycenter | 8 |
| 9 | Pluto | planet/system barycenter | 9 |
| 10 | Moon | body center (geocentric in raw) | 301 |
| 11 | Sun | body center | 10 |
| 12 | Solar System Barycenter | reference point | 0 |
| 13 | Earth-Moon Barycenter | system barycenter | 3 |
| 14 | Nutations | non-body | N/A |
| 15 | Librations | non-body | N/A |

### 5.2 JPL code vs NAIF ID differences

| Aspect | JPL reader code | NAIF ID |
|---|---:|---:|
| Earth body | 3 | 399 |
| Moon body | 10 | 301 |
| Sun body | 11 | 10 |
| SSB | 12 | 0 |
| EMB | 13 | 3 |

**These numbering systems are not identical.** The canonical pipeline must
maintain a strict mapping table and never confuse them.

### 5.3 Mercury and Venus: body center or barycenter?

Mercury and Venus have no known natural satellites. From `ascii_format.txt`:

> "The chebychev coefficients for the planets represent the solar system
> barycentric positions of the centers of the planetary systems."

For Mercury and Venus, the center of the planetary system is identical to the
body center. The JPL Chebyshev data stores the **system barycenter** for all
nine planets (LIST indices 1-9). For Mercury (no satellites) and Venus (no
satellites), this is numerically identical to the body center.

**Contract decision**: These are stored as system barycenters; for Mercury and
Venus the system barycenter equals the body center. The canonical target type
`barycenter` is technically correct and consistent with the CSPICE overlap path.

### 5.4 Mars through Pluto

These are **system barycenters** per `ascii_format.txt`. Mars system barycenter
includes the mass effect of Phobos and Deimos; Jupiter includes the Galilean
moons, etc.

---

## 6. Earth Observer Contract

### 6.1 How PLEPH computes Earth body position

This is the most critical section. The official source reveals the exact Earth
derivation algorithm in `testeph.f` lines 570–635.

**Step 1**: PLEPH forces `BARY=.TRUE.` (line 572-573) to get all positions
relative to the Solar System Barycenter.

**Step 2**: For any call involving Earth (NTARG=3) or Moon (NTARG=10), PLEPH
sets `LIST(3)=2` and `LIST(10)=2` in the STATE call (lines 577-584).

**Step 3**: STATE returns:
- `PVST(1:6, 3)` = Earth-Moon Barycenter (SSB-relative)
- `PVST(1:6, 10)` = Geocentric Moon

**Step 4**: PLEPH derives Earth body center from EMB and Moon (lines 621-625):

```fortran
IF(LIST(3) .EQ. 2) THEN
  DO I=1,6
    PV(I,3) = PVST(I,3) - PVST(I,10)/(1.D0+EMRAT)
  ENDDO
ENDIF
```

This computes: **Earth_SSB = EMB_SSB − Moon_geocentric / (1 + EMRAT)**

Where `EMRAT` is the Earth/Moon mass ratio from the ephemeris constants.

**Step 5**: PLEPH derives barycentric Moon (lines 627-631):

```fortran
IF(LIST(10) .EQ. 2) THEN
  DO I=1,6
    PV(I,10) = PV(I,3) + PVST(I,10)
  ENDDO
ENDIF
```

This computes: **Moon_SSB = Earth_SSB + Moon_geocentric**

**Step 6**: Final output (lines 633-635):

```fortran
DO I=1,6
  RRD(I) = PV(I,NTARG) - PV(I,NCENT)
ENDDO
```

### 6.2 Contract for canonical Earth-centered output

When calling `PLEPH(ET, NTARG, 3, RRD)` (target relative to Earth):

1. PLEPH internally computes Earth_SSB from EMB and Moon using the official
   `EMRAT` constant
2. PLEPH computes target_SSB
3. Output = target_SSB − Earth_SSB

**This is a direct, official, internal computation by the reader.** It is not
an arbitrary derivation by the project. The project calls PLEPH with `NCENT=3`
and receives the correct Earth-centered result.

**Contract verdict: `jpl_reader_earth_center_contract_confirmed`**

The canonical pipeline will call `PLEPH(et, ntarg, 3, rrd)` or equivalently
`DPLEPH(et2, ntarg, 3, rrd)` to get each target relative to Earth body center.

### 6.3 Special case: Earth-Moon pair

When `NTARG*NCENT == 30 AND NTARG+NCENT == 13` (i.e., {NTARG=3,NCENT=10} or
{NTARG=10,NCENT=3}), lines 614-618 skip the EMB derivation and return the
geocentric Moon directly (or its negation).

---

## 7. Moon Contract

### 7.1 Native Moon storage

From `ascii_format.txt`:

> Item 10 = "Moon (geocentric)"

From STATE source (line 851):

> `I = 10: GEOCENTRIC MOON`

The Chebyshev coefficients for the Moon are stored as **geocentric** positions
(relative to Earth body center), in km, in the binary file.

### 7.2 Moon via PLEPH

When `NTARG=10, NCENT=3`: Returns geocentric Moon directly (after the
Earth-Moon special case detection at lines 614-618, PV(I,3) is zeroed, so
output = PV(I,10) − 0 = barycentric Moon − barycentric Earth, which equals
geocentric Moon).

When `NTARG=10, NCENT=<anything>`: PLEPH computes Moon_SSB = Earth_SSB +
Moon_geocentric, then subtracts the center.

### 7.3 Canonical Moon mapping

| Field | Value |
|---|---|
| Canonical target ID | 301 |
| Canonical target type | body |
| JPL reader NTARG | 10 |
| JPL reader NCENT | 3 (Earth) |
| Native meaning | Geocentric Moon (when NCENT=3, returns raw geocentric state) |
| Direct availability | Yes |
| Special handling | Earth-Moon pair shortcut in PLEPH (lines 614-618) |

---

## 8. Time Contract

### 8.1 Reader time input

From `userguide.txt`:

> `tdb [d.p.] : julian ephemeris date`

From `testeph.f` source, PLEPH documentation (line 449):

> `ET = D.P. JULIAN EPHEMERIS DATE AT WHICH INTERPOLATION IS WANTED.`

The input is a **Julian Ephemeris Date (JED)**, which is the Julian Date in the
TDB time scale. The JPL export documentation (`eph_export.html`) states:

> "The integration time units are days of barycentric dynamical time (TDB)."

### 8.2 Relationship to canonical ET

The canonical primary time key is:

```
etSeconds: CSPICE ET seconds past J2000 TDB epoch
```

The J2000 epoch in Julian Date is exactly:

```
JD_J2000 = 2451545.0
```

The conversion is:

```
JD_TDB = 2451545.0 + etSeconds / 86400.0
```

This is exact because:
- One ephemeris day = exactly 86400 TDB seconds (by definition of ephemeris time)
- J2000.0 = JD 2451545.0 (by IAU definition)
- No leap seconds are involved (TDB is a continuous time scale)

### 8.3 Two-part JD for precision

For maximum interpolation precision, use DPLEPH with:

```
ET2(1) = 2451545.0          (J2000 epoch, fixed)
ET2(2) = etSeconds / 86400  (fractional days from J2000)
```

This avoids precision loss from adding a small fraction to a large JD value.

### 8.4 Time contract summary

| Field | Value |
|---|---|
| Reader time input name | Julian Ephemeris Date (JED) |
| Official definition | Julian Date in TDB time scale |
| Epoch | J2000.0 = JD 2451545.0 |
| Day length | Exactly 86400 ephemeris (TDB) seconds |
| ET→JD formula | `JD = 2451545.0 + etSeconds / 86400.0` |
| Two-part JD | Yes, via DPLEPH: `ET2(1) = 2451545.0`, `ET2(2) = etSeconds / 86400.0` |
| LSK required | No — reader operates on TDB directly, no leap-second kernel |
| Relationship to CSPICE ET | CSPICE ET = TDB seconds past J2000 = `(JD − 2451545.0) × 86400` |

### 8.5 TDB vs T_eph note

Strictly, the JPL ephemeris independent variable is T_eph, the coordinate time
of the solar system barycentric reference frame used in the integration. For
DE405, Standish (1998) states this is aligned with TDB. The difference between
T_eph and TDB as used by CSPICE is below the ephemeris precision and is not
operationally distinguishable for this contract. We record this note but do not
treat it as a blocker.

---

## 9. Unit Contract

### 9.1 Default output units

From `userguide.txt`:

> `pv(6) [d.p.] : x,y,z,x-dot,y-dot,z-dot [au, au/day]`

From `testeph.f` STATE documentation (lines 892-896):

> `KM = .TRUE., KM AND KM/SEC`
> `= .FALSE., AU AND AU/DAY`
> `DEFAULT VALUE = .FALSE.`

### 9.2 KM mode behavior

When `KM=.TRUE.`, STATE sets (lines 1012-1014):

```fortran
T(2) = SS(3) * 86400.D0   ! time interval in seconds
AUFAC = 1.D0               ! no AU conversion (positions already in km)
```

When `KM=.FALSE.`, STATE sets (lines 1016-1018):

```fortran
T(2) = SS(3)              ! time interval in days
AUFAC = 1.D0 / AU         ! convert km to AU
```

**Confirmation from `ascii_format.txt`**:

> "Planetary positions are stored in units of kilometers (TDB-compatible)."

The Chebyshev coefficients are **natively stored in km**. When `KM=.FALSE.`
(default), STATE divides by AU to convert to AU. When `KM=.TRUE.`, the raw km
values pass through unscaled.

### 9.3 Velocity time unit in KM mode

When `KM=.TRUE.`:
- Position: **km**
- Velocity: **km/sec** (the `T(2)` divisor uses `SS(3)*86400`, converting the
  Chebyshev derivative from per-interval to per-second)

When `KM=.FALSE.`:
- Position: **AU**
- Velocity: **AU/day** (the `T(2)` divisor uses `SS(3)`, keeping the day unit)

### 9.4 Canonical unit contract

| Field | Value |
|---|---|
| Canonical position unit | km |
| Canonical velocity unit | km/s |
| Reader KM flag setting | `KM = .TRUE.` |
| Conversion required | None — reader provides km and km/s directly |
| AU constant | Not needed for canonical output (only for AU mode) |
| AU value on file | Available via `CONST` subroutine; from DE405: `149597870.691` km |

**Contract**: The canonical pipeline must set `KM=.TRUE.` in the STCOMX common
block before calling PLEPH/DPLEPH. This yields positions in km and velocities
in km/s, matching the canonical unit contract exactly.

---

## 10. Frame Contract

### 10.1 Official frame documentation

From STATE source (lines 867-869):

> "ALL OUTPUT VECTORS ARE REFERENCED TO THE EARTH MEAN EQUATOR AND EQUINOX OF
> J2000 IF THE DE NUMBER IS 200 OR GREATER; OF B1950 IF THE DE NUMBER IS LESS
> THAN 200."

DE405 number is 405, so the output frame is **Earth Mean Equator and Equinox of
J2000**.

### 10.2 ICRF alignment

From `eph_export.html`:

> "DE405 : Created May 1997; includes both nutations and librations. Referred to
> the International Celestial Reference Frame."

From Standish (1998, IOM 312.F-98-048):

> DE405 is oriented to the ICRF.

### 10.3 Frame contract

| Field | Value |
|---|---|
| Official frame name | Earth Mean Equator and Equinox of J2000, oriented to ICRF |
| DE405 ICRF alignment | Yes (per Standish 1998 and official export documentation) |
| J2000 relationship | J2000 equatorial frame aligned to ICRF to ephemeris accuracy |
| CSPICE J2000 frame | CSPICE `J2000` is also ICRF-aligned to ≤ 0.01 arcsecond |
| Rotation required | No — reader output can be used as canonical J2000 raw directly |
| Canonical frame | `J2000` |

The difference between "ICRF" and "J2000 equatorial" is ≤ 0.01 arcsecond,
well below the DE405 ephemeris accuracy. No frame transformation is needed.

---

## 11. Coverage Contract

### 11.1 Header coverage

From CONST subroutine output `SSS(3)`:
- `SSS(1)` = starting JED
- `SSS(2)` = ending JED
- `SSS(3)` = block step in days

From the existing provenance documents, DE405 binary `lnxp1600p2200.405`
coverage ET values:

| Field | Value |
|---|---|
| Coverage start JED | 2305424.50 (1599-12-09) |
| Coverage end JED | 2525008.50 (2201-02-20) |
| Coverage start ET | `-1.2624811200000000e+10` |
| Coverage end ET | `6.3472464000000000e+09` |
| Block step | 32 days (for DE405) |

Note: The official `eph_export.html` confirms DE405 covers
"JED 2305424.50 (1599 DEC 09) to JED 2525008.50 (2201 FEB 20)".

### 11.2 Canonical range verification

| Boundary | ET | JED | Inside coverage? |
|---|---|---|---|
| Service start (1900-01-01) | `-3.1557168000000000e+09` | `2415020.0` | Yes |
| Service end exclusive (2101-01-01) | `3.1872528000000000e+09` | `2488433.0` | Yes |
| Last regular sample | ET start + 7341 × 864000 | < end exclusive | Yes |

Both canonical endpoints are well inside the DE405 coverage range of
JED 2305424.50–2525008.50.

### 11.3 Endpoint behavior

From STATE source (lines 993-994):

```fortran
IF(PJD(1)+PJD(4).LT.SS(1) .OR. PJD(1)+PJD(4).GT.SS(2)) GO TO 98
```

The reader uses `<` and `>` tests (not `<=` / `>=`), meaning:
- Start JED is **inclusive** (equal to SS(1) passes the test)
- End JED is **inclusive** (equal to SS(2) passes the test)

Line 999 handles the exact endpoint:

```fortran
IF(PJD(1).EQ.SS(2)) NR=NR-1
```

This adjusts the record number when the query is at the exact end of coverage,
ensuring interpolation uses the last valid record.

### 11.4 Coverage contract summary

| Field | Value |
|---|---|
| Coverage start JED | 2305424.50 (inclusive) |
| Coverage end JED | 2525008.50 (inclusive) |
| Canonical range 1900–2101 | Fully inside coverage |
| Endpoint policy | Both endpoints inclusive |
| Out-of-range behavior | `STOP` with error message (fail-closed) |

---

## 12. Canonical Target Mapping Table

| # | Canonical ID | Canonical Type | Canonical Name | JPL NTARG | JPL NCENT | Direct | Notes |
|---:|---:|---|---|---:|---:|---|---|
| 1 | 1 | barycenter | Mercury Barycenter | 1 | 3 | Yes | system bary = body center (no satellites) |
| 2 | 2 | barycenter | Venus Barycenter | 2 | 3 | Yes | system bary = body center (no satellites) |
| 3 | 4 | barycenter | Mars Barycenter | 4 | 3 | Yes | system barycenter |
| 4 | 5 | barycenter | Jupiter Barycenter | 5 | 3 | Yes | system barycenter |
| 5 | 6 | barycenter | Saturn Barycenter | 6 | 3 | Yes | system barycenter |
| 6 | 7 | barycenter | Uranus Barycenter | 7 | 3 | Yes | system barycenter |
| 7 | 8 | barycenter | Neptune Barycenter | 8 | 3 | Yes | system barycenter |
| 8 | 9 | barycenter | Pluto Barycenter | 9 | 3 | Yes | system barycenter |
| 9 | 10 | body | Sun | 11 | 3 | Yes | physical Sun center |
| 10 | 301 | body | Moon | 10 | 3 | Yes | geocentric Moon (Earth-Moon special case) |

**Observer for all targets**: Earth body center, JPL NCENT = 3.

PLEPH internally:
1. Gets all positions in SSB frame (forces BARY=.TRUE.)
2. Derives Earth from EMB − Moon/(1+EMRAT)
3. Returns target − Earth

This is entirely an official internal computation by the reader.

---

## 13. Open Decisions

### 13.1 OD-JPL-01: Reader wrapper implementation language

| Field | Value |
|---|---|
| Decision | Whether to call the Fortran reader directly (via compiled binary + stdin/stdout) or port the algorithm to C/JavaScript |
| Impact | Build process, platform compatibility |
| Blocks implementation | Yes |
| Recommendation | Compile `testeph.f` with gfortran, invoke via child_process (matching existing CSPICE runner pattern) |

### 13.2 OD-JPL-02: KM flag initialization

| Field | Value |
|---|---|
| Decision | How to set `KM=.TRUE.` in the STCOMX common block |
| Impact | Output units |
| Blocks implementation | Yes, but solution is straightforward |
| Recommendation | Modify the main program (or write a small Fortran wrapper) to set `KM=.TRUE.` before calling PLEPH |

### 13.3 OD-JPL-03: NRECL platform value

| Field | Value |
|---|---|
| Decision | `NRECL=4` for Unix/macOS (bytes), `NRECL=1` for VAX (words) |
| Impact | Binary file reading |
| Blocks implementation | No — confirmed as `NRECL=4` for Unix/macOS |
| Resolution | `NRECL=4`, `KSIZE=2036` for DE405, use FSIZER3 |

---

## 14. Probe Evidence

### 14.1 Existing validated evidence

From previous conversation records:

| Evidence | Value |
|---|---|
| testpo.405 validation | 7,214 rows, 0 failures |
| Declared tolerance | `1e-13` AU/AU-day |
| Maximum residual | `5.3291e-14` AU/AU-day |
| O0/O2 output identity | SHA-256 identical: `9a7e04ad5e56025169196a6863ff832e1fdc7aa4dba2ba16b8c6465bbc7f8995` |
| Overlap baseline | 4-epoch × 10-target comparison; position ~5.82e-11 km; velocity ~2.22e-16 km/s |

### 14.2 Probe status

The official reader binary was previously built and executed in a temporary
directory (`/tmp/mallang-erfa-epv00-feasibility/de405/official-reader/`).
That temporary directory no longer exists. A new probe would need to:

1. Download `testeph.f` from the official URL
2. Verify SHA-256 matches recorded hash
3. Configure FSIZER3 with `NRECL=4`, `KSIZE=2036`
4. Add a wrapper main program that sets `KM=.TRUE.`, reads ET from stdin,
   calls `DPLEPH(et2, ntarg, 3, rrd)` for each target, and writes output
5. Compile with gfortran
6. Link the binary file `lnxp1600p2200.405` as `JPLEPH`
7. Run probe at J2000 (ET=0) and compare with CSPICE overlap smoke

This probe is recommended but not strictly required for contract confirmation.

---

## 15. CSPICE Cross-Reference Alignment

### 15.1 Semantic alignment verification

| Aspect | JPL Reader | CSPICE | Aligned? |
|---|---|---|---|
| Mercury target | NTARG=1 (system bary) → NCENT=3 (Earth) | `spkez_c(1, ..., 399, ...)` | Yes |
| Venus target | NTARG=2 → NCENT=3 | `spkez_c(2, ..., 399, ...)` | Yes |
| Mars target | NTARG=4 → NCENT=3 | `spkez_c(4, ..., 399, ...)` | Yes |
| Jupiter–Pluto | NTARG=5-9 → NCENT=3 | `spkez_c(5-9, ..., 399, ...)` | Yes |
| Sun | NTARG=11 → NCENT=3 | `spkez_c(10, ..., 399, ...)` | Yes |
| Moon | NTARG=10 → NCENT=3 | `spkez_c(301, ..., 399, ...)` | Yes |
| Frame | J2000/ICRF | `"J2000"` | Yes |
| Time | JED (TDB) | ET (TDB seconds past J2000) | Yes (exact conversion) |
| Units (with KM=.TRUE.) | km, km/s | km, km/s | Yes |
| Observer | Earth body (code 3) | Earth (399) | Yes |
| Aberration | geometric (no correction) | `"NONE"` | Yes |

### 15.2 Expected residual classification

The baseline overlap verification showed near-zero residuals: position ~5.82e-11 km and velocity ~2.22e-16 km/s. These are attributed to:

- Different Chebyshev coefficient sets (JPL binary vs NAIF SPK conversion)
- Different interpolation implementations (Fortran vs C)
- Numerical precision differences

Classification: `numeric_residual` — not a semantic misalignment.

---

## 16. Implementation Blueprint

### 16.1 Files to create

```
tools/de405-jpl-reader/
  README.md                              # Build and usage instructions
  src/de405_canonical_v2_jpl.f           # Fortran wrapper calling DPLEPH
  build.sh                               # gfortran build script

scripts/
  generate-de405-jpl-canonical-v2.mjs    # Node.js generator for JPL path
  validate-de405-jpl-canonical-v2.mjs    # Node.js validator

scripts/lib/
  de405-jpl-reader-contract.mjs          # JPL target code mapping constants

test/
  de405JplReaderContract.test.js         # Contract constants tests
  de405JplReaderProbe.test.js            # Probe comparison tests
```

### 16.2 Files to modify

```
scripts/lib/de405-canonical-v2-contract.mjs    # Add JPL adapter contract
scripts/generate-de405-canonical-v2.mjs         # Route 'jpl-official' adapter
test/fixtures/astrology/de405/canonical-v2/manifest.template.json
                                                # targetContractStatus → confirmed
```

### 16.3 Tests

- JPL target code → canonical ID mapping verification
- KM flag enforcement
- ET → two-part JD conversion accuracy
- Reader binary hash verification
- Probe output comparison with CSPICE overlap at ET=0
- Full-range grid boundary verification
- Coverage check before generation

### 16.4 Model recommendation

- Implementation: Luna High or equivalent
- Constraints: No new dependencies beyond gfortran; no modification to
  existing CSPICE runner or overlap contract

---

## 17. Contract Verdicts

### 17.1 Official reader identity: **confirmed**

Source: `testeph.f`, SHA-256 `18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120`.

### 17.2 Target mapping: **confirmed**

All 10 canonical targets have a direct, unambiguous mapping to JPL PLEPH codes.

### 17.3 Body/barycenter semantics: **confirmed**

Barycenters (1-9) are planetary system barycenters; Sun (11) and Moon (10) are
body centers. Mercury and Venus system barycenters equal body centers.

### 17.4 Earth observer: **confirmed**

PLEPH with NCENT=3 computes Earth body center internally using the official
EMB − Moon/(1+EMRAT) formula. No external derivation needed.

### 17.5 Moon contract: **confirmed**

PLEPH with NTARG=10, NCENT=3 returns geocentric Moon via the Earth-Moon
special case. Consistent with canonical target 301.

### 17.6 Time input: **confirmed**

Julian Ephemeris Date (TDB). Two-part via DPLEPH. Exact conversion from
canonical ET: `JD = 2451545.0 + etSeconds/86400`.

### 17.7 Coverage: **confirmed**

JED 2305424.50–2525008.50. Canonical range 1900–2101 is fully inside.

### 17.8 Frame: **confirmed**

J2000 equatorial, ICRF-aligned. No transformation needed.

### 17.9 Units: **confirmed**

With `KM=.TRUE.`: km and km/s. No conversion needed.

### 17.10 Overall verdict: **`jpl_official_reader_contract_ready`**

All semantic contracts are confirmed from official sources. No blocking open
decisions remain for contract confirmation. Implementation-level decisions
(wrapper code, build script) are deferred to the implementation phase.

---

## 18. Appendix: Official Source Checksums

| File | SHA-256 | Source |
|---|---|---|
| `testeph.f` | `18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120` | Recorded in previous validation |
| `lnxp1600p2200.405` | `7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7` | Recorded and verified |
| O0/O2 test output | `9a7e04ad5e56025169196a6863ff832e1fdc7aa4dba2ba16b8c6465bbc7f8995` | Identical across optimization levels |

Note: The `testeph.f` SHA-256 was computed on the file as downloaded from the
official JPL URL. If the file is re-downloaded and the hash differs, the
contract must be re-verified against the new source.

---

## 19. Overlap Tolerance Contract

To assert correctness between the JPL official reader and the CSPICE evaluator,
a formal machine-readable tolerance contract is enforced.

### 19.1 Candidate Tolerance Bounds

Due to the fundamental alignment of the mathematical models, the residuals
reside near the 64-bit IEEE-754 floating-point limit. A candidate boundary
has been established:

| Field | Value |
|---|---|
| Contract State | `candidate` |
| Position floor | `1.0e-9` km (1 µm = 1,000 nm) |
| Position ULP candidate | `4 × output-component ULP norm` |
| Velocity Tolerance | `1.0e-14` km/s (0.01 nanometers/s) |
| Evaluation Metric | Euclidean vector norm |
| Comparison Operator | `<=` |

*Note: `1.0e-9` km is 1 µm, not 1 nm. `1.0e-14` km/s is strictly 0.01 nm/s. Previous drafts incorrectly noted this as 0.01 µm/s.*

The position and velocity ULP multipliers are scale-aware empirical candidate
tolerances. They are not mathematical upper bounds for Chebyshev evaluation
error; normalization order, recurrence order, fused multiply-add behavior,
velocity differentiation, and record selection can all contribute to the
observed residual.

The boundary sweep currently labels the 32-day JPL block edges as
`exact_record_knot_candidate`. It must not call them SPK segment boundaries or
SPK Type 2 logical-record knots until each comparison case has independently
recorded the SPK segment target/center, `INIT`, `INTLEN`, `RSIZE`, record count,
and selected record relation. In particular, `2764800` seconds is not a
universal SPK `INTLEN` assumption.

The current verifier outcome is reported as:

```text
verifier_status: implementation_operational
candidate_contract_status: rejected_by_observed_boundary_residuals
numeric_result: tolerance_exceeded
exit_code: 1
active_contract_status: not_established
```

### 19.2 Path to Active Contract

Before the candidate bounds are transitioned to `active`, a comprehensive sweep
must be executed:
- **Temporal boundary sweep**: evaluate exact segment starts, midpoints, ends, and adjacent representable IEEE-754 binary64 epochs (`nextUp`, `nextDown`).
- **Platform sweep**: confirm on macOS arm64 and Linux x64 environments.
- **Metric enforcement**: Record components for evidence, but gate strictly on Euclidean vector norm.

The machine-readable source of truth for these bounds is located at:
`scripts/lib/de405-overlap-tolerance-contract.mjs`

## 20. SPK Type 2 Record Metadata and Exact-Knot Evidence

The CSPICE runner now exposes two diagnostic modes. They are evidence modes and
do not establish or activate an overlap tolerance:

```bash
tools/de405-cspice-runner/build/de405-canonical-v2-runner \
  --dump-spk-type2-segments --spk /path/to/de405.bsp

tools/de405-cspice-runner/build/de405-canonical-v2-runner \
  --inspect-spk-type2-knot --spk /path/to/de405.bsp \
  --target-id 2 --knot-index 1
```

`--dump-spk-type2-segments` walks public DAF summaries and reads the final four
Type 2 directory words with `dafgda_c`. It records the descriptor, `INIT`,
`INTLEN`, `RSIZE`, record count, degree, raw record address range, and directory
invariant result. A malformed directory is reported as `metadata_invalid`.

`--inspect-spk-type2-knot` evaluates `nextDown`, exact-knot, and `nextUp`
queries from both adjacent raw records using `chbint_c`, then compares all six
components bitwise with the same descriptor passed to `spkpvn_c`. Only one
bit-identical candidate produces `verified`; multiple matches produce
`selection_ambiguous`, and no match produces `unavailable`. Segment overlap is
also fail-closed; no segment or record is selected from an epoch-spacing guess.

The overlap verifier consumes this evidence and emits the selected segment
metadata and selection status per sample. Its `spkRecordMetadataStatus` may be
`verified`, `metadata_invalid`, `selection_ambiguous`, or `unavailable`. This
status is independent of the existing candidate tolerance result; observed
residuals above the candidate continue to return exit code `1`.

## 21. Arbitrary-ET Complete Residual Sweep

The complete sweep is a separate evidence workflow and does not modify the
candidate contract:

```bash
node scripts/run-de405-jpl-cspice-residual-sweep.mjs \
  --spk /path/to/de405.bsp \
  --jpl-binary tools/de405-jpl-reader/fixtures/lnxp1600p2200.405
```

The CSPICE runner creates the query manifest from stored Type 2 `MID`/`RADIUS`
metadata. Each logical record contributes `record_quarter`, `record_midpoint`,
and `record_three_quarter`; each internal knot contributes `next_down_knot`,
`exact_knot`, and `next_up_knot`; and each selected segment contributes coverage
start/end rows. JPL and CSPICE consume the same JSONL manifest, and the Node
orchestrator joins their outputs by `sampleId` while streaming raw evidence to
JSONL files. Checkpoints include the manifest, SPK, JPL binary, and contract
hash/version identity and cannot be reused across changed inputs.

The summary records `complete_sweep`, `complete_sweep_with_evidence_failures`,
or `partial_sweep`. A partial sweep or any evidence failure blocks an active
tolerance proposal. `selection_ambiguous` and `out_of_coverage` rows remain in
the raw evidence; they are never dropped to improve residual statistics.
