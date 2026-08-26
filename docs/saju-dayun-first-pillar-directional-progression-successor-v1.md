# 起運 first 大運 干支의 순역 방향·후속 진행 bounded successor v1

상태: `bounded first-pillar/progression evidence advanced`, `universal generation/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 기존 [起運 algorithmization boundary](./saju-dayun-algorithmization-boundary-successor-v1.md), [term-selection boundary](./saju-dayun-term-selection-boundary-successor-v1.md), [NLC 《神峰通考》 adjudication](./saju-shenfeng-nlc-witness-adjudication-v0.md), [NLC 《精選命理約言》 direct-witness adjudication](./saju-mingli-yueyan-direct-witness-adjudication-v1.md)를 덮어쓰지 않는 additive successor다. 목표는 첫 大運 干支가 月柱와 순행·역행에서 어떻게 표기되고, 이후 진행이 어떤 문장으로 지시되는지를 직접 원면 단위로 좁히는 것이다.

`己卯`를 `丁卯`로 교정하지 않는다. `己卯`가 `丙寅` 다음의 현대적 월주 계산과 맞는지 여부, 오자·공통 오류·별도 계산인지도 이 문서에서 판정하지 않는다. 직접 관찰된 출력·규칙 문구·판독 불확실성을 각각 분리한다.

## 1. bounded 결론

이번에 실제 원면에서 반복 확인된 범위는 다음과 같다.

1. NLC `99036` 《淵海子平》 p.50–51의 `論起大運法`은 `陽男陰女順行`, `陽女陰男逆行`을 직접 적고, 순행·역행 worked example의 첫 출력 干支를 함께 적는다.
2. 순행 예의 `正月建丙寅` 뒤 첫 출력은 p.50에서 `順行己卯`로 직접 보인다. 같은 구조가 NLC `511` 《神峰通考》 p.22에서도 `四歲運己卯順行是也`로 보인다.
3. 역행 예는 NLC `99036` p.51에서 `正月起戊寅 ... 五歲運逆行丁丑`, `正月起丙寅 ... 三歲運逆行乙丑`로 직접 보인다. NLC `511` p.22의 해당 역행 examples는 `五歲運逆行`, `三歲運逆行`까지이며, 그 면에는 `丁丑`·`乙丑`을 붙이지 않는다.
4. NLC `109774` 《精選命理約言》 official reader p.86은 `從生月而推。遞行前月後月之建。`이라고 적고, p.87은 `一運管十年。`이라고 적는다. 이는 생월의 앞·뒤 月建을 따라가는 textual progression instruction과 한 운의 기간 표기를 직접 지지한다.

따라서 현재 닫히는 가장 좁은 명제는 다음이다.

> inspected direct pages는 순·역 방향에 따라 생월 주변의 月建을 따라 大運을 표기한다는 textual rule fragment와, 순행 `己卯`, 역행 `丁丑`·`乙丑`이라는 source-local first-output examples를 반복적으로 보여준다. 그러나 순행 `丙寅→己卯`의 干 stem을 자동 보정할 근거가 없고, 두 번째 이후의 干支열을 직접 나열한 원면도 확보하지 못했으므로, 일반적인 60-cycle 생성기나 production rule로 승격할 수 없다.

## 2. 직접 원면 evidence

### 2.1 NLC 99036 《淵海子平》 p.50–51

공식 record는 NLC `data_416 / 15jh007754 / reader object 99036.0`으로 기존 source dossier에 기록되어 있다. reader raw-page permission은 별도 blocker로 남기고, 이번 판독은 NLC record와 연결된 공개 image-PDF의 page-level visual surface에 한정한다.

- [NLC record route](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=15jh007754)
- [public scan PDF](https://upload.wikimedia.org/wikipedia/commons/1/11/NLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE.pdf)
- local review derivative: `/private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf`
- PDF SHA-256: `fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f`
- direct render: `/private/tmp/current-witness-review/early/yuanhai-050.png`, `/private/tmp/current-witness-review/early/yuanhai-051.png`

p.50(printed 三二)의 `論起大運法` worked example에서 다음 관계가 직접 보인다.

```text
甲己之年丙作首。正月建丙寅。
初一日立春後一日生男。
順數至二月驚蟄節止。得四十二日。
起四歲運。順行己卯。
```

같은 p.50의 일반 문장은 `陽男陰女順行數至未來節`로 직접 보인다. 이 example에서 `丙寅`과 `己卯`가 함께 보인다는 사실만 승격한다. `己卯`를 `丁卯`로 바꾸거나, `己`를 판각 오류로 고치는 편집은 하지 않는다.

p.51(printed 三三)의 두 역행 worked example은 다음과 같다.

```text
乙丑年 ... 正月起戊寅。
初一日立春後十五日生男。
逆數至初一日立春止。
得五三十五。五歲運逆行丁丑。

