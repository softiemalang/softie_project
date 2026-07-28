# DE405 Canonical v2 Contract

## 1. Purpose and Scope

This document defines the complete technical contract for the **DE405
canonical v2 verification chain**. It fixes every design decision that a
subsequent implementation model needs so that no additional design judgment
is required during implementation — except where an item is explicitly
recorded as `open_decision`.

### Scope boundaries

- **In scope**: canonical source, reader, time system, coordinate frame,
  center/observer, targets, units, grid generation, JSONL schema,
  manifest schema, numeric serialization, hash computation, determinism
  criteria, fail-closed conditions, legacy separation, test requirements,
  and engine integration contract.
- **Out of scope**: actual fixture generation, JSONL file creation,
  implementation code, ecliptic/tropical coordinate conversion, astrology
  interpretation, runtime engine modification.

### Relationship to legacy

This contract is entirely separate from the legacy DE405 evidence chain
(manifest v1, `provenance_incomplete`, `canonical: false`). Legacy files
are not inputs to canonical v2 and are not modified by this contract.

---

## 2. Official Sources

All design decisions are grounded in the following official sources. Each
entry states what contract it supports.

### 2.1 NAIF DE405 SPK

| Field | Value |
|---|---|
| File | `de405.bsp` |
| Size | 10,898,432 bytes |
| SHA-256 | `30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89` |
| MD5 | `26d9596d003d6bf3b1c0b33e9567275b` |
| Coverage | JED 2305424.50 (1599-12-09) — JED 2525008.50 (2201-02-20) |
| Frame | ICRF (International Celestial Reference Frame) |
| Distribution | `https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp` |
| Checksum list | `https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/aa_checksums.txt` |
| Comment file | `https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.cmt` |

**Supports**: canonical source selection (§3), reader input (§4), target
body coverage (§10), frame confirmation (§8).

### 2.2 JPL DE405 Binary

| Field | Value |
|---|---|
| File | `lnxp1600p2200.405` |
| Size | 55,900,416 bytes |
| SHA-256 | `7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7` |
| Coverage | Same as NAIF SPK (source ephemeris) |
| Distribution | JPL Horizons / Solar System Dynamics |

**Supports**: upstream reference source role (§3), cross-reference
evidence (existing Gate A–D hierarchy).

### 2.3 CSPICE Toolkit

| Field | Value |
|---|---|
| Version | N0067 |
| Release date | 2022-01-03 |
| Distribution | `https://naif.jpl.nasa.gov/naif/toolkit.html` |
| Documentation | `https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/` |

**Supports**: reader contract (§4), API selection (§4), time conversion
(§5), frame semantics (§8), aberration correction options (§11).

### 2.4 NAIF Leap Seconds Kernel

| Field | Value |
|---|---|
| File | `naif0012.tls` |
| Distribution | `https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls` |
| Content | Leap seconds through 2016-12-31 (37 leap seconds) |

**Supports**: UTC-to-ET conversion in derived layer (§5), fail-closed
kernel verification (§17).

### 2.5 DE405 Memo (Standish 1998)

| Field | Value |
|---|---|
| Author | E. M. Standish, JPL |
| Reference | IOM 312.F-98-048, August 26, 1998 |
| Content | DE405/LE405 ephemeris construction, ICRF orientation |

**Supports**: frame relationship to ICRF (§8), ephemeris accuracy context.

---

## 3. Canonical Source Contract

### 3.1 Decision

| Role | Source | File |
|---|---|---|
| **Primary execution source** | NAIF `de405.bsp` | `de405.bsp` |
| **Upstream reference source** | JPL DE405 binary | `lnxp1600p2200.405` |

### 3.2 Rationale

