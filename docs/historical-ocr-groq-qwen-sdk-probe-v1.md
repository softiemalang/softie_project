# Groq official SDK adapter probe for Qwen vision

## Decision

The official Groq Python SDK was introduced as a separate, Qwen-only adapter
in [`tools/ocr/groq_qwen_sdk_adapter.py`](../tools/ocr/groq_qwen_sdk_adapter.py)
and pinned in
[`tools/ocr/requirements-groq-qwen-sdk.txt`](../tools/ocr/requirements-groq-qwen-sdk.txt)
at `groq==1.7.0`. The package was installed only in a disposable Python
3.14.7 environment. The existing direct-HTTP worker, GPT-OSS Groq path,
credential material, billing, and routing were not modified.

The adapter was exercised with one reused official `Groq` client and zero SDK
retries in the requested order: text-only, public JPEG URL, and the previously
frozen 631-byte synthetic JPEG as a base64 data URI. The first two probes
succeeded, but the synthetic base64 probe returned HTTP 503
`InternalServerError`. Therefore the SDK path is not a stable full vision
transport and **Qwen standard-transport promotion is not approved**.

`BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, semantic correction,
fallback, and activation remain blocked.

## Official SDK boundary

The adapter uses the official [`groq` Python library](https://github.com/groq/groq-python)
and its `client.chat.completions.create(...)` interface. It leaves the SDK
base URL at its default (`https://api.groq.com`) so the request path remains
`/openai/v1/chat/completions`; it does not inject custom headers or override
the user agent. The SDK client uses `httpx`, is reused for all three slots,
and is configured with `max_retries=0` and a 45-second timeout. The request
body keeps the direct worker's deterministic fields and
`messages[0].content=[text,image_url]` vision shape. Groq's official vision
documentation describes the public `image_url` input shape: [Vision](https://console.groq.com/docs/vision).
The SDK's constructed header names were checked without retaining values: the
usual `accept`, `authorization`, `content-type`, and `user-agent` names plus
its `x-stainless-*` metadata names were present. Those metadata names make
header identity different from the prior curl transport, while no credential
or header value was recorded.

The adapter rejects any model other than `qwen/qwen3.8-27b`. It does not import
or call the GPT-OSS path, Document AI, the OCR crop set, frozen gold, or any
fallback route.

## Observed probe

| slot | input | HTTP | SDK output | content/error digest | latency |
|---|---|---:|---|---|---:|
| `text_only` | text | 200 | `ChatCompletion`, 1 choice, `stop` | `565339bc...e12bb3` | 299.555 ms |
| `public_jpeg_url` | `https://httpbin.org/image/jpeg` | 200 | `ChatCompletion`, 1 choice, `stop` | `565339bc...e12bb3` | 847.394 ms |
| `synthetic_base64_jpeg` | same 631-byte frozen synthetic JPEG | 503 | `InternalServerError` | `d19f7516...980e04` | 30153.727 ms |

The text-only and public-URL success outputs have the same observed content
digest as the prior successful synthetic comparator. The base64 error body
digest matches the previously recorded direct-curl data-URI blocker. Thus
logical endpoint, method, deterministic parameters, vision content shape,
and retry policy have parity with the prior direct request; exact header
identity is intentionally not claimed because the transports differ (`curl`
versus the official SDK over `httpx`). Raw response bodies, raw headers,
prompt text, image bytes, and credential values were not retained.

This was one sequence only. It proves SDK/direct output parity for the
observed success/error fields, not repeat-run reproducibility or a recovered
base64 route. No second sequence or additional provider call was made after
the 503.

## Validation and artifacts

The closed packet is
[`artifacts/historical-ocr-groq-qwen-sdk-probe-v1.json`](../artifacts/historical-ocr-groq-qwen-sdk-probe-v1.json),
SHA-256
`2572ef4f8fc2da09f7ef5928d893fa939ce02a18dee6f293bfd07bff4b32d9db`.
The offline validator
[`tools/ocr/validate_groq_qwen_sdk_probe.py`](../tools/ocr/validate_groq_qwen_sdk_probe.py)
returned `PASS` with 44 checks and replayed zero provider calls.

The prior Qwen recognition record remains preserved at
`/Users/hangyukim/Documents/malang_lab/documents/Web Research Broker Lab/benchmark/historical-ocr-recognition-qwen-groq-v1/result-2026-09-03.json`
with its recorded SHA-256 unchanged. The existing data-URI blocker remains
the governing route evidence. A future promotion requires a separately
approved SDK sequence in which all three slots return the required successful
shape with zero retries/fallbacks, followed by an independent repeat; a
public-URL success alone does not reopen the route.
