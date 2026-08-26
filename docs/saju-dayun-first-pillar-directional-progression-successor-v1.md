# 起運 first 大運 干支의 순역 방향·후속 진행 bounded successor v1

상태: `bounded first-pillar binding corrected; directional relation advanced`, `universal generation/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 기존 [起運 algorithmization boundary](./saju-dayun-algorithmization-boundary-successor-v1.md), [term-selection boundary](./saju-dayun-term-selection-boundary-successor-v1.md), [NLC 《神峰通考》 adjudication](./saju-shenfeng-nlc-witness-adjudication-v0.md), [NLC 《精選命理約言》 direct-witness adjudication](./saju-mingli-yueyan-direct-witness-adjudication-v1.md)를 덮어쓰지 않는 additive successor다. 목표는 첫 大運 干支가 月柱와 순행·역행에서 어떻게 표기되고, 이후 진행이 어떤 문장으로 지시되는지를 직접 원면 단위로 좁히는 것이다.

## 0. correction provenance

이 문서의 이전 판정은 NLC `99036` p.50과 NLC `511` p.22의 인접한 두 순행 worked example을 한 사례로 결합해 `丙寅→己卯`로 기록했다. 2026-08-26에 동일한 page-level image surface를 다시 대조한 결과, 두 원면 모두 다음 두 pair를 분리해 보여준다.

```text
正月建丙寅 ... 順行丁卯
正月起戊寅 ... 順行己卯
```

따라서 현재 문서의 binding을 다음처럼 교정한다.

```text
이전 binding: 丙寅→己卯
교정 binding: 丙寅→丁卯  /  戊寅→己卯
```

이는 원면의 글자를 임의 교정한 것이 아니라, 기존 annotation이 섞은 두 예문을 source-local pair로 재분리한 문서 교정이다. `丁卯`와 `己卯`의 판각 오류·공통 오류·판본 계보는 판정하지 않으며, 원본 PDF·기관 record·기존 historical artifact의 byte는 변경하지 않는다.

교정 근거는 [NLC 99036 p.50](https://upload.wikimedia.org/wikipedia/commons/1/11/NLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE.pdf#page=50)의 두 인접 `論起大運法` 예문과 [NLC 511 p.22](https://upload.wikimedia.org/wikipedia/commons/d/d1/NLC511-027032013020556-10361_%E7%A5%9E%E5%B3%B0%E9%80%9A%E8%80%83_%E7%AC%AC2%E5%8D%B7.pdf#page=22)의 대응 면이다. 두 scan은 서로 다른 work surface의 corroboration일 뿐, copy-level independence나 직접 계보를 확정하지 않는다.

이제 `己卯`는 `丙寅`의 변이로 남기지 않고, 같은 page에 인쇄된 별도 `戊寅` example의 literal output으로 기록한다. `丙寅→己卯`라는 이전 문장 자체는 correction provenance로만 보존한다.

## 1. bounded 결론

이번에 실제 원면에서 반복 확인된 범위는 다음과 같다.

1. NLC `99036` 《淵海子平》 p.50–51의 `論起大運法`은 `陽男陰女順行`, `陽女陰男逆行`을 직접 적고, 순행·역행 worked example의 첫 출력 干支를 함께 적는다.
2. 순행 examples는 p.50에서 `正月建丙寅 ... 順行丁卯`와 별도의 `正月起戊寅 ... 順行己卯`로 분리되어 직접 보인다. NLC `511` 《神峰通考》 p.22도 같은 두 pair를 반복한다.
3. 역행 예는 NLC `99036` p.51에서 `正月起戊寅 ... 五歲運逆行丁丑`, `正月起丙寅 ... 三歲運逆行乙丑`로 직접 보인다. NLC `511` p.22의 해당 역행 examples는 `五歲運逆行`, `三歲運逆行`까지이며, 그 면에는 `丁丑`·`乙丑`을 붙이지 않는다.
4. NLC `109774` 《精選命理約言》 official reader p.86은 `從生月而推。遞行前月後月之建。`이라고 적고, p.87은 `一運管十年。`이라고 적는다. 이는 생월의 앞·뒤 月建을 따라가는 textual progression instruction과 한 운의 기간 표기를 직접 지지한다.

따라서 현재 닫히는 가장 좁은 명제는 다음이다.

> inspected direct pages는 named worked examples에서 순행 `丙寅→丁卯`, `戊寅→己卯`, 역행 `戊寅→丁丑`, `丙寅→乙丑`을 각각 직접 보여준다. 이 사례들의 干支는 순행일 때 월건의 다음 干支, 역행일 때 이전 干支와 일치한다. 이는 반복 확인된 bounded relation이지만, 모든 월건·판본에 적용되는 60-cycle 생성기나 production rule로 승격하지 않는다.

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
甲子年 ... 正月建丙寅。
...
起四歲運。順行丁卯。

如乙丑年 ... 正月起戊寅。
...
起四歲運。順行己卯。
```

