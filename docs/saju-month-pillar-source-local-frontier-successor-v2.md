# 月柱/月建 source-local frontier bounded successor v2

상태: `frontier advanced: direct full 12-branch enumeration and repeated all-five 寅-month starts`; `worked-example coverage 2/5; universal calculation/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 [v1 source-local frontier](./saju-month-pillar-source-local-frontier-successor-v1.md)의 additive successor다. 기존 문서와 《五行精紀》 witness 판정을 덮어쓰지 않는다. 이번 단계의 목적은 고전 원면에서 보이는 `月支` 순서와 `年干`별 寅月 시작干을 claim 단위로 넓히는 것이며, 생년월일시에서 현대적 月柱를 자동 산출하거나 특정 판본의 계보·정본성을 정하는 것이 아니다.

## 1. Bounded conclusion

### 1.1 12개월 月支 순서

공개된 NLC 귀속 scan의 《命理集成》 卷一 PDF p.50(인쇄면 `二九`)에서 다음 12행이 한 원면에 직접 보인다.

```text
正月建寅。二月建卯。三月建辰。四月建巳。
五月建午。六月建未。七月建申。八月建酉。
九月建戌。十月建亥。十一月建子。十二月建丑。
```

따라서 `寅→卯→辰→巳→午→未→申→酉→戌→亥→子→丑`의 **완전한 열거는 현재 한 page-level witness에서 direct**로 승격한다. 이는 v1의 `full twelve-branch table partial/unresolved`보다 좁혀진다.

다만 이 완전한 12행이 서로 독립적인 두 개 이상의 physical copy에서 반복되었다고 판정하지 않는다. 《子平命術要訣》 p.16, 《淵海子平》 p.50, 《三命通會》 p.109 및 《韋千里命學講義》 p.21–22에서는 `正月=寅`, `二月=卯`, 일부 `順行/十二月` 또는 월별 행만 직접 반복된다. 따라서 `12행 전체의 cross-copy repetition`과 특정 lineage는 여전히 unresolved다.

### 1.2 다섯 年干 계열의 寅月 시작점

《命理集成》 p.59(인쇄면 `三八`)의 `第二節 推月法`에서 다음 다섯 문장이 한 면에 직접 보인다.

```text
甲己年正月起丙寅。
乙庚年正月起戊寅。
丙辛年正月起庚寅。
丁壬年正月起壬寅。
戊癸年正月起甲寅。
```

《韋千里命學講義》 p.21–22(인쇄면 `六–七`)의 `起例問答`에도 각 年干 묶음에 대해 `正月皆為丙寅/戊寅/庚寅/壬寅/甲寅`으로 이어지는 적용열이 직접 보인다. 그러므로 **다섯 묶음의 寅月 시작점은 서로 다른 제목의 page image에서 direct explicit/application surface로 반복**된다고 승격한다.

여기서 `application surface`와 `named worked birth example`을 분리한다.

- `命理集成` p.59와 `韋千里命學講義` p.21–22: 다섯 묶음 모두 직접 명시된 규칙·적용열.
- 《淵海子平》 p.50: `如甲子年 ... 正月建丙寅`, `如乙丑年 ... 正月起戊寅`이라는 이름 붙은 worked example은 `甲己`, `乙庚` 두 묶음만 직접 확인.
- `丙辛`, `丁壬`, `戊癸`에 대해서는 이번 inspected page set에서 별도 출생일 입력을 가진 named worked output을 3건 더 확인했다고 승격하지 않는다.

따라서 현재의 정확한 표현은 `five-group 寅-month start mapping: direct repeated application rule; named worked example: 2/5`이다. 이것은 보편 생성기나 모든 입력에 대한 `月柱` 함수가 아니다.

## 2. Direct page evidence

### 2.1 NLC511-attributed 《命理集成》 卷一 p.50 / printed `二九`

- [public scan PDF](https://upload.wikimedia.org/wikipedia/commons/d/d3/NLC511-04101394-70574_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90_%E5%8D%B7%E4%B8%80.pdf#page=50)
- local review derivative: `/private/tmp/month-pillar-review/NLC511-70574-mingli-jicheng-vol1.pdf`
- local review PDF: 98 pages; SHA-256 `62611d493faf8caddc6ff44553b14ca0dba141728bd40851d0d1b3fccaadbbef`

`第二節 十二月建`에서 `正月建寅`부터 `十二月建丑`까지를 한 페이지의 연속된 세로 문맥으로 직접 확인했다. 이 page image는 full 12-branch enumeration의 direct witness다.

이 파일은 공개된 NLC 귀속 derivative scan이다. `NLC511-04101394-70574`라는 파일 식별 문자열 외에 기관 record와 공개 파일의 raw-byte derivation 및 exact machine binding은 이 문서에서 확정하지 않는다. 따라서 이 면은 page-level direct evidence이지, 기관 원본 byte 또는 physical-copy independence의 확정이 아니다.

### 2.2 NLC416 `59235` 《命理集成》 p.59 / printed `三八`

- [Commons file record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf)
- [public scan PDF](https://upload.wikimedia.org/wikipedia/commons/c/c3/NLC416-13jh001663-59235_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90.pdf#page=59)
- local review derivative: `/private/tmp/month-pillar-review/NLC416-59235-mingli-jicheng.pdf`
- local review PDF: 350 pages; SHA-256 `dbb50d8f5daf8a30269273a3e5dc787133deabd944e76e28d592e58a97348501`

`第二節 推月法`에서 `以節令為綱`과 다섯 `正月起...寅` 문장을 직접 확인했다. 이 면은 12개월 전체 표가 아니라, 다섯 年干 묶음의 寅月 시작점을 명시하는 direct rule surface다. 이 문헌의 편집·수록 관계나 《五行精紀》와의 계보는 판정하지 않는다.

### 2.3 《韋千里命學講義》 p.21–22 / printed `六–七`

- [public scan PDF](https://upload.wikimedia.org/wikipedia/commons/c/c5/NLC416-01jh000368-10155_%E9%9F%8B%E5%8D%83%E9%87%8C%E5%91%BD%E5%AD%B8%E8%AC%9B%E7%BE%A9.pdf)
- local review derivative: `/private/tmp/month-pillar-review/NLC416-10155-weilq.pdf`
- local review PDF: 368 pages; SHA-256 `7b34ea70ffdfbf9207a4516a42f5eb5b7008649ce95be1bf07601a1fb299daeb`

`起例問答`의 앞뒤 면에서 `如甲子年`의 월柱 적용과, 다섯 年干 묶음의 `正月皆為...寅` 적용열을 직접 확인했다. 이 spread는 다섯 시작점의 두 번째 direct application surface이지만, 다섯 개가 각각 독립적으로 날짜·출생시각을 가진 worked chart라는 뜻으로 확장하지 않는다. `十二月建` 열거는 이 spread에서 마지막 `丑`까지 완전하게 닫혔다고 세지 않는다.

### 2.4 NLC `99036` 《淵海子平》 p.50 / printed `三二`

- [NLC record route](https://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=15jh007754)
- [public scan PDF](https://upload.wikimedia.org/wikipedia/commons/1/11/NLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9E%E8%A9%AE.pdf#page=50)
- local review derivative: `/private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf`
- local review PDF: 209 pages; SHA-256 `fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f`

`論起大運法`에서 다음 두 결합을 직접 확인했다.

```text
如甲子年。甲己之年丙作首。正月建丙寅。
如乙丑年。乙庚之歲戊為頭。正月起戊寅。
```

이 page는 다섯 묶음 중 `甲己`와 `乙庚`의 named worked output만 직접 제공한다. 두 사례의 뒤 大運 문장은 月柱 산출과 별도 claim으로 남긴다.

### 2.5 기존 direct surfaces

- 《子平命術要訣》 p.16: `寅月即舊歷正月。卯月即舊歷二月。順推至所生之月止` 및 다섯 묶음 mnemonic. [public scan p.16](https://upload.wikimedia.org/wikipedia/commons/c/c7/NLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf#page=16)
- 《三命通會》 p.109: `正月起丙寅二月丁卯順行十二月` 및 다섯 묶음 mnemonic. [public scan p.109](https://upload.wikimedia.org/wikipedia/commons/2/23/NLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf#page=109)

위 두 면은 `正月/二月` anchor와 ordered progression 또는 mnemonic의 반복을 보강하지만, 새 full 12-row table 또는 다섯 named worked chart로 세지 않는다. 첫 링크의 파일명은 URL 인코딩된 공개 scan 경로이며, 기관 raw bytes의 exact binding은 별도 blocker다.

## 3. Claim-level adjudication

| claim | status | 현재 승격 가능한 표현 | 보존할 한계 |
|---|---|---|---|
| `正月建寅 … 十二月建丑` 12행 전체 | `direct, single page-level witness` | NLC511-attributed 《命理集成》 p.50의 한 면에 연속 인쇄된 전체 열거 | 독립 physical copy 반복, 기관 raw-byte binding, 특정 계보 |
| `正月→寅`, `二月→卯` | `direct repeated` | 子平命術要訣 p.16, 淵海子平 p.50, 三命通會 p.109 및 관련 spread의 직접 anchor | 모든 월령의 독립성, 현대 index/cycle 함수 |
| `寅→…→丑` 순서가 다른 witness에서도 모두 반복 | `unresolved / partial corroboration` | full order는 위 NLC511 p.50에서 direct; 다른 면은 일부 rows·順行 wording만 보강 | 두 번째 full enumeration이 닫힐 때까지 cross-copy repetition으로 승격하지 않음 |
| `甲己→丙寅` | `direct repeated; named worked 1 case` | 命理集成 p.59, 韋千里 p.21–22; 淵海子平 p.50 `如甲子年` | 《五行精紀》 채택, universal generator |
| `乙庚→戊寅` | `direct repeated; named worked 1 case` | 命理集成 p.59, 韋千里 p.21–22; 淵海子平 p.50 `如乙丑年` | 같은 한계 |
| `丙辛→庚寅`, `丁壬→壬寅`, `戊癸→甲寅` | `direct repeated application rule; named worked unresolved` | 命理集成 p.59와 韋千里 p.21–22에서 각 `正月...寅` 적용열 직접 확인 | 별도 출생 입력을 가진 worked output 3건, 《五行精紀》 전이 |
| 다섯 시작점이 고전 원면에서 반복됨 | `direct repeated, source-local` | 두 제목의 page image에서 동일 mapping family를 직접 확인 | physical-copy independence, common ancestor, textual priority |
| 생년월일시→月柱/月建 자동 산출 | `unresolved` | 해당 원면의 節·月支·年干 문장과 사례를 각각 보존 | 현대 절기 API, timezone, 진태양시, endpoint, rounding |
| 《五行精紀》 卷33이 위 규칙을 직접 채택 | `unresolved` | 없음; 외부 문헌을 卷33 evidence로 전이하지 않음 | copy-level binding 및 卷33 direct rule/page |
| edition/textual lineage·공통 저본·정본성 | `unresolved` | 반복되는 bounded textual correspondence만 기록 | 특정 선후·독립성·authority |
| semantic authority·interpretation readiness·production activation | `blocked` | page-level observation/replay locator만 유지 | semantic authority, 계산 규격, readiness, activation |

## 4. 독립성과 반복의 분리

```text
direct page observation
  ├─ 命理集成 卷一 p.50       : 12행 전체 月支 열거
  ├─ 命理集成 p.59            : 다섯 寅月 시작점 명시
  ├─ 韋千里命學講義 p.21–22   : 다섯 寅月 시작점 적용열
  └─ 淵海子平 p.50            : 甲己/乙庚 named worked output

