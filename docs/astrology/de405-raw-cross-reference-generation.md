# DE405 raw cross-reference generation

`scripts/generate-de405-cross-reference.mjs` is the deterministic, development-only
runner for Gate D raw comparison evidence. It validates the JPL DE405 binary,
NAIF SPK, and timestamp fixture against `test/fixtures/astrology/de405/manifest.json`
before invoking the preserved official JPL reader and CSPICE runner.

The canonical output is JSONL: one LF-terminated row per fixture timestamp, with
fixed field order, finite numeric values, `JD TDB`, `Sun→Earth` in `J2000`, km and
km/s residuals, and `ET=(jdTdb-2451545.0)*86400.0`. Generated raw output is not
versioned.

Example:

```bash
node scripts/generate-de405-cross-reference.mjs \
  --jpl-binary /path/to/lnxp1600p2200.405 \
  --naif-spk /path/to/de405.bsp \
  --timestamps /path/to/verified-timestamps.txt \
  --official-reader /path/to/de405-batch-o0 \
  --cspice-runner /path/to/contract_runner \
  --output /tmp/de405-raw-comparison.jsonl \
  --json
```

As of 2026-07-29, execution remains fail-closed because the verified 36,525-row
timestamp fixture identified by manifest hash `f3198ef890e61b4a60f38d27ec9e6a69540759a444d3541ca32c5833e6241377`
is not present. The discovered investigation files contain 36,525 rows but do
not have that hash. No raw artifact, baseline, manifest, or numeric policy is
automatically modified.
