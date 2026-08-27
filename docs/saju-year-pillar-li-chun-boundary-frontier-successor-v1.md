# 年柱–立春 operational rule의 1915 dated frontier bounded successor v1

상태: `frontier advanced: earliest-confirmed exact page-level witness in the inspected corpus = 1915`; `pre-1915 exact rule not confirmed`; `firstness·lineage·semantic authority·readiness blocked`

기준일: `2026-08-27 KST`

이 문서는 1915년보다 이른 문헌을 무기한 추적하는 대신, 현재 확인된 **새 dated exact frontier**와 그 이전의 **명확한 evidence boundary**를 additive하게 고정한다. 기존 Saju source-evidence 문서를 덮어쓰지 않으며, 1915년 전의 부분적인 입춘·節 selector 문맥을 年柱 교체 규칙으로 소급하지 않는다.

## 1. Bounded conclusion

현재 inspected corpus에서 `以立春節為綱` 또는 그와 동등한 다음 operational sequence를 실제 page image에서 직접 확인할 수 있는 가장 이른 dated witness는 국립중앙도서관 record가 `1915`로 표시하는 《新命理探原》이다.

```text
birth year ganzhi is the basis;
立春節 is the organizing boundary;
正月立春後生  -> 本年干枝
正月立春前生  -> 上一年干枝
十二月立春後生 -> 下一年干枝
```

이 문장은 공개 scan의 digital p.70, printed `三八`에서 직접 확인된다. p.69(printed `三七`)는 `起例` 도입과 앞 문맥이며, complete rule의 locator로 사용하지 않는다.

따라서 이번 successor의 실질적 delta는 다음 두 가지다.

1. **exact operational 年柱–立春 rule:** 현재 확인 corpus에서 1915년 p.70/printed `三八`으로 닫힘.
2. **pre-1915 boundary:** 1578년 《三命通會》의 `立春` 계절·氣候/起運 문맥과 명 만력본 《刻京臺增補淵海子平大全》의 `論節不論氣`는 더 이른 직접 자료이지만, 출생 전후에 年干支를 교체하는 규칙은 아니다.

이는 1915년이 역사상 최초라는 주장이 아니다. 정확한 표현은 **현재 직접 확인·대조한 corpus에서의 earliest-confirmed witness**다.

## 2. Direct evidence inventory

