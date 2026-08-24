# 《五行精紀》卷33「大運」 bounded algorithmization boundary successor v1

상태: `claim-level bounded algorithmization boundary`, `runtime/readiness promotion blocked`

기준일: `2026-08-24 KST`

이 문서는 기존 《五行精紀》·《珞琭子》·《三命通會》·《淵海子平》의 direct-witness와 historical-bridge 문서를 덮어쓰지 않는 additive successor다. 새 원면을 canonical source로 추가하는 문서가 아니라, 이미 직접 관찰된 `三日為年` 관련 면을 **현대 알고리즘으로 옮길 수 있는 최소한의 구조와 옮길 수 없는 빈칸**으로 claim별 분해한다.

`一日四月`·`一時十日`이라는 현대식 축약, 자동 절기 선택, endpoint·rounding, 특정 대운 기둥의 일반화, semantic authority·interpretation readiness·production activation은 이 문서에서 승격하지 않는다.

## 1. 판정 요약

```text
방향 문구                         = witness별 direct; cross-witness universal mapping은 partial
미래/과거 節·節氣 선택             = direct/partial; 선택 대상은 explicit input으로만 안전화
출생일·출생시 기준                 = example-level direct; boundary/time basis는 unresolved
三日為年 / 三日為一歲               = multi-witness direct; source-unit relation만 bounded
일·시 환산 수량                    = 일부 derivative/CADAL direct; modern shorthand normalization 금지
worked example                     = direct page observation; replay fixture only
大運 첫 기둥                       = example-level direct; 일반 생성 규칙 unresolved
endpoint·inclusive/exclusive       = unresolved
rounding·約法/實歷 선택             = conflicting/under-specified
현대 一日四月·一時十日               = exact shorthand not promoted
algorithmic specification           = bounded intermediate contract only
implementation-safe grounding      = not established
semantic authority/readiness        = blocked
production activation              = blocked
```

이번 successor가 닫는 좁은 명제는 다음과 같다.

> 직접 관찰된 자료는 `방향/선택된 절기/출생시점으로부터의 raw 경과량/三日為年`을 서로 분리된 입력·관찰 필드로 보존하는 알고리즘 경계를 지지한다. 그러나 그 필드에서 현대식 `起運歲月日時` 또는 첫 대운 기둥을 자동 산출하려면 절기 선택·시간 기준·경계 포함 여부·잔여량 처리·반올림·월/시 환산에 대한 추가 authority가 필요하며, 현재 자료는 그 규격을 닫지 않는다.

## 2. 직접 관찰된 evidence layer

### 2.1 《五行精紀》卷33 direct witness family

기존 장서각·NLC·연세대 및 중국 NLC/필사본 대조 문서에서 다음 구간이 직접 관찰되어 있다.

```text
運行則一辰十歲折除乃三日為年
陽男陰女大運以生日後未來節氣日為數順而行之
陰男陽女大運以生日之前過去節氣日為數逆而行之
```

`甲子陽男` example에는 다음 순서가 보존된다.

