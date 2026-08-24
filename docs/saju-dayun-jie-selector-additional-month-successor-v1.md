# 起運 worked example 추가 월령의 `節候` target bounded successor v1

상태: `additional cross-month direct page observed`, `named targets are 立夏/清明`, `12節 correspondence bounded`, `24節氣-wide selector unresolved`, `中氣 exclusion not admitted`, `modern timing/readiness blocked`

기준일: `2026-08-24 KST`

이 문서는 [기존 생월별 selector successor](./saju-dayun-jie-selector-cross-month-successor-v1.md)에 새 원면 관찰을 additive하게 붙인다. 기존 `十二月→立春`, `正月→驚蟄`, `二月→驚蟄` 사례를 덮어쓰거나 보편 규칙으로 일반화하지 않는다. 새 자료는 《五行精紀》의 copy witness가 아니라, 起運 term-selection 문구와 다른 월령의 worked target을 확인하는 별도 문헌 surface다.

## 1. Bounded conclusion

국립중앙도서관 기록 경로에 연결된 `CNTS-00109637789` 스캔의 제1 PDF segment에서, 인쇄면 42–43에 걸쳐 다음을 직접 관찰했다.

```text
凡大運陽男陰女數節候未來日了三日為一年
陰男陽女數節候過去日了以三日為一年
陽男陰女順行陰男陽女逆行

且如甲子命人三月十五日生是陽男
...
立夏自三月十五日順數去至立夏則十有七日
...
若女命謂之陽女即數過去節看清明是何日
若是三月初二日為清明
...
至清明有十三日
```

원면에 직접 적힌 target 이름은 `立夏`와 `清明`이다. 둘 다 전통적인 24節氣 명칭을 12개의 monthly `節`과 그 사이의 中氣로 나누는 표준 분류에서 12節 쪽에 놓이는 이름이지만, 이 page 자체는 `十二節`이라는 formal label이나 `中氣를 배제한다`는 명제를 말하지 않는다. 따라서 이번에 닫히는 판정은 다음으로 제한한다.

> 서로 다른 월령의 실제 worked example에서 source가 `節候`를 세는 문맥과 함께 `立夏`·`清明`을 target 이름으로 적는다. 이는 inspected sample에서 named target이 12節 계열과 대응한다는 직접 관찰을 추가하지만, 모든 문헌에서 12節만 선택한다거나 24節氣 전체 중 中氣를 배제한다는 보편 규칙은 닫지 않는다.

## 2. 새 direct page surface와 provenance boundary

| 항목 | 확인값 | 안전한 source role |
| --- | --- | --- |
| 기관 record route | NDL Korea `CNTS-00109637789`, UCI `G701:B-00109637789` | 기관 catalog identity/locator |
| record-linked public scan | `CNTS-00109637789_1` 《三車一覽命書詳論》 PDF | record에 연결된 공개 digital derivative |
| record metadata | `三車一覽命書詳論`, 10卷1册, `金屬活字本(乙亥字)`, 원본소장처 British Library | bibliographic/material secondary evidence |
| direct scan extent | PDF 86 pages; file size 63,882,820 bytes | derivative identity |
| local temporary derivative | `/private/tmp/saju-term-review/CNTS-00109637789_1.pdf` | 검토 전용; repository에 복사·추적하지 않음 |
| actual downloaded SHA-256 | `fd1e28cab509de4869278aad16e746e91ca416dae882800cae092630616a3fd3` | 이번 검토 byte identity |
| target pages | PDF pp.44–45; printed pages 42–43 visible | page-level visual locator |

