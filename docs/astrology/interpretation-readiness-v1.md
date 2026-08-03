# Astrology Interpretation Readiness v1

`astrology-interpretation-readiness-v1` is a deterministic policy layer above
`astrology-interpretation-context-v1`. It evaluates an existing packet/context
pair; it does not calculate a claim, create a topic or sentence, or activate a
consumer.

The complete verified fixture has 53 claims: 20
`observed_or_calculated` and 33 `deterministically_derived`. Readiness requires
the context and packet schemas, both content hashes, the packet/context hash
link, provenance and sourceRefs, the allowlisted vocabulary, epistemic
separation, the Whole Sign and DE405 canonical-v2 boundaries, and all consumer
shields. It rejects simulation, Placidus, frozen-speed, legacy Prep, promoted
unsupported/forbidden claims, and activation-boundary promotion.

The decision object deliberately contains separate statuses:

- `eligible_for_local_interpretation_research` (only when every structural
  check passes);
- `not_eligible_for_user_delivery`;
- `production_activation_blocked`;
- `human_review_required`.

Thus a complete readiness result is still not an activation result. It keeps
`availableForInterpretation: false`, `connected: false` by policy boundary,
`integrationStatus: not_connected`, `serviceEligibility: blocked`, and
`interpretation_packet_not_activated`. UI, DB, production, external API, and
LLM are not consumers of this layer.

`packetContentSha256`, `contextContentSha256`, and
`readinessContentSha256` hash their respective objects excluding their own
hash, with recursively sorted object keys, preserved array order, JSON, and a
final LF. `artifactByteSha256` is separately the hash of the exact materialized
evidence bytes.

Materialize and independently check the local evidence:

```sh
node scripts/materialize-astrology-interpretation-readiness-v1.mjs
node scripts/check-astrology-interpretation-readiness-boundary.mjs
```

The materializer includes complete evidence and fail-closed cases for schema,
hash, provenance/sourceRefs, claim count/vocabulary, epistemic mixing,
activation, consumer promotion, simulation, Placidus, frozen-speed, and legacy
Prep contamination.
