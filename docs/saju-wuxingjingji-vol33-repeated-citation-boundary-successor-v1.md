# 《五行精紀》卷33 `大運` 반복 인용 경계 successor v1

상태: `bounded repeated citation-boundary successor`, `李仝 gloss 수용 unresolved`, `edition/textual lineage·semantic authority·readiness blocked`

기준일: `2026-08-24 KST`

이 문서는 기존 [textual-layer provenance successor](./saju-wuxingjingji-vol33-textual-layer-provenance-successor-v1.md)와 각 기관의 page-level witness 문서를 덮어쓰지 않는 additive successor다. 이번에 실제로 좁힌 범위는 《五行精紀》 卷33의 관찰 창에서 다음 경계가 **앞뒤 문장과 함께 반복**된다는 점이다.

```text
본문 끝:  ...窮通變以為玄
직후 표지: 王氏注云
주석 시작: 夫運者人生之傳舍推命之說...
```

이는 《五行精紀》에서 직접 보이는 반복된 인용/주석 경계의 promotion이다. `王氏注云`을 외부 《珞琭子》의 `王廷光曰`과 동일 source로 만들거나, 그 뒤에 보이지 않는 `李仝曰` gloss가 생략되었다고 복원하지 않는다.

## 1. Bounded advancement

| 질문 | 현재 판정 | 직접 근거의 범위 |
| --- | --- | --- |
| 《五行精紀》 본문형 `一辰十歲…三日為年`의 끝 경계 | **direct, 반복 확인** | 장서각 K3 p.71, NLC 乙亥字本 p.103, NLC 필사본 p.49; 연세대 viewer 33/80 관찰 창은 visual corroboration |
| 직후 표지가 `王氏注云`인가 | **direct, 반복 확인** | 위 세 page-level scan에서 본문 끝 직후 같은 표지 관찰 |
| `王氏注云` 뒤가 같은 주석 연속부인가 | **direct, bounded** | K3 pp.72–74, NLC pp.104–106 및 기존 continuation checks, 필사본 pp.50–56 |
| 《五行精紀》 관찰 창에 `李仝曰`·`曇瑩曰` 경계가 끼는가 | **현재 창에서는 미관찰; 부재로 승격하지 않음** | 확인된 시작·연속 창에 직접 표지 없음 |
| 외부 《珞琭子》에서 세 textual layer가 분리되는가 | **direct contrastive observation** | NLC `121839` p.8–9 및 주변 p.7–10 |
| 《五行精紀》가 `一日主四箇月·三日為一年`까지 수용했는가 | **unresolved** | 직접 확인한 卷33 창에 `李仝曰`와 그 확장 문구가 없음 |

따라서 이번에 승격하는 최소 문장은 다음이다.

> 장서각 木板本·NLC 乙亥字本·NLC 필사본의 卷33 「大運」에서 `...窮通變以為玄 → 王氏注云 → 夫運者人生之傳舍...`라는 본문-주석 인접 경계와 후속 주석의 연속성이 반복된다. 연세대 乙亥字本 viewer 창도 같은 순서를 시각적으로 보조한다. 이 반복은 bounded compositional/textual correspondence이지만, `李仝` gloss의 수용·생략·복원, 특정 공통조상, 판본 선후 또는 편찬 의도를 말해 주지 않는다.

## 2. 직접 대조한 witness와 재현 locator

PDF/DJVU page number는 디지털 sequence다. printed folio, 葉次, 기관 catalog locator로 재명명하지 않는다.

