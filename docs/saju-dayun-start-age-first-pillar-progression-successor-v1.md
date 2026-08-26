# 起運 시작 나이→첫 大運→후속 10년 干支열 bounded successor v1

상태: `bounded joined worked-example structure advanced`, `universal age/endpoint/generation/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 [후속 大運 干支열 successor](./saju-dayun-subsequent-ganzhi-progression-successor-v1.md)의 additive successor다. 기존 문서가 first→second→third 干支의 방향성과 인접성을 따로 확인했다면, 이번 문서는 **한 worked example 안에서 시작 나이 표기, 첫 大運 干支, 이후 10년 단위 나이·干支열이 함께 연결되는지**를 검증한다.

`欠` 잔여값, `初十·初一` 같은 age locator, `上運·始行`이라는 first-pillar 표기, 후속 干支 literal을 분리한다. 이 연결은 source-local direct evidence이지 현대 나이 계산·endpoint·rounding·production algorithm의 승인이 아니다.

## 1. bounded 결론

네 worked example에서 다음 결합이 직접 확인된다.

| source page | 시작 나이/잔여 표기 | 첫 大運 | 이후 10년 단위 열 | 방향 |
|---|---|---|---|---|
| 《子平命術要訣》 p.18, printed `十四` | `五歲` 및 같은 page의 `五歲上運欠三月` | `五歲上庚子運` | `十五歲上辛丑運`, 도식 `二十五壬寅` | 順行 |
| 《子平命術要訣》 p.18, printed `十四` | `五歲` | `五歲上戊戌運` | `十五歲上丁酉運`, 도식 `二十五丙申` | 逆行 |
| 《命理探原》 p.61, printed `三〇` | `十歲欠三十天` | `始行辛卯`, 표 `初十辛卯` | `二十壬辰`, `三十癸巳` | 順行 |
| 《命理探原》 p.62, printed `三一` | `一歲欠三百一十天` | `始行辛丑`, 표 `初一辛丑` | `十一庚子`, `廿一己亥` | 逆行 |

현재 승격 가능한 가장 좁은 구조는 다음이다.

> inspected worked example에서는 source가 먼저 起運 시작 나이(때로는 `欠` 잔여와 함께)를 보고하고, 같은 사례의 `上運` 또는 `始行` 뒤에 첫 大運 干支를 붙인 다음, 10 단위가 증가하는 age locator와 방향에 맞는 후속 干支를 연속해서 제시한다.

이 구조는 두 개의 별도 scan title surface와 순·역 양방향에서 반복된다. 다만 이 반복만으로 `欠`의 역사적 endpoint 처리, 모든 문헌의 `一運管十年` semantics, 月柱에서 first pillar를 산출하는 공식, 특정 textual lineage, semantic authority/readiness를 닫지 않는다.

## 2. 직접 page-level worked examples

### 2.1 《子平命術要訣》 p.18 / printed `十四`

- [Commons file record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3_%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf)
- [public scan PDF](https://upload.wikimedia.org/wikipedia/commons/c/c7/NLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3_%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf)
- local review derivative: `/private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf`
- observed PDF: `65 pages`, `2,575,411 bytes`
- PDF SHA-256: `885bf4db4a6a80a0a7d308ef200ad97da424676b9003f16f72633874f27f795b`
- direct render: `/private/tmp/current-witness-review/early/ziping18-hi-18.png`

순행 example의 page-local chain은 다음과 같다.

```text
五歲上庚子運。
十五歲上辛丑運。依次順行。
[같은 도식의 후속 row] 二十五壬寅 ...
```

따라서 시작 age `五歲`가 first `庚子`에 직접 붙고, `十五歲`가 second `辛丑`, `二十五`가 third `壬寅`에 붙는다. 이 page의 같은 계산 문맥에는 `五十七月合四年零九月`, 이어 `五歲上運欠三月`도 보인다. 그러나 `欠三月`을 현대식 음수·반올림·endpoint 보정으로 해석하지 않고, 시작 age의 source-reported residual로만 보존한다.

역행 example의 page-local chain은 다음과 같다.

```text
五歲上戊戌運。
十五歲上丁酉運。依次逆行。
[같은 도식의 후속 row] 二十五丙申 ...
```

순행·역행 두 chain은 하나의 page surface에서 확인되므로 서로 다른 physical witness로 세지 않는다. 그러나 한 page 안에서 `시작 age→first→second→third` 결합이 양방향으로 반복된다는 direct observation은 유지한다.

### 2.2 《命理探原》 p.61 / printed `三〇`, 순행

- [NLC-attributed public scan PDF](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf)
- local review derivative: `/private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf`
- observed PDF: `321 pages`, `13,772,043 bytes`
- PDF SHA-256: `8e8ebf3aa66781a3fb49a4acfc17229b6d0255af81a7cb9de0f83bafd43eb5ab`
- direct render: `/private/tmp/current-witness-review/5318/hi61.png`

원면의 계산 문장과 `列式於左` 표는 다음을 함께 보여준다.

```text
... 實歷有三十天欠三時。以三日為一歲折之。
是為十歲欠三十天。起運從生月庚寅順佈。始行辛卯。

