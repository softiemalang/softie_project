# Historical OCR bounded team contract v1

`historical-ocr-specialist` is an execution-and-measurement team, not a
single-model specialist. The implementation is in
`src/ocr/historicalOcrTeam.js` and is re-exported from
`src/historicalOcrSpecialist.js`.

## Fixed boundary

The team preserves the caller-provided `OCR_REQUIRED` handoff and the
caller-provided promoted `geometry` and `table-grid` values byte-for-byte at
the canonical JSON level. They are carried in the team and deterministic
packet with SHA-256 preservation links. A worker cannot replace either
promoted component.

The route is permanently blocked in this contract:

```text
BLOCK_OCR_ROUTE = true
OCRProvider.enabled = false
fallbackPolicy = none
```

Search, historical-source judgment, semantic correction, and silent fallback
are prohibited. The contract also does not create source evidence, establish
semantic authority, make a readiness decision, or activate a production/user
route.

## Slots and first worker

There are two independently replaceable component slots. Recognition also
exposes two explicit variant descriptors so a local evaluation can bind one
model revision to the recognition slot without changing the component
contract:

| Slot | Component | First worker |
| --- | --- | --- |
| `det` | detection | `pp-ocrv6-det` |
| `rec` | recognition | `pp-ocrv6-rec` |

The actual recognition descriptors are `pp-ocrv6-small-rec` and
`pp-ocrv6-medium-rec`, backed by the pinned
`PaddlePaddle/PP-OCRv6_{small,medium}_rec_safetensors` revisions. They are
replaceable worker slots selected only by explicit worker ID; registering or
measuring either descriptor does not choose it for a route.

Both slots use explicit worker IDs. No confidence-based selection or implicit
fallback is available. A replacement worker must satisfy the same slot
contract; registering a replacement does not activate it.

PP-OCRv6 is registered as a candidate descriptor only. The repository does
not install a runtime, download model weights, or activate a provider. The
bounded local adapter under `tools/ocr/ppocrv6_rec_adapter.py` consumes an
explicit local model directory and the existing frozen four-line gold; it
retains hashes and measurements, not raw prediction text or pixels. Its
license/data claims are evidence fields and remain independent of activation.

## Independent promotion gate

Each component is evaluated separately. Each component must have exactly one
validation for each of:

1. `CHI-KNOW-PO`
2. the existing frozen gold corpus (`frozen-gold`, with
   `existing-frozen-gold` accepted as an input alias)

Every validation records the frozen manifest identity, input/output hashes,
component-specific accuracy metrics, at least two identical repeat outputs,
observed local macOS arm64/M1-compatible execution, bounded resource use,
license evidence, data-boundary evidence, and the prohibited-operation
booleans. Acceptance thresholds are explicit caller input; no accuracy
threshold is inferred by the implementation.

Missing corpus bytes, missing adapter execution, missing thresholds, missing
license/data evidence, non-reproducible output, or incomplete resource
measurements remain `UNKNOWN`. A policy violation or failed validation is
`BLOCKED`. Only a component whose two independent validations satisfy all
gates is `PROMOTED`.

Promotion is not activation. Even a promoted component has
`activation.enabled === false`, `activation.active === false`, and a separate
activation decision is required.

## Runtime output adjudication

`adjudicateHistoricalOcrOutputs` compares component output hashes. Missing or
unknown required output produces `UNKNOWN`; different outputs produce
`CONFLICT`; neither outcome has a winner. The adjudicator never uses
confidence to silently select a worker. A consensus hash is emitted only when
all supplied required outputs are usable and identical.

## Deterministic packet

`buildHistoricalOcrPacket` recursively sorts object keys, preserves array
order after sorting worker/corpus/validation collections by stable IDs, and
adds `packetContentSha256` over the packet without that field. The packet
validator checks the hash, preservation links, independent component gates,
route boundary, activation boundary, and conflict/unknown outcome shape.

No CHI-KNOW-PO or frozen-gold bytes were present in the checkout when this
contract was added. The default team therefore records both required corpora
as `not_supplied` and keeps both component promotions `UNKNOWN`; no synthetic
gold fixture is substituted.
