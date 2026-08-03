# Deterministic Interpretation Packet v1

This packet is an additive, local, dry-run-only input boundary. It accepts a
completed local verified orchestration envelope, the Verified Adapter's
interpretation-preparation context, raw/rule documents, readiness evidence, and
their hashes. It emits facts and Rule Core derivations only. It never calls an
LLM, executes a prompt, connects Prep/UI/API/DB, persists data, or changes
calculation mathematics.

## Epistemic boundary

`observed_or_calculated` covers raw ecliptic longitude, moving-frame speed, and
the state emitted by the verified calculation chain. `deterministically_derived`
covers Whole Sign placements, major aspect type/orb/phase and phase rule,
element/modality/polarity distribution, and chart ruler. Unsupported legacy
simulation/Placidus/date-seed values are explicitly `unsupported`; activation
is explicitly `blocked`. Every claim carries sourceRefs that resolve to the
raw/rule/orchestration/readiness evidence registry.

The machine-readable allow/deny vocabulary is exported by
`src/astrology/interpretationClaimVocabulary.js`. It excludes psychological
diagnosis, event/fate assertions, unsupported house/aspect completion,
retrograde/applying re-inference, legacy fallback, provenance-free numbers,
confidence/probability invention, and generated sentences.

## Compatibility

The existing Prep/prompt path remains legacy-only: it expects
`western_tropical_placidus_v1`, pending ephemeris or date-seed simulation, and
legacy interpretive/prompt fields. The packet does not coerce Whole Sign into
Placidus or copy those fields. A future prompt adapter requires separate
approval, a new consumer contract, and an explicit activation decision.

The complete calculation case is still
`availableForInterpretation: false`, `integrationStatus: not_connected`,
`serviceEligibility: blocked`, reason `interpretation_packet_not_activated`.
The governing principle is: **calculation is deterministic; interpretation is
conversation**.

## Hash scopes and determinism

Hash names are scope-specific. They must not be reported as an undifferentiated
"packet SHA-256".

| Machine-readable name | Exact input | Meaning |
| --- | --- | --- |
| `artifactByteSha256` | The exact UTF-8 bytes of `complete.json`, including pretty-print whitespace and the final LF | File/artifact identity; computed by the materializer and boundary checker, not embedded in the file because that would be self-referential |
| `packetContentSha256` | The `packet` object after removing its own `packetContentSha256` field, recursively sorting object keys, preserving array order, serializing with `JSON.stringify`, and appending one LF | Deterministic packet content identity |
| `providerBundleSha256` | The provider bundle canonical payload | Provider/input source identity |
| `rawChartSha256` / `ruleChartSha256` | The raw chart / Rule Core chart canonical payloads | Calculation input and derived-output identities |
| `adapterSha256` / `readinessSha256` | The adapter interpretation-preparation context / readiness payload with the same canonical object serialization | Adapter/readiness source identities |
| `identities.kernel.hash` | The verified DE405 kernel bytes | Ephemeris source identity |

`provenance.sourceRefs` and claim `sourceRefs` are allowlisted reference paths;
there is no separate `provenanceHash` or `sourceRefsHash` in this contract.
Their completeness and resolution are validated fail-closed. The materializer
prints both `artifactByteSha256` and `packetContentSha256`, and the checker
recomputes both from the supplied file and packet.
