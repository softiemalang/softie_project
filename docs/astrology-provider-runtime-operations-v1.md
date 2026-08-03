# Provider/runtime operations contract v1

## Phase-1 recommendation

Adopt a versioned offline provider snapshot, materialized only after build/release verification, and keep the calculation runtime behind an independent service boundary. The service is deferred and not connected in this phase; local preflight is the only executable integration. This preserves deterministic inputs while avoiding an unproven Vercel native-process assumption.

Ownership is fixed as follows:

| Contract | Owner | Update rule |
|---|---|---|
| IANA zone identity; DST fold/gap | civil-time input resolver | pin IANA release; reject ambiguous/nonexistent local time until explicitly resolved |
| DUT1 evidence and validity | time-scale provider | acquire IERS evidence, record source/hash/effective/expiry; stale means block |
| leap-second identity and TT-UTC | time-scale provider | pin authoritative table/version and hash; range mismatch means block |
| TDB-TT model/version | ephemeris/time-scale provider | pin deterministic model/version and hash; no runtime substitution |
| DE405 BSP hash/coverage | ephemeris provider | verify exact bytes and requested range before publish |
| runner platform/protocol/version | runtime owner | publish platform/ABI/protocol identity and executable probe; mismatch blocks |
| provider bundle canonical hash | release owner | `providerBundleCanonicalSha256` hashes the canonical normalized provider bundle with its self-field omitted; publish atomically |
| preflight manifest hashes | release owner | `manifestCanonicalSha256` hashes the canonical manifest draft with its self-field null; `manifestFileBytesSha256` is the raw manifest file hash held in the deterministic integrity sidecar |
| readiness evidence hashes | release owner | `payloadCanonicalSha256` covers `{schemaVersion, contract, cases}`; `documentCanonicalSha256` covers the complete readiness JSON document; `fileBytesSha256` covers final raw bytes and is held in the sidecar |
| readiness inventory | release owner | materialized assessments currently contain 30 cases: 2 ready and 28 blocked; `all-valid-calculation-ready` and `coverage-boundary-in` are the two positive boundary cases |
| readiness assessor call | API/service boundary | call assessor with the complete evidence document; no fallback cache |
| activation approval | product/user approval boundary | explicit user approval only; current contract remains blocked |

## Update and rollback

Every update follows `acquire -> verify -> normalize -> hash -> review -> publish`. Verification includes source identity, license notice, schema, signature/hash, effective/expiry range, coverage, runner compatibility, and deterministic serialization. Publishing is an atomic whole-bundle replacement. The prior accepted bundle remains available for rollback and is never partially overwritten.

If a source is unavailable, the system may use an already-published bundle only when the requested instant is inside that bundle's explicit effective/expiry/coverage range and the exact bundle hash is retained. Outside that range, or after tamper/hash/protocol/platform mismatch, it blocks. It never silently refreshes or substitutes a nearby source.

The bundle must retain source URLs/identities, raw-byte SHA-256 values, the canonical normalized bundle hash, license notices, acquisition time, effective/expiry times, and reviewer identity. Network fetch, cron, workflow, deploy and automatic cache refresh are explicitly out of scope for Phase-1.

Readiness and provider preflight remain local evidence only. A ready calculation assessment does not activate interpretation: `availableForInterpretation=false`, `integrationStatus=not_connected`, and `serviceEligibility=blocked` remain required until explicit user approval and a separately authorized integration.

Current audited identities: readiness payload `f3e631f4d0d1030644dae57b211bff60ce5582764ff2a0dd24d9d53208690863`, document `0578caacab4d90c1f9a49d323e4dfb7e5ef69b86040619861af29f5f64c3a2e9`, file bytes `a377da4a1bd8c37996c2321c5ee5b737b2d618fdc94f53384c08c6b86f7c25da`; provider bundle canonical `3be2f6d607f716979d56c3279fb74f0c38ac8c797c92874ce13fd89a83f8e320`; preflight manifest canonical `9bc1c120b45b538541573f4faa48bff2c186d05532f3bdfcafbefa08d4b25b58`; preflight manifest file bytes `9acf60f945dbbefc9113eaea9c3db564ab94ad33dd84dafc0d83de83e19552d2`.
