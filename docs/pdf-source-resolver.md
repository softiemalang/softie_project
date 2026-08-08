# PDF source resolver contract

PDF-backed evidence materializers use `scripts/lib/pdf-source-resolver.mjs` for source selection. The resolver has no user-home or `Downloads` search path.

Known source IDs are:

- `nanbei_quanbao_219p` — SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`
- `nanyangtang_quanbao_528p` — SHA-256 `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc`

Resolution precedence is explicit CLI/API path, explicit source-specific environment/config path, explicitly supplied compatibility candidates, then a fail-closed error. `PDF_SOURCE_DIR` may supply a configured directory; it is not searched implicitly. A candidate is read and hashed before it is returned. `MISSING_SOURCE_FILE` and `SHA256_MISMATCH` are distinct errors, and an invalid explicit candidate cannot silently fall through to another source.

The ESM API provides both `resolvePdfSourcePath()` and `resolvePdfSourcePathSync()` for the existing async and synchronous materializers. CLI callers may pass `--pdf-path <path>`. API callers may pass `{ explicitPath }`; tests can pass `{ compatibilityCandidates: [...] }` when compatibility behavior is the subject under test.

Example invocation with explicit configuration:

```sh
PDF_SOURCE_NANBEI_PATH=/path/to/nanbei.pdf \
PDF_SOURCE_NANYANGTANG_PATH=/path/to/nanyangtang.pdf \
node scripts/materialize-ziwei-ziwei-star-placement-clean-rule-seed-pilot-v0.mjs /tmp/output.json
```

Recorded historical path strings in existing artifacts and metadata-only fixtures remain unchanged. They are provenance facts, not resolver candidates. Source semantics, rule tables, readiness, activation, and production code are outside this migration boundary.
