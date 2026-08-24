# 起運 `生日後未來節氣`·`生日前過去節氣` term-selection boundary successor v1

상태: `bounded term identity advanced`, `term-class/general selector unresolved`, `中氣 target not directly observed`, `example-level endpoint only`, `modern API/timezone/rounding/readiness blocked`

기준일: `2026-08-24 KST`

이 문서는 기존 [起運 algorithmization boundary successor](./saju-dayun-algorithmization-boundary-successor-v1.md)에서 exact target selection을 열어 둔 상태를 덮어쓰지 않는 additive successor다. 장서각·NLC·연세대의 《五行精紀》 卷33 「大運」 원면과, 같은 선택 문구를 보이는 NLC 《淵海子平》 worked example을 다시 대조해 **어떤 term 명칭과 시각 표지가 실제로 적혀 있는지**를 source-specific 범위에서만 좁힌다.

이 문서의 결론은 `中氣`를 起運 대상이라고 정하거나 현대 24절기 계산기를 승인하는 것이 아니다. 원면에 실제로 보이는 `立春`, `申時`, `至...止`를 각각 literal observation으로 보존하고, 그 밖의 분류·경계·계산 정책은 미확정으로 남긴다.

## 1. Bounded conclusion

```text
生日後未來節氣日 / 生日前過去節氣日 문구       = 직접 관찰, 방향별 future/past 관계
甲子陽男 사례의 명시적 target                   = 立春
NLC 淵海子平 역행 사례의 명시적 previous target  = 初一立春
立春·雨水의 seasonal sequence                   = 직접 관찰, 起運 selector 아님
起運 target으로서 中氣                          = inspected pages에서 직접 관찰되지 않음
경계시각 표지                                  = 申時 / 至二十九日申時止 (사례별 literal)
정확한 천문 instant·시각대·포함/배제 endpoint     = 미확정
일반 節 대 中氣 선택 규칙                        = 미확정
현대 24절기 API·timezone·rounding                = 승격하지 않음
semantic authority / interpretation readiness    = blocked
production activation                            = blocked
```

따라서 이번에 실제로 전진한 frontier는 다음의 좁은 명제다.

> 확인된 원면의 起運 사례는 출생 전후의 `節氣/節`을 추상적으로만 말하는 데 그치지 않고, 해당 사례에서는 `立春`을 선택 대상명으로 적는다. 다만 별도의 seasonal list에 `雨水`가 함께 나오는 것만으로 `中氣`를 起運 대상에 포함시킬 수 없고, `申時`를 현대 시각의 정확한 경계 instant로 바꿀 수도 없다.

## 2. Direct source surfaces and provenance boundary

| witness | 직접 확인된 surface | 이번에 안전하게 읽는 것 | 유지되는 경계 |
| --- | --- | --- | --- |
| 장서각 K3-437 목판본 | 공식 `K3-437_006.pdf` PDF pp.71–72 | `生日後未來節氣日`/`生日前過去節氣日` 계열, `二十九日申時立春`, `甲子陽男` 사례의 순서 | PDF page를 printed folio로 재명명하지 않음 |
| NLC `KOL000000585` 乙亥字本 | 공식 KORCIS record와 supplied scan pp.102–110 | `卷第三十三 / 大運`, `二十九日申時立春`, `陽男數未來之日`, 숫자·시각 sequence | supplied PDF와 NLC raw export의 byte equality·machine binding 미확정 |
| 연세대 `CATTOT000000200707` 乙亥字本 | 공식 catalog route와 supplied viewer `33/80`–`37/80` | 같은 卷33 「大運」 문맥, `立春` worked-example sequence의 visual correspondence | viewer frame↔item, raw bytes, printed locator 미확정 |
| NLC `99036` 《淵海子平》 | direct scan p.50–51, printed pages 三二–三三 | `過去節`, `初一立春`, 역행 사례 `十五日`/`得九日`의 selected previous term | 《五行精紀》와 동일 판본·직접 전승으로 합치지 않음 |
| NLC `114503.0` 별도 derivative | direct derivative pp.105–106, printed folios 一–二 | `二十九日立春`과 뒤의 `至二十九日申時止`가 한 example에 함께 보임 | `KOL000000585`와 다른 NLC item; 그 wording을 乙亥字本에 전이하지 않음 |

