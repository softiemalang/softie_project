# 起運 `刻·分` 정밀 시각과 `時/時辰` endpoint bounded contrast successor v1

상태: `new direct worked-example surface`, `fine residual preserved in source`, `fine→coarse normalization not repeated`, `modern rounding/timezone/API/readiness blocked`

기준일: `2026-08-26 KST`

이 문서는 기존 NLC 《子平命術要訣》의 `亥正一刻八分 → 亥時` 사례를 덮어쓰지 않고, Harvard 공식 IIIF 원면의 별도 worked-example set을 additive하게 기록한다. 두 문헌은 제목·기관·page surface가 다르지만, 이것만으로 textual independence·공통 저본·직접 계보를 주장하지 않는다.

## 1. Bounded conclusion

Harvard 《三才發秘》 `起大運訣` 원면에서 다음 두 층이 한 page image 안에 함께 직접 보인다.

```text
target time labels:  大雪 ... 巳初二刻
                    小寒 ... 酉正二刻

worked differences:  順推 ... 三日零九時二刻
                    逆推 ... 二十五日四時六刻
```

따라서 새 surface가 직접 지지하는 가장 좁은 판정은 다음이다.

> 이 문헌의 해당 worked example에서는 節까지의 raw difference가 `日 + 時 + 刻` 혼합 단위로 보존된다. 정밀한 `刻` 표기를 계산에서 자동으로 버리고 `時/時辰`만 남긴다는 규칙은 반복되지 않는다.

기존 NLC 사례의 `亥正一刻八分交大雪節`과 계산문 `至十一月初二日亥時`는 여전히 **한 직접 사례의 fine→coarse 대응**이다. 새 《三才發秘》 사례는 그 대응을 반복하지 않고 residual `刻`을 남긴다. 그러므로 현재 frontier는 “보편 절삭·반올림”이 아니라 **문헌별 source-native precision이 raw result에 그대로 나타날 수 있음**까지로만 좁힌다.

## 2. Harvard item·page provenance