| Criterion | NAIF `de405.bsp` | JPL DE405 binary |
|---|---|---|
| CSPICE direct compatibility | Yes — native SPK format | No — requires conversion |
| Conversion step required | None | NIOSPK conversion (original tool unavailable) |
| Official NAIF checksum | MD5 verified, SHA-256 in manifest | Not in NAIF checksum list |
| Reproducibility | Download and verify hash | Hash-verified but not CSPICE-readable |
| Coverage metadata via CSPICE | `spkcov_c` / `spkobj_c` | Not applicable |
| Target/center/frame metadata | `spkobj_c`, kernel comments | Requires separate reader |

### 3.3 Source manifest fields

```
canonical_source_role:      primary_execution_source
primary_execution_source:   de405.bsp
upstream_reference_source:  lnxp1600p2200.405
source_file_name:           de405.bsp
source_file_size:           10898432
source_sha256:              30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89
source_md5:                 26d9596d003d6bf3b1c0b33e9567275b
coverage_start_jed:         2305424.50
coverage_end_jed:           2525008.50
coverage_start_approx:      1599-12-09
coverage_end_approx:        2201-02-20
```

---

## 4. Reader Contract

### 4.1 Reader selection

| Field | Value |
|---|---|
| `reader_name` | CSPICE |
| `reader_version` | N0067 |
| `reader_invocation` | Native CLI binary spawned from Node.js via `child_process` |
| `reader_binary_hash` | SHA-256 of the runner binary, recorded in manifest |

### 4.2 Required CSPICE APIs

| API | Purpose |
|---|---|
| `furnsh_c` | Load SPK kernel (`de405.bsp`) and optionally LSK kernel |
| `spkezr_c` | Compute target state (position + velocity) relative to observer using ET |
| `kclear_c` | Unload all kernels after computation |

Optional verification APIs:

| API | Purpose |
|---|---|
| `spkcov_c` | Verify kernel coverage window for each target body |
| `spkobj_c` | Enumerate object IDs present in loaded kernel |

### 4.3 Node.js integration

The CSPICE runner is a native binary compiled from CSPICE N0067 source. It
is invoked from Node.js via `child_process.spawnSync` or equivalent. The
runner:

1. Accepts a list of ET values on stdin (or uses internally generated ET grid based on manifest parameters)
2. Loads the specified kernels
3. For each ET, queries `spkezr_c` for each target
4. Outputs JSONL to stdout
5. Exits with code 0 on success, non-zero on any error

The runner binary hash is verified before execution. If the hash does not
match the manifest, the generator must fail-closed.

---

## 5. Time Contract

### 5.1 Canonical Primary Time Axis

```
canonicalTimeAxis:    CSPICE_ET
timeAxisFamily:       TDB (Barycentric Dynamical Time)
etEpoch:              J2000
```

The canonical raw fixture uses CSPICE Ephemeris Time (ET), which corresponds to TDB, as the primary key. UTC is not the primary key.

- **Primary canonical key**: `etSeconds`
- **Data type**: decimal string (§13)
- **Sorting**: Ascending numeric order of `etSeconds`

### 5.2 Separation of UTC and ET

The contract separates the time layers to ensure that future leap-second updates do not alter the canonical raw state vectors.

```
Layer A: Canonical DE405 raw fixture
Input: ET (TDB) -> Output: J2000 geometric state vector
Dependency: de405.bsp only (no LSK required for core generation, unless UTC metadata is embedded)

Layer B: Time-conversion fixture
Input: UTC + pinned LSK -> Output: ET
Dependency: naif0012.tls

Layer C: Product input layer
Input: Local civil time -> Output: UTC -> Output: ET
```

### 5.3 UTC Metadata

If UTC strings are included in the raw JSONL (`timestampUtc`), they must adhere to the following:
- They are **derived readable metadata**, not the primary canonical identity.
- Any change in the Leap Second Kernel (LSK) may change the UTC strings, but it **must not** change the raw ET sample sequence or the computed state vectors.
- If UTC metadata is present and included in the output hash, then the LSK hash must be strictly included in the canonical input hash set (`lskRequiredForRawGrid: true`).
- A simpler, more deterministic approach is to omit UTC from the raw JSONL and rely entirely on `etSeconds`, leaving UTC to a separate `time-conversion` fixture or lookup file. This decision (to include or exclude UTC metadata in the final JSONL schema) is deferred to implementation, but if included, the rule above strictly applies.

