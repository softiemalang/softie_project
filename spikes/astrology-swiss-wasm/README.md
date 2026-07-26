# Swiss Ephemeris WASM feasibility spike

This directory is isolated from `src/` and is not imported by the product
pipeline. It exists only to test the Astro-0.5 build and deployment assumptions.

## Safety boundary

- The Swiss Ephemeris source and generated Swiss artifacts are not vendored.
- Generated Swiss JavaScript, WASM, and `.data` files are gitignored.
- Do not deploy the Swiss build while `licenseDecision` is `license_pending`.
- `web/probe-main.js` is a license-neutral asset-loading probe. It does not
  calculate astrology and must not be treated as an ephemeris adapter.

## Local prerequisites

- An official Swiss Ephemeris checkout pinned by commit.
- Emscripten 6.0.4.
- `SWISS_SRC` and `EMSDK` environment variables.

## Commands

```sh
./scripts/build-swiss.sh
node ./scripts/run-smoke.mjs
./scripts/build-neutral-probe.sh
```

To test the private local Swiss build with Vite:

```sh
npx vite ./spikes/astrology-swiss-wasm/web --host 127.0.0.1
```

The browser page deliberately displays raw engine observations only. It does
not create an Astrology CalculationContext or enable Chat handoff.
