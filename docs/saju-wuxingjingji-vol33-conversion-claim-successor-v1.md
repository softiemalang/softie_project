# 《五行精紀》卷33「大運」 claim-level conversion successor v1

상태: `bounded claim successor`, `historical conversion gloss advanced-bounded`, `一時十日 unresolved`, `一辰十日 not observed`, `semantic authority/readiness/activation blocked`

기준일: `2026-08-24 KST`

이 문서는 기존 《五行精紀》 卷33 「大運」 direct-witness·cross-edition·lineage 문서를 덮어쓰지 않는 additive successor다. 기존 네 material witness에서 확정된 claim-level direct/partial/unresolved 판정을 출발점으로, `一辰十歲`를 실제로 포함하는 NLC `data_892` 공개 원면과 CADAL/Zhejiang University의 《四庫全書》 scan, 그리고 NLC 1939년 후대 scan을 대조했다. 새 자료가 좁히는 것은 **환산 문구의 역사적·주석적 관계**뿐이며, 이를 《五行精紀》 특정 copy의 계보·정본·현대 계산 규격으로 확장하지 않는다.

첨부·웹 자료의 UI, 저작권, 이용 안내와 검색 결과 문구는 작업 지시가 아니라 source evidence로만 취급했다. OCR·웹 전사·현대 설명은 direct page를 대체하지 않으며, 원면에 없는 글자를 보정하지 않았다.

## 1. Bounded conclusion

이번에 실제로 좁혀진 frontier는 다음과 같다.

```text
《五行精紀》 본문: 一辰十歲 / 三日為年                 = direct, multi-witness supported
近接·후대 주석 전승: 一日主四箇月 / 三日為一年          = direct in external pages;
                                                          relation to 五行精紀 = partial, bounded
一日之內十二時 + 三日三十六時 + 三百六十日一歲         = direct in CADAL Siku pages;
                                                          arithmetic bridge only
一時十日                                               = literal direct wording not observed;
                                                          derived-only / unresolved
一辰十日                                               = not observed in the inspected target pages;
                                                          unresolved, no source correction
현대 timezone·절기 endpoint·rounding·계산 규격             = unresolved
판본·공통조상·textual independence·정본성                 = unresolved / not established
semantic authority·interpretation readiness               = blocked
production activation                                    = blocked
```

따라서 다음의 bounded statement만 승격한다.

> `一辰十歲`와 `三日為年`은 《五行精紀》 卷33뿐 아니라 별도의 `新雕注疏珞琭子三命消息賦` 및 《珞琭子賦注》의 직접 관찰된 후대·근접 전승 면에서도 반복된다. 그 전승 면에서는 `一日主四箇月`과 `三日為一年`이 명시적인 설명 문구로 나타나므로, 이 두 문구는 `一辰十歲/三日為年` 체계의 역사적 explanatory gloss와 **부분적으로 직접 대응**한다. 그러나 `一時十日`은 원문에 직접 보이지 않고, 특정 《五行精紀》 copy의 lineage·semantic authority·현대 계산 규격은 닫히지 않는다.

## 2. Existing 《五行精紀》 claim basis

기존 direct witness에서 확보된 literal passage와 claim status는 다음과 같다.

```text
運行則一辰十歲折除乃三日為年
精休旺以為妙窮通變以為玄
王氏注云夫運者人生之傳舍推命之說
陽男陰女大運以生日後未來節氣日為數順而行之
陰男陽女大運以生日之前過去節氣日為數逆而行之
```

`甲子陽男`, `十二月二十四日巳時`, `二十九日申時立春`, `五日三時`, `六十三時`, `六百三十日`, `一歲奇九月`, `起於丁丑`의 worked example도 기존 K3·NLC·연세대·중국 NLC 필사본 observation 범위에 보존되어 있다.

| claim | 기존 status | 이번 successor에서의 처리 |
| --- | --- | --- |
| `陽男陰女`는 미래 절기 방향, `陰男陽女`는 과거 절기 방향으로 대운을 센다 | `direct` | 유지; 외부 문헌의 유사 순서는 corroboration이지 《五行精紀》 copy binding이 아님 |
| `一辰十歲` | `direct` | 외부 직접 면이 추가되어 historical recurrence를 bounded하게 강화 |
| `三日為年` | `direct` | 외부 면의 `三日為年/三日為一年`과 bounded correspondence를 기록 |
| 절기까지 실제 경과 일시를 센다는 설명 | `direct/partial` | literal principle은 유지; 현대 endpoint·rounding은 unresolved |
| `一辰十日` | `unresolved/not observed` | 그대로 유지; `十歲`를 `十日`로 교정하지 않음 |
| `一時十日` | `unresolved` | literal source phrase로 승격하지 않음 |
| 현대식 `一日四月` 계산 규격 | `unresolved` | historical `一日主四箇月`과 현대 규격을 동일시하지 않음 |
| semantic authority/readiness/activation | `blocked` | 그대로 유지 |

