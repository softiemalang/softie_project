# DE405 artifact storage policy

## Purpose

The untracked `artifacts/` directory contains several different things: sweep inputs, large raw comparison outputs, derived research evidence, checkpoints, and local desktop metadata. Treating every file as a repository file would add roughly 600 MB of high-churn generated data to Git. Ignoring every file would lose the distinction between reproducible output, externally retained evidence, and unresolved provenance. This policy records that boundary without moving, deleting, ignoring, or regenerating any artifact.

The machine-readable inventory is [`docs/de405-artifact-inventory.json`](./de405-artifact-inventory.json). It records the exact current file bytes, SHA-256 values, producer evidence, references, and proposed action.

## Current inventory

Inventory source commit: `111281e5be0e15f4d81e965463d0685bf386a502`.

| Storage class | Files | Bytes |
|---|---:|---:|
| `repository` | 0 | 0 |
| `external` | 0 | 0 |
| `generated` | 15 | 623,792,183 |
| `pending` | 3 | 8,676 |
| **Total** | **18** | **623,800,859** |

The largest file is `artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl` at 280,780,522 bytes. The three `pending` files are `de405-jpl-cspice-active-tolerance-proposal.json`, `de405-jpl-cspice-residual-sweep.classification-summary.json`, and `de405-jpl-cspice-residual-sweep.worst-case-reproduction.json`. The generated selection trace and project-owned SPK record probe are deterministic diagnostic evidence and do not promote a selection, tolerance, or scientific approval state. OS and file-manager metadata such as `.DS_Store` and `Thumbs.db` are outside this inventory, materialization, and readiness contract; their presence does not affect readiness.

The sweep summary reports `complete_sweep_with_evidence_failures`, 1,701 unresolved selections, and an unchanged active tolerance contract. The inventory therefore does not treat any sweep output as canonical approval evidence.

## Storage classes

### `repository`

Use only for a small, deterministic source, contract, fixture, or provenance manifest that a fresh clone must contain and that is meaningful to review in Git. No current artifact meets all of those conditions.

### `external`

Use for official evidence that must be retained, is expensive or impossible to regenerate, is unsuitable for ordinary Git, and is not needed by default runtime/build/test. A future external record must include a stable external location, exact hash, provenance, and materialization procedure. The proposed local evidence root is `$HOME/.local/share/softie-de405/artifacts/`; this task does not create or modify it.

### `generated`

Use for outputs with a confirmed command or pipeline, where the output is not canonical and a later run can recreate it. Most current files are conditionally reproducible because they require the external DE405 SPK, the JPL binary, and/or CSPICE N0067. Large JSONL rows and checkpoints belong here; they should not be added to Git as part of this task.

### `pending`

Use when the producer, exact input identity, canonical-versus-derived role, or safe disposition is unresolved. Pending is an explicit hold state: do not delete, move, ignore, or promote these files until the missing evidence is resolved.

## Test dependency

The default command is `npm test` (`node scripts/run-default-tests.mjs`) and is artifact-independent. Its deterministic discovery recursively includes every `*.test.js` under `test/` except `test/de405-artifacts/`; artifact-backed tests are run explicitly with `npm run test:de405:artifacts`, after `npm run check:de405:artifacts` confirms that the generated inputs are present and byte-valid. Use `npm test -- --list` to inspect the selected default files.

`npm run check:de405:artifacts` reports the resolved artifact root, generated-file counts, pending count, deterministic missing paths, size/hash mismatches, and one of `ready`, `blocked_missing_de405_artifacts`, or `blocked_pending_de405_artifact_contract`. It exits `0` only for `ready`, and exits `3` for a blocked state. The JSON form is available with `-- --json`.

The readiness and test commands never download, generate, modify, delete, or move artifact files. A missing artifact is reported with its path and the preparation document rather than as a raw `ENOENT`.

OS and file-manager metadata such as `.DS_Store` and `Thumbs.db` are outside the DE405 artifact inventory, materialization target, and readiness contract. Their presence never changes readiness and must not be confused with official evidence, manifests, summaries, or checkpoints.

Runtime and build code do not require these files. The overlap runner and Phase-C generator use them as generated inputs/outputs for specialized research validation. The test contract should be addressed in a separate, explicitly scoped task before generated outputs are ignored or externalized.

