# Astrology jplephem Provider Candidate v1

## Scope and status

This is the CSPICE-free jplephem producer for the technical Astrology layer.
Its arbitrary-date route is source-relative and internal-ready for the fixed
time-scale interval in the offline bundle. It does not alter activation, add
True Node, or generate semantic or personal interpretation. The legacy
fixture route remains as a comparison surface and is not the arbitrary-date
input source.

The CSPICE runner in the GitHub Actions `reference` job is an offline
comparison oracle only. It is not part of the jplephem candidate payload and
is not required by `api/provider/astrology-jplephem-producer.py`.

## Fixed inputs and runtime

| Item | Fixed value |
|---|---|
| Python build reference | `3.14.7` CPython |
| Python runtime compatibility | CPython `3.14.x`, ABI tag `cpython-314` |
| jplephem | `2.24` |
| NumPy | `2.5.3` |
| Python dependency license | MIT |
| DE405 source | official unmodified NAIF `de405.bsp` |
| DE405 SHA-256 | `30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89` |
| DE405 bytes | `10,898,432` |
| time | verified offline DUT1/TT−UTC/TDB−TT bundle; two-part JD |
| observer | Earth geocenter `399` |
| frame | `J2000/ICRF` |
| correction | geometric `NONE` |

The producer has no network or runtime-download path. It rejects a missing,
wrong-size, or wrong-hash BSP, an altered fixture, a wrong provider identity,
an unavailable required SPK segment, and a runtime ABI/dependency mismatch.
The exact interpreter patch version is recorded in each output for provenance;
acceptance uses the CPython `3.14.x`/`cpython-314` compatibility contract rather
than requiring the build reference patch.

## Candidate output

`astrology-jplephem-producer.py` emits the verified ten-body DE405 state rows
for a supplied ET after the caller has passed the time-scale and coverage
contracts. It preserves provider/source identity, time/frame/observer
semantics, units, two-part-JD evidence, and row-level selection evidence. The
Python Function then applies the existing transform and Rule Core without
adding semantic meaning.

The fixture covers the verified DE405 overlap window, multiple historical and
future dates, and explicit retrograde samples. Four locations (Seoul, Busan,
Jeju, and Incheon) are applied only to the existing time/angle and Rule Core
path so that houses, rulers, distribution, aspect, sign, degree, and motion
FACTs are compared without changing the calculation implementation.

## Verification workflow

`.github/workflows/astrology-jplephem-equivalence-v1.yml` is manually
dispatchable on `main` and runs:

1. a Linux CSPICE reference job that materializes a fresh comparison file;
2. fresh Python installs on `ubuntu-22.04` and `ubuntu-24.04`;
3. two separate jplephem processes per hosted Linux variant;
4. exact repeated-output SHA checks;
5. raw state, transformed longitude/speed, and existing Rule Core comparison;
6. exact discrete checks for sign, boundary, motion, aspects, Whole Sign
   houses, chart rulers, distribution counts, and ties;
7. missing, tampered, wrong-provider, wrong-source, and missing-BSP
   fail-closed checks; and
8. cross-hosted-Linux byte-stability checks for candidate output and manifest.

The comparison uses the frozen
`provider-equivalence-contract-v1` candidate thresholds and exact discrete
policy. It is a comparison oracle for the same producer; the separate public
redistribution and interpretation-activation gates remain independent of the
internal source-relative FACT route.

## Vercel preview packaging

`api/astrology.py` is the smallest file-based Python Function candidate. Its
root `requirements.txt` pins `jplephem==2.24` and `numpy==2.5.3`; `.python-version`
records the reproducible build reference `3.14.7`; the runtime contract accepts
CPython `3.14.x` with ABI tag `cpython-314`; and `vercel.json` includes the
immutable BSP, provider modules, time-scale bundle, and declared assets in the
function bundle. The function has no runtime network or provider-download path
and uses a 64 KiB request cap.

The user-input request accepts only the existing Korea SGG local-civil-time
and location contract. It derives UTC through the pinned TZif resolver,
consumes the immutable time-scale bundle for the supported interval, checks
DE405 coverage, and then emits `astrology-jplephem-fact-packet-v1` plus
`astrology-jplephem-fact-handoff-v1`; the handoff projects only raw and
deterministically derived technical FACTs and retains the jplephem/DE405
identity. It does not rewrite the frozen CSPICE packet schema or activate
interpretation.

The route is an internal technical producer, not an interpretation or public
activation route. An authenticated Vercel Preview check observed CPython
`3.14.7` during the build and CPython `3.14.6` while executing the Function;
the response recorded that exact runtime and passed the `cpython-314` runtime
contract. The same request produced byte-identical repeated responses, passed
the fresh-file checker, and rejected tampered, missing-handoff, and
wrong-provider responses.

The earlier cloud check used `golden_2000:seoul`, while the existing Mac golden
used a synthetic `0/0` observer location; therefore location-dependent angles,
Whole Sign houses, chart rulers, and angle aspects were not claimed as
same-input Mac parity by that record. It remains a fixture comparison record,
not a substitute for the arbitrary-date input and time-scale checks described
above.

The user-input path is re-evaluated through the same local/Linux provider for
multiple dates and locations, including the supported interval endpoints, and
carries the source-relative boundary assessment. The existing fixture's fixed
offsets and locations remain comparison data only. The producer's
`availableForInterpretation` value remains false because interpretation
integration is not activated; it does not prohibit a downstream conversational
consumer from describing included FACTs under its separate contract.

## DE405-only release boundary

The older `de405-linux-producer-v0` release gate is intentionally unchanged.
That contract covers a Linux artifact containing CSPICE libraries and
Toolkit-derived build material, so its `publicReleaseAllowed: false` and
external-review state remain applicable to that artifact only.

The CSPICE-free Function has a separate, narrower contract at
`api/provider/de405-only-release-contract-v1.json`. Its scope is limited to
the jplephem/NumPy runtime and the byte-for-byte unmodified NAIF `de405.bsp`.
The contract binds the provider identity, source URL, BSP bytes/SHA-256,
coverage, retained kernel comments, and the human-readable
`api/provider/NOTICE.md`. It also asserts that CSPICE and the SPICE Toolkit
are absent; the Function fails closed if the contract, notice, or BSP is
missing or altered.

For this data-only scope, the contract records
`publicReleaseAllowed: true` based on NAIF's kernel-redistribution rule for
unmodified NAIF kernels. It does not authorize distribution of CSPICE or the
SPICE Toolkit, does not make a project-specific export determination for
other products, and does not change interpretation activation. NAIF/PDS and
the ancillary-data provider credit are included in the notice.

## Boundary and authority rules

Numeric closeness never overrides a discrete mismatch. `near_sign_boundary`,
`near_orb_boundary`, and motion-epsilon states remain explicitly near or
indeterminate and are not promoted by provider agreement. Matching DE405
source identity does not make jplephem/CSPICE implementation hashes equal and
does not establish semantic authority.
