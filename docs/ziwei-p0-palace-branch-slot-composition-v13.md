# Ziwei P0 palace ↔ branch ↔ physical slot ↔ ordinal frontier v13

## Result

v13 is an additive research successor to v12. It records a materially new NLC / 中華古籍資源庫 witness lane without admitting the lane to the canonical semantic graph.

| Lane | Directly verified/reviewed material | Graph status | P0 result |
| --- | --- | --- | --- |
| NLC institutional record and official stream | `續道藏`, `(明)張國祥等編`, `內府明萬曆35年[1607]`, `刻本`, 善本書號 `02608`, identifier `411999007380`; bids `139580`, `139581`, `139582` map to `紫微鬥數` 卷一–三; official range-stream bytes acquired and hashed | Held outside graph | Official file identity and exact equality with the Commons derivatives are verified; independent-witness relation, source/semantic authority, and semantic binding remain open |
| 第167冊 derivative | 112-page source-marked Commons derivative; p1, p6, p25–32 directly rendered/reviewed | Held outside graph | Direct grid/rule surfaces include `四排星辰`, `八書化曜`, `起紫微例`, `安命例`, `安身例`, `起大限例`, and `起小運例`; no complete five-field binding |
| 第168冊 derivative | 67-page source-marked Commons derivative; p1–2 directly rendered/reviewed | Held outside graph | `紫微斗數卷之二` and `凡看命先定身宮` / `身宮` are direct observations; no placement coordinate or 身主 table |
| 第169冊 derivative | 74-page source-marked Commons derivative; p68–72 reviewed as continuation locators | Held outside graph | No new complete palace-coordinate frame is promoted |

The canonical graph remains 30 claims, 21 sources, 58 observations, 148 relations, and 11 open blockers. `full binding = 0`, `production ordinal = 0`, `semantic authority = 0`, and independent physical witnesses admitted remains `0`. Readiness remains `not_safe_to_start`, grounding `blocked`, activation `experimental_only`, and rotation-06 `representation_only`.

## Scope and basis

- Checkout: `/Users/softie/Documents/softie_project`
- Branch: `main`
- v13 basis/current/origin head at materialization: `479c4b7dae57c3b7b51e5fdffb5617aa18723db3`
- Predecessor: `artifacts/ziwei-p0-palace-branch-slot-composition-v12/`
- Materializer: `scripts/materialize-ziwei-p0-palace-branch-slot-composition-v13.mjs`
- Checker: `scripts/check-ziwei-p0-palace-branch-slot-composition-v13.mjs`
- Negative checker: `scripts/check-ziwei-p0-palace-branch-slot-composition-v13-negative-v0.mjs`
- Focused test: `test/ziweiP0PalaceBranchSlotCompositionV13.test.js`
- Output: `artifacts/ziwei-p0-palace-branch-slot-composition-v13/`

The v12 artifact and its old basis remain read-only inputs. v13 uses `historical_reference` for descendant replay and does not rewrite or rebase v2–v12, Youyi, or Toyo bytes.

## NLC institutional identity and access boundary

