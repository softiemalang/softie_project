# Ziwei P0 palace ↔ branch ↔ physical slot ↔ ordinal frontier v11

## Result

v11 is an additive research successor to v10. It records three newly reviewed evidence lanes without changing the canonical graph:

| Lane | Directly reviewed material | Graph status | P0 result |
| --- | --- | --- | --- |
| National Archives of Japan (NAOJ) | Same record `1078787`, items `4468520` and `4469314`; pp. 2, 69, 70, 73, 84, 87, 101, 102 and volume-2 tail pp. 121–137 | Same-record follow-up; no new source, observation, or relation | Direct branch-labelled 命 entries, 寅/順/逆 rule, Tianfu/紫微 material, and worked grids; no single-frame four-field binding |
| Academy of Korean Studies Jangseogak | `LIB_169174`, PDF `PC9A-23_001.pdf`, 32 pages | Held outside graph | Ruled manuscript/rule-star surfaces; date and lineage unresolved; no complete palace/branch/slot/ordinal frame |
| Internet Archive | Item `20260506_20260506_1217`, sampled public page JPEGs | Held outside graph | Mirror/copy comparison target; no independent witness or complete four-field frame |

The v11 graph remains 30 claims, 21 sources, 58 observations, 148 relations, and 11 open blockers. No independent witness is admitted, no blocker is closed, and readiness remains `not_safe_to_start`, grounding `blocked`, activation `experimental_only`, and rotation-06 `representation_only`.

The highest-value unresolved acquisition remains a direct scan of the 1871 游藝錄 witness. The CiNii record and NDL PID routes were rechecked, but no 1871 page bytes or usable public IIIF manifest were obtained.

## Scope and basis

- Checkout: `/Users/softie/Documents/softie_project`
- Branch: `main`
- Basis/current/origin head: `43253bdab2582fb005e5c4c114f296ced5609335`
- Predecessor: `artifacts/ziwei-p0-palace-branch-slot-composition-v10/`
- Materializer: `scripts/materialize-ziwei-p0-palace-branch-slot-composition-v11.mjs`
- Checker: `scripts/check-ziwei-p0-palace-branch-slot-composition-v11.mjs`
- Negative checker: `scripts/check-ziwei-p0-palace-branch-slot-composition-v11-negative-v0.mjs`
- Focused test: `test/ziweiP0PalaceBranchSlotCompositionV11.test.js`
- Output: `artifacts/ziwei-p0-palace-branch-slot-composition-v11/`

The materializer reads the v10 artifact, v10 evidence, the protected source-derived asset, the repository identity inputs, this report, and itself. It performs no network acquisition. All source-image and PDF bytes reviewed for this report remain outside Git; hashes and fixed locators are retained as evidence metadata.

## Evidence identities and locators

### NAOJ same-record follow-up

Institutional routes:

