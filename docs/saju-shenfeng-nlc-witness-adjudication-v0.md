# NLC 《神峰通考》 1926·1929 witness adjudication v0

## 결론

NLC의 직접 원면 대조로 target locator와 `丁丑` 충돌을 source-specific 범위에서 닫았다.

- 1926 target: `data_416 / fid=12jh004266 / bid=48929.0`, `民国十五年[1926]`, `文明书局[发行者]`, 1책. 공식 PDF p.21, 인쇄 folio `二〇`, `神峰通考 卷四`의 〈起大運法〉.
- 1929 target: `data_511 / fid=027032013020556 / bid=10361.0`, `民国十八年十一月[1929.11] 出版印行分售`, `中华书局·文明书局`, 上下책. 공식 PDF p.22, 인쇄 folio `二〇`, `神峰通考 卷四`의 〈起大運法〉.
- 같은 `data_416`의 `13jh001619 / bid=43305.0`은 별도 1926 1책 record이다. 확인한 PDF p.22는 `卷一`이며 target-bearing item으로 승격하지 않았다. `12jh004266`과 합치지 않는다.

두 target page 모두 순서는 `乙丑男 → 甲子女`이고, 남명은 다음에서 끝난다.

`五三十五。五歲運逆行。`

두 target page의 남명 column에는 그 뒤의 `丁丑`이 인쇄되어 있지 않다. 따라서 NLC 《神峰通考》 target locator의 canonical literal은 `五歲運逆行`이며, parent의 `五歲運逆行丁丑`은 이 범위에서 superseded 되었다. 이는 《淵海子平》 NLC p.51에서 실제 보이는 `五歲運逆行丁丑`을 삭제하거나 다른 witness에 전이하는 판정이 아니다.

여명은 양쪽 모두 `得九日三三單九。三歲運逆行。餘倣此。`를 보인다. 1926 p.21에는 `逆數至初一日立春止。`, 1929 p.22에는 `逆數至初一日立春。`이 보인다. 이 `止` 차이는 page-level variant로 보존하며 edition/lineage 판정으로 확대하지 않는다.

## First-party records and byte identities

| witness | NLC record / reader | publication statement | official PDF | SHA-256 |
|---|---|---|---|---|
| 1926 target | [12jh004266](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=12jh004266) / [bid 48929.0](http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=416&bid=48929.0) | 民国十五年[1926], 文明书局[发行者], 1册 | [NLC PDF](http://read.nlc.cn/doc2/data13/mgts_minguotushu/mgts20140421_01/duixiang/12jh004266/12jh004266/001/12jh004266_001.pdf) | `47b28d1034e372e52a4289c63607a8e8a11e8e80111dcdcfeeca72ea9d6c6c6d` |
| 1926 separate record | [13jh001619](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=13jh001619) / [bid 43305.0](http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=416&bid=43305.0) | [1926], 上海文明书局[印行者], 1册 | [NLC PDF](http://read.nlc.cn/doc2/data13/mgts_minguotushu/mgts20140421_01/duixiang/13jh001619/13jh001619/001/13jh001619_001.pdf) | `ba8e5408809cac2e9bec8b512e421cdf08c2e83e175323db5dffbe7004a0d569` |
| 1929 target | [027032013020556](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_511&fid=027032013020556) / [bid 10361.0](http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=511&bid=10361.0) | 民国十八年十一月[1929.11] 出版印行分售, 中华书局·文明书局, 上下册 | [NLC PDF](http://read.nlc.cn/doc2/data13/zjmgwx_zhengjiminguowenxian/20140527_01zjmgwx/duixiang/027032013020556/002/027032013020556_002.pdf) | `ccb21cf1215a1e487fe79497839f9343534af42a2e3af6c1e7dd04f3faea9289` |

PDF는 모두 image-only였고, 원면 판독은 공식 PDF 렌더링 이미지에서 수행했다. OCR/text extraction은 locator로 사용하지 않고 authority로 사용하지 않았다.

## Parent handling and boundary

기존 `artifacts/saju-gemini-v7-parent-adjudication/complete.json`은 byte hash `76add867e33c35286788a5e899a3ee66f626959f657ef6fe11ab0f4dc61e8d0d`인 historical parent로 그대로 보존한다. 새 artifact의 `supersedingEvidence`는 다음만 교정한다.

- NLC 《神峰通考》 1926 `12jh004266`의 actual target page는 PDF p.21/folio 二〇이다. parent의 p.20 표기는 parent history로 남긴다.
- NLC 《神峰通考》 target page의 남명 token은 `五歲運逆行`; `丁丑`을 append하지 않는다.
- `丁丑`은 비교용 NLC 《淵海子平》 p.51의 witness-specific observation으로만 남긴다.

이 successor는 독립 lineage, semantic authority, interpretation readiness, production activation을 열지 않는다. 두 target record의 동일/유사 layout은 page-level convergence일 뿐, 같은 edition 또는 직접 전승을 뜻하지 않는다.

## Remaining blockers

공개 NLC PDF와 record metadata만으로 더 닫히지 않는 항목은 다음 네 가지다.

1. 각 NLC record의 물리 copy 또는 catalogue call number와 copy-level collation.
2. target copy의 original title page, colophon, imprint를 별도로 확인하는 page access.
3. NLC reader/reproduction permission과 보존 원본에 대한 복제·대조 경로.
4. 1926과 1929 사이 edition/textual-lineage 관계.

필요한 후속 acquisition은 위 두 target copy에 대해 기관이 제공하는 고해상도 원본/복제와 간기·판권·서지 묶음의 실제 열람이다. 그 전까지는 이 artifact의 page-level correction만 canonical successor로 사용하고, semantic/production 사용은 blocked로 유지한다.
