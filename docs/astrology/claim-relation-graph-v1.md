# Astrology Claim Relation Graph v1

`astrology-claim-relation-graph-v1` is a deterministic, local-only structural
layer over a complete `astrology-interpretation-context-v1` and a complete,
hash-linked `astrology-interpretation-readiness-v1`. It preserves all 53
claims as nodes: 20 `observed_or_calculated` and 33
`deterministically_derived`. A node retains its context claim path, claim
type, epistemic class, complete value, and source references.

The only edge relations are `same_chart`, `shares_body_subject`,
`shares_angle_subject`, `shares_aspect_endpoint`, `shares_house_subject`,
`shares_ruler_subject`, `shares_distribution_dimension`, and `same_rule_id`.
Edges are undirected by canonical endpoint ordering. Every edge carries the
endpoint source references and an explicit structural basis copied from claim
values or the context packet identity. No edge means support, conflict,
dominance, weakening, balance, importance, priority, or any other meaning.

Orb, phase, motion state, rule identifiers, and numeric values remain inside
the lossless node value. The graph does not recalculate them or convert them
to a score or rank. It does not introduce claims, sources, simulation,
Placidus, frozen-speed, legacy-Prep, UI, database, external API/LLM, or
natural-language output.

Materialize and independently check local evidence with:

```sh
node scripts/materialize-astrology-claim-relation-graph-v1.mjs
node scripts/check-astrology-claim-relation-graph-v1.mjs
```

Graph creation leaves the existing activation boundary unchanged:
`eligible_for_local_interpretation_research`, `not_eligible_for_user_delivery`,
`production_activation_blocked`, `human_review_required`,
`availableForInterpretation:false`, `connected:false`, `not_connected`,
`blocked`, and `interpretation_packet_not_activated`.