---

## 6. Canonical Grid Contract

### 6.1 Regular Grid Range and Interval (OD-01 Resolved)

The regular canonical grid is completely deterministic based on exact ET steps, independent of civil calendar anomalies.

| Parameter | Value |
|---|---|
| `regularGridStartEt` | ET corresponding to `1900-01-01T00:00:00 TDB` |
| `regularGridEndExclusiveEt` | ET corresponding to `2101-01-01T00:00:00 TDB` |
| Start behavior | Inclusive |
| End behavior | Exclusive |
| `regularGridStepSeconds` | `864000` (exactly 10 days of ET) |

**Note**: A fixed step of 864000 ET seconds means that civil UTC times corresponding to these ET values will drift across leap seconds. This is intended; the sample sequence remains absolutely fixed.

### 6.2 Timestamp and Row Count Calculation

The duration from `1900-01-01` to `2101-01-01` (exclusive) covers exactly 201 years.
- Leap years: 49 (1904 to 1996 = 24, 2000 = 1, 2004 to 2096 = 24)
- Common years: 152 (201 - 49)

Total days = (152 × 365) + (49 × 366) = 55,480 + 17,934 = 73,414 days.

Using a step of exactly 10 days:
```
Total days: 73,414
Timestamp count = ceil(73,414 / 10) = 7,342 timestamps
```

For 10 targets per timestamp:
```
Expected Row Count = 7,342 × 10 = 73,420 rows
```

### 6.3 Generation Rules

- Timestamps are generated by repeated addition of `864000` to the starting ET.
- Generation must stop strictly before `regularGridEndExclusiveEt`.

---

## 7. Fixture Separation Contract

The fixture hierarchy is separated into three distinct domains.

### 7.1 Regular Grid Fixture
- **Path**: `test/fixtures/astrology/de405/canonical-v2/regular-grid/`
- Contains the 73,420 rows defined in §6.
- Purely deterministic, ET-based iteration.

### 7.2 Boundary Fixture
- **Path**: `test/fixtures/astrology/de405/canonical-v2/boundary/`
- Contains exact edge cases and critical reference points.
- Mandatory inclusions:
  - Support range start (`1900-01-01`)
  - Last regular sample
  - Step exactly prior to the end exclusive boundary
  - Exact end boundary (`2101-01-01`)
  - J2000 epoch
  - `1900-02-28`, `1900-03-01` (Common year boundary)
  - `2000-02-29`, `2000-03-01` (Leap year boundary)
  - `2100-02-28`, `2100-03-01` (Common year boundary)
  - Samples at 06:00, 12:00, 18:00 ET (non-midnight values)
  - ET values with fractional seconds
  - Existing engine regression test timestamps

### 7.3 Time-conversion Fixture
- **Path**: `test/fixtures/astrology/de405/canonical-v2/time-conversion/`
- Tests the translation between UTC and ET.
- Dependency: `naif0012.tls`
- Mandatory inclusions:
  - UTC immediately prior to leap seconds (1972+)
  - Leap second string (e.g., `23:59:60` if CSPICE supports/requires, or the boundary validation)
  - UTC immediately following leap seconds
  - UTC → ET → UTC round-trip verification
  - Hash comparisons to confirm LSK pinning behavior

These three fixtures have distinct manifest IDs and schema versions.

---

## 8. Reference Frame Contract

### 8.1 CSPICE frame

```
frame_name:    J2000
frame_type:    inertial
```

### 8.2 Frame semantics

