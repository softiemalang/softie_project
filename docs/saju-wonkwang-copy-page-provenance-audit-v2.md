# 원광대학교 《五行精紀》 卷33 copy/page provenance 감사 v2

상태: `additive official-access-boundary refinement`, `catalog evidence only`, `target-page provenance unresolved`, `stop_blocked`

이 문서는 기존 [v1 audit](./saju-wonkwang-institution-access-audit-v1.md)를 덮어쓰지 않고, 2026-08-20 KST에 원광대학교 공식 catalog·이용안내·방문 경로를 추가로 확인한 overlay다. 실제 원광대 소장본 원면, 기관 제공 scan/복사물, printed 卷33의 volume/leaf mapping은 확보하지 않았다.

## 1. 이번 pass에서 더 좁힌 범위

| 축 | 직접 확인된 결과 | 남은 경계 |
| --- | --- | --- |
| catalog identity | [공식 상세 record 353259](https://elibrary.wku.ac.kr/Search/Detail/353259?key=%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80&campuscode=00)가 `五行精紀` record이며 `MARC 001 = WONKWANG00353259`이다. | record는 특정 책의 실제 잎·면 bytes가 아니다. |
| registration pairing | 공식 검색 `q=AN008540`가 `1 Results`를 반환하고, 같은 `353259`/`五行精紀` record와 `AN008540`를 함께 표시한다. | `AN008540`가 printed 卷33을 포함한다는 뜻은 아니다. |
| physical access boundary | 공식 이용안내는 `고서`를 관외 대출 금지 자료로 분류하고 관내 열람 및 관내 Scanner/복사기 이용을 안내한다. 층별 안내는 고문헌자료실을 중앙도서관 6층으로 두고 자료를 그 실내에서만 이용하도록 한다. | 이 specific item의 열람 허가, 촬영/복사 허가, volume-to-juan mapping은 확인되지 않았다. |
| copy/request route | 원문복사·복사/인쇄/스캔 안내와 방문 경로는 공식적으로 존재한다. | 원문복사는 자격·신청·기관 확인이 필요하고, 방문 경로는 로그인으로 막힌다. 신청·연락·로그인은 하지 않았다. |
| page provenance | 공개 detail/content route에서 卷33 원면, PDF, IIIF, download URL을 얻지 못했다. | `卷33_actual_reproduction = unresolved`; catalog 이상으로 승격하지 않는다. |

`OPAC 대출가능`과 공식 일반 이용안내의 `고서 관외 대출 금지`는 item status를 해석할 때 충돌한다. 따라서 `대출가능`을 외부 대출 가능 또는 현재 접근 가능으로 읽지 않고, 도서관의 item-specific 확인이 필요한 `access_policy_conflict`로 보존한다.

## 2. 공식 경로별 판정

### 2.1 record와 등록번호

- [공식 상세 record 353259](https://elibrary.wku.ac.kr/Search/Detail/353259?key=%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80&campuscode=00)는 기존 v1의 title/author/extent/판사항/6개 holdings 관찰을 유지한다.
- [등록번호 검색 `AN008540`](https://elibrary.wku.ac.kr/search?q=AN008540)는 `五行精紀`, 상세 record `353259`, `AN008540`를 같은 결과에 표시한다. 이로써 `registration → catalog record` 연결만 닫는다.
- `AN008540`–`AN008545`와 `V.1`–`V.6`가 있다는 사실은 확인되지만, 어느 책에 printed `卷33`이 있는지 또는 각 책의 첫·끝 卷이 무엇인지는 catalog에 없다.

### 2.2 공식 이용안내가 닫는 물리 접근 경계

[대출 및 반납 안내](https://elibrary.wku.ac.kr/Common?html=%2FUsers%2FWonkwang%2FDocs%2FuserGuide03.cshtml)의 live API response는 다음을 명시한다.

> `고서`는 관외 대출이 금지되며 관내에서만 열람할 수 있다. 자료가 필요한 경우 관내 Scanner 및 복사기를 이용할 수 있다.

[층별실별 안내](https://elibrary.wku.ac.kr/Common?html=%2FUsers%2FWonkwang%2FDocs%2FuserGuide04.cshtml)의 live response는 다음을 명시한다.

> `고문헌자료실(6층)`에 귀중한 고서·족보·문집류가 비치되며, 자료는 고문헌자료실 내에서만 이용할 수 있다. 이용문의는 `063-850-5461`이다.

[복사/인쇄/스캔 안내](https://elibrary.wku.ac.kr/Common?html=%2FUsers%2FWonkwang%2FDocs%2FuserGuide05.cshtml)는 중앙도서관 3층 등에 무인복합기가 설치되어 있다고 안내한다. 이것은 시설 locator일 뿐, 6층 고서의 이동·촬영 허가 또는 卷33 scan 존재를 뜻하지 않는다.

따라서 이번 pass에서 가장 좁힌 안전한 결론은 다음이다.

```text
official_catalog_record             = satisfied
catalog_registration_pairing        = satisfied (AN008540 -> 353259)
official_rare_book_access_boundary  = narrowed (6F reading room, in-room use)
item_specific_access_permission     = unresolved
opac_status_vs_policy               = conflicted
copy_request_route                  = exists_but_permission_gated
volume_to_printed_juan_mapping      = unresolved
卷33_physical_leaf_or_page          = unresolved
卷33_copy_or_scan_provenance        = unresolved
semanticAuthority                   = not_established
availableForInterpretation          = false
productionActivation                = blocked
stableClaimPromotionCount           = 0
```

## 3. 인증·복제·repository 경계

- [원문복사 안내](https://elibrary.wku.ac.kr/Common?html=%2FUsers%2FWonkwang%2FDocs%2Fcopy_guide.cshtml)는 자관에 없는 자료를 대상으로 한 기관 간 복제 경로와 본교 재학생·교직원 자격을 안내한다. 원광대 소장본의 卷33 원면을 이미 제공하는 공개 endpoint는 아니다.
- `https://elibrary.wku.ac.kr/LibraryVisit`는 read-only 접근 시 `https://elibrary.wku.ac.kr/Account/LogOn`으로 리디렉트되었다. 외부 방문/이용 절차가 있을 수 있어도, 인증·예약·열람 신청을 수행하지 않은 상태에서는 copy/page provenance를 닫을 수 없다.
- 공식 catalog가 연결하는 `https://Wonkwang.dcollection.net/`는 공개 접근 시 일반 `https://www.dcollection.net/` 포털로 리디렉트되었다. 이 경로에서 `五行精紀` 卷33의 원면이나 기관 제공 file identity는 얻지 못했다.

이 경계는 “원면이 없다”는 부정적 소장이 아니다. 정확한 판정은 “공개 공식 경로에서 원면/허가된 reproduction을 관찰하지 못했고, 다음 단계는 기관 허가가 필요한 물리 접근”이다.

## 4. byte-level retrieval anchors

2026-08-20 KST에 `curl -L -sS`로 받은 response body의 SHA-256이다. 동적 안내·HTML은 이후 바뀔 수 있으며, 아래 hash는 정책 응답의 retrieval identity이지 target page bytes의 hash가 아니다.

| response | SHA-256 | bytes |
| --- | --- | ---: |
| catalog search `q=AN008540` | `46bb9bccabb4169ea802feef74c5460a0e62ffe90470b6ce028f3fa312f4797c` | 113975 |
| `GetSpongeManagement`, `l_title=대출및반납` | `361f32c02cfe3a0c5a7b1303ede26bb9155872f6f799f0b765b8cae0d01c63a0` | 7756 |
| `GetSpongeManagement`, `l_title=층별실별안내` | `2422cced9df5f2c7f6f1b1e9373335496627e5212dc3b1538e5aa773ad3dddaa` | 12901 |
| `GetSpongeManagement`, `l_title=복사인쇄안내` | `1d7d9af2383c7893b35d0aca171e14687674e888ce894ba2e9e36dbb282f14e6` | 372 |
| `/LibraryVisit` 최종 login response | `de7eea7822839ae75b7b16493259e654dca8c4d3c5732e375a26d81f834ec247` | 77207 |
| `Wonkwang.dcollection.net/` 최종 generic portal response | `4944421a0638fc8cf61b7e8389fee2263ee0f9b71a2aca28f73f9c3ce758d750` | 12091 |

원광대 원면·복제물의 bytes/hash는 아직 없으므로, 위 anchors로 `卷33`의 page content·folio·판본을 재구성하지 않는다.

## 5. 중단 지점과 허가된 다음 payload

실제 provenance 또는 semantic promotion을 시도할 수 있는 다음 payload는 기관이 허가하는 경우로 한정한다.

> Record `353259` / `WONKWANG00353259`, `五行精紀`, `乙亥字本`, 등록번호 `AN008540`–`AN008545`, 청구기호 `188.5 ㄹ842 V.1`–`V.6`에 대해 printed `卷33`가 들어 있는 실제 책 번호, title/序跋/colophon/版心/葉次가 보이는 연속 원면, target passage와 앞뒤 면의 기관 제공 scan/복사 가능 여부 및 인용 조건을 확인한다.

그 전에는 다음을 하지 않는다.

- `V.1`–`V.6` 순서를 printed 卷 순서로 추정하지 않는다.
- `乙亥字本`, `34卷6冊`, 숫자·문구 일치, OCR, secondary description을 원면 provenance나 semantic witness로 세지 않는다.
- `대출가능`을 고서의 관외 대출 허가로 해석하지 않는다.
- 로그인, 방문·복사 신청, 기관 연락, 파일 주문, repository 우회 접근을 수행하지 않는다.

이번 노드는 여기서 `stop_blocked`다. 원광대 record는 `first_party_catalog_item_observed`와 공식 access-policy locator로만 유지하며, `independent_textual_witness`, `semantic_corroboration`, `promotion-ready claim`으로 승격하지 않는다. 기존 v4 artifact/code와 기존 v1 audit, NLC/K3-437의 page-level evidence는 변경하지 않았다.

검증은 공식 공개 경로의 read-only 확인만 수행했다. 파일 materialization, staging/commit/push/deploy, 원격 DB 변경은 수행하지 않았다.
