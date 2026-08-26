# 月柱/月建 source-local frontier bounded successor v1

상태: `frontier advanced: independent page-level corroboration for ordered month progression and five stem-group mnemonic`; `universal calculation/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 기존 [起運 source-grounded flow](./saju-dayun-source-grounded-flow-successor-v1.md)와 [first 大運 directional progression](./saju-dayun-first-pillar-directional-progression-successor-v1.md)를 덮어쓰지 않는 additive successor다. 목표는 생년월일시에서 月柱/月建을 산출한다고 일반화하는 것이 아니라, 직접 원면에서 확인된 다음 source-local 관계를 claim 단위로 분리해 기록하는 것이다.

```text
source가 적은 節境界 전후 관계
  → source가 선택한 해당/앞선 月의 遁干支
  → 직접 보이는 月支 anchor(正月=寅, 二月=卯)
  → 12개월을 순행한다는 source wording
  → 年干 다섯 묶음의 寅月 시작干 mnemonic
```

이번에 추가로 닫힌 것은 서로 다른 고전 제목의 page image에서 위 순서의 일부가 반복된다는 점이다. 이것은 textual correspondence/corroboration이며, physical-copy independence·공통 저본·직접 계보·정본성을 뜻하지 않는다.

## 1. Bounded conclusion

### 1.1 節境界에서 월의 干支로 가는 source-local fragment

NLC 식별자를 가진 공개 scan의 《子平命術要訣》 PDF p.16(인쇄면 `十二`)에는 `推月之法` 아래 `以節氣為綱`이 직접 보이고, 본월의 節 전후에 따라 본월 또는 상월에 해당하는 `所遁干支`를 취하는 문장이 이어진다. 이 면은 **그 witness가 節境界를 월 선택의 기준으로 쓴다**는 것을 직접 지지한다.

이 fragment는 한 page surface의 source-local 규칙이다. 이 면을 《五行精紀》 卷33의 미관찰 생년월일시→月柱 단계에 전이하지 않으며, 현대의 절기 API·timezone·진태양시·경계 연산자로 번역하지 않는다.

### 1.2 月支 progression

같은 p.16에는 `寅月即舊歷正月。卯月即舊歷二月。順推至所生之月止`가 직접 보인다. 별도 scan의 《三命通會》 p.109(인쇄면 `三一`)에는 다음 문장이 직접 보인다.

```text
遁月即甲己之年正月起丙寅二月丁卯順行十二月
```

따라서 다음은 현재 bounded direct claim으로 승격한다.

- `正月`이 `寅`을, `二月`이 `卯`를 가리키는 대응이 서로 다른 고전 제목의 page image에서 반복된다.
- `順行十二月`이라는 12개월 진행 지시가 《三命通會》 p.109에 직접 보이고, 《子平命術要訣》 p.16의 `順推` 및 `寅/卯` 대응과 결합해 **월 위치를 순서대로 진행하는 textual pattern**이 반복된다.

다만 inspected pages에 `寅·卯·辰·巳·午·未·申·酉·戌·亥·子·丑`의 12행 표가 모두 직접 인쇄된 것은 아니다. 그러므로 `full twelve-branch table`이나 모든 월령의 완전한 출력표는 `partial/unresolved`로 유지한다.

### 1.3 年干→寅月 月干 mnemonic

《子平命術要訣》 p.16의 `遁月法`과 《三命通會》 p.109의 `古歌曰`에서 다음 다섯 묶음이 각각 직접 반복된다.

| 年干 묶음 | 원면 mnemonic에서 읽히는 寅月 시작干 | 직접 근거 | 판정 |
|---|---|---|---|
| `甲己` | `丙` | p.16 `甲己之年丙作首`; p.109 같은 구절; 《淵海子平》 p.50 `正月建丙寅` | `direct repeated`, named example corroborated |
| `乙庚` | `戊` | p.16 `乙庚之歲戊為頭`; p.109 같은 구절; 《淵海子平》 p.50 `正月起戊寅` | `direct repeated`, named example corroborated |
| `丙辛` | `庚` | p.16 `丙辛之歲尋庚起`; p.109 같은 구절 | `direct repeated mnemonic only` |
| `丁壬` | `壬` | p.16 `丁壬壬位順流行`; p.109 `丁壬壬位順行流` | `direct repeated mnemonic only` |
| `戊癸` | `甲` | p.16 `更有戊癸何方發。甲寅之上好追求`; p.109 `更有戊癸何處起。甲寅之上好追求` | `direct repeated mnemonic only` |

표의 두 번째 열은 source literal을 보존하기 위한 **bounded normalization annotation**이다. `丙辛·丁壬·戊癸`는 두 page에서 mnemonic이 반복된 것이지, 이번 inspected corpus에서 각 묶음의 별도 worked example이 모두 제공된 것은 아니다. `甲/己→丙寅`, `乙/庚→戊寅`은 《淵海子平》 p.50의 named example로 별도 확인된다.

## 2. Direct page evidence

### 2.1 《子平命術要訣》 p.16 / printed `十二`

- [Wikimedia Commons file record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf)
- [public scan PDF, p.16](https://upload.wikimedia.org/wikipedia/commons/c/c7/NLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf#page=16)
- local review derivative: `/private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf`
- local review PDF: 65 pages; SHA-256 `885bf4db4a6a80a0a7d308ef200ad97da424676b9003f16f72633874f27f795b`

직접 관찰한 안정적인 표면은 다음이다.

```text
推月之法 ... 以節氣為綱
... 本月/上月所遁干支를 취하는 節 전후 문맥