The CSPICE `J2000` frame is the Earth Mean Equator and Equinox of J2000.0
reference frame. Per NAIF documentation, CSPICE `J2000` is aligned to the
International Celestial Reference Frame (ICRF) to the accuracy of the
ephemeris (≤ 0.01 arcsecond).

### 8.3 Consistency with engine

The engine's Layer A contract specifies:
```
referenceFrame: ICRF or explicitly documented J2000 equatorial frame
```
CSPICE `J2000` satisfies this contract.

---

## 9. Center and Observer Contract

### 9.1 Observer

```
observer_name:    EARTH
observer_naif_id: 399
observer_type:    planet center (geocenter)
```

All targets use Earth (399) as observer. This produces geocentric state
vectors, consistent with the engine's `observerCenter: earth_geocenter`.

### 9.2 Center mapping rule

Every target in the canonical v2 uses the same observer (Earth 399).
There is no implicit center fallback.

---

## 10. Target Body Contract

### 10.1 Target list

| # | Display Name | NAIF Name | NAIF ID | Target Type |
|---|---|---|---|---|
| 1 | Mercury | MERCURY BARYCENTER | 1 | barycenter |
| 2 | Venus | VENUS BARYCENTER | 2 | barycenter |
| 3 | Mars | MARS BARYCENTER | 4 | barycenter |
| 4 | Jupiter | JUPITER BARYCENTER | 5 | barycenter |
| 5 | Saturn | SATURN BARYCENTER | 6 | barycenter |
| 6 | Uranus | URANUS BARYCENTER | 7 | barycenter |
| 7 | Neptune | NEPTUNE BARYCENTER | 8 | barycenter |
| 8 | Pluto | PLUTO BARYCENTER | 9 | barycenter |
| 9 | Sun | SUN | 10 | body |
| 10 | Moon | MOON | 301 | body |

### 10.2 Barycenter vs. planet center

The manifest and JSONL strictly require the `targetType` field (`barycenter` or `body`).

- Barycenters (1–9) are **not** identical to physical planet centers (199-999).
- Canonical raw layer preserves the exact meaning of the DE405 kernel.
- Target IDs must not fallback or be replaced by name matching.
- A `targetType` mismatch is a validator fail-closed condition.
- If the astrology derived layer requires physical planet centers, a separate source or derived contract is required.

---

## 11. Aberration Correction Contract

### 11.1 Selection

```
aberration_correction:  NONE
```

### 11.2 Rationale

- Verifies the raw ephemeris state vectors geometrically.
- Consistent with the engine's Layer A contract (`positionNature: geometric`).

---

## 12. Unit Contract

### 12.1 CSPICE native output units

```
position_unit:    km (kilometer)
velocity_unit:    km/s (kilometer per second)
et_unit:          seconds past J2000 TDB epoch
```

These are native `spkezr_c` units; no conversion is performed in v2 generation.

---

## 13. Numeric Serialization Contract

### 13.1 Design choice

All floating-point values from CSPICE (position, velocity, ET) are stored as JSON strings containing decimal representations.

### 13.2 Format specification

```
format:              C-style scientific notation
significant_digits:  17 (IEEE 754 double round-trip guarantee)
c_format_equivalent: %.16e
pattern:             [-]d.ddddddddddddddddE[+-]dd[d]
exponent_char:       lowercase 'e'
exponent_sign:       mandatory (+ or -)
negative_sign:       '-' prefix for negative values
positive_sign:       no prefix for positive values
negative_zero:       normalized to positive zero BEFORE serialization
nan:                 forbidden (fail-closed)
infinity:            forbidden (fail-closed)
trailing_zeros:      preserved (fixed 16 digits after decimal point)
locale:              C/POSIX (period as decimal separator)
```

**Understanding `%.16e`**:
In C printf, `%.16e` provides 1 digit before the decimal and 16 digits after, resulting in exactly 17 significant digits. This guarantees lossless round-tripping for IEEE 754 double precision floats.

