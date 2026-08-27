# 年·月·日 경계 병렬 모델의 source-local primary successor v1

상태: `frontier advanced: 공식 Harvard page image가 冬至年界–立春月界–子時日界 모델을 직접 닫음`; `후기 立春年·月–子夜日 모델 병렬 유지`; `계보·전환·정본성·semantic authority·readiness blocked`

기준일: `2026-08-27 KST`

이 문서는 기존 [1915년 立春 年柱 frontier](./saju-year-pillar-li-chun-boundary-frontier-successor-v1.md)와 [子時 日界 direct successor](./saju-zi-day-boundary-direct-witness-successor-v1.md)를 낮추거나 덮어쓰지 않는 additive successor다. 새로 직접 확인된 것은 하나의 문헌에서 보이는 **별도 source-local 경계 조합**이며, 이를 문헌 간 역사적 전환이나 특정 계보로 해석하지 않는다.

## 1. Bounded conclusion

Harvard College Library의 공식 IIIF 원면에서 《三才發秘》의 연속된 `seq.540–541` 이미지를 직접 대조했다. catalog title/date는 `陳雯. 三才發秘. [China : s.n., 1697?]`로 표시되며, `1697?`는 catalog estimate일 뿐 정확한 편찬·간행·최초 시점을 뜻하지 않는다.

두 원면에서 다음 세 경계가 하나의 source-local 설명 체계로 직접 나타난다.

```text
年界: 立歲之干支，一交冬至，刻分則屬明年
月界: 交立春節，方易正月干支；交驚蟄節，方易二月干支
日界: 子時前四刻尚屬去日；交後四刻，方屬今日
```

따라서 현재 승격 가능한 최소 명제는 다음이다.

> 《三才發秘》의 해당 원면은 `冬至年界–立春/驚蟄月界–子時 내부 日界`를 직접 서술한다. 이는 후기 Saju 원면에서 직접 확인된 `立春年·月–夜子/正子 日·時` 계열과 병렬로 보존할 수 있지만, 어느 쪽이 다른 쪽으로 바뀌었다거나 특정 공통 저본을 공유한다는 역사 서사는 현재 닫히지 않는다.

이 문서의 `年界·月界·日界`는 source 문면의 기능적 구분을 요약한 이름이다. 현대의 年柱·月柱·日柱 산출기, 천문시각, timezone, endpoint, rounding 규격으로 변환하지 않는다.

## 2. 공식 primary page evidence

