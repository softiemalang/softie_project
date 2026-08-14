# Ziwei P0 palace branch-slot composition v6

This is an additive successor to v5. It records a separate Nagoya University catalog route for `游藝錄六卷` after the 1871/1883 acquisition pass. The record reports `Image: None`, so v6 adds no page image, source byte, graph source, observation, relation, claim, blocker closure, physical ordinal, readiness state, or activation state.

## Result

The v6 artifact preserves the v5 graph:

- `30 claims / 19 sources / 55 observations / 146 relations / 11 blockers`;
- held-out research candidates reviewed: `6`;
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

## Nagoya catalog frontier

Candidate ID: `candidate-youyi-lu-nagoya-ba87134054-catalog-no-image`.

The [Nagoya University Kotenseki Descriptive Database record](https://da.adm.thers.ac.jp/en/item/n004-20230901-07327) identifies:

- title: `游藝錄六卷`;
- author: `清 兪樾 撰`;
- appearance: `刊6卷1冊`;
- NCID: `BA87134054`;
- material ID: `10149888`;
- holding: Nagoya University Library;
- remarks: `春在堂全書96冊`;
- image field: `None`.

This is a separate institutional catalog record and a useful acquisition lead. Its record does not resolve a 1871 publication date, does not expose page images in this session, and does not provide source bytes, a colophon image, page-level text, or a block-level comparison target. It therefore remains `catalog_record_review_only_no_image`, does not enter the graph, and is not an independent historical witness.

## 1871 ↔ 1883 comparison status

The exact Kobe/CiNii 1871 record, the alternate Ritsumeikan holding, the NDL manuscript and compiled-volume routes, and the Nagoya catalog route were reviewed as identity or acquisition surfaces. No 1871 page image or source bytes were obtained. Therefore the comparison against the 1883 CADAL/NLC scans remains open:

- no page-level text comparison;
- no colophon comparison;
- no byte comparison;
- no block-lineage conclusion;
- no independent historical witness admission.

The [Kobe/CiNii record](https://ci.nii.ac.jp/ncid/BD19656670) is the direct 1871 catalog identity. The [Ritsumeikan alternate holding](https://ci.nii.ac.jp/ncid/BN08364312) is catalog-only. The [1883 CADAL scan record](https://commons.wikimedia.org/wiki/File:CADAL01025514_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%C2%B7%E6%B8%B8%E8%97%9D%E9%8C%84.djvu) is a direct scan of the later edition/reproduction already bounded by the predecessor artifacts; it is not a newly admitted 1871 witness.

## Independent diagram review boundary

The targeted direct review did not close the four-field binding:

- Nanyang p172 `安天府圖` supplies a Tianfu connector/branch diagram and `寅/申` and `紫居丑則府居卯矣` anchors, but not all twelve palace names with a production ordinal;
- NARA leaves `4468520` 84–92 and `4469314` 64–80 supply chart-example, branch/star, and rule surfaces, but no single or joined same-record frame visibly binds palace name, branch token, physical slot, and production ordinal;
- the NARA pair is one official record and is not an independent historical witness.

These observations remain bounded in v5 and are not promoted by v6.

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
node scripts/materialize-ziwei-p0-palace-branch-slot-composition-v6.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v6.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v6-negative-v0.mjs
node --test test/ziweiP0PalaceBranchSlotCompositionV6.test.js
```

Materialization is offline. External image and catalog bytes are referenced through fixed hashes, stable locators, and explicit same-record/derivative/access/no-image status. OCR/search-index text remains locator-only and is not canonical semantic evidence.
