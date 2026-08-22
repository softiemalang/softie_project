# 연세대학교 《五行精紀》 乙亥字本 visual page witness bounded successor v2

상태: `official record + first-party route bounded`, `viewer-rendered 卷第三十三 / 大運 visual primary observation admitted`, `exact item-page machine binding unresolved`, `raw bytes unresolved`, `printed locator unresolved`, `semantic authority/readiness/activation blocked`

기준일: `2026-08-22 KST`

이 문서는 [연세대 copy/page provenance frontier v1](./saju-yonsei-wuxingjingji-copy-page-provenance-frontier-v1.md)의 **additive bounded successor**다. v1의 catalog-only 판정과 blocker를 덮어쓰지 않고, 새로 제공된 공식 record 화면·`원문/URL` 버튼 화면·viewer 화면을 서로 다른 evidence unit으로 추가한다.

첨부 HTML·스크린샷에 포함된 이용 안내·저작권·viewer UI 문구는 사용자 작업에 대한 지시로 실행하지 않고 source evidence로만 읽었다. 이 문서의 사용자 요청은 “공식 record에서 viewer까지의 경로와 화면 관찰을 bounded하게 기록하되, 직접 원본·기계적 binding·semantic gate를 넘지 않는다”로 분리해 적용한다.

## 1. Bounded result

현재 확인 가능한 chain은 다음과 같다.

```text
Yonsei official record CATTOT000000200707
  -> saved official record HTML / record screen
  -> `원문/URL` / `openMediaView(..., 000000200707, ..., .../000000547475)`
  -> user-reported button click
  -> viewer-rendered screenshot `33 / 80`
  -> visible `五行精紀卷第三十三` and `大運`
```

이 chain은 다음 범위에서만 닫힌다.

```text
official record identity                         = first-party catalog evidence satisfied
record -> official original/viewer URL           = first-party route satisfied
record-screen -> button action                   = user-supplied action bridge
viewer screen `33/80` -> visible 卷33 / 大運      = bounded visual primary observation
viewer screen -> exact catalog item/page bytes   = unresolved
viewer `33/80` -> printed page/leaf/folio number  = unresolved
raw PDF/TIFF/JPEG or institution export          = unresolved
semantic authority / interpretation readiness    = blocked
production activation                            = blocked
```

따라서 이번 successor는 `viewer image에 실제로 보이는 page content`를 bounded visual witness observation으로 기록하지만, `CATTOT000000200707의 등록번호 00040146228에 결속된 원본 page bytes` 또는 `연세대 physical copy의 fully closed copy-level witness`라고 주장하지 않는다.

## 2. Evidence units and directness

