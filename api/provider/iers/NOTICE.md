# IERS EOP provider source notice

This directory contains source-pinned materials used by the internal offline
C04 DUT1 provider. It is not an IERS distribution or an IERS-endorsed
implementation.

## C04 and UTC-TAI data

The bundled data snapshots were retrieved from the official IERS Earth
Orientation Centre endpoints and are preserved byte-for-byte:

- C04 product 256: `eopc04_20u24.dPsi_dEps.1962-now.txt`, SHA-256
  `24db7a8042c65fa9a94fcd4ac98b0872d775e94134061f8508289cea9d9f95b5`.
- Pinned C04 product notes: `eopc04-20u24-README.txt` and
  `eopc04-updateC04.txt`; their hashes and byte sizes are recorded in the
  DUT1 contract and the three-component bundle.
- UTC−TAI history: `UTC-TAI.history`, SHA-256
  `54e702abdc388ae3bf8cfc5f126900a5277829ad90e80f6773df6e714a133642`.

The inspected IERS pages describe online distribution, but these data files
did not contain an explicit redistribution license. Public or hosted release
of this bundle therefore remains `external_review_required`.

## IERS Conventions software

`UTLIBR.F` and `FUNDARG.F` retain the complete IERS Conventions Software
License in their source files. The derived Python implementation changes
routine names, describes its derivation in
`docs/astrology/dut1-c04-contract-v1.md`, preserves source identity, and does
not claim IERS authorship or endorsement. The source files and their intact
notices must remain together for any later approved source distribution.

`INTERP.F` is the official EOP Product Center source used for the 4-point
interpolation and 71 ocean terms. Its exact SHA-256 is
`9ff5f893ac06c8d4123ec45cecde4df99f18cb2f3b19518bcd7494b6aa35b4e6`. The
retrieved file has no embedded license notice. The pinned companion
`INTERP-README.txt` is likewise recorded in the contract and bundle; its
redistribution status is not assumed and remains part of the external review
gate.
