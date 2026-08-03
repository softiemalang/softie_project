# Verified Astrology Adapter readiness contract v1

This is an additive, offline assessor for the dry-run-only verified adapter. It
does not calculate, fetch, execute a runner, persist, or connect Prep, prompt,
API, UI, or DB. It evaluates injected provider evidence and an injected runtime
probe only. `ready` means calculation inputs and runtime are eligible to be
attempted; it never means service activation.

## Ownership boundary

| Boundary | Owner | Required evidence | Failure behavior |
| --- | --- | --- | --- |
| local civil time + IANA zone → UTC, DST fold/gap | Time & Angle input boundary | resolved UTC, verified IANA zone, explicit fold/gap result | block ambiguous/nonexistent/unverified |
| latitude/longitude | location input validator | explicit coordinates and `verificationStatus: verified` | block |
| DUT1 | Earth-orientation provider | versioned value/unit, source identity/hash, effective/expiry or range, fresh verified status | block missing/stale/out-of-range |
| TAI−UTC / leap-second identity and TT−UTC | time-scale provider | provenance and applicable instant/range match | block missing or mismatched |
| TDB−TT | Ephemeris time-scale provider | value/unit, deterministic model, provenance | block missing/non-deterministic |
| BSP identity/coverage | DE405 artifact boundary | verified hash and requested ET inside coverage | block missing/hash/coverage |
| runner executable/protocol/platform | native runtime probe | injected executable, protocol/version, identity status | block missing/unexecutable/mismatch |
| evaluator selection | canonical-v2 evaluator boundary | verified selection evidence and exact evaluator id | block |
| raw → Rule Core → adapter | document boundary | schema versions and verified hashes | block any mismatch |
| service eligibility | separate activation authority | explicit user approval contract | remains blocked |

## Consumer and compatibility/risk matrix

| Consumer or supply point | Current role | Owner/allowed source | Risk if inferred, hardcoded, or environment-dependent | Contract action |
| --- | --- | --- | --- | --- |
| `src/astrology/astrologyCalendarTime.js` | UTC calendar math | Time & Angle Core | local civil time or DST result silently coerced | require resolved UTC and explicit fold/gap status |
| `src/astrology/astrologyTimeScales.js` / Earth orientation | UT1/TT derivation | Time & Angle Core plus injected providers | DUT1/TT−UTC omitted or replaced with zero | block missing, stale, or mismatched evidence |
| `src/astrology/astrologyEphemerisCore.js` | DE405 state composition | Ephemeris Core plus injected canonical-v2 evaluator | TDB−TT model, BSP, evaluator, or coverage substituted | block; do not change mathematics or tolerance |
| `src/astrology/verifiedAstrologyAdapter.js` | raw → Rule Core → additive dry-run context | adapter boundary | schema/hash/provenance mismatch or service promotion | readiness is a prerequisite, never a wiring call |
| legacy planet/house/aspect resolvers | simulated/legacy calculations | legacy-only | Placidus, date-seed, frozen-speed contamination | reject as fallback |
| Prep and interpretation adapters | production consumers | explicitly disconnected | accidental import or status promotion | static boundary checker and activation block |
| prompt/API/DB/Supabase | handoff and persistence | explicitly disconnected | prompt generation, persistence, or remote mutation | no imports, network, storage, or DB calls |
| server/deployment environment | host/runtime context | injected runtime probe | PATH, platform, compiler, locale, or deployment drift | require runner identity/protocol evidence; no fetch |
| native runner | executable protocol endpoint | injected probe, canonical-v2 only | missing binary, wrong protocol/version, wrong identity | block closed |

The activation call order, if separately approved in the future, is therefore:
resolved civil input → verified location → DUT1/leap-second/TT−UTC evidence →
deterministic TDB−TT → BSP/evaluator selection and coverage → runner probe →
raw schema/hash → Rule Core schema/hash → adapter dry-run orchestration →
separate user-approved service eligibility. The current implementation stops at
the readiness assessment and cannot invoke the final step.

Every provider evidence object requires `provider`, `model`, `version`, a time
or applicable range, `source.identity`, a 64-hex `source.sha256`, `value`,
`unit`, `verificationStatus`, `freshnessStatus`, and deterministic `sourceRefs`.
The assessor never substitutes a nearby source, an environment default, or
zero. Input object key order does not affect the assessment semantics.

## Reason-code contract

The exported `READINESS_REASON_CODES` list is the closed vocabulary. Unknown
codes are an assessor error. The current codes cover civil-time ambiguity and
gaps, timezone/location validation, DUT1 freshness/range, leap-second and
TT−UTC provenance/time mismatch, TDB−TT provenance/determinism, BSP identity
and coverage, runner availability/protocol/identity, evaluator selection,
raw/rule/adapter schema hashes, simulation/Placidus/frozen-speed contamination,
consumer connection, provider evidence shape/status, and the mandatory
`activation_requires_user_approval` boundary.

## Deterministic evidence

`scripts/materialize-verified-astrology-readiness.mjs` emits only fixed
synthetic evidence to `artifacts/astrology-verified-readiness-v1.json`. It
covers a valid calculation-ready case, DST fold/gap, stale DUT1,
non-deterministic TDB−TT, BSP coverage outside, and runner identity mismatch.
The materializer serializes twice and records a canonical SHA-256; the checker
recomputes it and verifies the activation boundary for every case. No personal
data, secret, local absolute path, or native bytes are materialized.

The existing `verifiedAstrologyAdapter` remains dry-run-only. Its existing
legacy, Placidus, simulation, time-angle, ephemeris, Rule Core, and verifier
contracts are unchanged.
