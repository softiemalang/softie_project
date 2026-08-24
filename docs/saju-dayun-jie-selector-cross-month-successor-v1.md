# 起運 worked example의 생월별 `節` selector bounded successor v1

상태: `bounded repeated Jie-selector evidence advanced`, `24-term inventory observed`, `中氣 target unresolved`, `astronomical instant/timezone/endpoint/rounding/readiness blocked`

기준일: `2026-08-24 KST`

이 문서는 [기존 term-selection boundary successor](./saju-dayun-term-selection-boundary-successor-v1.md)의 `一般 節 대 中氣 선택 규칙 = 미확정` 경계를 덮어쓰지 않는 additive successor다. 서로 다른 생월의 起運 worked example을 실제 원면 이미지에서 대조하여, inspected examples가 어떤 명칭을 target으로 적는지만 좁힌다. `節`과 `中氣`의 현대적 정의, 정확한 천문시각, timezone, endpoint, rounding, semantic authority, interpretation readiness는 이 문서에서 승격하지 않는다.

## 1. Bounded conclusion

직접 확인된 사례를 생월 위치별로 정리하면 다음과 같다.

| 생월 위치 | witness / page | 원면의 worked target | source가 target에 붙인 표지 | 안전한 판정 |
| --- | --- | --- | --- | --- |
| 十二月 | 《五行精紀》 卷33 「大運」: 장서각 K3-437, NLC KOL000000585, 연세대 viewer에서 parent-verified overlap | `二十九日申時立春` | 본문 규칙은 `生日後未來節氣日`·`陽男數未來之日` | 이 사례의 future named target은 `立春`이다 |
| 正月 | NLC `99036` 《淵海子平》 PDF p.50, printed 三二; NLC `511` 《神峰通考》 PDF p.22, printed 二〇 | `二月節驚蟄` | `初一日立春後一日生男 ... 順數至二月節驚蟄` | 정월 출생 뒤의 다음 named target이 `節`로 표기된 `驚蟄`이다 |
| 二月 | 《哲學講義大全》 direct scan PDF p.23, printed 二二 | `本月十二驚蟄` | `二月初五寅時生順數至未來節令` | 2월 생일 뒤의 future named target도 `驚蟄`이다 |

이 세 위치의 사례가 지지하는 가장 좁은 반복 규칙은 다음이다.

> inspected worked examples에서 순행은 생일 뒤의 future `節/節令` named target을, 역행은 생일 앞의 past `節/節令`을 찾는 구조로 적힌다. 직접 target으로 관찰된 명칭은 `立春`과 `驚蟄`이며, 이 page set에서 `雨水·春分·穀雨`가 起運 target으로 직접 적힌 사례는 없다.

이는 `현재 확인된 worked examples가 24개 항목 전체를 동일하게 selector로 사용한다`는 주장보다 좁다. 동시에 `모든 판본·모든 날짜에서 반드시 12節만 선택한다`는 edition-independent rule도 아직 닫지 않는다.

## 2. 직접 원면과 source boundary

### 2.1 《五行精紀》 卷33: 十二月 위치

장서각 K3-437 목판본, NLC KOL000000585 乙亥字本, 연세대 乙亥字本 viewer의 기존 parent verification에서 다음 sequence가 직접 보존되어 있다.

```text
陽男陰女大運以生日後未來節氣日為數順而行之
陰男陽女大運以生日之前過去節氣日為數逆而行之

譬如甲子陽男
十二月二十四日巳時生
是月二十九日申時立春
陽男數未來之日
```

이번 문서에서 안전하게 읽는 것은 `十二月` 생일과 사례에 적힌 `立春`의 named target 관계뿐이다. `申時`는 원면의 시각 표지이고, 현대의 분·초나 천문 event instant가 아니다. 이 source family의 공식 record·viewer·원면·raw-byte 경계는 [기존 term-selection successor](./saju-dayun-term-selection-boundary-successor-v1.md)와 [卷33 cross-edition dossier](./saju-wuxingjingji-vol33-d运-cross-edition-correspondence-successor-v1.md)에 보존되어 있다.

