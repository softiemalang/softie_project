# PP-OCRv6 medium recognition minimum-recipe design

This is a design-only checkpoint for a conservative recognition recipe. Local
training is stopped because the preceding M1 preflight was functional but
blocked by system-wide swap growth. No HF job has been submitted. The recipe
is not claimed as stable or effective until its disposable execution produces
the required evidence.

## Train-only inner dev split

The split is materialized from the pinned CHI-KNOW-PO `train` record manifest
only. The unit is a whole document; no page, crop, or line is split across the
two inner partitions.

- `inner-train`: `A-1`, `A-4`, `S-2`, `S-4`, `S-6`, `S-7`, `T-1` (`8,155` records)
- `inner-dev`: `A-3`, `S-3`, `T-3` (`2,689` records; `24.80%` of the train records)

The dev documents are selected deterministically by taking the document whose
line count is nearest to `20%` of each `A`/`S`/`T` prefix group. The source
train parquet SHA-256 is
`97f6fcc531cb79c4e0f2f63a042f52317b9299ed2f13785663c8523c7c0bc25b`.
The split evidence retains only counts, hashes, and document IDs; raw text and
images are not retained.

## Minimum recipe

The fixed recipe uses at most `64` encodable train records per inner-train
document (`448` records), all inner-dev records for metric-only evaluation,
NFC-only normalization, no augmentation, and no semantic correction.

| Stage | Trainable prefixes | Learning rate | Steps | Checkpoint evaluation |
|---|---|---:|---:|---:|
| `s0-head-only` | `head.head.` | `1e-5` | 16 | every 8 steps |
| `s1-head-encoder` | `head.head.`, `head.encoder.` | `3e-6` | 16 | every 8 steps |
| `s2-last-backbone-block` | previous prefixes + `model.backbone.encoder.blocks.3.` | `1e-6` | 16 | every 8 steps |

All unmatched prefixes remain frozen. The optimizer is Adam with fixed
per-stage learning rates, zero weight decay, and
`paddle.nn.ClipGradByGlobalNorm(1.0)`. Optimizer state is reset only at a
stage transition. A later stage runs only after the previous checkpoint is
non-worse on inner-dev.

The base model is evaluated on inner-dev before any update. Every short
checkpoint is evaluated against that base reference. The earliest checkpoint
is eligible only when CER improves strictly, aggregate exact is non-worse,
every inner-dev document is non-worse in CER and exact outcomes, and at least
one document improves strictly. Any intermediate dev worsening stops the
ladder. If no checkpoint passes, the explicit result is
`RECIPE_NOT_PROVEN_BASE_RETAINED_EXPLICITLY`; this is a gate result, not a
silent runtime fallback.

Two deterministic repeats with seed `7` must have matching checkpoint and
dev-output hashes, finite loss/gradients/parameters, complete steps, and
complete resource telemetry. Missing or different hashes remain
`UNKNOWN_OR_BLOCKED`.

## HF disposable execution boundary

The companion design uses `hf_jobs('uv')` with an inline/bundled runner,
Python `3.11`, pinned Hub model and dataset revisions, and `t4-small` as the
explicit default hardware. The job receives model/dataset IDs and the two
inner document allowlists; it receives no local filesystem path, held-out
path, or frozen-gold path. Results are private operator-selected artifacts,
with `HF_TOKEN` supplied only as an encrypted secret when persistence is
authorized. No source upload, public push, scheduled retry, or automatic
hardware fallback is allowed.

Remote evidence must include peak RSS, GPU peak memory, wall time, CPU time,
checkpoint hash, deterministic output hash, and OOM/swap status. Missing
telemetry blocks the recipe. A stable recipe may hand off to the next
fine-tuning gate for operator review only; it cannot activate OCR.

`BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, detection extension,
frozen-gold access, held-out access, search, semantic correction, and silent
fallback remain closed. Full fine-tuning before the unresolved regression
cause is confirmed remains forbidden.