| surface | record / locator | 직접 확인한 범위 | 역할과 한계 |
|---|---|---|---|
| 《新命理探原》 | [NCL official record](https://taiwanebook.ncl.edu.tw/en/book/NCL-000002203), `袁樹珊撰`, `1915`, accession `000002203` | 공개 derivative PDF p.70, printed `三八`; `推年法` 아래 `以立春節為綱`과 세 가지 年干枝 배정 | exact operational witness; derivative raw bytes와 기관 원본의 machine binding은 미확정 |
| 《三命通會》 | [1578 NCL scan record](https://commons.wikimedia.org/wiki/File%3ANCL-06589_1_%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.pdf), 기존 official-viewer adjudication | viewer p.150–151의 `論大運`, `節氣`, `立春` 및 환산 문맥 | pre-1915 seasonal/起運 boundary evidence; 年柱 교체 문장은 해당 inspected window에서 미확인 |
| 《刻京臺增補淵海子平大全》 | [NCL-attributed scan](https://commons.wikimedia.org/wiki/File:NCL-06593_%E5%88%BB%E4%BA%AC%E8%87%BA%E5%A2%9E%E8%A3%9C%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3%E5%A4%A7%E5%85%A8.pdf) | metadata-dated 1600, PDF p.4의 `論起大運法`·`其法論節不論氣` | broad 節/氣 contrast for 起運; `不論氣`를 年柱 rule이나 `不論中氣`로 교정하지 않음 |
| 《淵海子平》 전래문 | [〈論四季大節訣〉 transcription](https://sajumania.com/ebook/to01-06/to01-06-01-62.htm) | `年年以立春為主，餘皆例此`라는 문구 | textual lead only; dated institutional page-level witness와 exact 年柱 assignment가 없어 승격하지 않음 |
| 《漢書》 calendrical layer | [卷26 text](https://deltoi.com/zh/twenty-four-histories/hanshu/chapter-26) | `正月旦，王者歲首；立春，四時之始也` | 歲首/seasonal distinction의 역사적 배경; Saju 年柱 operational rule이 아님 |

## 3. 1915년 exact page observation

### 3.1 Record와 derivative identity

공식 record는 다음을 표시한다.

```text
title       新命理探原
author      袁樹珊撰
publisher   潤德
year        1915
accession   000002203
holder      國家圖書館
```

직접 검토한 공개 PDF는 [이 scan](https://upload.wikimedia.org/wikipedia/commons/4/4a/NCL-000002203_%E6%96%B0%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf)이며, 현재 local review derivative의 identity는 다음과 같다.

```text
local path  /private/tmp/ncl-000002203-new-mingli-tanyuan.pdf
pages       486
bytes       58287949
sha256      3dfee4ef4636d48c2d2e749f90408a825e0eacee99b8c73b9748a03deb73dcfd
```

공식 record의 page count `487`와 downloaded derivative의 `486`은 디지털 extent discrepancy로 그대로 보존한다. 이 hash는 공개 derivative의 local byte identity이며, 기관 보존 원본의 raw-byte identity나 exact machine binding이 아니다.

### 3.2 p.70 / printed `三八`

직접 원면에서 안정적으로 읽히는 핵심 문장은 다음과 같다.

```text
推年之法、視人所值生年之幹枝為主。而以立春節為綱、其區別有三。
如在本年正月立春後生者、即以本年之幹枝為主。
在本年正月立春前生者、即以上一年之幹枝為主。
在本年十二月立春後生者、即以下一年幹枝為主。
```

이 page는 단순히 `立春`을 계절의 표지로 언급하는 수준을 넘어, `生年之幹枝`를 무엇으로 정할지에 대한 세 가지 배정 절차를 직접 제시한다. 따라서 다음 claim을 source-local direct로 기록한다.

| claim | status | 직접 근거 | 제한 |
|---|---|---|---|
| 年干枝를 年柱 산출의 basis로 삼음 | `direct` | `視人所值生年之幹枝為主` | 저자 의도·전 문헌의 정본성으로 확장하지 않음 |
| 立春節을 年干枝 구분의 기준으로 삼음 | `direct` | `而以立春節為綱` | 현대 절기 instant·timezone으로 변환하지 않음 |
| 正月立春後는 本年干枝 | `direct, source-local` | 해당 worked rule 문장 | 모든 문헌의 보편 규칙으로 전이하지 않음 |
| 正月立春前는 上一年干枝 | `direct, source-local` | 해당 worked rule 문장 | 다른 판본·시대의 동일성 미확정 |
| 十二月立春後는 下一年干枝 | `direct, source-local` | 해당 worked rule 문장 | `立春`의 달력상 위치·현대 연도 계산으로 일반화하지 않음 |

## 4. Pre-1915 evidence boundary

### 4.1 1578 《三命通會》

기존 NCL official-viewer adjudication에서 record는 《三命通會十二卷》, `(明)萬民英(撰)`, `明萬曆戊寅(六年, 1578)刊本`으로 식별되며, viewer p.150–151의 `論大運` page surface에는 `折除以三日為年`, future/past `節氣`, 순·역행 및 `立春` worked context가 직접 관찰되어 있다. [기존 bounded artifact](../artifacts/saju-sanming-1578-official-viewer-adjudication-v1/complete.json)

이는 1915년보다 이른 `立春`·`節氣`의 source-local 사용을 직접 보강한다. 그러나 해당 inspected window에서 다음 문장은 확인되지 않았다.

```text
以立春節為綱
正月立春前/後 -> 上一年/本年干枝
十二月立春後 -> 下一年干枝
```

이 negative observation은 p.150–151의 window에만 적용한다. 《三命通會》 전권 또는 1578 item 전체에 해당 규칙이 없다는 뜻으로 확대하지 않는다.

### 4.2 명 만력본 《刻京臺增補淵海子平大全》

NCL-attributed scan의 PDF p.4에는 `○論起大運法`과 `其法論節不論氣`가 직접 보인다. 이는 `節`과 `氣`를 대조하는 起運 문장이지, 年柱의 年干支 교체 문장이 아니다. 따라서 다음처럼 보존한다.

```text
1600 broad 節/氣 contrast in 起運       = direct page observation
1600 年柱 switch by birth before/after 立春 = not confirmed
1600 `不論氣` = `不論中氣`              = not promoted
```

### 4.3 《淵海子平》 `年年以立春為主`

전래문에는 `年年以立春為主，餘皆例此`가 보이지만, 현재 확보된 것은 web transcription/locator lead다. 이 문장이 실제로 어느 판본·어느 면의 年柱 operational rule인지, 뒤 문맥이 출생 전후의 年干枝 배정까지 닫는지는 기관 record와 원면으로 확인하지 못했다. 그러므로 1915년 exact frontier를 앞당기는 증거로 사용하지 않는다.

### 4.4 歲首와 立春의 calendrical layer

《漢書》의 `正月旦，王者歲首；立春，四時之始也`는 정치·역법상의 歲首와 계절 시작을 구분하는 오래된 문맥이다. 그러나 이것은 Saju의 年柱에 대한 출생일 operational assignment가 아니므로, 1915년 rule의 직접 선행 witness로 세지 않는다.

## 5. Frontier matrix

| proposition | status | 현재 허용되는 표현 | 승격하지 않는 것 |
|---|---|---|---|
| `以立春節為綱`이 실제 page에 나타남 | `direct` | 《新命理探原》 p.70 / printed `三八` | 역사상 최초라는 주장 |
| 입춘 전후에 年干枝를 바꾸는 세 경우 | `direct, source-local` | 正月後=本年, 正月前=上一年, 十二月後=下一年 | 모든 시대·문헌의 보편 규칙 |
| 1915가 current checked corpus의 earliest exact witness | `bounded dated frontier` | official record `1915` + page image p.70 | composition date·초출연대의 동일시 |
| 1578 《三命通會》가 입춘을 사용함 | `direct, non-equivalent` | 節氣/立春의 起運·seasonal context | 年柱 switch로 전이 |
| 1600 `其法論節不論氣`가 年柱 rule과 동일함 | `unresolved / not equivalent` | 起運의 broad 節/氣 contrast로만 기록 | `不論氣`→`不論中氣` 또는 年柱 배정 |
| 《淵海子平》 `年年以立春為主`가 exact 年柱 rule임 | `candidate only` | textual lead로 보존 | dated page-level direct evidence |
| 1915 이전 exact operational witness가 없음 | `not confirmed in inspected corpus` | 확인된 자료 범위의 boundary | 전권·전승 전체의 부재 주장 |
| 특정 문헌 간 직접 계보·공통 저본·판본 선후 | `blocked` | 없음 | 문구 유사성·연대 순서에 의한 lineage |
| 정본성·원작자 의도·semantic authority | `blocked` | 없음 | 1915 page observation에서 추론 |
| 현대 절기 API·천문시각·timezone·endpoint·rounding | `blocked` | 없음 | 역사 문면의 현대 계산 규격화 |
| interpretation readiness·production activation | `blocked` | 없음 | source-local direct claim에서 승격 |

## 6. Reproduction and preservation

1915 page observation은 다음 경로로 재현할 수 있다.

```sh
curl -L --fail --silent --show-error \
  -o /private/tmp/ncl-000002203-new-mingli-tanyuan.pdf \
  'https://upload.wikimedia.org/wikipedia/commons/4/4a/NCL-000002203_%E6%96%B0%E5%91%BD%E7%90%86%E6%8E%A2%E5%8E%9F.pdf'
pdfinfo /private/tmp/ncl-000002203-new-mingli-tanyuan.pdf
pdftoppm -f 70 -l 70 -r 300 -jpeg \
  /private/tmp/ncl-000002203-new-mingli-tanyuan.pdf \
  /private/tmp/year-boundary-p70
shasum -a 256 /private/tmp/ncl-000002203-new-mingli-tanyuan.pdf
```

검증 대상은 digital p.70의 page image, printed `三八`, `推年法` heading, `以立春節為綱` 및 세 배정 문장이다. PDF·rendered image는 repository에 넣지 않으며, 기존 대용량 원본·기존 source artifacts·unrelated dirty work를 수정·삭제하지 않는다.

이 successor가 새로 고정하는 것은 다음뿐이다.

```text
exact_立春_year_ganzhi_switch = 1915 catalog-dated witness, digital p.70 / printed 三八
pre_1915_exact_rule            = not confirmed in checked page windows
pre_1915_li_chun_context       = direct but non-equivalent at 1578/1600 surfaces
printed_locator_in_derivative  = observed (`三八`); institutional byte binding unresolved
edition_lineage                = unresolved
semantic_authority/readiness   = blocked
```
