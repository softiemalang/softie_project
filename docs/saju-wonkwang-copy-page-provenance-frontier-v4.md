# 원광대학교 《五行精紀》 provenance frontier v4

상태: `bounded catalog + secondary bibliography`, `copy-level 卷33 unresolved`, `secondary locator only`, `semantic authority/readiness/activation blocked`

기준일: `2026-08-21 KST`

이 문서는 원광대학교 중앙도서관 공식 catalog, 원광대 박사논문의 secondary bibliographic/visual evidence, 기존 audit 문서를 하나의 bounded frontier로 대조한다. 기존 [기관 접근 audit v1](./saju-wonkwang-institution-access-audit-v1.md), [공식 접근 경계 audit v2](./saju-wonkwang-copy-page-provenance-audit-v2.md), [논문 secondary evidence audit v3](./saju-wonkwang-copy-page-provenance-audit-v3.md)를 덮어쓰지 않는다.

핵심 결론은 다음과 같다.

```text
official catalog record 353259                     = satisfied
catalog holdings AN008540-AN008545 / V.1-V.6     = satisfied
catalog field 乙亥字本 / 34卷6冊                   = satisfied as catalog metadata
thesis Wonkwang row 乙亥字 / 34卷6冊 / 卷1-34     = secondary corroboration
thesis form description / metal-type claim         = secondary corroboration
generic six-book table with 卷33=71                = secondary locator candidate
AN008545 -> catalog V.6                             = satisfied as holding label
AN008545/V.6 -> printed 卷33                        = unresolved
AN008545/V.6 -> printed locator 71                  = unresolved
thesis appendix image -> AN008545/V.6              = unresolved
Wonkwang 卷33 actual page or institution-supplied copy = not observed
copy-level claim promotion                          = 0
semanticAuthority                                  = not_established
availableForInterpretation                         = false
interpretationReadiness                            = blocked
productionActivation                               = blocked
```

`乙亥字本`, `34卷6冊`, `6책`, `卷33=71`은 서로 다른 evidence axes다. 앞의 두 항목은 catalog/논문이 각각 말하는 bibliographic identity이고, 뒤의 두 항목은 논문이 제시한 구조·locator다. 어느 항목도 `AN008545(V.6)의 실제 卷33 원면`을 대신하지 않는다.

## 1. Evidence unit과 직접성 규칙

| ID | source class | source identity | 이 문서에서 닫는 범위 | 닫지 않는 범위 |
| --- | --- | --- | --- | --- |
| `WKO-CAT-353259` | first-party catalog | 원광대 record `353259`, MARC `001=WONKWANG00353259` | 기관 catalog record, title/extent/판사항/holdings | physical leaf/page, copy condition, target-page bytes |
| `WKO-HOLD-AN0085` | first-party catalog holding | `AN008540`-`AN008545`, `188.5 ㄹ842 V.1`-`V.6` | 등록번호와 catalog volume label의 연결 | catalog V 번호와 printed 卷 번호의 mapping |
| `WKO-ACCESS-20260821` | first-party access policy | 원광대 공식 대출·층별 안내 | 고서 관내 이용, 고문헌자료실 6층 locator | 이 item의 열람 허가, 촬영/복사 허가, reproduction |
| `WKO-THESIS-ID` | secondary academic source | `200000227809_20260820233122.pdf`, UCI `I804:45008-200000227809` | 논문 source identity와 provenance | 논문이 인용한 copy를 first-party page witness로 바꾸는 것 |
| `WKO-THESIS-T3` | secondary bibliography | 논문 PDF pp.45-46, 표 3, printed pp.28-29 | 원광대 `乙亥字`, `34卷6冊`, `卷1-34` 주장 | AN 번호, V.6 binding, actual 卷33 page |
| `WKO-THESIS-T4` | secondary bibliography | 논문 PDF p.47, 표 4, printed p.30 | 원광대 형태사항과 `금속활자` 표기 | physical page를 직접 제공하거나 기관 raw image가 되는 것 |
| `WKO-THESIS-T6` | secondary structure/locator | 논문 PDF p.56, 표 6, printed p.39 | 일반 6책 구성과 `卷33=71` 후보 | 이 표의 6책을 원광대 V.6/AN008545로 binding |
| `WKO-THESIS-T7` | secondary qualification | 논문 PDF p.57, printed p.40 | 표 7이 대만 무릉출판사 목차를 기준으로 한다는 범위 | 원광대 copy locator authority |
| `WKO-THESIS-APP` | author-captioned secondary image | 논문 PDF p.186, printed p.169, 부록 1(c)(d) | 원광대 caption 사진과 사진 속 일부 시각 관찰 | AN008545/V.6 또는 卷33 page identity |
| `WKO-AUDIT-V1/V2/V3` | existing audit | repository의 원광대 v1-v3 | prior first-party boundary와 unresolved state의 ancestry | 새 직접 원면 또는 semantic authority |
| `NLC-SUCC-V1` | separate primary witness audit | [NLC bounded successor](./saju-nlc-wuxingjingji-page-witness-successor-v1.md) | NLC `KOL000000585`의 별도 page-level evidence | NLC page를 원광대 AN008545에 전이 |

