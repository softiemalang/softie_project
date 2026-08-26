# 起運 source-grounded 계산 흐름 bounded successor v1

상태: `joined evidence-flow frontier advanced`, `executable calculation/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 기존 [起運 algorithmization boundary](./saju-dayun-algorithmization-boundary-successor-v1.md), [term-selection boundary](./saju-dayun-term-selection-boundary-successor-v1.md), [final-output structure](./saju-dayun-final-output-structure-successor-v1.md), [first-pillar correction](./saju-dayun-first-pillar-directional-progression-successor-v1.md), [joined first-to-subsequent progression](./saju-dayun-start-age-first-pillar-progression-successor-v1.md)를 덮어쓰지 않는 additive synthesis successor다. 목적은 이미 직접 닫힌 大運 claim들을 하나의 **source-grounded evidence flow**로 연결하되, 서로 다른 witness의 관찰을 하나의 canonical 계산기로 합치지 않는 것이다.

`月柱/月建` 산출, 현대 절기 API, timezone, endpoint, rounding, `一日主四箇月`·`一時十日` shorthand, semantic authority, interpretation readiness, production activation은 이 문서에서 승격하지 않는다.

## 1. 핵심 판정

현재 직접 근거로 연결 가능한 최대 범위는 두 종류다.

1. 《五行精紀》 卷33 「大運」의 같은 관찰 창에서는 **방향 문구 → 명시된 target 節氣/節 → 원면에 적힌 날짜·시각 경과량 → `一辰十歲·三日為年` 계열 문구 → 잔여 출력 → `起於丁丑`**의 순서가 직접 보인다.
2. 후대 worked example에서는 **source가 이미 적어 둔 月建/月柱 → 첫 大運 → 2·3번째 大運**이 직접 연결된다. 교정된 pair는 순행 `丙寅→丁卯`, 별도 `戊寅→己卯`, 역행 `戊寅→丁丑`, `丙寅→乙丑`이다.

따라서 현재의 가장 좁은 bounded flow는 다음이다.

```text
source가 제공한 방향·target·raw 경과량
  → source formula와 literal 잔여 출력 보존
  → source가 명시한 first 大運 output 보존
  → source가 실제로 후속 열을 인쇄한 경우에만 2·3번째 열 보존
```

이 흐름은 **증거 packet/replay 구조**로는 연결 가능하지만, 생년월일시만으로 月柱를 계산하고 첫 大運과 전체 열을 자동 생성하는 규칙으로는 닫히지 않는다.

## 2. 단계별 adjudication

| 단계 | 직접 닫힌 범위 | 조립 상태 | 남은 blocker |
|---|---|---|---|
| 0. witness/page identity | 장서각 K3-437, NLC `KOL000000585`, 연세대 visual witness 및 관련 worked-example scan의 page locator | `direct/page-level` | institutional raw bytes, exact machine binding, copy-level independence |
| 1. 방향 | 《五行精紀》의 `陽男陰女...順`·`陰男陽女...逆`; NLC 《淵海子平》의 순·역 문구 | `direct, source-local` | 모든 성별·간년 조합의 현대 enum normalization |
| 2. target 선택 | `生日後未來節氣日`·`生日前過去節氣日`, 사례의 `立春`·`驚蟄`·`過去節` | `direct/partial` | 자동 다음·이전 term 선택, 12節-only, 中氣 배제, exact term class |
| 3. raw 경과량 | `五日三時`, `六十三時`, `五三十五`, `三三單九`, `刻`을 source literal로 보존 | `direct, source-local` | calendar basis, timezone, term instant, endpoint 포함/배제 |
| 4. 환산 문구 | `一辰十歲`, `三日為年/三日為一歲`가 여러 material/text surface에 직접 보임 | `bounded-closed as wording` | 월·일·시 환산, `一日四月`·`一時十日`의 universal 적용 |
| 5. 잔여/시작 age | `一歲奇九月`, `四年零九月`, `五歲上運欠三月`, `十歲欠三十天` 등 literal output | `direct, source-local` | `奇·零·欠`의 universal lexical/산술 규격, rounding·carry |
| 6. first 大運 | `起於丁丑` 및 각 worked example의 명시 output; explicit 月建이 있는 examples의 next/previous pair | `direct output + conditional relation` | birth input에서 月柱/月建 산출, 모든 月建의 first-pillar generator |
| 7. 후속 大運 | 실제 표에 있는 `庚子→辛丑→壬寅`, `辛卯→壬辰→癸巳`, 역행 열 등 | `direct repeated, bounded` | 모든 문헌·모든 운수의 60-cycle 생성, 출력 endpoint |
| 8. interpretation/activation | 해당 없음 | `blocked` | semantic authority, interpretation readiness, production activation |

`direct`는 해당 원면/scan surface에 문자·순서가 직접 보인다는 뜻이다. 서로 다른 문헌의 같은 구조를 이어 붙이는 경우에는 `cross-witness corroboration`으로만 기록하며, 하나의 physical copy나 공통 저본으로 취급하지 않는다.

## 3. 연속 조립이 실제로 닫히는 구간

### 3.1 《五行精紀》 卷33: 한 관찰 창의 계산 서열

장서각 K3-437 pp.71–72, NLC 乙亥字本의 대응 page window, 연세대 viewer의 visual window에서 확인된 parent observation은 다음 순서를 보존한다.

```text
陽男陰女大運以生日後未來節氣日為數順而行之
陰男陽女大運以生日前過去節氣日為數逆而行之

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

