# Astrology conversation grounding contract v1

`astrology-conversation-grounding-v1` is a deterministic evidence bundle for a later conversation layer. It is an assembly boundary, not an interpretation output.

## Inputs and traceability

The builder consumes the existing packet, interpretation context, readiness, and claim relation graph artifacts. It copies the graph's complete claim nodes and relation edges, preserving each node's `claimPath`, `nodeId`, `value`, `epistemic`, `sourceRefs`, and structural evidence. Component content hashes, exact artifact-byte hashes, and cross-input hash links remain in `inputs`.

Every claim and relation must resolve to the context provenance source reference set. No claim is recalculated, merged, removed, ranked, or assigned a personal meaning.

## Epistemic boundary

`epistemicState` uses only controlled statuses: `known`, `unknown`, `user_dependent`, and `unavailable`. `unknown` and `user_dependent` entries are explicit states, not inferred facts. `contextRequirements` contains only structured `domain`, `subject`, `reasonCode`, `status`, and `sourceRefs`; it never contains a question, prompt, or prose interpretation.

The bundle intentionally records that lived experience and personal significance are not supplied, while delivery is unavailable because activation remains blocked. These are contract states, not claims about the user.

## Non-intervention boundary

The bundle contains no natural-language interpretation, question, advice, prompt, LLM call, ranking, dominance, likelihood, or user judgment. Structural graph relations are preserved as co-occurrence evidence only. The existing packet, context, readiness, handoff, read protocol, and conformance meanings are unchanged; production/UI/API/DB paths are not connected.

## Determinism and integrity

Object keys are recursively sorted for `bundleContentSha256`; arrays are explicitly sorted by stable identifiers where the source contract permits ordering. `artifactByteSha256` hashes the exact materialized evidence bytes including formatting and the final LF. The materializer and checker provide positive and negative evidence for omission, provenance breaks, epistemic promotion, question injection, ranking injection, and unstable ordering.
