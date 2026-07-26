#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SPIKE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
EMSDK=${EMSDK:?Set EMSDK to the pinned Emscripten SDK checkout}
OUTPUT_DIR=${PROBE_OUTPUT_DIR:-"$SPIKE_DIR/web/public/probe"}

export EMSDK_PYTHON="$EMSDK/python/3.13.3_64bit/bin/python3"
export EMSDK_QUIET=1
. "$EMSDK/emsdk_env.sh"

mkdir -p "$OUTPUT_DIR"

emcc \
  "$SPIKE_DIR/native/neutral_probe.c" \
  -O2 \
  -sSTANDALONE_WASM=1 \
  --no-entry \
  -sEXPORTED_FUNCTIONS='["_astro_asset_probe"]' \
  -o "$OUTPUT_DIR/asset-probe.wasm"

# Shape-comparable, license-neutral payloads used only to verify static asset
# transport. They contain zero bytes and are not ephemeris data.
dd if=/dev/zero of="$OUTPUT_DIR/sepl-shape.bin" bs=1 count=484078 2>/dev/null
dd if=/dev/zero of="$OUTPUT_DIR/semo-shape.bin" bs=1 count=1251136 2>/dev/null

shasum -a 256 "$OUTPUT_DIR"/*
