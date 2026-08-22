# 연세대학교 《五行精紀》 copy/page provenance frontier v1

상태: `official catalog records bounded`, `Yonsei 卷33 page-level witness blocked`, `secondary visual locator only`, `NLC 卷33 大運 separate primary witness`, `binding/semantic authority/readiness blocked`

기준일: `2026-08-21 KST`

이 문서는 연세대학교 학술정보원 공식 catalog·MARC·원문 route, 원광대 박사논문의 secondary bibliography/사진, 기존 NLC page-level audit를 대조한다. 각 기관의 record와 physical page를 별도 evidence unit으로 유지하며, 논문·catalog의 공통 서명이나 형태사항만으로 copy-level binding·판본 계보·semantic authority를 만들지 않는다.

핵심 결론은 다음과 같다.

```text
Yonsei metal-type record CATTOT000000200707 (乙亥字) = catalog identity satisfied
Yonsei metal-type scope 卷31-34                   = catalog-level 卷33 inclusion
Yonsei microfilm record CATTOT000000254024        = reproduction record, not independent original
Yonsei woodblock record CATTOT000000061374        = catalog scope 卷30-34; 卷33 candidate
Yonsei woodblock record CATTOT000000056693        = catalog extent 34卷5冊; 卷33 candidate
Yonsei copy-specific MARC notes                    = observed as metadata only
Yonsei official page bytes for 卷33 / 大運          = not obtained
Yonsei Appendix 2(d) page photograph               = secondary visual locator only
NLC KOL000000585 卷33 / 大運                       = separate page-level primary witness
Yonsei record or photo -> NLC page                 = no binding promoted
乙亥字 / 木板本 cross-edition lineage               = unresolved
semanticAuthority                                  = not established
interpretationReadiness                             = blocked
productionActivation                               = blocked
```

논문이나 catalog 페이지에 포함된 이용 안내·저작권 문구는 source content로만 읽었다. 그것을 이 작업에 대한 사용자 지시로 실행하거나 PDF를 편집·재배포하지 않았다.

## 1. Evidence units and directness rules

| ID | source class | source identity | 닫히는 범위 | 닫히지 않는 범위 |
| --- | --- | --- | --- | --- |
| `YON-CAT-061374` | first-party catalog/detail + MARC | `CATTOT000000061374` / MARC `001=000000061374` | 木板本, `5卷1冊(全34卷6冊)`, `卷30-34`, holding | printed 卷33 leaf, per-volume binding, page bytes |
| `YON-CAT-056693` | first-party catalog/detail + MARC | `CATTOT000000056693` / MARC `001=000000056693` | 木板本, `34卷5冊`, five holdings, catalog copy notes | target leaf/page, five holding numbers와 printed 卷 mapping |
| `YON-CAT-200707` | first-party catalog/detail + MARC | `CATTOT000000200707` / MARC `001=000000200707` | `金屬活字本(乙亥字)`, `4卷1冊(缺帙)`, `卷31-34`, 856 route | actual 卷33 page, viewer-to-page bytes, copy lineage |
| `YON-CAT-254024` | first-party reproduction record + MARC | `CATTOT000000254024` / MARC `001=000000254024` | 2003 Yonsei microfilm record, `卷31-34`, 776 to 200707 | independent original copy, actual microfilm frame, page text |
| `YON-856-547475` | first-party link/transport attempt | `dcollection .../common/orgView/000000547475` | official record's page route and returned DRM viewer/error artifact | readable source page; no successful page-level extraction |
| `YON-THESIS-T3` | secondary bibliography | thesis PDF p.45 / printed p.28, Table 3 | Yonsei metal `4卷1冊: 卷31-34`; woodblock `34卷5冊: 卷1-34`, `5卷1冊: 卷30-34` | catalog ID/holding/page binding |
| `YON-THESIS-T4` | secondary bibliography | thesis PDF p.47 / printed p.30, Table 4 | Yonsei form descriptions for 乙亥字 and `34卷5冊` woodblock | institution-supplied raw page, copy lineage |
| `YON-THESIS-APP2D` | author-captioned secondary image | thesis PDF p.187 / printed p.170, Appendix 2(d) | a page photograph captioned `연세대도서관` under `목판 인쇄본` | record ID, accession, volume/folio, raw-image provenance |
| `NLC-SUCC-V1` | separate primary witness audit | [NLC bounded successor](./saju-nlc-wuxingjingji-page-witness-successor-v1.md) | NLC record and actual scan context `卷33 / 大運` | Yonsei copy binding or cross-edition transfer |