이 원면 서열에서 직접 조립 가능한 것은 다음뿐이다.

```text
방향 phrase
  → source-named target `立春`
  → birth/target의 source-visible date·time markers
  → `五日三時` / `六十三時`
  → `六百三十日`
  → `一歲奇九月`
  → printed output `起於丁丑`
```

이는 `起於丁丑`이 **그 example의 printed output**이라는 뜻이지, 문헌이 `月柱→丁丑` 생성 공식을 직접 제공한다는 뜻이 아니다. `六百三十日`을 현대식 calendar duration으로 재계산하거나 `奇九月`을 자동으로 월·일·시 필드로 분해하지 않는다.

근거 문서: [K3-437 page witness](./saju-jangseogak-k3-437-page-witness-successor-v1.md), [NLC 《五行精紀》 page witness](./saju-nlc-wuxingjingji-page-witness-successor-v1.md), [cross-edition correspondence](./saju-wuxingjingji-vol33-d运-cross-edition-correspondence-successor-v1.md), [conversion claim](./saju-wuxingjingji-vol33-conversion-claim-successor-v1.md).

### 3.2 명시된 月建에서 first 大運까지: 조건부 방향 관계

NLC 《淵海子平》 p.50–51과 NLC 《神峰通考》 p.22는 月建/月柱와 first output을 같은 worked-example 문맥에 적는다.

```text
순행: 正月建丙寅 → 丁卯
순행: 正月起戊寅 → 己卯   (별도 example)
역행: 正月起戊寅 → 丁丑
역행: 正月起丙寅 → 乙丑
```

