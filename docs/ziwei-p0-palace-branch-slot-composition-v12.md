# Ziwei P0 palace ↔ branch ↔ physical slot ↔ ordinal frontier v12

## Result

v12 is an additive research successor to v11. It records four directly reviewed scan lanes without changing the canonical graph.

| Lane | Directly reviewed material | Graph status | P0 result |
| --- | --- | --- | --- |
| Anonymous SSID scan | Commons file `SSID-12392926`, 177-page PDF; pp. 1, 130–165, 166–177 directly rendered/reviewed | Held outside graph | Contains `紫微斗數篇` textual/rule/table surfaces, but source metadata, edition lineage, independence, physical slot, and production ordinal remain open |
| Tianyige | `330000-1705-0017417`, 54-page retained scan labelled 清同治刻本 | Held outside graph | Direct old-book pages are present, but the retained sequence does not contain `游藝錄五/紫微斗數篇` |
| Zhuji Library | `ZJSLib-FLDB-2452`, 54-page retained scan labelled 清光緒二十五年刻本 | Held outside graph | Direct library pages are present, but the retained sequence does not contain `游藝錄五/紫微斗數篇` |
| NDL false-positive route | Commons derivatives NDL 2545984–2545987, pages 1–2 of each | Rejected / held outside graph | Direct scans are different manuscript parts under NDLBibID `000007637582`, not NDL PID `2606209` and not the 1871 target witness |

The v12 graph remains 30 claims, 21 sources, 58 observations, 148 relations, and 11 open blockers. No independent target witness is admitted, no top-level blocker is closed, and readiness remains `not_safe_to_start`, grounding `blocked`, activation `experimental_only`, and rotation-06 `representation_only`.

The SSID scan is a useful direct observation of the target text surface, but it does not close the requested `branch token ↔ palace name ↔ physical chart slot ↔ ordinal/direction` binding. The reviewed pages are vertical text/rule/table surfaces; no single reviewed frame supplies the full physical-slot and production-ordinal join.

## Scope and basis

- Checkout: `/Users/softie/Documents/softie_project`
- Branch: `main`
- Basis/current/origin head: `43253bdab2582fb005e5c4c114f296ced5609335`
- Predecessor: `artifacts/ziwei-p0-palace-branch-slot-composition-v11/`
- Materializer: `scripts/materialize-ziwei-p0-palace-branch-slot-composition-v12.mjs`
- Checker: `scripts/check-ziwei-p0-palace-branch-slot-composition-v12.mjs`
- Negative checker: `scripts/check-ziwei-p0-palace-branch-slot-composition-v12-negative-v0.mjs`
- Focused test: `test/ziweiP0PalaceBranchSlotCompositionV12.test.js`
- Output: `artifacts/ziwei-p0-palace-branch-slot-composition-v12/`

The materializer reads v11, the protected source-derived asset, repository identity inputs, this report, and the v12 checkers. It performs no network acquisition. The reviewed source PDFs remain outside Git; their actual bytes and selected rendered-page bytes are represented by fixed SHA-256 identities.

## Evidence identities and direct observations

### Anonymous SSID target scan

