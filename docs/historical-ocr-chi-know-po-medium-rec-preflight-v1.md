# PP-OCRv6 medium recognition preflight

Before any new full fine-tuning, this preflight runs only against the pinned
CHI-KNOW-PO train parquet (`10` document identities). It never accepts a
held-out or frozen-gold path. The two bounded child phases are:

1. `zero-step-checkpoint-round-trip`: load the pinned base model, save its
   untouched `state_dict`, load it into a fresh model, and compare parameter
   digests, probability digests, and PaddleX `CTCLabelDecode` output hashes.
2. `tiny-overfit-sanity`: repeat one fixed four-record train-only batch for at
   most `16` optimizer steps, requiring finite loss/parameters, a decreasing
   loss, an exact/CER improvement signal on that tiny batch, and a second
   checkpoint save/load/decoder round-trip.

The preflight does not perform a full fine-tune, model selection, detection,
semantic correction, source judgment, search, fallback, or activation. Raw
training text and images remain in memory only; the evidence stores hashes,
lengths, metrics, and resource telemetry. `BLOCK_OCR_ROUTE=true` and
`OCRProvider.enabled=false` remain unchanged.

The local resource gate uses the prior M1 observation as a warning boundary:
`4096 MiB` peak RSS and `256 MiB` system-wide swap delta. A functional pass
with a local resource failure is recorded as
`FUNCTIONAL_PASS_RESOURCE_BLOCKED`, not as a training promotion. Full
fine-tuning stays blocked until the cause of the prior held-out regression is
confirmed by an operator.

## Executed result

The train-only preflight completed with
`FUNCTIONAL_PASS_RESOURCE_BLOCKED` (`preflight.json`). The zero-step checkpoint
round-trip preserved the parameter digest, probability digest, and official
`CTCLabelDecode` output; its checkpoint SHA-256 is
`853b4ebe79a6a0370e58550e9832cd26a15c832682bc589ced897763278c01`.
The tiny-overfit phase ran `16/16` finite steps: loss decreased from
`9.015895844` to `0.001017917`, exact changed from `2/4` to `4/4`, and CER from
`0.3` to `0.0`; the tuned checkpoint round-trip also preserved its decoder
output, with checkpoint SHA-256
`c5a524fb0071db2c94b0a4b59c5ff5f50d13cdfcab05d2606100cf2cf94dba3a`.

The functional gate therefore passes, but the local resource gate remains
closed: tiny-overfit peak RSS was `1569 MiB`, while system-wide macOS swap
increased by `1070.18 MiB` against the `256 MiB` bound. This is evidence that
the save/load and label-decoder paths work, not evidence for a full
specialization run or activation. No frozen gold or held-out data was read in
this preflight; the HF companion remains design-only and unsent.

For later migration, the companion
`artifacts/historical-ocr-chi-know-po-medium-rec-preflight/hf-disposable-job-spec.json`
defines a design-only Hugging Face Jobs `uv` submission: pinned Hub revision,
inline/bundled script transport, no local filesystem arguments, no scheduled
retry, explicit timeout, private result persistence, and required remote RSS /
wall-time / determinism receipts. No HF job is submitted by this preflight.
