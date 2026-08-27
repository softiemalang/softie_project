# 日干支 산출→四柱 日柱 bounded end-to-end successor v1

상태: `frontier advanced: 萬年曆 anchor→birth-day ganzhi→日柱 direct`
`calendar-engine/日躔 derivation·copy binding·lineage·semantic authority·readiness blocked`

기준일: `2026-08-27 KST`

이 문서는 기존 [독립 worked example end-to-end successor](./saju-independent-worked-example-end-to-end-successor-v1.md)와 [Saju calendar oracle frontier](./saju-p0-calendar-oracle-v1.md)를 덮어쓰지 않는 additive successor다. 기존 example은 `己卯日`이 四柱에 인쇄되어 있었지만 그 날짜에서 일진을 산출하는 단계가 직접 닫히지 않았다. 이번 문서는 공개 page image에서 **만세력의 기준 일진을 출발점으로 출생일의 日干支를 순차 산출하고, 그 값을 日柱로 편입한 뒤, 같은 source-local example에서 時柱까지 사용하는 과정**을 별도로 기록한다.

`end-to-end`는 여기서 문헌이 제시한 worked 命例의 입력 날짜를 뜻한다. 독립적인 역사 인물의 출생기록이나 실제 민간 만세력 원본을 뜻하지 않는다. 또한 이 문서는 `日躔` 또는 고대 역법의 천문 계산이 해당 萬年曆 값을 생성했다는 것을 같은 example 안에서 입증하지 않는다.

## 1. 결론: 현재 직접 닫히는 최대 범위

NLC 기탁으로 표시된 공개 scan 《命理探原》의 `推日法` p.56과 `推時法` p.57에서 다음 source-local chain이 직접 관찰된다.

```text
丙午年正月初九日午時生
  → 萬年曆: 正月初一日丁巳
  → 初二戊午, 初三己未, 初四庚申, 初五辛酉,
    初六壬戌, 初七癸亥, 初八甲子, 初九乙丑
  → source table: 丙午／庚寅／乙丑
  → 乙日子時丙子; 子·丑·寅·卯·辰·巳·午 순행
  → 午時壬午
  → bounded full tuple: 丙午／庚寅／乙丑／壬午
```

p.56의 `乙丑`은 단순히 이미 주어진 日柱가 아니다. source가 `萬年曆`의 `正月初一日丁巳`를 기준으로 날짜를 순서대로 세어 `初九乙丑`이라고 산출한 결과다. 이어 p.57은 `乙丑日午時`를 입력으로 삼아 `乙日子時丙子`에서 午時까지 세어 `壬午`를 얻는다. 따라서 다음 명제는 direct로 승격한다.

> 이 source surface의 한 worked example에서 출생일 입력 → 만세력 기준 일진 → 출생일 日干支 → 그 값을 四柱의 日柱로 표기 → 日干을 이용한 時柱 산출이 연속적으로 관찰된다.

