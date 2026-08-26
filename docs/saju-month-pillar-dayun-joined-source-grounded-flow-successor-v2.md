# 月柱/月建→起運→大運 source-grounded joined-flow bounded successor v2

상태: `frontier advanced: one same-source worked case closes the joined evidence path`; `universal generation/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 [기존 joined-flow successor v1](./saju-dayun-source-grounded-flow-successor-v1.md)와 [五年干→寅月 worked-example successor v3](./saju-month-pillar-worked-example-frontier-successor-v3.md)의 additive successor다. 목적은 생년·節 경계·月柱/月建·순역·起運 나이·첫 大運·후속 大運이 실제로 한 source-local worked case에서 연속되는지 재판정하는 것이다. 기존 문서를 덮어쓰거나, 서로 다른 문헌의 관찰을 하나의 물리적 copy·판본·계산기로 합치지 않는다.

`source-grounded flow`는 원면에 인쇄된 입력·출력·문장을 순서대로 보존하는 evidence chain을 뜻한다. 현대 절기 API, timezone, 진태양시, endpoint, rounding, `欠`의 일반 산술, 보편 月柱/大運 생성기, semantic authority, interpretation readiness, production activation은 이 문서에서 승격하지 않는다.

## 1. 결론: 이번에 실제로 닫힌 최대 범위

이번 재판정에서 처음으로 하나의 동일한 《命理探原》 worked case를 다음처럼 page-level로 이어 붙일 수 있다.

```text
丙午年 正月初九日 午時生
  → (萬年曆의 同日午時立春을 함께 적은 推月法 문맥)
  → 丙辛必定尋庚起 · source output `庚寅`
  → 같은 책의 `丙午年 庚寅月 初九日 午時生男。順`
  → 驚蟄節까지의 source-visible date/time 문맥
  → source raw elapsed line + `以三日為一歲折之`
  → `十歲欠三十天`
  → `起運從生月庚寅順佈。始行辛卯`
  → 표의 `初十辛卯 · 二十壬辰 · 三十癸巳`
