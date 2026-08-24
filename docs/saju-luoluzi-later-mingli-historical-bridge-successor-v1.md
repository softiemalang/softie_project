# 《珞琭子》→후대 명리 문헌 historical bridge successor v1

기준일: `2026-08-24 KST`

이 문서는 기존 《五行精紀》·《珞琭子》·《三命通會》·《淵海子平》 provenance 문서를 덮어쓰지 않는 additive successor다. 이번 승격 범위는 **실제 원면에서 닫힌 문구·계산 구조의 bounded bridge**뿐이다. `李仝曰`의 명시적 인용·특정 계보·판본 선후·현대 계산 규격·semantic authority·readiness는 닫히지 않았으므로 승격하지 않는다.

## 1. 판정 요약

```text
珞琭子賦注 본문/주석면의 三日為年                         direct
李仝曰 一日主四箇月 / 三日為一年                       direct (근접 주석 witness)
三命通會 1578 viewer p.150–151의 三日 환산              direct first-party visual
淵海子平 1926 NLC p.79의 一辰十載 / 三日為年             direct scan page
淵海子平 99036 p.50의 折除三日以為一歲 + worked context  direct scan page
문구·계산 구조가 후대 문헌에 이어지는 bounded bridge       closed-bounded
후대 문헌이 李仝을 이름으로 인용/수용했다는 edge            unresolved
특정 copy·판본·공통조상·textual independence               unresolved
raw official page bytes / machine binding                   unresolved for NCL p.150–151
현대 一日四月·一時十日·rounding·endpoint 규격              derived or unresolved
semantic authority / interpretation readiness               blocked
production activation                                      blocked
```

따라서 이번에 닫힌 것은 다음의 좁은 명제다.

> `三日為年`이 후대 명리 문헌에서 `折除以三日為年`, `折除三日以為一歲`, `三日而成一歲`처럼 보존·확장되며, `淵海子平` 계열의 실제 면에서는 `一辰十載`와 절기까지의 일수·worked example 문맥으로 재배열된다. 이는 `李仝曰 一日主四箇月`의 명시적 후대 인용을 증명하지 않으며, 문구 유사성만으로 공통조상·직접 의존·정본성을 확정하지 않는다.

## 2. 직접 대조한 witness와 층위

### 2.1 기준층: 《珞琭子賦注》의 李仝 gloss

기존 direct-page successor의 CADAL/Zhejiang University 《珞琭子賦注·卷上》 `CADAL06054186` scan pp.16–20을 재사용한다. 임시 derivative의 identity는 3,054,819 bytes, SHA-256 `9727df290b07c3668145cb1a5baa0082a18717d41c9a2541950c819ee6756d6c`로 기존 문서에 고정되어 있다.

bounded page observation:

```text
p.16   運行則一辰十歲折除乃三日為年
p.17–18 一日之內十二時；凡三日有三十六時；
        三百六十日為一歲；三千六百日為一辰之十歲
p.19   甲子 example: 二十九日申時、五日三時、六十三時、
        六百三十日、一歲奇九月
p.20   李仝曰 ... 古法每行大運一辰十歲 ...
        一日主四箇月 ... 三日為一年
```

이 면은 `一日主四箇月`이 독립된 현대식 요약이 아니라, `李仝曰` 표지 아래 `三日為一年`과 함께 나타나는 **주석층 문구**임을 직접 보인다. 다만 이 scan은 《珞琭子賦注》의 후대 compilation witness이며, 원작자·송대 원면·후대 명리 문헌의 직접 source edge를 자동으로 닫지 않는다.

### 2.2 《三命通會》 만력 1578 witness

