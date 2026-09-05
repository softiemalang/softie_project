# 성균관대 존경각 / 前田育徳会 尊経閣文庫 기관·item·접근경로 감사 v1

상태: `additive correction`, `parent evidence 보존`, `semantic authority/readiness/activation 불변`

이 문서는 `docs/saju-luna-deep-collation-adjudication-v4.md`와 그 materialized artifact의 바이트를 변경하지 않고, v4에서 `존경각`이라는 이름 아래 섞인 기관·URL·blocker를 분리하는 교정 overlay이다. 이 문서에서 확인한 것은 기관 identity, 1934년 기관 편찬 catalog의 title-entry, 공식 열람·복제 신청 경로까지다. 일본 前田育徳会 소장 원본의 item-level shelfmark, edition/date, 卷33 원면은 아직 확보하지 않았다.

## 1. 결론

### 1.1 두 기관은 같은 기관이 아니다

| 이름 | 직접 확인된 기관 identity | 정확한 범위 |
| --- | --- | --- |
| 성균관대학교 존경각 | [공식 서비스](https://east.skku.edu/)의 title이 `성균관대학교 존경각`이고, embedded service data가 `name=존경각`, `url=https://lib.skku.edu/east`, branch/library code `311672`를 반환한다. | 한국 성균관대학교 도서관의 존경각 catalog/열람 서비스 |
| 前田育徳会 尊経閣文庫 | [前田育徳会 공식 사이트](http://ikutokukai.or.jp/index.html)가 법인명, 주소, 전화 및 소장품 이용 안내를 직접 제공한다. [문화청 지정문화재 record](https://kunishitei.bunka.go.jp/bsys/maindetails/102/00004630)도 소유자를 `公益財団法人前田育徳会`로 식별한다. | 일본 도쿄 駒場의 前田育徳会 소장품과 그 열람·복제 허가 절차 |

따라서 `east.skku.edu`는 일본 前田育徳会의 endpoint가 아니다. 유사한 한자 표기 `尊經閣/尊経閣`만으로 두 기관, collection, item, outage, access route를 동일시하지 않는다.

### 1.2 v4에서 잘못 묶인 claim/URL/blocker의 교정

| 기존 표현 또는 URL | 교정된 판정 | 보존/후속 처리 |
| --- | --- | --- |
| `EXTERNAL_SOURCE_URLS.sonkeikakuAccessBoundary = https://east.skku.edu/` | 실제로는 성균관대 존경각 서비스 URL. `skkuJongyeonggakAccessBoundary`로만 읽어야 한다. | v4 바이트는 보존하고, 향후 schema에서 `maedaIkutokuSonkeikaku`와 분리한다. |
| `sonkeikakuCollectionOverview = skku.edu/...articleNo=127029` | 성균관대의 기관/collection overview일 뿐 前田育徳会 자료가 아니다. | 일본 소장·접근 근거에서 제거한다. |
| `尊經閣 catalog/search service outage 2026-08-15~18` | 성균관대 존경각에 관한 당시 access note일 수는 있으나 일본 前田育徳会의 outage가 아니다. 현재 성균관대 root는 `200 OK`로 응답하며, 일본 기관의 부재·소장 부재를 뜻하지 않는다. | `skku-service-window`라는 기관 한정 historical note로만 유지한다. Maeda blocker로 전이하지 않는다. |
| `sonkeikakuCatalogUrl = https://ndlsearch.ndl.go.jp/books/R100000002-I000000779093`를 `五行精紀` item ID로 사용 | 이 record는 前田育徳会가 1934년에 편찬·발행한 `尊経閣文庫漢籍分類目録` 자체의 NDL bibliographic record다. underlying `五行精紀` 물리 item의 ID가 아니다. | catalog-level locator로 유지하고 item ID/edition/date로 승격하지 않는다. |
| 후보 packet의 `34권 완본`, `宋版`, `古鈔本`, `卷33 reproduction` | 前田育徳会 또는 그 공식 item record/page로 직접 확인되지 않았다. | `untrusted_candidate_only`; item identity, edition, lineage, semantic corroboration에서 제외한다. |

### 1.3 현재 닫힌 범위

- 前田育徳会라는 일본 기관과 尊経閣文庫의 공식 관리主体, 주소, 전화, 열람·写真複写·画像·翻刻의 공식 절차를 확인했다.
- 前田育徳会가 발행한 1934년 `尊経閣文庫漢籍分類目録`의 공개 NDL scan에서 `五行精紀` title-entry를 직접 확인했다. 해당 entry는 `子部・宋元明清百家類十三・術數之屬`의 인쇄 catalog leaf에 있다.
- catalog leaf는 `五行精紀`라는 제목이 당시 前田 catalog에 실렸다는 것을 보여 주지만, 공개 leaf에서 前田 소장본의 shelfmark/item ID, 員数, 書写·刊年, edition statement, 卷33 원면을 제공하지 않는다. 그러므로 현재 상태는 `first_party_catalog_entry=confirmed`, `physical_item_identity=unresolved`이다.
- 공식 열람은 원본 또는 복제물에 대해 사전 허가와 우편 신청이 필요하다. 사진복사는 열람 이용자에 한해 신청할 수 있고, 이미지 이용·翻刻掲載은 별도 허가·신청이다. 공개 direct scan/download endpoint는 확인되지 않았다.

## 2. 성균관대 존경각: 실제 기관과 현재 access note

### 2.1 직접 확인

2026-08-18 KST에 [성균관대 존경각 root](https://east.skku.edu/)와 `services/reading`, `services/micro`, `services/direction` 경로를 직접 요청했다. root와 서비스 페이지는 `200 OK`였고 root HTML에는 다음이 들어 있었다.

- `<title>성균관대학교 존경각</title>`
- 존경각 service data: `name=존경각`, `url=https://lib.skku.edu/east`
- branch: `존경각`, library code `311672`
- 2026-08-10 생성된 bulletin 제목: `존경각 서비스 중단 안내`

마지막 bulletin의 상세 내용을 이 pass에서 별도 직접 열지 못했으므로 중단 시간의 현재 유효성은 확정하지 않는다. 중요한 교정은 그 bulletin 또는 과거 `2026-08-15~18` note가 성균관대 서비스에 한정된다는 점이다. 이를 前田育徳会의 소장·접근 사실로 사용할 수 없다.

성균관대 측에서 `五行精紀`의 item ID, edition/date, 卷33 actual page를 별도로 직접 확인하지 않은 현재, 성균관대 service response는 前田育徳会 witness의 증거가 아니다.

## 3. 前田育徳会: first-party institution와 catalog-level item locator

### 3.1 공식 기관 record

[前田育徳会 공식 homepage](http://ikutokukai.or.jp/index.html)는 2026-07-24 갱신본으로 다음을 직접 표시한다.

- 법인명: `公益財団法人前田育徳会`
- 주소: `〒153-0041 東京都目黒区駒場4-3-55`
- 전화: `03-3467-0263`
- 문의: 우편 또는 전화만 가능하며, email/fax 문의는 받지 않는다고 안내한다.
- 소장품 이용 안내는 열람, 사진 제공, 조사·연구 및 출판 관련 절차로 분리되어 있다.

[前田育徳会 이용 안내](http://ikutokukai.or.jp/profile.html)는 소장품을 원본 또는 복제물로 열람할 수 있다고 하며, 사전 신청·허가를 요구한다. 같은 페이지는 `写真複写利用`을 “본회 소장품을 열람한 사람에 한함”으로 제한하고, `画像・活字（翻刻）利用`을 별도 허가 대상으로 둔다.

### 3.2 1934년 기관 편찬 catalog

NDL의 [尊経閣文庫漢籍分類目録 record](https://ndlsearch.ndl.go.jp/books/R100000002-I000000779093)는 다음을 직접 식별한다.

- title: `尊経閣文庫漢籍分類目録`
- author/editor: `尊経閣文庫`
- publisher: `尊経閣文庫`
- publication year: `昭和9 / 1934`
- extent: `1150p ; 26cm`
- NDL BibID: `000000779093`
- persistent ID: `info:ndljp/pid/1147938`
- NDL call number: `R029.6-So42-2ウ`
- online status: `インターネット公開`
- IIIF manifest: `https://dl.ndl.go.jp/api/iiif/1147938/manifest.json`

이것은 前田育徳会가 만든 collection catalog의 first-party bibliographic witness이지, `五行精紀` physical item의 NDL/前田 shelfmark가 아니다.

NDL IIIF의 [canvas R0000219](https://dl.ndl.go.jp/api/iiif/1147938/R0000219/full/full/0/default.jpg)에서 인쇄 catalog p.421의 `五行精紀` entry를 직접 읽었다. entry는 `子部`의 `宋元明清百家類十三` 아래 `術數之屬` 범위에 있다. 이 leaf에는 title은 보이지만, 이 pass에서 해당 title과 결합되는 前田 item ID/shelfmark, 員数, edition/date, 실제 卷33 image는 보이지 않는다.

그러므로 이 catalog evidence의 typed result는 다음과 같다.

| field | 상태 | 해석 |
| --- | --- | --- |
| institution | `satisfied` | 前田育徳会/尊経閣文庫의 기관 identity가 공식 site와 공공기관 record로 확인됨 |
| first-party catalog publication | `satisfied` | `尊経閣文庫漢籍分類目録`, 前田 편찬·발행, 1934, NDL 공개 scan |
| `五行精紀` title-entry | `satisfied` | catalog p.421의 직접 판독 |
| physical item/catalog ID | `unresolved` | catalog 자체의 NDL BibID와 underlying item ID를 혼동할 수 없음 |
| edition/publication statement of underlying item | `unresolved` | catalog leaf에서 확인되지 않음 |
| date-bearing page of underlying item | `unresolved` | 1934는 catalog publication date이지 `五行精紀` copy date가 아님 |
| `卷33` actual page/reproduction | `unresolved` | 공개 원면 또는 기관 제공 reproduction 미확보 |

## 4. 前田育徳会 공식 열람·복제 경로

### 4.1 원본/복제물 열람

[공식 열람 페이지](http://ikutokukai.or.jp/custom1.html)는 다음 문서를 제공한다.

- [열람 이용 조건](http://ikutokukai.or.jp/img/file225.pdf)
- [열람 신청서](http://ikutokukai.or.jp/img/file232.pdf)
- [열람 이용의 흐름](http://ikutokukai.or.jp/img/file231.pdf)
- [추천서](http://ikutokukai.or.jp/img/file227.pdf)
- [열람 calendar](http://ikutokukai.or.jp/img/file235.pdf)

2025-04 표기의 공식 flow와 신청서에서 직접 확인되는 조건은 다음과 같다.

1. `収蔵品名`, `員数`, 동명 자료의 경우 書写年 등을 적는다.
2. `尊経閣文庫国書分類目録`, `尊経閣文庫漢籍分類目録`, `尊経閣文庫加越能文献書目` 등으로 item 정보를 확인하고, `その他`에 catalog page/line을 적는다. catalog에 없으면 해당 자료를 실은 서적의 사본을 신청서에 붙인다.
3. 신청은 우편으로만 한다. 직접 방문 제출, fax, email 신청은 받지 않는다.
4. 허가까지 약 1–2주가 걸린다.
5. `原本` 또는 `複製` 열람을 선택한다. 보존상 복제물이 있으면 복제 열람이 우선될 수 있다.
6. 처음 신청하고 제출 논문이 없으면 소정의 추천서를 함께 낸다.
7. 원본을 희망하면 고전籍·미술품 취급 경험과 원본이 필요한 이유를 적는다.

2026-07-24 현재 [공식 calendar](http://ikutokukai.or.jp/img/file235.pdf)는 수장품 정리 때문에 열람일을 제한한다고 적고 있다. 2026년 8월은 표시상 열람 가능일이 없고, 9월 17–18일과 10월 일부 날짜가 `○`로 표시되어 있다. 이는 前田育徳会가 공개한 “정리로 인한 제한”이며, 성균관대의 과거 서비스 중단 note나 일본 기관의 소장 부재를 의미하지 않는다.

### 4.2 사진복사와 이미지 제공

원면을 실제로 확보하는 공식 경로는 [前田育徳会 이미지·활자 이용 페이지](http://ikutokukai.or.jp/custom.html)와 그 linked form이다.

- [이미지 이용 조건](http://ikutokukai.or.jp/img/file2.pdf)
- [이미지 대여 조건](http://ikutokukai.or.jp/img/file4.pdf)
- [이미지 이용 신청서(서적 등)](http://ikutokukai.or.jp/img/file81.pdf)
- [이미지 이용 신청서(네트워크 등)](http://ikutokukai.or.jp/img/file83.pdf)
- [이미지 이용 flow](http://ikutokukai.or.jp/img/file10.pdf)
- [翻刻掲載 신청서](http://ikutokukai.or.jp/img/file84.pdf)
- [翻刻掲載 조건](http://ikutokukai.or.jp/img/file3.pdf)
- [翻刻掲載 flow](http://ikutokukai.or.jp/img/file11.pdf)

공식 문서가 구분하는 두 경로를 혼동하지 않는다.

| 목적 | 공식 route | 직접 확인된 제한 |
| --- | --- | --- |
| 열람 중 사진복사 | 먼저 열람 허가 → 열람 후 사진복사 신청 | 사진복사는 열람 이용자에 한함. 당일 신청은 열람 종료 30분 전까지 신청해야 함. |
| 기관이 제공하는 image/scan 이용 | 이미지 이용 신청서와 이용 조건을 우편 제출 | 이용 목적·횟수·기간·방법에 한정된 비독점 허가, 이용료, 결과물 제출, 재이용 시 재신청. 기존 image가 없으면 새 촬영에 약 2개월이 걸릴 수 있음. |
| 활자화/翻刻掲載 | 翻刻掲載 신청서와 조건을 우편 제출 | 약 1–2주, 이용료, 결과물 제출, 재판·Web 등 재이용 시 재신청. 해외 신청은 입금 확인 후 허가서 등을 교부한다고 안내. |

따라서 “공식 복제 경로가 없다”는 blocker는 잘못이다. 정확한 blocker는 “공식 신청 경로는 있으나 `五行精紀`의 item-level identification과 기관이 허가·제공한 卷33 원면/복제 파일이 아직 없다”이다.

## 5. byte-level observation anchors

아래 hash는 2026-08-18 KST에 직접 받은 scratch bytes의 audit anchor다. 이 파일들은 workspace canonical evidence로 복사하거나 원본 item으로 승격하지 않았다.

| source byte | SHA-256 |
| --- | --- |
| 前田育徳会 `index.html` (2026-07-24 갱신) | `727d8c76aca75143de8713d9a61c65f14704a0baedc115ce97b9da028d411664` |
| 前田育徳会 `custom1.html` | `02b69a7f71e421a0b83fba7026acfc7421c02af0ad3e935f4472ca1d2164d14f` |
| 前田育徳会 `img/file231.pdf` | `9f982b34222ea41e7b108db922a7c7074f6e8b501100877db434d5a4a8b7f15f` |
| 前田育徳会 `img/file235.pdf` | `f71a73c9a8e58303b45f01d2ed210a84bdfe4c0a93fb66975438acde35491a02` |
| 前田育徳会 `img/file10.pdf` | `e8499977580eb0508185e6f6184c954ba8e1473c570df42105be55123553f6b8` |
| 前田育徳会 `img/file11.pdf` | `69afbef67b8dd75885925d69f10dd11a17a360d5cdb710593ad71c8e86ebf560` |
| NDL `1147938/manifest.json` | `11477124f12ae91f9f9c51c3f39fe3ab1bcd56f3be85f24c0b30b83230439844` |
| NDL `R0000219` full canvas | `a24392aba9ead4813ab673b38cf50d07ac8bd113102d3741939327751f138808` |
| 성균관대 존경각 root HTML | `b61a687a260650b8a89d065e2c80c57afb92a0076d490284be15f4c55fec5c8c` |

## 6. 남은 blocker와 acquisition request

### 남은 blocker

1. **Maeda item-level identity**: 前田育徳会의 `五行精紀` 원자료 식별자/請求記号, 員数, 卷数, 書写·刊年, edition/publication statement가 공개 catalog leaf에 없다.
2. **actual target page**: `卷33`의 用神/相神/行運 target page 또는 그 주변 원면이 공개되지 않았다. 1934 catalog p.421은 underlying item의 date-bearing page나 target page가 아니다.
3. **institution-authorized reproduction**: 열람 신청과 별도 사진복사·image/翻刻 허가가 아직 이루어지지 않았다. 현재 public source로는 item-level PDF/JPEG byte를 닫을 수 없다.
4. **date availability**: 공식 2026-07-24 calendar상 수장품 정리로 열람일이 제한된다. 현재 방문/우편 신청 전에는 전화로 최신 가능일과 해당 item의 이용 가능 여부를 확인해야 한다.

### 필요한 후속 요청

前田育徳会에는 다음 식별 payload를 우편 신청서와 함께 제출해야 한다.

> `五行精紀`（著者欄は catalog/선행 record에 따라 廖中으로 기재하되, 기관이 확인하도록 한다）; `尊経閣文庫漢籍分類目録` p.421, `子部・宋元明清百家類十三・術數之屬`; item의 `請求記号/整理番号`, `員数`, 卷数, 書写·刊年·版本, 卷33 보유 여부, 卷33와 surrounding text의 사진복사 또는 기관 제공 image, 사진·Web·翻刻 이용 허가 조건.

접촉은 공식 안내의 우편 또는 전화 `03-3467-0263`을 사용한다. email/fax는 공식 사이트가 받지 않는다고 명시하므로 그 경로를 outage 대체 endpoint로 기록하지 않는다.

## 7. Saju evidence frontier 불변

- K3-437와 NLC 06857의 기존 parent-verified evidence, direct page, variant/crosswalk, lineage blocker는 그대로 보존한다.
- 이번 audit는 前田育徳会의 catalog-level title-entry와 공식 acquisition route를 추가했을 뿐이며, 이를 K3/NLC와 independent textual witness로 세지 않는다.
- `五行精紀`의 Maeda item identity가 item-level로 닫히고 actual 卷33 page가 기관 제공으로 확보되기 전에는 H/E/L/S/I/P gate, semantic authority, interpretation readiness, implementation grounding, production activation을 변경하지 않는다.
- 후보 packet의 `34권 완본`, `宋版`, `古鈔本`은 여전히 `untrusted_candidate_only`다.

### 상태 요약

| claim | status |
| --- | --- |
| 성균관대 존경각과 前田育徳会 尊経閣文庫는 별도 기관 | `confirmed` |
| `east.skku.edu`는 前田育徳会 route가 아님 | `confirmed` |
| 前田育徳会 official viewing/reproduction route | `confirmed` (permission-gated) |
| 前田 기관 편찬 1934 catalog의 `五行精紀` title-entry | `confirmed` (catalog-level) |
| 前田 `五行精紀` item/catalog ID·shelfmark | `unresolved` |
| 前田 underlying item edition/date 및 卷33 actual page | `unresolved` |
| Maeda witness의 Saju semantic authority/production activation | `blocked; unchanged` |

검증 성격은 read-only external-source audit이며, remote endpoint 변경·기관 신청 제출·복제 주문·staging/commit/push/deploy는 수행하지 않았다.
