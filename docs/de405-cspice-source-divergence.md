# CSPICE N0067 source divergence bridge

The official source is the NAIF PC/Linux/GCC/64-bit N0067 package. The
historical local tree is the NAIF MacM1/OSX/Clang/64-bit N0067 package recorded
by the existing boundary-resolution documentation. They have 2,547 entries
but seven byte differences. The audit records raw SHA-256, sizes, normalized
diff status, and an explicit classification for every path.

The seven differences are: three `SpiceZpl.h` platform macro copies, one
`fndlun.c` executable logical-unit-range tailoring (`99` versus `63`), one
`zzplatfm.c` platform identity implementation, and two `mkprodct.csh` package
builder variants. The `fndlun.c` change is not called harmless by source audit;
the full DE405 runtime bridge is the evidence for this canonical path only.

The source divergence audit and runtime bridge are checked by
`scripts/check-de405-cspice-source-divergence.mjs` and
`scripts/check-de405-cspice-source-equivalence.mjs`. They do not authorize
general CSPICE equivalence or change production tolerances.
