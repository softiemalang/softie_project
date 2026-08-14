# Ziwei P0 palace–branch–slot composition v10

This is an additive, research-only successor to
`ziwei-p0-palace-branch-slot-composition-v9`. It records a bounded direct
review of the National Digital Library of Korea scan catalogued as
`CNTS-00047996572`, **紫微斗數方書**, an anonymous handwritten copy. It does
not alter the production algorithm, readiness state, activation state, or any
historical predecessor artifact.

## Source identity

- Commons record: <https://commons.wikimedia.org/wiki/File:CNTS-00047996572_%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%96%B9%E6%9B%B8.pdf>
- Original PDF: <https://upload.wikimedia.org/wikipedia/commons/9/98/CNTS-00047996572_%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E6%96%B9%E6%9B%B8.pdf>
- Catalog identity: `CNTS-00047996572`, `紫微斗數方書`, `編者未詳`, `筆寫本`, 2卷1冊, 153 PDF pages.
- PDF bytes: 75,687,209; SHA-256:
  `b21bbf3e2c7cdada4153f847ff9f359dbb29e71998e1f931417d108b571b23c3`.
- Commons SHA-1: `0ecf0cdc7ae9a2e0d427501bb0fdef901a851a0a`.

The scan is image-only for the reviewed material. OCR/text extraction is not
canonical evidence; the observations below come from direct visual review of
300 dpi PNG renders.

## Direct observations

### PDF p.6 / printed p.6

The rightmost vertical text column visibly begins with a numbered palace-name
sequence: `一命宮二兄弟宮三夫妻宮四子息宮五財帛宮六疾厄宮七遷移宮八奴僕宮`.
The page also contains branch tokens and rule/example columns. The artifact
records this as a partial named-palace sequence component, not as a complete
relative-order transcription and not as a palace-to-slot mapping.

Render: 300 dpi, `1500x2356`, SHA-256
`5df23d4bf6599436a5ed67cb5aeb28c68de4df6f73827755a37487390d955f58`.

### PDF p.7 / printed p.7

This page was visually reviewed as contextual manuscript material, including
branch/rule columns and the `安天府法` surface. It is not used as a separate
graph observation in v10 because the materialized binding frontier is already
fully specified by p.6 and p.13.

Render: 300 dpi, `1500x2356`, SHA-256
`380e2405f741c3bcdcf4ba80c08c7bf87821952f34a21ea0068b775c57d20b13`.

### PDF p.13 / printed p.13

The rightmost vertical column of a ruled chart/table visibly places `子`, `丑`,
`寅`, `卯`, `辰`, `巳`, `午`, `未`, `申`, `酉`, `戌`, `亥` in separate physical
rows/cells. Adjacent cells contain star/rule entries. This establishes a
direct branch-token-to-page-grid-row component. It is a page-top-to-bottom
observation only; it does not establish compass orientation, clockwise or
counterclockwise traversal, or the repository production ordinal.

Render: 300 dpi, `1500x2356`, SHA-256
`33f5931dc54583ed5c753d5319eed18555f029ce753a30269c48b673b632d4ddc`.

## Composition boundary

Pages 6 and 13 are direct observations from the same scanned manuscript. The
artifact adds one explicit relation connecting the two components as an
`inferred_not_direct_single_frame` frontier:

- p.6 supplies a partial numbered palace-name component;
- p.13 supplies a twelve-branch physical-grid component;
- no reviewed frame labels the p.13 grid with palace names;
- the p.6-to-p.13 semantic join remains inferred;
- no production ordinal, physical compass direction, work identity with 游藝錄
  or the Nanbei source, source authority, or semantic authority is promoted.

The candidate is therefore graph-admitted as a same-manuscript cross-page
frontier, but it is not admitted as an independent historical witness. The
top-level palace semantic blocker remains open. `directSingleWitnessFullBindingCount`,
`productionOrdinalBindingCount`, and `semanticAuthorityCount` remain zero;
readiness remains `not_safe_to_start`, grounding remains `blocked`, and
activation remains `experimental_only`.

## Reproducibility

The materializer is network-free and uses the fixed source/page hashes above.
It requires the checkout to remain on `main` at the historical basis HEAD and
checks the v9 complete/evidence bytes before constructing the successor. The
companion JSON files and integrity sidecars are generated together with
`complete.json`; the checker rejects mutations that promote the cross-page
inference, invent lineage, alter source bytes, or promote readiness/authority.
