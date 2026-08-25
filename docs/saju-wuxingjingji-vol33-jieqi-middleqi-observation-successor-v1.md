# 《五行精紀》卷33 起運 `節氣·節候·中氣` bounded observation successor v1

- 기준일: 2026-08-25 (Asia/Seoul)
- 상태: additive bounded successor; 직접 관찰 범위만 기록
- 대상: 《五行精紀》 卷第三十三 「大運」
- 핵심 결론: 확인된 원면에는 `節氣`, `過去節`, `立春` 사례가 직접 보이지만, `節止·不論中氣`를 이루는 명시 문장은 이번에 확인한 창에서 직접 보이지 않는다. 따라서 `12節-only`, `中氣` 배제, 특정 전승·계보, 정본성, semantic authority, 현대 계산 규격, readiness는 모두 미확정으로 유지한다.

## 1. 범위와 판정 원칙

이번 successor는 기존 witness 문서를 수정하지 않고 다음 두 원면 창을 추가·재확인한 결과다.

1. 국립중앙도서관 《五行精紀. 卷30-33》, `KOL000000585.pdf`의 PDF page 102–149. 기존에 확인한 p.102–110에 이번에 p.111–149를 추가로 육안 확인했다. p.150–152는 말엽·공백·표지 성격으로 확인했다.
2. 장서각 `K3-437_006.pdf`의 PDF page 70–85. 卷33 표제와 「大運」이 있는 p.71–72를 중심으로 앞뒤 문맥을 확인했다.

아래의 page 표기는 모두 **PDF digital page index**다. 책의 인쇄 면수·엽수·책차 안의 printed locator로 정규화하지 않는다. OCR이나 검색어 적중은 원면 판독을 대체하지 않으며, “관찰되지 않음”은 해당 관찰 창에 대한 bounded negative observation일 뿐 《五行精紀》 전체의 부재 증명이 아니다.

## 2. 직접 관찰된 《五行精紀》 표현

### 2.1 起運 방향·대상일 표현: `節氣`

NLC p.104–105와 장서각 p.72에서 다음 구조가 직접 확인된다.

> 若陽男陰女大運以生日後未來節氣日為數順而行之
>
> 陰男陽女大運以生日前過去節氣日為數逆而行之

두 문장은 각각 양남·음녀와 음남·양녀의 진행 방향을 말하면서 대상일을 `未來節氣日`·`過去節氣日`로 표현한다. 이것은 해당 원면에 `節氣`가 쓰였다는 직접 근거다. 그러나 이 문장만으로 `節氣`를 현대의 특정 12개 節로 환산하거나 中氣를 배제한다고 판정하지 않는다.

### 2.2 `節`의 별도 출현

NLC p.111의 뒤이은 문맥에는 `過去節`이라는 결합이 직접 보인다. 이는 卷33 내부에서 `節氣`와 별도로 `節`이라는 짧은 표현도 사용됨을 보여 주지만, 확인된 원면에는 다음과 같은 정지·배제 문장이 함께 보이지 않았다.

- `節止`
- `皆遇節即止`
- `不論中氣`
- `不論節`

따라서 `過去節`을 `節止·不論中氣`의 축약형으로 해석하거나, `節氣`와 동일한 기술적 범주로 자동 정규화하지 않는다.

### 2.3 worked example의 `立春`과 시간 표현

NLC p.104–105 및 장서각 p.72의 사례에는 다음 요소가 직접 확인된다.

- `二十九日申時立春`
- `節氣實歷過六十三時`

이는 적어도 확인된 사례에서 특정 절기명 `立春`과 `節氣`를 사용해 생시에서 target까지의 경과 시간을 서술한다는 근거다. 여기서 `立春`이 등장했다는 사실만으로 모든 월령·계절의 selector가 12節-only라고 일반화하지 않으며, `時`를 현대 시간대·천문시각·endpoint·rounding 규격으로 변환하지 않는다.

### 2.4 卷33의 앞부분 표제와 환산 문장

NLC p.102–103 및 장서각 p.71에서 다음이 직접 확인된다.

> 五行精紀卷第三十三
>
> 大運
>
> 運行則一辰十歲折除乃三日為年

그 뒤에 `王氏注云`이 이어진다. 이 표제·문장과 이번 `節氣` 관찰은 같은 卷33 원면 안의 직접 evidence이지만, `節止·不論中氣` 문장의 직접 확인이나 특정 주석층의 전승 관계를 대신하지 않는다.

## 3. 표현별 bounded ledger

| 표현·주장 | 직접 관찰 범위 | 판정 | 승격하지 않는 것 |
|---|---|---|---|
| `節氣`가 起運 대상일 표현에 사용됨 | NLC p.104–105; 장서각 p.72 | direct support | 12節-only, 中氣 배제, 현대 24절기 API |
| `過去節`이 卷33 문맥에 출현함 | NLC p.111 | direct support, lexical only | `節止` 또는 `不論中氣`로의 정규화 |
| `立春`이 worked example에 출현함 | NLC p.104–105; 장서각 p.72 | direct support, example-local | 전 계절·전 월령 selector의 보편 규칙 |
| `節氣實歷過六十三時` 같은 경과시간 서술 | NLC p.105 부근; 장서각 p.72의 동일 사례 문맥 | direct support, example-local | timezone, endpoint, rounding, 현대 알고리즘 |
| `節候`라는 문자 그대로의 표현 | NLC p.102–149 및 장서각 p.70–85 관찰 창 | not observed in inspected window | 《五行精紀》 전체 부재 |
| `中氣`라는 문자 그대로의 표현 | NLC p.102–149 및 장서각 p.70–85 관찰 창 | not observed in inspected window | 中氣 배제의 direct proof |
| `雨水`, `驚蟄`이라는 절기명 | 같은 관찰 창 | not observed in inspected window | 해당 절기 미수록 또는 selector 범위 |
| `節止·不論中氣` 또는 동등한 명시 문장 | 같은 관찰 창 | not directly confirmed | 외부 문헌 규칙의 《五行精紀》 전이 |