遁月法 古歌云
甲己之年丙作首。乙庚之歲戊為頭。
丙辛之歲尋庚起。丁壬壬位順流行。
更有戊癸何方發。甲寅之上好追求。

寅月即舊歷正月。卯月即舊歷二月。順推至所生之月止。
```

`節氣` 전후 문맥, `寅/卯`의 월 대응, 다섯 mnemonic을 모두 한 page에서 직접 볼 수 있다. 이 공개 scan은 page-level visual evidence로 사용하지만, 공개 derivative와 NLC 기관 raw bytes의 exact identity·machine binding은 별도 blocker다.

### 2.2 NLC `99036` 《淵海子平》 p.50 / printed `三二`

- [NLC record route](https://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=15jh007754)
- [public scan PDF, p.50](https://upload.wikimedia.org/wikipedia/commons/1/11/NLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE.pdf#page=50)
- local review derivative: `/private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf`
- local review PDF: 209 pages; SHA-256 `fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f`

`論起大運法`의 두 인접 example에서 다음을 각각 직접 관찰했다.

```text
如甲子年。甲己之年丙作首。正月建丙寅。
... 起四歲運。順行丁卯。

如乙丑年。乙庚之歲戊為頭。正月起戊寅。
... 起四歲運。順行己卯。
```

이 page는 다섯 묶음 전체를 별도 목록으로 주지는 않지만, `甲己→丙寅`과 `乙庚→戊寅`을 worked example 안에서 직접 corroborate한다. `正月建/起 ... 寅`은 월지 anchor의 또 다른 page-level surface이며, 이 예문을 《五行精紀》 卷33의 copy-level evidence로 사용하지 않는다.

### 2.3 NLC `94145` 《三命通會》 p.109 / printed `三一`

- [NLC official record route](https://read.nlc.cn/allSearch/searchDetail?fid=13jh000156&indexName=data_416&searchType=24&showType=1)
- [Commons file record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf)
- [public scan PDF, p.109](https://upload.wikimedia.org/wikipedia/commons/2/23/NLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf#page=109)
- local review derivative: `/private/tmp/saju-term-review/NLC416-94145-sanming-tonghui.pdf`
- local review PDF: 455 pages; SHA-256 `c6eac6fca6411e45cb801f9b771aca6dd6a6d2dfb57ecc36ea5f42ecf1ac8bf9`

`論遁月時` 문맥에서 다음이 직접 보인다.

```text
所以遁月從年遁時從日。
遁月即甲己之年正月起丙寅二月丁卯順行十二月。

