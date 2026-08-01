# fast-check property testing

## Pilot

- Tool: `fast-check` 4.9.0
- License: MIT (SPDX: `MIT`; package license file present)
- Purpose: complement existing example-based tests with repeatable property checks.
- Scope: `normalizeDegrees360` only; finite degree inputs, period `360`, output range `[0, 360)`.
- Production code: unchanged.
- Upstream source: unchanged; no fork.

## Run

```bash
npm run test:properties
npm test
```

The pilot uses seed `20260801` and `1000` runs per property by default. Override them with:

```bash
FAST_CHECK_SEED=20260801 FAST_CHECK_RUNS=1000 npm run test:properties
```

On failure, read the property name, `seed`, `path`, and shrunk counterexample from the fast-check output. Re-run with the reported seed and an appropriate `FAST_CHECK_RUNS` value to reproduce it.

Property tests supplement the existing example tests. New properties must be grounded in the established calculation contract. A counterexample is recorded for separate review; this pilot does not automatically modify or weaken production code, skip a failing property, or introduce a new tolerance. Tool upgrades require separate validation.
