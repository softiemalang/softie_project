# 子時 日界·日柱·時柱 direct-witness bounded successor v1

상태: `bounded late-Saju direct convention advanced`, `子初/子半 calendar layer separated`, `早子 exact token unresolved`, `lineage·semantic authority·readiness blocked`

기준일: `2026-08-27 KST`

이 문서는 기존 [Saju timing authority frontier](../src/interpretationPrep/sajuTimingAuthorityFrontier.js)의 `zi-day-boundary` claim과 [起運 endpoint equality successor](./saju-dayun-endpoint-equality-boundary-successor-v1.md)를 덮어쓰지 않는 additive successor다. 이번 조사의 질문은 `子初·子正·早子·夜子` 같은 표현을 현대 규격으로 통일하는 것이 아니라, 실제 원면에서 **日界가 어느 textual layer에서 어떻게 서술되고, 日柱·時柱 배속이 어디까지 직접 나타나는지**를 좁히는 것이다.

## 1. 결론: 새로 닫힌 최대 범위

서로 다른 late-Saju page surface 두 곳에서 `夜子`와 자정 뒤의 `正子/子時正`을 직접 대조한 결과, 다음의 **source-local convention**을 bounded하게 승격한다.

```text
夜子:   source가 '午後十一點至十二點'이라고 구분한 구간
        → 生日幹枝는 今日에 남김
        → 生時幹枝는 明日 기준으로 추산

正子:   source가 '午後十二點鐘至一點鐘'이라고 구분한 구간
        → 生日·時幹枝를 모두 明日 기준으로 추산
```

이는 단순한 용어 설명에 그치지 않고, 한 page의 worked assignment에서도 반복된다.

```text
夜子:   辛酉日庚子時
正子:   壬戌日庚子時
```

여기서 `庚子`의 `子`는 두 사례에서 같은 子時 branch로 보이며, `夜子` 사례는 日柱를 `辛酉`로 보존하면서 時干을 다음 날 기준으로 계산한 source-local 혼합 결과로 직접 적혀 있다. 자정 뒤 사례는 日柱가 `壬戌`으로 넘어가고 時柱도 다음 날 기준으로 적힌다.

따라서 현재 가장 좁은 판정은 다음과 같다.

> 이번에 직접 확인한 두 late-Saju 원면에서는, 자정 전 `夜子`에 日柱를 다음 날로 넘기지 않고 時干支만 明日 기준으로 취급하며, 자정 뒤 `正子/子時正`에서는 日·時干支를 모두 明日 기준으로 취급한다.

이 문장은 해당 두 source surface의 반복 관찰이다. 고전 전체의 보편 규칙, 특정 고대 저본의 권위, 23시·0시를 채택하는 현대 알고리즘으로 승격하지 않는다.

## 2. 직접 대조한 원면과 provenance 경계

아래 PDF는 공개된 기관 귀속/기관 디지털 객체의 derivative scan이다. 실제 PDF byte hash는 이번 review surface의 식별자이며, 기관 보존 원본의 canonical hash 또는 동일 physical copy의 확정값으로 사용하지 않는다.

