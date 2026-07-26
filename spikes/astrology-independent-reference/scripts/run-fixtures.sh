#!/bin/sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
spike_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
generated_dir="$spike_dir/generated"
binary="$generated_dir/astrolog-matrix"
run_dir="$generated_dir/run"
output_dir="$generated_dir/raw"

if [ ! -x "$binary" ]; then
  echo "Build the reference binary first." >&2
  exit 1
fi

mkdir -p "$run_dir" "$output_dir"
cd "$run_dir"

run_fixture() {
  fixture_id=$1
  shift

  "$binary" -YQ 0 -Yn -b0 -C -c 0 -qa "$@" -v \
    > "$output_dir/$fixture_id.run1.stdout.txt" \
    2> "$output_dir/$fixture_id.run1.stderr.txt"
  "$binary" -YQ 0 -Yn -b0 -C -c 0 -qa "$@" -v \
    > "$output_dir/$fixture_id.run2.stdout.txt" \
    2> "$output_dir/$fixture_id.run2.stderr.txt"

  cmp "$output_dir/$fixture_id.run1.stdout.txt" \
    "$output_dir/$fixture_id.run2.stdout.txt"
  cmp "$output_dir/$fixture_id.run1.stderr.txt" \
    "$output_dir/$fixture_id.run2.stderr.txt"

  shasum -a 256 \
    "$output_dir/$fixture_id.run1.stdout.txt" \
    "$output_dir/$fixture_id.run1.stderr.txt"
}

# Astrolog longitude convention is west-positive; east longitudes are negative.
# Zone 0 and daylight-off mean the input clock is UTC for all fixtures.
run_fixture midlatitude 1 1 2000 12:00 0 0 51:30
run_fixture southern 6 21 2000 12:00 0 -151:12 -33:52
run_fixture highlatitude 12 21 2000 12:00 0 -18:57 69:39

if [ -s "$output_dir/midlatitude.run1.stderr.txt" ] ||
  [ -s "$output_dir/southern.run1.stderr.txt" ]; then
  echo "Unexpected house warning for a supported latitude." >&2
  exit 1
fi

if ! grep -q "not defined at extreme latitudes" \
  "$output_dir/highlatitude.run1.stderr.txt"; then
  echo "Expected polar Placidus warning was not observed." >&2
  exit 1
fi

echo "Fixtures repeated identically. High-latitude fallback was detected."
