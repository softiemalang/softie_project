# 月柱 birth-level 節 경계 paired witness successor v1

상태: `frontier advanced: 清明 same-date adjacent-時辰 pair direct at page level`; `dated internal surface direct`; `publication date·institutional copy binding·lineage·semantic authority·readiness blocked`

기준일: `2026-08-27 KST`

이 문서는 기존 [月柱 source-local frontier](./saju-month-pillar-source-local-frontier-successor-v2.md)와 [worked-example frontier](./saju-month-pillar-worked-example-frontier-successor-v3.md)에 additive하게 붙는다. 기존 evidence를 하향하거나 덮어쓰지 않는다. 이번 문서의 범위는 **月柱를 출생 시점의 이름 붙은 節 전후로 다르게 배정한 page-level worked example**이다. 起運의 target 節 사례는 이 claim에 합산하지 않는다.

## 1. Bounded conclusion

이번에 직접 닫힌 것은 다음 source-local 대응이다.

```text
같은 날짜 표기: 癸卯年三月初九日
  卯時生, 辰時清明 전       → 癸卯年 乙卯月
  辰時生, 辰時清明 후       → 癸卯年 丙辰月
```

두 면은 `三月初九日`이라는 같은 날짜 표기와 인접한 coarse `時辰`을 유지하면서, source가 `清明`을 넘었는지에 따라 月柱를 `乙卯`에서 `丙辰`으로 바꾼다. 이는 `清明`이 실제 birth-level 月界 worked pair로 직접 관찰된다는 좁은 advance다.

다만 `辰時清明`이라는 표현은 정밀한 분·초나 천문 event instant를 제공하지 않는다. `辰時生` 면에서 source가 `已交清明`이라고 판정한 사실만 보존하며, 현대의 equality endpoint나 `<`/`<=` 연산으로 재규격화하지 않는다.

같은 source에는 `丑時已交小寒`에서 `乙丑月`로 가는 one-sided example도 보인다. 이는 다른 節 이름의 추가 direct surface이지만, `小寒`의 paired before/after 증거는 아니다.

## 2. Source and locator boundary

### 2.1 NLC-attributed public scan A

