# PP-OCRv6 recognition exact-only adjudication and archive

Date: 2026-09-03. This record compares only the frozen-line exact boolean
outcomes from the two PP-OCRv6 recognition variants and the retained Qwen
baseline. It does not read or reconstruct prediction text, prediction hashes,
CER, or confidence.

## Frozen-line result

| Frozen line | PP-OCRv6 small | PP-OCRv6 medium | Qwen | Exact-only verdict |
| --- | --- | --- | --- | --- |
| `saju-main-title-line` | false/false | true/true | true/true | no unique exact worker |
| `saju-folio-line` | false/false | false/false | false/false | no exact worker |
| `ziwei-title-line` | true/true | true/true | true/true | no unique exact worker |
| `astrology-title-line` | false/false | false/false | true/true | Qwen is the unique exact worker, but its text is not reconstructable from booleans |

The line matrix therefore establishes one unique exact worker only for Qwen on
`astrology-title-line`; it establishes no unique textual answer because exact
booleans identify an outcome, not the text, and the Qwen record retained no raw
prediction text. PP-OCRv6 has zero unique exact lines. This is not a semantic
or historical-source judgment.

The machine-readable record is
[`exact-outcome-adjudication.json`](../artifacts/historical-ocr-ppocrv6-rec/exact-outcome-adjudication.json).
Its deterministic content hash is
`24d11d1fcf083afea1acc398eb3316e5efef722a9e0d8744f19e2e1e014026c7`.

## Archive disposition

Both measured PP-OCRv6 base-recognition artifacts are recoverably archived:

- `pp-ocrv6-small-rec`: archived; zero unique exact lines.
- `pp-ocrv6-medium-rec`: archived; zero unique exact lines.
- The original `small-run.json` and `medium-run.json` remain in place and are
  not deleted or rewritten.
- The descriptors are marked `archived_candidate`; selection returns
  `UNKNOWN` with `worker_archived`. There is no fallback or explicit override.

The archive manifest is
[`archive-manifest.json`](../artifacts/historical-ocr-ppocrv6-rec/archive-manifest.json).
This disposition does not promote Qwen, change the OCR team contract, or
enable an operational route.

```text
BLOCK_OCR_ROUTE = true
OCRProvider.enabled = false
fallbackPolicy = none
activation = separate decision, inactive
```
