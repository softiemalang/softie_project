# Local Astrology Interpretation Context v1

`astrology-interpretation-context-v1` is a local-only consumer boundary after
`astrology-interpretation-packet-v1`. It accepts a complete packet object, not
raw provider data, a prompt, a Prep session, or a user-facing request. It only
selects and deterministically organizes claims already present in the packet.

## Output contract

The complete context contains:

- `observedOrCalculated.bodies`: longitude and moving-frame speed claims;
- `ruleCoreDerived`: motion state, angle placement, Whole Sign houses, major
  aspects including orb/phase/phase rule, distribution, and chart rulers;
- `unsupported` and `blocked`: preserved packet boundaries;
- `provenance`: packet source identities, source documents, and the union of
  packet and claim sourceRefs.

Every claim remains an object with `claimType`, `value`, `sourceRefs`, and
`epistemic`. The consumer checks the allowlisted vocabulary and requires each
reference to resolve to the packet's raw-chart or Rule Core source role. It
does not calculate a longitude, house, aspect, ruler, distribution, motion, or
interpretation sentence.

The complete context remains
`availableForInterpretation: false`, `integrationStatus: not_connected`,
`serviceEligibility: blocked`, with reason
`interpretation_packet_not_activated`. This is consumer success, not activation
or production readiness.

## Hash scopes

`contextContentSha256` hashes the context object after removing its own hash,
recursively sorting object keys, preserving array order, serializing with
`JSON.stringify`, and appending one LF. `packetContentSha256` is copied as the
input packet identity and is not recomputed from a different scope. The
materializer/checker report `artifactByteSha256` separately over the exact
UTF-8 bytes of the evidence JSON, including formatting and final LF.

Run the local path directly:

```sh
node scripts/materialize-local-interpretation-context-v1.mjs
node scripts/check-local-interpretation-context-boundary.mjs
```

The materializer uses the stored complete packet evidence by default and emits
representative fail-closed evidence for version/activation errors, forbidden
claims, missing sourceRefs, epistemic mixing, simulation/frozen-speed/
Placidus/legacy Prep pollution, content-hash mismatch, and provenance
mismatch. It never calls an external LLM/API, writes to the database, connects
production/UI, or changes readiness.