甲子年 ... 正月起丙寅。
初一日立春後十日生女。
逆數至初一日立春止。
得九日。三三單九日。
起三歲運。逆行乙丑。
```

이 둘은 `戊寅→丁丑`, `丙寅→乙丑`이라는 **역행 example 출력**을 직접 보존한다. `五三十五`·`三三單九`는 기존 문서의 literal boundary를 따르며, 이 문서에서 산술 정규화하지 않는다.

### 2.2 NLC 511 《神峰通考》 p.22

NLC `data_511 / fid=027032013020556 / bid=10361.0`의 공식 PDF p.22(printed 二〇)를 직접 대조했다.

- [NLC record route](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_511&fid=027032013020556)
- [official PDF delivery](http://read.nlc.cn/doc2/data13/zjmgwx_zhengjiminguowenxian/20140527_01zjmgwx/duixiang/027032013020556/002/027032013020556_002.pdf)
- [public scan route](https://upload.wikimedia.org/wikipedia/commons/d/d1/NLC511-027032013020556-10361_%E7%A5%9E%E5%B3%B0%E9%80%9A%E8%80%83_%E7%AC%AC2%E5%8D%B7.pdf)
- local review derivative: `/private/tmp/saju-term-review/NLC511-shenfeng-vol2.pdf`
- PDF SHA-256: `ccb21cf1215a1e487fe79497839f9343534af42a2e3af6c1e7dd04f3faea9289`
- direct render: `/private/tmp/current-witness-review/early/shenfeng-022.png`

이 면은 순행 example에서 다음을 직접 보인다.

```text
如甲子年。甲己之年丙作首。正月建丙寅。
... 順數至二月節驚蟄。得二十二日。
四歲運己卯順行是也。餘倣此。
```

따라서 `丙寅` 뒤 `己卯`라는 출력은 《淵海子平》 p.50과 **두 scan surface에서 반복되는 literal**이다. 이는 textual correspondence/corroboration이지, 두 책의 독립성·공통 저본·직접 계보를 증명하지 않는다.

같은 p.22의 역행 examples는 다음 경계로 기록한다.

```text
乙丑 ... 正月起戊寅 ... 五歲運逆行。
甲子 ... 正月起丙寅 ... 三歲運逆行。餘倣此。
```

NLC `511` p.22의 해당 column에는 `丁丑`·`乙丑`이 직접 인쇄되어 있지 않다. 그러므로 `丁丑`·`乙丑`은 NLC `99036` p.51의 witness-specific output으로만 유지한다. 이 page-level 차이는 [NLC 《神峰通考》 adjudication](./saju-shenfeng-nlc-witness-adjudication-v0.md)의 판정을 따른다.

### 2.3 NLC 109774 《精選命理約言》 p.86–87

이 자료는 NLC official reader에서 보인 page capture이며, raw page bytes가 repository에 들어온 것은 아니다.

- [NLC official record](http://read.nlc.cn/allSearch/searchDetail?searchType=24&showType=1&indexName=data_416&fid=17jh002578)
- record identity: `data_416 / 17jh002578 / 109774.0`, 《精選命理約言》, 民國二十四年[1935]
- official reader p.86/185, printed folio 三 capture SHA-256: `8a4829fcf965688349cd405b719eb5a17efff2ce0892c3597090f9f8ccd5ef7d`
- official reader p.87/185, printed folio 四 capture SHA-256: `c2b033458986e84c3802618dbb2fe43244551923391a035477dec575fe147b1b`

p.86의 `行運賦`에는 다음이 직접 보인다.

```text
從生月而推。遞行前月後月之建。
以男女為別。乃分順行逆行之端。
```

p.87에는 다음이 직접 보인다.

```text
一運管十年。
```

이 문구는 첫 출력 `己卯`·`丁丑`·`乙丑` 자체를 제공하지 않는다. 대신 `生月`에서 출발해 `前月·後月之建`을 거듭 따라간다는 **text-layer progression wording**과 `一運管十年`이라는 기간 표기를 제공한다. 완전한 남녀·음양 matrix, 두 번째 이후의 실제 干支 목록, 전환 endpoint는 이 capture 범위에서 닫히지 않는다. 기존 adjudication처럼 literal 관찰만 승격한다.

## 3. claim-level 판정

| claim | status | 현재 안전한 표현 | 승격하지 않는 것 |
|---|---|---|---|
| 순역 방향 문구 | `direct` in NLC 99036; `corroborated` by NLC 511 | `陽男陰女順行`, `陽女陰男逆行`과 해당 examples를 source wording 그대로 보존 | 모든 성별·연간 조합의 현대 enum mapping을 보편 규칙으로 확정 |
| 순행 first output | `direct`, repeated literal | `正月建丙寅` 다음 example output이 두 scan에서 `己卯`로 인쇄됨 | `己卯→丁卯` 교정, `丙寅→丁卯` 자동 생성, `己`의 오자·shared error 판정 |
| 역행 first output | `direct`, NLC 99036 only for named 干支 | `戊寅→丁丑`, `丙寅→乙丑`을 《淵海子平》 p.51의 literal example로 기록 | NLC 511 p.22에 없는 `丁丑`·`乙丑`의 전이, 모든 역행 case로 일반화 |
| 생월 기준 progression wording | `direct` in NLC 109774 | `從生月而推。遞行前月後月之建。`이라는 source-local textual rule fragment | 이 문장을 《五行精紀》·《淵海子平》의 동일 저본/계보로 전이 |
| 후속 period duration | `direct` in NLC 109774 | `一運管十年`을 해당 witness의 literal로 보존 | exact transition instant, 현대 나이 endpoint, 모든 witness의 동일 duration semantics |
| 두 번째 이후 干支열 | `unresolved` | `遞行`이라는 지시 문구만 annotation으로 저장 | `己卯→庚辰...` 또는 `丁丑→丙子...`의 목록·60-cycle algorithm |
| `己卯`와 月柱 인접성 | `conflicted/unresolved` | branch `寅→卯`와 printed stem `己`를 분리 필드로 보존 | stem을 현대 월주 규칙으로 보정하거나, 판본 선후·공통 오류를 추정 |
| textual lineage / independence | `unresolved` | page-level correspondence와 source-local variants만 유지 | NLC 99036–NLC 511 공통조상, 직접 전승, 독립 oracle, 정본성 |
| semantic authority / readiness | `blocked` | evidence packet/replay locator 수준 | semantic authority, interpretation readiness, production activation |

## 4. 현재 frontier에서 실제로 전진한 범위

기존 frontier는 `dayun.first-pillar = example-level direct; 일반 생성 규칙 unresolved`였다. 이번 대조로 다음 additive advance를 기록한다.

```text
기존: 단일/소수 example의 丁丑·乙丑·起於丁丑 출력만 직접 보존
  ↓