### 2.2 《淵海子平》: 正月 위치와 explicit `節`

NLC `99036` 공개 PDF의 [direct scan](https://upload.wikimedia.org/wikipedia/commons/1/11/NLC416-15jh007754-99036_%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3_%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%A9%AE.pdf) p.50(printed 三二)에서 `論起大運法`과 함께 다음 worked example을 직접 확인했다.

```text
初一日立春後一日生男
順數至二月節驚蟄
```

같은 page window의 rule text는 `陽男陰女順行數至未來節`이고, p.51(printed 三三) reverse examples에는 `逆數至初一日立春` 및 `初一立春`이 직접 보인다. 따라서 이 witness에서 `驚蟄`은 단순 계절 목록의 항목이 아니라 worked target 문장 안에서 `二月節`과 함께 적힌다.

별도의 공개 NLC `511` 《神峰通考》 [direct scan](https://upload.wikimedia.org/wikipedia/commons/d/d1/NLC511-027032013020556-10361_%E7%A5%9E%E5%B3%B0%E9%80%9A%E8%80%83_%E7%AC%AC2%E5%8D%B7.pdf) p.22(printed 二〇)에도 `起大運法陽男陰女` 아래 같은 정월 출생→`二月節驚蟄` 구조가 직접 보인다. 검토 derivative의 sha256은 `ccb21cf1215a1e487fe79497839f9343534af42a2e3af6c1e7dd04f3faea9289`이다. 이는 같은 worked pattern의 page-level corroboration이지만, 《淵海子平》과 《神峰通考》가 독립 oracle이거나 특정 계보를 갖는다는 뜻은 아니다.

이 자료는 《五行精紀》와 동일 판본·동일 copy·직접 전승임을 뜻하지 않는다. related direct witness의 locator와 source identity를 이용해 target-class observation을 corroborate할 뿐이다. PDF bytes의 source identity는 기존 parent dossier에 고정된 `sha256=fca66e109aae987a5a04dc623e5168680d227542e13b56cdd7c39b62e55b605f`를 따른다.

### 2.3 공개 direct scan: 二月 위치

공개된 `SSID-11321862` scan의 Commons metadata는 제목을 `哲學講義大全`, 편자를 `逢雨亭編`, pagecount를 331으로 표시한다. 이 파일은 공식 기관 catalog→원본 byte chain이 확인된 자료가 아니므로, 아래 관찰은 **scan-level page observation**으로만 취급한다.

- PDF source: [Commons file record](https://commons.wikimedia.org/wiki/File:SSID-11321862_%E5%93%B2%E5%AD%B8%E8%AC%9B%E7%BE%A9%E5%A4%A7%E5%85%A8.pdf)
- direct PDF: [SSID-11321862 scan](https://upload.wikimedia.org/wikipedia/commons/d/d5/SSID-11321862_%E5%93%B2%E5%AD%B8%E8%AC%9B%E7%BE%A9%E5%A4%A7%E5%85%A8.pdf)
- PDF page: 23; printed folio visible on the page: 二二
- direct scan sha256: `86e02deae44f4d4c99ae28ff739b996ac2eb1a1de64c4d6966946eb82965175f`

PDF p.23의 `時推小運法` 연속 문단에서 다음을 직접 읽었다.

```text
例如甲子陽年二月初五寅時生
順數至未來節令本月十二驚蟄
初五數至十二共八日
```

여기서는 `二月`이 명시된 생월과 `驚蟄` named target이 같은 worked example 안에 있다. 이어지는 문단은 여성/역방향에 대해 `逆數過去節令相交時為止`라고 하지만, 이 page 자체에서 그 역행 target의 이름을 `立春`으로 완성해 적은 원면은 이번 판정에 사용하지 않는다. 검색 snippet의 추가 문구를 page observation으로 대체하지 않는다.

이 scan은 직접 페이지가 보이는 보조 primary surface이지만, 기관 record·실물 copy identity·edition date·raw physical bytes·machine binding은 미확정이다. 따라서 이 면은 selector observation의 discovery/corroboration에는 쓰되, 《五行精紀》의 copy-level provenance나 계보로 승격하지 않는다.

## 3. `節`과 24-term inventory의 분리

NLC `99036` PDF p.52(printed 三四)의 별도 `論節候歌`에는 다음 계절 sequence가 직접 보인다.

```text
正月立春雨水節
二月驚蟄及春分
三月清明并穀雨
```

이 면은 한 seasonal inventory 안에 `立春·雨水`, `驚蟄·春分`, `清明·穀雨`가 함께 배열됨을 보여준다. 그러나 이 page는 `論起大運法` worked target을 새로 제시하지 않는다. 따라서 다음을 분리한다.

| claim | status | 직접 근거 | 승격 경계 |
| --- | --- | --- | --- |
| `驚蟄`가 worked target으로 실제 적힘 | `direct` | NLC p.50 `二月節驚蟄`; SSID p.23 `本月十二驚蟄` | 이 두 source surface의 사례 범위만 닫음 |
| `立春`가 worked target으로 실제 적힘 | `direct` | 《五行精紀》 十二月 example; NLC p.51 reverse examples | `立春`을 universal anchor로 고정하지 않음 |
| `雨水·春分·穀雨`가 해당 문헌의 seasonal sequence에 존재 | `direct locator` | NLC p.52 | 존재만으로 起運 target이라고 하지 않음 |
| `中氣`가 inspected worked target으로 직접 관찰됨 | `not observed / unresolved` | target pages에서 해당 named target 없음 | 전체 corpus에서의 부재·배제 증명으로 확대하지 않음 |
| `節`이 12개 monthly entry를 뜻한다는 formal normalization | `partial / source-layer bounded` | `二月節驚蟄`, `節令`, `正月立春雨水節`의 배열 | `節氣`·`節`·`中氣`를 모든 witness에서 등치/배타화하지 않음 |
| 24개 항목 전체가 起運 selector임 | `unresolved; not admitted` | inventory와 worked target이 서로 다른 page/context | 현대 24節氣 API 또는 automatic selector로 승격하지 않음 |

특히 `正月立春雨水節`의 `雨水`를 이 문장만으로 `中氣`라고 정규화하거나, `春分·穀雨`를 起運 target 후보로 확정하지 않는다. 현재 닫힌 것은 **worked target에 직접 적힌 named `節/節令` 표지**이지, 후대 천문학적 분류의 전체 의미론이 아니다.

## 4. 반복 가능한 selector 판정

### 4.1 이번에 전진한 bounded rule

관찰값을 source wording과 함께 보존하면 다음처럼 표현할 수 있다.

```text
if direction == source-marked forward/順:
    target = the future named 節/節令 observed in the example
if direction == source-marked backward/逆:
    target = the past named 節/節令 observed in the example

observed forward targets:
    十二月位置 -> 立春       # 五行精紀 卷33 example
    正月位置   -> 驚蟄       # 淵海子平 p.50, explicit 二月節驚蟄
    二月位置   -> 驚蟄       # 哲學講義大全 p.23, 本月十二驚蟄

observed backward targets:
    立春                       # 淵海子平 p.51 examples
    named target on the SSID reverse clause = not named on inspected page
```

이 rule은 `targetClass = monthly-entry named term`이라는 **bounded observation overlay**로만 기록한다. 실제 계산기에 넣을 `nextTerm(birthInstant)` 또는 `previousTerm(birthInstant)` 함수는 아직 승인하지 않는다. `節氣日`이라는 《五行精紀》의 raw wording도 `節`로 자동 교정하지 않고 별도 field로 둔다.

### 4.2 판정 상태

```text
cross-month worked examples                 = direct, repeated across source surfaces
forward named target 立春/驚蟄               = direct at example level
explicit 節 label with 驚蟄                  = direct in NLC p.50
24-term seasonal inventory                  = direct, separate context
中氣 target in inspected worked examples    = not directly observed
universal 12節-only rule for all witnesses  = unresolved
edition-independent textual authority       = unresolved/blocked
exact astronomical instant                  = unresolved
timezone / true-solar-time                  = unresolved
endpoint inclusion/exclusion                = unresolved
rounding / residual carry                   = unresolved
semantic authority / interpretation readiness= blocked
production activation                       = blocked
```

## 5. Claim-level promotion boundary

### 승격한 것

- 十二月·正月·二月 위치의 direct worked example을 같은 selector 질문 아래 병렬 배치했다.
- 서로 다른 생월 위치에서 target 명칭이 `立春` 또는 `驚蟄`로 직접 적힌다는 사실을 기록했다.
- NLC p.50의 `二月節驚蟄`을 `節` label이 붙은 worked target으로 고정했다.
- NLC p.52의 `雨水·春分·穀雨`는 seasonal inventory로만 보존하고 worked selector와 분리했다.
- inspected page set에 한정하여 `future/past named 節/節令` selector overlay를 bounded successor로 제안했다.

### 승격하지 않은 것

- `節氣`·`節令`·`節`을 모든 판본에서 같은 formal class로 정규화하는 것.
- `雨水·春分·穀雨`를 起運 target으로 포함하거나 배제하는 보편 규칙.
- 특정 공통조상, 판본 선후, textual independence, 정본성, semantic authority.
- `驚蟄`·`立春`의 exact astronomical instant, solar longitude, timezone, true-solar-time.
- birth-at-term의 endpoint, inclusive/exclusive counting, same-day 처리, rounding, residual carry.
- 현대 `next/previous 24節氣` API, `一日四月·一時十日` 환산, interpretation readiness, production activation.

## 6. Reproducibility and validation boundary

이번 successor는 existing source bytes, historical artifacts, runtime code를 수정하지 않는 documentation-only overlay다.

직접 관찰 surface는 다음처럼 재현할 수 있다.

```text
# NLC 99036 public derivative
pdfinfo NLC416-99036-yuanhai.pdf
pdftoppm -f 50 -l 52 -r 180 -png NLC416-99036-yuanhai.pdf yuanhai-target

# NLC 511 public derivative
pdfinfo NLC511-shenfeng-vol2.pdf
pdftoppm -f 22 -l 22 -r 180 -png NLC511-shenfeng-vol2.pdf shenfeng-target

# SSID direct scan
pdfinfo SSID-11321862-philosophy.pdf
pdftoppm -f 23 -l 23 -r 144 -png SSID-11321862-philosophy.pdf ssid-page
```

`NLC416-99036-yuanhai.pdf`와 `NLC511-shenfeng-vol2.pdf`는 임시 검토 derivative이며, 각각의 공식/공개 경로 및 기존 parent hash는 기존 dossier의 boundary를 따른다. SSID scan은 위에 적은 URL·page·sha256으로 식별하지만 institutional item identity로 승격하지 않는다.

문서 검증은 page-level 문자 관찰과 claim boundary에 한정된다. 이것은 현대 절기 계산의 정확성, canonical semantic interpretation, readiness 또는 production activation을 검증하는 테스트가 아니다.

기존 `docs/saju-sonkeikaku-institution-access-audit-v1.md`, `docs/saju-wonkwang-copy-page-provenance-audit-v2.md`, `docs/saju-wonkwang-copy-page-provenance-audit-v3.md`, `docs/saju-wonkwang-institution-access-audit-v1.md`와 대용량 원본·기타 dirty work는 stage·수정·삭제 대상이 아니다.
