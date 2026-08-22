# 장서각 `K3-437` 《五行精紀》 卷33 page-level primary witness successor v1

상태: `bounded official record + official PDF + direct page observation`, `printed locator unresolved`, `edition/textual lineage unresolved`, `semantic authority/readiness/activation blocked`

기준일: `2026-08-22 KST`

이 문서는 한국학중앙연구원 장서각 소장 《五行精紀》 목판본의 공식 item identity에서 공식 `006책` PDF와 실제 `卷第三十三 / 大運` 면까지 닫힌 범위만 additive successor로 기록한다. 기존 K3/NLC 대조 dossier의 blocker와 원광대·연세대·NLC 관련 문서를 덮어쓰지 않는다.

## 1. Bounded result

```text
Jangseogak official record `JSG_K3-437`       = satisfied
catalog item identity `K3-437 / MF35-143~144`  = satisfied
record -> official `006책` PDF route           = satisfied
official PDF page count `134`                  = directly observed
PDF p.71 `五行精紀卷第三十三 / 大運`            = directly observed
PDF p.72 continuation and worked example       = directly observed
page-level primary witness status              = promoted-bounded
printed folio / leaf locator                   = unresolved
edition/textual lineage                        = unresolved
semantic authority                             = not_established
availableForInterpretation                     = false
productionActivation                           = blocked
```

이 successor가 승격하는 것은 `K3-437` 공식 record가 가리키는 공식-hosted page image에서 `卷第三十三 / 大運`이 보인다는 사실뿐이다. 이는 정본 선언, current-copy 연대 확정, 다른 witness와의 전승 관계 확정, semantic authority 또는 production readiness가 아니다.

## 2. Official record → official PDF route