| surface | direct locator | 원면에서 확인한 범위 | 안전한 역할 | 유지되는 한계 |
| --- | --- | --- | --- | --- |
| NLC 귀속 《命理集成》 卷一 | [공개 PDF p.63](https://upload.wikimedia.org/wikipedia/commons/d/d3/NLC511-04101394-70574_%E5%91%BD%E7%90%86%E9%9B%86%E6%88%90_%E5%8D%B7%E4%B8%80.pdf#page=63), p.64 | `子正者今日之早也。夜子者今日之夜。非今日之早也`와 `夜子/子時正` worked assignment | late-Saju terminology 및 day/hour-pillar assignment의 direct page surface | exact institutional raw-byte derivation, copy independence, printed folio-to-PDF machine binding |
| NCL 《新命理探原》 | [공식 record](https://taiwanebook.ncl.edu.tw/en/book/NCL-000002203), [공개 PDF p.86](https://upload.wikimedia.org/wikipedia/commons/4/4a/NCL-000002203_%E6%96%B0%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=86), p.87, [p.308](https://upload.wikimedia.org/wikipedia/commons/4/4a/NCL-000002203_%E6%96%B0%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=308) | `夜子時/正子時`의 source rule, 날짜·時干支 assignment, `初初/正初` 시간분할을 직접 관찰 | NCL record와 공개 PDF의 raw-byte/machine binding, 작품의 전통적 귀속과 현존 scan 제작연대의 동일시 |
| NLC 《三命通會》 卷二 | [NLC record route](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=13jh000156), [reader route](http://read.nlc.cn/OutOpenBook/OpenObjectBook?aid=416&bid=94145.0), [공개 PDF p.102](https://upload.wikimedia.org/wikipedia/commons/2/23/NLC416-13jh000156-94145_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf#page=102) | `初初…初四/正初…正四`와 `子時` 상반·하반의 `夜半前/後` 날짜 배속 | calendar/timekeeping layer의 direct page corroboration | 이 면 자체의 四柱 日柱·時柱 assignment, 早子/夜子 nomenclature, lineage |

### 2.1 review bytes

```text
/private/tmp/saju-day-boundary-review/NLC511-04101394-70574-mingli-jicheng-vol1.pdf
  pages=98
  sha256=62611d493faf8caddc6ff44553b14ca0dba141728bd40851d0d1b3fccaadbbef
  direct pages: PDF p.63–64 / printed 四二–四三

/private/tmp/saju-term-review/xin-mingli-tanyuan.pdf
  pages=486
  sha256=3dfee4ef4636d48c2d2e749f90408a825e0eacee99b8c73b9748a03deb73dcfd
  direct pages: PDF p.86–87 / printed 四四–四五; PDF p.308 / printed 二六六

/private/tmp/saju-term-review/NLC416-94145-sanming-tonghui.pdf
  pages=455
  sha256=c6eac6fca6411e45cb801f9b771aca6dd6a6d2dfb57ecc36ea5f42ecf1ac8bf9
  direct page: PDF p.102 / printed 二四
```

직접 판독한 review render의 식별자는 다음과 같다. 이 render들은 repository에 복사하지 않았다.

```text
mingli-target-p063.png  d728207a6b2c23c86b6fda58be7612b8abb1f6353be49eb7f261a6a30c67eb59
mingli-target-p064.png  5337a913bf60e145bda71e001afedf2f7b3be584edb605f1ffebaf6b1556bacd
xin-boundary-p086.png   8bf9279fe277ce3590bacf7886130c59049004c0a7011af5d176f4fe3b667dbc
xin-boundary-p087.png   49b4d06c2e9d7ce5ec46ffcadbc40d05868191c0b8839f454078acda0d8ead62
xin-p308.png            ebea20cf0f95d310f9be392a899b72de4dd2e7e574fd0507bd6719c4a0d3faf7
sanming-hi/p102.png     28d34b958aaa2f206804f9ddaea94b3e9bff9363ef34df1902e58ccbaaf55884
```

`xin-p308.png` hash는 위 경로에서 현재 보존된 render의 hash다. 원면 텍스트를 OCR로 재구성하거나 hash가 다른 render를 같은 artifact로 간주하지 않는다.

## 3. `夜子`와 `正子/子時正`: 日柱·時柱 assignment

### 3.1 《新命理探原》 p.86–87 / printed 四四–四五

p.86–87의 `推夜子時大運交脫法` 문맥에서 다음 문장이 원면에 직접 보인다.

```text
萬年曆所載節氣、有夜子時、正子時之分。
故推算之法、亦稍有不同。

所謂夜子時者、乃今日之夜、非明日之早也。
凡在午後十一點至十二點鐘生人者、為夜子時。
其生日幹枝仍屬今日。
生時幹枝當作明日推算。

所謂正子時者、乃明日之早、非今日之夜也。
凡在午後十二點鐘至一點鐘生人者、乃為正子時。
其生日、時幹枝始可俱從明日推算。
```

마지막 문장은 원면의 붙임표/문장부호를 현대적으로 정리한 전사문이 아니다. 핵심 판정을 위해 문자열이 명확히 보이는 `其生日幹枝仍屬今日`, `生時幹枝當作明日推算`, `乃為正子時`, `俱從明日推算`만 사용한다. `午後十一點至十二點` 및 `午後十二點鐘至一點鐘`은 source가 적은 표현 그대로 보존하며, 현대 timezone 또는 진태양시의 시각으로 변환하지 않는다.

이 면에서 직접 닫히는 claim은 다음이다.

| source phrase | 日柱/生日幹枝 | 時柱/生時幹枝 | 판정 |
| --- | --- | --- | --- |
| `夜子時`·`今日之夜` | `仍屬今日` | `當作明日推算` | direct, source-local |
| `正子時`·`明日之早` | `俱從明日推算` 중 生日 field | `俱從明日推算` 중 時 field | direct, source-local |
| 정확한 현대 경계 instant | 원면에 없음 | 원면에 없음 | unresolved |

이 문면은 `夜子`에서 日柱와 時干支의 기준일을 분리한다. 따라서 이를 “時柱 전체가 다음 날”이라고 압축하지 않는다. 직접 확인되는 최소 표현은 **子 branch는 子時로 남고, 時干의 산출 basis가 明日로 바뀐다**는 것이다.

### 3.2 《命理集成》 p.63–64 / printed 四二–四三

같은 유형의 설명과 worked assignment가 다른 공개 scan surface에서 직접 반복된다.

```text
始知子正者今日之早也。
夜子者今日之夜。
非今日之早也。
```

이어지는 사례에서 source는 다음처럼 적는다.

```text
初十日下午十一點鐘後十二點鐘前夜子時生
  → 甲寅年丙寅月辛酉日庚子時推

初十一日下午十二點鐘後一點鐘前子時正生
  → 甲寅年丙寅月壬戌日庚子時推
```

여기서 p.63–64의 세부 표기는 세로 조판과 다음 면 연결을 고려해 읽었다. 이 문서가 사용하는 직접 anchor는 `夜子時生` 뒤의 `辛酉日庚子時`와 `子時正生` 뒤의 `壬戌日庚子時`이다. source가 두 경우 모두 `庚子`를 적기 때문에, 이 사례는 子時 branch가 바뀌었다는 증거가 아니라 日柱 및 時干 산출 basis의 차이를 보여주는 page-local assignment다.

두 surface를 함께 읽을 때의 최소 correspondence는 다음과 같다.

```text
pre-midnight source wording  = 夜子
  date/day field              = same-day `辛酉日`
  time field                  = `庚子`, next-day basis stated/used

post-midnight source wording = 正子 / 子時正
  date/day field              = next-day `壬戌日`
  time field                  = `庚子`, next-day basis
```

이는 직접 원면의 반복된 late-Saju convention이지만, 두 scan이 textual independence를 가진다거나 한 source가 다른 source를 전사했다는 뜻은 아니다.

## 4. `子初·子正`과 calendar/timekeeping layer

### 4.1 《三命通會》 卷二 p.102 / printed 二四

`論時刻` 원면은 한 時를 `初`와 `正`의 상반으로 나누는 source-local 표기를 직접 보인다.

```text
上半時之大刻四始曰初初、次初一、次初二、次初三、最後小刻為初四。
下半時之大刻亦四、始曰正初、次正一、次正二、次正三、最後小刻為正四。
若子時、則上半時在夜半前、屬昨日；下半時在夜半後、屬今日。
```

`新命理探原` p.308(printed 二六六)의 `論時刻及夜子時與子時正不同` 면에도 같은 `初初…初四/正初…正四`와 `子時`의 `夜半前/後` 배속이 직접 보인다. 이 두 page는 다음까지만 닫는다.

- `初初…初四`와 `正初…正四`는 한 時 내부의 source-local subdivision labels다.
- `子時`의 상반은 `夜半前`·`昨日`, 하반은 `夜半後`·`今日`로 설명된다.
- 이 문면은 calendar/timekeeping assignment를 직접 말하지만, 그 자체로 四柱 日柱·時柱 계산을 명령하지 않는다.

따라서 `子初`를 곧바로 “현대 23시부터”로, `子正`을 곧바로 “현대 0시부터”로 치환하지 않는다. 원면에서 정확히 직접 읽힌 것은 `初初/正初`라는 subdivision과 `夜半前/後`의 날짜 배속이다.

### 4.2 `子半`과 외부 후대 문헌의 용어층

기존 timing frontier의 [《新唐書》 卷二十五 digital witness](https://zh.wikisource.org/zh-hans/%E6%96%B0%E5%94%90%E6%9B%B8/%E5%8D%B7025)는 `命辰起子半；古歷分日，起於子半`을 보존한다. 이는 역법의 `子半` 논의이지, 이번에 확인한 late-Saju page처럼 日柱·時柱를 함께 배정하는 direct Saju rule이 아니다. 기존 observation의 `calendar_scope_only` 경계를 그대로 유지한다.

또한 [《滴天髓闡微》 digital text witness](https://zh.wikisource.org/zh-hant/%E6%BB%B4%E5%A4%A9%E9%AB%93%E9%97%A1%E5%BE%AE)는 `子時前三刻...夜子時也`처럼 子時의 앞부분과 `夜子`를 연결하지만, 이번에 확인한 해당 passage는 日柱를 어느 날로 둘지 또는 時干을 어느 날 기준으로 잡을지를 직접 명시하지 않는다. 따라서 term-only / intra-hour evidence로만 둔다.

## 5. `早子`의 부재와 용어 정규화 경계

이번 direct page set에서 exact compound `早子`가 확인된 것은 아니다. 대신 《命理集成》 p.63은 `子正者今日之早也`, 《新命理探原》 p.87은 `正子時者、乃明日之早`라고 적는다. 이 두 문장은 `早`라는 설명어가 포함된다는 사실을 직접 보여주지만, 다음을 자동으로 뜻하지 않는다.

```text
子正 = 早子 = 모든 문헌의 동일 lexical token
正子時 = 모든 문헌의 동일한 day-pillar implementation
今日之早 = 현대 00:00의 보편적 정의
```

그러므로 현재 `早子` claim은 다음처럼 남긴다.

| claim | 상태 | 근거 |
| --- | --- | --- |
| `早子` exact compound가 이번 inspected page set에 직접 나타남 | `unresolved / not observed` | 확인된 면은 `今日之早`, `正子時`, `子時正`이지 exact `早子`가 아님 |
| `早`가 `正子` 설명의 일부로 사용됨 | `direct, terminology-local` | 《命理集成》 p.63, 《新命理探原》 p.87 |
| `早子`의 日柱·時柱 assignment | `unresolved` | exact token과 독립 worked assignment가 직접 닫히지 않음 |

## 6. claim-level adjudication

| claim | status | 이번 successor에서 허용하는 표현 | 승격하지 않는 범위 |
| --- | --- | --- | --- |
| `夜子`는 source가 적은 `今日之夜` 구간이다 | `direct repeated, source-local` | 두 late-Saju surface의 literal distinction | 모든 고전 문헌의 공통 정의 |
| `夜子`의 生日幹枝/日柱는 今日에 남는다 | `direct repeated bounded` | `其生日幹枝仍屬今日` 및 `辛酉日` worked assignment | 모든 四柱 전통의 보편 정책 |
| `夜子`의 生時幹枝는 明日 기준으로 추산한다 | `direct repeated bounded` | `生時幹枝當作明日推算` 및 `辛酉日庚子時` | 時柱 전체를 일괄적으로 다음 날로 부르는 정규화 |
| `正子/子時正`은 明日의 이른 子時로 서술된다 | `direct repeated, terminology-local` | `正子時`·`子時正`과 `明日之早` | `正子=早子`의 보편 lexical equivalence |
| `正子/子時正`에서는 日·時干支를 함께 明日 기준으로 둔다 | `direct repeated bounded` | `俱從明日推算` 및 `壬戌日庚子時` | 현대 자정 연산자, timezone, API |
| `子時` branch가 두 사례에서 다음 날 branch로 바뀐다 | `not promoted` | 두 사례 모두 source output은 `庚子` | branch progression을 date rollover와 동일시 |
| `初初/正初`는 子時 내부 subdivision이다 | `direct calendar/timekeeping` | 三命通會 p.102, 新命理探原 p.308 | exact `子初` token 또는 현대 23시 mapping |
| `子半`이 四柱 日柱·時柱의 source-authorized boundary다 | `not promoted` | 新唐書는 calendar layer only | Saju prescription |
| `早子` exact token의 rule | `unresolved` | 이번 page set에 direct exact token 없음 | 검색 snippet·현대 해설의 전이 |
| 여러 scan이 동일 textual lineage를 증명한다 | `unresolved` | 반복은 bounded corroboration | common ancestor·copy order·textual independence |
| semantic authority/readiness/activation | `blocked` | 없음 | interpretation authority·production use |

## 7. 기존 frontier와의 관계

### 7.1 evidence layer의 제한적 전진

기존 `zi-day-boundary` frontier에는 다음이 있었다.

```text
子半/子初/子正 및 early/night 子時의 서로 다른 source scope 관찰
→ authoritative Saju day-pillar rollover는 unresolved
```

이번에 추가된 직접 page evidence는 그 중 **Saju-specific day/hour assignment 자체가 완전히 비어 있지는 않다**는 점을 좁힌다. 특히 `夜子`와 `正子/子時正`의 날짜 field 및 時干 basis를 실제 worked assignment로 관찰했다. 그러나 이 두 공개 scan surface의 edition-stable identity, physical-copy independence, 특정 계보, 정본성은 닫히지 않았으므로 repository의 semantic-authority claim을 승격하지 않는다.

따라서 문서 frontier의 delta는 다음처럼 기록한다.

```text
late-Saju direct source-local assignment (`夜子` vs `正子`) = advanced-bounded
calendar/timekeeping `初初/正初` distinction                  = direct corroborated, non-Saju authority
exact `子初` -> modern clock boundary                        = unresolved
exact `早子` token/rule                                       = unresolved
single authoritative Saju day-pillar policy                   = unresolved
edition/lineage/independence                                 = unresolved
semantic authority/readiness/activation                       = blocked
```

기존 `src/interpretationPrep/sajuTimingAuthorityFrontier.js`와 materialized authority artifact는 이번 문서만으로 수정하지 않는다. 이는 새 direct observation을 숨기는 것이 아니라, **관찰 증거의 전진과 authority/readiness 승격을 분리**하기 위한 것이다. 기존 `claim.day-boundary-saju-authority`와 `blocker.zi-lineage-conflict`, `blocker.classical-explicit-day-rollover`의 blocked/unresolved gate는 유지한다.

### 7.2 독립성·계보 판정

| 축 | 판정 | 이유 |
| --- | --- | --- |
| source-surface repetition | `satisfied-bounded` | 《命理集成》과 《新命理探原》에서 `夜子/正子` distinction과 assignment가 반복 |
| physical-copy independence | `unresolved` | 서로 다른 NLC/NCL 귀속 surface라는 사실만으로 textual independence를 만들 수 없음 |
| common ancestor | `unresolved` | colophon·dated exemplar·직접 전사 관계 없음 |
| edition order | `unresolved` | 공개 scan metadata와 source wording만으로 선후를 정하지 않음 |
| classical universality | `not promoted` | 三命通會는 calendar layer이고, late Saju examples도 source-local |
| semantic authority | `blocked` | 특정 authoritative Saju lineage가 선택되지 않음 |

## 8. 재현·검증 범위

이번 review는 원본을 repository로 옮기지 않고 `/private/tmp` review surface에서 다음처럼 재현했다.

```sh
pdftoppm -f 63 -l 64 -r 400 -png \
  /private/tmp/saju-day-boundary-review/NLC511-04101394-70574-mingli-jicheng-vol1.pdf \
  /private/tmp/saju-day-boundary-review/mingli-target

pdftoppm -f 86 -l 87 -r 400 -png \
  /private/tmp/saju-term-review/xin-mingli-tanyuan.pdf \
  /private/tmp/saju-day-boundary-review/xin-boundary

pdftoppm -f 102 -l 102 -r 400 -png -singlefile \
  /private/tmp/saju-term-review/NLC416-94145-sanming-tonghui.pdf \
  /private/tmp/saju-day-boundary-review/sanming-hi/p102

pdftoppm -f 308 -l 308 -r 260 -png -singlefile \
  /private/tmp/saju-term-review/xin-mingli-tanyuan.pdf \
  /private/tmp/saju-day-boundary-review/xin-p308
```

검증 결과:

- 직접 확인된 두 late-Saju surface에서 `夜子`의 今日 日干枝와 明日 기준 生時干枝가 반복된다.
- 같은 surface family의 worked assignment에서 `辛酉日庚子時` 대 `壬戌日庚子時`가 직접 보인다.
- `三命通會`와 `新命理探原`의 `初初/正初`·`夜半前/後`는 calendar/timekeeping layer로 분리했다.
- exact `早子` token, 고대 source의 단일 authority, modern endpoint/timezone/true-solar/API/rounding은 닫히지 않았다.
- 문서 전용 successor이므로 runtime code, fixture, 대용량 원본, 기존 unrelated dirty work는 수정·삭제·stage하지 않는다.

최종 bounded state:

```text
夜子: 日柱 今日 유지; 時干支 明日 기준          = direct repeated source-local
正子/子時正: 日·時干支 明日 기준                  = direct repeated source-local
子初/初初·正初: 시간분할·역법층                  = direct calendar-only
子半: 역법층                                      = direct/previously observed, non-Saju
早子 exact token                                  = unresolved
23시/0시 현대 규격·timezone·진태양시·API           = not promoted
edition/lineage/common ancestor/independence       = unresolved
semantic authority/readiness/activation             = blocked
```
