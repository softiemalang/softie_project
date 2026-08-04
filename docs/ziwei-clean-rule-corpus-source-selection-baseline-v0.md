# Ziwei clean rule corpus source selection baseline v0

기준 HEAD는 `2595e087eaea4adb667a0280a677476aebcb80df`이다. 이 문서는 clean rule corpus를 생성하지 않고, source admission 단위·후보 inventory·판정 경계를 고정한다. 조사 접근일은 `2026-08-04`이며, 공개 원문을 저장하지 않았다.

## 판정 계약

기계 판정 계약은 `ziwei-clean-rule-corpus-source-admission-v0` / `0.1.0`이다. atomic admission unit은 “하나의 판본 또는 명시적으로 식별된 digital witness와 그 위치·파일·계보·접근 증거”다.

`admissible`은 서명/저자·편자/판본/출판처/연도, 안정적인 판본 및 권·장·절 위치, 직접 확인 가능한 원문, 우회 없는 합법 접근, 검증된 file SHA-256을 모두 요구한다. `admissible_with_limits`는 같은 identity/location/original-text/legal gate를 닫되, hash 부재 같은 제한을 명시하고 허용 content class를 제한할 때만 가능하다. catalog record, limited preview, 전사본, 2차 인용은 이 조건을 대신하지 않는다.

각 후보는 다음 content class를 독립적으로 기록한다.

- `deterministic_calculation_rule`
- `table_mapping`
- `terminology_alias`
- `conditional_traditional_statement`
- `worked_example`
- `interpretive_prose`

이번 inventory에서는 모두 `not_allowed`다. 특히 `interpretive_prose`는 source identity가 닫혀도 verified claim으로 자동 승격하지 않는다.

## 공개 후보 ledger

| candidate | source / stable URL | identity · location · file | lineage / independence | verdict |
|---|---|---|---|---|
| `ncl-cip-2019-modernbeauty` | [NCL 2019 CIP record](https://isbn.ncl.edu.tw/NEW_ISBNNet/main_DisplayRecord_Popup.php?KeepThis=true&Pact=ShowCard&Pkey=1080418%2A0061&TB_iframe=true&height=400&width=500) | ISBN `978-986-97737-1-3`, 초판 2019.05, 現代美는 확인. 권·장·절/페이지와 scan/PDF/hash 없음 | lineage 미확정; ISBN 단위 독립 edition 후보 | `reference_only` |
| `google-books-2000-dingwen-ming007` | [Google Books 2000 record](https://books.google.com/books/about/%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8_%E5%91%BD007.html?id=fo7VEAAAQBAJ) | 鼎文書局, 2000, 333 pages, ISBN `9786263503601` 확인. public record는 eBook 없음/제한 preview이며 scan identity/hash 없음 | source edition lineage 미확정; distinct ISBN edition | `access_blocked` |
| `ncl-cip-2025-huaxia-chuanshi-64` | [NCL 2025 CIP record](https://isbn.ncl.edu.tw/NEW_ISBNNet/main_DisplayRecord_Popup.php?KeepThis=true&Pact=ShowCard&Pkey=1140418%2A0158&TB_iframe=true&height=400&width=500) | 華夏出版有限公司, 초판 2025.07, 傳世經典 64, ISBN `978-626-7723-02-9` 확인. 원문 위치/scan/PDF/hash 없음 | lineage 미확정; distinct ISBN/series edition | `reference_only` |
| `wikisource-qing-quanshu-oldid-850736` | [Wikisource fixed revision](https://zh.wikisource.org/w/index.php?title=%E7%B4%AB%E5%BE%AE%E6%96%97%E6%95%B8%E5%85%A8%E6%9B%B8&oldid=850736) | 卷一–卷三와 절 anchor는 보이지만 exact printed edition, scan, page, immutable file hash 없음 | transcription; 관련 전사 계보는 unresolved로 묶고 독립 후보 수에서 제외 | `identity_unresolved` |
| `ndltd-097cgu05121028-exchange-rate-study` | [Taiwan academic thesis record](https://ndltd.ncl.edu.tw/cgi-bin/gs32/gsweb.cgi?o=dnclcdr&s=id%3D%22097CGU05121028%22.&searchmode=basic) | 학위논문 record title은 발견했으나 저자/판본/PDF/hash/인용 위치를 닫지 못함. review 중 verification-code gate | secondary academic citation; primary rule edition으로 취급하지 않음 | `access_blocked` |
| `ctext-ziwei-page-res-979714` | [Chinese Text Project page](https://ctext.org/wiki.pl?if=gb&res=979714) | public URL은 발견했지만 review fetch가 403으로 막혔고 exact edition/location/file hash 없음 | transcription 후보; Wikisource와 같은 unresolved transcription group으로 중복 계산하지 않음 | `access_blocked` |

총 후보는 6개, 계보가 독립적으로 세어진 후보군은 4개다. Wikisource/Chinese Text Project는 같은 원본이라고 단정한 것이 아니라, 모두 edition/file identity가 닫히지 않은 `unresolved-traditional-quanshu-transcription` group으로 취급하여 독립 source 수에 포함하지 않았다. 후보 수·인기도는 신뢰도 ranking으로 사용하지 않는다.

## 결정 및 제한

이번 baseline의 verdict token은 `ziwei_clean_rule_corpus_source_selection_partial_blocked`다. `admissible=0`, `admissible_with_limits=0`, `reference_only=2`, `access_blocked=3`, `identity_unresolved=1`, `rejected=0`이다.

첫 clean corpus pilot source는 아직 없다. 가장 가까운 후속 후보는 NCL 2019/2025 catalog record를 통해 실제 소장 scan 또는 정식 digital edition을 요청·확인하는 것이다. 그 단계에서 exact edition, 권·장·절/페이지, 공개 원문, 파일 크기와 실제 byte SHA-256, lineage와 이용 조건이 모두 닫히기 전에는 `admissible_with_limits`도 부여하지 않는다.

legacy occurrence를 source로 자동 연결하지 않으며, stable claim은 계속 `0`, readiness는 `not_safe_to_start`, grounding subset은 `blocked`, activation은 `experimental`로 보존한다. 실제 rule corpus, claim, interpretation, question, advice, ranking, prompt, UI/API/DB/LLM/production consumer는 생성하지 않았다.

## 산출물과 검증

- 계약/type과 validator: `src/ziwei/cleanRuleCorpusSourceSelection.js`
- 후보 입력 ledger: `test/fixtures/ziwei/clean-rule-corpus-source-candidates-v0.json`
- deterministic materializer: `scripts/materialize-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs`
- checker: `scripts/check-ziwei-clean-rule-corpus-source-selection-baseline-v0.mjs`
- negative fixture/checker: `test/fixtures/ziwei/clean-rule-corpus-source-selection-negative-v0.json`, `scripts/check-ziwei-clean-rule-corpus-source-selection-negative-v0.mjs`
- artifact: `artifacts/ziwei-clean-rule-corpus-source-selection-baseline-v0/complete.json`

Artifact에는 실제 input byte identity와 payload SHA-256이 포함되며, 같은 HEAD/input에서 두 번 materialize한 `complete.json` byte가 같아야 한다. checker는 판본·위치 없는 admissible, catalog-only scan 주장, mirror/reprint 중복, 블로그/AI 무출처 승격, file/lineage 추정, interpretive prose claim 승격, 접근 제한 우회, legacy auto-link, downstream readiness/grounding/activation 승격, 비결정 ID/정렬을 fail-closed로 검사한다.
