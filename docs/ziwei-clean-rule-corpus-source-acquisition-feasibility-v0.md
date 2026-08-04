# Ziwei clean corpus source acquisition feasibility v0

`verdictToken=ziwei_clean_rule_corpus_source_acquisition_feasibility_partial_blocked`이며 기준 HEAD는 `3bbae92d81fa19107167b288c666f9dc19e2fdf3`이다. 기존 source-selection artifact/ledger의 의미는 수정하지 않고, ledger에서 `verdict === access_blocked`인 후보만 기계적으로 선택했다. 공개 웹·기관 정책만 조사했으며 다운로드, 로그인, 신청, 결제, 문의, 우회, 대용량 저장은 하지 않았다.

## 기계 선택 결과

선택된 3개는 `google-books-2000-dingwen-ming007`, `ndltd-097cgu05121028-exchange-rate-study`, `ctext-ziwei-page-res-979714`이다. NCL 2019/2025의 `reference_only`, Wikisource의 `identity_unresolved`는 access-blocked로 재분류하지 않았다.

| 후보 | 공식 경로에서 확인한 경로·조건 | edition/page map | bytes/hash | 권리·최종 판정 |
|---|---|---|---|---|
| Google Books 2000 命007 | [record](https://books.google.com/books/about/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8_%E5%91%BD007.html?id=fo7VEAAAQBAJ)에는 鼎文書局·2000·333쪽·ISBN이 보인다. Google은 preview/buy/borrow 경로를 설명하고, digital content는 결제 후 개인적·비상업적 이용 및 배포 제한이 있다([About](https://books.google.com/googlebooks/about/), [Terms](https://books.google.com/intl/en/googlebooks/tos.html)). | edition 상당 부분 식별; 공개 page map 없음 | 확보하지 않음; hash 없음 | 구매/대여 또는 기관 제공 후 다시 검증 필요. repository 저장 허가 미확정 → `application_required` |
| NDLTD thesis 097CGU05121028 | [공식 record](https://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi?o=dnclcdr&s=id%3D%22097CGU05121028%22.&searchmode=basic)는 저자·학교·2009·79쪽·전자全文 항목을 보인다. NCL [FAQ](https://www.ncl.edu.tw/service-faqs?qcat=0Q063418271611073163)는 관내 열람, 서면 신청·승인, 10쪽 제한과 복사 비용 조건을 설명한다. | thesis record는 부분 식별; 인용 primary source의 page map 미확정 | 확보하지 않음; hash 없음 | authorized portal/관내 열람/복사 절차 필요, complete thesis·extract 저장 허가 미확정 → `application_required` |
| CText res=979714 | [work page](https://ctext.org/wiki.pl?if=gb&res=979714)는 URN·`正統道藏本` 표기와 rule-like section anchor를 보인다. [FAQ](https://ctext.org/faq)는 개인 저장/출력·합리적 인용은 허용하지만 자동 대량 다운로드를 금지하고, 자료별 저작권 판단 책임을 사용자에게 둔다. | digital label/anchor는 있으나 printed edition·page-image lineage 없음 | 확보하지 않음; hash 없음 | 제한적 인용/개인 사용 외 complete seed 저장·재사용 권리 미확정 → `rights_unclear` |

따라서 `acquirable=0`, `acquirable_with_limits=0`이다. `application_required`는 확보 완료가 아니라, 공식적인 다음 경로가 있으나 신청/구매/권한 부여와 실제 witness 검증이 남았다는 뜻이다. `access_blocked_frozen`으로 즉시 바꾸지 않은 이유는 공개 정책상 신청·열람 경로가 확인되는 후보가 있기 때문이다. 실제 신청·결제·계정 생성은 이 작업 범위 밖이다.

## 대체 deterministic seed feasibility

기존 6개 후보가 clean seed를 닫지 못했으므로 2개의 좁은 대체 후보만 확인했다. 범위는 궁 배치, 오행국, 주성 배치, 사화 등 명시적 mapping/table에 한정하고 해석 prose는 제외했다.

| 대체 후보 | 확인 내용 | 판정 |
|---|---|---|
| [Japan National Archives Digital Archive F1000000000000101426](https://www.digital.archives.go.jp/das/meta/F1000000000000101426.html) | `新鋟希夷陳先生紫微斗数全書`, 明刊 catalog identity가 검색 결과에 보인다. record 접근·열람/복제 절차와 page image를 이 환경의 공개 fetch만으로 닫지 못했다. | `application_required`; seed 승인 아님 |
| [Wikisource oldid=850736](https://zh.wikisource.org/w/index.php?title=%E7%B4%AB%E5%BE%AE%E9%AC%A5%E6%95%B8%E5%85%A8%E6%9B%B8&oldid=850736) | 고정 revision, 清朝 표기, 卷一–三/section anchor, public-domain 및 CC BY-SA/지역별 권리 주의가 보인다. 그러나 exact printed witness, original page map, immutable scan bytes가 없다. | `rights_unclear`; seed 승인 아님 |

어느 대체 후보도 exact edition + rule-bearing location/page map + 실제 file bytes/hash + 허용 저장 조건을 동시에 충족하지 못했다. 따라서 `cleanSeedCandidateCount=0`, 첫 clean corpus pilot source는 없다.

## 불변 경계와 산출물

stable claim은 `0`, readiness는 `not_safe_to_start`, grounding은 `blocked`, activation은 `experimental`로 유지한다. rule ingestion, claim, 해석, 질문, 조언, ranking, prompt, UI/API/DB/LLM/production consumer/tri-system envelope는 생성하지 않았다.

- artifact: `artifacts/ziwei-clean-rule-corpus-source-acquisition-feasibility-v0/complete.json`
- materializer: `scripts/materialize-ziwei-clean-rule-corpus-source-acquisition-feasibility-v0.mjs`
- checker: `scripts/check-ziwei-clean-rule-corpus-source-acquisition-feasibility-v0.mjs`
- negative fixture/checker: `test/fixtures/ziwei/clean-rule-corpus-source-acquisition-feasibility-negative-v0.json`, `scripts/check-ziwei-clean-rule-corpus-source-acquisition-feasibility-negative-v0.mjs`
- targeted test: `test/ziweiCleanRuleCorpusSourceAcquisitionFeasibility.test.js`

실제 bytes가 없을 때 hash를 만들지 않으며, 반복 materialization은 고정 HEAD/input에서 complete.json bytes와 integrity hash가 동일해야 한다.