같은 p.50의 일반 문장은 `陽男陰女順行數至未來節`로 직접 보인다. 첫 pair의 `丙寅→丁卯`와 다음 pair의 `戊寅→己卯`를 각각 승격한다. 두 예문의 중간 column을 합쳐 `丙寅→己卯`로 읽지 않는다.

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
... 丁卯是也。

如乙丑年。乙庚之歲戊為頭。正月起戊寅。
... 四歲運己卯順行是也。餘倣此。
```

따라서 `丙寅→丁卯`와 `戊寅→己卯`라는 두 source-local pair가 《淵海子平》 p.50과 **두 scan surface에서 반복**된다. 이는 textual correspondence/corroboration이지, 두 책의 독립성·공통 저본·직접 계보를 증명하지 않는다.

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

이 문구는 위 네 pair 자체를 제공하지 않는다. 대신 `生月`에서 출발해 `前月·後月之建`을 거듭 따라간다는 **text-layer progression wording**과 `一運管十年`이라는 기간 표기를 제공한다. 완전한 남녀·음양 matrix, 두 번째 이후의 실제 干支 목록, 전환 endpoint는 이 capture 범위에서 닫히지 않는다. 이 문헌의 wording은 교정된 pair에 대한 보조 문맥으로만 사용한다.

## 3. claim-level 판정

| claim | status | 현재 안전한 표현 | 승격하지 않는 것 |
|---|---|---|---|
| 순역 방향 문구 | `direct` in NLC 99036; `corroborated` by NLC 511 | `陽男陰女順行`, `陽女陰男逆行`과 해당 examples를 source wording 그대로 보존 | 모든 성별·연간 조합의 현대 enum mapping을 보편 규칙으로 확정 |
| 순행 first output | `direct`, repeated pair | `正月建丙寅→丁卯`, 별도 `正月起戊寅→己卯`가 두 scan에서 각각 인쇄됨 | `丁卯`·`己卯`의 오자·shared error·판본 계보 판정 |
| 역행 first output | `direct`, NLC 99036 only for named 干支 | `戊寅→丁丑`, `丙寅→乙丑`을 《淵海子平》 p.51의 literal example로 기록 | NLC 511 p.22에 없는 `丁丑`·`乙丑`의 전이, 모든 역행 case로 일반화 |
| 月建에서 첫 大運까지의 방향 관계 | `bounded repeated deterministic relation` | 확인된 pair에서 순행은 다음 干支, 역행은 이전 干支와 일치 | 모든 月建·성별·판본에 대한 보편 생성기 |
| 생월 기준 progression wording | `direct` in NLC 109774 | `從生月而推。遞行前月後月之建。`이라는 source-local textual rule fragment | 이 문장을 《五行精紀》·《淵海子平》의 동일 저본/계보로 전이 |
| 후속 period duration | `direct` in NLC 109774 | `一運管十年`을 해당 witness의 literal로 보존 | exact transition instant, 현대 나이 endpoint, 모든 witness의 동일 duration semantics |
| 두 번째 이후 干支열 | `unresolved` | `遞行`이라는 지시 문구만 annotation으로 저장 | `己卯→庚辰...` 또는 `丁丑→丙子...`의 목록·60-cycle algorithm |
| 이전 `丙寅→己卯` binding | `corrected` | 인접 예문을 `丙寅→丁卯`와 `戊寅→己卯`로 재분리 | 원면의 글자를 교정했다는 주장, 특정 오자·공통 오류 판정 |
| textual lineage / independence | `unresolved` | page-level correspondence와 source-local variants만 유지 | NLC 99036–NLC 511 공통조상, 직접 전승, 독립 oracle, 정본성 |
| semantic authority / readiness | `blocked` | evidence packet/replay locator 수준 | semantic authority, interpretation readiness, production activation |

## 4. 현재 frontier에서 실제로 전진한 범위

기존 frontier는 `dayun.first-pillar = example-level direct; 일반 생성 규칙 unresolved`였다. 이번 대조로 다음 additive advance를 기록한다.

```text
기존: 인접 예문을 섞은 `丙寅→己卯` binding과 일부 역행 output을 보존
  ↓
