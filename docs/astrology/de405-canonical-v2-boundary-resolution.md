# DE405 Canonical v2 Boundary Resolution

Status: `cspice_environment_ready_boundary_resolved`

This document records the official-NAIF CSPICE N0067 boundary-resolution
provenance. It is intentionally separate from UTC conversion: the resolver
passes explicit TDB calendar strings to `str2et_c` and does not load an LSK or
the DE405 SPK. `naif0012.tls` is acquired and verified for the separate UTC
time-conversion fixture role.

## Fixed inputs and invariants

```text
startInputTdb: 1900 JAN 01 00:00:00.000 TDB
endInputTdb:   2101 JAN 01 00:00:00.000 TDB
regularGridStepSeconds: 864000
regularGridTimestampCount: 7342
targetCount: 10
expectedRowCount: 73420
totalRangeSeconds: 6342969600
```

## Resolution record

The resolver was built and run twice on native arm64 macOS. Both canonical
outputs passed byte identity and all invariant checks.

```yaml
boundaryResolverSchemaVersion: de405-boundary-resolution-v1
regularGridStartEt: "-3.1557168000000000e+09"
regularGridEndExclusiveEt: "3.1872528000000000e+09"
regularGridStepSeconds: "8.6400000000000000e+05"
regularGridTimestampCount: 7342
targetCount: 10
expectedRowCount: 73420
totalRangeSeconds: 6342969600
lastSampleEt: "3.1869072000000000e+09"
endToLastSampleSeconds: 345600
residualSeconds: 0
lskLoaded: true
lskFileName: naif0012.tls
lskSha256: 678e32bdb5a744117a467cd9601cd6b373f0e9bc9bbde1371d5eee39600a039b
de405SpkReadyForPipeline: true
cspiceInstallPath: /Users/softie/.local/share/softie-de405/cspice/N0067
cspiceArchiveOfficialSource: https://naif.jpl.nasa.gov/pub/naif/toolkit//C/MacM1_OSX_clang_64bit/packages/cspice.tar.Z
lskOfficialSource: https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls
lskSizeBytes: 5257
lskLocalPath: /Users/softie/.local/share/softie-de405/kernels/lsk/naif0012.tls
de405SpkOfficialSource: https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp
de405SpkSizeBytes: 10898432
de405SpkSha256: 30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89
de405SpkLocalPath: /Users/softie/.local/share/softie-de405/kernels/spk/de405.bsp
binaryPath: /Users/softie/.local/share/softie-de405/boundary-resolution/bin/resolve-de405-boundaries
run1Path: /Users/softie/.local/share/softie-de405/boundary-resolution/runs/run-1.json
run2Path: /Users/softie/.local/share/softie-de405/boundary-resolution/runs/run-2.json
cspiceToolkitVersion: N0067
cspiceArchiveFileName: cspice.tar.Z
cspiceArchiveSizeBytes: 42047289
cspiceArchiveSha256: 0deae048443e11ca4d093cac651d9785d4f2594631a183d85a3d58949f4d0aa9
platform: darwin
architecture: arm64
compilerVersion: Apple clang version 21.0.0 (clang-2100.1.1.101)
resolverSourceSha256: 933bb0bb28d527f9fa90d51c49160a7f944e26d789b4a8bbdd405e5f9c0293da
resolverBinarySha256: bd0b9bcf57f8ceccb55f200e8c5e980727ff5ee3ca9d14494c62489648e408b6
run1Sha256: 070ff122605acfa5ce0a9e94b0c485e3576fea3f43c207f4fd2a11452f7c0911
run2Sha256: 070ff122605acfa5ce0a9e94b0c485e3576fea3f43c207f4fd2a11452f7c0911
byteIdentity: true
```

Official sources:

- CSPICE: https://naif.jpl.nasa.gov/naif/toolkit_C_MacM1_OSX_clang_64bit.html
- LSK: https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls
- SPK: https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp

`str2et_c` initially failed without a loaded leap-seconds kernel with the
official `DELTET/DELTA_AT` error. The resolver therefore explicitly loads the
verified `naif0012.tls`; it never loads `de405.bsp`.
