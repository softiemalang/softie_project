# External Google OCR candidate comparison v1

This record defines a recognition-only comparison of two explicitly requested
external candidates against the existing frozen four-line gold:

1. Cloud Vision `DOCUMENT_TEXT_DETECTION`.
2. Google Document AI Enterprise Document OCR.

The comparison is not a route decision. It does not register, promote, select,
or activate either provider.

## Fixed input and protocol

- Input is the existing frozen gold set identified by
  `f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b`.
- The same four lossless line-crop bytes are sent to both providers.
- Each line is sent twice per provider: eight synchronous requests per
  provider, no retry and no fallback.
- Text is NFC-normalized and whitespace-stripped only for the declared
  exact/CER calculation. No semantic correction, source judgment, search, or
  historical interpretation is applied.
- The runner retains prediction hashes, lengths, metrics, provider-native
  geometry summaries, confidence summaries, and latency; it does not retain
  raw prediction text, raw API responses, raw pixels, access tokens, or
  service-account keys.

The runner and validator are
[`google_external_ocr_frozen_gold_runner.py`](../tools/ocr/google_external_ocr_frozen_gold_runner.py)
and
[`validate_google_external_ocr_evidence.mjs`](../tools/ocr/validate_google_external_ocr_evidence.mjs).
The transport crop bundle is ephemeral and must be deleted after the remote
run.

## Measurements

Both candidates use the same fields:

- exact match rate and character error rate over the four fixed lines;
- two-repeat text, geometry, and confidence stability per line;
- provider-native confidence presence and summary statistics;
- geometry element counts, bounding-box validity, union bounds, coverage, and
  geometry digest;
- per-line and per-document latency, plus request byte count;
- authenticated principal digest, billing project, request units, published
  price tier, and whether the actual invoice was queried;
- synchronous/inline versus Cloud Storage or batch processing, data-retention
  and raw-output boundaries.

Confidence scales and geometry conventions are provider-native. They are
reported side-by-side and are not treated as calibrated cross-provider scores.
The cost field is an exposure estimate, not an invoice assertion.

## Official service boundaries

- Vision's [OCR documentation](https://docs.cloud.google.com/vision/docs/ocr)
  defines `DOCUMENT_TEXT_DETECTION`; its [pricing page](https://cloud.google.com/vision/pricing)
  charges per image feature unit, with the first 1,000 units per month free
  and `Document Text Detection` listed at $1.50 per 1,000 units in the next
  tier.
- Document AI's [Enterprise Document OCR documentation](https://docs.cloud.google.com/document-ai/docs/enterprise-document-ocr)
  describes text/layout extraction and processor-version pinning; its
  [pricing page](https://cloud.google.com/products/document-ai/pricing)
  lists the first 1,000 Enterprise Document OCR counts per month as free and
  $1.50 per 1,000 in the next tier.
- The test uses synchronous inline requests. Google's [Vision data-usage
  FAQ](https://docs.cloud.google.com/vision/docs/data-usage) says online
  image data is processed in memory and not persisted to disk, while the
  [Document AI security page](https://docs.cloud.google.com/document-ai/docs/security)
  describes the same boundary for synchronous document requests. Both pages
  also state that customer content is not used to train the respective OCR
  models.
- Authentication is the already authenticated Cloud Shell user credential via
  `gcloud auth print-access-token`; no JSON key is created or stored. See
  [Vision authentication](https://docs.cloud.google.com/vision/docs/authentication).

## Route and promotion boundary

```text
BLOCK_OCR_ROUTE = true
OCRProvider.enabled = false
automatic activation = false
detection slot touched = false
candidate evidence only = true
```

Even a complete or favorable comparison cannot promote a provider or open the
OCR route. Any incomplete provider run remains candidate evidence with an
explicit availability/authentication blocker.

## Read-only recovery close-out (2026-09-04)

The available local and existing-session evidence contains no complete
provider result. The repository and the known ephemeral transfer directory
contain the four input crops, `manifest.json`, and the runner only; no
`result.json` or completed `runner-console.log` is present. The in-app browser
has no existing Cloud Shell tab, the visible Safari state is not a Cloud Shell
terminal, and no local `gcloud` executable is available. The transfer archive
and manifest were observed with these hashes:

```text
transfer archive: 313049a4777693ee8ffe163278444b385826f80df68df2f541dac77f7176dea0
manifest:         33e656dfcc479ce9a48e9638c96258b48e8cf1dd7fa29187753798ce34ff5315
```

The temporary Document AI processor was previously observed at creation time
as `ENABLED` in `asia-southeast1`:
`projects/888064596054/locations/asia-southeast1/processors/dcd3c8ca85ec70d2`.
Its current existence, state, and deletion status cannot be established
without an existing Cloud Shell session or a new control-plane request, so
they remain `UNKNOWN_UNVERIFIED`. No processor deletion was attempted.

Because no complete result is available to pass to the validator, the
recovery close-out is:

```text
status = INCOMPLETE_NO_RESULT
validator = NOT_RUN_NO_COMPLETE_RESULT
provider_result = unavailable
processor_current_state = UNKNOWN_UNVERIFIED
```

No new Vision or Document AI processing request, retry, rerun, result upload,
processor mutation, or activation was performed. The ephemeral preparation
files remain recoverable and were not deleted under this read-only close-out.
The route boundary remains unchanged: `BLOCK_OCR_ROUTE=true`,
`OCRProvider.enabled=false`, and automatic activation is false.