```

위 chain에서 `庚寅`은 생년월일시로부터 자동 계산한 값이 아니라 p.55 `推月法`이 그 worked case에 **직접 인쇄한 월주/월건 출력**이다. p.60은 같은 연도·날짜·시각을 `庚寅月`로 다시 표기하고 남성·순행 문맥을 붙이며, p.61은 그 case의 target·raw quantity·起運 나이·첫/후속 大運을 잇는다. 따라서 이 한 case에 대한 **source-local joined observation**은 전진한다.

그러나 다음은 여전히 닫히지 않는다.

```text
모든 생년월일시 → 자동 月柱/月建
모든 case의 月柱 → 첫 大運 생성
生日과 節 경계의 일반 포함/배제
raw date/time → 현대식 age·월·일·시의 공통 환산
모든 문헌·판본에 대한 동일 계보·정본성·semantic authority
```

특히 p.55와 p.60–61의 연결은 같은 《命理探原》 scan surface에서 같은 `丙午年·正月初九日·午時·庚寅` tuple이 반복되는 것을 근거로 한 **bounded same-source case join**이다. 이것을 서로 다른 독립 physical witness, 기관 원본 byte binding, 문헌 간 직접 계보로 세지 않는다.

## 2. 동일 source-local worked case의 직접 근거

### 2.1 p.55 `推月法`: 생년·경계시각·月柱 출력

- [NLC-attributed public scan PDF p.55](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E6%BA%90.pdf#page=55)
- local review bytes: `/private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf`
- local review SHA-256: `8e8ebf3aa66781a3fb49a4acfc17229b6d0255af81a7cb9de0f83bafd43eb5ab`

p.55의 인접한 다른 `巳時` 경계 example과 섞지 않고, 다음 `午時` block만 사용한다.

```text
又如丙午年正月初九日午時生。
萬年曆載明是年正月初九日午時立春。
……丙辛必定尋庚起……是丙午年正月遁得庚寅也。
```

이 면에서 직접 닫히는 것은 다음이다.

- `丙午年·正月初九日·午時`라는 source-visible birth tuple.
- 같은 날 `午時`의 `立春`이라는 source-visible boundary statement.
- `丙辛必定尋庚起`라는 source wording과 `庚寅`이라는 그 worked block의 출력.

이는 특정 입력의 `月柱/月建 observed output = 庚寅`을 지지한다. 출생시각과 立春 표기가 같은 `午時`라는 사실은 **source-local equality boundary observation**으로만 둔다. 이 한 면으로 현대 `<`/`<=`, 경계 포함·배제, timezone, 천문시각을 정하지 않는다.

### 2.2 p.60: 같은 tuple의 `庚寅月` 재표기와 순행 입력

- [NLC-attributed public scan PDF p.60](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=60)

`命理探原 卷上 起例`의 `陽男陰女` 문맥에서 다음 case 시작을 직접 확인한다.

```text
假如丙午年庚寅月初九日午時生男。順……
```

p.55의 `丙午年正月初九日午時`와 p.60의 `丙午年庚寅月初九日午時生男`은 연도·날짜·시각이 같고 p.55에서 그 월 출력 `庚寅`이 직접 제시된다. 이 반복 tuple을 근거로 p.55의 `庚寅` 출력과 p.60의 `庚寅月` 입력을 하나의 **bounded same-source worked-case join**으로 기록한다. 남성에서 `順`이라는 방향 표기도 p.60에 직접 있다.

이 join이 말하는 범위는 `이 case에서 source가 月柱를 계산해 둔 뒤 그 값을 大運 입력으로 사용한다`는 관찰이다. `月柱`를 계산하는 현대 함수나 모든 case에 대한 자동 연결은 아니다.

### 2.3 p.61 printed `三〇`: target·raw quantity·起運 나이·첫/후속 大運

- [NLC-attributed public scan PDF p.61](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=61)
- direct render used in review: `/private/tmp/saju-term-review/mingli-chain-hi/p61.jpg` (higher-resolution re-render is reproducible below)

p.60의 `生男。順`에 이어지는 p.61 surface에는 다음 stable tokens가 같은 worked block에 직접 보인다.

```text
數至二月初九日卯時驚蟄節。
實歷有三十天……時。
以三日為一歲折之。
是為十歲欠三十天。
起運從生月庚寅順佈。始行辛卯。列式於左。
```

`實歷有三十天……時`의 짧은 잔여 시각 token은 이 문서에서 현대 단위로 정규화하지 않는다. 중요한 direct boundary는 source가 `驚蟄節`, raw quantity line, `以三日為一歲折之`, `十歲欠三十天`, `生月庚寅`, `順佈`, `始行辛卯`를 같은 계산 문맥에 놓았다는 점이다.

`列式於左` 표에는 이 case에 대응하는 `辛卯` 뒤의 `壬辰·癸巳`가 이어진다. 따라서 이번 flow에는 다음 후속열만 source literal로 포함한다.

```text
初十辛卯 · 二十壬辰 · 三十癸巳
```

`十歲`와 `初十`의 대응, `欠三十天`의 endpoint, 후속 age marker의 현대적 의미는 source-local 표기 대응을 넘어서지 않는다.

## 3. 연결 단계별 adjudication

| 단계 | 현재 직접 근거 | 상태 | 안전한 승격 범위 | 남은 blocker |
|---|---|---|---|---|
| 생년·생시 입력 | `丙午年正月初九日午時生` (p.55) | `direct, source-local` | 이 worked tuple 보존 | 모든 날짜·시각 입력의 표준화 |
| 節 경계 | 같은 날 `午時立春` (p.55) | `direct equality observation` | 이 면의 경계 표기 보존 | 일반 포함/배제, exact instant, timezone |
| 입력→月柱/月建 | `丙辛必定尋庚起`→`庚寅` (p.55) | `direct, case-local` | 이 case의 observed `庚寅` 출력 | 보편 Month-pillar generator, 모든 節 경계 |
| 같은 case의 月柱 재표기 | `丙午年庚寅月...生男` (p.60) | `bounded same-source join` | p.55 출력과 p.60 입력의 tuple 연결 | 기관 raw bytes, 독립 copy, 계보 |
| 순·역 방향 | `生男。順`, `順佈` (p.60–61) | `direct, case-local` | 이 case의 순행 표기 | 모든 성별·干年 조합의 enum 규격 |
| target 節 | `驚蟄節` (p.61) | `direct, named target` | source가 선택해 적은 target 보존 | 자동 selector, 12節-only, 中氣 배제 |
| target까지 raw 경과 | `實歷有三十天……時` (p.61) | `direct, literal but partial transcription` | source-visible raw quantity와 위치 보존 | 짧은 token 판독, 달력·시간대·endpoint |
| raw→起運 나이 | `以三日為一歲折之`→`十歲欠三十天` | `direct, source-local` | source formula와 reported output의 순서 보존 | 현대 년·월·일·시 환산, `欠` semantics |
| 月柱→첫 大運 | `從生月庚寅順佈。始行辛卯` | `direct output + bounded relation` | 이 case의 `庚寅`→`辛卯` 표기 관계 | 모든 月柱의 universal next-step generator |
| 첫→후속 大運 | `初十辛卯·二十壬辰·三十癸巳` | `direct, case-local` | 실제 표에 인쇄된 후속열 | 전체 60-cycle production generator |
| semantic authority/readiness | 직접 닫힌 gate 없음 | `blocked` | evidence/replay locator만 | authority, interpretation, production activation |

## 4. 전체 흐름에 대한 최종 판정

### 4.1 이 한 case에서 조립 가능한 흐름

다음은 현재 가장 강한 source-grounded 표현이다.

```text
source-visible birth tuple
  → source-visible same-time 立春 boundary
  → source's `丙辛必定尋庚起` and observed `庚寅`
  → same-source case's explicit `庚寅月` and male/順 label
  → source-named `驚蟄節`
  → source raw elapsed wording
  → source formula `三日為一歲`
  → source-reported `十歲欠三十天`
  → source first output `始行辛卯`
  → source printed later rows `壬辰·癸巳`