| 단계 | first-party evidence | 직접 확인값 | 경계 |
| --- | --- | --- | --- |
| item record | [장서각 공식 record](https://jsg.aks.ac.kr/dir/view?dataId=JSG_K3-437) | 자료명 `오행정기(五行精紀)`, 저자 `요중(廖中)`, 청구기호 `K3-437`, MF `MF35-143~144`, 소장 `한국학중앙연구원 장서각` | catalog identity; printed leaf 자체는 아님 |
| bibliographic form | 같은 record의 기본정보/형태사항 | `목판본(木板本)`, `선장(線裝)`, `34권 6책` | `刊寫年未詳`; current copy의 정확한 연대·계보 아님 |
| image surface | record의 `MF이미지` 목록 | `001책`–`006책` 링크가 record 안에 존재 | 책 번호와 모든 卷의 물리적 분배를 별도 추정하지 않음 |
| selected volume | [공식 `K3-437_006.pdf`](https://jsg.aks.ac.kr/data/serviceFiles/pdf/K3-437_006.pdf) | `006책` PDF, viewer `71/134`·`72/134` | PDF page index는 printed folio가 아님 |

현재 live record에서 확인한 `006책` href는 다음과 같다.

```text
/data/serviceFiles/pdf/K3-437_006.pdf
```

기존 parent-verified artifact는 같은 official-hosted PDF를 `src.k3-437.pdf-006`으로 식별하고, PDF 134쪽 및 render 대상 pp.71–72를 보존한다. 이 successor는 대용량 PDF를 repository에 복사하지 않는다.

## 3. Direct page observation

공식 PDF viewer를 `#page=71`, `#page=72`로 열어 실제 page image를 직접 확인했다. 페이지 번호는 PDF viewer의 sequence이며, scan 안에서 확정 가능한 printed folio로 재명명하지 않는다.

| PDF page | 직접 보이는 범위 | 판정 |
| ---: | --- | --- |
| `71/134` | `五行精紀卷第三十三`, `大運` 및 `論大運` 문맥 | `卷33 / 大運` page-level observation satisfied |
| `72/134` | `譬如甲子陽男`, `是月二十九日申時立春`, `乃是一歲奇九月之大運`, `今人行運多用約法` 등 연속 본문 | 卷33 대상면의 continuation/worked-example observation satisfied |

직접 관찰된 문구는 이 locator에서의 visual fragments다. OCR·현대 구두점·후대 정규화로 canonical text를 만들지 않았고, 해당 문구만으로 semantic rule 전체를 확정하지 않는다.

안전한 locator는 다음으로 제한한다.

```text
institution/item = 한국학중앙연구원 장서각 / K3-437
digital object   = K3-437_006.pdf
page locator     = PDF pp.71–72
printed folio    = unresolved
```

특히 `PDF p.71`을 `printed page 71`, `葉次 71`, 또는 원광대 논문 표의 `卷33=71`로 쓰지 않는다.

## 4. Evidence and promotion ledger

| claim | evidence class | status | not implied |
| --- | --- | --- | --- |
| K3-437이 장서각 소장 《五行精紀》 record다 | first-party catalog | `satisfied` | exact copy date, complete ownership chain |
| K3-437이 목판본 34卷6冊으로 catalogued 됐다 | first-party catalog | `satisfied-as-catalogue-field` | catalog field를 physical colophon으로 대체하지 않음 |
| record가 `006책` official PDF를 제공한다 | first-party record/PDF route | `satisfied` | PDF page index와 printed locator의 동일성 |
| p.71에서 卷33 / 大運이 보인다 | direct official-hosted page observation | `promoted-bounded` | canonical edition, semantic authority |
| p.72에서 大運 worked-example continuation이 보인다 | direct official-hosted page observation | `promoted-bounded` | 전체 계산 규칙·implementation procedure |
| printed locator를 확정할 수 있다 | target-page visual evidence | `unresolved` | PDF page number의 printed-folio 대용 |
| edition/textual lineage를 닫을 수 있다 | record + two target pages | `unresolved` | preface date, title, heading, agreement만으로 lineage 확정 |
| interpretation/production에 사용할 수 있다 | readiness/activation gate | `blocked` | page presence만으로 semantic authority 승격 |

장서각 해제의 서문 연대·모본 관련 설명은 기관의 catalog/해제 서술로 보존할 수 있지만, 이번 target page에서 current copy의 colophon·소유권 chain·전승 edge를 직접 관찰한 것은 아니다. 따라서 lineage evidence로 승격하지 않는다.

## 5. NLC·연세대와의 비전이 대조

기존 bounded successors와의 관계는 다음처럼 분리한다.

| witness | 직접성 | 안전한 target locator | K3-437로 전이하지 않는 항목 |
| --- | --- | --- | --- |
| NLC `KOL000000585` 乙亥字本 | 기관 record + supplied scan page observation | KORCIS `卷33=99`; supplied PDF pp.102–103 boundary | KORCIS 99를 K3 printed folio로 전이, 동일 printing lineage |
| 연세대 `CATTOT000000200707` 乙亥字本 | catalog `卷31–34` + viewer `33/80` visual observation | viewer sequence `33/80`만 | exact item-page machine binding, raw bytes, printed locator |
| 장서각 `K3-437` | official record + official-hosted PDF pages | `K3-437_006.pdf` pp.71–72 | NLC/연세대와 같은 copy·recension·semantic authority |

세 witness에서 卷33/大運이 확인되는 것은 bounded cross-edition page correspondence다. 장서각은 catalog상 `木板本`, NLC·연세대는 `乙亥字` 계열로 표시되므로 동일 physical copy가 아니다. 그러나 이 label 차이만으로 각 판본의 선후·공통 모본·전승 계보를 결정하지 않는다.

기존 [K3-437 ↔ NLC 06857 v4 dossier](./saju-luna-deep-collation-adjudication-v4.md)의 본문 대조는 NLC `06857 / 411999013122 / 114503.0`라는 별도 `抄本` witness에 관한 것이다. 이를 NLC 乙亥字 `KOL000000585` 또는 연세대 乙亥字본의 lineage/semantic authority 근거로 재사용하지 않는다.

## 6. Existing artifact identity

기존 parent-verified artifact의 K3 source identity를 참조하되 payload를 이 문서에 복사하지 않는다.

| artifact field | recorded value |
| --- | --- |
| source id | `src.k3-437.pdf-006` |
| official PDF byte length | `14,116,437` |
| official PDF SHA-256 | `335a1c03c7af246969e00667d6a4d9756b19c19d93539223bb871c47001a24cd` |
| page count | `134` |
| rendered p.71 SHA-256 | `8a6d2876a333c26881a3b3407bf190099eb2abb58c7f90fab870e19973ce1d88` |
| rendered p.72 SHA-256 | `05c8db420995ff0845a80d21406aa40e146d58e0c0bf6b4ade229f93795365e8` |
| artifact | [complete.json](/Users/softie/Documents/softie_project/artifacts/saju-luna-deep-collation-adjudication-v4/complete.json) |

이 hash는 기존 artifact가 보존한 official PDF/render identity다. 이 successor는 원본 PDF를 새로 repository에 저장하거나, hash만으로 printed locator·lineage·semantic authority를 추론하지 않는다.

## 7. Validation and scope preservation

이번 successor에서 실행하거나 재확인한 검증:

- 공식 장서각 record DOM: `K3-437`, `MF35-143~144`, `목판본`, `34권 6책`, `006책` PDF link 확인.
- 공식 PDF viewer: `71/134`와 `72/134`를 열어 `五行精紀卷第三十三 / 大運` 및 continuation을 직접 관찰.
- 기존 K3 parent artifact: source identity, page count, p.71/p.72 render identity를 대조.
- 문서 전용 변경에 대해 `git diff --check` 실행.
- 변경 전후 `git -c core.fsmonitor=false status --short --branch`로 unrelated dirty work 보존 여부 확인.

다음은 이 문서의 범위를 넘으므로 실행하지 않는다.

- OCR을 canonical text 또는 variant 판정으로 사용.
- printed folio/葉次를 PDF page에서 추정.
- 장서각·NLC·연세대 사이의 edition/textual lineage를 추론.
- semantic authority, interpretation readiness, implementation grounding, production activation을 열기.
- `/Users/softie/Downloads/KOL000000585.pdf` 등 대용량 원본을 이동·복사·재출력.
- 기존 tracked/untracked dirty work, 기존 audit 문서, 코드·fixture를 수정.

이 successor는 page-level primary observation만 additive하게 닫는다. `printed locator`, `edition/textual lineage`, `semantic authority`, `availableForInterpretation`, `productionActivation`은 계속 각각 `unresolved` 또는 `blocked`다.