현재: 순행·역행 방향 문구
      + 순행 `丙寅 → 丁卯`, 별도 `戊寅 → 己卯` 반복 literal
      + 역행 `戊寅 → 丁丑`, `丙寅 → 乙丑` source-local outputs
      + `遞行前月後月之建` textual progression wording
      + `一運管十年` duration literal
      + 확인된 pair에서 순행=다음 干支, 역행=이전 干支라는 bounded relation
```

이는 **bounded textual progression frontier**의 전진이다. 다음 문장은 여전히 성립하지 않는다.

```text
first_dayun = universal_next_or_previous_month_pillar(month_pillar, direction)
next_dayun  = sexagenary_step(first_dayun, direction)
```

위 pseudo-rule은 이번에 확인된 named examples의 관계를 넘어서는 보편화이므로 계산식으로 사용하지 않는다. `丁卯`와 `己卯`의 source-local binding은 닫혔지만, 다른 witness의 변이·copy binding·판본 계보는 여전히 별도 blocker다.

## 5. 보존할 blockers

- NLC 99036 공개 scan의 institutional raw-page bytes와 exact machine binding.
- NLC 511 및 NLC 99036 physical copy-level collation, 원본 간기·판식·판본 선후.
- 교정된 `丙寅→丁卯`·`戊寅→己卯`가 다른 copy/판본에서도 유지되는지에 대한 직접 근거.
- 확인된 다음/이전 관계가 named examples 밖의 모든 月建에 적용되는지에 대한 직접 worked list.
- `遞行前月後月之建`이 실제 첫 output과 후속 output 전체에 동일하게 적용되는지에 대한 추가 worked list.
- 두 번째 이후 干支의 직접 나열, 각 운의 실제 전환 endpoint와 경계시각.
- 현대 60-cycle normalization, timezone·calendar basis·rounding·production API.
- semantic authority, interpretation readiness, production activation.

## 6. 검증·Git 경계

이 문서는 기존 binding을 source-local pair로 교정하는 documentation-only correction이다. 원본 PDF, temporary render, 기존 artifact, 기존 tracked/untracked 연구자료를 repository에 복사하거나 수정하지 않는다.

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
first-pillar bindings                  corrected: 丙寅→丁卯 / 戊寅→己卯
月建 directional relation             bounded repeated: forward next / reverse previous
universal 月建→first-pillar generator  unresolved
subsequent Gan-Zhi list                unresolved
textual lineage / independence        unresolved
semantic authority / readiness         blocked
production activation                  blocked
```
