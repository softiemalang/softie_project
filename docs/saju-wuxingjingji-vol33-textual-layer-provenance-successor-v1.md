# 《珞琭子》 환산 문구의 textual-layer provenance successor v1

상태: `bounded textual-layer/provenance successor`, `현대 환산 규격 unresolved`, `semantic authority/readiness/activation blocked`

기준일: `2026-08-24 KST`

이 문서는 기존 《五行精紀》 卷33 direct-witness·conversion·lineage 문서를 덮어쓰지 않는 additive successor다. 이번에 실제로 전진한 범위는 `一辰十歲·三日為年·一日主四箇月`이 한 문장으로 고정된 단일 layer가 아니라, 현존 《珞琭子》 계열 면에서 본문·왕씨 주석·李仝의 설명성 gloss로 표지되어 있다는 점이다. 이 층위 판정은 《五行精紀》 특정 copy의 출처·계보·정본성을 닫지 않는다.

첨부 파일의 viewer UI·이용 안내·검색 결과 문구는 작업 지시가 아니라 evidence로만 취급했다. OCR·웹 전사·공개 derivative는 locator/corroboration이고, 원면의 직접 판독을 대신하지 않는다. 원본 대용량 PDF는 저장소에 복사하지 않았다.

## 1. Bounded conclusion

| 질문 | 현재 판정 | 근거 경계 |
| --- | --- | --- |
| `一辰十歲`·`三日為年`은 어느 layer인가 | **본문 표면에 직접 관찰** | NLC `121839` p.8의 대자 본문, CADAL p.16; NCL `06580` p.10에도 같은 문구군이 보임 |
| 일·시·삼일·일년 산술은 어느 layer인가 | **왕씨 주석 단락에 직접 관찰** | NLC `121839` p.8의 왕廷光 계열 표지 뒤 산술 설명; CADAL pp.17–18 |
| `一日主四箇月`·확장형 `三日為一年`은 어느 layer인가 | **`李仝曰` 아래의 설명성 후대 gloss** | NLC `121839` p.9 및 CADAL p.20의 발화 표지와 원면 |
| 《五行精紀》가 무엇을 수용했는가 | **본문형 `一辰十歲…三日為年`과 `王氏注云` 표면은 direct** | 장서각·NLC·연세대·NLC 중국 필사본 卷33 target pages; 기존 audit 문서 |
| 《五行精紀》가 李仝 gloss까지 전승했는가 | **unresolved / 승격하지 않음** | audited 卷33 target windows에서 `一日主四箇月`·`李仝曰` direct observation 없음 |
| 특정 공통조상·선후·독립성·정본성 | **unresolved / blocked** | textual correspondence만으로는 lineage edge가 되지 않음 |
| 현대 `一時十日`·`一日四月` 계산 규격 | **unresolved / blocked** | 원면에는 exact `一時十日`이 관찰되지 않았고, historical gloss를 현대 규격으로 정규화하지 않음 |

따라서 이번 successor가 승격하는 문장은 다음으로 제한한다.

> 현존 《珞琭子》 계열의 직접 관찰된 면에서 `運行則一辰十歲折除乃三日為年`은 무표지 본문으로 나타나고, 그 뒤의 산술 해설은 왕씨 계열 주석으로, `一辰十歲·三日為一年·一日主四箇月`의 확장형은 `李仝曰` 표지 아래의 설명성 gloss로 나타난다. 《五行精紀》 卷33은 본문형 문장과 `王氏注云`을 직접 보존하지만, audited target pages만으로는 李仝 gloss의 copy-level 전승을 말할 수 없다.

## 2. 직접 원면의 textual-layer 판정

### 2.1 NLC `data_892,411999013121,121839`