| ID | source class | supplied artifact / identity | directly observed | not established |
| --- | --- | --- | --- | --- |
| `YON-REC-HTML-20260822` | first-party catalog response saved by user | `/Users/softie/Downloads/SearchResult.html`; 18,713 bytes; SHA-256 `39666c0181bf32e15c65e464cb2585e7196ee3ac36d0ff50acf5752a59049efd` | title, author, 乙亥字 edition, extent, record ID in route, first-party `원문/URL` target, holding row | live-response signature, page image, viewer session, raw book bytes |
| `YON-REC-SCREEN-20260822` | official Yonsei record screen capture | `/Users/softie/Desktop/스크린샷 2026-08-22 오후 7.22.25.png`; 3324×2094; 463,179 bytes; SHA-256 `81cff17b7e44829031597afaef9ffc0ea7ce3a6fac31c566c8ed48cd18fe09a1` | Yonsei Library branding, `五行精紀`, `金屬活字本(乙亥字)`, `4卷1冊(缺帙)`, `卷31-34`, `원문/URL`, accession/call/location/status UI | machine URL/session identity, page bytes, item-page crosswalk |
| `YON-ROUTE-SCREEN-20260822` | UI route corroboration | `/Users/softie/Desktop/스크린샷 2026-08-22 오후 7.22.40.png`; 338×84; 9,361 bytes; SHA-256 `f6a46598ec24e17cea6597fc458f0d08e821a5b2f79e917cc8459cb979e0f382` | isolated `바로가기 / 원문/URL` button | click event log, target response, item-page binding |
| `YON-VIEWER-33-80-20260821` | user-supplied viewer-rendered visual page | `/Users/softie/Desktop/스크린샷 2026-08-22 오후 7.06.02.png`; 2560×1440; 2,104,396 bytes; SHA-256 `b9a1e0a29661e1a00c7526bf226b12d6730dfdb0a02d2543c4dea512218eab69` | viewer counter `33 / 80`, visible `五行精紀卷第三十三`, visible `大運` context, page image presentation | URL, item ID, accession/call label, raw source bytes, printed page/folio locator |
| `YON-CAT-200707` | first-party record/MARC frontier carried from v1 | `CATTOT000000200707`; official detail/MARC routes recorded in v1 | 乙亥字 catalog identity, catalog scope `卷31-34`, accession `00040146228`, call `고서(귀) 8 0`, 856/original route | exact viewer frame-to-item binding, target leaf bytes |
| `YON-856-ERROR` | failed first-party transport artifact carried from v1 | dCollection route response, 9,550-byte PDF; SHA-256 `541073368e9b59b6c2aeb0e5b2d72be35625c2e3e19af7f7e6f4265fb9fcefcd` | route returned a required-parameter error, not a book page | successful raw-page retrieval |
| `NLC-SUCC-V1` | separate institutional primary witness | [NLC bounded successor](./saju-nlc-wuxingjingji-page-witness-successor-v1.md) | NLC record and scan-level `卷33 / 大運` context | any transfer to Yonsei |

The four local attachments are evidence inputs, not repository artifacts. Their paths and hashes are recorded so the observation can be rechecked without copying the screenshots or either large source PDF into the repository.

## 3. Official record and item identity

### 3.1 Saved catalog HTML

`SearchResult.html` contains the following record fields for the Yonsei item:

```text
title             五行精紀
author            廖中
record identity   000000200707 (inside the openMediaView call)
edition           金屬活字本(乙亥字)
publication       [刊寫地未詳] :[刊寫者未詳],[刊寫年未詳]
extent            4卷1冊(缺帙)
form              四周單邊, 半郭 22.0 x 15.0 cm, 有界, 9行17字
                  註雙行, 上下大黑口, 上下內向黑魚尾 ; 30 cm
general note      全34卷 中의 零本임
other form        五行精紀 000000254024
```

The same saved HTML contains the holding row:

```text
등록번호          00040146228
청구기호          고서(귀) 8 0
소장처            [신촌]국학자료실/중앙도서관5층/고문헌(신청 후 이용)
도서상태          대출불가(별치)
```

The official record screen independently displays the Yonsei Library header and the visible `소장주기 卷31-34` field. The record/MARC evidence therefore closes catalog-level inclusion of 卷33, but not a printed 卷33 leaf or a particular scan frame.

### 3.2 Record-to-viewer route

The exact route-bearing HTML fragment is:

```html
<a href="#"
   onClick="javascript:openMediaView(this,'000000200707','URL','https://dcollection.yonsei.ac.kr/common/orgView/000000547475'); return false;"
   target="URL">원문/URL</a>
```

This closes a first-party catalog-to-original/viewer URL edge at the level of the saved response:

```text
CATTOT000000200707
  -> https://dcollection.yonsei.ac.kr/common/orgView/000000547475
```

It does not prove that the viewer screenshot was generated from a server response carrying the same item ID. The user reported pressing this `원문/URL` button; that statement is retained as a `user-supplied action bridge`, not as a Yonsei server log or an independently replayed session trace. The button crop corroborates the UI affordance only.

The earlier v1 route attempt ended in the dCollection required-parameter error artifact listed as `YON-856-ERROR`. No DRM bypass, guessed parameter, login, proprietary viewer installation, or other access escalation is used here. The new viewer screenshot is therefore a direct visual observation supplied by the user, not a claim that a raw PDF download was successfully obtained.