현재: 순행·역행 방향 문구
      + 순행 `丙寅 → 己卯` 반복 literal
      + 역행 `戊寅 → 丁丑`, `丙寅 → 乙丑` source-local outputs
      + `遞行前月後月之建` textual progression wording
      + `一運管十年` duration literal
```

이는 **bounded textual progression frontier**의 전진이다. 다음 문장은 여전히 성립하지 않는다.

```text
first_dayun = next_or_previous_month_pillar(month_pillar, direction)
next_dayun  = sexagenary_step(first_dayun, direction)
```

특히 위 pseudo-rule은 두 scan에서 직접 보인 `己卯`를 `丁卯`로 바꾸므로 현재 evidence와 충돌한다. `己卯`를 설명하는 별도 direct witness·교감·간기·주석이 확보되기 전까지는 계산식으로 사용하지 않는다.

## 5. 보존할 blockers

- NLC 99036 공개 scan의 institutional raw-page bytes와 exact machine binding.
- NLC 511 및 NLC 99036 physical copy-level collation, 원본 간기·판식·판본 선후.
- `己卯`가 오자·shared error·별도 stem 규칙 중 무엇인지에 대한 직접 근거.
- `遞行前月後月之建`이 실제 첫 output과 후속 output 전체에 동일하게 적용되는지에 대한 추가 worked list.
- 두 번째 이후 干支의 직접 나열, 각 운의 실제 전환 endpoint와 경계시각.
- 현대 60-cycle normalization, timezone·calendar basis·rounding·production API.
- semantic authority, interpretation readiness, production activation.

## 6. 검증·Git 경계

이 successor는 documentation-only additive overlay다. 원본 PDF, temporary render, 기존 artifact, 기존 tracked/untracked 연구자료를 repository에 복사하거나 수정하지 않는다.

재현 명령은 다음이다.

```bash
pdftoppm -f 50 -l 51 -r 600 \
  /private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf \
  /private/tmp/current-witness-review/early/yuanhai
pdftoppm -f 22 -l 22 -r 600 \
  /private/tmp/saju-term-review/NLC511-shenfeng-vol2.pdf \
  /private/tmp/current-witness-review/early/shenfeng22-hi
shasum -a 256 /private/tmp/saju-term-review/NLC416-99036-yuanhai.pdf
shasum -a 256 /private/tmp/saju-term-review/NLC511-shenfeng-vol2.pdf
```

검증 범위는 문서 내부 링크·직접 원면 transcription·source hash·staged path이다. 앱 runtime test/build는 이 historical claim을 검증하지 않으므로 실행 대상이 아니다. atomic commit은 이 파일 하나만 포함해야 하며, 기존 dirty scripts와 untracked Wonkwang/Sonkeik 자료는 stage·수정·삭제 대상이 아니다.

최종 상태:

```text
first-pillar examples                  direct, source-local
directional progression wording        direct, bounded
己卯 ↔ 丙寅 generic calculation        unresolved/conflicted
subsequent Gan-Zhi list                unresolved
textual lineage / independence        unresolved
semantic authority / readiness         blocked
production activation                  blocked
```
