# Test-suite separation audit checkpoint v1

- Checkpoint date: `2026-08-19`
- Observed checkout HEAD: `063d5a7e79efc5db6a358c424777ce6187ecba8e`
- Branch: `main`
- Scope: test discovery partition, Ziwei P0 negative-runner isolation, and
  source-bound/historical-source separation
- Change class: documentation checkpoint only

This checkpoint records the observable contracts in the current working tree.
It does not change test meaning, profile membership, skip expressions,
materializers, canonical artifacts, fixture bytes, or execution concurrency.
Pre-existing tracked and untracked work outside this checkpoint is excluded.

## 1. Intentional default skips

These are the two skips observed by the default suite. A skipped test is not
counted as an external verification pass.

| Test | Condition | Meaning when skipped | Current profile |
| --- | --- | --- | --- |
| `test/de405OfficialInputs.test.js` — official NAIF archive and SPK | Either `DE405_OFFICIAL_CSPICE_ARCHIVE` or `DE405_OFFICIAL_SPK` is absent | Official CSPICE/SPK bytes were not supplied; no source hash or extraction check ran | `default`, `all` |
| `test/designReferenceLowRiskInteractionFoundationBatch.test.js` — exact materialization replay | `git rev-parse HEAD` differs from pinned `BASELINE_HEAD=52df5f9ac7d3309140b076711de0fc008ae4db82` | Frozen historical replay was not attempted from a different checkout; stored artifact validity is unchanged | `default`, `all` |

The first condition is intentional because official NAIF inputs are acquired per
job and are not repository fixtures. When both paths are supplied, the test
checks the fixed CSPICE and DE405 hashes, the 2,547-file source manifest, and
source-only extraction. The adjacent workflow/provenance contract test remains
default.

The second condition is intentional because the materializer rejects a
non-baseline HEAD. The stored artifact, integrity sidecar, source references,
and tamper-boundary tests remain current default checks; only exact replay is
conditional. Neither skip is an obsolete exception or a license to regenerate
an artifact from the current HEAD.

## 2. Discovery and profile partition

The source of truth is `scripts/lib/test-suite-discovery.mjs`:

- `default`: complement of explicit source, historical, and artifact sets
- `source`: 24 explicitly source-bound test files
- `historical`: 13 Ziwei P0 v3–v15 files plus 4 Saju historical snapshot files
- `artifact`: files under `test/de405-artifacts/`
- `all`: the union of the four disjoint partitions

Observed file counts at this checkpoint:

| Profile | Files |
| --- | ---: |
| default | 176 |
| source | 24 |
| historical | 17 |
| artifact | 13 |
| all | 230 |

`discoverTestSuites()` rejects duplicate or unassigned files. The partition
test also verifies sorted output, exact source/historical lists, default
exclusion, and the `{ file, profile }` assignment ledger. The runner keeps the
existing sequential Node test invocation (`--test-concurrency=1`); this
checkpoint does not change concurrency.

The command mapping is:

```text
npm test                 -> default
npm run test:source      -> source
npm run test:historical  -> historical
npm run test:all         -> all
```

## 3. Ziwei P0 negative-runner checkpoint

The v2–v15 negative checkers use the shared
`scripts/lib/run-ziwei-p0-negative-mutations.mjs` helper. Its isolation
contract is:

1. Materialize one `historical_reference` base bundle in a temporary directory.
2. Snapshot every base output and its integrity sidecar byte-for-byte.
3. Clone the base payload per mutation into a separate temporary directory.
4. Recompute only the temporary candidate sidecar, run the versioned checker,
   and require rejection.
5. Assert the original base payload and sidecars are unchanged, then remove
   temporary directories.

The direct runner audit at this checkpoint covered all 14 wrappers and 209
mutations:

| Version | Mutations | Rejected | Base snapshot unchanged |
| ---: | ---: | ---: | --- |
| v2 | 12 | 12 | yes |
| v3 | 12 | 12 | yes |
| v4 | 12 | 12 | yes |
| v5 | 15 | 15 | yes |
| v6 | 19 | 19 | yes |
| v7 | 21 | 21 | yes |
| v8 | 20 | 20 | yes |
| v9 | 14 | 14 | yes |
| v10 | 16 | 16 | yes |
| v11 | 16 | 16 | yes |
| v12 | 15 | 15 | yes |
| v13 | 14 | 14 | yes |
| v14 | 11 | 11 | yes |
| v15 | 12 | 12 | yes |
| **total** | **209** | **209** | **yes** |