`丙寅→己卯`는 두 인접 예문을 섞은 이전 binding이며, [correction provenance](./saju-dayun-first-pillar-directional-progression-successor-v1.md#0-correction-provenance)에 따라 현재 claim으로 사용하지 않는다.

직접 scan: [NLC 99036 p.50](https://upload.wikimedia.org/wikipedia/commons/1/11/NLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE.pdf#page=50), [NLC 99036 p.51](https://upload.wikimedia.org/wikipedia/commons/1/11/NLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE.pdf#page=51), [NLC 511 p.22](https://upload.wikimedia.org/wikipedia/commons/d/d1/NLC511-027032013020556-10361_%E7%A5%9E%E5%B3%B0%E9%80%9A%E8%80%83_%E7%AC%AC2%E5%8D%B7.pdf#page=22).

이 관계에서 현재 승격할 수 있는 것은 **확인된 네 pair가 순행에서는 다음, 역행에서는 이전 간지와 일치한다는 bounded deterministic relation**이다. `月柱`나 `月建`을 생년월일에서 계산하는 규칙은 이 원면들이 직접 제공하지 않는다.

### 3.3 first 이후의 후속 열

《子平命術要訣》 p.18과 《命理探原》 pp.61–62는 같은 worked example 안에 시작 age, first 大運, 2·3번째 열을 함께 인쇄한다.

```text
順行: 五歲上庚子 → 十五歲上辛丑 → 二十五壬寅
逆行: 五歲上戊戌 → 十五歲上丁酉 → 二十五丙申
順行: 初十辛卯 → 二十壬辰 → 三十癸巳
逆行: 初一辛丑 → 十一庚子 → 廿一己亥
```

이 열들은 다음을 직접 지지한다.

- age marker가 source 표기상 10 단위로 증가한다.
- 순행 열은 확인된 다음 간지, 역행 열은 확인된 이전 간지로 이어진다.
- 이 관계는 실제로 인쇄된 2·3번째 열에 한정한다.

직접 scan: [《子平命術要訣》 p.18](https://upload.wikimedia.org/wikipedia/commons/c/c7/NLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3_%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf#page=18), [《命理探原》 p.61](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=61), [《命理探原》 p.62](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=62).

이 후속열을 3.1의 `起於丁丑` 뒤에 소급해서 붙이지 않는다. 《五行精紀》 卷33 관찰 창에서 그 뒤의 전체 열이 직접 인쇄되었다는 근거가 없기 때문이다.

## 4. 통합 flow의 최대 안전 범위

### 4.1 evidence packet flow

```text
[A] witness identity + exact page/window
  ↓
[B] source phrase로 관찰된 방향
  ↓
[C] source가 실제로 명시한 target 節/節氣
  ↓
[D] source-visible raw date/time difference
  ↓
[E] source formula literal: 三日為年 / 三日為一歲 / 一辰十歲
  ↓
[F] source-reported residual: 奇 / 零 / 欠 / 日·時·刻 문자열
  ↓
[G] source가 실제로 인쇄한 first 大運 output
  ↓
[H] source가 실제로 인쇄한 후속 age·干支 rows
```

이 flow에서 `[B]`–`[G]`는 《五行精紀》 卷33의 `甲子陽男` example에서 같은 관찰 창 안에 연결된다. `[G]`–`[H]`는 다른 worked-example sources에서 직접 연결되지만, 그 연결을 《五行精紀》 copy에 전이하지 않는다.

### 4.2 조건부 계산 표현

현대 계산식 대신 다음의 조건부 evidence relation만 허용한다.

```text
if source explicitly provides selectedTerm:
    retain selectedTerm and its future/past wording
else:
    selector = unresolved

if source explicitly provides raw elapsed quantities:
    retain rawElapsedLiteral and sourceFormulaLiteral
else:
    rawElapsed = unresolved

if source explicitly prints first pillar:
    retain firstPillarObserved
else if source explicitly prints month-pillar + direction + first output:
    retain named-example directional relation only
else:
    firstPillar = unresolved

if source explicitly prints later rows:
    retain those rows and their source age labels
else:
    subsequentRows = unresolved
```

이것은 historical evidence materializer의 fail-closed 구조이지, `first_dayun()` 또는 현대 起運 API의 구현 명세가 아니다.

## 5. 단계별 claim gate

| claim | status | 승격 가능한 표현 | 승격하지 않는 표현 |
|---|---|---|---|
| 방향→미래/과거 target | `direct/partial` | source phrase와 named target을 함께 보존 | 자동 다음/이전 節 계산, 12節-only, 中氣 배제의 《五行精紀》 전이 |
| target→raw interval | `direct, source-local` | 원면의 날짜·시각·`五日三時`·`六十三時` 보존 | timezone·calendar API·exact astronomical instant |
| raw interval→`三日為年` | `direct, multi-witness wording` | formula literal과 raw quantity를 분리 저장 | 현대 월·일·시 환산, 자동 rounding |
| raw/result→`奇·零·欠` | `direct, source-local` | printed residual token과 위치 보존 | universal lexical definition, 음수·floor·carry semantics |
| explicit 月建→first pillar | `direct output; bounded relation` | named pair `丙寅→丁卯`, `戊寅→己卯`, `戊寅→丁丑`, `丙寅→乙丑` | 모든 月建에 대한 보편 next/previous generator |
| first→second→third | `direct repeated` | 실제 인쇄된 rows와 +10 age markers 보존 | 《五行精紀》의 `起於丁丑` 뒤 전체 열 추정 |
| `一日主四箇月`·`一時十日` | `partial/unresolved` | 외부 textual layer의 direct gloss를 별도 annotation으로 보존 | 《五行精紀》의 direct rule·현대 계산 규격으로 전이 |
| copy/edition/lineage | `unresolved` | page-level correspondence와 source roles 분리 | 공통 저본·판본 선후·정본성 |
| semantic authority/readiness | `blocked` | evidence/replay packet만 | 해석 권위·production activation |

## 6. 실제 blocker가 발생하는 최초 지점

### 6.1 입력에서 target까지

`生日後未來節氣日`·`生日前過去節氣日`은 source wording으로 닫히지만, 다음은 닫히지 않는다.

- 생년월일시만으로 어떤 節을 자동 선택할지.
- `節`·`節氣`·`中氣`의 보편적 범위.
- 출생시각이 target 시각과 같거나 경계에 걸릴 때의 포함/배제.
- timezone, true-solar-time, 현대 천문 API.

따라서 `selectedTerm`은 flow의 **explicit input**으로만 취급한다.

### 6.2 raw interval에서 시작 age까지

`三日為年`과 `一辰十歲`는 source-level wording으로 닫힌다. 그러나 `五日三時`, `六十三時`, `六百三十日`, `一歲奇九月`을 현대식 년·월·일·시 결과로 만드는 공통 규격은 닫히지 않는다. `一日主四箇月`은 외부 `李仝曰` gloss layer의 direct observation일 뿐이며, `一時十日`은 exact phrase로 승격하지 않는다.

### 6.3 月柱/月建에서 first pillar까지

명시된 `正月建丙寅`·`正月起戊寅`·`生月庚寅`·`生月壬寅`이 있는 worked example에서는 first output의 source-local 관계가 직접 보인다. 하지만 다음 연결은 없다.

```text
birth date/time + year/month data → 月柱/月建
月柱/月建 → 모든 경우의 first 大運
```

그러므로 `月柱`·`月建` 산출을 이 flow의 선행 단계로 자동 삽입하지 않는다.

### 6.4 first 이후

일부 sources는 2·3번째 rows를 직접 제공하지만, `起於丁丑` 뒤의 《五行精紀》 전체 열은 확보되지 않았다. 따라서 후속열은 source가 실제로 인쇄한 범위에서만 replay한다.

## 7. 새 frontier의 범위

이번 successor에서 전진한 것은 domain rule 자체가 아니라 **evidence-flow assembly gate**다.

```text
기존:
  방향·term·환산·first pillar·후속열이 각각 별도 successor에 분산

현재:
  same-window 五行精紀 chain:
    direction → target → raw interval → literal conversion
    → residual → printed first output

  separate worked-example chain:
    source-provided month pillar → first output
    → printed second/third rows

  두 chain은 조건부 evidence relation으로 연결할 수 있지만,
  월柱 산출과 universal generator를 사이에 삽입할 수는 없음
```

따라서 이 문서가 승격하는 frontier는 다음 한 문장이다.

> 직접 원면에서 모든 중간 필드가 실제로 나타난 경우, 방향·target·raw 경과량·고전 환산 문구·잔여 표기·printed first output까지는 하나의 source-local evidence chain으로 재현할 수 있다. 명시된 月建/月柱와 후속 표가 별도로 존재하는 worked example에서는 first→second→third 열도 source-local하게 재현할 수 있다. 그러나 두 chain을 birth input에서 universal 大運 생성기로 합치는 단계는 unresolved다.

## 8. 보존할 blocker와 검증 경계

- 《五行精紀》 K3/NLC/연세대 page-level source의 raw bytes·exact machine binding·copy-level independence.
- `月柱/月建` 산출과 연간 간지에서 월건을 만드는 별도 규칙.
- 자동 節 selector, 12節/中氣 분류, endpoint·경계시각.
- `五日三時`·`六十三時` 및 `奇·零·欠`의 현대 단위 환산·rounding·carry.
- `一日主四箇月`·`一時辰得十日之數`의 textual layer와 《五行精紀》 copy-level bridge.
- 모든 月建에 대한 first-pillar generator와 `起於丁丑` 뒤의 전체 大運 열.
- 특정 판본 계보·공통 저본·정본성·textual independence.
- semantic authority, interpretation readiness, production activation.

이 successor는 원본 PDF·임시 render·기존 canonical artifact·기존 tracked/untracked 연구자료를 수정하거나 저장소에 복사하지 않는 documentation-only overlay다. 앱 runtime/build는 이 historical flow boundary를 검증하지 않으므로 실행하지 않는다. 검증 대상은 문서의 source links, existing page locators, claim statuses, fail-closed conditions, staged path다.

최종 상태:

```text
same-window 五行精紀 chain             direct through printed first output
explicit month-pillar → first pair     direct, named examples only
first → second → third rows            direct repeated, source-local
birth → automatic 月柱/月建             unresolved
automatic term selector                 unresolved
modern time/unit conversion             unresolved
universal first/subsequent generator    unresolved
textual lineage / independence          unresolved
semantic authority / readiness          blocked
production activation                   blocked
```
