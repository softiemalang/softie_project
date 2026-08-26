# 起運 worked example 계절 범위의 `節` selector bounded successor v1

상태: `winter direct page observed`, `new target 大雪`, `spring/summer/winter sample coverage`, `autumn direct worked target unresolved`, `12節-only not admitted`, `中氣 exclusion not generalized`, `modern timing/readiness blocked`

기준일: `2026-08-24 KST`

이 문서는 [기존 추가 월령 selector successor](./saju-dayun-jie-selector-additional-month-successor-v1.md)에 계절이 다른 새 원면 관찰을 additive하게 붙인다. 기존 `立春·驚蟄·清明·立夏` 사례를 덮어쓰지 않으며, 이번에 확인한 `大雪`을 《五行精紀》의 copy witness나 특정 판본의 직접 계보로 승격하지 않는다. 새 자료는 《五行精紀》가 아닌 후대 문헌의 직접 page-level worked-example corroboration이다.

## 1. Bounded conclusion

공개된 NLC scan surface의 PDF p.18(인쇄면 `十四`)에서 다음 `推大運` 문단과 worked example을 직접 읽었다.

```text
推大運時。先從所生之日起。陽男陰女順行。數至未來節。
陰男陽女逆行。數至已過去節。皆遇節即止。中氣不論。
...
例如丙申年十月十八日申時生男查曆書本年十一月初二亥正一刻八分交大雪節。
因丙年生男為陽男。故從十月十八日申時順數至十一月初二日亥時。
共得十四日零三時。
```

같은 page의 이어지는 문장은 source-local 계산 결과를 `五十七月合四年零九月` 및 `五歲上運欠三月`으로 적는다. 이 숫자는 원면이 보고한 값으로만 보존하고, 현대 계산 규격이나 endpoint/rounding 규칙으로 재계산하지 않는다.

이번에 실제로 좁혀지는 범위는 다음과 같다.

> 기존 직접 사례에 더해, 겨울 월령 맥락의 worked example에서도 target 이름 `大雪`이 `大雪節`로 명시된다. 따라서 현재 inspected sample은 봄·여름·겨울에 걸쳐 source가 미래 또는 과거의 이름 붙은 `節/節候`를 target으로 기록하는 사례를 포함한다. 그러나 이 표본만으로 모든 12節을 selector로 삼는다거나 中氣를 배제한다거나, 현대 절기 계산 함수로 일반화하지 않는다.

page에 `中氣不論`이라는 문구가 실제로 있지만, 그것은 **이 문헌 page의 source-local assertion**이다. 다른 《五行精紀》 witness·다른 문헌·전체 전승에 대한 보편적 `中氣 배제` 판정으로 승격하지 않는다.

## 2. 새 page surface와 provenance boundary