```text
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

이 구간은 방향·절기·시간·산술·첫 기둥이 한 문맥에 있음을 직접 보이지만, 문장에 없는 현대 endpoint·timezone·rounding 규칙까지 제공하지 않는다. `今人行運多用約法以一歲奇八月`이라는 후속 비판도 직접 관찰되므로 `一歲奇九月`과 약법의 `一歲奇八月`을 임의로 하나의 결과로 합치지 않는다.

근거 문서: [卷33 cross-edition correspondence successor](./saju-wuxingjingji-vol33-d运-cross-edition-correspondence-successor-v1.md), [conversion claim successor](./saju-wuxingjingji-vol33-conversion-claim-successor-v1.md).

### 2.2 후대 명리 문헌의 direct/near-direct pages

| witness | 직접 관찰된 범위 | layer boundary |
|---|---|---|
| NLC 99036 《淵海子平》 p.50–51 | `凡起大運俱從所生之日`, `陽男陰女順行/陽女陰男逆行`, `過去節俱折除三日以為一歲`, `立春`, 그리고 `十五日 → 五三十五 → 五歲 → 逆行丁丑`, `得九日 → 三三單九 → 三歲 → 逆行乙丑` | exact scan page; literal variant와 example을 보존하며 universal rule로 일반화하지 않음 |
| ANU 《三命通會》 V2 pp.58–59 | 順逆, 앞/뒤 `節` 선택, `三日為一歲`, worked example | direct scan observation; `一日四月`, `一時辰十日`, modern timestamp/rounding은 직접 닫히지 않음 |
| NCL Taiwan 1578 《三命通會》 viewer p.150–151 | `折除以三日為年`, 방향, `立春`, `三日而成一歲` 계열 | first-party visual capture; viewer index·raw bytes·printed folio는 unresolved |
| NLC 06857 corrected derivative pp.105–106 | `運行則一辰十歲`, `折除乃三日為年`, `凡三日有三十六時`, `一日十二時...四箇月`, `一時辰得十日之數`, 甲子 example | direct derivative scan; official raw-page equality·lineage·implementation safety는 unresolved |
| CADAL/Zhejiang University 《珞琭子賦注》 pp.16–20 | `一日之內十二時`, `凡三日有三十六時`, `三百六十日為一歲`, `一辰之十歲`, `李仝曰 ... 一日主四箇月 ... 三日為一年` | later compilation/near-text witness; explanatory layer와 현대 규격을 분리 |

NLC 06857 derivative와 CADAL 면에 더 긴 수량 문구가 직접 보인다는 사실은 기록할 수 있다. 다만 그것은 `一日四月`·`一時十日`이라는 현대식 축약을 canonical phrase나 production conversion으로 승인하는 근거가 아니다.

재현 artifact는 [LUNA P0 parent verification](./saju-luna-p0-evidence-acquisition-adjudication-v2.md), [later-text historical bridge](./saju-luoluzi-later-mingli-historical-bridge-successor-v1.md), [`complete.json`](../artifacts/saju-luna-p0-evidence-acquisition-adjudication-v2/complete.json), [source/page frontier](../src/interpretationPrep/sajuFiveClassicsSourceIdentityFrontier.js)에 고정되어 있다.

## 3. Claim-level adjudication

| claim ID | evidence status | 안전하게 규격화할 수 있는 범위 | 규격화하지 않는 빈칸 |
|---|---|---|---|
| `dayun.direction.phrase` | `direct` within 《五行精紀》; `partial` across later witnesses | source profile 안에서 `future/順`와 `past/逆`을 관찰값으로 보존하고, 선택된 branch를 명시적 enum으로 전달 | `陽男陰女`·`陽女陰男`·`陰男陽女`의 모든 witness를 하나의 현대 sex/yin-yang mapping으로 정규화하지 않음 |
| `dayun.term.selection` | `direct/partial` | `selectedTerm`을 caller가 명시하고, 그 term이 source phrase상 미래/과거 대상인지 별도 검증 필드로 보존 | 자동으로 다음/이전 節을 고르기, `節`과 `節氣`를 무조건 동치화하기, `立春`을 보편 anchor로 고정하기 |
| `dayun.birth.reference` | `direct` at example level | 출생 date/time과 선택 term을 각각 raw structured input으로 보존 | `生日`·`所生之日`·`巳時`를 현대 timestamp 하나로 자동 합치기, timezone·true-solar-time·calendar basis 선택 |
| `dayun.raw.elapsed` | `direct/partial` | source에 보인 raw day/hour count를 exact integer fields로 보존하고, birth→term interval을 external calendar layer의 계산 결과로 분리 | source가 지정하지 않은 civil-calendar conversion, midnight/term instant convention, 시간대 적용 |
| `dayun.three-days-one-year` | `direct`, multi-witness | `formula = 三日為年/三日為一歲`와 `rawDays`를 별도 보존; 필요하면 `rawDays ÷ 3`을 **비권위 diagnostic ratio**로만 계산 | 그 ratio를 곧바로 起運 나이·월·일·시로 출력하거나 반올림하지 않음 |
| `dayun.hour-day-gloss` | `direct` in specific derivative/CADAL layers; `partial` as cross-text authority | exact observed strings와 source layer를 기록하고, 수량 chain을 evidence annotation으로 표시 | `一日四月`·`一時十日` 축약, `一辰=一時` 등 단위 동치, 모든 witness에 적용되는 modern conversion |
| `dayun.worked-example` | `direct` page observation | `甲子陽男`, NLC 99036 두 example, `五三十五`·`三三單九`·`丁丑`·`乙丑`를 literal replay fixture로 보존 | 한두 example에서 universal algorithm, missing examples, 모든 sex/term case의 output을 추론 |
| `dayun.first-pillar` | `direct` only as example output | source page에 실제 보이는 `起於丁丑`/`逆行乙丑`를 witness-specific observed output으로 저장 | 월주·월지·순역에서 첫 기둥을 일반 생성하는 production rule |
| `dayun.remainder` | `direct` as text, `unresolved` as procedure | `五日三時`, `六十三時`, `一歲奇九月`, `一歲奇八月`을 literal/variant fields로 보존 | 잔여량의 단위 변환, `三三單九`의 정규 해석, `約法`과 `實歷` 중 default 선택 |
| `dayun.boundary` | `unresolved` | boundary status를 명시적으로 `unresolved`로 반환 | term instant 포함/배제, birth-at-term, same-day, midnight crossing, exact endpoint |
| `dayun.rounding` | `unresolved/conflicted` | rounding policy를 required-but-missing parameter로 표시 | floor/ceil/nearest, 월·일·시 carry, `一歲奇九月`과 약법 결과의 자동 선택 |
| `dayun.readiness` | `blocked` | none beyond evidence packet/replay scope | semantic authority, interpretation readiness, production activation |

## 4. Bounded algorithm contract

현재 자료로 안전하게 표현할 수 있는 것은 **계산기**가 아니라 다음의 fail-closed intermediate contract다.

```text
input
  sourceProfile: explicit witness/rule profile
  birthDateTime: raw date/time plus externally declared calendar/time basis
  selectedTerm: explicit 節/節氣 record; not auto-selected here
  directionObservation: source phrase + future/順 or past/逆 label
  rawElapsed: exact source-visible day/hour quantities, if available

