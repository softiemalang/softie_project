# DE405 artifact materialization

This document fixes the preparation contract for the current inventory without running a full materialization.

## Test discovery and verified baseline

The baseline commit for this investigation is `51f2a36c5b442784e7b90053b23147e4a5de2ef0` (`docs: define de405 artifact storage policy`), verified on `main` with Node `v22.20.0` and npm `10.9.3`. At that commit, the existing `npm test` script was exactly `node --test`, so Node's default discovery was the execution contract. A controlled temporary fixture confirmed that this Node version discovers root `*.test.mjs`/`*.test.cjs`, files under `test/` and `tests/` including non-`.test.js` names, and root `*.test.js`; it did not discover the `__tests__/` fixture in that experiment. The current project has no unclassified actual test outside the explicit suites.

The archived baseline snapshot ran `node --test` as `345 tests`: `328 passed`, `17 failed`, `0 skipped`, `0 cancelled`, and `0 todo`. The 17 failures were artifact-dependent DE405 tests because the tracked snapshot did not contain the untracked local `artifacts/` directory. Therefore the previously reported `347-test` result was not reproduced in this environment; no historical Node version, external runner, or other evidence explaining the two-test difference was found in the inspected package/test history. This is not treated as proof that the historical report was incorrect.

The verified baseline for the current suite contract is:

| Suite | Files | Tests | Result |
|---|---:|---:|---|
| Default | 54 | 256 | 256 passed |
| Artifact | 2 | 4 | 4 passed |
| Total | 56 | 260 | 260 passed |

The previous `56 + 2 = 58` file count mixed measurements from different working-tree states. Two new default-suite regression files were counted while two existing DE405 tests had already moved from the default suite into the artifact suite: `test/de405ArtifactReadiness.test.js`, `test/testSuitePartition.test.js`, `test/de405ManifestCoverage.test.js`, and `test/de405PhaseCEvidence.test.js`. The current unique file baseline is therefore `54 + 2 = 56`. The suites are disjoint, deterministically sorted, and contain all actual repository test files exactly once. The current suite uses explicit recursive `*.test.js` discovery under `test/`, excluding only `test/de405-artifacts/`; artifact tests are run separately after readiness succeeds. The baseline commit and Node version above are part of this verification record.

## Commands

```bash
npm install
npm test
npm run check:de405:artifacts
npm run test:de405:artifacts
```

`npm test` is independent of `artifacts/` and recursively discovers sorted `*.test.js` files under `test/`, excluding only `test/de405-artifacts/`. Use `npm test -- --list` to print the exact default file list. The readiness command is read-only and exits `0` only when every required generated artifact is present with the inventory size and SHA-256. Missing generated files produce `blocked_missing_de405_artifacts` and exit `3`; missing pending files produce `blocked_pending_de405_artifact_contract` and exit `3`. Use `npm run check:de405:artifacts -- --json` for machine-readable output. Set `DE405_ARTIFACT_ROOT` or pass `-- --artifact-root PATH` to use another root; an explicit CLI root wins over the environment and `artifacts/`.

The artifact-backed tests are separate from the default suite. `npm run test:de405:artifacts` performs readiness first, then recursively discovers only `*.test.js` under `test/de405-artifacts/` and passes the sorted explicit file list to Node. It reports the root and preparation document when blocked.

OS and file-manager metadata such as `.DS_Store` and `Thumbs.db` are not inventory or materialization inputs. They are ignored by this contract for readiness purposes and do not affect a ready or blocked result.

## Generated files

The 10 DE405 generated files with confirmed script producers are prepared by these existing commands:

| Files | Producer and command | Inputs / dependencies | Cost and ordering |
|---|---|---|---|
| `de405-jpl-cspice-residual-sweep.manifest.jsonl`, `.jpl.jsonl`, `.cspice.jsonl`, `.samples.jsonl`, `.summary.json`, `de405-sweep-checkpoints/checkpoint.json` | `scripts/run-de405-jpl-cspice-residual-sweep.mjs`; `npm run de405:overlap:sweep` (resume checkpoint with `-- --resume`) | DE405 SPK, `tools/de405-jpl-reader/fixtures/lnxp1600p2200.405`, built JPL/CSPICE runners, sweep contract | Large. Manifest and both runner outputs precede merge; checkpoint is resumable state. Full residual sweep is required. |
| `de405-jpl-cspice-candidate-state-evidence.jsonl`, `de405-jpl-cspice-out-of-coverage-investigation.json`, `de405-jpl-cspice-phase-c-summary.json`, `de405-jpl-cspice-residual-sweep.classifications.jsonl` | `scripts/generate-de405-phase-c-evidence.mjs`; `node scripts/generate-de405-phase-c-evidence.mjs` | The completed sweep manifest, samples, classifications, JPL binary, DE405 SPK, and built CSPICE runner | Medium to large. Run after the sweep inputs exist; native runners and external inputs are required. |

The inventory contains 10 generated DE405 files and 3 pending files. OS metadata is not counted as a generated entry and has no producer contract.

No orchestration command is added because the existing producers have different external inputs, native runner prerequisites, resume semantics, and large/full-sweep cost. The existing producer commands above are the authoritative preparation steps. This task does not execute them.

## Safety and pending files

Existing files are never overwritten by a new orchestration layer; readiness is read-only. The three pending files remain untouched and are not generated, deleted, moved, ignored, or promoted:

| File | Producer status | Action |
|---|---|---|
| `de405-jpl-cspice-active-tolerance-proposal.json` | unknown | preserve pending |
| `de405-jpl-cspice-residual-sweep.classification-summary.json` | unknown | preserve pending |
| `de405-jpl-cspice-residual-sweep.worst-case-reproduction.json` | unknown | preserve pending |

The proposed external path `/Users/softie/.local/share/softie-de405/artifacts/` is not created or modified here. No tolerance, canonical-selection, runner-calculation, dependency, ignore, or storage policy is changed by materialization.
