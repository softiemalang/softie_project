# DE405 historical evidence reconciliation

The historical Alpine record used the same 150,671 sample/SPK/canonical hash identity and was reproducible, but it compared a shadow baseline/candidate and canonical-route recomposition stream. It did not preserve an ordered Apple/Linux pairwise canonical-v2 raw state stream, so a cross-platform arithmetic first divergence cannot be claimed from that artifact.

The historical execution was Alpine 3.22.1/musl, x86_64 under QEMU x86_64 on Darwin arm64. GCC 14.2.0 and Clang 20.1.8 were both reported, but the Clang shadow used GCC-built CSPICE archives. The recorded 54,789 Linux candidate mismatches and 62,025 Linux baseline non-exact rows therefore remain mixed OS/libc/compiler/linkage/emulation evidence, not a general platform-sensitivity result.

The current official-source Apple and Ubuntu x64/arm64 canonical-v2 evidence has result SHA-256 `07b51b47dee7042056f7b127886e93f7f0d84283348d5a941f8be27ca65ac08b`, 150,671 rows, and zero differing components. The Ubuntu x64/arm64 conclusion is bounded to its matched Linux userspace contract. It does not retroactively invalidate the historical record; it narrows its valid scope.

Run `node scripts/reconcile-de405-historical-evidence.mjs` for the fail-closed reconciliation checker. The new manual workflow `.github/workflows/de405-legacy-native-matrix.yml` compares an Ubuntu glibc control with native x64 Alpine GCC and Clang variants. QEMU is forbidden. Raw JSONL stays in Actions artifacts; only the deterministic summary is produced by the collector.
