# DE405 Linux architecture evidence

This is a manual `workflow_dispatch` pipeline. It compares the tracked
canonical-v2 CSPICE runner on `ubuntu-24.04` (`x64`) and
`ubuntu-24.04-arm` (`arm64`). Both jobs use GCC, `-std=c11 -O2
-ffp-contract=off -Wall -Wextra -Werror`, `C.UTF-8`, and UTC. The workflow
does not install packages, use emulation, access secrets, or modify production
data.

Before dispatching, provide an immutable public GitHub asset URL and its
SHA-256. The archive must contain the sample JSONL corpus, `de405.bsp`, and
the full CSPICE N0067 source tree (`src/cspice` and `src/csupport`) under the
workflow input paths. The workflow builds CSPICE on each runner; prebuilt
architecture-specific libraries are not accepted. It is downloaded without a token,
restricted to GitHub asset hosts, and verified independently on both runners.
This preserves the `contents: read`-only and no-secret contract. Raw per-arch
JSONL and provenance remain short-lived Actions artifacts; the collector emits
only a small JSON/Markdown summary artifact.

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
