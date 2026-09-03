# CHI-KNOW-PO historical-recognition specialization path

Date: 2026-09-03. This document records the original leakage-control design.
The pinned read-only corpus materialization and its evidence are recorded in
[`historical-ocr-chi-know-po-corpus-materialization-v1.md`](historical-ocr-chi-know-po-corpus-materialization-v1.md).

The design checkpoint did not invent a corpus or reuse frozen gold, held-out
gold, or any other nearby fixture as a substitute. Its original plan remains
[`plan.json`](../artifacts/historical-ocr-chi-know-po-specialization/plan.json)
with status `DESIGN_ONLY`; the later materialized plan is a separate evidence
record and still has `fineTuningGate=NOT_RUN` and `activationGate=BLOCKED`.

## Split unit and identity

The only permitted split unit is a whole document. The future source owner
must supply an explicit catalog containing, for every document:

- a stable `documentId`;
- a deterministic `documentFingerprint`;
- an optional declared `duplicateFamilyId`;
- exact `sourceObjectHashes`; and
- all derived page, crop, and line `memberRecordIds`.

The assignment is an explicit, lexicographically ordered manifest with exactly
two partitions: `train` and `untouched-held-out`. Pages, crops, and lines from
one document cannot be assigned independently. No random page/line split,
fuzzy similarity, semantic matching, historical-source judgment, or external
search is part of the design. Duplicate protection is exact and based only on
the supplied identity/hash fields; if those fields are absent, the gate stays
`UNKNOWN`/blocked.

The split validator rejects:

- overlapping document IDs, fingerprints, duplicate-family IDs, source-object
  hashes, or derived member-record IDs;
- catalog documents missing from both partitions or assigned twice;
- partition IDs not present in the supplied catalog; and
- a held-out partition that is not read-only and explicitly untouched.

## Untouched-held-out boundary

`untouched-held-out` is mounted read-only and is excluded from training,
augmentation, normalization fitting, vocabulary construction, threshold
calibration, hyperparameter tuning, checkpoint selection, early stopping,
manual correction, and feedback into training. It is evaluated only after the
checkpoint is frozen. Its result is a separate evidence record and cannot
modify the train manifest, preprocessing state, or checkpoint.

`train` is the only partition eligible for recognition labels, augmentation,
and fitting train-only preprocessing. Normalization is NFC-only and preserves
glyphs; it is not semantic correction. Semantic fields and historical
authority are not used by this recognition specialization path.

## Deterministic execution and gates

The intended sequence is:

1. verify the local manifest and license/data boundary;
2. resolve only declared document identity and exact duplicate families;
3. materialize the explicit document split;
4. validate disjointness before decode or augmentation;
5. mount train read/write and untouched-held-out read-only;
6. fit the recognition checkpoint using train only;
7. freeze and hash the checkpoint;
8. evaluate untouched-held-out without feedback; and
9. independently review the evidence.

The implementation exposes `buildChiKnowPoSpecializationPlan` and
`checkChiKnowPoSpecializationPlan` in
[`src/ocr/chiKnowPoSpecialization.js`](../src/ocr/chiKnowPoSpecialization.js).
The CLI emits the design-only plan via
[`emit_chi_know_po_specialization_plan.mjs`](../tools/ocr/emit_chi_know_po_specialization_plan.mjs).
The actual fine-tuning gate remains `NOT_RUN` until the supplied catalog passes
the split, data-boundary, deterministic-repeat, local M1 resource, and
post-freeze untouched-held-out accuracy checks. A fine-tuning pass would still
be only a promotion candidate.

Activation is a separate explicit operator decision. The plan keeps the
operational boundary closed:

```text
BLOCK_OCR_ROUTE = true
OCRProvider.enabled = false
fallbackPolicy = none
activation = blocked and inactive
```
