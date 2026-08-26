# 起運 후속 大運 干支열의 순역 연속성 bounded successor v1

상태: `bounded subsequent-pillar progression advanced`, `universal generation/lineage/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 [first-pillar directional progression successor](./saju-dayun-first-pillar-directional-progression-successor-v1.md)의 additive successor다. 목표는 첫 大運 뒤의 **두 번째·세 번째 이후 干支가 실제 worked example에 연속해서 인쇄되어 있는지**를 page-level visual surface에서 대조하는 것이다. `遞行`·`順行`·`逆行`이라는 규칙 문장, 표에 적힌 literal, 그리고 그 literal 사이의 결정론적 관계를 서로 다른 층으로 기록한다.

catalog metadata, 공개 scan, OCR/search index, 제목·시대·기관 유사성은 physical copy provenance나 textual lineage로 승격하지 않는다. 아래의 `direct`는 해당 PDF page image에서 읽은 source-local 면 관찰을 뜻하며, institutional raw bytes·exact machine binding이 확보되었다는 뜻이 아니다.

## 1. bounded 결론

이번에 직접 대조한 네 worked-example 열은 모두 첫 大運 뒤의 2번째·3번째 열까지 같은 방향으로 이어진다.

| source surface | direction | first → second → third (page literal) | bounded adjacency check |
|---|---|---|---|
| 《子平命術要訣》 p.18, printed `十四`, forward example | 順行 | `庚子 → 辛丑 → 壬寅` | 60-cycle상 각각 다음 干支 |
| 《子平命術要訣》 p.18, printed `十四`, reverse example | 逆行 | `戊戌 → 丁酉 → 丙申` | 60-cycle상 각각 이전 干支 |
| 《命理探原》 p.61, printed `三〇`, forward table | 順行 | `初十辛卯 → 二十壬辰 → 三十癸巳` | 60-cycle상 각각 다음 干支 |
| 《命理探原》 p.62, printed `三一`, reverse table | 逆行 | `初一辛丑 → 十一庚子 → 廿一己亥` | 60-cycle상 각각 이전 干支 |

따라서 현재 승격 가능한 명제는 다음으로 한정한다.

> inspected page-level worked examples에서는 첫 大運 이후 적어도 2번째·3번째 干支가 실제로 나열되고, 순행 열은 인접한 다음 干支, 역행 열은 인접한 이전 干支로 읽힌다. 이 반복은 **bounded textual/calc-relation corroboration**이다. 모든 고전 문헌·모든 판본에 적용되는 생성 규칙, 특정 공통 저본, 독립 계보, 정본성, semantic authority, interpretation/production readiness는 이 결과로 닫히지 않는다.

여기서 `60-cycle상`은 원면이 현대적 알고리즘을 명시했다는 뜻이 아니라, 원면에서 읽은 干·支 쌍을 고정된 육십갑자 열에 대입해 인접 여부만 확인한 deterministic relation이다. 현대의 시간·달력·timezone·rounding·API 규격으로 확장하지 않는다.

## 2. 직접 원면 evidence

### 2.1 NLC-attributed 《子平命術要訣》 p.18 / printed `十四`

- [Wikimedia Commons file record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3_%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf)
- [public scan PDF](https://upload.wikimedia.org/wikipedia/commons/c/c7/NLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3_%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf)
- local review derivative: `/private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf`
- local PDF observed: `65 pages`, `2,575,411 bytes`
- PDF SHA-256: `885bf4db4a6a80a0a7d308ef200ad97da424676b9003f16f72633874f27f795b`
- direct render: `/private/tmp/current-witness-review/early/ziping18-hi-18.png`

같은 page의 두 worked example과 도식에서 다음을 직접 읽었다.

```text
順行: 五歲上庚子運。十五歲上辛丑運。依次順行。如式一所示是也。
       [도식의 후속 열] 二十五壬寅 ...

逆行: 五歲上戊戌運。十五歲上丁酉運。依次逆行。如式一所示是也。
       [도식의 후속 열] 二十五丙申 ...
