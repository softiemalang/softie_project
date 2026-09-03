# PP-OCRv6 recognition evidence (2026-09-03)

This is a recognition-only, bounded local measurement. The adapter is
[`tools/ocr/ppocrv6_rec_adapter.py`](../tools/ocr/ppocrv6_rec_adapter.py); the
machine-readable run records are
[`small-run.json`](../artifacts/historical-ocr-ppocrv6-rec/small-run.json),
[`medium-run.json`](../artifacts/historical-ocr-ppocrv6-rec/medium-run.json),
and the contract verdict is
[`evidence.json`](../artifacts/historical-ocr-ppocrv6-rec/evidence.json).

## Scope and input identity

- The adapter read the existing closed frozen-gold record with 3 cases and 4
  fixed line crops. It verified the gold-set SHA-256
  `f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b`, every
  fixture hash, every crop pixel hash, every bbox, and every NFC gold-text
  hash before inference.
- Each variant ran exactly 4 lines × 2 repeats = 8 local inferences. No raw
  prediction text, raw model output, crop file, or credential was retained.
- All four gold lines are `vertical-rl`. The only input adapter transform was
  the fixed `rotate_ccw_90` image rotation required to present the source crop
  to the horizontal recognition model. It is recorded by source/adapted crop
  hashes and is not semantic correction.
- The pinned local model files were loaded with Transformers
  `AutoModelForTextRecognition`, CPU, float32, one torch thread, deterministic
  algorithms, and offline-only environment guards. No network or provider
  route was called.

## Measured result

| Worker | Model revision | Exact | CER | WER* | Repeat text | Confidence (mean/min/max) | Inference latency mean | Peak RSS | Swap |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | --- |
| `pp-ocrv6-small-rec` | `fe049fb103f57443fe8840c54ed06b702f3c1de5` | 2/8 (0.25) | 0.523810 | 0.75 | 4/4 lines | 0.765342 / 0.552443 / 0.958056 | 25.208 ms | 401.422 MiB | 0.0 MiB delta |
| `pp-ocrv6-medium-rec` | `024cad6a831de75c2c3c26e711ba8c4a82ccd24b` | 4/8 (0.50) | 0.476190 | 0.50 | 4/4 lines | 0.584825 / 0.141512 / 0.997599 | 48.871 ms | 507.344 MiB | 0.0 MiB delta |

`WER*` is the explicitly declared whitespace-free line-mismatch rate; the
gold has no whitespace. Confidence was present and bitwise-stable in all 8
runs for both variants, but its scale is not compared to Qwen confidence.
`sysctl vm.swapusage` observed unchanged host swap (`2378.12 MiB` before and
after) for both bounded processes. Load time, min/max latency, wall time, CPU
seconds, per-line hashes, and per-line confidence are in the JSON run records.

The retained Qwen baseline is 6/8 exact (0.75), 4/4 repeat-stable lines, and
842.145 ms mean provider-call latency. Its raw prediction text was not
retained, so Qwen CER and a CER delta are intentionally `UNKNOWN`; no text was
reconstructed. Qwen resource measurements were not part of that closed record,
so its RSS/swap are also not imputed.

## Contract verdict

The declared frozen-gold comparison floor was the retained Qwen exact floor
(exact ≥ 0.75, CER ≤ 0.25, WER ≤ 0.25). Both PP-OCRv6 variants failed that
frozen-gold sub-gate:

- small: `FAILED`, exact 0.25 and CER 0.523810;
- medium: `FAILED`, exact 0.50 and CER 0.476190.

The actual component contract verdict for both replaceable workers is
`BLOCKED`. The validator also records
`component_validation_missing:CHI-KNOW-PO`: CHI-KNOW-PO was deliberately not
expanded before reviewing these recognition results, so the complete
two-corpus gate cannot be promoted. This is not silently treated as a pass or
as a fallback to Qwen.

The result does not justify proceeding to detection measurement or
CHI-KNOW-PO expansion in this branch. The existing det slot remains a
candidate, the measured PP-OCRv6 recognition variants are now recoverably
archived for reference and are unavailable for worker selection, activation
remains a separate decision, and the route remains closed:

```text
BLOCK_OCR_ROUTE = true
OCRProvider.enabled = false
fallbackPolicy = none
```

The exact-only adjudication and archive manifest are
[`exact-outcome-adjudication.json`](../artifacts/historical-ocr-ppocrv6-rec/exact-outcome-adjudication.json)
and [`archive-manifest.json`](../artifacts/historical-ocr-ppocrv6-rec/archive-manifest.json).
The adjudicator consumed only the two-repeat exact booleans per frozen line;
it did not inspect prediction text, prediction hashes, CER, or confidence.

The existing bounded team continues to preserve the caller-provided
`OCR_REQUIRED` handoff and promoted geometry/table-grid through its API and
deterministic packet. This recognition-only run did not receive those caller
payloads and did not invent replacements for them.