古歌曰
甲己之年丙作首。乙庚之歲戊為頭。
丙辛之歲尋庚起。丁壬壬位順行流。
更有戊癸何處起。甲寅之上好追求。
```

이 면은 기존 p.16과 다른 제목의 page image에서 `正月起丙寅·二月丁卯·順行十二月`과 다섯 mnemonic을 함께 반복한다. `何方發/何處起`, `順流行/順行流`처럼 표면 문구가 달라지는 부분은 변이로 보존하고 임의 교정하지 않는다.

Commons metadata의 `民國十五年[1926]`은 이 digital source surface의 bibliographic date 표기일 뿐, 고전 규칙의 최초 연대·원작 연대·판본 선후를 확정하는 자료로 쓰지 않는다. 공개 PDF의 page image는 직접 관찰했지만 기관 raw bytes와 exact machine binding은 unresolved다.

## 3. Claim-level adjudication

| claim | status | 현재 승격 가능한 표현 | 보존할 한계 |
|---|---|---|---|
| 節境界가 월 선택의 기준이라는 source-local 문장 | `direct, single witness` | 《子平命術要訣》 p.16의 `以節氣為綱` 및 본/상월 `所遁干支` 문맥 | 《五行精紀》 전 witness의 채택, 현대 term resolver, 경계시각 규칙 |
| `正月→寅` | `direct repeated` | p.16 `寅月即舊歷正月`; p.50 `正月...丙寅/戊寅`; p.109 `正月起丙寅` | 모든 판본·모든 월령의 독립성·계보 |
| `二月→卯` | `direct repeated` | p.16 `卯月即舊歷二月`; p.109 `二月丁卯` | 12개 branch row 전체가 직접 표로 닫혔다는 주장 |
| 월지 순행/12개월 진행 | `direct wording; full table partial` | p.16 `順推`; p.109 `順行十二月` | 완전한 `寅...丑` 목록, 현대 index/cycle generator |
| 다섯 年干 묶음의 寅月 시작干 mnemonic | `direct repeated` | p.16·p.109의 반복된 `甲己/乙庚/丙辛/丁壬/戊癸` 노래 | 모든 묶음의 별도 worked example, 보편 생성기 |
| `甲己→丙寅`, `乙庚→戊寅` named output | `direct worked corroboration` | 《淵海子平》 p.50의 `正月建丙寅`, `正月起戊寅` | 나머지 세 묶음의 example output, 《五行精紀》로 전이 |
| birth datetime→specific 月柱/月建 | `source-local partial / cross-witness unresolved` | p.16에서만 節 전후와 遁干支 선택 문맥을 함께 보존 | 모든 입력에 대한 자동 산출, `月柱`와 `月建`의 현대적 동일시 |
| 《五行精紀》 卷33이 위 산출 규칙을 직접 말함 | `unresolved` | 없음; 卷33 「大運」에서 별도 direct locator가 닫히기 전 보류 | 외부 문헌의 문구를 卷33 evidence로 승격하지 않음 |
| textual independence·공통조상·판본 계보 | `unresolved` | 서로 다른 제목/scan에서 반복된 bounded correspondence만 기록 | direct lineage, common ancestor, priority, 정본성 |
| semantic authority·interpretation readiness·production activation | `blocked` | page-level evidence/replay locator만 유지 | semantic authority, 현대 calendar API, timezone, 진태양시, rounding, readiness |

## 4. 독립 corroboration과 lineage의 분리

이번 observation은 다음처럼 분리한다.

```text
직접 관찰:
  子平命術要訣 p.16  ── 節境界 + 寅/卯 + five-group mnemonic
  淵海子平 p.50     ── 甲己/乙庚의 正月寅 worked examples
  三命通會 p.109    ── 正月丙寅·二月丁卯·順行十二月 + same mnemonic family

bounded inference:
  inspected sources에서 월 위치를 순서대로 진행하고
  年干을 다섯 묶음으로 나누어 寅月 시작干을 붙이는 textual pattern이 반복됨

아직 말할 수 없음:
  위 문헌의 특정 공통 저본·직접 계보·판본 선후·textual independence
  《五行精紀》 卷33의 규칙 채택
  현대 月柱 계산기·semantic authority·readiness