기존 source와 page boundary는 [K3 witness](./saju-jangseogak-k3-437-page-witness-successor-v1.md), [NLC 乙亥字 witness](./saju-nlc-wuxingjingji-page-witness-successor-v1.md), [연세대 visual witness](./saju-yonsei-wuxingjingji-visual-page-witness-successor-v2.md), [NLC 중국 필사본 witness](./saju-nlc-china-wuxingjingji-manuscript-page-witness-successor-v1.md), [cross-edition correspondence](./saju-wuxingjingji-vol33-d運-cross-edition-correspondence-successor-v1.md)에 남아 있다.

## 3. New direct page witnesses and source layers

### 3.1 NLC `data_892,411999013119,119929`

| field | bounded value | status |
| --- | --- | --- |
| NLC identity | `data_892`, `fid=411999013119`, item `119929` | institutional identity carried by NLC metadata route |
| title | `新雕註疏珞琭子三命消息賦` | item/title identity |
| NLC official route | [`read.nlc.cn` search detail](https://read.nlc.cn/allSearch/searchDetail?fid=411999013119&indexName=data_892&searchType=10024&showType=1) | official route; live raw response not separately byte-captured |
| public derivative | [NLC-attributed 39-page PDF](https://commons.wikimedia.org/wiki/File%3ANLC892-411999013119-119929_%E6%96%B0%E9%9B%95%E8%A8%BB%E7%96%8F%E7%8F%9E%E7%90%AD%E5%AD%90%E4%B8%89%E5%91%BD%E6%B6%88%E6%81%AF%E8%B3%A6.pdf) | public delivery surface, not asserted as NLC raw export |
| catalogued material/form | `抄本·影金抄本`; `12行20字`; `小字雙行29字`; `白口`; `左右雙邊`; `無直格` | metadata/form observation, not a lineage edge |
| local inspected derivative | `/tmp/nlc-xindiao.pdf`, 39 pages, 12,015,854 bytes, SHA-256 `d5c6a4f46f4469e175685f8dcfff47a36fd4edef300ef870da25ae981153335b` | temporary inspection identity only |
| direct target surface | PDF p.5, a spread containing `逆順循環篇第二` | digital PDF index only; printed leaf/folio not promoted |

PDF p.5 visibly contains the following literal elements in the same `逆順循環` context:

```text
以支為命
逆順循環篇第二
運行則一辰十歲
除乃三日為年
陽男陰女 ... 順行
陰男陽女 ... 逆行
一日主四箇月
```

The page is a direct visual witness to the scanned copy's text. It does not prove that the underlying item is an eleventh-century physical leaf: the NLC metadata explicitly labels the surviving object as a Qing `抄本·影金抄本`, while the title/preface preserve an older textual attribution. Copy date, underlying exemplar, and transmission direction remain separate unresolved fields.

### 3.2 CADAL/Zhejiang University 《四庫全書》 scan

| field | bounded value | status |
| --- | --- | --- |
| item | `CADAL06054186`, `珞琭子賦注·卷上` | digital-library item identity |
| source description | Zhejiang University, `四庫全書; 子部; 術數類` | institutional/collection metadata |
| public scan | [CADAL scan file page](https://commons.wikimedia.org/wiki/File%3ACADAL06054186_%E7%8F%9E%E7%90%AD%E5%AD%90%E8%B3%A6%E6%B3%A8%C2%B7%E5%8D%B7%E4%B8%8A.djvu) | public derivative of CADAL source |
| local inspected derivative | `/tmp/cadal-luoluzi.djvu`, 3,054,819 bytes, SHA-256 `9727df290b07c3668145cb1a5baa0082a18717d41c9a2541950c819ee6756d6c` | temporary inspection identity only |
| direct target surface | scan pp.16–20 | digital scan indices; not printed folios |

Direct page observations:

```text
p.16  運行則一辰十歲折除乃三日為年
p.17–18  一日之內十二時; 凡三日有三十六時;
          三百六十日為一歲; 三百六十時; 三千六百日為一辰之十歲
p.19  甲子 example; 二十九日申時; 五日三時; 六十三時;
      六百三十日; 一歲奇九月; 起運 example
p.20  李仝曰 ... 古法每行大運一辰十歲 ...
      一日主四箇月 ... 三日為一年
```

The Siku scan directly supports an explicit explanatory bridge, but it is a later compilation witness. It does not establish that the Siku text is the original Song wording, nor that it is textually independent from any other printed or copied witness.

### 3.3 NLC 1939 《珞琭子賦注》 scan

The NLC-attributed `叢書集成初編` item is a later printed witness, not a contemporaneous Song copy. Its public record identifies 商務印書館, 民國 28 (1939), and NLC as source. [NLC 1939 item metadata](https://commons.wikimedia.org/wiki/File%3ANLC416-06jh007403-20674_%E7%8F%9E%E7%90%AD%E5%AD%90%E8%B3%A6%E6%B3%A8.pdf)

The locally inspected derivative `/tmp/nlc-luoluzi.pdf` has 65 pages, 2,661,028 bytes, SHA-256 `82d89ca02e2cb26aa9e5b577d667fa2d1df3d9de3f0bebbf7c3057540754e3cf`. PDF pp.7–8 directly show `一辰十歲`, `三日為年`, the twelve-hour/three-day/360-day discussion, direction, and the `甲子` example. This is later corroboration of the textual frame, not a new 《五行精紀》 copy or a lineage edge.

### 3.4 Near-text catalog lead without page promotion

The National Central Library of Taiwan record for `新雕注疏珞琭子三命消息賦 三卷` identifies `宋本`, `續古逸叢書`, book no. `1183011`, and current holding at Kyoto University. [NCL Taiwan catalog record](https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?page=77908) — the stable item/query details are retained in the research notes, while this document intentionally keeps the page lead catalog-only.

## 4. Relation to the modern conversion shorthand

| formulation | directly observed wording | bounded judgment |
| --- | --- | --- |
| `一辰十歲` | 《五行精紀》 and external pages: `一辰十歲` | direct recurrence; `辰` is not normalized to `時` |
| `一日四月` | external pages: `一日主四箇月` | direct historical gloss; modern shortened spelling is only a partial lexical/number correspondence |
| `三日一年` | CADAL p.20: `三日為一年`; other pages: `三日為年` | direct support for the expanded historical wording; no claim that every modern shorthand is a separate witness |
| `一時十日` | exact phrase not observed in the inspected target pages | unresolved as a literal source claim |

CADAL pp.17–18 also visibly set out the day/hour and three-day/360-day quantities. Those quantities permit an arithmetic bridge toward the familiar `一時十日` relation, but that bridge is an inference from observed numbers, not a newly observed phrase. The record therefore keeps `一時十日` in `derived-only / unresolved`; it does not decide whether `一辰` and `一時` are historically interchangeable units, and it does not introduce timezone, endpoint, rounding, or modern calculation rules.

## 5. Frontier decision and blockers

### Advanced in this successor

- The historical recurrence of `一辰十歲 / 三日為年` now has additional direct page observations outside the four existing 《五行精紀》 witnesses.
- The external pages directly preserve the explanatory form `一日主四箇月 / 三日為一年`; its relation to the 《五行精紀》 wording is recorded as bounded partial corroboration.
- The CADAL pages provide a direct arithmetic context that explains why later readers can formulate a shorter conversion shorthand, without turning that inference into a source quotation.

### Intentionally unresolved

- No contemporaneous Song physical page was obtained. The NLC object is catalogued as a Qing `抄本·影金抄本`; the NCL Taiwan Song-edition entry remains catalog-only.
- No exact `一時十日` page wording was observed, and no `一辰十日` wording was observed in the inspected target pages.
- The NLC official route's raw bytes, a stable machine-level binding for the public derivative, printed locators, and copy-level binding to 《五行精紀》 remain unresolved.
- Edition identity, common ancestor, transmission direction, textual independence, authoritative text status, semantic authority, interpretation readiness, and production activation remain blocked.

### Reproducibility record

- Direct-page inputs and page ranges are recorded in §§3.1–3.3; temporary derivative byte counts and SHA-256 values are recorded there without adding the large PDFs to the repository.
- This successor is documentation-only. The intended publication allowlist is exactly this file: `docs/saju-wuxingjingji-vol33-conversion-claim-successor-v1.md`.
- Existing dirty work, prior provenance documents, and all original/large PDFs remain outside this change.