The negative suite therefore preserves mutation coverage while removing
repeated canonical/base artifact materialization from the mutation loop.

## 4. Source-bound and historical-source checkpoint

The source profile retains source-dependent success contracts and fails closed
when required real inputs are absent. The default resolver test retains
source-independent missing, hash-mismatch, malformed-input, and no-fallback
contracts. The source-bound resolver success cases are in
`test/pdfSourceResolverSourceProfile.test.js`.

The historical profile contains exact snapshot tests for:

- Ziwei P0 v3–v15 historical artifacts
- ANU v6–v12 direct inspection
- 命理約言 first-party inspection
- Five Classics claim adjudication
- Saju timing authority frontier

`test/helpers/sajuHistoricalSnapshot.mjs` verifies stored payload bytes,
content/payload hashes, integrity sidecars, artifact identity, and explicit
predecessor identity. It deliberately does not call the current materializer
or compare a saved historical snapshot to a current-HEAD regeneration.

The four Saju historical checkers expose explicit historical mode and preserve
semantic payload checks, blocked readiness, promotion prohibition, and negative
smoke boundaries. No historical artifact is rewritten by these tests.

## 5. Artifact byte checkpoint

The following repository artifact bytes were observed without regeneration or
rewrite during this checkpoint:

| Artifact | Complete bytes | SHA-256 | Sidecar |
| --- | ---: | --- | --- |
| `saju-anu-v6-v12-direct-inspection-v0/complete.json` | 67,342 | `77de507bfd7b9671e0da379b9fca7a9b15cb266829859272633bbf82c032aa98` | matches |
| `saju-mingli-yueyan-first-party-inspection-v0/complete.json` | 46,980 | `4ca9ab5207c5df9da187f19ad353548f9b9666365293e3eb83614c8b7ef6aced` | matches |
| `saju-five-classics-claim-adjudication-v0/complete.json` | 71,633 | `6506c425b8339ea89db681f727978746149acd898205a9826ea1790ffb16fd66` | matches |
| `saju-timing-authority-frontier-v0/complete.json` | 115,059 | `0f8f092f818eeeb5eb10c7fc2abd1223c6dc6815b3c95e2061c4d0f579d873a7` | matches |

## 6. Validation record

The following checks were run against the observed checkout. The source
profile result is an expected fail-closed environment boundary, not a default
suite regression: the required real PDF/image inputs were not supplied.

| Check | Result | Evidence |
| --- | --- | --- |
| focused partition/source-independent/Saju current-plus-historical tests | pass | 23 pass, 0 fail, 0 skip; 1,943.907625 ms |
| direct Ziwei v2–v15 negative-runner audit | pass | 14 wrappers, 209/209 mutations rejected; every base payload and sidecar snapshot unchanged |
| `npm test` / default | pass | 747 tests; 745 pass, 0 fail, 2 skip; 406,744.1005 ms |
| `npm run test:historical` | pass | 41 pass, 0 fail, 0 skip; 665,550.590083 ms |
| `npm run test:source` | expected blocked | 40 tests; 2 pass, 38 fail, 0 skip; missing `PDF_SOURCE_NANBEI_PATH`, `PDF_SOURCE_NANYANGTANG_PATH`, and TOYO external-image inputs |
| discovery partition/hash audit | pass | default/source/historical/artifact/all = 176/24/17/13/230 files; disjoint/complete = true; all four Saju sidecars matched exact byte hash, length, and path |
| `git diff --check` | pass | no whitespace errors |

`npm run test:all` was not re-run in this documentation-only checkpoint. Its
membership is mechanically covered by the disjoint/complete discovery audit;
the source-bound portion remains expected to fail closed until the explicit
real inputs are supplied. Historical exact replay likewise remains dependent
on its pinned baseline HEAD.

No test, profile, skip condition, fixture, artifact, materializer, or package
script was changed to produce this checkpoint.
