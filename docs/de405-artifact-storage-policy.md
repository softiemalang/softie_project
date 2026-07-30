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
| `generated` | 11 | 600,134,254 |
| `pending` | 3 | 103,649 |
| **Total** | **14** | **600,237,903** |

The largest file is `artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl` at 280,780,522 bytes. The three `pending` files are `de405-jpl-cspice-active-tolerance-proposal.json`, `de405-jpl-cspice-residual-sweep.classification-summary.json`, and `de405-jpl-cspice-residual-sweep.worst-case-reproduction.json`.

The sweep summary reports `complete_sweep_with_evidence_failures`, 1,701 unresolved selections, and an unchanged active tolerance contract. The inventory therefore does not treat any sweep output as canonical approval evidence.

## Storage classes

### `repository`

Use only for a small, deterministic source, contract, fixture, or provenance manifest that a fresh clone must contain and that is meaningful to review in Git. No current artifact meets all of those conditions.

### `external`

Use for official evidence that must be retained, is expensive or impossible to regenerate, is unsuitable for ordinary Git, and is not needed by default runtime/build/test. A future external record must include a stable external location, exact hash, provenance, and materialization procedure. The proposed local evidence root is `/Users/softie/.local/share/softie-de405/artifacts/`; this task does not create or modify it.

### `generated`

Use for outputs with a confirmed command or pipeline, where the output is not canonical and a later run can recreate it. Most current files are conditionally reproducible because they require the external DE405 SPK, the JPL binary, and/or CSPICE N0067. Large JSONL rows and checkpoints belong here; they should not be added to Git as part of this task.

### `pending`

Use when the producer, exact input identity, canonical-versus-derived role, or safe disposition is unresolved. Pending is an explicit hold state: do not delete, move, ignore, or promote these files until the missing evidence is resolved.

## Test dependency

The current default command is `npm test` (`node --test`). It passed locally with 347 tests and 0 failures while this untracked directory was present. The suite is nevertheless `environment_dependent`, not `independent`: `test/de405ManifestCoverage.test.js` directly reads the sweep manifest, and `test/de405PhaseCEvidence.test.js` directly reads candidate evidence and the out-of-coverage investigation. A fresh clone without materialized artifacts is therefore expected to fail those direct reads rather than skip them. This task records the dependency and does not change the tests.

Runtime and build code do not require these files. The overlap runner and Phase-C generator use them as generated inputs/outputs for specialized research validation. The test contract should be addressed in a separate, explicitly scoped task before generated outputs are ignored or externalized.

## Recommended follow-up actions

- `repository`: no current selection. In a later task, only deliberately selected small contracts or provenance manifests may be staged; preserve external evidence hashes and provenance there.
- `external`: define the external location and materialization procedure, then verify SHA-256 before and after any authorized transfer. No external copy was made here.
- `generated`: add narrowly scoped ignore/materialization rules only after the default-test contract is made explicit. Keep the confirmed regeneration commands and external input identities in documentation.
- `pending`: resolve producer and input provenance first. Do not delete, move, ignore, or promote the three pending files.

## Scope and non-actions

This policy work created only the inventory and policy documents. It did not modify files under `artifacts/`, `.gitignore`, `.git/info/exclude`, scripts, runners, tests, tolerance values, canonical selection, external data, or database/deployment state. No staging, commit, push, or deploy was performed.