공식 NCL record는 `三命通會十二卷`, (明)萬民英撰, `明萬曆戊寅六年[1578]刊本`, 12책, `06589 / 306.5 06589`로 기록된다. 기관 record와 그 viewer 경로는 기존 [NCL 06589 adjudication](./saju-sanming-1578-official-viewer-adjudication-v1.md) 및 [NCL 공식 상세 record](https://rbook.ncl.edu.tw/NCLSearch/Search/SearchDetail?HasImage=&SourceID=1&item=69577a07b3444caf9b20e35e84a103e0fDcyODE10.578_oDtdzxby6wX5_W8cCvt1j5rqk4Hzy3GeKFoIIHA_&page=2&sourceWhereString=&whereString=IChEYXRlX0NyZWF0ZWQgbGlrZSAnJTE1NzglJyBvciBEb2N1bWVudF9ZZWFyIGxpa2UgJyUxNTc4JScgKSA1.IuMldaBSQarjxhBn_BeTs0yAImbyvOSAYg5y7FFSAGw_)에 남아 있다.

공식 viewer capture의 직접 관찰:

| viewer locator | direct page observation | 안전한 판정 |
|---|---|---|
| `150/1187` | `論大運`, `折除以三日為年`, `陽男陰女`, `陰男陽女`, `立春` example context | `三日` 환산·방향·절기 문맥 direct |
| `151/1187` | `論大運` continuation, `三日而成一歲` 계열 conversion/progression | `三日→一歲` 재서술 direct |

이 두 면에는 이번 확인 범위에서 `李仝曰` 또는 `一日主四箇月`가 직접 보이지 않는다. 따라서 《三命通會》가 Li Tong gloss를 이름으로 전사했다고 쓰지 않는다. 또한 `150/1187`·`151/1187`은 viewer index이지 printed folio가 아니다. 공식 원면 bytes와 viewer-to-raw derivation manifest도 확보되지 않았으므로 machine-level binding은 unresolved다.

### 2.3 《淵海子平》 NLC 1926 combined-print scan

NLC `data_416,13jh002326,46442`의 exact scan witness는 `MG/B992.3/33`, 民國十五年[1926] 文明書局·秦慎安校勘으로 기존 source identity에 기록되어 있다. 2,690,379 bytes, SHA-256 `96bc14ccb8fd6f90fb5ec33784846a9067f2cad45ab9730f12bdf9846ea7c265`이다. public derivative는 [NLC 46442 scan record](https://commons.wikimedia.org/wiki/File:NLC416-13jh002326-46442_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9E%E8%A9%AE_%E7%AC%AC1%E5%8D%B7.pdf)로, NLC official item identity와 Commons delivery surface는 분리한다.

실제 scan page direct observation:

```text
PDF/scan p.79, printed folio 三三, running title 新註淵海子平卷五,
heading/context 珞琚子消息賦:
    播四時以為年
    運行則一辰十載
    折除乃三日為年

PDF/scan p.80, printed folio 三四:
    위 구간의 continuation
```

여기서는 `十歲`가 아니라 `十載`라는 문자 변이가 직접 관찰된다. `三日為年`은 유지되지만 `李仝曰`·`一日主四箇月`은 이 target page boundary에서 직접 확인되지 않는다. 따라서 이 witness는 **문구의 보존·축약/배열 변형**을 직접 지지하지만, Li Tong 주석층의 명시적 수용을 지지하지 않는다.

### 2.4 《淵海子平》 NLC 99036 timing witness

NLC official record `data_416 / 15jh007754 / reader object 99036.0`는 `淵海子平 子平真詮`, `文明書局[印行者]`, `[192-?]`로 기록된다. 기존 direct scan identity는 209 pages, 6,429,274 bytes, SHA-256 `fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f`이다. 이번 live reader permission check는 `success:false`와 `您没有访问权限`을 반환했으므로 official raw-page access는 새로 닫히지 않았다. 기존 exact scan/page observation만 사용한다.

```text
PDF/scan p.50, printed 三二, 論起大運法:
    凡起大運俱從所生之日
    陽男陰女順行 / 陽女陰男逆行
    過去節俱折除三日以為一歲
    立春 worked example context

PDF/scan p.51, printed 三三:
    論行小運法 및 이어지는 worked-example context
```

이 witness는 `三日`을 단순 표어가 아니라 출생일에서 절기까지의 거리와 direction, example를 묶는 계산 문맥에 배치한다. 그러나 target page에서 `一日主四箇月`가 직접 보이지 않으며, whole-volume absence를 주장하지도 않는다.

## 3. bounded correspondence 판정

| 비교 항목 | 기준층 | 《三命通會》 1578 | 《淵海子平》 NLC 1926 / 99036 | 판정 |
|---|---|---|---|---|
| 3일 단위 | `三日為年` | `折除以三日為年`; `三日而成一歲` | `折除乃三日為年`; `折除三日以為一歲` | direct textual family correspondence |
| 辰 단위 | `一辰十歲` | target captures do not establish exact `一辰` literal in both pages | `一辰十載` direct at p.79; 99036 target is `論起大運` | `十歲/十載` variant only; no normalization |
| 일·월 gloss | `李仝曰 一日主四箇月` | not directly observed | not directly observed in inspected target pages | named gloss transmission unresolved |
| 절기까지 거리 | `實歷過日時`, `五日三時` example | `立春` example context direct | `未來/過去節`, `立春` and start-fortune examples direct | calculation-context correspondence; no modern rule |
| detailed arithmetic | CADAL p.17–19 direct `12時/36時/360日` and `甲子` example | p.150–151 direct conversion/progression fragments | NLC 46442 p.79 clause; 99036 p.50 worked context | bounded structure; no unified normalized formula |

### 3.1 bridge graph (correspondence overlay only)

```text
珞琭子賦注 direct page
  三日為年
  李仝曰 一日主四箇月 / 三日為一年
        │  formula/structure correspondence only
        ├── 三命通會 1578 p.150–151
        │     折除以三日為年 / 三日而成一歲
        └── 淵海子平 NLC 1926 p.79, NLC 99036 p.50–51
              一辰十載 / 折除乃三日為年 /
              折除三日以為一歲 + 節氣 distance/examples
```

위 선은 `textual correspondence`를 뜻하며 `direct transmission`, `common ancestor`, `same edition`, `independence`를 뜻하지 않는다. `李仝曰` 경계가 후대 문헌의 target page에 반복되지 않았으므로, **named-gloss bridge는 닫히지 않았다**. 이번 successor가 닫는 것은 그보다 좁은 **formula-level historical bridge**다.

## 4. 승격·보류 경계

### 승격한 것

- 실제 scan/viewer page에서 `三日為年`의 직접적인 후대 문구 변이(`折除以三日為年`, `三日而成一歲`, `折除三日以為一歲`)를 확인했다.
- 실제 scan page에서 `一辰十歲 → 一辰十載`의 문자 변이를 확인했다.
- `三日` 환산이 절기 방향·거리·worked example와 결합되는 계산 구조를 witness별로 분리 기록했다.
- 《珞琭子賦注》의 `李仝曰 一日主四箇月`을 후대 문헌의 직접 문구가 아니라 기준 주석층으로 유지했다.

### 승격하지 않은 것

- 《三命通會》·《淵海子平》가 `李仝`을 명시적으로 인용했다는 주장.
- 두 후대 문헌이 CADAL witness 또는 동일한 《珞琭子賦注》 계열에서 직접 전사했다는 주장.
- 특정 공통조상, 판본 선후, textual independence, 1578/1926 copy-level identity.
- `一日四月`, `一時十日`, 현대 `3일=1년` 계산 규격, endpoint·rounding·timezone.
- 원작자 의도, 정본성, semantic authority, interpretation readiness, production activation.

## 5. 재현·검증 artifact

이번 successor는 기존 direct observations를 새 source bytes로 덮어쓰지 않는 documentation-only overlay다.

- 기준 direct gloss: [기존 conversion claim successor](./saju-wuxingjingji-vol33-conversion-claim-successor-v1.md)
- 《三命通會》 official viewer artifact: [`artifacts/saju-sanming-1578-official-viewer-adjudication-v1/complete.json`](../artifacts/saju-sanming-1578-official-viewer-adjudication-v1/complete.json)
- 《淵海子平》·후대 문헌 source/page observations: [`src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js`](../src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js)
- 선행 parent adjudication: [`artifacts/saju-five-classics-research-continuation-v1/complete.json`](../artifacts/saju-five-classics-research-continuation-v1/complete.json)

검증 기준은 다음과 같다.

1. NLC/NTL/NCL catalog 또는 viewer metadata는 item identity layer로만 사용한다.
2. `PDF/scan p.`와 `viewer p.`를 printed folio로 바꾸지 않는다.
3. OCR·웹 전사는 locator aid로만 사용하고, 위 direct strings는 기존 exact-byte render 또는 first-party viewer capture observation을 기준으로 한다.
4. `formula bridge = closed-bounded`는 `named gloss/lineage/semantic authority = closed`를 의미하지 않는다.

최종 상태:

```text
historical formula bridge                 closed-bounded
李仝 named-gloss adoption in later texts  unresolved
copy/edition/textual lineage              unresolved
raw-byte/machine binding                  unresolved (NCL viewer target)
semantic authority                        blocked
interpretation readiness                  blocked
production activation                    blocked
```