공식 record 경로는 [국립중앙도서관 record route](https://nl.go.kr/NL/contents/search.do?#viewKey=CNTS-00109637789&viewType=C)이고, 공개 scan의 metadata와 원본 소장처 표기는 [Commons file record](https://commons.wikimedia.org/wiki/File:CNTS-00109637789_1_%E4%B8%89%E8%BB%8A%E4%B8%80%E8%A6%BD%E5%91%BD%E6%9B%B8%E8%A9%B3%E8%AB%96.pdf)에 보존되어 있다. Commons metadata는 이 segment를 `金屬活字本(乙亥字)`로 기술하고 원본 소장처를 British Library로 적지만, 그 metadata만으로 이 scan의 raw bytes가 기관 원본에서 어떤 export 과정을 거쳤는지, 또는 《五行精紀》와 같은 계열인지 확정하지 않는다.

이번 문서에서 직접 확인한 것은 **공개 scan의 PDF pp.44–45에 보이는 원면 이미지**다. 따라서 `CNTS-00109637789`의 catalog identity와 page-level visual observation은 각각 보존하되, 다음은 승격하지 않는다.

- 이 문헌을 《五行精紀》의 동일 copy·동일 판본·직접 선행본으로 묶는 것.
- `金屬活字本(乙亥字)`라는 catalog/material description을 《五行精紀》 乙亥字本의 copy-level binding으로 전이하는 것.
- PDF page number를 새 printed folio나 권차 locator로 재명명하는 것.
- 공개 derivative의 hash를 기관 raw-byte identity 또는 machine binding으로 해석하는 것.

## 3. 원면에서 확인한 worked examples

### 3.1 三月十五日 출생 → 立夏

PDF p.44(printed 42)의 `起大運例` 문단에서 `且如甲子命人三月十五日生是陽男`을 읽고, 다음 PDF p.45(printed 43)에서 이어지는 `立夏自三月十五日順數去至立夏則十有七日`을 확인했다. 같은 sequence 안에서 `從生月順行`과 5세·8개월의 결과 표지도 보이지만, 이번 successor는 산술 결과를 재규격화하지 않고 target label과 source wording만 채택한다.

안전한 관찰:

- birth month/day: `三月十五日`.
- direction label: `是陽男` 및 앞 page의 `陽男陰女順行`.
- target label: `立夏`.
- source counting wording: `自三月十五日順數去至立夏`.
- source-reported count: `十有七日`.

`立夏`를 현대 절기 API의 event timestamp로 바꾸거나, `十有七日`을 endpoint와 rounding이 확정된 입력으로 취급하지 않는다.

### 3.2 三月生 여성 사례 → 清明

같은 PDF p.45(printed 43)의 다음 column에서 `若女命謂之陽女即數過去節看清明是何日`과 `若是三月初二日為清明`을 확인하고, 이어 `至清明有十三日`을 읽었다. 이는 같은 문헌 page에서 생일보다 과거의 named term을 찾는 역행 example이다.

안전한 관찰:

- birth-month context: `三月`.
- direction label: `若女命謂之陽女` 및 앞 page의 `陰男陽女逆行`.
- target label: `清明`.
- source counting wording: `數過去節` 및 `自十五日逆數至清明`의 연속 문맥.
- source-reported count: `十三日`.

이 page는 `清明`을 직접 target으로 적지만, 그 target이 모든 witness에서 유일한 previous class라고 말하지 않는다. `三月初二日為清明`은 이 worked example의 source-local date relation이다.

## 4. 12節 대 24節氣 전체 판정

이번 판정은 세 층을 분리한다.

| 층위 | 이번 원면에서 확인된 것 | 판정 |
| --- | --- | --- |
| literal source wording | `節候`, `未來`, `過去節`, `立夏`, `清明` | `direct` |
| traditional name classification | `立夏`·`清明`은 24節氣 명칭 중 12 monthly `節` 쪽의 이름과 대응 | `bounded classification`, source formalization 아님 |
| selector universe | page가 24개 전체를 열거나 中氣를 명시적으로 제외하는지 | `unresolved` |

따라서 `立夏`와 `清明`은 이번 page에서 **12節 계열 이름으로 직접 관찰된 target**이라고 기록한다. 그러나 다음 명제는 기록하지 않는다.

```text
selector = all 12 節 only
selector != any 中氣
selector = all 24 節氣
```

앞의 세 명제 모두 source-specific direct evidence를 넘어선다. 특히 `雨水·春分·穀雨`가 다른 문헌의 seasonal inventory에 배열되어 있다는 사실은, 여기서 새로 관찰한 `立夏·清明` worked target과 동일한 selector universe의 증명이 아니다. 기존 [cross-month successor](./saju-dayun-jie-selector-cross-month-successor-v1.md)의 inventory/target 분리 원칙을 그대로 유지한다.

## 5. 기존 direct sample과의 bounded 대조

| 생월 위치 | 직접 관찰된 source surface | worked target | 이번 frontier에서의 역할 |
| --- | --- | --- | --- |
| 十二月 | 《五行精紀》 卷33 direct witness set | `二十九日申時立春` | 기존 baseline; source-specific `節氣` wording |
| 正月 | NLC `99036` 《淵海子平》 p.50 | `二月節驚蟄` | explicit `節` label이 붙은 관련 direct witness |
| 二月 | `SSID-11321862` p.23 | `本月十二驚蟄` | 공개 scan의 다른 월령 corroboration; institutional chain 미확정 |
| 三月 | `三車一覽命書詳論` PDF pp.44–45 | 순행 `立夏`, 역행 `清明` | 이번 추가 direct page-level witness |

이 배열은 inspected examples가 `十二月`에서 `三月`까지 서로 다른 월령 위치에서 named term을 적는다는 점을 보여준다. 그러나 기관·문헌·판종이 다르므로, 이 배열만으로 textual independence, 공통 조상, 판본 선후, 특정 전승 lineage를 산출하지 않는다. 새 자료의 역할은 `五行精紀` copy provenance가 아니라 **selector 문구의 cross-source corroboration**이다.

## 6. Claim-level status

| claim | status | direct basis | 승격하지 않은 범위 |
| --- | --- | --- | --- |
| 새 三月 worked example이 실제로 존재 | `direct` | PDF pp.44–45, printed 42–43 | 다른 월령·다른 문헌 전체의 보편화 |
| 순행 example의 target이 `立夏` | `direct` | `自三月十五日順數去至立夏` | `next 24-term` 계산 함수 |
| 역행 example의 target이 `清明` | `direct` | `過去節看清明`·`三月初二日為清明`·`至清明` | 모든 역행 사례의 universal previous-term 규칙 |
| source가 `節候`/`過去節`을 사용 | `direct` | PDF p.44–45 | `節候`의 현대 formal class 정규화 |
| `立夏`·`清明`이 12節 계열 이름과 대응 | `bounded direct-plus-classification` | page의 literal names + traditional term classification | source가 12節-only를 선언했다는 주장 |
| inspected samples에서 named target이 12節 계열로 반복 | `partial / bounded repeated` | 기존 `立春`·`驚蟄` direct samples + 새 `立夏`·`清明` | 전체 corpus·모든 edition의 규칙 |
| 中氣를 배제 | `unresolved; not admitted` | 새 page에 中氣 exclusion statement 없음 | 부재를 exclusion 증명으로 바꾸지 않음 |
| 24節氣 전체를 selector로 사용 | `unresolved` | 새 page가 전체 universe를 말하지 않음 | 현대 24節氣 API |
| 정확한 천문시각·timezone·endpoint·rounding | `unresolved` | source-local day/count only | 현대 계산 규격 |
| semantic authority / interpretation readiness | `blocked` | separate gate not satisfied | production activation |

## 7. 반복 패턴의 좁은 표현

이번 추가 원면과 기존 직접 사례를 합쳐도 안전한 표현은 다음뿐이다.

```text
if a source's worked example explicitly marks the direction as forward/順:
    preserve the future named 節/節候 target written in that example
if a source's worked example explicitly marks the direction as backward/逆:
    preserve the past named 節/節候 target written in that example

observed named targets in the inspected sample:
    立春, 驚蟄, 立夏, 清明

observed target class:
    named terms corresponding to the 12-節 side of the traditional 24-term split

not established:
    universal 12-節-only selector
    universal 24-term selector
    中氣 exclusion or inclusion
    exact astronomical event resolver
```

이것은 source-preserving observation overlay다. `target = nextJie(birthInstant)` 또는 `target = previousJie(birthInstant)`라는 production algorithm, `中氣 배제` 정책, endpoint 포함/배제, timezone, rounding, semantic authority, readiness를 승인하는 문장이 아니다.

## 8. 재현과 보존 경계

새 direct page는 다음 경로로 다시 확인할 수 있다.

```text
curl -L --fail --silent --show-error \
  -o /private/tmp/saju-term-review/CNTS-00109637789_1.pdf \
  'https://upload.wikimedia.org/wikipedia/commons/7/7c/CNTS-00109637789_1_%E4%B8%89%E8%BB%8A%E4%B8%80%E8%A6%BD%E5%91%BD%E6%9B%B8%E8%A9%B3%E8%AB%96.pdf'
pdfinfo /private/tmp/saju-term-review/CNTS-00109637789_1.pdf
pdftoppm -f 44 -l 45 -r 150 -jpeg \
  /private/tmp/saju-term-review/CNTS-00109637789_1.pdf \
  /private/tmp/saju-term-review/cnts1-target
shasum -a 256 /private/tmp/saju-term-review/CNTS-00109637789_1.pdf
```

검증 대상은 PDF pp.44–45의 이미지와 그 안의 literal target/name relation이다. OCR, secondary transcription, search snippet은 이 direct page observation을 대체하지 않는다. 원본 PDF는 `/private/tmp`의 임시 검토 surface에만 두었고 repository에 추가하지 않는다.

이번 문서가 보존하는 blocker:

- `CNTS-00109637789` 공개 derivative와 기관 raw export 사이의 exact byte/machine binding.
- `三車一覽命書詳論`과 《五行精紀》 사이의 textual lineage·공통조상·판본 선후.
- `節候`/`節氣`/`節令`의 edition-independent formal equivalence.
- 中氣의 inclusion/exclusion과 12節-only selector의 보편성.
- 정확한 천문 event instant, timezone, endpoint, rounding, 현대 API 규격.
- semantic authority, interpretation readiness, production activation.

기존 `docs/saju-sonkeikaku-institution-access-audit-v1.md`, `docs/saju-wonkwang-copy-page-provenance-audit-v2.md`, `docs/saju-wonkwang-copy-page-provenance-audit-v3.md`, `docs/saju-wonkwang-institution-access-audit-v1.md`와 기타 unrelated dirty work는 이 successor의 stage·수정·삭제 대상이 아니다.