bounded corroboration
  ├─ 子平命術要訣 p.16        : 正月=寅·二月=卯·five-group mnemonic
  └─ 三命通會 p.109           : 正月丙寅·二月丁卯·順行十二月·mnemonic

아직 말할 수 없음
  ├─ 공개 scan 간 physical-copy independence와 raw-byte derivation
  ├─ 12행 전체의 second independent direct enumeration
  ├─ 丙辛/丁壬/戊癸의 named worked chart
  ├─ 《五行精紀》 卷33의 직접 채택
  ├─ 특정 공통 저본·판본 선후·textual lineage·정본성
  └─ 현대 계산 규격·semantic authority·readiness·activation
```

서로 다른 제목, NLC 식별 문자열, PDF 파일 또는 기관/미러 경로의 수를 physical-copy 독립성의 수로 세지 않는다. 특히 공개 derivative의 page image를 확인했다는 사실은 기관 원본 byte·machine binding·판본 계보를 자동으로 닫지 않는다.

## 5. 현재 source-grounded flow의 최대 범위

현재 직접 연결 가능한 표현은 다음으로 제한한다.

```text
if a source page explicitly enumerates month branches:
    retain that page's literal 12-row order as a single-witness observation
else if it gives only 正月/二月 or 順行 wording:
    retain only those printed anchors/wording

