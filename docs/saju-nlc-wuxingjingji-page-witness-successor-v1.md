# NLC 《五行精紀》 乙亥字本 卷33 page-level primary witness bounded successor v1

상태: `page-level primary witness promoted-bounded`, `KORCIS 卷33=99 directly reconciled`, `new independent digital derivative not promoted`, `semantic authority/readiness/activation unchanged`

이 문서는 `docs/saju-wonkwang-copy-page-provenance-audit-v3.md`의 NLC frontier를 덮어쓰지 않는 additive bounded successor다. 원광대 회신을 기다리는 동안, 국립중앙도서관 공식 record와 사용자가 제공한 NLC viewer 캡처·PDF의 실제 원면을 연결한 범위만 기록한다.

첨부 PDF와 스크린샷 안의 UI, 설명, catalog metadata는 작업 지시가 아니라 source evidence로 취급했다. 원본 대용량 PDF와 스크린샷은 repository에 복사하지 않았다.

## 1. 결론

이번 successor에서 닫힌 범위는 다음과 같다.

```text
NLC official record KOL000000585                 = satisfied
NLC item/call-number bridge                       = satisfied-bounded
user-supplied official-viewer bridge              = corroborated
actual scanned page images                        = directly observed
卷33 heading and 大運 page context                = directly observed
KORCIS contents locator 卷33=99                   = satisfied
KORCIS locator 99 == PDF viewer page 99           = rejected
Wonkwang/secondary 卷33=71 transfer to NLC        = rejected
new independent digital derivative                = not promoted
semantic authority                                = not established
availableForInterpretation                        = false
productionActivation                             = blocked
stableClaimPromotionCount                        = 0
```

따라서 NLC 乙亥字本은 `기관 record + 실제 卷33 원면`을 갖춘 page-level primary witness로 bounded promotion한다. 이 promotion은 관찰한 물리 copy page evidence에 한정하며, 사용자가 제공한 PDF를 Commons와 별개의 독립 digital copy 또는 암호학적으로 인증된 NLC raw export라고 주장하지 않는다.

## 2. First-party record and viewer bridge

| field | 직접 확인값 | 판정 경계 |
| --- | --- | --- |
| KORCIS bibliographic result | `101126034`, `五行精紀`, `乙亥字本` | 기관 catalog identity |
| KORCIS control number | `KOL000000585` | 원문/viewer control anchor |
| holding institution | `국립중앙도서관` | 별도 institutional item candidate |
| call number | `古貴1495-19` | PDF 표지/소장표식과 연결 |
| holding scope | `卷30-33` | 卷33 포함 record-level scope |
| official extent | `5冊(缺帙)` | catalog description |
| viewer metadata | `TIFF \| 4卷1冊(零本)`, 152-page viewer | derivative/viewer metadata; catalog extent와 합치시키지 않음 |