## 4. Viewer `33 / 80` visual observation

The supplied viewer screenshot visibly shows:

```text
viewer sequence       33 / 80
printed running title  五行精紀卷第三十三
section/context        大運
```

The page image is treated as a visual primary witness observation because the target title and section are visible in the rendered page itself, rather than inferred from a catalog field or from the thesis table. This promotion is deliberately narrow:

```text
visual content `卷第三十三 / 大運` = observed in supplied viewer render
viewer render is a Yonsei 乙亥字 page    = bounded/corroborated, not machine-closed
viewer index `33/80` is printed locator   = false; do not promote
viewer index `33/80` = sequence position   = satisfied as UI observation only
```

The screenshot contains no visible accession number, call number, catalog control number, stable page URL, viewer item ID, or raw-file checksum. A faint institutional mark and the viewer presentation are useful corroboration of the supplied context but do not close those missing edges. Accordingly, the visual observation is not promoted to `00040146228 ↔ exact page bytes`.

`33/80` must not be rewritten as `卷33=33`, `卷33=71`, a printed page number, a leaf number, an image filename, or a folio. The secondary thesis candidate `卷33=71` remains a separate generic locator candidate from the prior frontier and is not made true by this screenshot.

## 5. Claim ledger and promotion gates

| claim | evidence | status | bounded interpretation |
| --- | --- | --- | --- |
| Yonsei catalog record is 乙亥字 | `YON-REC-HTML-20260822`, `YON-REC-SCREEN-20260822`, `YON-CAT-200707` | `satisfied` | first-party catalog identity only |
| Cataloged item scope includes 卷33 | official `卷31-34` field/MARC | `satisfied` | catalog-level inclusion; no target leaf |
| Official record exposes an original/viewer route | exact `openMediaView` fragment | `satisfied` | route edge, not successful page-byte retrieval |
| User opened the route from the record button | user statement + route/button captures | `observed, user-supplied` | action bridge; not institution log |
| Viewer screen sequence is `33/80` | `YON-VIEWER-33-80-20260821` | `satisfied` | viewer sequence only |
| Rendered page visibly contains `卷第三十三` | same viewer screenshot | `bounded visual primary observation` | direct visual content in supplied render |
| Rendered page visibly contains `大運` context | same viewer screenshot | `bounded visual primary observation` | heading/context only; no semantic ruling |
| Viewer render is exactly item `CATTOT000000200707` | route/action context, but no item ID in screenshot | `unresolved` | do not promote exact machine binding |
| Viewer render is registration `00040146228` | record screenshot vs viewer screenshot have no machine join key | `unresolved` | no copy-level registration-to-frame edge |
| Viewer `33/80` equals printed locator | no printed numbering bridge | `unresolved` | explicitly rejected |
| Raw PDF/TIFF/JPEG or institution export obtained | dCollection error artifact; no readable source bytes | `unresolved` | no raw-byte promotion |
| Yonsei `AN/volume ↔ 卷33` or item-page binding | no visible accession/volume/page bridge | `unresolved` | not promoted |
| Yonsei `卷33=71` | secondary thesis locator only | `unresolved / secondary only` | not promoted to this viewer or item |
| Yonsei/NLC same copy, printing run, or textual witness | no collation/lineage payload | `unresolved` | NLC remains separate |
| semantic authority | only visual heading/context, no adjudicated text lineage | `blocked` | false/not established |
| interpretation readiness | direct machine binding and semantic gates absent | `blocked` | false |
| production activation | readiness and authority gates absent | `blocked` | false |

The visual page observation does not authorize interpretation of `大運`, normalize characters beyond what is visibly read, or transfer any rule/example to a calculation or production path.

## 6. NLC and secondary-evidence boundary

The NLC witness remains a separate bounded primary witness:

```text
NLC KOL000000585 + supplied scan -> 卷33 / 大運 page context = NLC-only bounded primary witness
Yonsei record + viewer screenshot -> visual 卷33 / 大運 observation = Yonsei bounded visual successor
NLC page -> Yonsei item/page/locator = no transfer
Yonsei viewer `33/80` -> NLC `卷33=99` or any printed locator = no transfer
thesis `卷33=71` -> Yonsei viewer/item binding = no transfer
```

The shared `乙亥字` label is a bibliographic classification, not proof of identical physical copy, printing state, textual lineage, or page sequence. The previous Yonsei v1 thesis/catalog findings remain secondary corroboration and catalog evidence; they are not silently upgraded by the new viewer screenshot.

## 7. Reproducible artifact checks

The following commands recheck the supplied evidence without moving or editing the source files:

```sh
shasum -a 256 '/Users/softie/Downloads/SearchResult.html'
shasum -a 256 '/Users/softie/Desktop/스크린샷 2026-08-22 오후 7.06.02.png'
shasum -a 256 '/Users/softie/Desktop/스크린샷 2026-08-22 오후 7.22.25.png'
shasum -a 256 '/Users/softie/Desktop/스크린샷 2026-08-22 오후 7.22.40.png'
rg -n "000000200707|000000547475|원문/URL|00040146228|고서\(귀\) 8 0" \
  '/Users/softie/Downloads/SearchResult.html'
```

Expected supplied-artifact identities:

| artifact | bytes | SHA-256 |
| --- | ---: | --- |
| `SearchResult.html` | 18,713 | `39666c0181bf32e15c65e464cb2585e7196ee3ac36d0ff50acf5752a59049efd` |
| viewer screenshot (`33/80`) | 2,104,396 | `b9a1e0a29661e1a00c7526bf226b12d6730dfdb0a02d2543c4dea512218eab69` |
| official record screenshot | 463,179 | `81cff17b7e44829031597afaef9ffc0ea7ce3a6fac31c566c8ed48cd18fe09a1` |
| `원문/URL` button crop | 9,361 | `f6a46598ec24e17cea6597fc458f0d08e821a5b2f79e917cc8459cb979e0f382` |

These hashes identify the user-provided local evidence artifacts. They do not become hashes of Yonsei raw page bytes, and none is a cryptographic machine binding between the viewer image and `CATTOT000000200707`.

## 8. Minimum next payload for stronger promotion

To move beyond this bounded visual successor, the minimum required payload is:

```text
institution-confirmed item/session relation for the viewer image
visible accession/call/control bridge or institution-supplied export metadata
raw PDF/TIFF/JPEG/page bytes or an official downloadable image endpoint
printed 卷/葉/folio/page locator on the target image or an institution crosswalk
permission/provenance and file hash for the supplied reproduction
only then: literal collation against NLC p.102-103, with edition lineage separate
```

Until that payload exists, retain `exact machine binding`, `raw bytes`, `printed locator`, `cross-edition lineage`, `semantic authority`, `interpretation readiness`, and `production activation` as unresolved or blocked. Do not use the screenshot's visible `卷第三十三 / 大運` to fill any missing metadata field.

## 9. Scope preservation

This successor intentionally did not:

- modify the existing Yonsei v1, Wonkwang, NLC, K3-437, or Luna audit documents;
- move, rewrite, OCR-replace, or copy `/Users/softie/Downloads/200000227809_20260820233122.pdf`, `/Users/softie/Downloads/KOL000000585.pdf`, or any large original into the repository;
- install or bypass the dCollection viewer, guess required parameters, or access a restricted page;
- infer a server-side click log, live session identity, or institution-provided raw export from the screenshots;
- edit unrelated tracked or untracked dirty work;
- change application code, dependencies, remote services, deployment, or production state.

This file is a bounded successor only. The direct visual observation is admitted at the page-content level; full copy-level provenance, raw bytes, exact machine binding, printed locator, semantic authority, interpretation readiness, and production activation remain blocked.
