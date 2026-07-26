#!/bin/sh
set -eu

EXPECTED_COMMIT="5bf172ea231c4b6ea3d7e09ca307571354a41e8a"

if [ -z "${ASTROLOG_SRC:-}" ]; then
  echo "ASTROLOG_SRC must point to the pinned Astrolog checkout." >&2
  exit 1
fi

actual_commit=$(git -C "$ASTROLOG_SRC" rev-parse HEAD)
if [ "$actual_commit" != "$EXPECTED_COMMIT" ]; then
  echo "Astrolog commit mismatch: expected $EXPECTED_COMMIT, got $actual_commit" >&2
  exit 1
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
spike_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
generated_dir="$spike_dir/generated"
mkdir -p "$generated_dir"
source_dir=$(mktemp -d "$generated_dir/source.XXXXXX")
binary="$generated_dir/astrolog-matrix"

sources="
astrolog.cpp
atlas.cpp
calc.cpp
charts0.cpp
charts1.cpp
charts2.cpp
charts3.cpp
data.cpp
express.cpp
general.cpp
intrpret.cpp
io.cpp
matrix.cpp
"

for file in $sources astrolog.h extern.h resource.h; do
  cp "$ASTROLOG_SRC/$file" "$source_dir/$file"
done

# Upstream 8.00 headers use CRLF. Normalize the copied header so the pinned
# patch applies consistently without modifying the external checkout.
tr -d '\r' < "$source_dir/astrolog.h" > "$source_dir/astrolog.h.lf"
mv "$source_dir/astrolog.h.lf" "$source_dir/astrolog.h"

for feature in X11 JPLWEB GRAPH SWISS PLACALC PS META SVG WIRE; do
  if ! grep -q "^#define $feature " "$source_dir/astrolog.h"; then
    echo "Expected feature define not found: $feature" >&2
    exit 1
  fi
  perl -pi -e "s/^#define $feature /\\/\\/#define $feature /" \
    "$source_dir/astrolog.h"
done

(
  cd "$source_dir"
  clang++ -O2 -w \
    astrolog.cpp atlas.cpp calc.cpp charts0.cpp charts1.cpp charts2.cpp \
    charts3.cpp data.cpp express.cpp general.cpp intrpret.cpp io.cpp \
    matrix.cpp -lm -o "$binary"
)

if nm -u "$binary" | grep -Eiq 'swe|placalc'; then
  echo "Swiss or Placalc symbol found in the reference binary." >&2
  exit 1
fi

echo "source_commit=$actual_commit"
echo "compiler=$(clang++ --version | head -1)"
echo "binary=$binary"
shasum -a 256 "$binary"
