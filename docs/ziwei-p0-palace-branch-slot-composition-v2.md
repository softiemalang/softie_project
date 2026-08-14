# Ziwei P0 palace branch-slot composition v2

This is an additive research artifact. It composes two already recorded direct observations:

1. Youyi Lu / CADAL 1883 scan page 130 gives the 12 named-palace order and says to lay out the palaces in reverse from 命宮.
2. The Nanbei PDF page 7 gives the 12-cell physical perimeter branch sequence `巳 午 未 申 酉 戌 亥 子 丑 寅 卯 辰`; page 8 gives the `寅起`, 命宮 reverse, 身宮 forward traversal surface.

The join key is the earthly-branch token. Neither source page directly prints all four fields—palace name, branch, physical slot, and production ordinal—in one admitted semantic witness. The resulting matrix is therefore `derived_not_authoritative`.

## Result

The materialized artifact records:

- direct single-witness full binding: `0/12`;
- direct named-palace relative ordinal: `12/12` from the Youyi surface;
- direct branch-to-Nanbei perimeter slot: `12/12` from the Nanbei diagram;
- composed source matrix for the `命宮=寅` anchor: `12/12`;
- all twelve 命宮 anchors: `144` composed rows;
- modern secondary clarification match: `12/12` after the aliases `子女→子息`, `交友→奴僕`, and `事業→官祿`;
- production physical-slot-to-ordinal binding: `0/12`, still `not_established`.

The physical direction below is a composition: reverse palace traversal relative to the Nanbei sequence recorded as clockwise. It is not a production-direction decision.

| ordinal | Youyi palace | branch token | Nanbei p7 slot (recorded clockwise) | derived direction |
| ---: | --- | --- | ---: | --- |
| 1 | 命宮 | 寅 | 10 | anchor |
| 2 | 兄弟宮 | 丑 | 09 | counterclockwise |
| 3 | 夫妻宮 | 子 | 08 | counterclockwise |
| 4 | 子息宮 | 亥 | 07 | counterclockwise |
| 5 | 財帛宮 | 戌 | 06 | counterclockwise |
| 6 | 疾厄宮 | 酉 | 05 | counterclockwise |
| 7 | 遷移宮 | 申 | 04 | counterclockwise |
| 8 | 奴僕宮 | 未 | 03 | counterclockwise |
| 9 | 官祿宮 | 午 | 02 | counterclockwise |
| 10 | 田宅宮 | 巳 | 01 | counterclockwise |
| 11 | 福德宮 | 辰 | 12 | counterclockwise |
| 12 | 父母宮 | 卯 | 11 | counterclockwise |

`productionOrdinal` is deliberately null in every row.

## Source and lineage boundaries

- The 1883 direct scan candidate is `src-youyi-lu-cadal-01025514-1883`; its DjVu SHA-256 is `761a9827a1fe0df8f1aa1e15317b1eb18c528892750fa618f7ed97a5897535ba`. The predecessor records the direct page-130 render and transcription boundary. The public catalog/source surfaces are [CADAL 01025514](https://cadal.edu.cn/cardpage/bookCardPage?ssno=01025514), [CiNii 1883](https://ci.nii.ac.jp/ncid/BB19945538), and the [Commons DjVu file page](https://commons.wikimedia.org/wiki/File:CADAL01025514_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%C2%B7%E6%B8%B8%E8%97%9D%E9%8C%84.djvu).
- The Nanbei source bytes are held outside Git at `/Users/softie/Documents/命-南北山人_紫微斗数全书.pdf`, SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`. Page 7's rendered observation hash is `ebbdcf1a35d21e0fcf4339182af2df3ad290c279b8627bab9dc7f80156083bac`; page 8's is `d740c6ed5191e516f40ee61bda7f95ff2081954b21b091c22bee9c0249e8acea`.
- The exact 1871 catalog candidate is [CiNii BD19656670](https://ci.nii.ac.jp/ncid/BD19656670). It is catalog-only in this unit: no public page image, direct text comparison, colophon comparison, or byte comparison with the 1883 scan was performed.
- [PChome's 2009 article](https://mypaper.pchome.com.tw/twmin2589/post/1312687151) is recorded only as a modern secondary clarification. It prints the `命宮=寅` branch/name example and matches the composed matrix 12/12 after aliases, but it is not historical originality, independent witness evidence, source authority, or a rights decision.
- The NARA IIIF volumes remain a same-record volume pair with `completeBindingCount=0`; their chart and diagram surfaces are retained as negative boundary evidence, not as an independent semantic oracle.

The unresolved join premises are:

1. Youyi p130 and Nanbei p7 share one historical semantic coordinate frame.
2. Nanbei p7's physical orientation is the production chart orientation.
3. A source-composed physical slot is the repository's production ordinal.

## Graph and readiness boundary

The successor graph is `30 claims / 17 sources / 53 observations / 143 relations / 11 blockers`. Two sources were added as non-witness references: the 1871 catalog record and the modern secondary clarification. No physical witness was admitted, no claim was promoted, and no blocker was closed.

Readiness remains:

- `readiness: not_safe_to_start`
- `grounding: blocked`
- `activation: experimental_only`
- `rotation06: representation_only`

No production file, predecessor artifact, source PDF/image, protected derived asset, database, deployment, commit, or push was changed by this unit.

## Reproduction

```sh
node scripts/materialize-ziwei-p0-palace-branch-slot-composition-v2.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v2.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v2-negative-v0.mjs
node --test test/ziweiP0PalaceBranchSlotComposition.test.js
```

Materialization is offline and records UTF-8 JSON byte hashes with final LF. The negative checker rejects direct-authority, production-ordinal, secondary-canonicalization, lineage, blocker-closure, graph-count, source-hash, claim-promotion, and timestamp shortcuts.
