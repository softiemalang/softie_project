# DE405 Canonical v2 CSPICE runner

Build with `CSPICE_DIR=/path/to/CSPICE/N0067 npm run de405:v2:build-runner`.
The binary is intentionally untracked. It uses CSPICE N0067 and `spkez_c` with
observer 399, frame J2000, and aberration correction NONE. It accepts only the
`--generate-overlap-smoke` materialization mode; `--coverage` reports the
verified common target coverage through official `spkobj_c`/`spkcov_c` APIs.
