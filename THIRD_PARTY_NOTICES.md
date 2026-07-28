# Third-Party Notices & External Oracle Attributions

This document records the third-party acknowledgements, licenses, and external oracle attributions for external astronomical models and reference standards used during the development and validation of the Mallang project.

---

## 1. IAU SOFA (Standards of Fundamental Astronomy)

### Official Acknowledgement & Citation
"Software Routines from the IAU SOFA Collection were used. Copyright © International Astronomical Union Standards of Fundamental Astronomy (http://www.iausofa.org)"

### Project Implementation & Relationship Notice
- Mallang independently implements the declared IAU 2000 Earth Rotation Angle (ERA), IAU 2006 Mean Obliquity, and IAU 2006 Greenwich Mean Sidereal Time (GMST) mathematical models in pure JavaScript.
- IAU SOFA release 2023-10-11 (ANSI C) was used solely as a one-time external numerical validation oracle outside the repository.
- No SOFA source code, headers, binaries, or wrappers are included in this repository.
- This implementation is derived by Mallang developers and does not itself constitute software provided by and/or endorsed by the IAU SOFA Board.
- Routine names and interfaces follow Mallang project unique domain conventions (e.g. `deriveEarthRotationAngle`, `deriveMeanObliquity`).
- Mallang Time & Angle Core is a separate JavaScript implementation utilizing strict schema contracts, availability flags, epistemic status, and IEEE 754 float representation.

Full verbatim license terms for IAU SOFA are preserved in [docs/astrology/licenses/IAU-SOFA-LICENSE.txt](file:///Users/softie/Documents/softie_project/docs/astrology/licenses/IAU-SOFA-LICENSE.txt).

---

## 2. Astrodienst Swiss Ephemeris

### Oracle Usage Notice
No Swiss Ephemeris source code, binary, wrapper, or runtime call is included in Mallang. Swiss Ephemeris was executed outside the repository to generate a small set of validation fixtures.

### Operational Boundaries
- `usageMode`: `external_validation_oracle_only`
- `sourceCodeInRepository`: `false`
- `binaryInRepository`: `false`
- `runtimeDependency`: `false`
- `buildDependency`: `false`
- `testDependency`: `false`
- `networkDependencyForCommittedTests`: `false`
- `serviceInvocation`: `false`

### Documentation & Artifact Provenance
- `documentationSource`: Astrodienst Swiss Ephemeris documentation
- `documentationDomain`: `astro.com`
- `artifactSource`: GitHub tag archive (`https://github.com/aloistr/swisseph/archive/refs/tags/v2.10.03.tar.gz`)
- `artifactRepository`: `aloistr/swisseph`
- `artifactVersion`: `v2.10.03`
- `artifactAuthorityStatus`: `official_distribution_link_confirmed` (Confirmed via download link on `https://www.astro.com/swisseph/swephinfo_e.htm`)

---

## 3. U.S. Naval Observatory (USNO) Data Service

### Non-Gating Sanity Check Attribution
USNO data services were used for three non-gating sanity checks. USNO values are not required by the runtime, build, CI, or offline regression tests.

- `serviceName`: U.S. Naval Observatory Data Service (REST API v4.0.1)
- `officialDomain`: `aa.usno.navy.mil`
- `comparisonRole`: `non_gating_sanity_check`
