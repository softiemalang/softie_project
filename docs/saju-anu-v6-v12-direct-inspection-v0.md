# ANU 《三命通會》 v6–v12 direct inspection v0

## Boundary

This is an additive direct-evidence successor. The existing parent-adjudicated artifacts remain authoritative, especially the ANU V2 p.58–59 observation in `artifacts/saju-gemini-v7-parent-adjudication/complete.json`. Gemini v7 remains `untrusted_candidate_only`; no candidate packet or parent verdict was imported as canonical evidence.

The first-party ANU item is [e0d2d017-f99d-4818-af29-d18754f7e5cd](https://openresearch-repository.anu.edu.au/items/e0d2d017-f99d-4818-af29-d18754f7e5cd), Handle `1885/206524`, identifier `b22343921`, and ORIGINAL bundle `c11f2f3d-396b-43b1-b5b1-d2ce29a3f047`. The seven content endpoints and their API metadata are recorded in the artifact; the retrieved PDF bytes were checked against API size/MD5 and independently hashed with SHA-256.

## v6–v12 actual PDF/page crosswalk

The volume mapping below is from the printed `三命通會卷之…` title line visible in the rendered scan image. `pdfPage` is a 1-based digital locator. The number on the facing blank leaf is handwritten collection/holding material, not a printed folio. No printed folio was reliably legible at the title-page locators, so printed-folio fields remain unresolved.

| PDF | API description | PDF bytes | pages | direct title page | facing-leaf mark | printed folio |
|---|---|---:|---:|---|---|---|
| v6 | Volume 6 | 116,512,109 | 106 | p.3 `三命通會卷之六` | `6657` handwritten | unresolved |
| v7 | Volume 7 | 98,529,810 | 89 | p.3 `三命通會卷之七` | `6668` handwritten | unresolved |
| v8 | Volume 8 | 132,491,390 | 126 | p.3 `三命通會卷之八` | `6669` handwritten | unresolved |
| v9 | Volume 9 | 132,300,104 | 124 | p.3 `三命通會卷之九` | `6670` handwritten | unresolved |
| v10 | Volume 10 | 66,903,696 | 77 | p.3 `三命通會卷之十` | `6671` handwritten | unresolved |
| v11 | Volume 11 | 102,605,436 | 91 | p.3 `三命通會卷之十一` | `6672` handwritten | unresolved |
| v12 | Volume 12 | 88,419,498 | 81 | p.3 `三命通會卷之十二` | `6673` handwritten | unresolved |

This closes the v6–v12 digital content/title-page mapping, not a 12-volume physical-edition or printed-folio genealogy. Catalog `12 juan` and API/file names are not used as substitutes for the title-page observation.

## New bounded P0 observations

Direct image inspection of v11 p.7 with p.6/p.8 context found the large vertical heading:

`大運折除成歲小運逆順由時`

Direct image inspection of v11 p.24 with p.23/p.25 context found:

`陽男陰女從生月順行`

`陰男陽女從生月逆行`

`運行則一辰十歲`

`折除乃三日為年`

`精休旺以為妙`

These are literal, page-bounded same-item observations. They do not establish `一時辰十日`; the direct string is `一辰十歲`. `三日為年` is kept as a textual variant and is not silently normalized to the parent V2 `三日為一歲` observation. No named preceding/next 節 selection or worked start-age example was closed at v11 p.7/p.24; those remain separate from the parent V2 p.58–59 observation.

The ANU embedded OCR was used only to locate candidates. Generic `運`/`節` occurrences and a v10 p.5 candidate were not admitted as timing rules. Lack of an OCR hit is not a whole-volume negative finding.

## Reconciliation and gates

- Parent v7 claim statuses are preserved exactly: `kept`, `corrected`, `rejected`, and `unresolved` lists are carried into the successor without status mutation.
- The old `1885/42211` identity rejection remains unchanged. The parent `1885/206524` identity and current ORIGINAL bundle are retained at their respective metadata/file-list scopes.
- The catalog `12 juan` extent remains metadata-only. Current v6–v12 content bytes and direct title pages are separate evidence edges.
- All four independence axes remain separate and not counted as independent: physical-item, digital-derivation, edition/textual-lineage, and semantic-corroboration.
- The inherited seven v7 lineage edges remain outside the canonical graph; this successor adds no transmission edge.
- `availableForInterpretation=false`, semantic authority is `not_established`, production activation is `blocked`, and stable promotion is `0`.

## Real blockers and next P0 acquisition

1. Obtain a first-party printed-folio/leaf crosswalk or sufficiently legible page-edge evidence for the v6–v12 target pages.
2. Obtain an authoritative edition/provenance chronology and physical-item relation for the ANU set; the current record and PDF bitstreams do not close edition date or textual lineage.
3. Inspect the exact v11 target leaf at institutional/original resolution if a printed folio or damaged character must be resolved.
4. Reconcile the v11 literal variant against the parent V2 passage only after a bounded textual comparison; do not convert it into a production rule.

## Artifact and checks

- Artifact: `artifacts/saju-anu-v6-v12-direct-inspection-v0/complete.json`
- Integrity sidecar: `artifacts/saju-anu-v6-v12-direct-inspection-v0/complete.json.integrity.json`
- Materializer: `scripts/materialize-saju-anu-v6-v12-direct-inspection-v0.mjs`
- Checker: `scripts/check-saju-anu-v6-v12-direct-inspection-v0.mjs`
- Negative checker: `scripts/check-saju-anu-v6-v12-direct-inspection-negative-v0.mjs`
- Focused test: `test/sajuAnuV6V12DirectInspection.test.js`

The artifact stores hashes/page counts and bounded observations, not the downloaded PDFs. No staging, commit, push, deploy, or remote database operation was performed.