`not observed` 행은 육안 판독한 페이지 창에 대한 부재 범위다. 원문 전체의 완전 검색·전수 판독 또는 다른 판본의 문장을 《五行精紀》에 덧씌우는 근거로 사용하지 않는다.

## 4. 외부 direct rule과의 경계

기존의 [외부 direct-rule audit](./saju-dayun-jie-middle-qi-direct-rule-successor-v1.md)에는 다른 문헌의 `皆遇節即止。中氣不論` 및 유사한 명시 규칙이 별도 source-local evidence로 기록되어 있다. 그 문장들은 해당 문헌의 규칙을 입증할 수 있지만, 이번 《五行精紀》 원면에서 직접 확인된 문장이 아니다.

따라서 이 문서는 다음을 주장하지 않는다.

- 다른 문헌의 `節止·不論中氣`를 《五行精紀》의 생략된 문장으로 복원하지 않는다.
- 《五行精紀》의 `節氣`를 후대 명리 문헌의 `節` 규칙과 동일시하지 않는다.
- 동일한 worked example이나 표현을 공통 저본·직접 계보·판본 선후의 증거로 사용하지 않는다.

## 5. source identity와 재현 정보

### 5.1 NLC 《五行精紀. 卷30-33》

- 공식 catalog: [국립중앙도서관 KORCIS KOL000000585 record](https://www.nl.go.kr/korcis/search/popup/contentsInfo.do?controlNo=KOL000000585)
- 공식 viewer 경로: [NLC 원문 viewer](https://viewer.nl.go.kr/nlmivs/viewWonmun_js.jsp?cno=KOL000000585)
- 검토한 local original: `/Users/softie/Downloads/KOL000000585.pdf`
- `pdfinfo`: 152 pages; image-only scan
- byte size: 178,182,272
- SHA-256: `ec32fa58149a7ae3616a3110cb27edfcad45a797a6a91eeb621ab692e5be3170`
- 직접 확인 범위: PDF p.102–149; p.150–152는 말엽·공백·표지성 페이지

### 5.2 장서각 《五行精紀》 K3-437 제6책

- 공식 item: [장서각 K3-437 record](https://jsg.aks.ac.kr/dir/view?dataId=JSG_K3-437)
- 공식 PDF: [K3-437_006.pdf](https://jsg.aks.ac.kr/data/serviceFiles/pdf/K3-437_006.pdf)
- 검토한 local derivative/original copy: `/private/tmp/current-witness-review/K3-437_006.pdf`
- `pdfinfo`: 134 pages
- byte size: 14,116,437
- SHA-256: `335a1c03c7af246969e00667d6a4d9756b19c19d93539223bb871c47001a24cd`
- 직접 확인 범위: PDF p.70–85; 卷33 표제·「大運」·worked example은 p.71–72

원본 PDF 자체를 저장소에 복사하거나 변형하지 않았다. 렌더링 PNG는 검토용 임시 산출물이며 source identity로 사용하지 않는다.

## 6. frontier 판정

### 유지·제한적으로 전진한 것

- 《五行精紀》 卷33 내부에서 `節氣`가 起運 대상일 서술에 직접 나타난다는 범위를 NLC와 장서각 원면으로 재확인했다.
- NLC 원면에서 `過去節`의 별도 lexical occurrence와 `立春` worked example을 추가로 확인했다.
- `節候·中氣·雨水·驚蟄` 및 `節止·不論中氣`가 이번 두 witness의 명시 관찰 창에서 직접 보이지 않는다는 bounded negative observation을 기록했다.

### 계속 blocked인 것

- `節止·不論中氣`의 《五行精紀》 직접 원면 근거
- `12節-only` 또는 `中氣` 배제 규칙
- `節氣`와 `節`의 기술적 동일성
- 특정 판본·공통 저본·전승 계보·판본 선후·textual independence
- 원작자·편찬자의 의도, 정본성, semantic authority
- 현대 절기 API, timezone, endpoint, rounding, 계산 규격
- interpretation readiness, production readiness, activation

이 successor는 표현 관찰과 bounded negative 범위만 갱신한다. 위 blocked 항목을 계산·해석·계보 결론으로 승격하지 않는다.

## 7. 재현 절차

```sh
pdfinfo /Users/softie/Downloads/KOL000000585.pdf
shasum -a 256 /Users/softie/Downloads/KOL000000585.pdf
pdftoppm -f 111 -l 149 -r 70 -png /Users/softie/Downloads/KOL000000585.pdf /private/tmp/current-witness-review/expanded/kol-tail/page

pdfinfo /private/tmp/current-witness-review/K3-437_006.pdf
shasum -a 256 /private/tmp/current-witness-review/K3-437_006.pdf
pdftoppm -f 70 -l 85 -r 150 -png /private/tmp/current-witness-review/expanded/k3/page
```

렌더링 파일명은 실행 환경에서 달라질 수 있으므로 PNG 자체의 경로·해시를 이 문서의 canonical evidence로 삼지 않는다. 최종 판정은 위에 고정한 기관 record, source PDF identity, PDF page index, 원면 관찰 문구의 결합으로만 재현한다.
