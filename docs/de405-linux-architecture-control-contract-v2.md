# DE405 Linux architecture control contract v2

The v2 contract separates arithmetic reproducibility controls from architecture selection and hosting provenance. It is used only for reanalysis of the existing raw x64/arm64 evidence; it does not change the production calculation route.

## Required identical invariants

These are direct calculation inputs, runtime controls, or byte identities. A mismatch blocks semantic interpretation:

- expected HEAD, `refs/heads/main`, and workflow identity;
- sample archive identity and official CSPICE N0067 / DE405 SPK / extracted source-manifest identities;
- Ubuntu release, glibc banner/version, compiler family/version, and Node version;
- CSPICE and runner flags, locale, timezone, wrapper, and serialization;
- runner/source/input hashes, output row identity, row count, result hash, and line ending.

## Architecture-specific fields

These identify the selected architecture or its independently compiled output and are expected to differ: runner label, machine architecture, compiler target, arm64 source-port marker, CSPICE build architecture, and architecture-specific compiled library hashes. They are compared and recorded, but are not treated as cross-architecture invariant mismatches.

## Observational non-blocking metadata

`host.imageOS`, `host.imageVersion`, `host.uname`, and the image build identity describe the hosting VM/kernel. They remain in provenance and are audited, but do not define the semantic userspace fingerprint when the required userspace contract matches.

The current evidence is sufficient for this defined semantic contract: Ubuntu 24.04.4, glibc 2.39, GCC 13.3.0, Node v22.23.1, source/input hashes, flags, and output identity match. Future workflow hardening should additionally capture binutils and linker versions/flags and libc package name/version/architecture; those values are not retroactively inferred from the raw evidence.

The conclusion is bounded to the fixed official CSPICE N0067 source, DE405 SPK, canonical-v2 full corpus, and the observed Ubuntu 24.04.4/glibc 2.39/GCC 13.3.0 matrix. It does not claim that architecture can never affect results.
