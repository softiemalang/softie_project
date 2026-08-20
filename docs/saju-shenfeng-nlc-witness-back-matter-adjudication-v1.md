# NLC 《神峰通考》 back-matter adjudication v1

## 판정

Mingli direct-witness v1 publication 이후, 중단되어 있던 Shenfeng 흐름에서 공식 NLC PDF의 새 back-matter 면만 재검토했다. 1926 target PDF와 1929 target PDF의 원 bytes는 기존 Shenfeng v0에 기록된 SHA-256과 각각 일치했다.

이번 successor가 닫는 범위는 다음 두 개의 직접 관찰뿐이다.

- 1926 `data_416 / 12jh004266 / bid 48929.0`: 공식 PDF p.166에서 `神峰通考（全二冊）`, `中華民國十五年一月出版`, `此書有著作權翻印必究`가 보이는 출판·저작권 고지 면.
- 1929 `data_511 / 027032013020556 / bid 10361.0`: 공식 PDF p.167에서 `神峰通考（全二冊）`, `中華民國十五年一月初版`, `中華民國十八年十月再版`, `此書有著作權翻印必究` 및 `上海图书馆藏书` 표시가 보이는 면.

이 면들은 publisher/back-matter notice와 scan-level library mark로 기록했다. 원 title page·colophon·완전한 copy-level imprint로 승격하지 않았다.

## v0와의 관계

Shenfeng v0는 predecessor로 byte-preserved 했다.

- target page: 1926 PDF p.21 / folio `二〇`, 1929 PDF p.22 / folio `二〇`
- source-specific male literal: `五歲運逆行`; `丁丑`은 NLC 《神峰通考》 target page에 전이하지 않음
- target-page relation: page-level only
- canonical lineage edges: 0
- promotion: 0
- readiness: `availableForInterpretation=false`, `semanticAuthority=not_established`, `productionActivation=blocked`

1929 p.167의 `十五年一月初版`·`十八年十月再版`은 edition-relation lead로만 남긴다. 그것만으로 1926/1929 target object의 textual lineage, direct copying, 또는 independent witness를 확정하지 않는다. `上海图书馆藏书`도 한 scan에 보이는 소장표시일 뿐 NLC call number나 두 record의 copy identity가 아니다.

## 남은 blocker와 중단 지점

네 blocker 모두 unresolved다.

1. 각 NLC record의 physical copy 또는 catalogue call number.
2. 각 target copy의 original title page·colophon·complete imprint.
3. NLC reproduction permission과 copy-level collation 경로.
4. 1926/1929 사이의 edition/textual lineage.

따라서 이번 evidence로 semantic authority, 계산 규칙, interpretation readiness, production activation을 열지 않는다. 다음 진행에는 기관이 제공하는 copy-level surrogate/권리 확인과 연속된 title·序·跋·牌記·간기 및 target leaves가 필요하다.
