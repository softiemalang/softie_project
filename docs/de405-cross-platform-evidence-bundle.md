# DE405 cross-platform evidence bundle

This diagnostic bundle freezes the current 150,671-row corpus and records all 17,279 canonical-route baseline non-exact cases. It does not modify the numeric contract, tolerance, production route, or authoritative status. Every non-exact cause remains `unresolved`; route-recomposition observations are not causal proof.

Run locally or on Linux x86_64 GCC/Clang with the same entrypoint:

```sh
DE405_SPK=/path/to/de405.bsp CSPICE_DIR=/path/to/cspice/N0067 npm run materialize:de405:cross-platform-evidence
node scripts/check-de405-cross-platform-evidence.mjs
node scripts/check-de405-cross-platform-linux-evidence.mjs
```

The required CSPICE N0067 headers/libraries and the DE405 SPK are external inputs. The materializer builds/runs the diagnostic shadow, normalizes the common target/center suffix, and writes deterministic JSON artifacts. `manifest.json`, `breakdown.json`, `sentinels.json`, and `non-exact-cases.jsonl` contain normalized repository-relative paths; platform/compiler metadata is isolated in `environment.json`. The Apple reference bundle remains frozen. A separate Linux x86_64 GCC/Clang execution/comparison record is stored in `artifacts/de405-cross-platform-evidence/linux-x86_64-comparison.json`; it is emulation-labeled, is not merged into the Apple artifacts, and records full corpus exactness/set differences as portability evidence rather than release validation.