丙午  庚寅  乙丑  壬午
初十辛卯  二十壬辰  三十癸巳  四十甲午 ...
```

이 사례에서는 `十歲欠三十天`이라는 계산문상의 시작 age가 `始行辛卯` 및 표의 `初十辛卯`에 연결되고, 다음 age locator `二十·三十`에 `壬辰·癸巳`가 놓인다. `十歲`와 `初十`의 관계는 이 page에서 관찰되는 표기 대응으로만 기록하며, 모든 문헌의 숫자 정규화 규칙으로 만들지 않는다.

### 2.3 《命理探原》 p.62 / printed `三一`, 역행

- direct render: `/private/tmp/current-witness-review/5318/hi62.png`

`起例 陰男陽女`의 worked example은 다음을 한 문맥에서 보여준다.

```text
... 實歷有五時。以三日為一歲折之。
是為一歲欠三百一十天。起運從生月壬寅逆佈。始行辛丑。

丁卯  壬寅  丙辰  戊子
初一辛丑  十一庚子  廿一己亥  卅一戊戌 ...
```

여기서는 `一歲欠三百一十天`이 first `辛丑`과 직접 이어지고, 같은 표의 `十一·廿一`에 `庚子·己亥`가 놓인다. 즉 `欠` 잔여를 포함한 시작 age, first pillar, 10 단위 후속열이 하나의 page-local worked example으로 닫힌다. `一歲`를 현대 출생 나이 endpoint로 보정하거나 `初一`을 다른 표기 체계로 변환하지 않는다.

p.61과 p.62는 같은 scan surface의 인접 page이므로 서로 독립 physical copy가 아니다. 《子平命術要訣》 p.18과 함께 사용할 때도 이것은 **두 page/surface의 bounded corroboration**이지, copy-level independence나 직접 계보의 증명이 아니다.

## 3. 결합 구조와 10년 간격 판정

### 3.1 source-local chain

| 사례 | start marker | first pillar | second marker/pillar | third marker/pillar | joined status |
|---|---|---|---|---|---|
| 子平命術要訣 順行 | `五歲` | `庚子` | `十五歲·辛丑` | `二十五·壬寅` | `direct` |
| 子平命術要訣 逆行 | `五歲` | `戊戌` | `十五歲·丁酉` | `二十五·丙申` | `direct` |
| 命理探原 p.61 | `十歲欠三十天` / `初十` | `辛卯` | `二十·壬辰` | `三十·癸巳` | `direct` |
| 命理探原 p.62 | `一歲欠三百一十天` / `初一` | `辛丑` | `十一·庚子` | `廿一·己亥` | `direct` |

네 사례 모두 age marker의 숫자 차이는 첫→둘째→셋째에서 source 표기상 `+10`이다. 干支는 순행 사례에서 next-step, 역행 사례에서 previous-step으로 이어진다. 이 두 관계가 한 사례의 동일 row/문장 안에서 함께 관찰된 것이 이번 frontier advance다.

### 3.2 `一運管十年`과의 층위 분리

기존 NLC 《精選命理約言》 p.87의 `一運管十年`은 별도의 direct rule wording으로 보존한다. 이번 네 사례는 그 문장을 전이한 것이 아니라, 각 worked example의 실제 age labels가 `五·十五·二十五`, `十·二十·三十`, `一·十一·廿一`로 배열된다는 page-local observation이다.

따라서 다음만 승격한다.

```text
same worked example:
  source-reported start age/residual
    → 上運/始行 first pillar
    → later age labels separated by ten source units + directional pillar progression
