# Astrology / DE405 local storage cleanup

Status: `complete_astrology_de405_local_storage_cleanup_uncommitted`

## Scope and snapshot

- Repository: `softie_project`; branch: `main`
- Inspection HEAD: `c1d03f3467d3e4ef8fb2b8ae334d6e27e314f938`
- `main...origin/main`: `0 0`; staged paths before cleanup: `0`
- Existing `package.json` Strategy-C change was preserved. Existing DE405/native/generated untracked paths were not changed.
- Inspected roots: repository root, `artifacts/`, native/build/generated paths, `$HOME/.local/share/softie-de405`, `/private/tmp` (same filesystem view as `/tmp`), and the current `$TMPDIR` location. `.git/`, secrets, and other repositories were not modified.
- Symlinks were enumerated without recursive traversal of their targets. `JPLEPH -> tools/de405-jpl-reader/fixtures/lnxp1600p2200.405` was preserved.

## Storage measurement

The filesystem snapshot immediately before the approved deletion showed `194,373,764 KiB` used and `19,218,704 KiB` available. After deletion and removal of the two audit-scratch measurement files it showed `194,373,360 KiB` used and `19,219,108 KiB` available. The observed free-space increase was `404 KiB`; the exact regular-file bytes removed were `284,527` bytes. These values are snapshots: filesystem activity and allocation granularity can make the free-space delta differ from logical file bytes.

Repository inventory at inspection time was approximately `1,047,084 KiB` for `artifacts/`, `56,284 KiB` for `tools/`, and `1,448 KiB` for `dist/`. The external DE405 installation was approximately `167,652 KiB` apparent. No broad cache, build tree, artifact directory, or parent temporary directory was deleted.

## Classification and preservation

### `required_canonical`

Preserved because current runners, golden materialization, or validation contracts depend on them:

| role | path | size | SHA-256 |
|---|---|---:|---|
| DE405 BSP | `$HOME/.local/share/softie-de405/kernels/spk/de405.bsp` | 10,898,432 | `30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89` |
| CSPICE N0067 library | `$HOME/.local/share/softie-de405/cspice/N0067/lib/cspice.a` | 6,991,568 | `f3a1adf1742c7a63c390834f4227936a36e3c18dd78bf427bc96a04b703946f3` |
| CSPICE support library | `$HOME/.local/share/softie-de405/cspice/N0067/lib/csupport.a` | 888,144 | `6f293e8a096860279a349743b420ad53b323c3df13cab8b4befbd47bfec2197b` |
| canonical-v2 native runner | `tools/de405-cspice-runner/build/de405-canonical-v2-runner` | 1,343,336 | `92297c604fe43a147bc1f16cfbe33bf482f9ae7d001cd1c6fad87c5d5c2b8964` |
| Ephemeris golden fixture | `test/fixtures/astrology/golden/astrology-ephemeris-golden-v1.json` | 65,288 | `afabd5542479d761657f461050df649102843b867d6b985be2a274e2b3209aa` |

The JPL reader fixture, current native build sources, and the full CSPICE/toolchain directory were also preserved. The golden fixture hash is the canonical replacement for the deleted temporary golden outputs.

### `required_evidence_archive`

Preserved: the tracked and untracked `artifacts/` tree; raw residual-sweep JSONL; controlled-build matrix output; route/Strategy-C evidence; the recovered remote workflow directory under `/private/tmp/de405-remote-30768814210`; failed workflow metadata under `/private/tmp/de405-run-30748244499`; source-equivalence output; official download/extraction checks; sample release ZIPs and extracted raw JSONL; and the DE405 Linux summary directories. These are not interchangeable merely because some payload bytes repeat: their workflow/run/provenance context differs.

Large raw artifact hashes rechecked from actual bytes:

