# DE405 official acquisition and sample asset

Each Linux architecture job runs `scripts/fetch-de405-linux-official-inputs.mjs`.

The downloader writes `acquisition-provenance.json` at the requested `--output` root. The architecture runner receives that exact file explicitly with `--acquisition-provenance`; it does not infer provenance relative to the built CSPICE directory.
It downloads the NAIF PC/Linux/GCC/64-bit N0067 package and the unmodified
generic-kernel `de405.bsp` over HTTPS, rejects redirects outside
`naif.jpl.nasa.gov`, enforces size limits, verifies the fixed SHA-256, and only
then extracts `include`, `src/cspice`, and `src/csupport`. Prebuilt CSPICE
libraries and binaries are never extracted or used. The arm64 job is a
project source port of NAIF's x86-64 package, explicitly for architecture
comparison.

The fixed official contracts are:

- CSPICE: `https://naif.jpl.nasa.gov/pub/naif/toolkit//C/PC_Linux_GCC_64bit/packages/cspice.tar.Z`, 42,676,733 bytes, SHA-256 `60a95b51a6472f1afe7e40d77ebdee43c12bb5b8823676ccc74692ddfede06ce`.
- DE405: `https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/a_old_versions/de405.bsp`, 10,898,432 bytes, SHA-256 `30a7113793ee5b6bf1e5546c6dfc21d9682d9ffabfe9b17b4bab27ba2ac75c89`.

`scripts/materialize-de405-input-bundle.mjs` now creates a deterministic
sample-only ZIP outside the repository containing only the project-generated
150,671-row JSONL and a small manifest. It contains no CSPICE source, SPK,
binary, absolute path, or timestamp. The checker validates LF/schema/row
identity, sorted entries, normalized metadata, and reconciliation with the
existing evidence hash. Materialize twice and compare bytes before any
publication; the resulting Release asset is the only input passed by manual
dispatch.

The materializer writes an archive and sidecar record containing archive bytes,
archive SHA-256, and the internal manifest SHA-256. The checker validates the
archive structure, all input hashes, the CSPICE source manifest, and workflow
input paths. Run materialization twice in two approved temporary directories
and compare `de405-input-bundle.zip` byte-for-byte before any publication.

The historical MacM1 local CSPICE package remains a non-publishable provenance
reference. Its seven source-entry differences from the official PC/Linux/GCC
package are recorded in `docs/de405-cspice-source-divergence.json`; the
controlled Apple arm64 DE405 canonical-v2 bridge and its source-only build
identities are recorded in `docs/de405-cspice-source-equivalence.json`.
Remote provenance records the official source identity; the bridge is limited
to the tested DE405 canonical-v2 full-corpus path and does not claim general
CSPICE source equivalence.

## License boundary

The former combined bundle is intentionally not publishable: NAIF's official
Rules page says unmodified SPICE Toolkit mirror redistribution requires prior
written clearance. The corrected workflow does not redistribute CSPICE source
or the SPK; every job acquires them directly from NAIF. The sample asset is
project-generated and is checked for third-party source text and provenance.

- https://naif.jpl.nasa.gov/naif/rules.html
- https://naif.jpl.nasa.gov/naif/toolkit_C_PC_Linux_GCC_64bit.html
- https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/info/dscriptn.html

Official download bytes must still be available and match the fixed identities;
the verified local copy cannot substitute for a failed official acquisition.
No upload or workflow dispatch is performed by local validation.