if a source page explicitly prints 年干-group + 正月 + 寅 month-stem:
    retain the five-group mapping as a source-local application rule
if a named birth example prints the combined 月干支:
    retain only that example's literal output
else:
    named_worked_output = unresolved

never infer from these pages alone:
    五行精紀 卷33 adoption, universal 月柱 generator,
    physical-copy lineage, semantic authority, modern readiness
```

이는 `節境界→月支→年干→月干`의 관찰 순서를 보존할 뿐이다. `節` 경계의 정확한 시각과 현대 시간계산, 월柱와 月建의 현대적 동일시, 생산 시스템 활성화는 이 successor의 범위 밖이다.

## 6. Reproduction and Git boundary

원본 PDF를 repository에 복사하지 않고, temporary review bytes와 기존 연구자료를 수정·삭제하지 않는다. 다음 명령은 이미 확보된 local derivative에서 해당 page image와 hash를 재현하기 위한 것이다.

```bash
pdftoppm -f 50 -l 50 -r 300 -png \
  /private/tmp/month-pillar-review/NLC511-70574-mingli-jicheng-vol1.pdf \
  /private/tmp/current-witness-review/month-nlc511-p50
pdftoppm -f 59 -l 59 -r 300 -png \
  /private/tmp/month-pillar-review/NLC416-59235-mingli-jicheng.pdf \
  /private/tmp/current-witness-review/month-jicheng-p59