```

다음은 승격하지 않는다.

```text
residual 欠 = modern fractional-age endpoint correction
all sources' age labels = identical calendar/rounding semantics
first_dayun = mechanically derived month pillar
every later pillar = production 60-cycle generator
```

## 4. claim-level 판정

| claim | status | 안전한 표현 | 유지하는 blocker |
|---|---|---|---|
| 시작 age와 첫 大運이 한 사례에서 직접 연결 | `direct repeated` | `五歲上庚子`, `五歲上戊戌`, `始行辛卯`, `始行辛丑` | `欠`의 endpoint semantics |
| 첫·둘째·셋째 age marker가 한 사례에서 10 단위로 배열 | `direct repeated` | `五·十五·二十五`, `十·二十·三十`, `一·十一·廿一` | 현대 나이·calendar normalization |
| 후속 干支가 같은 사례에서 방향에 맞게 진행 | `direct repeated` | 순행 `庚子→辛丑→壬寅`, `辛卯→壬辰→癸巳`; 역행 `戊戌→丁酉→丙申`, `辛丑→庚子→己亥` | universal 60-cycle generator |
| 시작 residual과 coarse age locator의 대응 | `direct, source-local` | `十歲欠三十天→初十`, `一歲欠三百一十天→初一` | 절삭·반올림·endpoint 포함/제외 규칙 |
| `一運管十年`을 각 사례에 적용한 해석 | `partial` | 별도 문헌의 direct wording과 사례의 +10 labels가 함께 존재 | 문헌 간 semantic transfer, 보편 duration semantics |
| 月柱에서 first pillar 산출 | `unresolved/partial` | `從生月...始行` 문장과 output만 기록 | 자동 월주 규칙, 예외, 교정 pair의 다른 witness binding |
| textual lineage / copy independence | `unresolved` | 두 scan surface의 bounded corroboration | 공통 저본·판본 선후·정본성 |
| semantic authority / interpretation readiness | `blocked` | evidence/replay locator만 | semantic authority 전체·production activation |

## 5. frontier advance와 보존 경계

기존 frontier:

```text
first pillar direct
subsequent second/third pillars direct and directionally adjacent
```

이번 successor:

```text
start age/residual → first pillar → second/third pillar
가 동일 worked example 안에서 직접 연결되고,
age marker가 source 표기상 +10으로 반복됨
```

이는 `joined worked-example structure`의 bounded advance다. 다음 일반 알고리즘은 여전히 만들지 않는다.

```text
start_age = normalize(residual)
first_dayun = derive_from_month_pillar(month_pillar, direction)
age[n+1] = age[n] + 10 years
pillar[n+1] = sexagenary_step(pillar[n], direction)
```

원면은 위 네 줄의 현대적 함수·endpoint·rounding·timezone·API 계약을 직접 말하지 않는다. `欠`과 `初十/初一` 관계도 source-local observation으로만 둔다. `丙寅→丁卯`와 별도 `戊寅→己卯` binding correction은 [first-pillar correction](./saju-dayun-first-pillar-directional-progression-successor-v1.md#0-correction-provenance)에 기록되어 있지만, 이 문서의 joined worked examples를 소급 교정하지 않는다. raw-byte/machine binding, physical copy provenance, lineage, semantic authority, readiness는 그대로 blocked/unresolved다.

## 6. 재현·검증·Git 경계

재현 render:

```bash
pdftoppm -f 18 -l 18 -r 600 -png -singlefile \
  /private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf \
  /private/tmp/current-witness-review/early/ziping18-hi
pdftoppm -f 61 -l 61 -r 800 -png -singlefile \
  /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf \
  /private/tmp/current-witness-review/5318/hi61
pdftoppm -f 62 -l 62 -r 800 -png -singlefile \
  /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf \
  /private/tmp/current-witness-review/5318/hi62
```

검증 범위는 source PDF hash, printed/page locator, literal transcription, same-case join, +10 age-label comparison, unresolved boundary다. 앱 runtime/build test는 이 문헌 claim을 검증하지 않으므로 실행하지 않는다.

이 successor는 새 문서 하나만 atomic commit 대상이다. 기존 tracked dirty scripts, Wonkwang/Sonkeik untracked documents, 대용량 원본 PDF와 임시 render는 stage·수정·삭제하지 않는다.

최종 상태:

```text
start age → first pillar → later +10 rows  direct repeated, bounded
directional Gan-Zhi progression                direct repeated, bounded
欠/residual endpoint semantics                 unresolved
modern age/rounding/timezone/API               blocked
first-pillar universal derivation              unresolved
textual lineage / copy independence            unresolved
semantic authority / readiness                 blocked
production activation                          blocked
```
