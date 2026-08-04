# Ziwei archive scan source witness admission v0

This artifact admits one Internet Archive digital scan as a bounded source-witness candidate. It does not transcribe rules, ingest a corpus, create claims, establish historical truth, or activate grounding.

## Identity and evidence

- Item: `20210924_20210924_0431`; ARK: `ark:/13960/t3d05mz07`.
- Selected file: `命-南北山人_紫微斗数全书.pdf`, Archive `source=original`, format `Image Container PDF`.
- Download URL: `https://archive.org/download/20210924_20210924_0431/命-南北山人_紫微斗数全书.pdf`.
- Archive metadata reports MD5 `41e7610510df4ad558aa328cf96cc096`, uploaded/added 2021-09-24.
- Direct local evidence measurement: 35,515,645 bytes, SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`, 219 pages, unencrypted.
- `*_text.pdf`, JP2, DjVuTXT, hOCR, and other derivatives are not the witness.

The cover visibly records `紫微斗數全書`, `陳希夷先生原著`, and `南北山人編註`, with an added 古版修復/標點 notice. Publisher, edition, year, and volume count are unresolved. Archive publication/access is not treated as public-domain, free-redistribution, or AI-training permission.

## Structural map and admission

The eight ranges in the machine-readable artifact cover pages 1-219 exactly once. Pages 1-8 are front matter, edition evidence, contents, and introductory method material. Pages 9-17 are deterministic-rule/table candidates; pages 18-28 and 209-218 are worked-example candidates. Pages 29-208 retain an unresolved classical-text/commentary boundary and are not admitted for extraction. Page 219 is back matter.

The first candidates are: 命宮/身宮定位 (pp. 4, 5, 8, 9), 五行局 table (pp. 9-12), and 主星/紫微星系 placement (pp. 13-17). They remain unextracted and cannot create stable claims.

Verdict: `source_witness_admissible_with_limits`.

Downstream state is fixed at stable claim count 0, readiness `not_safe_to_start`, grounding `blocked`, and activation `experimental`. The PDF is evidence storage only and is forbidden from Git.