세 《五行精紀》 witness의 correspondence와 exact source boundary는 [卷33 cross-edition successor](./saju-wuxingjingji-vol33-d运-cross-edition-correspondence-successor-v1.md), [lineage frontier successor](./saju-wuxingjingji-vol33-lineage-frontier-successor-v1.md), [NLC page witness successor](./saju-nlc-wuxingjingji-page-witness-successor-v1.md)에 보존되어 있다. NLC `114503.0`의 endpoint/문자 대조는 [Luna deep-collation adjudication v4](./saju-luna-deep-collation-adjudication-v4.md)에 별도로 고정되어 있다.

## 3. 직접 관찰된 문구와 층위

### 3.1 《五行精紀》 卷33 「大運」

장서각 K3-437, NLC `KOL000000585`, 연세대 viewer의 overlapping window에서 다음 순서가 직접 관찰된 것으로 기존 parent verification에 고정되어 있다.

```text
陽男陰女大運以生日後未來節氣日為數順而行之
陰男陽女大運以生日之前過去節氣日為數逆而行之

譬如甲子陽男
十二月二十四日巳時生
是月二十九日申時立春
陽男數未來之日
自二十四日巳時至二十五日巳時
得五日三時
節氣實歷過六十三時
折除計六百三十日
乃是一歲奇九月之大運
起於丁丑
```

이 대목에서 직접 닫히는 것은 다음뿐이다.

- 해당 `甲子陽男` 사례의 출생 표지는 `十二月二十四日巳時`다.
- 사례가 세는 future target은 원면에 `二十九日申時立春`으로 명시된다.
- `立春`은 이 문맥에서 `節氣日`의 실제 named example이다.
- `申時`는 source가 제공한 시각 표지이며, 현대 시계의 분·초 또는 천문학적 term instant가 아니다.
- `自...至...`, `五日三時`, `六十三時`는 사례 내부의 raw interval/수량 표현이며, 일반 endpoint·rounding 규칙이 아니다.

### 3.2 역행 사례의 previous term

NLC `99036` 《淵海子平》 scan p.51의 두 contiguous worked examples는 《五行精紀》와 동일 판본이라고 주장하지 않고, 선택 문구의 범위를 좁히는 related direct witness로만 사용한다.

| 사례 | 원면에 보이는 birth relation | 명시된 selected term | 결과 표지 | 안전한 판정 |
| --- | --- | --- | --- | --- |
| 乙丑年男命 | `初一立春後十五日生男` | `逆數至初一日立春`/`初一立春` | `十五日 → 五三十五 → 五歲 → 逆行丁丑` | 생일 뒤에 이미 지난 `立春`을 previous target으로 잡는 사례-level direct observation |
| 甲子年女命 | `初一立春後十日生女`, `得九日` | `初一立春` | `得九日 → 三三單九 → 三歲 → 逆行乙丑` | 같은 `立春` target이 반복되지만 literal 산술·일반 규칙은 승격하지 않음 |

이 두 사례는 `生日前過去節氣日`라는 문구를 **직전 `立春` 사례로 실현한 것**까지는 보인다. 그러나 모든 날짜에서 자동으로 어느 term을 선택하는지, `過去節`이 항상 월입절(節)만을 뜻하는지, `中氣`를 배제하거나 포함하는지는 이 page window가 말하지 않는다.

### 3.3 `立春·雨水` seasonal sequence

NLC `99036` scan p.52 (printed 三四)의 별도 `論節候歌` 문맥에는 다음 sequence가 직접 보인다.

```text
正月立春雨水節
```

이 line은 `立春`과 `雨水`가 seasonal sequence 안에 함께 배열된다는 것을 보여준다. 그러나 다음을 직접 말하지는 않는다.

- `雨水`를 `中氣`라고 명명하지 않는다.
- `立春`/`雨水` 중 어느 하나를 起運 selector로 지정하지 않는다.
- `生日後未來節氣日`의 `節氣`를 이 sequence의 첫 항 또는 특정 항과 등치하지 않는다.

