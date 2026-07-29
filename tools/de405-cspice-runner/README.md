# DE405 Canonical v2 CSPICE runner

Build with `CSPICE_DIR=/path/to/CSPICE/N0067 npm run de405:v2:build-runner`.
The binary is intentionally untracked. It uses CSPICE N0067 and `spkez_c` with
observer 399, frame J2000, and aberration correction NONE. In addition to the
existing smoke and coverage modes, it can emit a raw Type 2 sweep manifest and
evaluate that manifest in one process:

```bash
de405-canonical-v2-runner --emit-spk-type2-sweep-manifest --spk /path/to/de405.bsp
de405-canonical-v2-runner --evaluate-spk-type2-batch --spk /path/to/de405.bsp \
  --input-jsonl sweep.manifest.jsonl --output-jsonl cspice.states.jsonl
```

The batch evaluator opens the BSP and discovers segments once. It preserves
`sampleId` and `queryEtHex`, records selected Type 2 record evidence, and emits
row-level `verified`, `selection_ambiguous`, or `out_of_coverage` statuses. These
statuses are evidence outcomes and do not activate the overlap tolerance contract.
