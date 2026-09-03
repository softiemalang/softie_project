# CHI-KNOW-PO PP-OCRv6 medium recognition fine-tuning trial

This record defines the bounded local specialization trial for the
`pp-ocrv6-medium-rec` worker. It is recognition-only: ten document identities
from the materialized train partition are sampled with a fixed per-document
cap, then the frozen checkpoint is evaluated twice on the three untouched
held-out documents. The held-out parquet is not opened by the train process,
and no frozen domain gold is used.

The trial uses the pinned local PP-OCRv6 medium checkpoint, CPU PaddleX on the
Apple Silicon host, fixed seed/configuration, no augmentation, no semantic
correction, and no network access. It records exact match, aggregate CER,
per-document non-worsening, output/checkpoint hashes, confidence, latency,
peak RSS, swap, and finite-loss/parameter stability. Unsupported training
characters are counted and excluded as unencodable rows; they are never
silently replaced. Held-out targets are used only in memory for metrics and
hashes; raw text/images are not retained in evidence.

`trial.json` is the machine-validated result produced by
`tools/ocr/validate_chi_know_po_medium_rec_finetune_trial.mjs`. The
specialization effect is proven only when both repeats are reproducible, both
training runs are finite and complete with identical checkpoints, aggregate
exact and CER both improve strictly, no held-out document regresses, and the
resource gate passes. Otherwise the result remains `NOT_PROVEN` and the
candidate is not promoted.

This trial does not alter the frozen domain gold, detection expansion, or OCR
activation. `BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, and the
no-fallback boundary remain in force. A `READY_FOR_NEXT_FINE_TUNING_GATE`
result is an evidence handoff requiring operator review, not activation.

## Observed result (2026-09-03)

The actual local trial completed all six runs. Base repeat 1/2 was
`1310/2790` exact (`46.9534%`) with CER `0.1045219`; tuned repeat 1/2 was
`20/2790` exact (`0.7168%`) with CER `0.7654013`. The base output hash was
identical across repeats, as was the tuned output hash; both training runs
also produced the identical checkpoint hash. The tuned result regressed on
each untouched document: `S-1` exact `808 -> 7`, `S-5` `127 -> 5`, and `T-2`
`375 -> 8`.

Both 80-step training runs were finite and complete, with loss
`8.321096420 -> 0.984348416`, but peak RSS was `4313.172`/`4440.234 MiB`
against the bounded `4096 MiB` limit. The measured global swap deltas also
exceeded the `256 MiB` limit for base repeat 1 and both training repeats.
The independent validator therefore closes the result as
`NOT_PROVEN / NOT_PROMOTED`; the tuned checkpoint is retained only as local
trial evidence and is not an activation candidate.
