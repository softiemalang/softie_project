# DE405 Unresolved Selection Structural Analysis Tooling

This document describes the CLI options, input contracts, invariants, and output specification for the DE405 unresolved selection analysis tool.

## 1. Overview

The unresolved selection analysis script (`scripts/analyze-de405-unresolved-selection.mjs`) decomposes all `1,701` unresolved selection evidence records into two distinct structural groups without modifying evidence or policies:
- `state_equivalent_selection_different` (606 records)
- `candidate_state_different` (1,095 records)

## 2. CLI Usage

```bash
npm run analyze:de405:unresolved-selection -- --output /tmp/de405-unresolved-breakdown.json
```

Explicit paths can be specified via options:
```bash
node scripts/analyze-de405-unresolved-selection.mjs \
  --classifications artifacts/de405-jpl-cspice-residual-sweep.classifications.jsonl \
  --candidate-evidence artifacts/de405-jpl-cspice-candidate-state-evidence.jsonl \
  --manifest artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl \
  --samples artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl \
  --summary artifacts/de405-jpl-cspice-residual-sweep.summary.json \
  --phase-summary artifacts/de405-jpl-cspice-phase-c-summary.json \
  --output /tmp/de405-unresolved-breakdown.json
```

## 3. Strict Invariants

The tool validates the following invariants on execution:
- Total unresolved count: `1701`
- `state_equivalent_selection_different`: `606`
- `candidate_state_different`: `1095`
- `606 + 1095 = 1701`
- Duplicate classification/evidence records: `0`
- Cross-group overlap / unclassified records: `0`
- Missing or extra candidate evidence records: `0`

If any invariant fails, execution aborts with exit code `1`.

## 4. NAIF Target Relative to Earth (399) Mappings

| target:center | NAIF Target | Description |
|---|---|---|
| `1:399` | Mercury Barycenter | Mercury Barycenter relative to Earth |
| `2:399` | Venus Barycenter | Venus Barycenter relative to Earth |
| `4:399` | Mars Barycenter | Mars Barycenter relative to Earth |
| `5:399` | Jupiter Barycenter | Jupiter Barycenter relative to Earth |
| `6:399` | Saturn Barycenter | Saturn Barycenter relative to Earth |
| `7:399` | Uranus Barycenter | Uranus Barycenter relative to Earth |
| `8:399` | Neptune Barycenter | Neptune Barycenter relative to Earth |
| `9:399` | Pluto Barycenter | Pluto Barycenter relative to Earth |
| `10:399` | Sun | Sun relative to Earth |
| `301:399` | Moon | Moon relative to Earth |

## 5. Candidate Alternatives Bitwise Identity

The `candidateAlternativesBitwiseIdentity` field measures IEEE-754 bitwise identity across candidate alternative SPK records evaluated for the same query epoch against SPK reference stateBits. It does **not** assert bitwise identity between CSPICE and JPL reference states across non-zero residual evaluations.