직접 page surface: [NLC-attributed 《命理探原》 PDF p.56](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=56), [p.57](https://upload.wikimedia.org/wikipedia/commons/5/52/NLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf#page=57), [공개 scan의 source metadata](https://commons.wikimedia.org/wiki/File%3ANLC416-07jh011647-5318_%E5%91%BD%E7%90%86%E6%8E%A2%E6%BA%90.pdf).

## 2. 직접 원면 관찰

### 2.1 `推日法`: 날짜에서 日干支까지

p.56의 규칙 문맥은 만세력에 적힌 기준일들을 보고 해당 월의 날짜별 干支를 순차적으로 정하는 방식이다. 같은 면의 첫 worked example은 다음 정보를 함께 준다.

```text
birth input: 丙午年正月初九日午時生
calendar anchor: 萬年曆載明正月初一日丁巳
operation: 以次順數至初九日
result: 即知為乙丑矣
table: 丙午／庚寅／乙丑
```

직접 재현되는 육십갑자 순서는 다음과 같다.

```text
初一 丁巳
初二 戊午
初三 己未
初四 庚申
初五 辛酉
初六 壬戌
初七 癸亥
初八 甲子
初九 乙丑
```

이 산술은 현대 날짜 API나 독립적인 천문 계산을 사용한 것이 아니라 source가 명시한 기준 일진과 `以次順數`라는 순차 절차를 재현한 것이다.

p.56에는 같은 방식의 추가 surface도 있다.

| source 입력 | 만세력/歷書 anchor | source 결과 | 판정 |
|---|---|---|---|
| `丁卯年正月初一日子時生` | `正月初一丙辰` | `丙辰` | 날짜→日干支 direct |
| `丙午年正月初九日午時生` | `正月初一日丁巳` | `乙丑` | 날짜→日干支 direct |
| `丙午年十二月十九日戌時生` | `十二月十一日壬戌` | `庚午` | 날짜→日干支 direct |

여기서 세 사례는 source-local 절차의 반복을 지지하지만, 서로 다른 만세력·판본·역법 계통의 독립 반복으로 세지 않는다.

### 2.2 `乙丑`을 四柱 日柱로 사용

같은 p.56의 `列式`은 첫 example의 결과를 `丙午／庚寅／乙丑`로 배치한다. 앞의 두 field는 年柱·月柱이고, `乙丑`은 `推日法`에서 산출된 날짜 干支가 四柱의 日 field에 들어간 것이다.

이 문서가 직접 주장하는 것은 다음까지다.

- source가 출생 날짜를 만세력 anchor와 순차 계산으로 `乙丑`으로 산출한다.
- 같은 source table이 그 `乙丑`을 日柱 위치에 둔다.
- 이 예문은 `日柱`라는 현대 편집 라벨을 반드시 사용해야만 성립하는 것이 아니라, 四柱 세 field의 배열과 `推日法` 문맥으로 그 역할이 source-local하게 확인된다.

### 2.3 `推時法`: 산출된 日干을 時柱에 소비

p.57은 `推時之法由人生日遁得生時之幹枝為主`라고 하고, `乙庚日起丙時` 계열의 子時 시작간을 제시한다. 이어 같은 example을 다음처럼 다시 입력한다.

```text
丙午年庚寅月乙丑日午時生
乙日子時遁得丙子
以次順數至午
遁得壬午
```

따라서 `乙丑`은 단지 표에 남은 날짜 label이 아니라, 같은 source가 時干을 계산할 때 사용하는 입력값이기도 하다. 이로써 해당 source surface의 bounded full tuple을 `丙午／庚寅／乙丑／壬午`로 기록할 수 있다.

이 결합은 `乙丑日`과 `午時`가 같은 worked tuple로 반복 표기되는 것을 근거로 한다. 별도의 example에서 얻은 日柱와 時柱를 조합하지 않는다.

## 3. Claim-level adjudication

| claim | 상태 | 안전한 표현 | 승격하지 않는 표현 |
|---|---|---|---|
| 출생 날짜 입력→만세력 기준일 | `direct, source-local` | `丙午年正月初九日午時`와 `正月初一日丁巳`의 함께 인쇄된 관계 | 실제 인물의 독립 출생기록 |
| 기준 일진→출생일 日干支 | `direct` | `丁巳`에서 `以次順數`하여 `乙丑` | 모든 달·모든 역서의 보편 계산기 |
| 산출 결과→日柱 | `direct, case-local` | table의 `丙午／庚寅／乙丑` | 현대 `日柱` field schema의 역사적 보편성 |
| 日干→子時 시작간 | `direct, source-local` | `乙日子時丙子` | 五鼠遁의 모든 계열이 모든 문헌에서 동일하다는 독립 결론 |
| 子時 시작간→午時 時柱 | `direct, same-case` | `乙丑日午時`→`壬午` | 현대 2시간 단위·timezone 규격 |
| 날짜→日柱→時柱 full chain | `direct, bounded` | 이 source의 한 worked example에서 연속 관찰 | 모든 문헌의 canonical four-pillar generator |
| 만세력 자체의 역법 계산 | `unresolved in this example` | 만세력 anchor가 주어진 값임을 기록 | 이 source가 `日躔`으로 anchor를 생성했다고 추정 |
| 日躔→日干支→日柱 | `unresolved` | 별도 역법 layer 후보로만 보존 | 태양 위치 계산을 일진 산출의 직접 증거로 전이 |
| 역법 engine→명례 출력의 historical bridge | `partial` | 별도 역법 문헌과 명리 worked example을 층별로 연결 | 동일 문헌·동일 계산에서 bridge가 닫혔다고 주장 |
| copy-level/raw-byte provenance | `unresolved` | 공개 page image observation | NLC canonical raw bytes·기관 item binding |
| edition/textual lineage | `unresolved` | page-level textual surface | 특정 판본 선후·공통 저본·정본성 |
| semantic authority/readiness/activation | `blocked` | evidence/replay observation만 | 해석 권위·production calendar oracle |

## 4. 역법·日躔 자료와의 층위 분리

명리 example보다 앞선 역법 자료에는 일진과 천문 위치를 계산하는 별도의 직접 evidence가 있다.

- 《後漢書》는 `日`이 역서에서 일수로 표현되고 60갑자로 순환한다는 설명을 하며, `積日以六十除去之` 뒤 나머지를 역법의 干支 명명에 사용하는 절차를 보인다. 또 `推日所在度`로 태양의 위치를 계산한다. [《後漢書》卷93](https://zh.wikisource.org/zh/%E5%BE%8C%E6%BC%A2%E6%9B%B8/%E5%8D%B793)
- 《晉書》는 `夜半甲子朔旦冬至`라는 원점, 누적 월·일, `以六十去積日`, 그리고 `推二十四氣`를 함께 기술한다. [《晉書》卷18](https://zh.wikisource.org/wiki/%E6%99%89%E6%9B%B8/%E5%8D%B7018)

이 자료들은 **역법 engine layer가 역사적으로 존재했다**는 직접 근거다. 그러나 다음 등식은 현재 닫히지 않았다.

```text
역법의 epoch/日躔 계산
  → 특정 萬年曆의 기준 일진
  → 명리 worked example의 출생일 日柱
```

《命理探原》의 example은 첫 화살표를 재계산하지 않고 `萬年曆載明`이라는 anchor를 입력으로 받는다. 따라서 이번 direct promotion은 `萬年曆 lookup + source-local sequential count`에 한정된다.

`日躔` 또는 `推日所在度`는 태양의 위치·宿度를 계산하는 문맥이다. 그것이 곧바로 특정 날짜의 60갑자 일진을 만들었다고 해석하지 않는다. 두 layer가 실제로 연결된 primary witness가 확보되기 전까지는 historical bridge를 partial/unresolved로 유지한다.

## 5. 기존 frontier와의 관계

기존 [《子平命術要訣》 worked example](./saju-independent-worked-example-end-to-end-successor-v1.md)은 `丙申年十月十八日申時生`과 `己卯日`을 같은 四柱 block에 직접 적었지만, 그 `己卯`를 출생일에서 산출하는 만세력 계산은 page-level로 닫지 않았다.

이번 문서는 그보다 좁고 명확한 별도 advance다.

```text
기존: 출생 tuple + source-provided 日柱 + 起運/大運 chain
이번: 萬年曆 anchor + sequential day count + 日柱 placement
공통: source-local worked evidence
```

두 문헌을 합쳐 하나의 보편 산출기로 만들지 않는다. 또한 《五行精紀》 卷33의 `大運` 자료나 기존 `月柱`·`日上起時` 자료에 이번 `乙丑` example을 소급 삽입하지 않는다.

## 6. 남은 blockers

다음은 이번 direct evidence로 닫히지 않는다.

1. 만세력 기준일이 어떤 역법·epoch·日躔 계산에서 나온 것인지.
2. 서로 다른 역사 역서가 동일 날짜에 동일한 日干支를 주는지.
3. 子時·夜子·正子 경계에서 날짜와 日柱가 어떻게 바뀌는지.
4. 역사적 지역시·표준시·진태양시를 이 만세력 조회에 어떻게 적용했는지.
5. 판본별 `推日法`의 독립성, 공통 저본, 문헌 간 전승 관계.
6. 현대 계산기·calendar API·rounding·semantic authority·production readiness.

특히 p.56 example은 午時 출생이므로 子時 날짜 경계의 반례나 포함/배제 규칙을 제공하지 않는다. 기존 [子時 日界 direct witness](./saju-zi-day-boundary-direct-witness-successor-v1.md)의 source-local 판정을 이 example로 덮어쓰지 않는다.

## 7. 재현·검증 경계

이번 관찰에 사용한 local review surface는 다음과 같다.

```text
source: /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf
sha256: 8e8ebf3aa66781a3fb49a4acfc17229b6d0255af81a7cb9de0f83bafd43eb5ab
pages: PDF p.56–57 (`推日法` / `推時法`)
```

이 hash는 review 파일의 식별자이지 기관 canonical hash가 아니다. 공개 scan의 page image는 직접 observation surface이지만, 공개 파일명·Commons metadata·NLC source attribution만으로 physical-copy identity, raw-byte derivation, exact machine binding을 승격하지 않는다.

재현 가능한 검증 범위:

```bash
pdfinfo /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf
pdftoppm -f 56 -l 57 -r 1200 -png \
  /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf \
  /private/tmp/current-witness-review/daypillar/page
shasum -a 256 /private/tmp/saju-term-review/NLC416-5318-mingli-tanyuan.pdf
```

검증 대상은 p.56의 `萬年曆` anchor·`乙丑` result·`丙午／庚寅／乙丑` table과 p.57의 `乙丑日午時`·`乙日子時丙子`·`壬午` 관계로 제한한다. 원본 PDF를 repository에 복사하지 않고, `/private/tmp` 원본·render bytes도 변경하지 않는다.

## 8. 최종 bounded frontier

```text
萬年曆 anchor → birth-date 日干支       direct, source-local
birth-date 日干支 → 四柱 日柱           direct, same-case
日柱 日干 → 時柱                     direct, same-case
birth date → 日干支 → 日柱 → 時柱       direct, bounded worked example
萬年曆 자체의 역법/日躔 생성             unresolved in same example
역법 engine → 萬年曆 → 四柱 日柱         partial/unresolved
physical-copy/raw-byte/machine binding  unresolved
edition/lineage/independence            unresolved
semantic authority/readiness             blocked
production activation                   blocked
```

이 문서는 위 bounded advance만 기록한다. 더 강한 기존 frontier를 낮추지 않으며, direct source evidence가 없는 연결은 추정으로 보충하지 않는다.
