# DE405 unresolved selection cause analysis

## Purpose

This is a bounded, read-only cause analysis of the existing 1,701 unresolved JPL/CSPICE selection cases. It preserves the two established groups and does not approve a tolerance, choose a canonical selection, or release the blocker.

## Inputs and method

The committed JSON report records the exact path, byte size, SHA-256, and line count of the official unresolved breakdown, classification JSONL, and candidate-state evidence JSONL. The analyzer reads only those files; it does not rerun the residual sweep or mutate any artifact. For every unresolved sample it joins classification to candidate evidence, checks coverage/invariants, and aggregates the JPL selected candidate, CSPICE candidate record pair, recorded record boundaries, residuals, epoch direction, and IEEE-754 ULP distance.

Run:

```sh
npm run analyze:de405:unresolved-selection-cause -- --output /tmp/de405-cause.json
npm run check:de405:unresolved-selection-cause
```

## 606 state_equivalent_selection_different cases

Confirmed: all 606 rows have one selected JPL candidate, two adjacent recorded CSPICE records, and both CSPICE candidate states bitwise-match the recorded CSPICE reference. The epoch split is 558 `exact_knot`, 26 `next_up_knot`, and 22 `next_down_knot`; the recorded shared CSPICE boundary distance is 0 ULP for the exact rows and at most 1 ULP for all rows.

The target:center distribution and residual percentiles are in the JSON report. This group is structurally distinct from the other group: it can contain nonzero numerical residuals while its candidate comparison still satisfies the current contract.

Not computable: the evidence records no CSPICE `selected:true` candidate for these ambiguous rows, so a selected-record identity difference is not directly measurable. It also has no JPL component-bit state representation, so cross-source bitwise-state identity is not computable.

## 1,095 candidate_state_different cases

Confirmed: the group contains 547 `next_up_knot` and 548 `next_down_knot` samples, no exact-knot sample, and the unchanged trigger counts are position-only 0, velocity-only 9, position-and-velocity 1,086, neither 0. Every row has two adjacent recorded CSPICE records whose candidate states bitwise-match the CSPICE reference.

Strong correlation: every one of the 1,095 query ET values is exactly one IEEE-754 representable step from its recorded shared CSPICE record boundary. This is a record-boundary/knot adjacency observation, not proof of an SPK segment boundary or a selection bug.

Candidate explanation: the directionally split one-ULP concentration is consistent with source-specific record/subinterval selection or evaluation behavior around logical Chebyshev record knots. The data does not establish which implementation rule causes the state difference, nor does it identify a canonical selection.

## Boundary limits and blocker

The report calculates distance only to record boundaries explicitly recorded in the candidate evidence. Segment-directory boundary distance is not established by those fields. In particular, a logical Chebyshev record knot must not be called an SPK segment boundary without target-specific segment metadata.

`selection_unresolved=1701` remains active. Tolerance, canonical selection, and active-transition state remain unchanged; no scientific approval is implied.

## Determinism and freshness

The JSON serializer is canonical (`JSON.stringify(..., null, 2) + newline`). The specialized artifact test verifies complete 1,701-row coverage, 606/1,095 partition invariants, direction and trigger counts, source identity, canonical repeatability, stale source/output detection, missing-source invalidation, finding-status enum ordering, and contract invariants. The freshness command byte-compares a regenerated canonical report against the committed report.