```

도식의 같은 방향 열에서 순행 쪽에는 `庚子·辛丑·壬寅·癸卯`가, 역행 쪽에는 `戊戌·丁酉·丙申·乙未`가 이어지는 배열이 보인다. 이번 판정에 필요한 2번째·3번째는 각각 `辛丑·壬寅`, `丁酉·丙申`까지만 사용한다. `癸卯·乙未`와 그 뒤 열은 추가 관찰로 보존하되, 여기서 별도 규칙을 만들지 않는다.

이 page는 첫 번째 worked-example set 안에서 순·역행을 함께 보여주므로, 두 표를 서로 다른 physical witness로 세지 않는다. 하나의 page surface 내부에서 방향 양쪽의 후속 열이 반복되었다는 사실만 direct로 승격한다.

### 2.2 NLC-attributed 《命理探原》 p.61 / printed `三〇`

- [public scan PDF](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf)
- local review derivative: `/private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf`
- local PDF observed: `321 pages`, `13,772,043 bytes`
- PDF SHA-256: `8e8ebf3aa66781a3fb49a4acfc17229b6d0255af81a7cb9de0f83bafd43eb5ab`
- direct render: `/private/tmp/current-witness-review/5318/hi61.png`

`命理探原 卷上 起例 陽男陰女`의 p.61(printed `三〇`)에는 다음 worked example과 `列式於左` 표가 직접 보인다.

```text
起運從生月庚寅順佈。始行辛卯。列式於左。
丙午  庚寅  乙丑  壬午
初十辛卯  二十壬辰  三十癸巳  四十甲午
五十乙未  六十丙申  七十丁酉  八十戊戌
```

따라서 이 page에서는 `辛卯 → 壬辰 → 癸巳`가 first→second→third로 직접 확인된다. `初十·二十·三十`은 source가 인쇄한 age locator이며, 이 문서에서는 현대식 나이 endpoint로 재해석하지 않는다.

### 2.3 NLC-attributed 《命理探原》 p.62 / printed `三一`

- direct render: `/private/tmp/current-witness-review/5318/hi62.png`

p.62(printed `三一`)의 `起例 陰男陽女` worked example은 다음을 직접 말하고, 왼쪽 `列式於左` 표에 후속 열을 둔다.

```text
起運從生月壬寅逆佈。始行辛丑。列式於左。
丁卯  壬寅  丙辰  戊子
初一辛丑  十一庚子  廿一己亥  卅一戊戌
四一丁酉  五一丙申  六一乙未  七一甲午
```

이번 bounded 판정에는 `初一辛丑 → 十一庚子 → 廿一己亥`만 사용한다. 이는 첫 `辛丑` 뒤에 두 번째 `庚子`, 세 번째 `己亥`가 실제로 연속 표기된 direct page-level example이다. `初一·十一·廿一·卅一·四一`은 원면의 숫자 표기를 그대로 보존하며, `一歲`의 현대적 경계나 rounding으로 바꾸지 않는다.

p.61과 p.62는 같은 《命理探原》 scan surface 안의 인접 page이므로, 서로 다른 physical copy로 세지 않는다. 대신 2.1의 별도 제목·scan surface와 함께 **두 텍스트 surface에서 순·역 방향의 후속열이 반복되었다**는 bounded corroboration으로만 사용한다.

## 3. adjacency 판정

### 3.1 원면 literal을 바꾸지 않은 비교

| example | first | second | third | direction | result |
|---|---|---|---|---|---|
| 子平命術要訣 forward | `庚子` | `辛丑` | `壬寅` | 順行 | direct repeated next-step relation |
| 子平命術要訣 reverse | `戊戌` | `丁酉` | `丙申` | 逆行 | direct repeated previous-step relation |
| 命理探原 p.61 | `辛卯` | `壬辰` | `癸巳` | 順行 | direct repeated next-step relation |
| 命理探原 p.62 | `辛丑` | `庚子` | `己亥` | 逆行 | direct repeated previous-step relation |

각 열은 干과 支가 함께 한 칸씩 움직이며, 같은 parity의 干支쌍으로 이어진다. 따라서 이 네 열의 **문자열 adjacency**는 재현 가능하다. 다만 이 표는 각 source가 왜 그렇게 배열했는지, 다른 문헌이 같은 규칙을 채택했는지, `月柱`에서 첫 열을 산출하는 세부 규칙이 무엇인지를 직접 증명하지 않는다.

### 3.2 기존 `己卯` literal과의 분리

기존 successor의 NLC 《淵海子平》·《神峰通考》 `丙寅 → 己卯` binding은 [first-pillar correction](./saju-dayun-first-pillar-directional-progression-successor-v1.md#0-correction-provenance)에서 교정되었다. 해당 원면의 현재 pair는 `丙寅→丁卯`와 별도 `戊寅→己卯`이며, 이번 네 후속열과 섞지 않는다. 이번의 `庚子→辛丑→壬寅`·`辛卯→壬辰→癸巳`를 근거로 다른 source literal을 소급 보정하지 않는다.

```text
printed `己卯` = source-local direct literal for the separate `戊寅` example
subsequent four examples = bounded adjacent progression corroboration
```

이 분리는 판독·판본·공통 오류·별도 계산을 구분하기 위한 것이며, 어느 하나를 정답으로 선언하는 것이 아니다.

## 4. claim-level 판정

| claim | status | 안전한 기록 | 승격하지 않는 것 |
|---|---|---|---|
| 한 worked example에서 첫 운 뒤 2번째 운까지 직접 표기 | `direct repeated` | 네 example 모두 first→second가 page-local로 보임 | 모든 문헌·모든 판본의 보편 규칙 |
| 한 worked example에서 3번째 운까지 직접 표기 | `direct repeated` | 네 example 모두 first→second→third가 page-local로 보임 | 4번째 이후 전체 corpus에 대한 자동 생성 |
| 순행 열의 adjacent next-step | `bounded deterministic relation` | `庚子→辛丑→壬寅`, `辛卯→壬辰→癸巳` | 원문이 현대 60-cycle algorithm을 명시했다는 주장 |
| 역행 열의 adjacent previous-step | `bounded deterministic relation` | `戊戌→丁酉→丙申`, `辛丑→庚子→己亥` | 모든 역행 문헌·성별 조합으로 일반화 |
| 2개 제목/scan surface에 걸친 textual corroboration | `direct corroboration` | 《子平命術要訣》와 《命理探原》에서 같은 방향성이 반복 | physical-copy independence, common ancestor, direct lineage |
| `月柱 → first 大運` 산출 규칙 | `partial/unresolved` | 각 면의 `從生月...始行` 문장과 worked output | `first = next_or_previous(month_pillar)`를 전면 규격화 |
| 60-cycle generator / production algorithm | `unresolved` | inspected literal의 adjacency만 계산 가능 | 현대 계산 엔진, API, endpoint, rounding, readiness |
| edition/textual lineage | `unresolved` | page-level correspondence만 보존 | 특정 공통 저본·판본 선후·정본성 |
| semantic authority / interpretation readiness | `blocked` | source evidence packet 수준 | semantic authority 전체, interpretation/production activation |

## 5. frontier advance

기존 frontier는 첫 大運 output과 `遞行前月後月之建` 같은 progression wording까지였고, 두 번째 이후의 실제 干支열은 unresolved였다. 이번 대조로 다음 한 단계만 전진한다.

```text
기존: first pillar direct; subsequent Gan-Zhi list unresolved
  ↓
