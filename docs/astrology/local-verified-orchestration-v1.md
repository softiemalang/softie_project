# Local verified astrology orchestration v1

This is an additive, local, dry-run-only boundary. It accepts a normalized
civil-time/location object, a versioned offline provider bundle, an injected
runtime identity probe, and an already selected canonical-v2 evaluator. It
does not fetch, cache, persist, invoke Prep/API/DB, or activate a service.

## Stage contract

`input` validates the orchestration input schema and carries resolved UTC,
IANA timezone, explicit fold/gap resolution, and verified location. The
provider bundle then supplies DUT1, leap-second/TAI-UTC, TT−UTC, and
deterministic TDB−TT values. Its canonical hash is the first immutable
provenance anchor; stale, tampered, out-of-range, or network/cache material is
blocked.

The runtime stage requires verified BSP hash/coverage, runner protocol and
identity, and `de405-canonical-v2` selection. Time & Angle consumes normalized
UTC, DUT1, TT−UTC, and location; Ephemeris consumes TT plus TDB−TT as ET and
the injected evaluator; Raw Chart records the BSP/runner/evaluator chain.
Rule Core consumes only the verified raw document and produces Whole Sign
rules. Raw and Rule canonical SHA-256 values are then supplied to the existing
Verified Adapter. Readiness independently checks provider/runtime/document
evidence and contamination.

Any blocked stage stops downstream calculation and returns explicit reason
codes. No zero, empty, synthetic position, or legacy resolver is substituted.
The legacy date-seed/simulation, Placidus, frozen-speed, Prep, prompt, API,
UI, Supabase, and database paths are outside this boundary and are rejected as
contamination or remain statically disconnected.

## Materialization and activation

`materialize-astrology-local-orchestration.mjs` uses the local canonical BSP
and runner when both are available, while recording only role, hash, coverage,
and protocol identities—not binary paths or native bytes. The provider policy
adopts a versioned offline snapshot plus build/release materialization; network
fetch/cache and same-process native child approaches are rejected, and an
independent service/sidecar is deferred.

The result is calculation-complete only when every stage is verified. Even
then its fixed activation boundary is:

`availableForInterpretation: false`, `integrationStatus: not_connected`,
`serviceEligibility: blocked`, reason `activation_requires_user_approval`.

Future production activation requires a separate explicit user approval and a
separate consumer boundary. This local evidence cannot promote itself.