```

각 화살표는 동일한 현대 계산식의 실행이 아니라, p.55와 p.60–61에 실제로 인쇄된 fields와 문장을 이어 읽는 bounded evidence relation이다. 특히 p.55의 `午時立春`은 boundary equality를 보여주지만, p.61의 `驚蟄節` 선택과 결합해 일반 term-selector 규칙으로 확장하지 않는다.

### 4.2 《五行精紀》와 다른 witness에 대한 범위

《五行精紀》 卷33의 K3/NLC/연세대 page window는 별도로 다음을 직접 닫는다.

```text
방향 → source-named target → raw date/time quantities
→ `三日為年` 계열 문구 → residual → printed first output
```

하지만 현재 《五行精紀》 卷33 window에는 이 `丙午年正月初九日午時` worked case의 `推月法` 월주 계산 block과 같은 page-level chain이 없다. 따라서 `命理探原` p.55–61의 완성된 case를 《五行精紀》의 `甲子...起於丁丑`에 전이하지 않는다. `五行精紀`의 `起於丁丑`은 여전히 그 원면의 printed output이며, 월주 산출·후속열을 역으로 삽입하지 않는다.

v3에서 확보한 다섯 年干 group의 `甲己→丙寅`, `乙庚→戊寅`, `丙辛→庚寅`, `丁壬→壬寅`, `戊癸→甲寅`은 **month-pillar worked application coverage = 5/5**를 지지한다. 그 중 `丙辛→庚寅`이 이번 same-source case와 겹치지만, 다른 네 group의 month output을 大運 chain에 연결하거나 다섯 group 모두의 자동 계산을 닫은 것은 아니다.

## 5. claim-level 승격과 미승격

| claim | status | 이번 successor가 허용하는 표현 | 승격하지 않는 표현 |
|---|---|---|---|
| 특정 `丙午` case의 생년·경계→`庚寅` | `direct, case-local` | p.55의 입력·`午時立春`·`庚寅` 출력 | 모든 출생 입력의 자동 月柱 계산 |
| p.55 출력과 p.60 `庚寅月`의 연결 | `bounded same-source join` | 동일 tuple에 근거한 case join | 기관 copy identity, 독립성, 직접 계보 |
| 해당 case의 男→順 | `direct, case-local` | p.60 `生男。順`, p.61 `順佈` | 보편 성별/年干 direction enum |
| `驚蟄節`까지의 raw 계산 | `direct, partial literal` | named target·raw line·source formula 보존 | target 자동 선택, 중기 배제, exact short-token transcription 확정 |
| raw→`十歲欠三十天` | `direct, source-local` | 문헌의 formula와 reported output의 연결 | 현대 환산·endpoint·rounding·`欠`의 공통 semantics |
| `庚寅`→`辛卯` 및 후속 `壬辰·癸巳` | `direct, case-local` | `始行`과 표의 literal rows | 모든 月柱에 대한 보편 next/previous generator |
| `月柱/月建→순역→起運→大運` 전체 | `direct only for matched case; general = partial` | 하나의 source-local worked-case evidence path | 모든 문헌·모든 판본의 executable algorithm |
| lineage / 정본성 | `unresolved` | page-level textual/case correspondence | 공통 저본·판본 선후·textual independence |
| semantic authority/readiness/activation | `blocked` | 없음 | semantic authority 전체·production readiness |

## 6. 남은 blocker와 독립성 판정

### 닫힌 것

- `命理探原` p.55의 특정 `丙午年正月初九日午時` case에서 `庚寅` month output.
- 같은 scan surface p.60–61에서 그 tuple이 `庚寅月`로 재표기되고, 남성·순행·target·起運 나이·첫/후속 大運으로 이어지는 것.
- p.61의 `始行辛卯`와 표의 `壬辰·癸巳`가 source-local 후속열을 이루는 것.
- 기존 `五行精紀` same-window chain과 five-group month worked coverage는 각각의 원면 범위 안에서 유지.

### unresolved / blocked

- p.55–61 공개 scan의 기관 원본 raw bytes·exact machine binding.
- p.55와 p.60–61의 same-source join을 넘는 physical-copy identity 또는 textual lineage.
- `午時立春` equality에서의 일반 endpoint 포함/배제.
- `驚蟄節`의 자동 선택 규칙, 12節/24節氣/中氣 범위.
- `實歷` raw quantity의 역사적 시간단위와 현대식 환산, `欠`의 endpoint/carry/rounding.
- 이 case의 `庚寅→辛卯` 관계를 모든 月柱와 모든 문헌의 생성기로 일반화하는 것.
- `五行精紀` 卷33에 `命理探原`의 月柱 worked block 또는 동일 계산 path를 전이하는 것.
- edition/textual lineage, 공통조상, 정본성, semantic authority, interpretation readiness, production activation.

독립성은 다음처럼 분리한다.

```text
命理探原 p.55 ↔ p.60–61       same-source page/case join; not independent copies
命理探原 ↔ 五行精紀/K3/NLC/Yonsei  cross-source corroboration only
five 年干 groups                 five named application surfaces; not five independent copies
```

## 7. 재현·검증·Git 경계

직접 page render:

```bash
pdftoppm -f 55 -l 55 -r 800 -png -singlefile \
  /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf \
  /private/tmp/current-witness-review/5318/month-p55
