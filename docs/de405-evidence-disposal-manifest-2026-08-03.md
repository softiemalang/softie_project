# DE405 evidence disposal manifest (2026-08-03)

- Decision: `complete_de405_raw_evidence_disposal_uncommitted`
- HEAD: `3c3b45dc9c79507ccc8759f1ff7a8afac7349865`; branch: `main`; main/origin parity: `0	0`
- Commit status: `uncommitted`
- Audited roots: $REPO/artifacts, $TMPDIR/de405-remote-30768814210, $TMPDIR/de405-run-30748244499, $TMPDIR/de405-setup-30768513595, $TMPDIR/de405-linux-remote-4285P4, $TMPDIR/de405-sample-release-one.qbUQfF, $TMPDIR/de405-sample-release-two.xzMoUt, $TMPDIR/de405-sample-asset-check, $TMPDIR/de405-linux-asset-iOGC1t, $TMPDIR/astro-query.jsonl, $TMPDIR/astro-states.jsonl, $TMPDIR/de405-source-equivalence (result/provenance boundary only; source trees not expanded), $TMPDIR/de405-official-extracted-check (top-level/provenance boundary only; extracted source tree not expanded), $TMPDIR/de405-naif-download-check (top-level/provenance boundary only; extracted source tree not expanded), $TMPDIR/.de405-official-download (top-level/provenance boundary only), $HOME/.local/share/softie-de405 (read-only canonical runtime inventory)
- Audited files: 191 before, 177 after
- Audited bytes: 6714277994 before, 4748799352 after; reclaimed logical bytes: 1965478642
- Classification counts: required_verification_input=67, required_unique_evidence=84, unknown_or_user_owned=2, cold_archive_optional=24, fully_reproducible_disposable=1, duplicate_disposable=13

## Minimum canonical evidence set

- `$HOME/.local/share/softie-de405/kernels/spk/de405.bsp` — required_runtime; canonical DE405 kernel
- `$HOME/.local/share/softie-de405/cspice/N0067/lib/cspice.a` — required_runtime; CSPICE N0067 library
- `$HOME/.local/share/softie-de405/cspice/N0067/lib/csupport.a` — required_runtime; CSPICE support library
- `tools/de405-cspice-runner/build/de405-canonical-v2-runner` — required_runtime; canonical-v2 runner
- `tools/de405-jpl-reader/build/de405-jpl-canonical-v2-runner` — required_runtime; official JPL reader runner
- `tools/de405-jpl-reader/fixtures/lnxp1600p2200.405` — required_runtime; JPL reader input fixture
- `test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json` — required_verification_input; Golden Astrology evidence
- `docs/de405-legacy-native-cross-environment-summary.json` — required_unique_evidence; cross-environment result summary
- `docs/de405-legacy-native-cross-environment-remote-record.json` — required_unique_evidence; remote provenance record
- `docs/de405-linux-architecture-remote-record.json` — required_unique_evidence; remote architecture provenance
- `docs/de405-linux-architecture-summary.json` — required_unique_evidence; cross-platform summary and hashes
- `docs/de405-controlled-build-triangle-evidence.json` — required_unique_evidence; controlled-build evidence
- `artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl` — required_verification_input; current artifact checker and sweep input
- `artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl` — required_verification_input; current artifact checker and manifest identity
- `artifacts/de405-jpl-cspice-residual-sweep.jpl.jsonl` — required_verification_input; JPL overlap result stream
- `artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl` — required_verification_input; CSPICE overlap result stream
- `scripts/run-de405-jpl-cspice-residual-sweep.mjs` — required_verification_input; reproduction command
- `scripts/generate-de405-canonical-v2.mjs` — required_verification_input; canonical-v2 reproduction command
- `scripts/validate-de405-canonical-v2.mjs` — required_verification_input; canonical-v2 checker
- `test/de405ArtifactReadiness.test.js` — required_verification_input; artifact contract tests
- `test/de405CanonicalV2Smoke.test.js` — required_verification_input; canonical-v2 smoke contract
- `test/de405JplCspiceOverlapEvidence.test.js` — required_verification_input; JPL/CSPICE overlap contract

## Disposal

