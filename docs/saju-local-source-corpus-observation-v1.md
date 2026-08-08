# Saju local source corpus observation v1

This additive packet records a scan-first review of the five prioritized Saju PDFs in the local corpus. It binds the actual local PDF bytes, PDF page count, PDF page/printed-page locators, and the canonical Saju acquisition packets. It does not establish a classical edition, claim-level verification, independent authority, readiness, or activation.

## Admission boundary

- Direct observation: admitted with limits. Page headings and adjacent prose were reviewed from rendered PDF pages.
- Inherited evidence: not used as direct observation. Existing Saju packets remain the canonical blocker baseline.
- Inference: each link is only a candidate locator for an acquisition packet; repository coefficients, semantic scope, and rule correctness are not inferred from a heading or numeric agreement.
- Unresolved: edition/transmission identity, independent alternate witness, complete claim-specific scope, conflict resolution, and independent oracle.
- OCR: not canonical. The PDFs did not expose a usable text layer, so the artifact retains visual page locators rather than OCR transcription. Render provenance is recorded as Poppler `pdftoppm 26.05.0`, JPEG, `scaleTo=1400`; rendered bytes are not retained, so the render can be reproduced from the PDF byte hash and command specification.

The five local files are: 子平真诠, 滴天髓, 淵海子平, 穷通宝鉴, and 三命通會. The source forms include modern typeset and web-derived exports; the artifact preserves source warnings and unresolved edition identity instead of treating presentation metadata as authority.

## Observed locator frontier

The reviewed pages provide candidate locators for seven Saju acquisition packets: 五行/干支, four-pillars framing, 十神/藏干, branch relations, 格局, strength, and 用神. No locator was promoted for shinsal or timing, and no claim changed from `not_established`.

The machine-readable artifact is `artifacts/saju-local-source-corpus-observation-v1/complete.json`. Reproduce and check it with:

```text
npm run materialize:saju:local-source-corpus
npm run check:saju:local-source-corpus
```

The exact PDF hashes are provenance for this local checkout and corpus path. They are not a license determination or proof that the observed export is an authoritative edition.
