# Independent astrology reference spike

This spike evaluates whether Astrolog 8.00 can act as a Swiss-independent
reference for ASC, MC, and Placidus house cusps. It is isolated from `src/`
and is never imported by the product pipeline.

## Safety boundary

- No Swiss Ephemeris, Placalc, JPL Web, or wrapper code is linked.
- No external executable is tracked.
- The source checkout and generated binary stay outside Git.
- Only public/synthetic fixture inputs are used.
- Astrolog's Matrix planetary and lunar-node results are not accepted as
  product calculations or as a True Node external reference.
- A polar Placidus warning means the emitted cusps are Porphyry fallback
  values and therefore unavailable as Placidus reference data.

## Pinned source

- Project: Astrolog 8.00
- Repository: `https://github.com/CruiserOne/Astrolog.git`
- Commit: `5bf172ea231c4b6ea3d7e09ca307571354a41e8a`
- Upstream release date: 2026-05-31
- License: GPL-2.0-or-later

The upstream default build enables Swiss Ephemeris and Placalc. The build
script disables those defines in a temporary copy, disables graphics and JPL
Web access, and compiles an explicit allowlist of core and Matrix source files.

## Run

```sh
ASTROLOG_SRC=/absolute/path/to/pinned/Astrolog \
  ./scripts/build-matrix-reference.sh

./scripts/run-fixtures.sh
```

Generated sources, binaries, and repeat-run evidence are written below
`generated/` and ignored by Git. The checked-in `fixtures/raw/` files are the
raw observations captured for this phase; they are not Golden Fixtures.