- `artifacts/de405-jpl-cspice-residual-sweep.samples.jsonl`: 280,780,522 bytes, `62192cde5fdecbf53307ed532da212156bc7dcc4beade08117a6bd75c1101d84`
- `artifacts/de405-jpl-cspice-residual-sweep.jpl.jsonl`: 169,710,274 bytes, `2f68957b05830e03a0996decec46bcfa3415cead335554731c5340c98a9d212b`
- `artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl`: 79,915,561 bytes, `07b51b47dee7042056f7b127886e93f7f0d84283348d5a941f8be27ca65ac08b`
- `artifacts/de405-jpl-cspice-residual-sweep.manifest.jsonl`: 63,738,094 bytes, `99ba50c4e58c76db9dc0fb76bbbbeefa99d5528d12d8e6e930754fabfe205992`

The raw Astrology query/state JSONL under `/private/tmp` was not deleted because it is a unique recent DE405 inspection record and its evidence role could not be disproved from repository references alone. The open official extraction directory was also explicitly retained after `lsof` reported an active consumer.

### `reproducible_cache`

`node_modules/`, `dist/`, and ordinary native build outputs are reproducible from the lockfile/source and build commands, but were preserved because they are pre-existing user-owned working material or current validation inputs. Regeneration requires the existing lockfile and dependencies; `dist/` requires `npm run build`; DE405 runners require the external CSPICE/DE405 inputs and the relevant `tools/*/build.mjs` command. No cache-wide cleanup was attempted.

### `task_owned_temporary`

The following exact paths were deleted after regular-file, owner, non-symlink, no-open-file, no-repository-reference, and canonical-duplicate/reproducibility checks:

| exact path | bytes | reason |
|---|---:|---|
| `/private/tmp/astrology-golden-run-1.json` | 62,855 | stale/failure golden output; reproducible and no consumer |
| `/private/tmp/astro-golden-1.json` | 65,288 | byte-identical to tracked golden fixture |
| `/private/tmp/golden-1.json` | 65,288 | byte-identical to tracked golden fixture |
| `/private/tmp/astrology-npm-test.log` | 89,432 | reproducible test log with no consumer |
| `/private/tmp/golden-materialize-1.log` | 322 | duplicate materializer log |
| `/private/tmp/golden-materialize-2.log` | 322 | duplicate materializer log |
| `/private/tmp/astro-golden-materialize-1.log` | 322 | duplicate materializer log |
| `/private/tmp/astro-golden-materialize-2.log` | 322 | duplicate materializer log |
| `/private/tmp/astrology-de405-cleanup-df-before.txt` | 188 | audit scratch created by this cleanup and no longer needed |
| `/private/tmp/astrology-de405-cleanup-df-after.txt` | 188 | audit scratch created by this cleanup and no longer needed |

Deleted path count: `10`. No directory, symlink, canonical input, raw evidence archive, tracked file, or Strategy-C file was deleted.

### `unknown_or_user_owned`

Preserved without modification: all current untracked `artifacts/`, `scripts/`, `test/`, and `tools/` Strategy-C/native/generated work; `dist/`; `node_modules/`; `.env*`; ignored debug helpers; the toolchain-image downloads whose provenance differs despite similar names; official/sample/source-equivalence temporary trees; and any path not explicitly listed in the deletion table. Ambiguous ownership or uniqueness was treated as a stop condition for deletion.

## Remaining large items

The largest remaining repository files are the residual-sweep samples (`280,780,522` bytes), JPL sweep (`169,710,274`), CSPICE sweep and controlled-build matrix outputs (about `79.9 MiB` each), the residual manifest (`63,738,094`), the JPL reader fixture (`55,900,416`), and the cross-platform/non-exact, first-divergence, center-chain, route, and Strategy-C evidence files. These remain because they are evidence or current validation inputs, not disposable build residue.

## Reproduction and verification commands

- Golden materialization: use the repository's existing Astrology golden materializer and tracked fixture contract; do not substitute a temporary output.
- Verified adapter boundary: `node scripts/check-verified-astrology-boundary.mjs`.
- DE405 artifact contract: `npm run check:de405:artifacts`.
- Cross-platform evidence contract: `npm run check:de405:cross-platform-evidence`.
- Ephemeris-focused tests and actual 10-body adapter smoke use the existing package scripts/native runner and were run in the post-cleanup validation below.
- Build regeneration: `npm run build`.

Commit target: `uncommitted`. Staging, commit, push, deploy, workflow dispatch, Release operations, and remote database changes were not performed.