pdftoppm -f 21 -l 22 -r 300 -png \
  /private/tmp/month-pillar-review/NLC416-10155-weilq.pdf \
  /private/tmp/current-witness-review/month-weilq-p
pdftoppm -f 50 -l 50 -r 300 -png \
  /private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf \
  /private/tmp/current-witness-review/month-yuanhai-p50
shasum -a 256 /private/tmp/month-pillar-review/NLC511-70574-mingli-jicheng-vol1.pdf
shasum -a 256 /private/tmp/month-pillar-review/NLC416-59235-mingli-jicheng.pdf
shasum -a 256 /private/tmp/month-pillar-review/NLC416-10155-weilq.pdf
shasum -a 256 /private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf
```

이 문서의 atomic commit allowlist는 이 새 successor 파일 하나다. 현재 working tree의 unrelated tracked scripts 및 untracked Wonkwang/Sonkeik 자료는 stage·수정·삭제하지 않는다. 원본 대용량 PDF는 `/private/tmp` 밖으로 복사하지 않는다.

최종 bounded frontier:

```text
12개월 月支 전체 열거             direct, single witness (NLC511 p.50)
12행 전체의 cross-witness 반복      unresolved; partial anchors only
五年干 묶음 寅月 시작점             direct repeated application rule
named worked 月柱                  甲己/乙庚 2/5 direct; 나머지 unresolved
《五行精紀》 卷33 채택              unresolved
copy/edition/lineage                unresolved
semantic authority/readiness         blocked
modern calculation/activation        blocked
```
