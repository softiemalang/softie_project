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

---

## 4. `emilkowalski/skills` Agent Skill Corpus

### Source and Provenance
- `sourceRepository`: [github.com/emilkowalski/skills](https://github.com/emilkowalski/skills)
- `sourceRef`: `refs/heads/main`
- `sourceRevision`: `78761e1b57f97dce65b983d640c70a68f39e8163`
- `sourceCommitSubject`: `Update README.md`
- `sourceObservedAt`: `2026-08-10T23:18:45Z`
- `sourceScope`: the ten upstream `skills/<skill-name>/` directories only; upstream root README and repository metadata are not installed as skills
- `localRoot`: `.agents/skills/`
- `lockFile`: `skills-lock.json`
- `lockHashRule`: for each skill, sort all regular files by relative path, concatenate each relative path UTF-8 byte sequence immediately followed by that file's raw bytes, then compute SHA-256

The installed corpus contains exactly these upstream directories and companion files:

| Skill | Upstream files retained |
| --- | --- |
| `animate` | `RECIPES.md`, `SKILL.md` |
| `animation-vocabulary` | `SKILL.md` |
| `apple-design` | `SKILL.md` |
| `ask-sonner` | `API.md`, `SKILL.md` |
| `emil-design-eng` | `SKILL.md` |
| `find-animation-opportunities` | `SKILL.md` |
| `improve-animations` | `AUDIT.md`, `PLAN-TEMPLATE.md`, `SKILL.md` |
| `pick-ui-library` | `SKILL.md` |
| `prototype` | `PICKER.md`, `SKILL.md` |
| `review-animations` | `SKILL.md`, `STANDARDS.md` |

### MIT License and Attribution
The upstream `LICENSE` at the pinned revision is MIT-licensed, with copyright attribution to Emil Kowalski. Its full text is retained here for the copied reference corpus:

MIT License

Copyright (c) 2026 Emil Kowalski

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

- `upstreamLicensePath`: `LICENSE`
- `upstreamLicenseSha256`: `4ff5bdb7887ec1435c9cab0e8d1a7caee704d894d65c2a008ccc68b1cc2f260b`
- No upstream skill contents were edited, summarized, or merged into `DESIGN.md`; this is a reference corpus and does not override `AGENTS.md`, `DESIGN.md`, or the current work order.