따라서 `正月立春雨水節`은 **term inventory/seasonal-order locator**로만 기록한다. 起運의 일반 target class 또는 month-boundary authority로 승격하지 않는다. 기존 timing-authority artifact도 `節` 대 `中氣`를 경쟁 정책으로 남기고 있으며, classical explicit boundary를 닫지 않았다: [timing-authority frontier](../artifacts/saju-timing-authority-frontier-v0/complete.json).

## 4. Term-selection adjudication

| claim | status | direct basis | 이번에 좁힌 범위 | 아직 닫히지 않은 것 |
| --- | --- | --- | --- | --- |
| `future/past` 방향과 term count | `direct, witness-scoped` | `生日後未來節氣日` / `生日前過去節氣日`; `陽男數未來之日` | future 또는 past 방향을 source phrase의 raw label로 보존 | 모든 yin/yang·gender mapping의 보편화, edition-independent authority |
| named target in forward example | `direct` | `二十九日申時立春` | 이 example의 target label은 `立春` | 모든 forward birth에서 다음 target을 자동 선택하는 규칙 |
| named target in backward examples | `direct, related witness` | `逆數至初一日立春`; `初一立春` | 관찰된 reverse cases의 previous target은 `立春` | `過去節`과 `中氣`의 배타/포함 관계 |
| `節氣` vs `節` wording | `partial` | 《五行精紀》는 `節氣日`, NLC 《淵海子平》는 `過去節`, related scans는 `節`을 보임 | source wording을 그대로 별도 필드로 보존 | 이 단어들을 모든 witness에서 동일한 formal class로 정규화 |
| `中氣` as 起運 target | `unresolved / not directly observed` | inspected 卷33 target pages와 NLC 99036 p.50–55에 target label `中氣`가 직접 보이지 않음 | bounded negative result only | 전체 권·다른 판본의 부재, classical exclusion rule |
| term order | `direct locator only` | `正月立春雨水節` | seasonal list에 `立春`·`雨水`가 인접 배열됨 | list order가 起運 selector 또는 month rollover라는 주장 |
| boundary time label | `direct, example-only` | `二十九日申時立春`; separate NLC derivative `至二十九日申時止` | source-local time label과 endpoint wording을 literal 보존 | `申時`의 시작/끝, exact event instant, inclusive/exclusive counting |
| general term boundary | `unresolved` | no inspected page states an astronomical instant or universal endpoint | no automatic boundary solver | 24-term API, solar longitude, timezone, local apparent solar time |
| rounding/carry | `unresolved` | `五日三時`, `六十三時`, `三三單九` are literal observations | raw text/number only | floor/ceil/nearest, month/day/hour carry, exact age endpoint |

핵심 판정은 `節氣`라는 글자를 현대 API의 24개 event object로 바꾸지 않는 것이다. 현재 evidence가 허용하는 것은 `selectedTerm.label = 立春`처럼 **원면에 명시된 사례값**을 보존하는 것이며, `selectedTerm = nextSolarTerm(birthInstant)` 같은 일반 연산을 승인하는 것이 아니다.

## 5. Boundary-time distinction

`경계시각`은 세 층으로 분리한다.

1. **문헌 표지:** `二十九日申時立春`은 `立春`과 `申時`를 같은 사례 문장 안에 둔다. 이것은 source가 사용하는 날짜·시각 표지다.
2. **문헌 endpoint wording:** 별도 NLC `114503.0` derivative에는 `至二十九日申時止`가 보인다. 이는 그 scan의 example이 어디까지 세는지를 표현하는 literal wording이지만, KOL000000585·K3·연세대에 자동 전이하지 않는다.
3. **현대 instant:** `申時`를 시계의 특정 분·초, 표준시, 지방평균시, 진태양시, 또는 천문 계산 API timestamp로 해석하는 층이다. 직접 원면 근거가 없으므로 blocked다.

그러므로 현재 safe representation은 다음과 같다.

