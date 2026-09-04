# Groq Qwen vision data-URI availability close-out

## Decision

The Qwen 3.6 and Qwen 3.8 synthetic JPEG `data:` URI probes both returned
HTTP 503 JSON `internal_server_error` through the proven curl transport. The
result is closed as a **provider-side Groq data-URI transport blocker** and
the Groq Qwen vision route is temporarily unavailable.

This does not revoke the existing Qwen recognition worker evidence or claim
that Qwen recognition quality changed. It only blocks the vision input route.

## Evidence binding

- Existing Qwen recognition record: `/Users/hangyukim/Documents/malang_lab/documents/Web Research Broker Lab/benchmark/historical-ocr-recognition-qwen-groq-v1/result-2026-09-03.json`
- Existing Qwen record SHA-256: `3fc4d6959dfea7216ecf5bbf1e240ee380d12dcfa1470e3c9be871d9a94df4c4`
- Existing operational shadow artifact: [`historical-ocr-bounded-ocr-operational-shadow-v1.json`](../artifacts/historical-ocr-bounded-ocr-operational-shadow-v1.json)
- Existing operational shadow artifact SHA-256: `94ff77d2e2f5fc92283a3c37baee2f4e1b56969eac0427f5c0408b4a859ff1e9`
- Preserved Qwen qualification: 6/8 exact, 4/4 repeat-text-stable lines, candidate evidence only.

The tested synthetic fixture was an in-memory 2×2 JPEG, 631 bytes,
SHA-256 `bd9715495e7b02200961933e63bc2f48372a538659115f4cd8ccfa3a9e5fea9d`.
No OCR crop or Document AI input was read.

## Probe comparison

| Probe | Transport | HTTP | Response | Latency |
|---|---|---:|---|---:|
| Qwen 3.8 public JPEG URL (prior comparator) | `/usr/bin/curl -q` | 200 | JSON success | 1852.826 ms |
| Qwen 3.8 local JPEG base64 | `/usr/bin/curl -q` | 503 | `internal_server_error` | 30223.081 ms |
| Qwen 3.8 PNG data URI | `/usr/bin/curl -q` | 503 | same error shape/body digest | 30168.274 ms |
| Qwen 3.6 same JPEG base64 | `/usr/bin/curl -q` | 503 | `internal_server_error` | 30318.991 ms |

The cross-model same-fixture result supports a common data-URI/provider
failure rather than a Qwen 3.8-specific regression. JPEG-versus-PNG cannot
be isolated because both data-URI forms failed. The public URL result remains
comparison evidence only; no remote-URL workaround was executed for this
close-out.

The conditional official Groq SDK branch was not entered because the Qwen 3.6
control did not return HTTP 200. No SDK was installed or called.

## Resume gate

The conflict shadow gate remains blocked. It may be reconsidered only after a
separately approved, one-shot synthetic Qwen 3.8 probe using the same JPEG
bytes and the same `data:image/jpeg;base64` shape returns HTTP 200 JSON with a
non-empty choice and no provider error, with retry and fallback both zero.
The probe must retain only bounded metrics/digests, not raw response, prompt,
image, or credential data. A public-URL success, catalog success, workaround,
503/timeout/non-JSON result, or automatic retry does not reopen the gate.

Even after that proof, conflict shadow rerun and any activation require a
separate explicit decision.

## Boundaries

`BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, activation, semantic
correction, silent fallback, and automatic winner selection remain disabled.
Existing recognition evidence and worker identity were not edited. The
close-out introduced no new provider call, remote-URL workaround, OCR crop
access, Document AI call, or activation.
