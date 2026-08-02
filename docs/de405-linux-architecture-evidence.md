# DE405 Linux architecture evidence

This is a manual `workflow_dispatch` pipeline. It compares the tracked
canonical-v2 CSPICE runner on `ubuntu-24.04` (`x64`) and
`ubuntu-24.04-arm` (`arm64`). Both jobs use GCC, `-std=c11 -O2
-ffp-contract=off -Wall -Wextra -Werror`, `C.UTF-8`, and UTC. The workflow
does not install packages, use emulation, access secrets, or modify production
data.

Before dispatching, provide the existing immutable public GitHub sample-only
asset URL and its SHA-256. The archive contains only the project-generated
sample JSONL corpus and its manifest. Each architecture job independently
acquires the official CSPICE N0067 source and `de405.bsp` directly from NAIF,
verifies their fixed hashes, and builds CSPICE on that runner; prebuilt
architecture-specific libraries are not accepted. The sample asset is
downloaded without a token, restricted to GitHub asset hosts, and verified
independently on both runners. This preserves the `contents: read`-only and
no-secret contract. Raw per-arch JSONL and provenance remain short-lived
Actions artifacts; the collector emits only a small JSON/Markdown summary
artifact.

The analyzer rejects mismatched source/input hashes, userspace/compiler/flags,
locale, timezone, wrapper, serialization, row identity, or result provenance
before assigning architecture sensitivity. It records first divergence,
component, ULP, absolute difference, and max/quantile statistics. Missing or
mixed controls remain `blocked_reproducible_linux_userspace_unavailable`.

No container is used because no immutable multi-architecture image was
available in the local environment. The workflow instead records the exact
GitHub runner image identity (`ImageOS`/`ImageVersion`) and fails closed unless
both architectures report the same Ubuntu userspace, compiler family/version,
libc identity, flags, locale, timezone, and source/input hashes.

The successful dispatch `30748663327` was materialized into
`de405-linux-architecture-summary.json` and `.md` after byte-identical local
reanalyzer verification. Its fail-closed classification is
`blocked_reproducible_linux_userspace_unavailable`: the x64 and arm64 jobs
used different GitHub image identities, so architecture sensitivity is not
claimed. The raw per-architecture artifacts remain outside the repository.
