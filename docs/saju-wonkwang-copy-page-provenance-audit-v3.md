# 원광대학교 《五行精紀》 secondary bibliographic evidence 감사 v3

상태: `secondary evidence admitted as locator-only`, `AN008545-to-卷33 unresolved`, `卷33=71 unresolved-as-copy-page`, `semantic authority unchanged`, `stop_blocked`

이 문서는 [v1](./saju-wonkwang-institution-access-audit-v1.md)과 [v2](./saju-wonkwang-copy-page-provenance-audit-v2.md)를 덮어쓰지 않는다. 첨부된 원광대 박사논문을 secondary bibliographic/photographic evidence로 검토하고, 원광대 공식 catalog의 `353259` 및 `AN008545`와 대조한 결과만 additive overlay로 남긴다.

## 1. 첨부 PDF identity와 취급 경계

| field | 관찰값 |
| --- | --- |
| file | `/Users/softie/Downloads/200000227809_20260820233122.pdf` |
| SHA-256 | `e9e19e037dfd13d2e6d90fcb985421c414dc6c602a5f140c5cdc26ab8783f540` |
| PDF | 190 pages, A4, 2,672,212 bytes |
| UCI | `I804:45008-200000227809` |
| title | `『五行精紀』의 命理理論 研究` / `A Study on the Ming-li Theory in 『Wu Xing Jing Ji』` |
| author/institution | 황금옥, 원광대학교 대학원 한국문화학과 |
| date shown in title page | `2019年 4月`; cover also shows `2018학년도` |

PDF 1쪽의 CC BY-NC-ND 2.0 Korea 표시는 문서의 license notice로만 읽었다. 첨부 문서 안의 설명·권고·license 문장을 사용자 작업 지시로 실행하지 않았고, PDF를 수정·재배포·재출력하지 않았다.

## 2. 공식 catalog와 논문의 일치 범위