```

`三命通會` p.109는 별도 고전 제목의 direct page-level corroboration이므로 이번 frontier를 넓힌다. 그러나 NLC record, Commons mirror, PDF image라는 서로 다른 access route를 physical-copy independence의 세 증거로 세지 않는다. 기관 item과 공개 derivative 사이의 raw-byte derivation도 닫히지 않았다.

## 5. 현재 source-grounded flow의 최대 범위

직접 연결 가능한 가장 좁은 표현은 다음이다.

```text
if a witness explicitly gives 節境界前/後 and its 月遁 selection:
    retain that witness's selected/current-or-previous month relation
else:
    term_to_month_selection = unresolved

if the witness explicitly anchors 正月/二月:
    retain 正月=寅 and/or 二月=卯 only where printed
if the witness explicitly says 順推/順行十二月:
    retain ordered twelve-month progression wording
else:
    full_month_branch_progression = unresolved

if the witness prints the five stem mnemonic:
    retain the five-group start-stem annotation and its literal variants
else:
    year_stem_to_month_stem = unresolved

if a named worked example prints the combined month 干支:
    retain that example's literal 月干支
else:
    month_pillar_output = unresolved
```

이것은 source evidence materializer의 fail-closed boundary다. `節境界→月支→年干→月干`의 관찰 순서를 보존하지만, `birth datetime → modern 月柱` 함수나 《五行精紀》 卷33의 semantic/production 규격을 만들지 않는다.

## 6. 보존할 blockers

- 《五行精紀》 卷33에서 생년월일시로부터 月柱/月建을 정하는 직접 문장·worked example의 부재 범위.
- p.16의 節 전후 규칙이 다른 witness와 같은 방식으로 반복되는지에 대한 direct corroboration.
- `寅→卯→辰...→丑` 12개 月支 전체를 한 원면 또는 독립 원면들에서 모두 확인하는 일.
- `丙辛·丁壬·戊癸`의 별도 worked example과 모든 월령의 combined output.
- 節境界의 정확한 천문시각, endpoint 포함/배제, timezone·진태양시·현대 API·rounding.
- 공개 derivative PDF와 기관 raw bytes의 exact machine binding 및 copy-level independence.
- 특정 공통조상·판본 선후·textual lineage·정본성.
- semantic authority, interpretation readiness, production activation.

## 7. 검증 및 Git 경계

원본 PDF·temporary render·기존 canonical artifact·기존 tracked/untracked 연구자료를 repository에 복사하거나 수정하지 않는다. local review bytes는 실제 임시 파일에서 해시했지만 canonical source로 커밋하지 않는다.

재현용 page render:

```bash
pdftoppm -f 16 -l 16 -r 300 -png \
  /private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf \
  /private/tmp/current-witness-review/month-p16
pdftoppm -f 50 -l 50 -r 300 -png \
  /private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf \
  /private/tmp/current-witness-review/month-yuanhai-p50
pdftoppm -f 109 -l 109 -r 300 -png \
  /private/tmp/saju-term-review/NLC416-94145-sanming-tonghui.pdf \
  /private/tmp/current-witness-review/month-sanming-p109
shasum -a 256 /private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf
shasum -a 256 /private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf
shasum -a 256 /private/tmp/saju-term-review/NLC416-94145-sanming-tonghui.pdf
```

문서 검증 범위는 direct link·page locator·literal transcription·claim status·fail-closed boundary와 이 파일 하나의 staged path다. 앱 runtime/build는 historical source claim을 검증하지 않으므로 실행하지 않는다. atomic commit에는 이 successor 파일만 포함해야 하며, 기존 dirty scripts와 untracked Wonkwang/Sonkeik 자료는 stage·수정·삭제 대상이 아니다.

최종 상태:

```text
節境界→月遁 selection                 direct, source-local only
正月=寅 / 二月=卯                     direct repeated across page surfaces
ordered 12-month progression          direct wording; full branch table partial
five 年干→寅月 start-stem mnemonic    direct repeated across two titles
甲己/乙庚 worked month examples       direct in 淵海子平 p.50
《五行精紀》卷33 adoption              unresolved
copy/edition/lineage                  unresolved
semantic authority/readiness           blocked
modern calculation/activation          blocked
```
