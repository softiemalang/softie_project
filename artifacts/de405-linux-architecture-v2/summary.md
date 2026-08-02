# DE405 Linux architecture evidence v2

- Control contract: `de405-linux-architecture-controls-v2`
- Classification: `no_architecture_effect_observed_semantically_matched_linux_userspace`
- Samples/components: 150671/904026
- Differing rows/components: 0/0
- First divergence: none
- ULP max/p50/p95/p99/p999: 0/0/0/0/0
- Absolute difference max/p50/p95/p99/p999: 0/0/0/0/0
- Required mismatches: none
- Architecture-specific differences: architecture, runnerLabel, officialInputs.arm64SourcePort, host.machine, userspace.compilerTarget, cspiceBuild.compilerTarget, cspiceBuild.architecture, cspiceBuild.libraries.cspice.sha256, cspiceBuild.libraries.csupport.sha256, controls.artifactHashes.cspiceLibrary, controls.artifactHashes.csupportLibrary
- Observational differences: host.imageOS, host.imageVersion, host.uname

The result is bounded to the fixed official CSPICE N0067 source, DE405 SPK, canonical-v2 full corpus, and matched Ubuntu/glibc/GCC/Node userspace contract. It does not generalize architecture independence beyond this tested matrix. Raw per-architecture JSONL and provenance remain outside the repository.
