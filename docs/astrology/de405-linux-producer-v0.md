# DE405 Linux producer artifact v0

## Scope

`.github/workflows/de405-linux-producer-v0.yml` is the reproducible build path
for the existing CSPICE overlap producer. It runs only as a manual
`workflow_dispatch` on `main`, on GitHub-hosted `ubuntu-24.04` x64, with Node
`22.23.1` installed through a SHA-pinned setup action. It is not a
Vercel Function, browser/WASM path, production activation, or public release.

The workflow binds checkout `HEAD` to `GITHUB_SHA`, acquires the official
inputs over HTTPS, verifies their fixed identities, builds from source, and
builds the complete payload twice before packaging it. No provider is fetched
at runtime and no Mach-O binary is converted.

## Fixed source identity

| Input | Identity |
| --- | --- |
| CSPICE | NAIF PC/Linux/GCC/64-bit N0067; `https://naif.jpl.nasa.gov/pub/naif/toolkit//C/PC_Linux_GCC_64bit/packages/cspice.tar.Z`; archive SHA-256 `60a95b51a6472f1afe7e40d77ebdee43c12bb5b8823676ccc74692ddfede06ce`; full extracted source-manifest SHA-256 `9921db7667b999253d78bf814c93fda76bb04169abfa2a583d6eecffb43fb229` (2,547 entries); C-only build-manifest SHA-256 `54a50975a8ea536bd5fc18add2d2fe481c35aaba07bebc1bcc630b76ba8925f1` (2,439 entries) |
| DE405 BSP | Official unmodified `de405.bsp`; `https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp`; 10,898,432 bytes; SHA-256 `30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89` |

The CSPICE-built provider remains `independent_cross_reference` with
`overlap_only` coverage and `canonicalEligible: false`. Its coverage is
recorded as ET `-1.5778799588160586e+09` through `1.5778800641839132e+09`,
validated by `spkobj_c+spkcov_c` in N0067. The existing JPL full-range primary
contract is not changed or mixed with this artifact.

## Payload and checks

`build-de405-linux-producer-v0.mjs` creates one versioned directory containing
the Linux x64 ELF runner, compiled CSPICE libraries, the exact BSP, the full
source identity manifest, build provenance, and a fresh Astrology golden
packet. It does not include the CSPICE source tree. The manifest preserves the
runner source SHA, compiler target, flags, source/provider identity, coverage,
file hashes, payload hash, and self-integrity hash.

The golden packet is regenerated from the existing synthetic fixture
`synthetic-de405-golden-2000-01-01T12:00:00Z` and must match the current Mac
reference evidence file byte-for-byte, including the canonical packet SHA-256
`afabd5542479d761657f461050df649102843b867d6b985be2a274e2b3209aa`, raw chart,
and Rule Core objects. It retains
`availableForInterpretation: false` and `integrationStatus: not_connected`.
No semantic meaning, True Node, personalisation, handoff activation, or
interpretation result is added.

`check-de405-linux-producer-artifact.mjs` checks the fresh directory or the
deterministic archive. It fails closed for missing/extra files, unsafe archive
entries, provider or source-manifest identity changes, file tampering,
manifest tampering, runner version/ELF ABI mismatch, coverage mismatch,
Astrology canonical packet/numerical mismatch, and activation-boundary changes.

The workflow makes two sorted, owner-normalized, no-mtime archives and compares
them byte-for-byte. The uploaded artifact is named by the source commit and is
retained for 14 days through GitHub Actions only; it is not published as a
GitHub Release.

## Remaining gate

This checkout is macOS arm64, so it cannot execute the Linux x64 build or
produce the CI artifact locally. A workflow run on the current commit is still
required to close the Linux compilation, fresh archive consumption, and Mac ↔
Linux golden parity gates. The artifact manifest therefore marks distribution
as `internal_ci_only_pending_external_review`; public/export/compliance
clearance for bundling compiled CSPICE and the BSP remains a separate blocker.
Vercel producer readiness and Astrology activation remain unchanged until that
CI evidence and any later deployment review are complete.