**Negative Zero**:
Any value of `-0.0` or `-0.0000000000000000e+00` must be normalized to `0.0000000000000000e+00` prior to string formatting.

---

## 14. JSONL Schema Contract

### 14.1 Key ordering and Structure

All JSON objects must use a fixed key order.

```json
{
  "schemaVersion": "de405-canonical-v2-raw",
  "etSeconds": "-8.6725736816000000e+07",
  "target": "MERCURY BARYCENTER",
  "targetId": 1,
  "targetType": "barycenter",
  "observer": "EARTH",
  "observerId": 399,
  "frame": "J2000",
  "abcorr": "NONE",
  "positionKm": {
    "x": "1.4567890123456789e+08",
    "y": "-2.3456789012345678e+07",
    "z": "-1.0172345678901234e+07"
  },
  "velocityKmPerSec": {
    "x": "4.5678901234567890e+00",
    "y": "2.8765432109876543e+01",
    "z": "1.2467890123456789e+01"
  }
}
```
*(Note: If UTC metadata is included per §5.3, it should appear before `etSeconds`. However, `etSeconds` remains the canonical primary key.)*

### 14.2 Ordering rules

1. `etSeconds` ascending (numerical evaluation, NOT string lexical).
2. `targetId` ascending (1, 2, 4, 5, 6, 7, 8, 9, 10, 301).

Duplicate `(etSeconds, targetId)` pairs are strictly forbidden.

---

## 15. Manifest Schema Contract

### 15.1 New and required fields

The manifest must include the following structural definitions:

```json
{
  "manifestSchemaVersion": 2,
  "canonicalId": "de405-canonical-v2-regular-grid",
  "canonical": true,
  "provenanceStatus": "generated | verified | draft | rejected",
  
  "timeContract": {
    "timeAxis": "CSPICE_ET",
    "timeAxisFamily": "TDB",
    "etEpoch": "J2000",
    "regularGridStartEt": "(number)",
    "regularGridEndExclusiveEt": "(number)",
    "regularGridStepSeconds": 864000,
    "regularGridTimestampCount": 7342,
    "utcMetadataRole": "excluded | derived_metadata_only",
    "lskRequiredForRawGrid": false,
    "lskRequiredForTimeConversion": true
  },

  "targetCount": 10,
  "expectedRowCount": 73420,

  "determinismContract": {
    "samePlatformByteIdentity": "required",
    "crossPlatformByteIdentity": "not_guaranteed",
    "crossPlatformNumericEquivalence": "future_validation",
    "negativeZeroNormalization": true
  }
}
```

If the start/end ET boundaries were derived from a human-readable TDB string via `str2et_c`, the procedure must be recorded in the generator provenance.

---

## 16. Legacy and v2 Separation Contract

| Aspect | Legacy | Canonical v2 |
|---|---|---|
| Status | `provenance_incomplete`, `canonical: false`, `needs_verification` | `canonical: true`, manifest v2 |
| Role | `historical_evidence` | Ground truth validation |
| Paths | `test/fixtures/astrology/de405/` | `test/fixtures/astrology/de405/canonical-v2/...` |
| Tools | `generate-de405-cross-reference.mjs` | Separate v2 generator |
| Validator | `validate-de405-hierarchy.mjs` | Separate v2 validator |

Legacy files are **not modified, moved, or deleted** by the v2 process. Legacy fixtures **cannot** be used as inputs to the v2 generator.

---

## 17. Output Generation & Fail-Closed Conditions

The generator and validator must fail-closed (exit ≥ 1) immediately on any of the following:

