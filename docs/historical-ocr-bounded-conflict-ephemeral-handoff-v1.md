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

`A` and `B` are evidence labels only: they identify which existing candidate is
visibly supported, but they never populate a selected worker or automatically
choose a winner. `NEITHER` and `UNCERTAIN` are accepted terminal labels that
always close the line as `UNRESOLVED`; they never trigger a transcription,
retry, fallback, majority decision, or activation. If either label is present,
the packet remains `UNRESOLVED` and `activationGate.status` remains
`DO_NOT_OPEN`.

Candidate strings, crop bytes, request/response bodies, prompts, and reviewer
response text exist only in memory for the current line and are discarded
immediately after the handoff. The evidence packet retains hashes, lengths,
latency, call status, and the enum label only.

The offline mock harness covers resolving (`A`/`B`), non-resolving
(`NEITHER`/`UNCERTAIN`), and mixed-label packets. It replaces every provider
request with an in-memory fixture and invokes the deterministic packet
validator; it does not read credentials or make network calls.

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

## Authorized rerun on 2026-09-04

The separately authorized six-request rerun attempted Qwen once per conflict
line and the pinned Document AI worker once per conflict line. Both Qwen calls
returned HTTP 403, while both Document AI calls returned HTTP 200. Because no
Qwen candidate was available, the runner did not send either reviewer handoff;
the total was four provider requests, with no retry or fallback. The partial
packet is retained as hashes/metrics only and the deterministic validator
returned `FAILED` for the incomplete scope. This is recorded as
`INCOMPLETE_NO_RESULT` in
`artifacts/historical-ocr-bounded-conflict-ephemeral-handoff-rerun-attempt-20260904.json`.

No reviewer label, conflict resolution, or activation evidence was produced.

## Second authorized rerun on 2026-09-04

A second bounded rerun was attempted after the read-only Groq catalog probe
recovered. Qwen again returned HTTP 403 for both conflict lines; pinned
Document AI returned HTTP 200 for both. Since neither Qwen candidate existed,
the contract correctly sent zero reviewer handoffs. The run therefore made
four provider requests rather than six, with no retry or fallback, and its
packet failed the independent validator for incomplete scope. The raw response
bodies were not retained. The packet and fail-closed record are
`artifacts/historical-ocr-bounded-conflict-ephemeral-handoff-rerun-20260904-v2.json`
and
`artifacts/historical-ocr-bounded-conflict-ephemeral-handoff-rerun-v2-attempt-20260904.json`.

No reviewer label, conflict resolution, or activation evidence was produced.

## Gate and boundaries

`activationGate.status=DO_NOT_OPEN` and `limitedActivationEligible=false`.
`BLOCK_OCR_ROUTE=true`, `OCRProvider.enabled=false`, and activation remain
unchanged. Automatic winner selection, majority vote, semantic correction,
silent fallback, detection expansion, and processor mutation remain disabled.