- [Commons file page](https://commons.wikimedia.org/wiki/File:SSID-12392926_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8_%E9%81%8A%E8%97%9D%E9%8C%84_%E8%97%9D%E4%B8%80-%E5%85%AD.pdf)
- [PDF bytes](https://upload.wikimedia.org/wikipedia/commons/b/b0/SSID-12392926_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8_%E9%81%8A%E8%97%9D%E9%8C%84_%E8%97%9D%E4%B8%80-%E5%85%AD.pdf)

The PDF is 43,189,253 bytes and 177 pages; actual source-PDF SHA-256 is:

```text
d80dc52b0a74650424397c0b5d21302532cf7473b5c059734128e2300b8275f3
```

The Commons file page has blank source metadata. The cover visibly reads `春在堂全書 第十一冊`; that cover string is not an edition or 1871 lineage proof. Pages 130–165 visibly contain `紫微斗數篇`, `命宮`/`身命` and named-palace/rule/table material, including `安天府圖`-related surfaces. Pages 166–177 continue into `相宅篇` and the end of `游藝錄五` before `游藝錄六`. The reviewed material does not show a single physical chart perimeter binding every palace name to a branch token, slot, and production ordinal.

Selected 1400-pixel renders were fixed by SHA-256:

| Page | Render dimensions | SHA-256 |
| ---: | --- | --- |
| 1 | 783x1400 | `3b99b4ddff340bae09e420b8aec8d274ad9e904bcd535cce6a161713fbe008d5` |
| 130 | 788x1400 | `1b59a39e8286bfd8919714800fbc7dcce21609bff47ce78b9a5de980a7173ec8` |
| 131 | 788x1400 | `5daf87df93eef7da052e38743c416a203f63f36488467311cc11dcc66a8e6fca` |
| 165 | 788x1400 | `2e6af8e534a7fc9327c2768b0de687ff6fa526c189bd8dd75839bf15df696ea9` |
| 166 | 788x1400 | `2f91c8241efb89cc46eb58348a8412ccf9f08330b3538d58d91acc384dd57486` |
| 177 | 788x1400 | `946e35f584a5d535b5b8a76c6c4b7c4cb1c50666ec9812464171b48ccdb1e0b1` |

These are direct visual locators, not canonical OCR. The scan stays outside the graph because source identity, edition, independence from existing Zhejiang/NLC/CADAL material, physical slot, and ordinal/direction remain unresolved.

### Tianyige retained scan

- [Commons file page](https://commons.wikimedia.org/wiki/File:Tianyige-330000-1705-0017417_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%EF%BC%88%E5%AD%98%E5%8D%81%E4%B8%80%E7%A8%AE%EF%BC%89%E6%B8%85%E4%BF%9E%E6%A8%BE%E6%92%B0_%E6%B8%85%E5%90%8C%E6%B2%BB%E5%88%BB%E6%9C%AC.pdf)

The actual 15,913,649-byte, 54-page PDF hashes to:

```text
b8d632caa8e0aa7ab61d2334e4eda578d4aa18c3ec963b7872966ca770ed2723
```

Commons metadata identifies a Tianyige retained collection, `清俞樾撰`, `清同治刻本`, and census identifier `330000-1705-0017417`. Direct review of the retained sequence shows `錄要`, `校勘記`, catalog/index, errata, and other `春在堂` material. The target `游藝錄五/紫微斗數篇` chapter is not present in this 54-page scan. Edition metadata therefore cannot substitute for absent target page bytes.

### Zhuji retained scan

- [Commons file page](https://commons.wikimedia.org/wiki/File:ZJSLib-FLDB-2452_%E6%98%A5%E5%9C%A8%E5%A0%82%E5%85%A8%E6%9B%B8%EF%BC%88%E5%AD%98%E4%B8%80%E7%A8%AE%EF%BC%89.pdf)

The actual 26,397,994-byte, 54-page PDF hashes to:

```text
8bbd8808fb3b85cc2f74ab39453cca90d22fffccd865ac82319a24185ed0b388
```

The metadata identifies `ZJSLib-FLDB-2452`, 諸暨市圖書館, `清光緒二十五年刻本`, and call `乙61`. Direct review of the watermarked retained sequence shows title/calligraphic and other `春在堂` material, but no target `游藝錄五/紫微斗數篇` chapter or four-field chart. The candidate remains held out.

### NDL false-positive group

- [NDL 2545986 record](https://ndlsearch.ndl.go.jp/books/R100000039-I2545986)
- Commons files are represented by their exact locators in `complete.json` and `lineage-assessment.json`.

The four actual PDF identities are:

| Part | Identified section | Bytes | SHA-256 |
| ---: | --- | ---: | --- |
| 2545984 | `春在堂襍文三編卷3` | 120,504,276 | `5598019f7bb1241b1977d181e0d6e73b1e8b2a01c4689f59d5d890cd728e47f0` |
| 2545985 | `春在堂詩編卷9` | 71,603,842 | `995e5d31f10dfc5854e4ed5944424f9a6edbd3cd9113c44332e785da840fc741` |
| 2545986 | `春在堂隨筆卷7` | 184,788,054 | `df0174804899a6f7b23001c15d500260f6f8ac06dfa19d3ebaf08cb02711c4ec` |
| 2545987 | `春在堂尺牘卷5` | 78,892,690 | `06a5ab97a82a95aa46acbc86309d4c6b7644afb981627d09e35b085bb8778f0a` |

Pages 1–2 of every part were directly rendered/reviewed. They are modern NDL digitization photographs with NDL labels/calibration surfaces. The part metadata identifies NDLBibID `000007637582`, call `WA37-5`, and manuscript parts different from NDL PID `2606209`. They do not contain the target `游藝錄`/`紫微斗數篇`. This resolves the route as a direct false positive; it does not provide 1871 page bytes or a palace-coordinate witness.

## Four-field binding matrix

| Evidence lane | Branch token | Palace name | Physical chart slot | Ordinal / direction | Full binding | Admission |
| --- | --- | --- | --- | --- | --- | --- |
| SSID p130–165 | Partial direct textual/rule/table surface | Partial named-palace sequence | Not observed | Not observed | No | Held out; source metadata and independence unresolved |
| Tianyige p1–54 | Not observed in target section | Not observed in target section | Not observed | Not observed | No | Held out; target chapter absent |
| Zhuji p1–54 | Not observed in target section | Not observed in target section | Not observed | Not observed | No | Held out; target chapter absent |
| NDL 2545984–87 p1–2 | Not observed in non-target parts | Not observed in non-target parts | Not observed | Not observed | No | Rejected false positive; not PID 2606209 |

Canonical graph coverage remains:

```text
directSingleWitnessFullBindingCount = 0
productionOrdinalBindingCount = 0
semanticAuthorityCount = 0
independentPhysicalWitnessesAdmitted = 0
```

## Direct observation versus inference

Direct observations are limited to visible glyphs, ruled columns, page geometry, fixed PDF/render bytes, catalog metadata, and the explicit section-presence/absence findings above. The following remain unresolved and are not promoted:

1. That the SSID scan is independent of the existing Zhejiang/NLC/CADAL scan family.
2. That the SSID named-palace sequence maps to a physical chart perimeter or production ordinal.
3. That Tianyige or Zhuji retained-section metadata can stand in for missing target chapter pages.
4. That NDL 2545984–87 can be identified with NDL PID 2606209 despite the distinct NDLBibID and part titles.
5. That any v12 observation warrants source authority, semantic authority, readiness, or activation.

OCR/text extraction remains locator-only. No OCR output is used as canonical text.

## 1871 boundary and readiness

The 1871 `游藝錄` scan remains unacquired. The SSID target scan is not identified as the 1871 physical witness, and the NDL false-positive group is explicitly not PID `2606209`. Therefore:

- `historical1871ScanObtained = false`
- direct 1871 byte comparison = false
- direct 1871 text comparison = false
- 1871-to-1883 block/text lineage = open
- graph admission = false

Readiness remains `not_safe_to_start`; grounding `blocked`; activation `experimental_only`; rotation-06 `representation_only`. Production, authentication, deployment, remote database, staging, commit, and push operations were not performed.

## Validation record

The v12 validation sequence is:

```sh
node scripts/materialize-ziwei-p0-palace-branch-slot-composition-v12.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v12.mjs
node scripts/check-ziwei-p0-palace-branch-slot-composition-v12-negative-v0.mjs
node --test test/ziweiP0PalaceBranchSlotCompositionV12.test.js
git diff --check
npm test
npm run build
```

The final task report must distinguish deterministic artifact checks, focused tests, full suite/build results, and unverified real-device/remote behavior separately.