- [NAOJ catalog root](https://www.digital.archives.go.jp/file/1078787)
- [NAOJ viewer](https://www.digital.archives.go.jp/img/1078787)
- [NAOJ catalog record](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html)
- [NAOJ volume 1 item](https://www.digital.archives.go.jp/item/4468520)
- [NAOJ volume 2 item](https://www.digital.archives.go.jp/item/4469314)
- [NAOJ volume 1 IIIF manifest](https://www.digital.archives.go.jp/api/iiif/4468520/manifest.json)
- [NAOJ volume 2 IIIF manifest](https://www.digital.archives.go.jp/api/iiif/4469314/manifest.json)

The two volumes are the same `F1000000000000101426` record / printed-edition pair already held outside the v10 graph. The fixed manifest response identities rechecked in this session were:

| Item | Canvases | Manifest bytes | Manifest SHA-256 |
| --- | ---: | ---: | --- |
| `4468520` | 129 | 117,876 | `732991ca47aefc323e2095a93202fd301421ad8b92994c63caae2a94acf75af` |
| `4469314` | 137 | 125,132 | `3f167e1280527e1c672a72d7ef060c299ce9dffad1f362ddba04575da3df1560` |

The directly reviewed max/native JPEG response hashes were:

| Leaf | Canvas | Response bytes | SHA-256 | Direct reading |
| --- | --- | ---: | --- | --- |
| v1 p2 | `C102812178500` | 754,451 | `1806929dc23d944f350c059e6d4b003de1626c079138ab40c31f478bd49bb25f` | Work title/imprint; `南陽堂梓` |
| v1 p69 | `C102812185200` | 847,462 | `8da44e829a992114ade3c65b80d2a1944844bcbb0e486e65e83296d5a5561f82` | `寅安命`, `丑安命`, `子安命`, `○十二宮` surface |
| v1 p70 | `C102812185300` | 852,232 | `503e2963a1d129f679d89efbe1a59ebd9add3d462751bf4b68119032384873ab` | `辰安命`, `巳安命`, `午安命`, `未安命`, `申安命` surfaces |
| v1 p73 | `C102812185600` | 860,142 | `d1110027b4d126f23f6c5505e4d9900be85f444b3d49efaedca4ea749df2aa46` | 寅 base and `順`/`逆` rule text |
| v1 p84 | `C102812186700` | 838,573 | `366f656fd2a51520746543e1cc96d77a8a2e5dc920281684d4543926166de613` | 紫微/局 chart-table material |
| v1 p87 | `C102812187000` | 842,468 | `6e8c584cb01dce720c3ef862a23a127af11d987e14ef0df40d841492576d00a9` | `安天府圖`, `天府惟寅申二宮`, `紫府同宮` |
| v2 p101 | `C102812201300` | 854,211 | `234e6c6818f330da6cd6a28fcfe16979fd8646b53a2c4f8e3faa99eac224265f` | `陽男` / bureau / worked grid |
| v2 p102 | `C102812201400` | 848,398 | `e7331e9b2151134f1a34dc0151ddb47c3b7bbc48740f1c38f1a9120a06c7f8c3` | `陰男` / bureau / worked grid |

The exact visible rule strings retained as direct-observation metadata are:

```text
大抵入命俱從寅上起正月順數至本生月止
逆至本生時安命
順至本生時安身
安天府圖
天府惟寅申二宮
紫府同宮
```

These are direct visual locator strings, not a canonical OCR transcription. They show rule components and star/diagram surfaces; they do not state the repository’s production ordinal or compass orientation.

For the volume-2 tail, all seventeen pages/canvases `C102812203300` through `C102812204900` were acquired and hashed. Direct visual samples were leaves 121, 125, 129, 133, and 137. The full tail hash map is retained in `complete.json` and `evidence.json`; the sampled tail added no full four-field frame. Leaf 137 is a cover/end surface.

### AKS Jangseogak held-out scan

Routes:

- [AKS record `LIB_169174`](https://jsg.aks.ac.kr/dir/view?catePath=%EC%88%98%EC%A7%91%EB%B6%84%EB%A5%98&dataId=LIB_169174)
- [AKS direct PDF](https://jsg.aks.ac.kr/data/serviceFiles/pdf/PC9A-23_001.pdf)

The downloaded PDF was independently hashed from its actual bytes:

- 4,712,407 bytes
- 32 PDF pages
- SHA-256 `398463d7e211811cfdf23dfaf95423c7beed27a56122942dbef429a8ce190423`
- Catalog identity: `紫微斗數補遺` / `자미두수보유`, `[陳搏(宋) 著]`, `PC9A-23`, `MF35/8437`, `筆寫本(轉寫本)`, `年紀未詳`, `1冊(15張)`

The PDF was rendered at 200 dpi and pages 3, 16, 17, and 31 were directly visually reviewed. The render hashes/dimensions are:

| PDF page | Dimensions | Render SHA-256 |
| ---: | --- | --- |
| 3 | 6225x8334 | `2f6f5533cc7ae3c0d8da987eabdc2998694a3f7503fbed72988217b6e3360ed5` |
| 16 | 6225x8334 | `8b1691741704ae9d09081b21437315b94911419d34f4850d57f2e6f77846532a` |
| 17 | 6225x8334 | `6b094695b2279a111aeb1d116f4a69fe6696bbe23f81927154680936e320f21c` |
| 31 | 6225x8334 | `179c9d4b4a72e0bc713a62343b5243d19daeb15ae86425ced61693eb926e06d6` |

Page 3 visibly contains ruled star/rule material including `天府`, `武曲`, and `四正` surfaces. The sampled pages do not show a complete named-palace perimeter with branch tokens, physical slots, and production ordinal in one frame. Because date, author identity, and relation to 游藝錄/Nanbei remain unresolved, this scan stays held outside the graph.

### Internet Archive mirror/copy sample

Routes:

- [Internet Archive item](https://archive.org/details/20260506_20260506_1217)
- [Internet Archive metadata](https://archive.org/metadata/20260506_20260506_1217)

Metadata identifies `Tân Tiêm Hy Di Trần Tiên Sinh Tử Vi Đẩu Số Toàn Thư / 新鋟希夷陳先生紫微斗數全書`, creator `陳搏`, date `1600`, and a Ming 南陽堂刊本 description. The metadata-reported original PDF identity is 853,249,683 bytes with MD5 `6507c367fc0958995a0fc2045a46d5b2`. The JP2 ZIP is reported as 432,512,606 bytes with MD5 `2e6dad6373a39430882a20ee28014a85`; scandata MD5 is `9f8dcfd87309139c2e92b3d32320d3e5`, and the downloaded scandata bytes hash to SHA-256 `7cb7a6c40dd161c3fa960e5bd06871509c864edcee93f7b491bf6b9d24ec7be9`.

The full original PDF was not downloaded for an independent SHA-256, so `originalPdfSha256` remains null. Sampled public page JPEG hashes are:

| IA leaf | SHA-256 | Direct reading |
| --- | --- | --- |
| `n0` | `73a2558875d99a18cc23f270bb8dc0e65cbc4d5de2193a12680b888cc5041b55` | Cover/inner-cabinet surface matching the local Nanyangtang copy boundary |
| `n64` | `ed5328e0ef62c65332b960a7fbe89cc9d7baa9ab38e5e3e8d01e64ea34b42f36` | Sampled page; no full four-field frame |
| `n87` | `fc1560bf13b1b1df4bf4550c00e8f5b341a49d7297c8128a31deb057787c663e` | Ruled branch/star-table surface |
| `n172` | `2e45d23c1cd0d0ed93da15097e92279c315995a30a9dabeeeb3c79b1ad8aa68d` | Text surface |
| `n173` | `6a833bb644170aebff4f4ab798b64a4787fb2256c44b915db38fe4bd1de7bcee` | Text surface |

The mirror/copy comparison is useful provenance evidence, but it is not independent source authority, block identity, or semantic authority. The sampled pages do not close the palace/branch/physical-slot/ordinal binding.

## Four-field binding matrix

| Evidence lane | Branch token | Palace name | Physical chart slot | Ordinal / direction | Worked example | Full binding | Lineage / authority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NAOJ p69–70 | Direct partial (`安命` branch labels) | `○十二宮` and textual components only | Not bound in the same frame | Not established | Partial rule surface | No | Same NARA record; not independent |
| NAOJ p73 | Direct `寅`, `順`, `逆` rule text | Not in same frame | Not established | Direct rule component only; not production ordinal/compass | No | Same NARA record; not independent |
| NAOJ p84/p87 | Branch/Tianfu diagram components | No complete named-palace perimeter | Chart/table surface only | Not established | Partial | No | Same NARA record; not independent |
| NAOJ p101/p102 | Branch/star cells | No complete named-palace set | Rectangular grid cells, no semantic slot mapping | Not established | Direct worked-grid component | No | Same NARA record; not independent |
| NAOJ v2 tail p121–137 | No new complete binding | No | No new complete binding | No | No | No | Same NARA record |
| AKS PC9A-23 | Partial ruled branch/rule surface | Not bound | Not observed | Not observed | Not observed | No | Date/lineage unresolved |
| Internet Archive samples | Partial table surface | Not bound | Not observed | Not observed | Not observed in sample | No | Mirror/copy target; full PDF SHA-256 unavailable |

The canonical coverage counters therefore remain unchanged from v10:

```text
directNamedPalaceWitnessCount = 4
additionalDirectNamedPalaceCorroborationCount = 3
partialDirectNamedPalaceComponentCount = 1
directBranchPhysicalGridWitnessCount = 1
crossPageComposedBindingFrontierCount = 1
directSingleWitnessFullBindingCount = 0
productionOrdinalBindingCount = 0
semanticAuthorityCount = 0
```

## Direct observation versus inference

Direct observations are limited to visible glyphs, ruled columns, page geometry, fixed page-response bytes, catalog/manifest identities, and the explicit rule surfaces described above. The following remain inferences or unresolved hypotheses and are not promoted:

1. That the NAOJ `安命` pages, p73 rule, p84/p87 diagram surfaces, and p101/p102 grids share one fully specified coordinate frame.
2. That `寅` as a rule base supplies a production ordinal, compass orientation, or clockwise/counterclockwise contract.
3. That `○十二宮` or any adjacent textual rule column maps each named palace to a physical chart slot.
4. That the AKS manuscript belongs to the 1871 游藝錄 lineage or shares the admitted graph’s semantic coordinate frame.
5. That the Internet Archive item’s metadata or sampled pages close block identity with the local Nanyangtang copy.
6. That any of these observations warrants semantic authority, readiness, or activation.

OCR and extracted text are locator-only. The canonical evidence does not substitute OCR output for direct visual review.

## Tianfu comparison boundary

NAOJ p84/p87 adds a direct same-record `安天府圖`, `天府惟寅申二宮`, and `紫府同宮` surface. This is useful corroboration for the existence of Tianfu/紫微 rule and diagram material in the same printed record, but it does not adjudicate the existing Tianfu representation conflict, palace physical slot, production ordinal, source lineage, or semantic authority. The rotation-06 representation remains representation-only.

The AKS p3 `天府`/`武曲` surface is similarly only a held-out ruled manuscript observation. It cannot be used as an independent Tianfu oracle while the manuscript’s date, lineage, and coordinate frame remain unresolved.

## 1871 boundary

The [CiNii 1871 catalog record](https://ci.nii.ac.jp/ncid/BD19656670), [NDL manuscript PID](https://ndlsearch.ndl.go.jp/books/R100000039-I2606209), and [NDL compiled-volume PID](https://ndlsearch.ndl.go.jp/books/R100000002-I000007637157) remain acquisition routes, not page evidence. The attempted NDL IIIF routes for `2606209` and `2610509` returned `404_json_checkResult_NG`. Therefore:

- `historical1871ScanObtained = false`
- direct 1871 byte comparison = false
- direct 1871 text comparison = false
- 1871-to-1883 block/text lineage = open
- graph admission = false

## Negative contract and readiness

The v11 negative contract rejects promoting:

- the NAOJ same-record follow-up as an independent witness;
- the NAOJ p73 rule into production ordinal or compass direction;
- the NAOJ Tianfu/紫微 and worked-grid pages into a full named-palace four-field frame;
- the AKS scan into a known 1871 witness or semantic authority;
- the Internet Archive metadata MD5 into a full PDF SHA-256 or the mirror into an independent witness;
- catalog/failed-IIIF 1871 routes into page bytes; or
- any v11 frontier item into graph, readiness, or activation state.

Readiness is unchanged: `not_safe_to_start`; grounding `blocked`; activation `experimental_only`; rotation-06 `representation_only`. Production, authentication, deployment, remote database, staging, commit, and push operations were not performed.

## Validation record

The intended validation sequence is:

```sh
node scripts/materialize-ziwei-p0-palace-branch-slot-composition-v11.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v11.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v11-negative-v0.mjs
node --test test/ziweiP0PalaceBranchSlotCompositionV11.test.js
git diff --check
npm test
npm run build
```

The final task report must distinguish deterministic artifact checks, focused tests, full suite/build results, and unverified real-device/remote behavior separately.
