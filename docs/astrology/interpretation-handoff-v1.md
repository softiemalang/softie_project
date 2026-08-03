# Astrology interpretation handoff v1

`astrology-interpretation-handoff-v1` is a deterministic manifest boundary for the verified packet, context, readiness, and claim-relation graph. It references the existing evidence artifacts; it does not copy claims, add relations, interpret values, rank claims, or create a prompt.

The materializer records each component's schema/version, content SHA-256, exact artifact-byte SHA-256, and the packet → context → readiness/graph cross-hash links. The complete bundle fixes 53 claims (20 observed/calculated and 33 Rule Core derived), 53 graph nodes, and 1,753 structural edges.

The delivery policy is machine-readable and fail-closed: local interpretation research is eligible, while user delivery, production activation, and activation are blocked; human review is required. The policy preserves sourceRefs/provenance and permits only deterministic component identities, counts, relations, and boundary statuses. It forbids interpretation, theme/narrative synthesis, ranking or meaning weights, claim mutation, psychological relation conversion, prompt injection, and LLM/API calls.

Materialize and check without changing the existing contracts:

```sh
node scripts/materialize-astrology-interpretation-handoff-v1.mjs
node scripts/check-astrology-interpretation-handoff-v1.mjs
```

`complete.json` is an evidence wrapper with a manifest only. Its own artifact byte hash is reported by the materializer/checker because embedding that hash in the same bytes would be self-referential.
