# DE405 controlled-build triangle evidence

- Final classification: `blocked_linux_arm64_control_unavailable`
- Baseline HEAD: `83220c05e88c9f13a88c6c66502974928125bd9f`
- Apple arm64 rows/components: 150671 / 6
- Linux arm64: blocked; no installed Linux arm64 runtime or emulator
- Linux x86_64: existing Alpine 3.22.1 / musl / QEMU x86_64 evidence

## Pairwise status

- Linux arm64 ↔ Linux x86_64: blocked; architecture effect not isolated.
- macOS arm64 ↔ Linux arm64: blocked; OS effect at fixed arm64 not isolated.
- macOS arm64 ↔ existing Linux x86_64: observed but mixed; existing provenance requires recheck.

The Apple controlled-build variants are persisted by normalized provenance and raw-output hashes under the generated artifact directory. No production route, tolerance, or public contract changed.

This triangle record is preserved as a historical controlled-build snapshot: its Linux arm64 control remains blocked and its existing Linux x86_64 comparison remains mixed/emulation-labeled. It is superseded for the narrower canonical-v2 cross-environment question by native matrix run `30768814210`, which tested Ubuntu glibc/GCC and Alpine musl GCC/Clang on native x64 and established bitwise identity for all three pairs. This does not rewrite the triangle classification or claim a universal platform theorem.