| 항목 | 직접 확인값 | 역할과 경계 |
| --- | --- | --- |
| 공식 manifest | [Harvard IIIF manifest](https://nrs.harvard.edu/URN-3:FHCL:23921260:MANIFEST:3) | manifest title `陳雯. 三才發秘 :. [China : s.n., 1697?].`, repository `Harvard College Library Harvard-Yenching Library` |
| catalog | [HOLLIS 008088435](https://id.lib.harvard.edu/aleph/008088435/catalog) | 기관·item bibliographic identity; 정확한 제작연대·최초성으로 확장하지 않음 |
| canvas | `seq.547`, `canvas-drs:52823058` | 공식 manifest의 page-level locator; printed folio/page는 확인하지 않음 |
| image | [official IIIF image](https://mps.lib.harvard.edu/assets/images/drs:52823058/full/full/0/default.jpg) | actual page image surface |
| retrieved image | `3633 × 3117`, SHA-256 `fde34f08ed221104bc91005990290dbcbf14bb31ddc12f0e40a9ccf7885b7805` | 이 retrieval derivative의 byte identity; physical leaf raw bytes·machine binding은 아님 |
| retrieved manifest | SHA-256 `9c314cd33ca02bd14f38cf415bbd3dd7d5ae815527c1c368cb367bb8dded0081` | dynamic manifest retrieval anchor; image hash와 혼동하지 않음 |

실제 page image에서 `起大運訣` heading과 worked-example columns를 육안 확인했다. 이미지·manifest만 repository에 복사하지 않았으며, 검토용 derivative는 `/private/tmp/saju-term-review/`에만 보존했다.

## 3. Direct visual observation

원면에서 읽히는 핵심 sequence는 다음과 같다. 전사는 page-bounded reading이며 canonical rekeying이 아니다.

```text
其法止論節不論中氣
...
數至未來交節時刻止
...
壬申年十一月二十五 ... 正子時生
其年大雪乃十月二十九日巳初二刻
小寒乃十一月二十八日酉正二刻
如順推，差三日零九時二刻
...
如逆推，差二十五日四時六刻
```

같은 page의 환산 문장에는 `一刻五分` 계열 표기도 보인다. 그러나 target 자체에서 직접 확인된 정밀 표지는 `巳初二刻`·`酉正二刻`이며, target의 `分`까지 이 page가 명시한다고 읽지 않는다. 따라서 이 surface를 `刻` target과 `刻五分` 환산 표현이 있는 page로 기록하되, `刻·分`을 현대 분 단위로 정규화하지 않는다.

## 4. Existing witness와의 bounded comparison

| surface | target 표기 | 실제 계산 endpoint/result | 판정 |
| --- | --- | --- | --- |
| NLC 《子平命術要訣》 p.18, printed `十四` | `亥正一刻八分交大雪節` | `至十一月初二日亥時`, `十四日零三時` | fine→coarse 대응은 direct single-example; 일반 절삭 규칙 아님 |
| Harvard 《三才發秘》 seq.547 | `巳初二刻`, `酉正二刻` | `三日零九時二刻`, `二十五日四時六刻` | residual `刻` 보존; coarse-only 결과 아님 |
| 《五行精紀》 卷33 direct set | `二十九日申時立春` | `五日三時`, `六十三時` | source가 처음부터 `時`만 표기한 사례; fine→coarse 변환 관찰 아님 |

새 Harvard surface는 NLC 사례와 같은 `大運` 계산 문맥을 보강하지만, 두 사례의 문구·계보·공통 저본을 자동 연결하지 않는다.

## 5. Claim adjudication

| claim | status | 직접 근거 | 승격하지 않은 범위 |
| --- | --- | --- | --- |
| 별도 제목·기관의 worked-example surface 확보 | `direct` | Harvard official manifest/canvas/image | textual independence·lineage |
| 節 target이 `刻` 단위로 표기됨 | `direct, source-local` | `巳初二刻`, `酉正二刻` | `刻`의 현대 분 단위 환산 |
| 계산 결과가 `時 + 刻` 혼합 단위를 보존함 | `direct, source-local; same page has forward/reverse repetition` | `三日零九時二刻`, `二十五日四時六刻` | 모든 문헌·모든 endpoint의 universal precision |
| `亥正一刻八分`을 항상 `亥時`로 절삭함 | `unresolved / not admitted` | 기존 NLC direct example은 1건; Harvard example은 `刻` 보존 | floor/ceil/nearest, enclosing-block projection, rounding |
| `一刻五分`의 현대 minute semantics | `unresolved` | page-local literal only | 15분·표준시·timezone·API 변환 |
| exact endpoint inclusion/exclusion | `unresolved` | `交節時刻止` 및 mixed result wording | 현대 half-open interval·동일시각 처리 |
| semantic authority/readiness/production activation | `blocked` | source evidence와 계산 규격을 분리 | interpretation 또는 runtime activation |

## 6. Frontier decision

실제 advance는 **독립 page-level worked example에서 fine residual `刻`이 계산 결과에 보존되는 반대 사례를 추가한 것**이다. 하지만 `刻·分 → 時/時辰` fine→coarse 처리가 두 독립 worked example에서 반복된 것은 아니다.

따라서 이번 successor에서 안전하게 승격하는 문장은 다음 하나다.

```text
inspected classical worked examples may preserve source-native sub-時 residuals
in the raw difference; precision reduction to 時/時辰 is not a corpus-wide rule.
```

다음 승격에는 별도 제목·item의 actual page에서 `刻/分`이 target에 직접 적히고, 같은 worked calculation이 residual 없이 `時/時辰`만 보고하는 두 번째 fine→coarse 사례가 필요하다. 그 전에는 현대 rounding·timezone·API·readiness를 추가하지 않는다.

## 7. Reproducibility

```text
curl -L --fail --silent --show-error \
  -o /private/tmp/saju-term-review/harvard-sancai-seq547-full.jpg \
  'https://mps.lib.harvard.edu/assets/images/drs:52823058/full/full/0/default.jpg'
shasum -a 256 /private/tmp/saju-term-review/harvard-sancai-seq547-full.jpg
```

검증 대상은 `seq.547 / DRS 52823058` image의 `起大運訣` page surface다. 검색 결과·OCR mirror는 locator 보조로만 사용하며, 이 문서의 direct observation은 Harvard official IIIF image에 한정한다.
