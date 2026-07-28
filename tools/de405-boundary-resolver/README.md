# DE405 canonical v2 boundary resolver

This tool uses the official NAIF CSPICE N0067 `str2et_c` API to resolve the
two fixed TDB boundaries. It does not load `de405.bsp` or compute state
vectors. `naif0012.tls` is loaded explicitly because the official `str2et_c`
execution requires `DELTET/DELTA_AT` for these calendar inputs. The toolkit is installed outside the repository at
`$SOFTIE_DE405_HOME/cspice/N0067`.

Build with `node tools/de405-boundary-resolver/build.mjs`, then run the binary
with the exact `--start` and `--end` strings recorded in the provenance
document. stdout is deterministic canonical JSON; build metadata is written
outside the repository.