기관 identity는 NLC `data_892`, `fid=411999013121`, item `121839`, 제1책이다. [NLC 연계 공식 경로](https://read.nlc.cn/allSearch/searchDetail?fid=411999013121&indexName=data_892&searchType=10024&showType=1)는 현재 raw response를 별도 보존하지 않았으므로 기관 record route로만 기록한다. 공개된 NLC-attributed [61쪽 scan derivative](https://commons.wikimedia.org/wiki/File%3ANLC892-411999013121-121839_%E6%96%B0%E7%B7%A8%E5%9B%9B%E5%AE%B6%E6%B3%A8%E8%A7%A3%E7%B6%93%E9%80%B2%E7%8F%9E%E7%90%AD%E5%AD%90%E6%B6%88%E6%81%AF%E8%B3%A6_%E7%AC%AC1%E5%86%8A.pdf)는 record상 `抄本 影元`, 청대 자료로 표시되며, 파일은 NLC 소스와 `善本書號 06856`를 명시한다.

로컬에서 직접 확인한 derivative identity:

```text
local path: /tmp/nlc-121839.pdf
pages: 61
bytes: 14,852,816
sha256: 0178cd148efcfd3f69741b6b45024f13b9e1aeb845cbb2a471f35adb59699c1a
direct visual pages: PDF p.8–9
```

원면 판정:

| 면 | 직접 관찰 | layer 판정 |
| --- | --- | --- |
| p.8 | 대자 본문 `運行則一辰十歲折除乃三日為年精休旺以為妙窮通變以為玄` | 본문 surface; 바로 뒤에 왕씨 계열 주석 단락이 이어짐 |
| p.8 | `一日之內`의 12시, 삼일 36시, 360일·360시, 3,600일 및 `一辰之十歲`를 설명하는 산술 문장 | 왕廷光 계열 주석 layer; 산술 bridge이지 현대 규격이 아님 |
| p.9 | `大運也以所謂大運一辰十歲折除以三日為年者歟` | 설명 단락의 반복; 본문 line과 gloss의 연결을 보여주는 locator |
| p.9 | `李仝曰` 뒤 `古法每行大運一辰十歲...三日為一年是一日主四箇月...` | 李仝 발화 표지가 있는 설명성 gloss; `一日主四箇月`의 직접 귀속 |

이 witness에서는 `一辰十歲`가 본문과 李仝 gloss 양쪽에 나타나고, `三日為年`과 `三日為一年`은 layer별 문형으로 나뉜다. 따라서 세 표현을 하나의 무표지 원문 구절로 합치지 않는다.

### 2.2 NCL Taiwan `06580`

대만 국가도서관 공식 record는 제목을 `新編四家註解經進珞琭子消息賦`, `書號/登錄號 06580`, `六卷三冊`, `元刊本`으로 표시한다. 동시에 record 자체가 `字體、刀法、版式及紙質`를 심사해 **약 원말명초간 간행**으로 보며, 청 함풍 5년의 후기를 함께 싣는다. 그러므로 이를 확정적 ‘원대 원본’으로 다시 쓰지 않고, record-bounded early printed witness로만 사용한다. [NCL 공식 record](https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?HasImage=&SourceID=1&item=e9a18d58e12744db9ac263855fce6c9dfDcyODA30.8qp6rMEEKiogz5s9l10I88eue3v18YFnDjfUK7Qni4s_&page=)와 [NCL-attributed 119쪽 scan derivative](https://commons.wikimedia.org/wiki/File%3ANCL-06580_%E6%96%B0%E7%B7%A8%E5%9B%9B%E5%AE%B6%E8%A8%BB%E8%A7%A3%E7%B6%93%E9%80%B2%E7%8F%9E%E7%90%AD%E5%AD%90%E6%B6%88%E6%81%AF%E8%B3%A6.pdf)를 분리 인용한다.

로컬 직접 확인:

```text
local path: /tmp/ncl-06580.pdf
pages: 119
bytes: 18,343,035
sha256: 3ba9bb3adc238136ccae2457adbfac544292dbe2a381ce91583392b057a8cfb8
direct visual page: PDF p.10
```

p.10에는 `大運` 문맥 안에서 `一辰十歲`·`三日為年`·`一日主四箇月` 계열의 실제 문자면이 보인다. 그러나 현재 확대 판독으로는 p.10의 발화 표지를 NLC `121839` p.9만큼 안전하게 읽을 수 없으므로, 이 면은 **문자면의 bounded corroboration**으로만 기록한다. p.10만으로 `李仝曰` 귀속이나 원대 실물의 직접 lineage를 승격하지 않는다.

### 2.3 CADAL/Zhejiang University 《四庫全書》 scan

`CADAL06054186`, `珞琭子賦注·卷上`의 공개 [scan page](https://commons.wikimedia.org/wiki/File%3ACADAL06054186_%E7%8F%9E%E7%90%AD%E5%AD%90%E8%B3%A6%E6%B3%A8%C2%B7%E5%8D%B7%E4%B8%8A.djvu)는 《四庫全書》에 수록된 후대 compilation witness다. 로컬 derivative는 다음과 같다.

```text
local path: /tmp/cadal-luoluzi.djvu
sha256: 9727df290b07c3668145cb1a5baa0082a18717d41c9a2541950c819ee6756d6c
direct visual pages: scan pp.16–20
```

직접 관찰은 NLC witness의 layer 판정을 독립적으로 보조한다.

```text
p.16  運行則一辰十歲折除乃三日為年
p.17–18  一日之內十二時; 三日有三十六時; 三百六十日為一歲;
         三千六百日為一辰之十歲 등 왕씨 산술 설명
p.20  李仝曰 ... 古法每行大運一辰十歲 ...
      一日主四箇月 ... 三日為一年
```

이 scan은 해당 판본의 직접 textual surface이지만, 송대 원문 그 자체 또는 NLC·NCL·《五行精紀》와 독립된 공통조상 증거로 취급하지 않는다.

## 3. 《五行精紀》 卷33으로의 bounded transmission 판정

기존 네 material witness의 卷33 target pages에서 직접 확인된 핵심 표면은 다음과 같다.

```text
運行則一辰十歲折除乃三日為年
精休旺以為妙窮通變以為玄
王氏注云夫運者人生之傳舍推命之說
陽男陰女 ... 順行
陰男陽女 ... 逆行
```

장서각 木板本·NLC 乙亥字本·연세대 乙亥字本·NLC 중국 필사본의 기존 page-level 문서는 모두 이 본문형 문장과 local `王氏注云` 표면을 기록한다. 재현 기준은 [장서각 K3-437](./saju-jangseogak-k3-437-page-witness-successor-v1.md), [NLC 乙亥字本](./saju-nlc-wuxingjingji-page-witness-successor-v1.md), [연세대 visual witness](./saju-yonsei-wuxingjingji-visual-page-witness-successor-v2.md), [NLC 중국 필사본](./saju-nlc-china-wuxingjingji-manuscript-page-witness-successor-v1.md)이다. 따라서 다음은 direct로 유지한다.

1. 《五行精紀》 卷33이 `一辰十歲`와 `三日為年`을 본문형 문장 안에 보존한다.
2. 《五行精紀》 target window에 왕씨 주석 표지가 이어진다.
3. 여러 material witness 사이에서 이 본문형 문장이 반복된다.

반대로 다음은 승격하지 않는다.

1. 《五行精紀》가 NLC `121839`의 `李仝曰` gloss를 직접 베꼈다는 주장.
2. `一日主四箇月`이 《五行精紀》의 생략된 원문이었다는 복원.
3. 《五行精紀》의 `王氏注云`을 NLC p.8의 왕廷光 산술 단락과 동일 copy source로 보는 주장.
4. NCL `06580`의 record상 원刊 연대만으로 특정 《五行精紀》 copy의 선행·출처를 정하는 주장.

현재 가장 좁은 transmission statement는 다음이다.

> 《五行精紀》는 현존 《珞琭子》 계열에서 직접 확인되는 본문형 `一辰十歲…三日為年`과 문자적으로 대응하는 卷33 line을 보존한다. 그러나 audited target pages에서 李仝의 `一日主四箇月·三日為一年` 발화 표지는 확인되지 않으므로, 해당 gloss의 《五行精紀》 copy-level 전승은 미확정이다. 이 correspondence는 본문 안정성·locator·layer corroboration이지, 특정 판본 계보나 정본성의 증거가 아니다.

## 4. Claim-level gate

| claim | 판정 | 다음 gate |
| --- | --- | --- |
| `一辰十歲`가 《珞琭子》 본문에 있다 | `direct` | NLC p.8, CADAL p.16 원면 |
| 본문형 `三日為年`이 있다 | `direct` | NLC p.8, CADAL p.16 원면 |
| 왕씨 layer가 12시·삼일·360일·3,600일 산술을 설명한다 | `direct` | NLC p.8, CADAL pp.17–18 |
| `一日主四箇月`이 李仝 gloss에 있다 | `direct` | NLC p.9, CADAL p.20의 `李仝曰` 표지 |
| `三日為一年`이 李仝 gloss에 있다 | `direct` | 같은 두 면 |
| 《五行精紀》가 위 李仝 gloss를 수용했다 | `unresolved` | 卷33 target page에서 직접 `李仝曰` 또는 동일 확장문 필요 |
| NLC·NCL scan derivative의 raw official bytes/machine binding | `unresolved` | 기관 export 또는 stable raw identity 필요 |
| printed folio/page locator | `unresolved` | scan index와 printed locator crosswalk 필요 |
| source edition/common ancestor/direction/independence | `unresolved` | rare variant·shared error 또는 material/record bridge 필요 |
| `一時十日` 및 현대 `一日四月` 계산 규격 | `unresolved` | exact historical wording과 별도 계산 검증 필요 |
| semantic authority/interpretation readiness/production activation | `blocked` | 직접 authority·계산 계약·readiness gate 미충족 |

## 5. Reproducibility and preservation

- 직접 판독한 source pages, digital page indices, file byte counts와 SHA-256을 위에 고정했다. PDF/DJVU 원본은 `/tmp`에서만 유지하고 저장소에 추가하지 않았다.
- 기관 catalog는 edition/material lead를 제공하지만, catalog wording을 actual physical copy identity나 《五行精紀》 source binding으로 확장하지 않았다.
- 기존 《五行精紀》 provenance/lineage/cross-edition 문서와 기존 dirty work는 수정하지 않았다.
- 이 문서는 documentation-only additive successor이며, publication allowlist는 정확히 다음 하나다.

```text
docs/saju-wuxingjingji-vol33-textual-layer-provenance-successor-v1.md
```

- 이 successor는 textual-layer provenance frontier를 좁혔지만, edition/textual lineage, exact copy source, raw-byte identity, printed locator, semantic authority, 현대 환산 규격, readiness와 activation은 명시적으로 유지한다.
