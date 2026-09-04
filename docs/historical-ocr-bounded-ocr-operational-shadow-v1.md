# Bounded OCR operational shadow close-out

## Decision

The local-ADC Google Document AI optimized shadow and the existing Qwen shadow
are closed as candidate evidence only. The independent packet validator passed,
but the limited activation gate remains **DO_NOT_OPEN**.

No worker was selected. The comparison is based on frozen-gold exact boolean
outcomes and operational evidence; agreement here does not claim raw-text
equality.

## Evidence binding

- Frozen gold set SHA-256: `f08b4a006d5cc48ce6969ba8389bb7b4b3f5018a0228bca05ff867e15d13d02b`
- Input manifest SHA-256: `33e656dfcc479ce9a48e9638c96258b48e8cf1dd7fa29187753798ce34ff5315`
- Qwen shadow evidence SHA-256: `e8d3a5f5b7890496341f678d3933b987cab43874774fbc71023f243fe624a075`
- Document AI shadow evidence SHA-256: `b1503b84aa7163b66f777b3c57bff3f277bc8acf4a379cc7e552ead5bcba2b78`
- Prior exact-outcome packet validation: `PASSED`

Both workers used the same four frozen lines with two repetitions per line.
The Document AI worker explicitly pinned
`pretrained-ocr-v2.1.1-2025-01-31`; the version preflight was `DEPLOYED`, and
the request used the optimized field mask plus imageless mode without
`processOptions`, retry, or fallback.

## Operational comparison

| Worker | Exact | CER | Mean latency | Max latency | Repetition | Geometry / confidence | Cost evidence |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| Qwen 3.8 27B via Groq | 6/8 (0.75) | unknown; raw text was not retained | 785.579 ms | 1131.141 ms | text and exact stable 4/4 lines | geometry unavailable; confidence presence-only | 8 request units; invoice not checked |
| Document AI Enterprise OCR, pinned optimized request | 6/8 (0.75) | 0.047619 | 1405.7095 ms | 2048.08 ms | text, geometry, and confidence stable 4/4 lines | confidence present 8/8; mean 0.749808565 | 8 page units; invoice not checked |

The packet therefore records Qwen as faster on this sample, but records no
monetary cost winner because neither source contains invoice evidence. Numeric
Qwen CER, geometry, and numeric confidence are intentionally `UNKNOWN` rather
than inferred.

## Agreement, conflict, and complementarity

- Agreement: `saju-main-title-line` and `ziwei-title-line`; 4 of 8 paired
  records.
- Conflict: `saju-folio-line` and `astrology-title-line`; 4 of 8 paired
  records.
- Document AI-only exact line: `saju-folio-line`.
- Qwen-only exact line: `astrology-title-line`.
- Union of exact lines: all four lines.
- Relation: `COMPLEMENTARY_EXACT_COVERAGE_WITH_CONFLICT`.

The two conflicts and the complementary coverage prevent a consensus-based
activation recommendation. The bounded escalation rule is consequently
`ESCALATE_REQUIRED`: at most one line-scoped round, one additional worker, and
eight additional requests. It was not executed in this packet.

## Boundary and validity result

The packet validator is `PASSED`; source checks for both workers and the prior
exact packet passed, and no raw pixels, prompts, prediction text, API response,
credential value, or access token is retained. The packet content SHA-256 is
`1bbeb4e125a791e60b3ff93a3cec11fccf2c1b4b34e801c8e5d86b3272f45756`.

`BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, activation is false, and
automatic winner selection, semantic correction, silent fallback, search,
and detection changes remain disabled. This record does not promote a worker
or change runtime behavior.