Deleted only exact external duplicate paths recorded in the JSON manifest; repository artifacts, canonical runtime, tracked evidence, Strategy-C material, remote provenance, and official inputs were preserved. The four residual sweep JSONL files remain required verification inputs because current consumers and the artifact readiness contract still read them.

- DELETED `artifacts/.DS_Store` — 6148 bytes, SHA-256 `e8ab059e9431af4d9d3ea23701566216448b90c98ab07ef76924187fb124a36e`; Finder metadata; outside the artifact contract
- DELETED `/private/tmp/de405-linux-asset-iOGC1t/sample.zip` — 280781846 bytes, SHA-256 `5fb3f6f7c5a7b20f9081d1f16a6f000c00df8594c88606344a9c8d833b9aa1c8`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-linux-asset-iOGC1t/sample.zip.extracted/de405-jpl-cspice-residual-sweep.samples.jsonl` — 280780522 bytes, SHA-256 `62192cde5fdecbf53307ed532da212156bc7dcc4beade08117a6bd75c1101d84`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-linux-asset-iOGC1t/sample.zip.extracted/sample-asset-manifest.json` — 1008 bytes, SHA-256 `864d912dd07983de0cbde82e671399047b4684257c4439f5ddfb7a8949f92eb7`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/one/de405-sample-asset.zip` — 280781846 bytes, SHA-256 `5fb3f6f7c5a7b20f9081d1f16a6f000c00df8594c88606344a9c8d833b9aa1c8`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/one/de405-sample-asset.zip.extracted/de405-jpl-cspice-residual-sweep.samples.jsonl` — 280780522 bytes, SHA-256 `62192cde5fdecbf53307ed532da212156bc7dcc4beade08117a6bd75c1101d84`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/one/de405-sample-asset.zip.extracted/sample-asset-manifest.json` — 1008 bytes, SHA-256 `864d912dd07983de0cbde82e671399047b4684257c4439f5ddfb7a8949f92eb7`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/one/sample-asset-record.json` — 418 bytes, SHA-256 `477d86164d2c3dade8f478e2c759666e655fe082d95fac857774db260e033880`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/one/stage/de405-jpl-cspice-residual-sweep.samples.jsonl` — 280780522 bytes, SHA-256 `62192cde5fdecbf53307ed532da212156bc7dcc4beade08117a6bd75c1101d84`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/one/stage/sample-asset-manifest.json` — 1008 bytes, SHA-256 `864d912dd07983de0cbde82e671399047b4684257c4439f5ddfb7a8949f92eb7`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/two/de405-sample-asset.zip` — 280781846 bytes, SHA-256 `5fb3f6f7c5a7b20f9081d1f16a6f000c00df8594c88606344a9c8d833b9aa1c8`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/two/sample-asset-record.json` — 418 bytes, SHA-256 `801a9e665dded7957d05156db33836c69716d8baeb41b635fed84cc0334eb85f`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/two/stage/de405-jpl-cspice-residual-sweep.samples.jsonl` — 280780522 bytes, SHA-256 `62192cde5fdecbf53307ed532da212156bc7dcc4beade08117a6bd75c1101d84`; exact byte duplicate of the canonical sample release/input; no unique remote provenance
- DELETED `/private/tmp/de405-sample-asset-check/two/stage/sample-asset-manifest.json` — 1008 bytes, SHA-256 `864d912dd07983de0cbde82e671399047b4684257c4439f5ddfb7a8949f92eb7`; exact byte duplicate of the canonical sample release/input; no unique remote provenance

## Unresolved

- repository ignored artifacts with no direct consumer remain cold_archive_optional because unique diagnostic/evidence role was not disproven
- OCI setup image hash ca4cc3db... differs from remote run archive 6447e903... and is therefore not disposable
- Actions variant JSONL hashes are equal but provenance is distinct
- readiness checker still requires the four residual streams; no contract relaxation was attempted

## Regeneration

- `npm run de405:overlap:sweep`
- `node scripts/generate-de405-phase-c-evidence.mjs`
- `node scripts/generate-de405-canonical-v2.mjs`
- `requires the recorded DE405 SPK, JPL fixture/reader, CSPICE N0067, native runners, and exact source/input identities`

Machine-readable per-file lineage, consumers, hashes, classifications, preserved boundaries, and validation plan: [JSON manifest](./de405-evidence-disposal-manifest-2026-08-03.json).