| witness | 공식/기관 경로 | 직접 확인 창 | artifact identity와 경계 |
| --- | --- | --- | --- |
| 장서각 `K3-437` 木板本 | [공식 record](https://jsg.aks.ac.kr/dir/view?dataId=JSG_K3-437), [006책 PDF](https://jsg.aks.ac.kr/data/serviceFiles/pdf/K3-437_006.pdf) | PDF p.71: `卷第三十三 / 大運`, 본문 끝 직후 `王氏注云`; pp.72–74: 같은 주석 연속부 | `/tmp/current-witness-review/K3-437_006.pdf`, 134쪽, SHA-256 `335a1c03c7af246969e00667d6a4d9756b19c19d93539223bb871c47001a24cd`; PDF p.71–74만 디지털 locator |
| NLC `KOL000000585` 乙亥字本 | [KORCIS record](https://www.nl.go.kr/korcis/search/popup/contentsInfo.do?controlNo=KOL000000585), [원문 viewer](https://viewer.nl.go.kr/nlmivs/viewWonmun_js.jsp?cno=KOL000000585) | supplied PDF p.103: 같은 본문 끝→`王氏注云`; pp.104–106: 연속 산술/방향 주석; 기존 audit의 p.110 및 p.145–151 continuation/closing checks | `/Users/softie/Downloads/KOL000000585.pdf`, 152쪽, SHA-256 `ec32fa58149a7ae3616a3110cb27edfcad45a797a6a91eeb621ab692e5be3170`; 원본은 읽기·렌더만 하고 이동/복사하지 않음 |
| NLC `data_892,2621,209456` 제6책 필사본 | [NLC 귀속 공개 scan](https://commons.wikimedia.org/wiki/File%3ANLC892-2621-209456_%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80_%E7%AC%AC6%E5%86%8A.pdf) | p.49: `卷第三十三 / 大運` 및 본문 끝→`王氏注云`; pp.50–56: 후속 주석 연속부 | `/tmp/nlc-china-wuxingjingji-v6.pdf`, 56쪽, SHA-256 `70182a2939a52ae896be1ac8a472cd43a0215816071419edf2971f8949833ed4`; 공개 derivative·printed locator·raw official bytes는 분리 |
| 연세대 乙亥字本 | [공식 catalog](https://library.yonsei.ac.kr/search/detail/CATTOT000000200707), user-supplied viewer capture | viewer `33/80`–`37/80`에서 `卷第三十三 / 大運`, 본문형 문장 및 `王氏注云` 뒤 순서가 시각적으로 보임 | viewer sequence만 직접 visual evidence; exact item↔frame machine binding, raw bytes, printed locator unresolved. [기존 bounded visual record](./saju-yonsei-wuxingjingji-visual-page-witness-successor-v2.md) |

세 Wuxing scan의 시작면을 각각 다음처럼 판독했다.

```text
K3-437 p.71:
  運行則一辰十歲折除乃三日為年精休旺以為妙窮通變以為玄
  王氏注云夫運者人生之傳舍推命之說...

NLC KOL000000585 p.103:
  運行則一辰十歲折除乃三日為年精休旺以為妙窮通變以為玄
  王氏注云夫運者人生之傳舍推命之說...

NLC manuscript p.49:
  運行則一辰十歲折除乃三日為年精休旺以為妙窮通變以為玄
  王氏注云夫運者人生之傳舍推命之說...
```

이 표기는 modern punctuation이나 OCR 정규화가 아니라 원면에서 확인한 구두점 없는 연속 문자 조각을 보존한 것이다. `王氏`는 《五行精紀》의 직접 표지로 기록할 뿐, `王廷光`이라는 외부 witness의 전체 주석층과 동일하다고 확정하지 않는다.

## 3. 앞뒤 주석 경계 대조

### 3.1 《五行精紀》에서 직접 확인된 bounded boundary

| 구간 | 직접 관찰 | 안전한 해석 |
| --- | --- | --- |
| 본문 끝 | `...窮通變以為玄` | 해당 卷33 opening formula의 관찰된 종결부 |
| 직후 | `王氏注云` | local Wang-attribution marker; 본문과 주석의 인접 경계 |
| 다음 문장 | `夫運者人生之傳舍推命之說...` | `王氏注云` 뒤의 주석 시작부 |
| 다음 면들 | 12시·삼일·360일·대운 방향·worked example·`今人行運多用約法` 계열 | 앞 표지와 연결된 주석 연속부로 직접 관찰 |
| 다른 표지 | 확인 창에서 `李仝曰`·`曇瑩曰` 미관찰 | 해당 표지의 《五行精紀》 수용 여부는 unresolved; omission 아님 |

K3 pp.71–74, NLC KOL pp.103–106, 그리고 필사본 pp.49–56에서 이 순서가 반복된다. NLC KOL의 더 뒤 p.110 및 p.145–151은 기존 audit에서 卷33 continuation과 closing window로 점검했지만, 이를 인쇄 folio나 전체 책의 완전한 부재 증명으로 확대하지 않는다.

### 3.2 비교용 《珞琭子》 layer boundary

NLC `data_892,411999013121,121839`의 직접 원면은 같은 기초 문장 뒤에 더 세분된 표지를 보인다.

```text
본문:       運行則一辰十歲折除乃三日為年...
그 뒤:      王廷光曰       (산술 설명 단락)
이어:       李仝曰         ...三日為一年是一日主四箇月...
그 뒤:      曇瑩曰         (다음 발화 표지)
```

직접 확인한 derivative identity는 `/tmp/nlc-121839.pdf`, 61쪽, SHA-256 `0178cd148efcfd3f69741b6b45024f13b9e1aeb845cbb2a471f35adb59699c1a`다. NLC 기관 경로는 [record route](https://read.nlc.cn/allSearch/searchDetail?fid=411999013121&indexName=data_892&searchType=10024&showType=1), 공개 scan derivative는 [NLC-attributed scan](https://commons.wikimedia.org/wiki/File%3ANLC892-411999013121-121839_%E6%96%B0%E7%B7%A8%E5%9B%9B%E5%AE%B6%E6%B3%A8%E8%A7%A3%E7%B6%93%E9%80%B2%E7珞琭子%E6%B6%88%E6%81%AF%E8%B3%A6_%E7%AC%AC1%E5%86%8A.pdf)으로 분리한다.

이 비교면이 직접 지지하는 것은 textual layer의 **표지 순서**뿐이다. 따라서 다음과 같은 대응은 허용하지 않는다.

```text
五行精紀 `王氏注云` == 珞琭子 `王廷光曰`의 동일 copy source
五行精紀에 안 보이는 `李仝曰` == 편찬자가 의도적으로 생략한 문장
五行精紀의 `三日為年` == 李仝 gloss의 `三日為一年`으로 자동 교정
```

## 4. Transmission pattern gate

### Directly promoted

- 세 기관/재료의 《五行精紀》 scan에서 본문 끝 `...窮通變以為玄`과 직후 `王氏注云`의 반복 인접성.
- 각 시작면 뒤의 다음 면들이 별도 새 attribution 없이 같은 `王氏注云` 주석 연속부로 진행되는 bounded observation.
- 연세대 viewer `33/80`–`37/80`의 같은 권차·순서에 대한 bounded visual corroboration.
- 외부 《珞琭子》 면에서 본문·`王廷光曰`·`李仝曰`·`曇瑩曰`이 실제 발화 경계로 분리된다는 contrastive direct observation.

### Not promoted

- 《五行精紀》가 `李仝曰` 아래 `一日主四箇月·三日為一年`을 실제로 수용했다는 claim.
- `李仝曰` 또는 `曇瑩曰`이 관찰 창에 없다는 사실을 copy-wide omission, 삭제, 편찬 의도로 해석하는 claim.
- 《五行精紀》의 `王氏注云`을 특정 王廷光 witness의 동일 주석 원천으로 묶는 claim.
- 장서각·NLC·연세대 사이의 특정 common ancestor, 판본 선후, textual independence, 후대 전사 방향, edition/textual lineage.
- `三日為年`을 `三日為一年`으로 고치거나 `一時十日·一日四月` 같은 현대 계산 규격으로 확장하는 claim.
- 원작자/편찬자 의도, 정본성, semantic authority, interpretation readiness, production activation.
- NLC·연세대 viewer의 raw bytes, exact machine binding, printed folio locator.

## 5. Validation and preservation

이번 bounded check에서 수행한 검증은 다음에 한정한다.

- 공식 장서각 record와 `K3-437_006.pdf` route를 확인하고, PDF pp.71–74를 렌더·시각 판독.
- NLC `KOL000000585.pdf`를 변경하지 않고 p.102–106을 렌더·시각 판독; 기존 audit의 continuation checks와 대조.
- NLC 필사본 공개 derivative p.48–51을 추가 렌더하고 기존 p.49–56 관찰과 대조.
- NLC `121839` 비교 scan p.7–10을 렌더해 본문 뒤 `王廷光曰 → 李仝曰 → 曇瑩曰` 표지 경계를 시각 판독.
- 위 source files의 실제 byte hash는 기존 artifact 기록과 대조했으며, 원본을 repository로 복사하지 않았다.
- 문서 추가 뒤 `git diff --check`, staged path allowlist, commit 후 status를 확인한다.

다음은 이 successor의 scope 밖이다.

- OCR 결과를 canonical text·rare variant·shared error로 채택.
- PDF page index를 printed locator로 승격.
- `王氏注云`의 source identity, 계보, 정본성 또는 semantic authority 확정.
- 대용량 원본, 기존 audit, 코드, fixture 또는 unrelated dirty work 수정.

이 문서의 publication allowlist는 정확히 다음 하나다.

```text
docs/saju-wuxingjingji-vol33-repeated-citation-boundary-successor-v1.md
```

기존 tracked/untracked 변경과 대용량 원본은 이 successor의 대상이 아니며 그대로 보존한다.