- 제목 표면: `韋千里命學講義`
- public filename/item-like identifier: `NLC416-01jh000368-10155`
- [public scan PDF, p.13](https://upload.wikimedia.org/wikipedia/commons/c/c5/NLC416-01jh000368-10155_%E9%9F%8B%E5%8D%83%E9%87%8C%E5%91%BD%E5%AD%B8%E8%AC%9B%E7%BE%A9.pdf#page=13)
- [public scan PDF, p.23](https://upload.wikimedia.org/wikipedia/commons/c/c5/NLC416-01jh000368-10155_%E9%9F%8B%E5%8D%83%E9%87%8C%E5%91%BD%E5%AD%B8%E8%AC%9B%E7%BE%A9.pdf#page=23)
- [public scan PDF, p.24](https://upload.wikimedia.org/wikipedia/commons/c/c5/NLC416-01jh000368-10155_%E9%9F%8B%E5%8D%83%E9%87%8C%E5%91%BD%E5%AD%B8%E8%AC%9B%E7%BE%A9.pdf#page=24)
- local review bytes: `/private/tmp/month-pillar-term-boundary.YoAiGj/weili-qianli.pdf`
- local SHA-256: `7b34ea70ffdfbf9207a4516a42f5eb5b7008649ce95be1bf07601a1fb299daeb`

PDF p.13의 서문 표면에는 다음 날짜 표기가 있다.

```text
民國甲戌秋日浙江嘉興韋千里謹識於滬江寓次
```

`甲戌`은 통상 1934년으로 대응되지만, 여기서 승격되는 것은 **내부 서문의 dated textual surface**뿐이다. 이는 확인된 출판연도, 초판연도, 또는 해당 page image의 기관 원본 byte 연대가 아니다.

PDF p.23–24(인쇄면 표지 `八–九`)에서 다음을 직접 읽었다.

```text
癸卯年三月初九日卯時生
……辰時清明……卯時在辰時之前，猶未清明（即未進三月節）……
癸卯（年）乙卯（月）
```

이어지는 p.24의 인접 worked block에는 다음이 보인다.

```text
癸卯年三月初九日辰時生
……辰時已交清明（即已交三月節）……
癸卯（年）丙辰（月）
```

같은 p.24의 별도 one-sided block은 다음 범위다.

```text
癸卯年十一月二十日丑時生
丑時已交小寒
癸卯（年）乙丑（月）
```

여기서 `清明`과 `小寒`을 source가 각각 `三月節`·monthly 節의 이름으로 취급하는 점은 literal observation으로 남긴다. 전통적인 24節氣 분류를 모든 witness의 formal selector 규칙으로 확장하지 않는다.

### 2.2 NLC-attributed public scan B

- 제목 표면: `韋千里命學講義`
- public filename/item-like identifier: `NLC416-17jh007058-102955`
- [public scan PDF, p.24](https://upload.wikimedia.org/wikipedia/commons/5/53/NLC416-17jh007058-102955_%E9%9F%8B%E5%8D%83%E9%87%8C%E5%91%BD%E5%AD%B8%E8%AC%9B%E7%BE%A9.pdf#page=24)
- [public scan PDF, p.25](https://upload.wikimedia.org/wikipedia/commons/5/53/NLC416-17jh007058-102955_%E9%9F%8B%E5%8D%83%E9%87%8C%E5%91%BD%E5%AD%B8%E8%AC%9B%E7%BE%A9.pdf#page=25)
- local review bytes: `/private/tmp/month-pillar-term-boundary-alt.TTWrR9/weili-qianli-alt.pdf`
- local SHA-256: `c077359f04f19dff57e664bc560a2b15a762f373ff5d824afe9850ebf3e559b9`

PDF p.24–25에서 `癸卯年三月初九日辰時生`–`清明`–`丙辰月` block과 인접 `小寒` block이 반복되어 page-reading corroboration을 제공한다. 그러나 이 scan이 A와 동일 physical copy인지, 같은 edition/recension인지, 독립 witness인지 이 audit에서 닫지 않았다. 따라서 B는 **문자·배열 관찰의 보조 반복**으로만 세며 independent-copy count나 lineage 증거로 세지 않는다.

온라인 전사 [千里命稿](https://sanqing.com.tw/en/%E5%8D%83%E9%87%8C%E5%91%BD%E7%A8%BF/)는 같은 `清明` 두 block을 보조적으로 재현하지만, scan의 physical page를 대체하지 않는다. `韋千里命學講義`와 `千里命稿`의 서지·전승 관계도 여기서 확정하지 않는다.

## 3. Evidence adjudication

| claim | status | 직접 확인된 범위 | 남은 경계 |
|---|---|---|---|
| 같은 `三月初九日` 표기의 `卯時`와 `辰時` 사례가 있음 | `direct` | scan A pp.23–24의 worked blocks | 역사적 실제 출생 기록인지 아님 |
| `卯時`는 `辰時清明` 전으로 처리됨 | `direct, source-local` | `猶未清明`·`未進三月節`와 `乙卯月` | 정밀 event instant·endpoint |
| `辰時`는 `已交清明`으로 처리됨 | `direct, source-local` | `已交清明`·`已交三月節`와 `丙辰月` | 현대 `<`/`<=`, 분·초·timezone |
| `乙卯→丙辰` Month Pillar switch | `direct` | 같은 날짜 표기와 인접 時辰의 출력 차이 | 보편 생성기·모든 월령 |
| `小寒` one-sided 月柱 example | `direct` | `丑時已交小寒`·`乙丑月` | paired boundary·selector universe |
| scan B의 같은 wording/page pattern | `partial corroboration` | public page-level visual repeat | A/B physical-copy independence·edition relation |
| `民國甲戌秋日` | `direct dated internal surface` | scan A p.13 서문 | publication date·초판 date·institutional provenance |
| 12 monthly 節만을 보편적으로 선택 | `unresolved` | 이 source에서 `清明`·`小寒`이 節로 직접 표기됨 | 전체 12節 coverage·다른 문헌·中氣 배제 |
| edition/textual lineage·공통 저본·선후 | `unresolved` | textual correspondence만 관찰 | 특정 계보·독립성·정본성 |
| semantic authority·interpretation readiness·production activation | `blocked` | 해당 없음 | direct authority/readiness gate 미충족 |

## 4. Existing frontier와의 관계

- 기존 문서에서 직접 닫힌 `立春` 관련 Month Pillar 사례와 `節` 중심 source-local 표면은 그대로 유지한다.
- 이번 문서는 `立春`을 재검증해 보편화하는 문서가 아니라, 다른 월령의 `清明`에 대해 **동일 날짜·인접 時辰·상이한 月柱 출력**을 하나의 page-level pair로 추가한다.
- 기존 `立夏·清明` 자료가 起運 target을 다루는 경우에는 이 月柱 frontier에 합산하지 않는다. operation이 다르므로 동일한 birth-level 月界 증거로 전이하지 않는다.
- 이 결과는 `清明` 사례의 source-local birth-level adjudication을 강화하지만, `驚蟄·立夏·芒種` 등 모든 節의 paired coverage를 닫지 않는다.

## 5. Non-claims and blockers

다음은 이번 successor에서 승격하지 않는다.

1. `民國甲戌`을 출판연도·초판연도·현존 scan의 물리적 제작연도로 확정하지 않는다.
2. public derivative PDF를 NLC 기관 보존 원본과 raw-byte identical하다고 말하지 않는다. exact machine binding과 derivation chain은 unresolved다.
3. scan A/B를 서로 독립된 physical witness로 세지 않는다. 동일 edition, 후대 전사, 공통 저본, 단순 중복 업로드 가능성을 분리하지 못했다.
4. 두 worked block의 textual correspondence를 실제 역사 인물의 출생 명례나 문헌 간 직접 계보로 바꾸지 않는다. 이는 source가 구성한 계산 example의 관찰이다.
5. `辰時清明`을 정확한 event equality로 읽지 않으며, `辰時已交`을 현대 endpoint·timezone·rounding 규칙으로 번역하지 않는다.
6. 이 source의 `清明`·`小寒` 표면을 근거로 12節-only, `中氣` 배제, 현대 절기 API, 계산 규격, semantic authority 또는 readiness를 승인하지 않는다.

## 6. 재현 경로와 atomic Git 범위

검토에 사용한 두 PDF는 repository에 복사하지 않았다. local review bytes와 대용량 원본은 그대로 두며, 이 문서의 hash는 현재 review 파일을 식별하는 값이지 기관 원본의 canonical hash가 아니다. 필요하면 다음처럼 지정 면을 다시 렌더링할 수 있다.

```bash
pdftoppm -f 13 -l 13 -r 300 -png \
  /private/tmp/month-pillar-term-boundary.YoAiGj/weili-qianli.pdf \
  /private/tmp/current-witness-review/weili-preface-p13
pdftoppm -f 23 -l 24 -r 300 -png \
  /private/tmp/month-pillar-term-boundary.YoAiGj/weili-qianli.pdf \
  /private/tmp/current-witness-review/weili-qianli-p
pdftoppm -f 24 -l 25 -r 300 -png \
  /private/tmp/month-pillar-term-boundary-alt.TTWrR9/weili-qianli-alt.pdf \
  /private/tmp/current-witness-review/weili-qianli-alt-p
```

이번 atomic change allowlist는 이 파일 하나다.

```text
docs/saju-month-pillar-jie-boundary-paired-successor-v1.md
```

현재 working tree의 design/scheduler tracked 수정 3개와 Wonkwang·Sonkeik 관련 untracked 연구 문서 4개는 stage·수정·삭제하지 않는다.

## 7. Frontier snapshot

```text
清明 same-date adjacent-時辰 pair       direct, page-level, source-local
乙卯月 → 丙辰月 switch                  direct in the pair
小寒 one-sided output                   direct, paired status unresolved
民國甲戌 internal dated surface         direct, publication date unresolved
scan B repetition                       partial corroboration, not independence
12節-wide selector / 中氣 exclusion     unresolved
physical copy/raw-byte/machine binding  unresolved
edition/textual lineage                 unresolved
semantic authority/readiness/activation  blocked
```