derive (bounded, non-authoritative)
  preserve sourceFormula = 三日為年 | 三日為一歲
  preserve rawElapsed without month/hour normalization
  optionally expose diagnosticRatio = rawDays / 3
  attach literalExample / variant strings when an inspected page supplies them

return
  raw inputs, source-layer references, diagnostic ratio, unresolved fields
  status = historical_bounded_not_ready

must fail closed when
  selectedTerm is implicit
  calendar/time basis is absent
  boundary or rounding policy is absent
  a modern shorthand is substituted for the observed wording
  first 大運 pillar is inferred from one example
```

`diagnosticRatio`는 `三日為年`을 숫자로 점검하기 위한 비권위 산술 표시일 뿐이다. 예를 들어 `六十三時`와 `六百三十日`의 관계를 재계산해 보는 것은 가능하지만, 그 결과를 곧바로 현대 `起運` 나이·월·일·시 또는 첫 대운으로 소비하지 않는다.

## 5. 경계조건 판정

### 5.1 닫힌 것

- 방향과 절기까지의 거리라는 **문헌 문맥**은 직접 관찰된다.
- `三日為年/三日為一歲`라는 역사적 환산 문구와 일부 수량 chain은 직접 관찰된다.
- 실제 example에 `出生 date/time → target 節 → raw distance → conversion text → first pillar` 순서가 보인다.
- 서로 다른 witness가 같은 구조를 보인다는 bounded corroboration은 유지된다.

### 5.2 닫히지 않은 것

- `生日後未來節氣日`와 `生日之前過去節氣日`의 exact target selection algorithm.
- `所生之日`과 시각 단위의 관계, term instant, timezone, true solar time.
- `五三十五`, `三三單九`, `一歲奇九月`, `一歲奇八月`의 canonical arithmetic interpretation.
- remainder를 월·일·시로 분해하는 순서와 rounding.
- birth exactly at a term, same-day term, midnight crossing, missing/ambiguous time.
- `丁丑`·`乙丑` example을 일반적인 첫 대운 기둥 생성 규칙으로 확장하는 근거.
- exact modern shorthand `一日四月`·`一時十日`을 모든 witness와 현대 입력에 적용하는 근거.

따라서 `三日為年`은 **source-level relation으로는 bounded-closed**, 전체 起運 알고리즘으로는 **unresolved**다.

## 6. Promotion boundary

### 이번 successor에서 advance한 것

- 기존 historical bridge를 방향·절기·raw interval·환산·example·boundary claim으로 분리했다.
- direct wording, derivative wording, arithmetic restatement, implementation inference의 층을 분리했다.
- 현대 알고리즘에 전달 가능한 최소 필드와 fail-closed 조건을 명시했다.
- example replay와 production calculation을 분리했다.

### 승격하지 않은 것

- `一日四月`, `一時十日`의 현대식 shorthand.
- `一日主四箇月`·`一時辰得十日之數`를 universal rule 또는 semantic authority로 취급하는 것.
- 자동 절기 선택, timezone, true-solar-time, endpoint, inclusive/exclusive convention.
- floor/ceil/nearest 및 residual carry 규칙.
- 특정 판본·공통조상·textual independence·정본성.
- implementation-safe grounding, semantic authority, interpretation readiness, production activation.

최종 상태:

```text
claim-level historical evidence          direct/partial by claim
source-unit relation 三日為年            bounded-closed
modern 起運 algorithm                    unresolved
modern shorthand 一日四月/一時十日         not promoted
endpoint / rounding                      unresolved
semantic authority / readiness           blocked
production activation                    blocked
```

## 7. Validation and preservation

이 문서는 기존 source bytes와 canonical artifacts를 수정하지 않는 documentation-only overlay다.

- direct observation IDs, source byte hashes, page locators, and blocker states는 기존 source frontier/artifact에서 재확인했다.
- `complete.json`의 `P0-B.six-stage-chain`·`P0-B.worked-example`는 direct derivative observation으로만 사용하고, artifact가 명시한 `implementation_safe_grounding: not_established`를 유지한다.
- `main`의 기존 untracked research documents와 대용량 원본 PDF는 stage·삭제·수정 대상이 아니다.
- 이 문서만 atomic commit 대상으로 한다.

문서 전용 successor이므로 앱 runtime test/build는 이 문서의 historical boundary를 검증하는 수단이 아니며, publication 전 `git diff --check`와 staged-path 검사를 수행한다.