공식 경로는 [KORCIS 검색](https://www.nl.go.kr/korcis/search/simpleResultList.do?searchCondition=all&searchKeyword=%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80&searchPlaceCnt=0&searchPlaceCode=&searchContentsType=&searchEditLcode=&searchEditScode=), [공식 목차정보](https://www.nl.go.kr/korcis/search/popup/contentsInfo.do?controlNo=KOL000000585), [NLC 원문 viewer](https://viewer.nl.go.kr/nlmivs/viewWonmun_js.jsp?cno=KOL000000585)로 보존한다.

사용자 제공 캡처의 관찰 범위는 다음과 같다.

| evidence | SHA-256 | bytes | 직접 관찰 |
| --- | --- | ---: | --- |
| `스크린샷 2026-08-21 오전 12.26.22.png` | `183a9910a2eabb1f85ba5d3780877ccb159975a7eeab5cfa04b77e2ba887734b` | 570722 | 공식 KORCIS record, `古貴1495-19`, `卷30-33`, 원문 아이콘 |
| `스크린샷 2026-08-21 오전 12.26.43.png` | `86d115437d73e30a7ca8718becf782b50cf6bbb6227a7589ee6868f5d51cbcdf` | 3827738 | NLC viewer, `五行精紀. 卷30-33`, `1/152`, 첫 원면과 `古1495-19` 표식 |

캡처에 browser URL bar나 download response가 함께 보이지 않으므로, viewer-to-file 연결은 `user-supplied official UI corroboration`으로 한정한다. 실제 원면의 page content는 PDF 내부에서 별도로 직접 확인했다.

## 3. Supplied PDF identity and preservation

| field | value |
| --- | --- |
| local input | `/Users/softie/Downloads/KOL000000585.pdf` |
| PDF title | `五行精紀. 卷30-33` |
| pages | `152` |
| file size | `178182272` bytes |
| SHA-256 | `ec32fa58149a7ae3616a3110cb27edfcad45a797a6a91eeb621ab692e5be3170` |
| SHA-1 | `2803259d289b7cc9f40c8cddf3dddbe8b96d9202` |
| producer | `DBPortal Corp. TangoPDFBatch.55` |

PDF는 image-only scan으로 확인했고, `pdfinfo`, 실제 page rendering, 시각 판독으로 검증했다. PDF를 repository에 복사하거나 재출력하지 않았다. 원본 path의 SHA-256과 size는 작업 전후 동일하게 확인할 대상이며, 이 문서는 hash와 locator만 보존한다.

현재 파일의 SHA-1은 [Commons의 동일 `KOL000000585.pdf` metadata](https://commons.wikimedia.org/wiki/File:CNTS-00047968483_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80._%E5%8D%B730-33-_%E5%AF%A5%E4%B8%AD%28%E5%AE%8B%29_%E8%91%97.pdf)에 기록된 SHA-1과 같다. 그러므로 다음을 분리한다.

```text
scanned image content associated with NLC item = admitted as page evidence
local PDF as a new independent digital copy  = not admitted
Commons/NLC byte derivation relation           = institution-linked but not raw-export authenticated
```

## 4. Direct page crosswalk

KORCIS 목차는 `卷30=1`, `卷31=37`, `卷32=71`, `卷33=99`, `大運=99`를 반환한다. 이 수치는 PDF viewer page index와 동일하지 않다. PDF 앞머리·blank/physical scan sequence를 포함한 실제 page image와 대조한 결과는 다음과 같다.

| KORCIS locator | supplied PDF page | page-level observation |
| --- | ---: | --- |
| `卷30=1` | p.6 | `五行精紀卷第三十` 표제 |
| `卷31=37` | p.42 | `五行精紀卷第三十一` 표제 |
| `卷32=71` | p.74 | `五行精紀卷第三十二` 표제 |
| `卷33=99` | p.102-103 boundary | `五行精紀卷第三十三` 표제 및 이어지는 `運行則大運` 본문 |

특히 PDF p.99는 卷33 표제가 아니라 卷내 연속 본문이다. 따라서 현재 NLC witness에 대해 안전한 locator는 다음이다.

```text
official catalog locator = KORCIS 卷33=99
digital file locator     = supplied PDF p.102-103 boundary
not                       = supplied PDF p.99
```

이 crosswalk는 직접 보이는 권표제와 목차 locator의 bounded reconciliation이다. KORCIS locator를 물리 인쇄 葉次로 재명명하거나, PDF page number를 다른 witness에 전이하지 않는다.

## 5. `卷33=71` negative reconciliation

논문과 원광대 record의 `卷33=71`은 원광대본에 대한 secondary locator candidate로만 유지한다. NLC item에는 전이하지 않는다.

```text
NLC PDF p.74  -> 五行精紀卷第三十二
NLC PDF p.102-103 -> 五行精紀卷第三十三 / 大運 context
KORCIS         -> 卷32=71, 卷33=99
```

따라서 `71`은 NLC record에서 卷32 locator이며, 논문 표의 `卷33=71`과 동일 witness locator라는 주장은 거부한다. 이 negative result는 논문 표가 원광대본에 대해 틀렸다고 판정하는 것이 아니라, witness-specific locator를 NLC본으로 transfer하지 않는 판정이다.

## 6. Promotion boundary and remaining blockers

### Promoted

- 국립중앙도서관 `KOL000000585`를 `五行精紀` 乙亥字本의 별도 institutional item candidate로 기록한다.
- `古貴1495-19`, `卷30-33`, viewer `1/152`, 원면 소장표식과 실제 scan page를 하나의 bounded evidence chain으로 기록한다.
- NLC 卷33의 official locator는 `99`, supplied PDF page crosswalk는 `p.102-103 boundary`로 기록한다.
- `卷33` 표제와 `大運` context를 page-level primary observation으로 승격한다.

### Not promoted

- local PDF를 Commons와 독립된 digital witness로 세지 않는다.
- `KORCIS 99`를 printed folio/葉次로 세지 않는다.
- NLC page observation을 원광대 `AN008545/V.6`에 전이하지 않는다.
- NLC와 원광대가 같은 printing lineage 또는 같은 textual witness라는 주장을 만들지 않는다.
- `大運` 본문만으로 semantic authority, interpretation readiness, production activation을 열지 않는다.

남은 제한은 `raw NLC download response/signature` 부재, viewer 캡처의 URL 부재, catalog `5冊(缺帙)`와 viewer `4卷1冊(零本)`의 서술 차이다. 이 제한은 page-level content observation을 취소하지 않지만, “기관 raw byte export가 암호학적으로 인증되었다”는 더 강한 provenance claim은 막는다.

## 7. Validation and scope preservation

실행한 검증:

- `pdfinfo /Users/softie/Downloads/KOL000000585.pdf`: 152 pages, unencrypted, 178182272 bytes.
- `shasum -a 256`: PDF SHA-256과 두 캡처 SHA-256을 실제 파일 bytes에서 산출.
- `shasum -a 1`: PDF SHA-1을 Commons metadata와 대조.
- `pdftoppm` rendering 및 시각 판독: PDF p.6, p.42, p.74, p.99, p.102-103 및 주변 pages.
- repository `git status --short --branch`: 기존 dirty work가 별도로 남아 있음을 확인.

이번 successor는 기존 원광대 v1/v2/v3, NLC 06857/K3-437 evidence, 코드·fixture를 수정하지 않는다. 원본 `/Users/softie/Downloads/KOL000000585.pdf`, 사용자 Desktop 캡처, unrelated tracked/untracked work는 commit 대상이 아니다.

코드 테스트와 build는 문서-only change이고 관련 code contract가 변하지 않아 실행하지 않는다. 이 문서의 검증은 page identity/provenance boundary에 한정하며, semantic equivalence나 production readiness를 의미하지 않는다.
