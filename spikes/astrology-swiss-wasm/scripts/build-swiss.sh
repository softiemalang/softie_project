#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
SPIKE_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
SWISS_SRC=${SWISS_SRC:?Set SWISS_SRC to the pinned official Swiss Ephemeris checkout}
EMSDK=${EMSDK:?Set EMSDK to the pinned Emscripten SDK checkout}
OUTPUT_ROOT=${OUTPUT_ROOT:-"$SPIKE_DIR/generated"}
BUILD_NAME=${BUILD_NAME:-build-a}
OUTPUT_DIR="$OUTPUT_ROOT/$BUILD_NAME"

if [ ! -f "$SWISS_SRC/sweph.c" ] || [ ! -f "$SWISS_SRC/ephe/sepl_18.se1" ]; then
  echo "Swiss source or required ephemeris files are missing: $SWISS_SRC" >&2
  exit 1
fi

export EMSDK_PYTHON="$EMSDK/python/3.13.3_64bit/bin/python3"
export EMSDK_QUIET=1
. "$EMSDK/emsdk_env.sh"

mkdir -p "$OUTPUT_DIR"

emcc \
  "$SPIKE_DIR/native/swiss_spike.c" \
  "$SWISS_SRC/swedate.c" \
  "$SWISS_SRC/swehouse.c" \
  "$SWISS_SRC/swejpl.c" \
  "$SWISS_SRC/swemmoon.c" \
  "$SWISS_SRC/swemplan.c" \
  "$SWISS_SRC/sweph.c" \
  "$SWISS_SRC/swephlib.c" \
  "$SWISS_SRC/swecl.c" \
  "$SWISS_SRC/swehel.c" \
  -I"$SWISS_SRC" \
  -O2 \
  -sMODULARIZE=1 \
  -sEXPORT_ES6=1 \
  -sEXPORT_NAME=createSwissSpike \
  -sENVIRONMENT=web,node \
  -sALLOW_MEMORY_GROWTH=1 \
  -sEXPORTED_FUNCTIONS='["_astro_spike_version","_astro_spike_init","_astro_spike_julday","_astro_spike_calculate_body","_astro_spike_calculate_houses"]' \
  -sEXPORTED_RUNTIME_METHODS='["ccall","UTF8ToString"]' \
  --preload-file "$SWISS_SRC/ephe/sepl_18.se1@/ephe/sepl_18.se1" \
  --preload-file "$SWISS_SRC/ephe/semo_18.se1@/ephe/semo_18.se1" \
  -o "$OUTPUT_DIR/swiss-spike.mjs"

shasum -a 256 "$OUTPUT_DIR"/swiss-spike.*
