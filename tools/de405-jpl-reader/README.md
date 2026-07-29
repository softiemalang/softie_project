# DE405 JPL Official Reader Tooling

This directory contains the build tooling, Fortran reader wrapper source, and extraction tools for the official JPL DE405 reader (`testeph.f`) and binary (`lnxp1600p2200.405`).

## Provenance Requirements

- Official reader source: `testeph.f`
  - URL: `https://ssd.jpl.nasa.gov/ftp/eph/planets/fortran/testeph.f`
  - SHA-256: `18f32f073c1a345850d9deebc8b53b06c83a386c066b566f65001b51adeb7120`
- Official DE405 binary: `lnxp1600p2200.405`
  - URL: `https://ssd.jpl.nasa.gov/ftp/eph/planets/Linux/de405/lnxp1600p2200.405`
  - Size: `55,900,416` bytes
  - SHA-256: `7ec77287b6fddd3d7adabb87709ee5e926e3d1123fbae5d1485a42913cf175e7`

## Build Workflow

1. Download sources (explicit bootstrap only):
   ```bash
   node scripts/fetch-de405-jpl-sources.mjs
   ```
2. Build native runner:
   ```bash
   node tools/de405-jpl-reader/build.mjs
   ```

`build.mjs` strictly performs local checks only (no network requests). It invokes `extract-reader.mjs` to extract subroutines mechanically from `testeph.f` into `build/generated_testeph_subroutines.f` with full provenance tracking.

## Single Authority Serialization

The Fortran runner emits raw machine-readable state streams (IEEE-754 double precision components). The Node generator (`scripts/generate-de405-jpl-canonical-v2.mjs`) is the single authority for `%.16e` decimal formatting, negative-zero normalization, JSONL key ordering, LF line endings, manifest generation, and atomic writes.

For arbitrary-ET overlap evidence, the runner also accepts a common JSONL query
manifest in one execution:

```bash
node tools/de405-jpl-reader/run.mjs --evaluate-et-batch \
  --binary tools/de405-jpl-reader/fixtures/lnxp1600p2200.405 \
  --input-jsonl sweep.manifest.jsonl --output-jsonl jpl.states.jsonl
```

Each row retains `sampleId` and `queryEtHex`, calls the official `DPLEPH` entry
point, and reports the JPL outer record and target subinterval metadata. The
existing stream mode remains unchanged.
