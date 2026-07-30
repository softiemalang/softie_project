# DE405 Classification Summary Generation and Freshness Validation

This document describes the official generation and freshness validation workflow for DE405 sweep classification summary artifacts.

## 1. Overview

The classification summary artifact (`artifacts/de405-jpl-cspice-residual-sweep.classification-summary.json`) summarizes the residual evidence classification results across all evaluated samples and records strict input provenance (file size, SHA-256 hashes, record counts).

The proposal generator requires a verified fresh classification summary during preflight before generating active tolerance proposals. If the classification summary is stale relative to current evidence files, proposal generation is blocked.

**Important**: Generating or validating a classification summary:
- Does **not** approve candidate tolerances.
- Does **not** execute active transitions.
- Does **not** resolve canonical selection ambiguities.
- Does **not** overwrite repository artifacts in `artifacts/` without explicit user authorization.

```text
Fresh classification summary
≠ tolerance approval
≠ active transition
≠ canonical selection resolution
```

---

## 2. Generator Role and Input Contracts

The generator script is:

```text
scripts/generate-de405-classification-summary.mjs
```

Package script entry point:

```bash
npm run generate:de405:classification-summary -- --output <path>
```

### Input Roles (4 explicit files)

| Role | Default Path | Description |
|---|---|---|
| `summary` | `artifacts/de405-jpl-cspice-residual-sweep.summary.json` | Sweep evaluation summary |
| `manifest` | `artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl` | Primary evaluation sample manifest |
| `samples` | `artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl` | Evaluated residual sample records |
| `classifications` | `artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl` | Raw evidence classifications |

---

## 3. Sample Count vs Classification Count

- **Residual Sample Count** (`150,671`): Total number of evaluation sample points in the residual sweep (`manifest.jsonl` and `samples.jsonl`).
- **Classification Record Count** (`1,701`): Number of unresolved or evidence-classified sample records requiring deeper candidate analysis (`classifications.jsonl`).

The summary records both total residual sample count (`sourceSampleCount`) and classification record counts, ensuring count semantics remain distinct.

---

## 4. Preflight Verification Conditions

Before output is generated, preflight verifies:
1. **File Integrity**: All 4 input files exist, are regular files, non-empty, and parse cleanly.
2. **Residual Sample Count**: Manifest record count equals samples record count and summary sample count.
3. **Identity Mapping**: 1:1 match between manifest sample IDs and samples sample IDs with zero duplicates.
4. **Classification Identity**: Each classification row has a valid sample ID present in the manifest/samples with zero duplicate classification IDs.
5. **Totals Aggregation**: Category totals (`candidate_state_different`, `state_equivalent_selection_different`, etc.) are computed directly from raw classifications.

If preflight fails, the generator aborts without writing an output file.

---

## 5. Determinism and Overwrite Policies

- **Determinism**: Output JSON uses 2-space indentation, UTF-8 encoding, LF newlines, fixed key ordering, and sorted category keys. Wall-clock timestamps, local machine paths, and random execution IDs are excluded. Re-running the generator on identical input byte sequences produces byte-identical output with matching SHA-256.
- **Overwrite Protection**: If the target output file exists, the generator exits with error `output_exists`. Overwriting requires `--force`, which writes to a temporary staging file before performing an atomic rename.

---

## 6. Freshness Validator Contract

The freshness validator script is:

```text
scripts/check-de405-classification-summary-freshness.mjs
```

Package script entry point:

```bash
npm run check:de405:classification-summary
```

### Exit Codes

| Exit Code | Status | Meaning |
|---|---|---|
| `0` | `fresh` | Summary provenance (sizes, SHA-256 hashes, record counts, category totals) matches current source files. |
| `2` | `stale` | Summary recorded hashes, sizes, counts, or provenance mismatch current source files. |
| `1` | `invalid` | Summary file missing, invalid JSON, or unsupported schema version. |

Machine-readable JSON output can be requested via `--json`:

```bash
npm run check:de405:classification-summary -- --json
```

---

## 7. Downstream Impact on Proposal Generation

The proposal generator checks classification summary inputs (`manifestSha256`, `samplesSha256`, `classificationSha256`). If the classification summary is stale, proposal generation aborts at preflight. Generating a fresh classification summary allows proposal preflight to verify that classification summary provenance matches current sweep evidence.
