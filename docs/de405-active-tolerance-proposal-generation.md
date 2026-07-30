# DE405 Active Tolerance Proposal Generation and Freshness Validation

This document describes the official generation and freshness validation workflow for DE405 active-tolerance proposals.

## 1. Overview

The proposal generator constructs a deterministic, machine-readable active tolerance proposal (`schemaVersion: 2`) from residual sweep evidence artifacts.
The freshness validator checks whether an existing proposal artifact remains synchronized with the current underlying evidence chain.

**Important**: Proposal generation creates a candidate document reflecting evidence state. It **does not** approve tolerances, alter canonical selections, modify contracts, or perform active transitions. Actual artifact materialization in the repository is a separate user-approved step.

---

## 2. Generator Role and Input Contracts

The generator script is:

```text
scripts/generate-de405-active-tolerance-proposal.mjs
```

Package script entry point:

```bash
npm run generate:de405:tolerance-proposal -- --output <path>
```

### Input Roles (10 explicit files)

| Role | Default Path | Description |
|---|---|---|
| `candidateSource` | `docs/de405-active-tolerance-candidate.json` | Project-owned candidate tolerance definition (tracked source of truth) |
| `summary` | `artifacts/de405-jpl-cspice-residual-sweep.summary.json` | Sweep evaluation summary and source sample counts |
| `manifest` | `artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl` | Primary evaluation sample manifest |
| `samples` | `artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl` | Evaluated residual sample records |
| `classifications` | `artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl` | Residual evidence classifications |
| `classificationSummary` | `artifacts/de405-jpl-cspice-residual-sweep.classification-summary.json` | Provenance hashes for classification inputs |
| `candidateEvidence` | `artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl` | Phase-D candidate state evidence |
| `investigation` | `artifacts/de405-jpl-cspice-out-of-coverage-investigation.json` | Out-of-coverage root cause investigation |
| `phaseSummary` | `artifacts/de405-jpl-cspice-phase-c-summary.json` | Phase completion status summary |
| `worstCase` | `artifacts/de405-jpl-cspice-residual-sweep.worst-case-reproduction.json` | Verified worst-case error reproduction |

---

## 3. Candidate Values vs Derived Evidence Metrics

Candidate tolerance specification parameters (`proposals` definitions and `platformScope`) are read from `--candidate-source` using a strict allowlist.

Derived evidence metrics (`worstCase` sample statistics and `headroomComparison` distribution percentiles) are **not inherited from candidate source**, because copying stale evaluation statistics would introduce internal contradictions into new v2 proposal outputs. Instead, derived metrics are computed or extracted from current evidence artifacts (`worst-case-reproduction.json` and `summary.json`).

The generator **never inherits** the following from `--candidate-source`:
- Derived sweep statistics (`worstCase` sample IDs/metrics, `headroomComparison` percentiles)
- File size, SHA-256 hashes, or sample counts
- Source paths or provenance references
- Blockers or proposal status
- Out-of-coverage or unresolved counts
- Execution timestamps or generator identities
- Active transition or approval state

All blockers and proposal status values are computed deterministically from the raw evidence artifacts during preflight.

---

## 4. Preflight Verification Conditions

Before output is created, the generator verifies:
1. **File Integrity**: All 10 input files exist, are non-empty, and parse cleanly.
2. **Count Consistency**: Manifest record count equals samples record count and summary sample count.
3. **Classification Integrity**: Classification summary input hashes match current manifest/samples/classifications.
4. **Evidence Mapping**: Candidate evidence sample IDs map 1:1 with unresolved classifications.
5. **Investigation Alignment**: Investigation case count matches out-of-coverage classification count.
6. **Phase & Reproduction Status**: Phase status is `complete` and worst-case reproduction is `verified`.

If any preflight check fails, the generator aborts without writing an output file.

---

## 5. Determinism and Overwrite Policies

- **Determinism**: Outputs use schema version `2`, sorted JSON keys, 2-space indentation, UTF-8 encoding, and a single trailing newline (`\n`). Wall-clock timestamps (`generatedAt`), absolute paths, and mtime are excluded. Re-running the generator on identical inputs yields byte-identical output with matching SHA-256.
- **Overwrite Protection**: If the target output file already exists, the generator exits with error `output_exists`. Overwriting requires an explicit `--force` flag, which writes atomically to a temporary staging file before replacement.

---

## 6. Freshness Validator Contract

The freshness validator script is:

```text
scripts/check-de405-active-tolerance-proposal-freshness.mjs
```

Package script entry point:

```bash
npm run check:de405:tolerance-proposal
```

### Exit Codes

| Exit Code | Status | Meaning |
|---|---|---|
| `0` | `fresh` | Proposal proposal matches current source evidence sizes, SHA-256 hashes, counts, and status. |
| `2` | `stale` | Proposal recorded hashes, sizes, counts, blockers, or provenance do not match current evidence. |
| `1` | `invalid` | Proposal file missing, invalid JSON, or unsupported schema version. |

Machine-readable JSON output can be requested via `--json`:

```bash
npm run check:de405:tolerance-proposal -- --json
```

---

## 7. Generation vs. Approval Boundary

Generating a proposal proposal records candidate tolerance payload alongside verified evidence provenance.

Proposal generation:
- Does **not** activate candidate tolerances.
- Does **not** set `activeTransition` to true.
- Does **not** modify contract files or canonical selection logic.
- Does **not** replace existing proposal artifacts in `artifacts/` without explicit authorization.