```text
selectedTerm:
  label: "立春"                 # explicit only when the witness says it
  rawClass: "節氣日" | "過去節"  # source wording, not normalized class
  timeLabel: "申時" | null
  endpointPhrase: "至...止" | null

zhongqi:
  status: unresolved

termBoundaryInstant:
  status: unresolved

modernCalendarPolicy:
  api: not admitted
  timezone: unresolved
  endpointInclusion: unresolved
  rounding: unresolved
```

## 6. Promotion boundary

### 이번 successor에서 전진한 것

- 《五行精紀》 세 witness의 `生日後未來節氣`/`生日前過去節氣`를 추상적인 “절기”로만 두지 않고, 직접 관찰된 `立春` named target과 연결했다.
- NLC 《淵海子平》의 역행 worked examples에서 previous target도 실제로 `初一立春`이라고 적힌다는 점을 별도 witness·별도 layer로 기록했다.
- `正月立春雨水節`을 起運 선택 규칙이 아닌 seasonal sequence로 분리했다.
- `申時`와 `至二十九日申時止`를 각각 source-local time label/endpoint wording으로 보존하고, exact instant·시각대·포함/배제를 분리했다.
- `中氣`가 inspected target pages에서 직접 관찰되지 않았다는 bounded negative result를 기록했다. 이것은 `中氣`의 역사적 부재나 배제 증명이 아니다.

### 승격하지 않은 것

- `立春`을 모든 출생 사례의 universal anchor로 고정하는 규칙.
- `雨水` 또는 다른 항목을 `中氣`로 분류하여 起運 대상에 포함·배제하는 규칙.
- `節氣`와 `節`의 formal equivalence, 또는 `節`과 `中氣`의 상호 배타성.
- `申時`를 특정 시각 instant로 바꾸는 현대 24절기 API, solar-longitude 계산, timezone/true-solar-time 규칙.
- `至...止`를 모든 witness의 inclusive endpoint로 정규화하는 규칙.
- floor/ceil/nearest rounding, 월·일·시 carry, exact age/start timestamp.
- edition/textual lineage, 정본성, semantic authority, interpretation readiness, production activation.

최종 상태:

```text
source-level named-term observation       = advanced, bounded to 立春 examples
future/past term relation                  = direct/partial by witness
節 vs 中氣 general classification         = unresolved
exact term boundary instant                = unresolved
modern API / timezone / endpoint / rounding= not admitted / unresolved
semantic authority / readiness             = blocked
production activation                     = blocked
```

## 7. Reproducibility and validation

이번 문서는 기존 원본·artifact·코드를 수정하지 않는 documentation-only overlay다.

- 직접 page identity와 source boundaries는 [source/page frontier](../src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js)와 [timing-authority artifact](../artifacts/saju-timing-authority-frontier-v0/complete.json)에서 재확인했다.
- 《五行精紀》 three-witness passage와 `甲子陽男` sequence는 [bounded cross-edition dossier](./saju-wuxingjingji-vol33-d运-cross-edition-correspondence-successor-v1.md) 및 [lineage dossier](./saju-wuxingjingji-vol33-lineage-frontier-successor-v1.md)와 대조했다.
- NLC `99036`의 reverse examples와 `正月立春雨水節` locator는 [algorithmization boundary](./saju-dayun-algorithmization-boundary-successor-v1.md), [Gemini v6 parent adjudication](./saju-gemini-v6-parent-adjudication.md), [Gemini v7 parent adjudication](./saju-gemini-v7-parent-adjudication.md)에서 parent-verified 범위만 재사용했다.
- NLC `114503.0`의 `二十九日立春`/`至二十九日申時止`는 [Luna v4 dossier](./saju-luna-deep-collation-adjudication-v4.md)의 별도 item boundary를 유지했다.
- 새 문서는 `立春` 사례의 source-specific identity와 unresolved `中氣`/instant boundary를 분리하는지 key-term search로 확인한다.
- 기존 tracked/untracked research material과 대용량 원본 PDF는 stage·삭제·수정 대상이 아니다.

문서 검증은 historical observation와 claim boundary에 한정된다. 이는 원면의 semantic authority, 현대 계산 정확성, API 호환성 또는 production readiness를 증명하지 않는다.