`YON-THESIS-T3`, `YON-THESIS-T4`, and `YON-THESIS-APP2D` are dependent observations from one thesis PDF. Their agreement is secondary corroboration, not multiple independent physical witnesses. `YON-CAT-254024` is cataloged as a microfilm reproduction linked back to `YON-CAT-200707`; it is not counted as an independent original copy.

## 2. Official Yonsei catalog frontier

### 2.1 Record `CATTOT000000061374`: woodblock, 卷30-34

Official detail: [Yonsei CATTOT000000061374](https://library.yonsei.ac.kr/search/detail/CATTOT000000061374). Official MARC endpoint: [MARC 000000061374](https://library.yonsei.ac.kr/search/media/ajax/marc/CAT000000061374).

| field | observed value | adjudication |
| --- | --- | --- |
| title/author | `五行精紀 / 廖中(宋) 著` | catalog identity only |
| edition | `木板本` | first-party catalog classification; no leaf inspection |
| extent | `5卷1冊(全34卷6冊)` | catalog-level extent |
| holding scope | `卷30-34` | catalog-level inclusion of 卷33; no page locator |
| form | `四周雙邊`, 半郭 `21.1 x 14.8 cm`, `11行20字 註雙行`, 上下內向3葉花紋魚尾, `30.0 x 18.5 cm` | catalog physical-description metadata |
| notes | `口訣略號懸吐가 墨書됨`; `上欄外에 小字註가 墨書됨`; 表題 `繡命訣五行精記`; `內向混葉花紋魚尾 混入` | copy-description metadata; no target page |
| MARC 590 | `褙接: 卷30의 1-2張` | copy-specific catalog note, literal only; binding history not independently interpreted |
| holding | accession `00041001671`; call no. `고서(III) 3212 0` | registration-to-catalog-record edge |
| location/status | `[신촌]국학자료실/중앙도서관5층/고문헌(신청 후 이용)` | access-location metadata; no access permission obtained |

This record is the strongest official woodblock lead for a target in `卷30-34`. It closes `record scope includes 卷33` only. It does not close `the item’s physical 卷33 leaf`, `V label to printed 卷`, or `卷33=71`.

### 2.2 Record `CATTOT000000056693`: woodblock, 34卷5冊

Official detail: [Yonsei CATTOT000000056693](https://library.yonsei.ac.kr/search/detail/CATTOT000000056693). Official MARC endpoint: [MARC 000000056693](https://library.yonsei.ac.kr/search/media/ajax/marc/CAT000000056693).

| field | observed value | adjudication |
| --- | --- | --- |
| title/author | `五行精紀 / 廖中(宋) 撰` | catalog identity only |
| edition | `木板本` | first-party catalog classification |
| extent | `34卷5冊` | catalog describes a complete 34-volume, 5-book set; no per-book printed-卷 crosswalk |
| form | `四周雙邊`, 半郭 `21.2 x 15.0 cm`, `11行20字`, 內向花紋魚尾, `27 cm` | catalog physical-description metadata |
| notes | 表題 `五行精紀錄`; 序 `慶元丙辰(1196)...周必大書`, `紹定戊子(1228)...岳珂序` | catalog notes; not production date or textual authority |
| MARC 590 | `印: 義齋, 平湖` | copy-specific seal note, literal only; owner/lineage not inferred |
| holdings | `00040309646`–`00040309650`; calls `고서(II) 133.33 13 -1`–`-5` | five catalog holdings; no holding-to-printed-卷 binding |
| location/status | all shown at `[신촌]국학자료실/중앙도서관5층/고문헌(신청 후 이용)` and `대출불가(별치)` in result/detail route | access/location metadata only |

The `34卷5冊` extent makes 卷33 a catalog-level inclusion candidate. It does not identify which of the five accession/call-number rows contains printed 卷33, nor does it provide a page image. The seals and form data distinguish this catalog record from the other woodblock candidate but do not establish a shared printing lineage with NLC or with the Yonsei 乙亥字 record.

### 2.3 Record `CATTOT000000200707`: 乙亥字, 卷31-34

Official detail: [Yonsei CATTOT000000200707](https://library.yonsei.ac.kr/search/detail/CATTOT000000200707). Official MARC endpoint: [MARC 000000200707](https://library.yonsei.ac.kr/search/media/ajax/marc/CAT000000200707).

| field | observed value | adjudication |
| --- | --- | --- |
| title/author | `五行精紀 / 廖中(宋) 撰` | catalog identity only |
| edition | `金屬活字本(乙亥字)` | official catalog edition/type field |
| extent | `4卷1冊(缺帙)`; `全34卷 中의 零本임` | catalog-level partial copy identity |
| holding scope | `卷31-34` | catalog-level inclusion of 卷33 |
| form | `四周單邊`, 半郭 `22.0 x 15.0 cm`, `9行17字 註雙行`, 上下大黑口, 上下內向黑魚尾, `30 cm` | catalog physical-description metadata |
| holding | accession `00040146228`; call no. `고서(귀) 8 0`; `고문헌(신청 후 이용)` | registration-to-record edge |
| MARC 776 | links to `000000254024` | reproduction relation, not page-level evidence |
| MARC 856 | `https://dcollection.yonsei.ac.kr/common/orgView/000000547475` | official original/viewer route |
| MARC 980 | `卷31-34` | catalog scope; no leaf/page locator |

This record is sufficient to say that the cataloged partial 乙亥字 item is described as containing 卷31–34, including 卷33 at catalog level. It is not sufficient to say that a particular scanned page is 卷33 or that its `大運` passage was observed.

### 2.4 Record `CATTOT000000254024`: microfilm reproduction

Official detail: [Yonsei CATTOT000000254024](https://library.yonsei.ac.kr/search/detail/CATTOT000000254024). Official MARC endpoint: [MARC 000000254024](https://library.yonsei.ac.kr/search/media/ajax/marc/CAT000000254024).

The record repeats the 乙亥字 description and `卷31-34` scope, but MARC `533` explicitly describes:

```text
마이크로필름. 서울 : 연세대학교 학술정보원, 2003.
마이크로필름릴 1개 ; 35mm
```

It has `776` back to `000000200707`, with holdings `00031053018` (`MF(고서귀) 8 0 부본`) and `00031046025` (`MF(고서귀) 8 0`). This is a first-party reproduction record and a useful access lead, not an independent physical original or a second copy-level witness. No microfilm frame containing 卷33 was obtained in this pass.

## 3. Official route to actual Yonsei pages

### 3.1 Woodblock records

The retrieved detail HTML for `CATTOT000000061374` and `CATTOT000000056693` contains no `바로가기/원문`, `856`, IIIF, PDF, TIFF, or page-image endpoint. The cover slot remains a hidden `noCoverImg.jpg` placeholder. This is a bounded negative result about the public catalog route, not a claim that Yonsei holds no scan anywhere.

The catalog therefore closes:

```text
YON-CAT-061374 -> catalog scope 卷30-34       = satisfied
YON-CAT-056693 -> catalog extent 34卷5冊      = satisfied
either woodblock record -> actual 卷33 leaf   = not observed
either woodblock record -> locator 71          = unresolved
```

### 3.2 乙亥字 record and dCollection route

The `856` URL from `CATTOT000000200707` redirected to the dCollection DRM page:

```text
https://dcollection.yonsei.ac.kr/common/orgView/000000547475
 -> http://dcollection.yonsei.ac.kr/ezpdfdrm/dCollection.jsp?sItemId=000000547475
```

The page exposed an `ezpdfEncDownload.ez` route, but the read-only request returned a one-page PDF whose rendered page states:

```text
== SERVER ERROR ==
[Error Message] 전송에 필요한 필수파라미터가 전달되지 않았습니다.
```

It is an error artifact, not a book page. The route therefore establishes an official viewer handoff, not successful page-level access. No proprietary viewer installation, login, parameter guessing, or bypass of the DRM flow was attempted.

The Yonsei library host also failed normal local TLS certificate validation during the first request (`curl: (60) SSL certificate problem: unable to get local issuer certificate`). The official-host HTML was subsequently retrieved with `curl -k` for read-only inspection. This transport caveat is retained: the body hashes below identify retrieved responses, but they are not institution-signed raw-page artifacts.

## 4. Secondary thesis evidence and visual locator

### 4.1 Thesis identity

| field | value |
| --- | --- |
| local input | `/Users/softie/Downloads/200000227809_20260820233122.pdf` |
| SHA-256 | `e9e19e037dfd13d2e6d90fcb985421c414dc6c602a5f140c5cdc26ab8783f540` |
| bytes/pages | `2672212 / 190 pages` |
| work | `『五行精紀』의 命理理論 研究` |
| author/institution | `황금옥 / 원광대학교 대학원 한국문화학과` |

The PDF was rendered from the existing local input for page-level reading. It remains secondary evidence; the thesis did not supply a first-party Yonsei item identifier, raw scan provenance, or a permitted institution export for the photographed leaves.

### 4.2 Table 3: institutional extent

Thesis PDF p.45 (printed p.28), `〈표3〉『五行精紀』所藏機關`, gives the following Yonsei rows:

```text
연세대학교 학술정보원 | 金屬活字本(乙亥字) | 4卷1冊 : 卷31-34
연세대학교 학술정보원 | 木板本              | 34卷5冊 : 卷1-34 | 表題: 五行精紀錄
연세대학교 학술정보원 | 木板本              | 5卷1冊 : 卷30-34 | 表題: 繡命訣五行精記
```

This is secondary corroboration of the official catalog distinctions. It does not name `CATTOT000000200707`, `CATTOT000000056693`, `CATTOT000000061374`, accession numbers, or a physical volume/page containing 卷33.

### 4.3 Table 4: form description

Thesis PDF p.47 (printed p.30), `〈표4〉『五行精紀』板本의 形態書誌學的 特性`, describes:

```text
乙亥字 4卷1冊(缺帙): 四周單邊, 半郭 22.0 x 15.0 cm,
有界, 9行17字 註雙行, 上下大黑口, 上下內向黑魚尾, 30 cm

木板本 34卷5冊: 四周雙邊, 半郭 21.2 x 15.0 cm,
有界, 11行20字, 內向花紋魚尾, 27 cm
```

These values match the respective Yonsei catalog records and are useful as a secondary consistency check. The match does not supply a page-level chain or prove that the Yonsei and NLC records are the same printing/copy.

### 4.4 Appendix 2(d): page photograph captioned Yonsei

Thesis PDF p.187 (printed p.170), Appendix 2 `목판 인쇄본`, image `(d)` is captioned `연세대도서관`. It is visibly a photograph of a printed page and is a valuable acquisition/locator lead. It lacks:

- a Yonsei catalog control number;
- accession/call-number label in the page image;
- printed 卷/葉/folio or page locator;
- source image file, capture date, scan provenance, or institution-supplied checksum.

Accordingly:

```text
captioned image is a Yonsei woodblock-page secondary observation = admitted as locator lead
captioned image is CATTOT000000061374 or CATTOT000000056693 = unresolved
captioned image is 卷33 / 大運 / locator 71                  = unresolved
captioned image supplies a primary Yonsei page witness          = not promoted
```

The thesis also includes a Yonsei-captioned cover/source image in its later appendix, but that image is not a target page and is not used to infer volume binding.

## 5. NLC `卷33 「大運」` comparison boundary

The existing [NLC bounded successor](./saju-nlc-wuxingjingji-page-witness-successor-v1.md) records a separate institutional chain:

```text
NLC official control             KOL000000585
catalog scope                    卷30-33
official contents locator        卷33=99, 大運=99
supplied scan bytes              152 pages, SHA-256 ec32fa58149a7ae3616a3110cb27edfcad45a797a6a91eeb621ab692e5be3170
direct page observation          PDF p.102-103 boundary: 卷第三十三 and 大運 context
```

The safe cross-witness statement is therefore:

```text
NLC record + actual scan -> 卷33 / 大運 page context = bounded primary witness
Yonsei 乙亥 record       -> catalog scope 卷31-34   = catalog inclusion only
Yonsei woodblock records -> catalog scope/extent     = catalog inclusion candidates
NLC page                  -> Yonsei item/page        = no transfer
```

Both the NLC and Yonsei 乙亥 records use the `乙亥字` label, but that shared catalog classification is not a proof that the physical copies are the same edition state, printing run, textual witness, or derivative. The Yonsei woodblock records are separately classified as `木板本`; without a Yonsei target page, no literal variant collation or cross-edition lineage claim can be made.

The thesis candidate `卷33=71` is not transferred to NLC. In the NLC witness, the official `卷33=99` locator reconciles to the supplied PDF's `p.102-103` boundary, while PDF p.74 is `卷32`. This difference is witness-specific and does not adjudicate the unresolved Yonsei locator.

## 6. Claim ledger and gate status

| claim | evidence | status | promotion boundary |
| --- | --- | --- | --- |
| Yonsei has a cataloged 乙亥字 record | `YON-CAT-200707` | first-party catalog satisfied | record identity only |
| Yonsei 乙亥 record includes 卷33 at catalog scope | `卷31-34`, MARC `980` | catalog inclusion satisfied | not actual page/leaf |
| Yonsei has a woodblock `卷30-34` candidate | `YON-CAT-061374` | first-party catalog satisfied | no printed 卷33 leaf |
| Yonsei has a woodblock `34卷5冊` candidate | `YON-CAT-056693` | first-party catalog satisfied | no per-volume/page binding |
| `褙接: 卷30의 1-2張` is a catalog copy note | MARC 590 of `061374` | metadata observed | no independent physical verification |
| `印: 義齋, 平湖` is a catalog copy note | MARC 590 of `056693` | metadata observed | seal provenance/lineage unresolved |
| Yonsei microfilm is linked to 乙亥 record | `254024` MARC 533/776 | reproduction relation satisfied | not independent original/page witness |
| official Yonsei 乙亥 route reaches a page | `856` -> DRM error artifact | blocked | no page bytes obtained |
| thesis Table 3 corroborates three Yonsei forms | `YON-THESIS-T3` | secondary corroboration | no catalog-ID/page binding |
| thesis Table 4 corroborates form data | `YON-THESIS-T4` | secondary corroboration | no copy-level promotion |
| thesis Appendix 2(d) is a Yonsei-captioned page photo | `YON-THESIS-APP2D` | secondary visual locator | no raw-image/page provenance |
| Yonsei `AN/volume -> 卷33` binding | no direct item/page bridge | unresolved | not promoted |
| Yonsei `卷33 -> 大運` page observation | no Yonsei target page | unresolved | not promoted |
| Yonsei `卷33=71` | thesis generic locator only | unresolved | not promoted |
| NLC `卷33 / 大運` | `NLC-SUCC-V1` actual scan | bounded primary witness | remains NLC-only |
| Yonsei/NLC same textual witness or printing lineage | no colophon/page collation | unresolved | not promoted |
| semantic authority | no adjudicated Yonsei target passage/lineage | blocked | false/not established |
| interpretation readiness | direct Yonsei page and authority gates absent | blocked | false |
| production activation | readiness and authority gates absent | blocked | false |

## 7. Reproducible artifact manifest

### 7.1 Official Yonsei responses

The following hashes are response-body identities retrieved from the official host on `2026-08-21 KST` using read-only requests. Dynamic HTML and JSON response hashes are catalog retrieval anchors, not page-image hashes.

| response | bytes | SHA-256 |
| --- | ---: | --- |
| search result for `五行精紀` | 382916 | `fac0348324166101ac299813727dd13154aeb5f6054ff28d70c31e18cbcfd110` |
| detail `CATTOT000000061374` | 331117 | `35e23d7f95463ae27a4a0d51e73c27ecbdf56e702c585953d517918397bfcaf7` |
| detail `CATTOT000000056693` | 337845 | `24a5a3c37db8d9f1601da6a2cc9cf9c5b7df3ae110ece67aa2eb118700b3f392` |
| detail `CATTOT000000200707` | 331226 | `2954b142029839254f6beae7cbe877cd2f2c4cc727b966d0c322ababf278b017` |
| detail `CATTOT000000254024` | 332869 | `593a3dbb7059bbdc10dc48e5a954e11ae261807a3c964e478bdbecafc0a6a2fa` |
| MARC `000000061374` | 1982 | `eb600e8163760cde9c2e12b321db9628a8c8dccca2dfbc3fede6ba48b4209314` |
| MARC `000000056693` | 1992 | `4764b37230bb49a8a03dcc0e57e0bd20f969e324c0281fe6e05716fc5d956e8f` |
| MARC `000000200707` | 1950 | `562793ba0f98814db75cd2c275dbc4111a46efd8c6f7a4d8d465c26527d7b1c6` |
| MARC `000000254024` | 2108 | `68456515f1276fa5dd3810ab8692b683260346c5abdd3e8f2d21f3c779d1d2ac` |
| dCollection follow HTML | 11106 | `d96c6c27b9e1cf83ab1e5efa8de9e79692beb3b8d212fdfd5fd2c40d7d9ddb20` |
| dCollection error PDF | 9550 | `541073368e9b59b6c2aeb0e5b2d72be35625c2e3e19af7f7e6f4265fb9fcefcd` |

The error PDF is deliberately listed as a failed page-access artifact. It must not be cited as an image of `卷33`.

### 7.2 Reproduction commands

The stable detail/MARC routes can be rechecked without copying any source PDF into the repository:

```sh
curl -k -sS 'https://library.yonsei.ac.kr/search/detail/CATTOT000000200707' \
  -o /private/tmp/yonsei-CATTOT000000200707.html
curl -k -sS 'https://library.yonsei.ac.kr/search/media/ajax/marc/CAT000000200707' \
  -o /private/tmp/yonsei-marc-000000200707.json
shasum -a 256 /private/tmp/yonsei-CATTOT000000200707.html
shasum -a 256 /private/tmp/yonsei-marc-000000200707.json
```

The first request may require the catalog's transient verification-cookie refresh. `-k` is recorded because normal certificate validation failed in this environment; it is not a provenance upgrade.

The thesis input was not copied or modified:

```sh
pdfinfo '/Users/softie/Downloads/200000227809_20260820233122.pdf'
shasum -a 256 '/Users/softie/Downloads/200000227809_20260820233122.pdf'
pdftoppm -png -r 170 -f 45 -l 47 \
  '/Users/softie/Downloads/200000227809_20260820233122.pdf' \
  /private/tmp/yonsei-thesis-table
pdftoppm -png -r 150 -f 187 -l 187 \
  '/Users/softie/Downloads/200000227809_20260820233122.pdf' \
  /private/tmp/yonsei-thesis-appendix
```

NLC's existing PDF likewise remains outside the repository and is cited only through its existing bounded audit. No Yonsei or NLC source PDF was added to this repository.

## 8. Blockers and minimum next promotion payload

Current blockers are:

1. Yonsei's public record supplies catalog scope but not an institution-verified `卷第三十三` leaf or `大運` passage for any of the three physical/reproduction routes.
2. `CATTOT000000061374` and `CATTOT000000056693` have no public page endpoint in the retrieved catalog; the 乙亥 `856` route stops at a DRM parameter error.
3. The thesis page photograph is not linked to a catalog control number, accession, volume, folio, raw image, or institutional export.
4. `卷33=71` remains a secondary locator candidate. Its unit (page, leaf, or other numbering) and binding to either Yonsei woodblock item are unresolved.
5. Shared `乙亥字` labels and similar form descriptions do not establish NLC↔Yonsei copy identity, printing-run identity, or textual lineage.

Minimum payload for a future promotion:

```text
institution-confirmed Yonsei item identity and requested volume/accession
visible call-number/registration/cover bridge where permitted
actual Yonsei page image or raw bytes containing 卷第三十三 and 大運
surrounding pages sufficient to classify the page/leaf locator
institutional reproduction provenance, access permission, and file hash
only then: literal collation against NLC p.102-103, with lineage kept separate
```

Until that payload exists, do not promote `Yonsei item ↔ 卷33`, `Yonsei 卷33 ↔ 71`, `Yonsei 卷33 ↔ 大運`, cross-edition textual authority, semantic authority, interpretation readiness, or production activation.

## 9. Scope preservation

This audit intentionally did not:

- modify the existing Wonkwang, NLC, K3-437, or Luna audit documents;
- move, rewrite, or copy `/Users/softie/Downloads/200000227809_20260820233122.pdf` or `/Users/softie/Downloads/KOL000000585.pdf` into the repository;
- install the proprietary dCollection viewer or attempt DRM bypass;
- contact Yonsei, request access, or infer permission from catalog status;
- edit unrelated tracked/untracked dirty work;
- change code, dependencies, remote services, staging, commit, push, deployment, or production state.

This file records a bounded frontier only. Direct Yonsei original-page evidence, cross-edition binding, semantic authority, interpretation readiness, and production activation remain blocked.