- [NLC catalog record](http://read.nlc.cn/allSearch/searchDetail?searchType=10024&showType=1&indexName=data_892&fid=411999007380)
- Viewer records: `139580.0`, `139581.0`, and `139582.0` under `aid=892`
- Catalog HTML capture: 86,027 bytes, SHA-256 `2668bcd804ebef6b687514e1708fa33daab6e08b057a8e0f715b5525599ddcb2`
- `formatCatalog` direct responses map the three bids to `紫微鬥數` `卷之一`, `卷之二`, and `卷之三`.

The official viewer HTML was opened in fresh sessions and the session-scoped values were used with `getReaderRangeNew`. Each first range returned `206 Partial Content`, a `%PDF` header, and a complete `Content-Range` total; the body was completed with a final-byte range request and verified with `pdfinfo` and SHA-256. The official stream is now directly acquired. The Commons files are exact byte duplicates of the official PDFs, so they are not counted as independent physical witnesses.

The supplied method note reports totals one byte above the direct observation for each volume. The direct `Content-Range`, completed file size, and `pdfinfo` result are retained as authoritative:

| BID | Method note total | Direct `Content-Range` / file total | Pages |
| --- | ---: | ---: | ---: |
| 139580 | 22,720,526 | 22,720,525 | 112 |
| 139581 | 13,309,633 | 13,309,632 | 67 |
| 139582 | 14,889,456 | 14,889,455 | 74 |

## Source-marked derivative identities

| Volume | Pages | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| 第167冊 / bid `139580` | 112 | 22,720,525 | `ae39779b9da3403d10b4548c80d819af9d0b12d1d69bba89b0a120b82fc50760` |
| 第168冊 / bid `139581` | 67 | 13,309,632 | `620b91ec07d670a4eec28e7848a2f58a4d921f08dc192060cfb01e0a9a5986c4` |
| 第169冊 / bid `139582` | 74 | 14,889,455 | `7b5bfc67bc5729800e222ded2fb6442efdca0d29a335856acc62d9aea1116e67` |

The official PDFs and the source-marked Commons derivatives were downloaded outside the repository and compared byte-for-byte. The three pairs are exact matches. Selected p1, p6, p25–32, and vol. 2 p1–2 render hashes are frozen in `complete.json`; vol. 3 p68–72 remain page locators without invented render hashes.

## Direct visual observations

The following are locator transcriptions, not canonical OCR. Watermarks, layout, and uncertain glyph variants are retained rather than repaired.

- Vol. 1 p6: `四排星辰`; `八書化曜`.
- Vol. 1 p25: `術天機`; local grid surface with visible `子／紫微` and `自子生起順`. This is a local branch/grid observation, not a palace label or production slot.
- Vol. 1 p29: `起紫微例`; `從未上順數子遇着生年便布紫`; `從未上起子順數至本人生年安紫逆`.
- Vol. 1 p30: `起天杖例`; `從子上起正月逆數至本人生月安杖逆布異毛又`; `起天刑例`; `凡起天刑從酉上起正月順數至本人生月`; `起天哭例`; `凡起天哭與本人生年相合安哭／如子年生丑上安哭`.
- Vol. 1 p31: `安命例`; `杖星宮裏起生時順數卯處安命之`; `安身例`; `單從杖上起初一不問陰陽男女逆／兩日之半行一宮數至生日身宮住`; a partially obscured continuation includes `從杖上逆數一宮兩日半五日二宮`.
- Vol. 1 p32: `起大限例`; `陽男陰女從命宮順數十年行一宮`; `陰男陽女從申宮逆數十年行一宮`; `起小運例`; `一年一宮`; an exception row visibly includes `初三、初八、十三、十八、二十三、二十八／午時不過宮，未時過宮`.
- Vol. 2 p2: `凡看命先定身宮／身宮` in `太乙金井局陰陽玄妙論`.

The reviewed pages show a historical 十八飛星-like rule/star surface, including visible names such as `紫微`, `紅鸞`, `天虛`, `天庫`, `天貴`, `天貫`, `天印`, `文昌`, `天壽`, `天福`, `天祿`, and `天空`, alongside additional variant/obscured glyphs. This is not treated as equivalent to the modern 14 major-star system.

## Rule dossier and four-field boundary

The structured dossier in `complete.json` normalizes each direct rule only as:

```text
input → anchor → direction → sequence → resulting branch/slot
```

Examples:

| Locator | Direct rule surface | Modern comparison | Resulting slot |
| --- | --- | --- | --- |
| Vol. 1 p29 | 生年 → 未 → 先順數至子，再逆布紫 | `non_comparable` | 紫微 visible; production slot not stated |
| Vol. 1 p30 | 生月 → 子 → 逆數 → 安杖 | `historical_difference` | terminal slot not stated |
| Vol. 1 p30 | 生月 → 酉 → 順數 → 安刑 | `historical_difference` | terminal slot not stated |
| Vol. 1 p30 | 生年地支 → 相合 → `子年生丑上安哭` | `historical_difference` | 丑 example anchor visible; no palace/slot |
| Vol. 1 p31 | 生時 → 杖星宮 → 順數 → 安命 | `unresolved` | no perimeter slot identity |
| Vol. 1 p31 | 生日 → 杖 → 逆數; 兩日之半行一宮 → 身宮 | `historical_difference` | no production ordinal |
| Vol. 1 p32 | 陰陽男女 → 命宮/申宮 → 順/逆 → 十年一宮 | `non_comparable` | movement rule only |
| Vol. 2 p2 | 看命 → 身宮 → `先定身宮` | `unresolved` | precedence statement only |

| Evidence component | v13 direct result | Boundary |
| --- | --- | --- |
| Branch token | Partial: local `子` token/grid surface | Not joined to all palace names |
| Palace name | Rule labels/results such as 紫微、命宮、身宮 are visible | Not joined to the same physical grid frame |
| Physical slot | Partial rectangular/ruled grid cell | No named palace-to-cell map |
| Ordinal | None | No production ordinal |
| Direction | Direct in several rule surfaces | Not a declared chart orientation/ordinal |
| Full five-field binding | No | Held outside graph |

The v13 candidate therefore has `fullBinding = false`, `productionOrdinal = false`, and `semanticAuthority = false`. Its direct rule surfaces narrow the frontier but do not close a top-level blocker.

## Source versus inference

Direct observations are limited to institutional catalog fields, volume mapping, fixed derivative bytes, rendered page geometry, visible glyphs, and visible rule wording. The following remain inferences or unknowns and are not promoted:

1. The exact official/Commons byte pair is an independent physical witness relative to the existing graph.
2. The local NLC grid uses the same coordinate frame as the existing named-palace and Nanbei components.
3. Rule direction/step text declares a production ordinal or physical chart orientation.
4. The visible 18-star surface is equivalent to the modern 14 major-star system.
5. Any v13 observation warrants source authority, semantic authority, readiness, or activation.

OCR/text extraction remains locator-only. No OCR output is used as canonical text.

## Graph, blockers, readiness, and preservation

- Graph additions: 0 claims, 0 sources, 0 observations, 0 relations, 0 physical witnesses, 0 blockers.
- Blockers closed: none. Four new sub-boundaries are recorded: NLC record identity and volume mapping, direct official range-stream/file equality, local grid/rule observations, and `先定身宮` precedence. Exact official bytes do not by themselves close independent lineage, semantic authority, or the five-field binding.
- Readiness: unchanged: `not_safe_to_start` / `blocked` / `experimental_only`.
- Historical v2–v12, Youyi, and Toyo artifacts: not rewritten, rebased, or staged.
- Source PDFs/renders: retained outside Git; no external web bytes copied into the repository.
- Production algorithm, activation, remote DB, deployment, staging, commit, and push: not performed.

## Validation sequence

```sh
node scripts/materialize-ziwei-p0-palace-branch-slot-composition-v13.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v13.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v13-negative-v0.mjs
node --test test/ziweiP0PalaceBranchSlotCompositionV13.test.js
git diff --check
npm test
npm run build
```

The final task report must distinguish deterministic artifact checks, focused tests, full-suite/build results, and unverified remote/real-device behavior separately.
