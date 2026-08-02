# CSPICE source equivalence bridge

On the same Apple arm64 host, both source trees were compiled independently
with Apple clang 21.0.0 targeting `arm64-apple-darwin25.6.0`. CSPICE used
`-std=c89 -O2 -ffp-contract=off -fno-fast-math -fPIC -DNON_UNIX_STDIO`; the
canonical runner used `-std=c11 -O2 -ffp-contract=off -fno-fast-math -Wall
-Wextra -Werror`. No prebuilt CSPICE library was used.

Both builds ran the same 150,671-row sample JSONL and byte-identical DE405 SPK
(904,026 state components). Each variant was run twice. All four result files
were byte-identical at 79,915,561 bytes and SHA-256
`07b51b47dee7042056f7b127886e93f7f0d84283348d5a941f8be27ca65ac08b`.
Binary64 comparison found zero differing rows/components, no first divergence,
and zero ULP/absolute-difference statistics.

This proves only current DE405 canonical-v2 full-corpus runtime equivalence on
this Apple arm64 host. It is not a claim of general CSPICE source equivalence.
