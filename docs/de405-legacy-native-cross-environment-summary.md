# DE405 canonical-v2 cross-environment evidence

- Classification: `canonical_v2_cross_environment_bitwise_identity_established`
- Execution: `02a85fe40e1cb468eb28046cee00d543df9b5d60` / `refs/heads/main`
- Workflow: `.github/workflows/de405-legacy-native-matrix.yml`
- Canonical-v2 source: CSPICE N0067; sample archive SHA-256 `5fb3f6f7c5a7b20f9081d1f16a6f000c00df8594c88606344a9c8d833b9aa1c8`; SPK `30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89`; CSPICE `60a95b51a6472f1afe7e40d77ebdee43c12bb5b8823676ccc74692ddfede06ce`
- Corpus: 150671 rows / 904026 state components
- Raw JSONL: outside the repository; not tracked; Actions retention 14 days

## Variants

- ubuntu-gcc: ubuntu-24.04-glibc, gcc gcc (Ubuntu 13.3.0-6ubuntu2~24.04.1) 13.3.0; result `07b51b47dee7042056f7b127886e93f7f0d84283348d5a941f8be27ca65ac08b`
- alpine-gcc: alpine-3.22.1-musl, gcc gcc (Alpine 14.2.0) 14.2.0; result `07b51b47dee7042056f7b127886e93f7f0d84283348d5a941f8be27ca65ac08b`
- alpine-clang: alpine-3.22.1-musl, clang Alpine clang version 20.1.8; result `07b51b47dee7042056f7b127886e93f7f0d84283348d5a941f8be27ca65ac08b`

## Pairwise result

- ubuntu-gcc ↔ alpine-gcc: 0/0 differing rows/components; first divergence none; ULP max 0; absolute max 0
- ubuntu-gcc ↔ alpine-clang: 0/0 differing rows/components; first divergence none; ULP max 0; absolute max 0
- alpine-gcc ↔ alpine-clang: 0/0 differing rows/components; first divergence none; ULP max 0; absolute max 0

The conclusion applies only to this fixed N0067 source, DE405 SPK, canonical-v2 runner, 150,671-row corpus, and explicit floating-point flags. Historical shadow/canonical-route sensitivity remains bounded to that older contract; its first arithmetic divergence is unrecoverable from the preserved raw pipeline.