현재: independent page surfaces의 worked examples에서
      first → second → third literal 열을 direct 반복 확인
      + 순행은 next-step, 역행은 previous-step이라는 bounded relation 확인
```

이 advance는 `subsequent-pillar textual progression`에 한정된다. 다음 pseudo-rule은 여전히 승격하지 않는다.

```text
first_dayun = next_or_previous_month_pillar(month_pillar, direction)
next_dayun  = sexagenary_step(first_dayun, direction)
```

특히 교정된 first-pillar pair의 다른 witness binding, source 간 판식·연대·copy binding, `月柱` 산출 단계가 닫히지 않았으므로 위 pseudo-rule은 production 계산식이 아니다.

## 6. 남은 blocker와 보존 경계

- 두 public PDF가 NLC 식별자를 보존한 scan surface라는 점과 institutional raw-page bytes 사이의 간극.
- exact machine binding, 원본 파일의 기관 delivery identity, physical copy-level collation.
- 《子平命術要訣》와 《命理探原》의 textual independence, 공통조상, 직접 전승, 판본 선후.
- 교정된 `丙寅→丁卯`·`戊寅→己卯`가 다른 copy/판본에서도 유지되는지와 그 textual lineage.
- `月柱`에서 first pillar를 만드는 source-local 세부 문장과 예외.
- 모든 운수에 대한 60-cycle generator, 날짜·시각 endpoint, 1운의 연령 표기, 현대식 계산 규격.
- semantic authority, interpretation readiness, production activation.

대용량 원본 PDF와 임시 render는 `/private/tmp`에만 남기며 repository에 복사하지 않는다. 기존 Wonkwang/Sonkeik 문서, unrelated dirty scripts, 기타 untracked 연구자료는 이 successor의 대상이 아니다.

## 7. 재현·검증·Git 경계

직접 page render:

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

이번 문서의 검증은 source hash, page locator, literal transcription, adjacency check, unresolved boundary를 대상으로 한다. 앱 runtime/build test는 historical page claim을 검증하지 않으므로 실행 대상으로 삼지 않는다.

atomic commit에는 이 문서 하나만 포함해야 한다. 기존 tracked dirty scripts와 다음 untracked 자료는 stage·수정·삭제하지 않는다.

```text
docs/saju-sonkeikaku-institution-access-audit-v1.md
docs/saju-wonkwang-copy-page-provenance-audit-v2.md
docs/saju-wonkwang-copy-page-provenance-audit-v3.md
docs/saju-wonkwang-institution-access-audit-v1.md
scripts/materialize-design-reference-accessibility-legacy-interaction-cleanup-batch-v1.mjs
scripts/materialize-design-reference-form-modal-async-state-touch-foundation-batch-v1.mjs
scripts/materialize-scheduler-interaction-visual-detail-audit-v1.mjs
```

최종 bounded state:

```text
first-pillar direction                  direct, source-local
second/third subsequent Gan-Zhi rows    direct repeated, bounded
forward/backward adjacency              deterministic relation, bounded
universal 60-cycle generator            unresolved
月建→first-pillar universal derivation  unresolved
textual lineage / independence          unresolved
semantic authority / readiness          blocked
production activation                   blocked
```
