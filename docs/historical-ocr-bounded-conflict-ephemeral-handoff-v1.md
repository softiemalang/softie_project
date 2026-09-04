# Ephemeral OCR conflict handoff contract

## Contract

The handoff is allowed only for the two already-recorded conflict lines:
`saju-folio-line` and `astrology-title-line`. Each line may receive one
minimal Qwen call, one explicitly pinned Document AI call, and one independent
reviewer handoff. The reviewer receives only the two candidate strings and the
original crop for that line. Frozen-gold text, source judgment, and semantic
context are not sent.

The independent reviewer is the isolated, no-history Gemini 3.7 Flash review
path. Its accepted output is exactly one of `A`, `B`, `NEITHER`, or
`UNCERTAIN`; it may not transcribe, rewrite, correct, explain, search, vote, or
return a new string. Provider retries, additional workers, and fallback are
disabled.

Candidate strings, crop bytes, request/response bodies, prompts, and reviewer
response text exist only in memory for the current line and are discarded
immediately after the handoff. The evidence packet retains hashes, lengths,
latency, call status, and the enum label only.

## Actual attempt on 2026-09-04

The first Qwen request for `saju-folio-line` was sent once. An internal runner
`TypeError` occurred while recording that response because the endpoint
argument was omitted. The response was not retained and no result was written.
Document AI and reviewer calls were not started. No retry is performed because
that would exceed the one-call-per-line bounded budget without a separate
authorization.

The attempt is recorded as `INCOMPLETE_NO_RESULT`; it is not treated as a
candidate result or a conflict resolution. The corrected runner and independent
validator are ready for a separately authorized clean attempt.

## Gate and boundaries

`activationGate.status=DO_NOT_OPEN` and `limitedActivationEligible=false`.
`BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, and activation remain
unchanged. Automatic winner selection, majority vote, semantic correction,
silent fallback, detection expansion, and processor mutation remain disabled.