- UTC string used as canonical primary time key instead of ET.
- ET grid sequence does not exactly match `regularGridStepSeconds`.
- ET sample count does not match `regularGridTimestampCount`.
- Final ET sample touches or exceeds `regularGridEndExclusiveEt`.
- `targetType` is missing in JSONL.
- `targetType` does not match NAIF ID semantics (e.g., ID 1 must be `barycenter`).
- Output rows sorted lexically by string instead of numerically by `etSeconds`.
- Negative zero (`-0.0000000000000000e+00`) is present in the output.
- Serialization format deviates from exactly `%.16e`.
- Time-conversion fixture schema is mixed into the raw fixture generator.
- A Leap Second Kernel update changes the raw ET sequence (which must be LSK-independent).
- A legacy timestamp fixture is provided as input to the v2 grid generator.
- Any Non-finite value (NaN, Infinity, -Infinity) is detected.
- Any duplicated `(etSeconds, targetId)` pair is detected.

No fallback or warning-only modes are permitted.

---

## 18. Atomic Output Contract

1. Create temporary file on the same filesystem.
2. Write JSONL rows.
3. Validate contents (schema, counts, ordering, hashes, fail-closed constraints).
4. If valid, atomic rename to final path.
5. If invalid, delete temp file and exit non-zero.
6. Silent overwrite of existing canonical output is forbidden (requires explicit flag).

---

## 19. Determinism Approval Criteria

```
samePlatformByteIdentity: required
crossPlatformByteIdentity: not_guaranteed
crossPlatformNumericEquivalence: future_validation
```

**Byte-level identity required when:**
- Same OS
- Same CPU architecture
- Same CSPICE binary hash
- Same source kernel hash
- Same generator commit
- Same manifest
- Same ET sequence
- Same serialization implementation

Cross-platform byte identity is not required for v2 approval.

---

## 20. Engine Integration Contract

Canonical v2 covers only the **raw layer**. The engine's layered architecture Maps as follows:

| Engine Layer | Canonical v2 Role |
|---|---|
| **Layer A (Raw)** | Provided by Canonical v2 JSONL (J2000, km, geometric, geocentric, ET/TDB) |
| **Layer B (Mean)** | Derived (Ecliptic conversion, longitude, latitude) - Out of scope |
| **Rule Core** | Consumes Layer B - Out of scope |

No engine calculation logic, public API, or UI is modified by this contract.

---

## 21. Test Contract

Tests must assert the manifest structure, fail-closed conditions, legacy separation, determinism (on the same platform), and correct separation of time layers (UTC vs ET).

---

## 22. Open Decisions

### 22.1 OD-01: Timestamp range and interval
**Status**: `resolved`
**Decision**: 1900-01-01 TDB to 2101-01-01 TDB exclusive. 864000 ET seconds step. 7342 timestamps. 73420 rows. Separate boundary and time-conversion fixtures.

### 22.2 OD-02: CSPICE runner build and distribution
**Status**: `open` (but `blocksImplementation: false`)
**Decision**: Distribution mechanism (git LFS, local build script, etc.) is deferred. However, any subsequent implementation must pin the runner source, compiler version, build flags, binary hash, and architecture.

### 22.3 Resolved ET boundaries

The exact values and their complete acquisition/build/execution provenance are
recorded in `de405-canonical-v2-boundary-resolution.md` after the official
CSPICE N0067 resolver has passed its two-run byte-identity and grid-invariant
gates. This section is intentionally pending until those gates pass.

```yaml
regularGridStartEt: "-3.1557168000000000e+09"
regularGridEndExclusiveEt: "3.1872528000000000e+09"
regularGridStepSeconds: "8.6400000000000000e+05"
regularGridTimestampCount: 7342
targetCount: 10
expectedRowCount: 73420
boundaryResolutionProvenance: de405-canonical-v2-boundary-resolution.md
```

---

## 23. Implementation Readiness

```
verdict: canonical_v2_contract_ready
```

All required design decisions are now finalized. The time axis is strictly ET/TDB, interval and bounds are mathematically fixed, determinism and fail-closed conditions are robust, and the separation of legacy/v2 is maintained.

**Next step**: `DE405 Canonical v2 Generator 및 Validator 구현`