| surface | 공식 경로와 page identity | 원면 직접 관찰 | 안전한 역할 | 남은 경계 |
| --- | --- | --- | --- | --- |
| 《三才發秘》, 人部卷一 연속면 | [Harvard HOLLIS record](https://id.lib.harvard.edu/aleph/008088435/catalog), [공식 IIIF manifest](https://nrs.harvard.edu/URN-3:FHCL:23921260:MANIFEST:3), `seq.540` [DRS 52823042 image](https://mps.lib.harvard.edu/assets/images/drs:52823042/full/full/0/default.jpg), `seq.541` [DRS 52823219 image](https://mps.lib.harvard.edu/assets/images/drs:52823219/full/full/0/default.jpg) | `冬至后一陽發生，為一歲之始`; `一交冬至…屬明年`; `月建之干支…從太陽節氣而分`; `交立春節…易正月干支`; `交驚蟄節…易二月干支`; `子時前四刻…去日，交後四刻…今日`; `正子/夜子` | 冬至 年干支, 立春·驚蟄 月建干支, 子時 日界의 직접 page-level primary witness | IIIF sequence에는 인쇄면 번호가 없음; Harvard 보존 원본 raw byte와 exact machine binding은 미확정 |

`seq.540–541`은 단순 catalog title/목차/검색 snippet이 아니라 실제 원면 이미지 surface다. 이 점에서 기존 OCR-only 또는 secondary-only 상태보다 한 단계 전진한다. 다만 이 원면이 어느 물리적 전사본·판본 계열에 속하는지, 다른 witness와 어떻게 연결되는지는 이 문서에서 결정하지 않는다.

### 2.1 review derivative identity

직접 판독에 사용한 IIIF derivative bytes의 현재 local hash는 다음과 같다. 이는 Harvard의 기관 보존 raw bytes나 canonical physical-copy hash가 아니다.

```text
/private/tmp/sancai-v8-540-full.jpg
  DRS       52823042
  sha256    efd8a9cdef160565a5b4e61a38c613eb38d59ad2876ea83a456d4897693d5604

/private/tmp/sancai-v8-541-full.jpg
  DRS       52823219
  sha256    d087cc09893a7c45fd5939142a3305221074b8eeefdcfc0bea087f8c8d3e3dd6
```

이 hash는 직접 원면을 다시 열어 판독한 review surface를 식별하는 데만 사용한다. repository에는 원본 이미지·대용량 PDF를 복사하지 않는다.

## 3. 冬至年界–立春月界–子時日界 모델

### 3.1 年界: 冬至

`seq.540–541`의 앞뒤 문맥은 다음처럼 읽힌다.

```text
歲從太陽之升降也。
冬至后一陽發生，為一歲之始。
今之世俗不明其理，槩以交立春而方易歲之干枝，將冬至、小寒、大寒三氣竟屬去年。
故立歲之干支，一交冬至，刻分則屬明年。
```

이 문면에서 직접 닫히는 claim은 `歲之干支`의 경계가 source-local하게 `交冬至`에 놓인다는 것이다. `年柱`라는 후대 분석어를 이 문헌에 그대로 덧씌우지 않고, 안전한 표현을 다음처럼 유지한다.

```text
direct: 交冬至 → source가 말하는 다음 해의 歲干支
not yet: 모든 Saju 문헌의 年柱 = 冬至
not yet: 이 문면이 실제 연대순으로 立春年界보다 선행함
```

### 3.2 月界: 立春·驚蟄 등 太陽節氣

같은 연속 원면은 `合朔`과 `月建`을 분리한다.

```text
月雖與太陰合朔為定，而月建之干支，仍從太陽節氣而分，非交朔而即易也。
故交立春節，方易正月干支；交驚蟄節，方易二月干支。
```

따라서 이 witness에서 직접 확인되는 범위는 다음이다.

| claim | 판정 | 제한 |
| --- | --- | --- |
| 월의 어떤 기준에는 `太陰合朔`이 관여함 | `direct, source-local` | 이를 현대 음력 월초 계산으로 규격화하지 않음 |
| `月建之干支`는 `太陽節氣`에 따라 나뉨 | `direct, source-local` | 모든 문헌의 12節-only 규칙으로 일반화하지 않음 |
| `交立春節`에서 正月干支를 바꿈 | `direct, source-local` | 현대 절기 instant·timezone·endpoint 미확정 |
| `交驚蟄節`에서 二月干支를 바꿈 | `direct, source-local` | 연중 모든 月界의 완전한 규칙으로 확대하지 않음 |
| `正月朔`이 月建干支의 교체 경계임 | `not supported by this page` | 合朔과 月建 교체를 source가 명시적으로 분리함 |

이 문면은 `正月朔`을 무시한다는 뜻이 아니라, 적어도 `月建之干支`의 교체를 `交朔`과 동일시하지 않는다는 뜻이다.

### 3.3 日界: 子時 전후 四刻

`至於日也` 뒤에는 다음의 직접 문장이 이어진다.

```text
子時前四刻尚屬去日，交後四刻，方屬今日。
故皇曆有正子、夜子之別。
正子者，一日之始；夜子者，一日之終。
```

직접 닫히는 것은 `子時` 내부에 source가 `前四刻/後四刻`을 두고, 이를 각각 `去日/今日`로 배속한다는 점이다. `正子`와 `夜子`의 명칭도 같은 calendar/timekeeping 설명층에서 직접 관찰된다.

그러나 다음은 승격하지 않는다.

```text
子時前四刻 = 현대 23:00–24:00
子時後四刻 = 현대 00:00–01:00
四刻 = 모든 문헌에서 동일한 분 단위
正子/夜子 = 후기 四柱 문헌의 모든 日柱·時柱 구현과 동일
```

후기 Saju 원면의 `夜子/正子`가 실제로 日干枝와 時干枝를 어떻게 배속하는지는 별도 direct successor에 보존되어 있다. 따라서 이 `三才發秘` 문면의 `日界`와 후기 `夜子/正子` assignment를 하나의 계산 규칙으로 합치지 않는다.

## 4. 후기 立春年·月–子夜日 모델과의 병렬 보존

후기 모델은 하나의 문헌·한 면에 완성된 보편 체계로 승격하지 않고, 현재 직접 확인된 여러 page surface의 **bounded composite**로 기록한다.

| layer | 후기 direct evidence | 현재 허용되는 요약 | 보존할 한계 |
| --- | --- | --- | --- |
| 年界 | 《新命理探原》 p.70, printed `三八`, [기존 successor](./saju-year-pillar-li-chun-boundary-frontier-successor-v1.md) | `以立春節為綱`; 입춘 전·후 및 十二月立春後의 年干枝 배정 | 1915는 inspected corpus의 exact dated frontier이지 역사상 최초가 아님 |
| 月界 | late-Saju 月建 surfaces, [月柱 source-local frontier](./saju-month-pillar-source-local-frontier-successor-v2.md) | `節令`·월별 月支·寅月 시작간이 직접 반복됨 | 모든 월령의 현대 자동 생성기, 《五行精紀》 卷33 채택 |
| 日界/時界 | 《命理集成》 p.63–64 및 《新命理探原》 p.86–87, [기존 successor](./saju-zi-day-boundary-direct-witness-successor-v1.md) | `夜子`에서는 生日은 今日, 生時干枝는 明日 기준; `正子`에서는 生日·時干枝를 함께 明日 기준으로 적음 | source 간 textual independence, 모든 문헌의 동일 lexical normalization, 현대 시각 경계 |

따라서 후기 모델을 다음 analytic shorthand로 병렬 표기한다.

```text
late direct composite:
  年 = 立春 operational rule
  月 = 節令/節氣 기반 月建 rule
  日·時 = 夜子/正子 source-local assignment
```

이 표기는 여러 direct page의 역할을 구분하기 위한 것이지, 후기 문헌이 모두 하나의 규칙을 그대로 공유한다는 뜻이 아니다.

## 5. 年界·月界·日界·歲首의 비교 판정

| 비교 항목 | 현재 direct evidence | 판정 |
| --- | --- | --- |
| `冬至` | 《三才發秘》 원면의 `一交冬至…屬明年` | `direct source-local year boundary` |
| `立春` 年界 | 《新命理探原》 p.70의 `以立春節為綱`과 세 가지 배정 | `direct dated late witness`; 기존 frontier 유지 |
| `立春/驚蟄` 月界 | 《三才發秘》 원면의 `交立春節…正月`, `交驚蟄節…二月` | `direct source-local month boundary` |
| `合朔/正月朔` | 《三才發秘》가 `合朔`과 `月建` 교체를 분리 | `calendrical distinction direct`; Saju 年界로는 unresolved |
| `歲首` | 《三才發秘》의 `為一歲之始`가 冬至에 붙음 | source-local label; 문헌 전체의 보편 歲首로 일반화하지 않음 |
| 子時 日界 | `前四刻=去日`, `後四刻=今日`, `正子/夜子` | `direct source-local day boundary` |
| A→B 역사적 전환 | A와 B의 page-level correspondence만 있음 | `blocked` |

`歲首`를 하나의 고정된 역사 용어로 처리하지 않는다. 이번 원면에서는 `冬至后一陽發生，為一歲之始`라는 source-local 문장이 직접 보이지만, 다른 역법 문맥의 `正月朔`·王者歲首와 동일하다고 판정할 direct Saju bridge는 없다.

## 6. Claim-level frontier adjudication

| claim | status | 승격 가능한 표현 | 승격하지 않는 것 |
| --- | --- | --- | --- |
| 冬至에서 다음 歲干支가 시작된다는 문장 | `direct page-level primary` | 《三才發秘》 seq.540–541의 source-local rule | 모든 문헌의 年柱 = 冬至 |
| 立春·驚蟄에서 月建干支가 바뀐다는 문장 | `direct page-level primary` | 같은 연속 원면의 正月·二月 examples | 24節氣 전체의 완전한 현대 selector |
| 子時 전후가 去日/今日로 갈린다는 문장 | `direct page-level primary` | `前四刻/後四刻` 및 `正子/夜子` literal distinction | 현대 23/00시·15분 환산 |
| 후기 立春 年界 | `direct, existing stronger frontier` | 1915 p.70 exact operational witness | 새 문서 때문에 dated frontier를 하향하는 것 |
| 후기 `夜子/正子` 日·時 배속 | `direct, source-local existing frontier` | 두 late page surface의 literal assignment | 三才와 동일한 구현이라고 단정 |
| A와 B가 서로 다른 model이다 | `bounded analytic parallel` | 직접 원면에 보이는 경계 조합을 분리 기록 | historical school/edition classification |
| A가 B의 선행형이거나 B가 A를 대체했다 | `blocked` | 없음 | 연대 순서·문구 유사성만으로 transition 서사 |
| 특정 공통조상·직접 계보·textual independence | `blocked` | 없음 | 기관·제목·유사 문장만으로 lineage |
| 立春·冬至 중 어느 것이 정본 年界인가 | `unresolved / authority blocked` | 문헌별 source-local rule | 정본성·보편성·semantic authority |
| 현대 계산 규격·readiness·production activation | `blocked` | 없음 | timezone·endpoint·rounding·자동 계산기 |

## 7. Frontier delta와 보존 경계

이번 successor의 실제 delta는 다음 하나다.

```text
previous:
  冬至年界–立春月界–子時日界 = catalog/OCR/secondary lead 또는 불완전한 page evidence

now:
  冬至年界–立春/驚蟄月界–子時前後日界
    = Harvard 공식 IIIF seq.540–541 실제 원면의 direct page-level primary evidence
```

동시에 다음 기존 판정은 그대로 유지한다.

```text
late 立春年 frontier          = 1915 dated exact witness
late 夜子/正子 assignment      = direct source-local witness
五行精紀 卷33 explicit adoption = unresolved
A→B historical transition      = blocked
edition/lineage/priority       = unresolved or blocked
semantic authority/readiness    = blocked
modern calendar implementation  = blocked
```

이것은 `冬至年界`가 `立春年界`보다 역사적으로 더 이르다는 주장이 아니다. Harvard catalog의 `[1697?]`도 exact composition/printing date가 아니며, 두 model의 직접 계보를 제공하지 않는다. 이번에 닫힌 것은 **서로 다른 source-local operational surface의 병렬 존재**다.

## 8. 재현·검증·Git 범위

직접 원면은 아래 공식 URL에서 다시 열 수 있다.

```sh
curl -L --fail --silent --show-error \
  -o /private/tmp/sancai-v8-540-full.jpg \
  'https://mps.lib.harvard.edu/assets/images/drs:52823042/full/full/0/default.jpg'
curl -L --fail --silent --show-error \
  -o /private/tmp/sancai-v8-541-full.jpg \
  'https://mps.lib.harvard.edu/assets/images/drs:52823219/full/full/0/default.jpg'
shasum -a 256 /private/tmp/sancai-v8-540-full.jpg /private/tmp/sancai-v8-541-full.jpg
```

검증 대상은 다음 literal anchor로 제한한다.

1. `冬至后一陽發生，為一歲之始`와 `一交冬至…屬明年`.
2. `月建之干支…從太陽節氣而分，非交朔而即易也`.
3. `交立春節…正月干支`, `交驚蟄節…二月干支`.
4. `子時前四刻尚屬去日，交後四刻，方屬今日`와 `正子/夜子`.

원면·render bytes는 repository에 추가하지 않는다. 이 successor의 atomic commit allowlist는 이 문서 하나이며, 기존 tracked design/scheduler 수정 3개와 untracked Wonkwang·Sonkeik 연구 문서 4개, 기존 historical research docs, 대용량 원본은 stage·수정·삭제하지 않는다.

최종 bounded state:

```text
三才發秘 A model direct page evidence       = advanced
late 立春年·月–夜子日 composite             = retained in parallel
正月朔 as Saju 年界                        = unresolved
A→B transition / direct genealogy           = blocked
specific edition priority / common ancestor  = blocked
semantic authority / interpretation readiness= blocked
modern timezone/API/endpoint/rounding        = blocked
```
