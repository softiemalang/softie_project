# 원광대학교 중앙도서관 《五行精紀》 기관·item·접근경로 감사 v1

상태: `additive first-party catalog frontier`, `target-page provenance unresolved`, `semantic authority/readiness/activation 불변`

이 문서는 `docs/saju-luna-deep-collation-adjudication-v4.md`의 원광대 후보를 덮어쓰지 않고, 원광대학교 공식 홈페이지와 중앙도서관 공개 catalog에서 새로 확인한 record-level evidence를 별도 overlay로 기록한다. 공식 catalog record와 6개 holdings는 닫았지만, 실제 卷33 leaf/image, printed folio, edition chronology, textual lineage, semantic corroboration은 확보하지 않았다.

## 1. 결론

### 1.1 독립적으로 닫힌 범위

| 축 | 직접 확인된 결과 | 경계 |
| --- | --- | --- |
| 기관 | [원광대학교 공식 홈페이지](https://www.wku.ac.kr/)가 상단 `중앙도서관`을 `https://elibrary.wku.ac.kr`로 연결한다. | 대학 기관 identity와 catalog 서비스 identity만 닫는다. 특정 고문헌의 현존 원면을 뜻하지 않는다. |
| first-party catalog record | [중앙도서관 record 353259](https://elibrary.wku.ac.kr/Search/Detail/353259?key=%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80&campuscode=00)는 `五行精紀`의 공식 상세 record다. MARC `001`은 `WONKWANG00353259`이다. | catalog record는 physical copy의 page image나 판본 계보가 아니다. |
| title/author/extent | `五行精紀 / 廖中(宋) 著`, `乙亥字本`, `34卷6冊`, 고서, 서지상 발행지·발행처·발행년 미상으로 표시된다. | catalog field를 실제 원면 관찰 또는 semantic authority로 승격하지 않는다. |
| holdings | 등록번호 `AN008540`–`AN008545`, 청구기호 `188.5 ㄹ842 V.1`–`V.6`, 소장처 `중앙도서관6층 고문헌자료실` 6건이 표시된다. | OPAC holdings는 각 책의 卷33 원면·colophon·physical condition을 직접 보여 주지 않는다. |

따라서 이번 노드의 상태는 다음과 같다.

```text
first_party_institution              = satisfied
first_party_catalog_record           = satisfied
catalog_level_holdings               = satisfied
physical_item_page_inspection        = unresolved
printed_folio_and_vol_to_juan_map    = unresolved
edition_date_and_textual_lineage     = unresolved
卷33_actual_reproduction             = unresolved
semantic_corroboration               = unresolved
semanticAuthority                    = not_established
availableForInterpretation           = false
productionActivation                 = blocked
stableClaimPromotionCount            = 0
```

### 1.2 이전 후보와 분리

- [AKS 실록위키의 `오행정기` 항목](https://dh.aks.ac.kr/sillokwiki/index.php/%EC%98%A4%ED%96%89%EC%A0%95기%28五行精紀%29)은 원광대 소장과 `乙亥字本`을 서술하는 secondary metadata lead다. 이번 first-party catalog record와 일치하는 부분이 있어도, target page·physical colophon·독립 textual lineage를 대신하지 않는다.
- 기존 v4의 `wonkwangSearchBoundary = https://www.wku.ac.kr/`는 대학 홈페이지를 가리키는 historical locator로 보존한다. 이번 pass에서 exact catalog endpoint를 추가로 확인했지만 v4 artifact/code bytes는 수정하지 않는다.
- 원광대 record와 성균관대 존경각, 前田育徳会 尊経閣文庫, NLC 06857, Jangseogak K3-437를 동일 collection이나 동일 textual witness로 묶지 않는다.

## 2. 직접 관찰한 first-party record

### 2.1 공식 검색 결과

원광대 중앙도서관의 [소장자료 검색](https://elibrary.wku.ac.kr/search?q=%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80)에 `五行精紀`를 질의했다. 검색 결과는 `2`건으로, 학위논문 record와 별도의 고서 record `353259`를 반환했다. 고서 record가 학위논문 `789038`과 분리되어 있다는 점만 사용하며, 검색 결과의 count나 HTML presentation을 source authority로 사용하지 않는다.

### 2.2 record-level fields

공식 상세 HTML에서 직접 읽은 catalog/MARC 값은 다음과 같다.

| field | 관찰값 | provenance 해석 |
| --- | --- | --- |
| record ID | `353259` | 원광대 중앙도서관 catalog 내부 record identity |
| MARC 001 | `WONKWANG00353259` | record identity anchor |
| MARC 005 | `20061215162658` | catalog record의 내부 update stamp; copy 제작연도나 edition date가 아님 |
| 자료유형 | `고서` | catalog classification |
| 청구기호 | `188.5 ㄹ842` | catalog call-number family |
| 서명/저자 | `五行精紀 / 廖中(宋) 著` | catalog attribution; 저자·전승 authority로 확장하지 않음 |
| 판사항 | `乙亥字本` | catalog-level edition/type statement; 실제 활자·인쇄면을 대신하지 않음 |
| 발행사항 | `[刊行地不明] : [刊行處不明], [刊行年不明]` | underlying copy의 date/lineage가 명시적으로 unresolved |
| 형태사항 | `34卷6冊`; 四周雙邊; 半郭 `19.9 x 15.3 cm`; 半葉 `11行20字`; 註雙行; 上下3葉花紋魚尾; `31 x 20 cm`; 線裝; 楮紙 | physical-description metadata; 卷33 actual page/leaf observation 아님 |
| 주기사항 | `序:慶元丙辰(1196)周必大/紹定戊子(1228)岳珂` | 서문 연대 metadata; 현재 소장본의 간행·전사·현존성 연대가 아님 |
| 사용제한주기 | `寄贈:金日坤` | provenance lead; ownership chronology나 textual lineage가 아님 |
| keywords | `귀중본`, `기증본`, `김일곤` | catalog access/handling metadata |

### 2.3 holdings

상세 record의 소장정보 표에서 다음 6건을 직접 확인했다.

| 등록번호 | 청구기호 | 소장처 | OPAC 상태 |
| --- | --- | --- | --- |
| `AN008540` | `188.5 ㄹ842 V.1` | 중앙도서관6층 고문헌자료실 | `대출가능` |
| `AN008541` | `188.5 ㄹ842 V.2` | 중앙도서관6층 고문헌자료실 | `대출가능` |
| `AN008542` | `188.5 ㄹ842 V.3` | 중앙도서관6층 고문헌자료실 | `대출가능` |
| `AN008543` | `188.5 ㄹ842 V.4` | 중앙도서관6층 고문헌자료실 | `대출가능` |
| `AN008544` | `188.5 ㄹ842 V.5` | 중앙도서관6층 고문헌자료실 | `대출가능` |
| `AN008545` | `188.5 ㄹ842 V.6` | 중앙도서관6층 고문헌자료실 | `대출가능` |

`대출가능`은 OPAC이 반환한 상태값일 뿐이다. 고문헌 열람 허가, 외부 연구자의 접근권, 사진복사 허가, 각 V.번호와 printed 卷 번호의 one-to-one mapping을 의미한다고 추론하지 않는다.

## 3. 실제 target page 경계

- 상세 record의 `미리보기` tab에는 target page image나 PDF bytes가 노출되지 않았다.
- 표지 영역은 실제 scan이 아니라 default placeholder를 반환하며, Aladin viewer link도 ISBN 값 없이 구성되어 있다. 이를 digital derivation이나 page evidence로 세지 않는다.
- record의 `34卷6冊`은 catalog extent다. `V.1`–`V.6` 중 어느 파일/책에 printed `卷33`이 있는지, 卷33의 target passage와 surrounding leaf가 어디인지 직접 확인되지 않았다.
- `乙亥字本`은 catalog의 판사항이다. 실제 원면에서 활자 형태·版心·魚尾·葉次·序跋·藏印을 읽기 전에는 edition identity, 제작 시기, local PDF와의 textual lineage를 닫지 않는다.
- 그러므로 원광대 record는 K3-437/NLC 06857의 `五行精紀 卷33` page-level evidence에 semantic corroboration을 추가하지 않는다.

## 4. 공식 접근·복제 경로

원광대 중앙도서관은 [원문복사신청 안내](https://elibrary.wku.ac.kr/Common?html=%2FUsers%2FWonkwang%2FDocs%2Fcopy_guide.cshtml)와 `/MyDocument/Write` 신청 경로를 공식적으로 제공한다. 안내 API의 직접 관찰 결과는 다음과 같다.

- 원문복사 서비스는 도서관간 상호 문헌교환을 통해 자관에 없는 자료를 제공하는 서비스이며, 본교 재학생·교직원 대상이라고 명시한다.
- 단행본은 `50% 이내` 부분 복사 가능으로 안내한다.
- 비용·배송·전자전송 정책이 별도로 있고, 전자전송 결과는 저작권법 제31조에 따라 인쇄물로 제공된다고 안내한다.
- 안내된 처리 절차는 `원문복사 신청 → 담당자 확인 → 타관신청 발송 → 자료도착 → 자료인계`다.
- 문의 담당은 원문복사 `063-850-5470`, `bu5470@wku.ac.kr`로 표시된다.

이 경로는 기관에 실제 원면 또는 복제물을 요청할 수 있는 acquisition lead를 닫아 주지만, 원광대 `五行精紀` 卷33 reproduction이 이미 공개되었거나 허가되었다는 뜻은 아니다. 신청·로그인·기관 연락·복사 주문은 이 pass에서 수행하지 않았다.

## 5. byte-level observation anchors

아래 hash는 2026-08-20 KST에 `curl -L -sS`로 직접 받은 응답 body의 anchor다. 동적 HTML은 session/date에 따라 바뀔 수 있으므로, 이 hash는 해당 retrieval pass에 한정한다. 응답 body를 repository canonical evidence로 복사하지 않았다.

| source byte | SHA-256 | bytes |
| --- | --- | ---: |
| 원광대 공식 homepage `https://www.wku.ac.kr/` | `8275544d1d9a1bf3770081782b11a68ae9a41870ac4e753651e708e51f78464c` | 805407 |
| 중앙도서관 root `https://elibrary.wku.ac.kr/` | `2d6fb4a2440d7ef0901296b3b8e1f53c8784be6c05022644f9cbf2494defab24` | 170354 |
| search `q=五行精紀` | `2b46bdb73c31c78cdcf397ca912b5b196077c8367b367ef0960605afd09e731c` | 122199 |
| detail record `353259` | `d957bd27b4f54dae186766131c7dfde85485083771c5532268dfd4d63110e84a` | 149066 |
| `GetSpongeManagement` 원문복사 안내 response | `f34be4892aa01da3af291a58d516ec50c24fe0cacd5e45b7a41ac28f8aa718ae` | 7943 |

Hash는 catalog metadata와 access-route 응답의 identity anchor다. target page bytes의 hash가 아니며, source title·catalog field만으로 page content를 재구성하지 않는다.

## 6. blocker와 다음 checkable frontier

### 남은 blocker

1. **target-page access**: 원광대 소장본의 실제 `卷33` page image/PDF 또는 기관 제공 reproduction이 없다.
2. **volume-to-juan mapping**: `AN008540`–`AN008545`와 printed `卷1`–`卷34`의 mapping이 catalog record에 없다.
3. **edition chronology**: catalog가 발행지·발행처·발행년을 모두 미상으로 두며, `乙亥字本`만으로 제작 시기나 판본 계보를 닫을 수 없다.
4. **physical/lineage bridge**: local PDF, K3-437, NLC 06857과 원광대 catalog record 사이의 same-copy/digital-derivation/textual-lineage edge가 없다.
5. **semantic corroboration**: target passage와 surrounding context를 직접 읽지 못했으므로 `五行精紀`를 독립 semantic witness로 count하지 않는다.

### 다음 요청 payload

기관이 허가하는 경우에만 다음을 별도 요청한다.

> Record `353259` / MARC `WONKWANG00353259`, `五行精紀 / 廖中(宋) 著`, `乙亥字本`, 등록번호 `AN008540`–`AN008545`, `188.5 ㄹ842 V.1`–`V.6`을 기준으로, `卷33`가 포함된 책의 exact volume/leaf mapping, title/序跋/colophon/版心/葉次가 보이는 연속 원면, `論大運` target passage와 앞뒤 leaf의 기관 제공 image 또는 허가된 reproduction, 사진·복제·인용 조건을 확인한다.

확보 시에도 순서는 `raw bytes/hash → direct visual page observation → printed folio/crosswalk → edition/lineage → surrounding-text collation → semantic equivalence → independence`로 유지한다. catalog metadata, secondary sillokwiki prose, OCR, candidate transcription, 또는 numeric/phrase match만으로 semantic authority를 만들지 않는다.

## 7. Saju evidence frontier 불변

- 이번 audit가 추가한 것은 원광대 first-party catalog identity와 catalog-level six-volume holdings, 공식 복제 신청 route뿐이다.
- `K3-437 ↔ NLC 06857`의 기존 direct-page variant와 lineage blocker는 변경하지 않는다.
- 원광대 record는 third-witness metadata lead에서 `first_party_catalog_item_observed`로 좁혀졌지만, `independent_textual_witness`, `semantic_corroboration`, `promotion-ready claim`으로 승격되지 않았다.
- `availableForInterpretation=false`, `semanticAuthority=not_established`, `productionActivation=blocked`, `stableClaimPromotionCount=0`을 유지한다.

검증 성격은 공식 공개 catalog·복제 안내의 read-only access audit이다. 로그인, 기관 연락, 신청 제출, 원면 주문, repository artifact materialization, staging/commit/push/deploy, remote DB 변경은 수행하지 않았다.
