# Astrology provider/runtime deployment audit v1

## Observed local facts

| Constraint | Result | Evidence boundary |
|---|---|---|
| Application runtime | Node package with `type: module`, Vite 6.4.3 build, React 18; local Node version is the executing test runtime | `package.json`; no `.nvmrc` or `.node-version` |
| Deployment target | GitHub-driven Vercel is the repository assumption; no `vercel.json`, `api/`, or server function is present | repository scan; actual project binding/deployment settings are `unknown` |
| Native executable | Local tooling uses `node:child_process` for DE405 probes; browser production execution is not proven | existing `tools/` and `scripts/`; production capability `unknown` |
| BSP/kernel | Existing contract uses DE405 and records a verified SHA/coverage in evidence; repository does not contain a newly approved production BSP bundle | readiness/artifact contracts; exact production supply path `unknown` |
| Runner outputs | Existing local/native evidence includes platform-specific outputs; current service artifact publication/ABI matrix is not configured | existing DE405 artifacts/workflows; service ABI `unknown` |
| Filesystem | Vercel documentation describes read-only function filesystem with writable `/tmp`; this repository has no bound function. Persistent production filesystem is `unknown` | official runtime docs; local config absence |
| Cold start/lifecycle | Vercel documents archival/cold-start behavior and bounded function duration; this app's actual plan, region, concurrency, and process lifecycle are `unknown` | official runtime docs; no deployment binding |
| Concurrency/timeout | Vercel publishes Node limits, but no project function or `maxDuration` is configured locally; effective values are `unknown` | official limits docs; local config absence |
| Secrets/artifacts | Frontend reads `VITE_*` build-time variables and Supabase client config; provider artifact/secret delivery is not configured | existing `src/lib/supabase.js`; no provider env contract |
| Orchestration ownership | Current production Prep/API/DB connection is intentionally absent. Phase-1 recommendation assigns orchestration to a future API/service boundary; activation remains user-approved and blocked | readiness/adapter contracts; readiness artifact inventory is 30 cases (2 ready, 28 blocked) |

## Local evidence identity

Readiness evidence uses explicit scopes: `payloadCanonicalSha256` for `{schemaVersion, contract, cases}`, `documentCanonicalSha256` for the complete JSON document, and `fileBytesSha256` for final raw bytes. The final file does not contain its own byte hash; byte and document hashes are recorded in `artifacts/astrology-verified-readiness-v1.integrity.json`. Provider preflight uses `providerBundleCanonicalSha256`, `manifestCanonicalSha256`, and `manifestFileBytesSha256` with the same separation. The preflight ready case remains activation-blocked.

The audit does not infer that Vercel can execute the local native runner. A deployment decision remains blocked until a concrete server runtime, platform/ABI, artifact size, process lifecycle, timeout, concurrency, filesystem, and secret policy are supplied.

## Official constraints used

- Vercel Node functions support Node APIs, but have bundle, duration, memory, file descriptor and concurrency limits; the filesystem is read-only except for `/tmp` scratch space. These are platform facts, not proof of this repository's deployment binding.
- IANA describes named timezone identities and warns that DST transitions and historical coverage require explicit handling; the provider owns the IANA release identity and the input resolver owns fold/gap disambiguation.
- IERS Bulletin A supplies daily UT1-UTC values and predictions; DUT1 is therefore versioned evidence with an effective/expiry policy, not a silently refreshed runtime value.
- NAIF documents supported toolkit environments, cautions about unsupported ports, permits redistribution of unmodified NAIF kernels, and restricts redistribution of the unmodified Toolkit without prior clearance. Toolkit notices and source URLs must travel with any approved bundle.

Sources: [Vercel runtimes](https://vercel.com/docs/functions/runtimes), [Vercel limits](https://vercel.com/docs/functions/limitations), [IANA theory](https://www.iana.org/time-zones/theory), [IERS Bulletin A metadata](https://datacenter.iers.org/versionMetadata.php?filename=mt/bulletina-xxxix-002.txt), [NAIF Toolkit](https://naif.jpl.nasa.gov/naif/toolkit.html), [NAIF rules](https://naif.jpl.nasa.gov/naif/rules.html).