pdftoppm -f 60 -l 61 -r 800 -png \
  /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf \
  /private/tmp/current-witness-review/5318/dayun-p
```

검증 대상은 다음으로 제한한다.

1. local review PDF hash가 기존 v3 기록과 일치하는지 확인.
2. p.55의 `丙午年正月初九日午時`·`午時立春`·`庚寅`과 p.60의 `丙午年庚寅月初九日午時生男` tuple을 재독.
3. p.61의 `驚蟄節`·`以三日為一歲折之`·`十歲欠三十天`·`始行辛卯`·`壬辰/癸巳`를 재독.
4. `git diff --check`와 staged path가 이 문서 하나인지 확인.

원본 대용량 PDF, `/private/tmp` review/render bytes, 기존 canonical 문서, tracked design/scheduler scripts, Wonkwang·Sonkeik 관련 untracked 자료는 repository에 복사·수정·삭제하지 않는다. 이 successor의 atomic commit allowlist는 이 문서 하나다. 앱 runtime/build는 historical source claim을 검증하지 않으므로 실행하지 않는다.

최종 frontier:

```text
특정 命理探原 case: birth/boundary → observed 月柱 → 順 → 起運 age
                 → first → later 大運 rows       direct, source-local joined
五行精紀 卷33:    direction → target → raw → formula → residual → first
                                                     direct, separate chain
five 年干 month applications                    direct 5/5, source-local
universal 月柱→大運 generator                     unresolved
endpoint/timezone/API/rounding                   blocked or unresolved
edition lineage/semantic authority/readiness     unresolved / blocked
```
