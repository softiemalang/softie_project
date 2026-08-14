# Ziwei P0 palace branch-slot composition v5

This is an additive successor to v4. It records a held-out direct-image review of the National Archives of Japan (NARA) chart-example leaves and two additional 1871 catalog/access routes. It does not alter v4 or any earlier artifact, and it does not admit a new graph source, observation, relation, claim, blocker closure, production ordinal, readiness state, or activation state.

## Result

The v5 artifact preserves the v4 graph:

- `30 claims / 19 sources / 55 observations / 146 relations / 11 blockers`;
- held-out research candidates reviewed: `5`;
- held-out research candidates admitted: `0`;
- frontier graph additions: `0 claims / 0 sources / 0 observations / 0 relations`;
- direct single-witness four-field binding: `0`;
- production physical-slot-to-ordinal binding: `0`;
- independent physical witnesses admitted: `0`;
- blockers closed: `[]`.

Readiness remains:

- `readiness: not_safe_to_start`;
- `grounding: blocked`;
- `activation: experimental_only`;
- `rotation06: representation_only`.

The admission boundary remains strict: direct original-image observation, catalog identity, access status, source lineage, semantic authority, physical chart slot, production ordinal, readiness, and activation are separate gates.

## NARA chart-example frontier

Candidate ID: `candidate-nara-4468520-4469314-chart-example-frontier`.

The source is the official NARA record [F1000000000000101426](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html), represented by the two public IIIF manifests:

- [NARA item 4468520, volume 1 manifest](https://www.digital.archives.go.jp/api/iiif/4468520/manifest.json), `129` canvases, manifest SHA-256 `732991ca47aefc323e2095a93202fd301421ad8b92994c63caae2a94acf75af`;
- [NARA item 4469314, volume 2 manifest](https://www.digital.archives.go.jp/api/iiif/4469314/manifest.json), `137` canvases, manifest SHA-256 `3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560`.

Direct rendered-image review covered volume 1 leaves `84–92` and volume 2 leaves `64–80`. The complete fixed image URL, canvas locator, byte length, and SHA-256 for all 26 retrieved `full/max/0/native.jpg` responses are recorded in `complete.json` and `evidence.json`; the source responses themselves remain outside the repository.

The direct visual boundary is:

- volume 1 leaves `84–86` show explanatory chart or rule surfaces;
- leaf `87` visibly includes `安天府圖` and a chart/table surface;
- leaf `88` visibly includes branch and four-transformation table material;
- leaves `89–92` continue rule and worked-example surfaces;
- volume 2 leaves `64–80` contain repeated worked natal-chart examples with sex/bureau labels, star entries, and branch tokens;
- no reviewed leaf or joined same-record frame visibly supplies all twelve palace names together with branch tokens, physical chart slots, and a production ordinal.

This is direct evidence that chart-example and branch/star vocabulary occur in the NARA scan leaves. It is not direct evidence of the required single-source binding. The two NARA items belong to one official record and are treated as a same-record edition pair, not as independent historical witnesses. The candidate therefore remains outside the graph.

## Alternate 1871 Ritsumeikan holding

Candidate ID: `candidate-youyi-lu-ritsumeikan-bn08364312-1871-catalog-only`.

The [CiNii record BN08364312](https://ci.nii.ac.jp/ncid/BN08364312) identifies `袖中書, 2巻 ; 游藝録, 6巻`, `(清)兪樾 [撰]`, `同治10(1871)`, held by 立命館大学 図書館, identifier `6111433313`, with `和装 袋綴 帙入り`. Its JSON catalog surface is [BN08364312.json](https://ci.nii.ac.jp/ncid/BN08364312.json). The catalog route resolves toward the Ritsumeikan OPAC, but the detail request returned HTTP `403` in this session.

No page image, IIIF manifest, source bytes, colophon image, or page-level text was acquired. This is an alternate catalog holding of the 1871 bibliographic object, not an independent semantic witness. It does not enter the graph and does not establish a 1871-to-1883 textual or block lineage.

The existing exact 1871 Kobe/CiNii catalog candidate remains preserved separately. A second catalog holding strengthens acquisition targeting but does not substitute for page-level identity or direct comparison.

## NDL manuscript and compiled-volume routes

Two more specific NDL routes were recorded as acquisition leads:

- [春在堂全書稿本, NDL record R100000039-I2606209](https://ndlsearch.ndl.go.jp/books/R100000039-I2606209), [PID 2606209](https://dl.ndl.go.jp/pid/2606209), attempted manifest `https://dl.ndl.go.jp/api/iiif/2606209/manifest.json`;
- [春在堂全書 第73–145册, NDL record R100000002-I000007637157](https://ndlsearch.ndl.go.jp/books/R100000002-I000007637157), [PID 2610509](https://dl.ndl.go.jp/pid/2610509), attempted manifest `https://dl.ndl.go.jp/api/iiif/2610509/manifest.json`.

The NDL catalog surfaces identify the relevant `游藝録 6卷` contents, while the catalog access boundary indicates restricted online viewing. Both exact attempted IIIF routes returned JSON `404` with `checkResult: NG` in this session. No page bytes entered the graph. These remain acquisition leads, not direct witnesses.

## 1871 ↔ 1883 comparison status

The 1871 record and alternate holding are identity-useful, but no 1871 page image or source bytes were obtained. Therefore no direct comparison was performed against the 1883 CADAL/NLC scans:

- no page-level text comparison;
- no colophon comparison;
- no byte comparison;
- no block-lineage conclusion;
- no independent historical witness admission.

## What remains unresolved

The P0 question remains unresolved: no single readable historical witness binds `palace name ↔ branch token ↔ physical chart slot ↔ ordinal/direction`.

Specifically, the current evidence still does not prove that:

1. the named-palace order and the Nanbei branch perimeter share one historical semantic coordinate frame;
2. the Nanbei p7 physical orientation is the production chart orientation;
3. a composed physical slot equals the repository production ordinal;
4. the exact 1871 impression is textually or materially continuous with the 1883 scans.

No production rule, semantic authority, source authority, remote database, deployment, commit, or push was changed.

## Reproduction

```sh
node scripts/materialize-ziwei-p0-palace-branch-slot-composition-v5.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v5.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v5-negative-v0.mjs
node --test test/ziweiP0PalaceBranchSlotCompositionV5.test.js
```

Materialization is offline. External image and catalog bytes are referenced through fixed hashes, URLs, access status, and explicit non-admission decisions. OCR/search-index text remains locator-only and is not canonical semantic evidence.
