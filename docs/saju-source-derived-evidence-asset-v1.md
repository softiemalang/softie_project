# Saju source-derived evidence asset v1

This successor normalizes the pre-existing root `-.jpg` into an explicitly named
Saju source-derived evidence asset. It does not change Saju calculation rules,
source authority, readiness, or production activation.

## Canonical asset

- Asset: `artifacts/saju-source-derived-evidence-v1/assets/ziping-zhenquan-pdf-page-002-rendered-evidence.jpg`
- Asset kind: rendered derivative evidence, not the canonical source
- Source ID: `saju-source-ziping-zhenquan`
- Source work: `子平真诠`
- Source: external `/Users/softie/Documents/malang_lab/documents/子平真诠-沈孝瞻原著.pdf`
- Source PDF identity: 27 pages, 580320 bytes, SHA-256 `449336b5e35aa6811b0462093d0175c45a0add44065bf2d3845cff75981db692`
- Source page: PDF page 2
- Asset dimensions: 990 × 1400 pixels
- Asset size: 214374 bytes
- Asset SHA-256: `26896bdc877cd977a5e2e88abc1d7409d021a0ee1ffaacd708ad1dd3f987843f`

The machine-readable provenance is in
`artifacts/saju-source-derived-evidence-v1/asset-manifest.json`; the complete
successor contract is in `complete.json`.

## Reproduction

Using Poppler `pdftoppm` 26.05.0:

```text
pdftoppm -f 2 -l 2 -scale-to 1400 -jpeg -singlefile \
  '/Users/softie/Documents/malang_lab/documents/子平真诠-沈孝瞻原著.pdf' \
  <output-prefix>
```

The materializer and checker re-render page 2 into a temporary directory and
require the resulting bytes to equal the canonical asset hash. JPEG bytes are
renderer-version-sensitive; a different Poppler version requires fresh
byte-identity verification.

## Migration boundary

The old root path `-.jpg` was moved byte-for-byte to the canonical asset path.
The old path is absent from the worktree and is no longer an active filesystem
dependency. Historical artifacts and audit documents that recorded
`-.jpg` remain unchanged as historical records; their current checkers resolve
that legacy label through the explicit migration mapping and verify the
canonical asset bytes. No original PDF is copied into the repository.

Source edition identity, reuse rights, semantic authority, Saju readiness, and
production activation remain unresolved or blocked exactly as before.
