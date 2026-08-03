# Astrology interpretation read protocol v1

`astrology-interpretation-read-protocol-v1` is the deterministic, local-only read boundary for an existing `astrology-interpretation-handoff-v1` bundle. It verifies identity and integrity; it does not recalculate, summarize, rank, interpret, generate text, create a prompt, or activate a consumer.

The machine-readable protocol fixes only technical order: frozen-base manifest identity, handoff schema/version/content hash, exact component artifact bytes and content hashes, cross-hash links, component status, claim inventory and epistemic counts, claim-to-graph/sourceRefs provenance, structural graph relations, eligibility/activation boundaries, access policy, and human-review status. Every required step has `onFailure: stop_and_block`; there is no fallback source or partial read.

The protocol preserves all 53 claims in parallel: 20 `observed_or_calculated` and 33 `deterministically_derived`. `claimSourceTrace` records each original claim path, its sourceRefs, epistemic class, and whether each reference resolves through context provenance. Orb, phase, motion, and rule identity remain source facts. Graph relations remain the allowlisted structural co-occurrence vocabulary; they are never converted to support, conflict, dominance, balance, priority, or meaning.

Access is limited to deterministic identities, statuses, counts, sourceRefs/provenance, and structural relation evidence. Theme, narrative, psychology, meaning weights, ranking, prompts, questions, advice, user-experience inference, and natural-language interpretation are forbidden. The boundary also rejects simulation, Placidus, frozen-speed, legacy Prep, and unverified-provider contamination.

The complete state is `localResearch: eligible_for_local_interpretation_research`; user delivery and production activation are blocked, human review is required, and `availableForInterpretation: false`, `connected: false`, `not_connected`, `blocked`, and `interpretation_packet_not_activated` remain unchanged. Passing this protocol is not interpretation approval or activation.

Materialize and independently check:

```sh
node scripts/materialize-astrology-interpretation-read-protocol-v1.mjs
node scripts/check-astrology-interpretation-read-protocol-v1.mjs
```

The evidence wrapper includes complete output and representative fail-closed negative cases. Its byte hash is over the exact materialized UTF-8 bytes; the protocol content hash excludes only `protocolContentSha256` and uses recursively sorted object keys, preserved array order, JSON, and LF.