## Clone behavior

After `npm install`, a fresh clone can run `npm test` without `artifacts/`. `npm run check:de405:artifacts` will report `blocked_missing_de405_artifacts` until the generated files are materialized. `npm run test:de405:artifacts` reports the same blocked state and preparation guidance; it does not silently pass.

## Recommended follow-up actions

- `repository`: no current selection. In a later task, only deliberately selected small contracts or provenance manifests may be staged; preserve external evidence hashes and provenance there.
- `external`: define the external location and materialization procedure, then verify SHA-256 before and after any authorized transfer. No external copy was made here.
- `generated`: add narrowly scoped ignore/materialization rules only after the default-test contract is made explicit. Keep the confirmed regeneration commands and external input identities in documentation.
- `pending`: resolve producer and input provenance first. Do not delete, move, ignore, or promote the three pending files.

## Scope and non-actions

This policy work preserves the inventory and pending states. The test contract adds only the artifact resolver/readiness boundary and explicit commands; it does not modify files under `artifacts/`, `.git/info/exclude`, tolerance values, canonical selection, external data, or database/deployment state.

## Working-tree boundary (2026-08-03)

The working tree snapshot was `main` at `bade86f6181bc18f7197ca1493426d31aa7d1df4`, with `main...origin/main = 0 0`, no staged files, and the user-owned `package.json` Strategy-C change. Before this boundary was applied:

| class | files | lines | bytes | status |
|---|---:|---:|---:|---|
| untracked DE405 artifacts | 106 | 897,102 | 661,288,532 | retained, now ignored |
| untracked Strategy-C source/test/tool files | 21 | 1,199 | 103,994 | retained, visible |
| tracked source change (`package.json`) | 1 | +12/-0 | — | retained, visible |

The resulting `+898,313` is therefore `897,102 + 1,199 + 12`; it is not a tracked source diff. The four largest contributors are the retained raw sweep files `artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl` (150,671 lines, 280,780,522 bytes), `.jpl.jsonl` (150,671, 169,710,274), `.cspice.jsonl` (150,671, 79,915,561), and `.manifest.jsonl` (150,671, 63,738,094). They contribute 602,684 lines and 594,144,451 bytes.

### Classification and location rules

- `intentional_source_change` is tracked source/config/test work such as `package.json`; preserve it and do not hide or restore it.
- `reproducible_generated` includes DE405 JSON/JSONL/Markdown reports and checkpoints produced by the commands recorded in `package.json` and the producer scripts. These remain in `artifacts/`, are preserved for validation, and are ignored by the narrow `/artifacts/de405-*` rules above; tracked files remain visible and trackable.
- `required_runtime` includes the canonical BSP, JPL input, CSPICE/native runners, and their build metadata. Keep the canonical runtime in its existing paths; the existing exact rules for BSP, `JPLEPH`, and native build directories do not move or delete them.
- `required_raw_evidence` includes the residual-sweep streams, route events, and source/provenance evidence that current checkers and analysis scripts consume. Preserve the unique bytes in the repository artifact paths or, when externally archived, under `$HOME/.local/share/softie-de405/artifacts/` with a manifest and SHA-256. Ignoring is not deletion and does not change consumer paths.
- `duplicate_archive` is assigned only when an exact hash match has a verified canonical replacement and no provenance or consumer role is lost. Five same-hash groups were observed, but none was removed because byte equality alone did not establish that boundary.
- `temporary_output` is limited to explicitly identified, terminated, task-owned paths outside this repository; no such path was deleted or moved in this working-tree operation.
- `unknown_or_user_owned` includes the 21 untracked Strategy-C scripts, test, and native integration files. They remain unignored and untouched.

The ignore rules are intentionally limited to the DE405 artifact filename family and checkpoint directory. They do not cover source, tests, native source, runtime inputs, tracked artifacts, or arbitrary caches. `git check-ignore -v` confirms the rules apply to retained generated artifacts; ignored files remain addressable by the existing artifact checkers and scripts. No file was deleted, moved, compressed, untracked, staged, committed, pushed, deployed, or changed in a remote database.