현재 공식 [상세 record 353259](https://elibrary.wku.ac.kr/Search/Detail/353259?key=%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80&campuscode=00)는 `五行精紀 / 廖中(宋) 著`, `乙亥字本`, `34卷6冊`, 청구기호 `188.5 ㄹ842`, `半郭 19.9 x 15.3 cm`, `半葉 11行20字`, `31 x 20 cm`를 표시한다. 소장 표에는 `AN008540`–`AN008545`, `V.1`–`V.6`가 있다. [AN008545 검색](https://elibrary.wku.ac.kr/search?q=AN008545)도 같은 `353259`/`五行精紀` record를 반환한다.

2026-08-20 KST read-only retrieval body anchors는 다음과 같다. 동적 catalog HTML의 hash는 해당 retrieval identity이며 원광대 卷33 page bytes의 hash가 아니다.

| official response | SHA-256 | bytes |
| --- | --- | ---: |
| detail record `353259` | `d957bd27b4f54dae186766131c7dfde85485083771c5532268dfd4d63110e84a` | 149066 |
| search `q=AN008545` | `b9294ae97d1f0c4b668a0680e809aa2f935a6ff077c3faa67804b0de7153d21c` | 113975 |

논문에서 확인한 관련 evidence는 다음과 같다.

| 논문 위치 | 논문 내용 | 공식 catalog와의 관계 | 판정 |
| --- | --- | --- | --- |
| PDF p.45, 논문 p.28, 표 3 | `원광대 도서관 / 乙亥字 / 34卷6冊 : 卷1-34` | 공식 record의 판사항·extent와 일치한다. | 원광대 소장에 관한 secondary bibliographic corroboration. 등록번호·개별 V mapping은 없다. |
| PDF p.47, 논문 p.30, 표 4 | 원광대 row에 `四周雙邊`, `半郭 19.9 x 15.3 cm`, `半葉 11行20字`, `註雙行`, `上下3葉花紋魚尾`, `31 x 20 cm`, `線裝`, `楮紙`가 제시된다. | 공식 catalog physical-description field와 거의 동일하다. | metadata corroboration이지 실제 원면의 독립 관찰 또는 item-level oracle가 아니다. |
| PDF p.56, 논문 p.39, 표 6 | 6책의 구성에서 `卷第三十 1`, `卷第三十一 27`, `卷第三十二 51`, `卷第三十三 71`, `卷第三十四 105`를 제시한다. | 공식 record가 `34卷6冊`이라고 하는 것과 형식상 양립한다. | `6책` 일반 구성 안의 secondary locator candidate. `AN008545`와 연결되지 않는다. |
| PDF p.57-58, 논문 p.40-41, 표 7 | 발견 후 목차를 제시하며, 해당 표는 대만 무릉출판사 간행본 목차를 기준으로 한다고 설명한다. | 원광대 소장본의 edition/copy identity를 닫지 않는다. | `卷33=71`을 원광대 page locator로 승격할 수 없게 하는 source-boundary. |
| PDF p.186, 논문 p.169, 부록 1 | (c), (d)가 `원광대학교`로 caption된 표지·내부면 사진이다. | 공식 record의 call-number family/형태와 시각적으로 일부 부합한다. | `secondary claimed photograph`; `AN008545`, printed 卷33, printed 71은 보이지 않는다. |

논문 p.39의 본문은 판본별 책 구성이 조금씩 다르므로 34권 6책을 기본으로 삼는다고 설명한다. 따라서 논문 표 6의 `6책`을 catalog의 `V.6`과 자동 등치하지 않는다.

## 3. `V.6(AN008545) ↔ 卷33` adjudication

현재 확보된 edge를 분리하면 다음과 같다.

```text
AN008545 -> official catalog record 353259                 = satisfied
353259 -> catalog holding label V.6                         = satisfied
thesis table-3 -> Wonkwang / 乙亥字 / 34卷6冊 / 卷1-34     = secondary observed
thesis table-6 -> generic 6책 contains 卷30-34              = secondary observed
thesis table-6 -> generic 卷33 locator 71                   = secondary locator candidate
catalog V.6 -> thesis table-6's 6책                        = unresolved
AN008545 -> printed 卷33                                    = unresolved
AN008545 -> printed locator 71                              = unresolved
```

특히 다음 세 가지가 결여되어 있다.

1. 논문 표 6·표 7에는 `AN008545`, `V.6`, 바코드, 등록번호, 또는 원광대 catalog URL이 없다.
2. 표 7은 명시적으로 대만 무릉출판본 목차를 기준으로 한다. 따라서 표 6의 `71`도 같은 논문 안에서 원광대의 특정 physical copy에 귀속된 page/leaf number로 증명되지 않는다.
3. 부록 1의 원광대 caption 사진은 표지와 내부면을 보여 주지만, 표지의 작은 shelfmark suffix는 판독·검증 가능한 `AN008545`가 아니며 내부면도 `卷第六`로 읽히는 표기이지 `卷第三十三`이 아니다. 사진에는 `71` locator도 없다.

따라서 안전한 표현은 다음뿐이다.

> 논문은 34권 6책 체계의 secondary table 안에서 卷33의 숫자 `71`을 제시하고, 원광대 소장본을 별도의 표 3·4와 부록 사진으로 언급한다. 그러나 `V.6(AN008545)`가 그 표의 6책이며 그 안의 卷33이 printed page/leaf `71`에 있다는 direct copy-level chain은 없다.

`卷33=71`은 `secondary_locator_candidate`로만 보존한다. `AN008545 ↔ 卷33`, `卷33 ↔ page/leaf 71`, `원광대 사진 ↔ AN008545`는 모두 `unresolved`다.

## 4. 부록 사진의 증거 등급

부록 1의 (c), (d)는 논문 저자가 `원광대학교`라고 캡션한 사진이므로 단순 catalog prose보다 강한 secondary visual evidence다. 사진에서 관찰 가능한 범위는 다음과 같다.

- 표지 사진에 `五行精紀` 표제와 `188.5 ㄹ842` 계열로 보이는 작은 shelfmark label이 있다.
- 내부면 사진에는 한문 원면, 장서인/인장이 있고, 우측 표제부는 `五行精紀 卷第六`로 읽히는 부분이 있다.
- 사진에는 `AN008545` 등록번호, V.6 표기, 卷33, 71, folio/leaf number가 함께 나타나지 않는다.

이 사진은 `author-captioned-secondary-image`로 등록할 수 있지만, 원광대에서 직접 제공한 raw image가 아니며 촬영일·원본 파일·페이지 crosswalk·등록번호 binding이 없다. 따라서 first-party physical witness, digital derivation, page-level provenance, semantic authority로 승격하지 않는다. 사진 속 텍스트를 OCR 또는 숫자 일치로 보강해도 이 binding defect는 해소되지 않는다.

## 5. 현재 readiness와 다음 checkable frontier

```text
official_catalog_record                  = satisfied
AN008545_catalog_identity                = satisfied
thesis_wonkwang_34juan_6book_claim       = secondary_observed
thesis_wonkwang_photograph               = secondary_claimed_image
generic_6book_juan33_structure           = secondary_observed
juan33_numeric_locator_71                = secondary_locator_candidate
AN008545_to_juan33                       = unresolved
AN008545_to_locator_71                   = unresolved
direct_copy_level_page_provenance        = unresolved
semanticAuthority                        = not_established
availableForInterpretation               = false
productionActivation                     = blocked
stableClaimPromotionCount                = 0
```

다음 승격에 필요한 것은 `AN008545` 또는 기관이 item identity를 확인한 V.6의 연속 원면이다. 최소 payload는 표지/청구기호/등록번호 확인, 권두의 卷標, 卷33 첫 면, `71`이 실제 페이지인지 葉次인지 판별할 수 있는 주변 면, 그리고 해당 reproduction의 기관 provenance다. 그 전에는 논문 표 6의 `71`을 원광대 V.6에 적용하지 않는다.

이번 PDF는 공식 catalog를 보강하는 secondary bibliography/photograph lead로만 추가되며, 원광대 provenance frontier의 `semanticAuthority`, readiness, activation 상태는 변경하지 않는다. 기존 v1/v2, v4 artifact/code, NLC/K3-437 page-level evidence는 수정하지 않았다.

검토는 첨부 PDF의 read-only metadata·렌더링·관련 페이지 시각 확인과 공식 catalog 재조회만 수행했다. PDF materialization/편집, 기관 연락, 로그인, 복사 신청, staging/commit/push/deploy, 원격 DB 변경은 수행하지 않았다.