논문 앞부분의 CC license/이용 문구는 첨부 문서의 source content로만 취급했다. 그것을 이 작업에 대한 사용자 지시로 실행하지 않았고, PDF를 편집·재배포하지 않았다.

`WKO-THESIS-T3`, `WKO-THESIS-T4`, `WKO-THESIS-T6`, `WKO-THESIS-T7`, `WKO-THESIS-APP`은 모두 같은 논문/PDF에서 나온 dependent observations다. 표·사진이 서로 맞는다는 이유로 서로 독립적인 physical witnesses로 count하지 않는다. 기존 v1-v3도 이 문서의 provenance judgment를 설명하는 audit lineage이지 추가적인 원광대 copy witness가 아니다.

## 2. 공식 catalog evidence

### 2.1 Record identity

현재 read-only로 재확인한 [원광대 공식 상세 record 353259](https://elibrary.wku.ac.kr/Search/Detail/353259?key=%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80&campuscode=00)는 다음을 표시한다.

| catalog field | 관찰값 | adjudication |
| --- | --- | --- |
| 자료유형 | `고서` | first-party catalog classification |
| 서명/저자 | `五行精紀 / 廖中(宋) 著` | catalog attribution; textual authority로 확장하지 않음 |
| 판사항 | `乙亥字本` | catalog-level edition/type field; 원면 관찰 아님 |
| 발행사항 | `[刊行地不明] : [刊行處不明], [刊行年不明]` | catalog상 date/place/publisher unresolved |
| 형태사항 | `34卷6冊`; `四周雙邊`; 半郭 `19.9 x 15.3 cm`; 半葉 `11行20字`; 註雙行; 上下3葉花紋魚尾; `31 x 20 cm`; 線裝; 楮紙 | catalog physical-description metadata; 卷33 page evidence 아님 |
| MARC 001 | `WONKWANG00353259` | stable record anchor for this retrieval |
| MARC 005 | `20061215162658` | catalog update stamp; copy 제작연도나 edition date 아님 |
| 주기 | `序:慶元丙辰(1196)周必大/紹定戊子(1228)岳珂` | catalog note; current copy의 제작·전승 연대 아님 |
| 사용제한주기 | `寄贈:金日坤` | catalog provenance lead; textual lineage 아님 |

이 record는 `乙亥字本`과 `34卷6冊`을 공식 catalog field로 닫는다. 그러나 그 field 자체를 `원광대 물리 copy의 원면에서 직접 관찰한 판본·권책 증거`로 재분류하지 않는다.

### 2.2 Holdings와 AN008545

공식 상세 record의 소장정보와 [AN008540 검색](https://elibrary.wku.ac.kr/search?q=AN008540), [AN008545 검색](https://elibrary.wku.ac.kr/search?q=AN008545)을 대조하면 다음 edge는 닫힌다.

| 등록번호 | catalog 청구기호 | 소장처 | 판정 |
| --- | --- | --- | --- |
| `AN008540` | `188.5 ㄹ842 V.1` | 중앙도서관6층 고문헌자료실 | catalog holding observed |
| `AN008541` | `188.5 ㄹ842 V.2` | 중앙도서관6층 고문헌자료실 | catalog holding observed |
| `AN008542` | `188.5 ㄹ842 V.3` | 중앙도서관6층 고문헌자료실 | catalog holding observed |
| `AN008543` | `188.5 ㄹ842 V.4` | 중앙도서관6층 고문헌자료실 | catalog holding observed |
| `AN008544` | `188.5 ㄹ842 V.5` | 중앙도서관6층 고문헌자료실 | catalog holding observed |
| `AN008545` | `188.5 ㄹ842 V.6` | 중앙도서관6층 고문헌자료실 | catalog holding observed |

따라서 `AN008545 -> record 353259`와 `AN008545 -> catalog label V.6`은 `satisfied`다. 이것은 `V.6 -> printed 卷33` 또는 `V.6 -> printed page/leaf 71`을 의미하지 않는다. catalog에는 각 V의 첫·끝 printed 卷, 葉次, target passage, scan bytes가 없다.

### 2.3 Catalog preview와 접근 경계

공식 상세 HTML은 cover에 `OObookdefaultsmall.png` placeholder와 ISBN 없는 Aladin viewer link를 표시하고, preview pane에는 target page image/PDF/IIIF endpoint를 제공하지 않는다. [ContentView route](https://elibrary.wku.ac.kr/Search/ContentView/?id=353259)를 read-only로 조회했지만 `五行精紀` target page bytes를 얻지 못했다.

[대출 및 반납 안내](https://elibrary.wku.ac.kr/Common?html=%2FUsers%2FWonkwang%2FDocs%2FuserGuide03.cshtml)는 고서를 관외 대출 금지 자료로 분류하고 관내 열람 및 관내 Scanner/복사기 이용을 안내한다. [층별실별 안내](https://elibrary.wku.ac.kr/Common?html=%2FUsers%2FWonkwang%2FDocs%2FuserGuide04.cshtml)는 고문헌자료실을 6층으로 두고 자료를 그 실내에서만 이용할 수 있다고 한다.

상세 record의 OPAC 상태 `대출가능`과 일반 안내의 고서 `관외 대출 금지`는 item-specific access 해석에서 충돌한다. 따라서 `대출가능`을 외부 대출·현재 열람 허가·복사 허가로 읽지 않고 `access_policy_conflict`로 보존한다. 이 pass에서는 로그인, 방문 신청, 기관 연락, 복사 주문을 하지 않았다.

## 3. 학술논문 evidence

### 3.1 논문 identity

첨부 PDF의 확인 가능한 입력은 다음과 같다.

| field | value |
| --- | --- |
| local input | `/Users/softie/Downloads/200000227809_20260820233122.pdf` |
| SHA-256 | `e9e19e037dfd13d2e6d90fcb985421c414dc6c602a5f140c5cdc26ab8783f540` |
| pages / size | `190 pages / 2,672,212 bytes` |
| UCI | `I804:45008-200000227809` |
| title page | `『五行精紀』의 命理理論 研究` / `A Study on the Ming-li Theory in 『Wu Xing Jing Ji』` |
| author / institution | `황금옥 / 원광대학교 대학원 한국문화학과` |
| title-page year marker | `2018학년도` |

PDF를 page image로 렌더링해 표 3, 표 4, 표 6, 표 7, 부록 1을 직접 확인했다. 이 확인은 논문 내용의 secondary observation이며, 논문 저자가 말하는 원광대 소장본을 기관이 제공한 raw page로 바꾸지 않는다.

### 3.2 원광대 bibliographic claim: 표 3

논문 PDF pp.45-46(논문 인쇄 pp.28-29)의 `〈표3〉『五行精紀』所藏機關`에서 `원광대 도서관` 행은 다음을 제시한다.

```text
판본: 乙亥字
소장본: 34卷6冊 : 卷1-34
```

이 표는 원광대 공식 catalog의 `乙亥字本`, `34卷6冊`과 방향이 맞고, catalog가 제공하지 않는 `卷1-34`라는 secondary extent claim을 추가한다. 그러나 표 3에는 `353259`, `AN008545`, `188.5 ㄹ842 V.6`, barcode, raw scan identifier가 없다. 따라서 이 표는 `secondary bibliographic corroboration`이지 `AN008545 -> 卷33`의 copy-level edge가 아니다.

### 3.3 형태사항과 금속활자 표기: 표 4

논문 PDF p.47(논문 인쇄 p.30)의 `〈표4〉『五行精紀』板本의 形態書誌學的 特性`에서 `원광대학교 도서관` 행은 다음을 제시한다.

```text
34卷6冊; 四周雙邊; 半郭 19.9 x 15.3 cm; 有界;
半葉 11行20字; 註雙行; 上下3葉花紋魚尾;
31 x 20 cm; 線裝; 楮紙; 비고: 금속활자
```

수치·형식은 공식 catalog의 형태사항과 대체로 일치하고, `금속활자`는 catalog의 `乙亥字本`을 secondary layer에서 보강한다. 하지만 논문 표 자체는 기관의 원면 file identity나 촬영 provenance를 제공하지 않으며, 이 일치만으로 physical copy inspection을 닫지 않는다.

### 3.4 6책 구성과 `卷33=71`: 표 6

논문 PDF p.56(논문 인쇄 p.39)의 `〈표6〉『五行精紀』의 책별 권수`에서 6책 `數` 항목은 다음과 같다.

```text
卷第三十  1
卷第三十一  27
卷第三十二  51
卷第三十三  71
卷第三十四  105
```

이 표는 `6책 체계 안에서 卷33의 숫자 71이 제시된다`는 secondary structure/locator evidence다. 그러나 `V.6` 또는 `AN008545`라는 catalog identifier가 표 6에 나타나지 않는다. 표 6의 숫자 `71`이 printed page인지 葉次인지도 표만으로 확정하지 않는다.

### 3.5 locator의 source qualification: 표 7

논문 PDF p.57(논문 인쇄 p.40)의 본문은 卷33-34가 大運·小運·太歲·歲運을 다룬다고 설명한 뒤, 다음 목차 표가 `대만의 무릉출판사에서 출간된 책의 목차를 기준`으로 한다고 명시한다. 이 문장은 표 6·7의 generic structure를 원광대 physical copy에 자동 귀속하지 못하게 하는 source-boundary다.

따라서 `卷33=71`은 다음과 같이만 기록한다.

```text
6책 generic structure -> 卷33 locator 71       = secondary locator candidate
generic 6책            -> 원광대 catalog V.6    = unresolved
원광대 catalog V.6      -> printed 卷33          = unresolved
원광대 catalog V.6      -> printed 71            = unresolved
```

### 3.6 부록 사진

논문 PDF p.186(논문 인쇄 p.169)의 `〈부록 1〉금속활자 인쇄본`에서 (c)와 (d)는 `원광대학교`로 caption되어 있다.

- (c)는 `五行精紀` 표지로 보이는 표면과 청구기호 계열 label, 별도 소장/정리 label을 보여 준다.
- (d)는 원면과 장서인을 보여 주며, 우측 표제부는 시각상 `五行精紀 卷第六`으로 읽힌다. `卷第三十三` 또는 `71`은 보이지 않는다.
- 사진에는 `AN008545`, `V.6`, barcode 또는 catalog record `353259`가 함께 보이지 않는다. 작은 label은 `AN008545`로 검증 가능한 registration binding을 제공하지 않는다.

이 사진은 단순 prose보다 강한 `author-captioned-secondary-image`지만, raw image file, 촬영일, item-level chain, page crosswalk, 기관 제공 provenance가 없다. 따라서 `원광대 소장품을 논문 저자가 촬영했다고 주장한 사진`으로만 기록하고, `AN008545/V.6`, `卷33`, `71`, direct page witness로 승격하지 않는다.

## 4. 기존 audit와의 reconciliation

| 기존 문서 | 기존 결론 | 이번 v4에서의 사용 |
| --- | --- | --- |
| [v1 기관·item·접근 audit](./saju-wonkwang-institution-access-audit-v1.md) | first-party record `353259`, six holdings, official copy route를 닫았으나 target page와 volume-to-juan mapping은 unresolved | catalog identity와 access boundary의 선행 basis로 유지 |
| [v2 공식 접근 경계 audit](./saju-wonkwang-copy-page-provenance-audit-v2.md) | 6층 고문헌자료실, 관내 이용, `대출가능`/정책 충돌, 공개 scan 부재를 좁힘 | current retrieval로 field-level 재확인; blocker 유지 |
| [v3 논문 secondary audit](./saju-wonkwang-copy-page-provenance-audit-v3.md) | 논문 표 3/4/6과 부록을 secondary locator/image로 기록; `AN008545 -> 卷33`, `卷33=71`을 unresolved | 표 3의 실제 `원광대 도서관 / 乙亥字 / 34卷6冊 : 卷1-34`와 표 4/6/7의 층위를 명시적으로 재정리 |
| [NLC page-level successor](./saju-nlc-wuxingjingji-page-witness-successor-v1.md) | NLC `KOL000000585`의 기관 record와 실제 scan에서 卷33을 bounded promotion; NLC locator는 `卷33=99` | NLC의 direct page evidence를 원광대 `AN008545/V.6`에 전이하지 않는 negative boundary |
| [Luna v4 parent adjudication](./saju-luna-deep-collation-adjudication-v4.md) | 원광대는 item/page first-party evidence가 없어 metadata candidate였고 semantic corroboration에서 제외 | current catalog + thesis corroboration이 추가되어도 actual copy-level bridge가 없으면 semantic state 불변 |

`NLC-SUCC-V1`의 `卷33=99`와 논문 원광대 후보 `卷33=71`은 서로 다른 witness locator다. 어느 숫자도 다른 기관의 copy에 전이하지 않는다.

## 5. Claim ledger: 승격과 비승격

| claim | evidence | status | copy-level promotion |
| --- | --- | --- | --- |
| 원광대에 `五行精紀` catalog record가 있다 | `WKO-CAT-353259` | first-party catalog observed | 가능: catalog identity에 한정 |
| record는 `乙亥字本`, `34卷6冊`을 표시한다 | `WKO-CAT-353259` | first-party catalog metadata | 불가: physical copy page/edition authority로는 승격하지 않음 |
| `AN008540`-`AN008545`는 `V.1`-`V.6` holdings다 | `WKO-HOLD-AN0085` | first-party catalog holding observed | 가능: registration-to-catalog-label edge에 한정 |
| `AN008545 -> V.6` | `WKO-HOLD-AN0085` | satisfied | 가능: catalog label only |
| `V.6 -> printed 卷33` | catalog에 mapping 없음 | unresolved | 불가 |
| 논문은 원광대를 `乙亥字 / 34卷6冊 / 卷1-34`로 기술한다 | `WKO-THESIS-T3` | secondary bibliographic corroboration | 불가: AN/V/page binding 없음 |
| 논문은 원광대 형태사항과 금속활자를 기술한다 | `WKO-THESIS-T4` | secondary corroboration | 불가: direct page observation 아님 |
| 6책 구성표에서 `卷33=71`이 제시된다 | `WKO-THESIS-T6` | secondary locator candidate | 불가: generic table, page/leaf semantics unresolved |
| 논문 부록 사진은 원광대 caption이다 | `WKO-THESIS-APP` | author-captioned secondary image | 불가: raw/registration/page chain 없음 |
| 부록 (d)가 `卷33` 원면이다 | 사진 시각 관찰 | unsupported / rejected | 불가; `卷第六`로 보이며 target binding 없음 |
| `AN008545 ↔ 卷33` | 결합된 direct evidence 없음 | unresolved | 불가 |
| `AN008545 ↔ 卷33=71` | 결합된 direct evidence 없음 | unresolved | 불가 |
| 원광대 `卷33` 독립 primary witness | 기관 item + target page 모두 없음 | blocked | 불가 |
| semantic authority / interpretation readiness | target passage와 surrounding page의 direct witness 없음 | blocked | 불가 |
| production activation | semantic/lineage/authority gate 미충족 | blocked | 불가 |

## 6. Reproducible artifact manifest

### 6.1 Local academic PDF

다음 hash는 원본 대용량 PDF를 repository에 복사하지 않고 실제 local input bytes에서 계산한 것이다.

```text
path   = /Users/softie/Downloads/200000227809_20260820233122.pdf
sha256 = e9e19e037dfd13d2e6d90fcb985421c414dc6c602a5f140c5cdc26ab8783f540
bytes  = 2672212
pages  = 190
```

재현 명령:

```sh
pdfinfo '/Users/softie/Downloads/200000227809_20260820233122.pdf'
shasum -a 256 '/Users/softie/Downloads/200000227809_20260820233122.pdf'
pdftoppm -png -r 140 -f 45 -l 47 '/Users/softie/Downloads/200000227809_20260820233122.pdf' /private/tmp/wonkwang-thesis-table3
pdftoppm -png -r 140 -f 56 -l 58 '/Users/softie/Downloads/200000227809_20260820233122.pdf' /private/tmp/wonkwang-thesis-table6
pdftoppm -png -r 140 -f 186 -l 186 '/Users/softie/Downloads/200000227809_20260820233122.pdf' /private/tmp/wonkwang-thesis-appendix
```

직접 확인 locator는 PDF pp.45-47, 56-58, 186이며, 논문 인쇄 locator는 각각 pp.28-30, 39-41, 169다. 렌더링 PNG는 임시 evidence이고 repository artifact로 승격하지 않는다.

### 6.2 Official catalog retrieval anchors

2026-08-21 KST에 `curl -L -sS`로 받은 response body의 hash와 byte count다. 동적 HTML 응답의 retrieval identity이지 원광대 卷33 page bytes의 hash가 아니다.

| URL / response | SHA-256 | bytes |
| --- | --- | ---: |
| detail `353259` | `d957bd27b4f54dae186766131c7dfde85485083771c5532268dfd4d63110e84a` | 149066 |
| search `q=AN008540` | `e6e41e917a3f8e689e116d56faaebcab50b276990d74c0e8358618a3811ec728` | 113975 |
| search `q=AN008545` | `acaee8ef1cd60e68549a90501099bb9d2dfa11a4fa963349d09ef9d16cb0c74b` | 113975 |
| guide `userGuide03` 대출·반납 | `2477f03959f2cb974ce5407e88744ac480ada7fa3755022829ccfa28750795c0` | 79628 |
| guide `userGuide04` 층별실별안내 | `57e53d4663e69b2c20c7a7dd2e36e630ac42de80ebf91b47e87265da77cede62` | 84011 |
| `Search/ContentView/?id=353259` | `f5d93770445d6b4fcab1ad08b47a73aa7df16243775e10dd5710476ecdb0c9a2` | 70751 |

재현 예시는 다음과 같다.

```sh
curl -L -sS 'https://elibrary.wku.ac.kr/Search/Detail/353259?key=%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80&campuscode=00' -o /private/tmp/wonkwang-detail-353259.html
shasum -a 256 /private/tmp/wonkwang-detail-353259.html
wc -c < /private/tmp/wonkwang-detail-353259.html
```

### 6.3 Artifact interpretation

- catalog response hash는 catalog field와 holding row의 retrieval anchor다.
- thesis PDF hash는 secondary table/photo의 입력 identity다.
- 어느 hash도 `AN008545`가 들어 있는 실제 책의 `卷33` page/leaf bytes를 나타내지 않는다.
- 원광대 original scan/복사물의 hash가 없으므로, page-level direct witness artifact는 아직 생성되지 않았다.

## 7. Blocker와 다음 승격 payload

현재 실제 provenance blocker는 다음 네 가지다.

1. `AN008545` 또는 기관이 item identity를 확인한 `V.6`의 표지·청구기호·등록번호가 보이는 원면이 없다.
2. 그 item에서 printed `卷第三十三` 표제와 target passage, 앞뒤 원면을 직접 확인할 수 없다.
3. `71`이 page number인지 葉次인지, 표 6의 generic table과 원광대 physical copy가 같은 구조인지 확인할 수 없다.
4. 기관 제공 reproduction의 provenance/허가 조건/파일 identity가 없다.

다음 승격에 필요한 최소 payload는 다음이다.

```text
institution-confirmed item identity: 353259 + AN008545/V.6
visible cover/call-number/registration evidence
printed 卷33 heading and target passage page(s)
surrounding pages sufficient to classify 71 as page/leaf locator
institutional reproduction provenance and permitted citation conditions
raw file bytes + SHA-256, or institution-verified page images
```

그 payload가 확보되기 전에는 `AN008545 ↔ 卷33`, `AN008545 ↔ 卷33=71`, `원광대 독립 semantic witness`를 승격하지 않는다. 논문 표 6의 숫자 일치, 부록 사진의 caption, OCR, 기존 NLC/K3 page와의 textual match도 이 blocker를 우회하지 않는다.

## 8. Scope and final gate

이번 문서에서 추가·재확인한 것은 다음뿐이다.

- 원광대 공식 catalog `353259` 및 `AN008540`-`AN008545`/`V.1`-`V.6` holding identity.
- 공식 access-policy와 catalog preview에서 실제 卷33 page가 공개되지 않는 경계.
- 원광대 박사논문의 표 3/4/6/7 및 부록 사진에 대한 secondary classification.
- 기존 v1-v3 및 NLC successor와의 non-transfer boundary.

의도적으로 하지 않은 것:

- 원광대 로그인·방문·복사 신청·기관 연락.
- 원광대 원면 촬영, scan download, 원문복사 주문.
- 원본 대용량 PDF의 이동·수정·재출력·repository 복사.
- 기존 dirty tracked/untracked work의 수정·정리.
- semantic interpretation rule, readiness state, production route, remote DB, staging, commit, push, deploy 변경.

따라서 현재 frontier는 `catalog-level first-party + secondary locator-only`에서 멈춘다. 실제 원면 또는 기관 확인이 없는 동안 `semanticAuthority`, `interpretationReadiness`, `productionActivation`은 계속 `blocked`다.