| 항목 | 확인값 | 안전한 source role |
| --- | --- | --- |
| 공개 scan identity | `NLC416-13jh000981-42624_子平命術要訣.pdf` | NLC data/record 식별자를 보존한 공개 digital surface |
| metadata title/author | `子平命術要訣` / `鄒文耀著述` | 공개 repository bibliographic metadata |
| metadata date | `民國十六年[1927]` | catalog-level date lead; 《五行精紀》 연대/판본으로 전이하지 않음 |
| metadata source | National Library of China로 기술됨 | 기관 source lead; 이번 pass에서 별도 공식 NLC OPAC 원 record는 확보하지 않음 |
| public file record | [Wikimedia Commons file record](https://commons.wikimedia.org/wiki/File%3ANLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf) | scan metadata와 file identity의 secondary route |
| direct PDF | [public PDF](https://upload.wikimedia.org/wikipedia/commons/c/c7/NLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf) | PDF image surface; p.18 직접 관찰 대상 |
| downloaded extent | 65 PDF pages | derivative extent |
| local temporary derivative | `/private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf` | 검토 전용; repository에 복사·추적하지 않음 |
| actual downloaded SHA-256 | `885bf4db4a6a80a0a7d308ef200ad97da424676b9003f16f72633874f27f795b` | 이번 검토 byte identity; 기관 raw-byte identity로 해석하지 않음 |
| target locator | PDF p.18; printed page `十四` visible | page-level visual locator |

이 문서에서 직접 확인한 것은 공개 PDF p.18의 이미지와 그 안의 literal wording이다. Commons의 metadata와 파일명은 scan identity를 추적하는 secondary evidence이며, 그것만으로 다음을 확정하지 않는다.

- 이 자료가 《五行精紀》의 동일 copy·동일 판본·직접 선행본이라는 주장.
- `子平命術要訣`과 《五行精紀》 사이의 공통 조상·판본 선후·textual independence.
- 공개 PDF의 hash가 기관 원본의 raw bytes 또는 export/machine binding을 대표한다는 주장.
- page의 `大雪節`을 모든 문헌에서 동일한 formal selector class로 정규화하는 것.

## 3. 원면에서 확인한 새 worked example

### 3.1 十月十八日申時 출생 → 大雪

PDF p.18(인쇄면 `十四`)의 `推大運` 문단은 먼저 `陽男陰女順行`, `陰男陽女逆行`, `數至未來節`, `數至已過去節`을 적고, 이어 `中氣不論`을 적는다. 그 다음 example은 다음 sequence를 갖는다.

| 요소 | 원면에서 직접 확인한 값 | 판정 경계 |
| --- | --- | --- |
| birth context | `丙申年十月十八日申時生男` | source-local worked input |
| direction wording | `因丙年生男為陽男` 및 `順數` | 해당 example의 방향 표지 |
| target wording | `十一月初二亥正一刻八分交大雪節` | `大雪` target direct |
| counting wording | `從十月十八日申時順數至十一月初二日亥時` | source-local interval wording |
| reported count | `共得十四日零三時` | source-reported count; 재규격화하지 않음 |
| source-reported result | `五十七月合四年零九月`, 이어 `五歲上運欠三月` | literal result only |

따라서 `大雪`은 검색 snippet이나 OCR만으로 추정한 target이 아니라 PDF image에서 `大雪節`로 직접 보이는 새 사례다. `十一月`과 `大雪`의 traditional monthly association은 보조 분류로만 유지하며, 이 page가 현대 24節氣 table 또는 전체 selector universe를 제시한다고 읽지 않는다.

## 4. 계절별 observed range

현재 repo의 직접 관찰 문서와 이번 page를 합친 **bounded sample inventory**는 다음과 같다.

| 계절 범위 | 직접 확인된 target | surface | 현재 역할 |
| --- | --- | --- | --- |
| 봄 | `立春`, `驚蟄`, `清明` | 《五行精紀》·《淵海子平》 관련 direct page surfaces | 기존 baseline/cross-month corroboration |
| 여름 | `立夏` | 《三車一覽命書詳論》 PDF pp.44–45, printed 42–43 | 기존 추가 월령 direct page-level corroboration |
| 가을 | 이번 pass에서 새 worked target 없음 | `白露·寒露·立秋` search/secondary leads는 원면 승격 안 함 | `unresolved` |
| 겨울 | `大雪` | 《子平命術要訣》 PDF p.18, printed `十四` | 이번 successor의 새 direct page-level corroboration |

이 표가 말하는 것은 “현재 직접 본 sample의 계절 coverage”뿐이다. 가을 target이 없다는 것은 가을 문헌이나 target의 부재를 뜻하지 않으며, `白露`·`寒露` 관련 검색 결과·현대 설명·OCR snippet은 실제 target page를 직접 확인하지 않았으므로 이 표에 direct 사례로 넣지 않는다.

## 5. Selector pattern의 bounded 판정

| claim | status | direct basis | 승격하지 않은 범위 |
| --- | --- | --- | --- |
| 겨울 계절의 새 worked example이 존재 | `direct` | NLC public scan PDF p.18, printed `十四` | 다른 겨울 월령 전체 |
| 새 target이 `大雪` | `direct` | `交大雪節` visible in the example | 모든 witness의 winter target 규칙 |
| source가 forward direction에서 미래 named term을 셈 | `direct, source-local` | `陽男陰女順行` + `數至未來節` + `順數至...大雪節` | 모든 문헌의 universal direction algorithm |
| source가 backward direction에서 과거 named term을 셈 | `direct, source-local` | 같은 page의 `陰男陽女逆行` + `數至已過去節` | 모든 역행 example의 universal boundary |
| inspected sample에 봄·여름·겨울 target이 있음 | `partial / bounded repeated` | 기존 `立春·驚蟄·清明·立夏` + 새 `大雪` | 계절 전체 corpus의 완전성 |
| observed named target이 traditional 12節 쪽 이름과 대응 | `bounded classification` | `立春·驚蟄·清明·立夏·大雪`의 전통적 명칭 분류 | source가 12節-only를 선언했다는 주장 |
| 모든 12節을 selector로 사용 | `unresolved; not admitted` | inspected sample은 5개 이름만 직접 확인 | 미관찰 `芒種·小暑·立秋·白露·寒露·立冬·小寒`의 자동 포함 |
| 中氣를 배제 | `source-local direct / global unresolved` | 새 page의 literal `中氣不論` | 《五行精紀》 및 전승 전체에 대한 배제 규칙 |
| 24節氣 전체를 selector로 사용 | `unresolved` | 전체 universe를 열거한 worked page 없음 | 현대 24節氣 API 규격 |
| exact astronomical instant/timezone/endpoint/rounding | `unresolved` | source는 날짜·시각과 source-local 산술만 제시 | 현대 계산 규격 |
| edition/textual lineage·semantic authority/readiness | `blocked` | 새 source는 별도 후대 문헌 page | production activation/interpretation readiness |

## 6. 현재 frontier에서 안전하게 말할 수 있는 것

현재 직접 확인된 문구 수준의 좁은 표현은 다음이다.

```text
for the inspected worked examples only:
  preserve the named 節/節候 target written by the source;
  forward examples visibly count toward a future named term;
  backward examples visibly count toward a past named term.

observed target names:
  立春, 驚蟄, 清明, 立夏, 大雪

observed seasonal coverage:
  spring, summer, winter

not established:
  all-12-節 selector
  exclusion of every 中氣
  inclusion of all 24 terms
  universal next/previous-term resolver
  exact astronomy/timezone/endpoint/rounding
  edition lineage, semantic authority, readiness, activation
```

특히 새 page의 `中氣不論`은 흥미로운 source-local 신호이지만, 기존 직접 witness들에서 동일한 경계가 반복되었다는 별도 검증 없이 global policy로 승격하지 않는다. 이번 successor의 frontier advance는 **새 계절의 직접 관찰 target `大雪`과 observed range의 겨울 확장**으로만 한정한다.

## 7. 재현과 보존 경계

다음 명령으로 같은 public derivative와 target page를 다시 확인할 수 있다.

```text
curl -L --fail --silent --show-error \
  -o /private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf \
  'https://upload.wikimedia.org/wikipedia/commons/c/c7/NLC416-13jh000981-42624_%E5%AD%90%E5%B9%B3%E5%91%BD%E8%A1%93%E8%A6%81%E8%A8%A3.pdf'
pdfinfo /private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf
pdftoppm -f 18 -l 18 -r 300 -jpeg \
  /private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf \
  /private/tmp/saju-term-review/NLC416-42624-target
shasum -a 256 /private/tmp/saju-term-review/NLC416-42624-ziping-mingshu.pdf
```

검증 대상은 PDF p.18 image와 visible printed page `十四`, `大雪節`, 앞뒤 counting 문장이다. OCR·search snippet·현대 설명은 직접 page observation을 대체하지 않는다. 원본/대용량 PDF와 rendered images는 `/private/tmp/saju-term-review/`의 검토 surface에만 두고 repository에 추가하지 않는다.

기존 `docs/saju-sonkeikaku-institution-access-audit-v1.md`, `docs/saju-wonkwang-copy-page-provenance-audit-v2.md`, `docs/saju-wonkwang-copy-page-provenance-audit-v3.md`, `docs/saju-wonkwang-institution-access-audit-v1.md` 및 기타 unrelated dirty work는 이 successor의 stage·수정·삭제 대상이 아니다.
