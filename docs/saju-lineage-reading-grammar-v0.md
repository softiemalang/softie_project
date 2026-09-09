# 사주 source-bounded / lineage-bounded reading grammar v0

이 문서는 다섯 확보 문헌의 제한된 locator에서 직접 관찰된 규칙 표면만 별도 lineage로 보존한다. 공통 semantic grammar, 원전 권위, readiness, activation, Base 계산은 변경하지 않는다.

## 판정 규칙

- `adopted_lineage_rule`: 해당 local witness 범위에서 조건·순서·출력 범위가 충분히 닫힌 규칙 표면. 역사적 권위나 공통 규칙 승격은 아님.
- `common candidate`: 독립 textual source가 같은 bounded claim을 직접 지지할 때만 허용. 현재는 독립성·판본·전승이 닫힌 source pair가 없어 0건이다.
- `unresolved`: locator는 있으나 조건, 우선관계, 완결성, 충돌 원인이 닫히지 않은 규칙.
- `unsupported`: 현재 허용 locator로 직접 닫힌 규칙이 없는 영역.

모든 rule은 [sajuLineageReadingGrammar.js](../src/interpretationPrep/sajuLineageReadingGrammar.js)에 source identity, locator, 전제, 입력 FACT, 구조 출력, 예외, 충돌 정책과 함께 정의되어 있다. adopted rule에는 별도의 `saju-lineage-derived-structural-result-v0` 계약이 붙어 있어 공통 Base FACT와 lineage-derived 출력의 출처를 분리한다. p.10의 한정된 다음 판단에는 별도의 `saju-lineage-source-bounded-semantic-result-v0` 계약을 붙여 source role label과 개인 의미를 분리한다.

## 채택된 lineage 규칙

| Rule | 문헌 locator | 입력 FACT | Base에서 가능한 구조 출력 | 예외/금지 확장 |
|---|---|---|---|---|
| `rule.yuanhai.day-anchor-month-command-frame.v0` | 淵海子平 p.6–7, `論日為主`·`論月令` | 일간, 연·월·일·시주 | 일간 기준점, 연·월·일·시 순서, 월령 맥락 | 시주 미상 시 중단; 성격·강약·용신 금지 |
| `rule.yuanhai.hidden-stem-ten-god-label-inventory.v0` | 淵海子平 p.4, `論天地干支暗藏總訣` | 위치별 지장간·기존 십성 라벨 | 지장간/십성 라벨 목록 | 여러 전통 명칭을 하나의 개인 의미로 합치지 않음 |
| `rule.sanming.four-pillars-month-hour-frame.v0` | 三命通會 p.69–70, `論遁月時`·`論年月日時` | 네 기둥 | 네 기둥 구조와 월간/시간 도출 절차 표면 | 현재 Base의 절기·일경계·진태양시를 원전 규칙으로 재계산하지 않음 |
| `rule.sanming.human-element-month-command.v0` | 三命通會 p.65–66, `論人元司事`·`論四時節氣` | 월지·월지장간 | 월령/인원 구조와 지장간 목록 | 한 사령 일수 예시를 전체 가중표로 일반화하지 않음 |
| `rule.sanming.element-generation-control.v0` | 三命通會 p.4–6 | 오행·기존 관계 FACT | 오행 목록·기존 천간관계 확인 | 균형·세력·개인 의미 도출 금지 |
| `rule.ziping.branch-relation-inventory.v0` | 子平真詮 p.5, `論刑沖會合解法` | 지지 관계 목록 | 관계·지지·위치 목록, 동시 관계 보존 | 관계 우선순위·해소·변화·길흉 금지; `破/害/半合`은 이 locator의 증거로 확장하지 않음 |
| `rule.ziping.explicit-stem-branch-example-match.v0` | 子平真詮 p.5, `論刑沖會合解法` | 일간·네 지지·위치별 기존 지장간 목록 | p.5에 실제 열거된 stem–branch 예시의 일치 inventory만 산출 | 열거되지 않은 조합, 본기/중기/여기 전체표, 순위·강도·통근/투간 일반화 금지; `乙逢午`·`丁逢酉` 예외는 unresolved로 유지 |
| `rule.ziping.jia-root-branch-scan.v0` | 子平真詮 p.3 `論陰陽生死`, p.16 `論支中喜忌逢運透清` | 네 위치의 visible stem·branch, exact `timeAccuracy` | visible `甲`가 있을 때 `寅·亥·卯·未` root match와 `亥`–visible `壬/甲` source-named relation inventory | 甲 한정; 전 천간 mapping·p.3 음간/묘고 예외·p.5 순위·透/透干 일반화 금지 |
| `rule.ziping.chen-exposure-inventory.v0` | 子平真詮 p.10 `論雜氣如何取用` | 일간·월지·월지장간·네 위치 visible stem·exact `timeAccuracy` | 정확히 `甲生辰月`에서 원문에 열거된 `戊·癸·乙`의 위치별 named exposure inventory | 세 대상 밖의 透/透干·다른 월지/일간·會支·用神·格局으로 확장 금지 |
| `rule.ditian.jia-wood-seasonal-condition.v0` | 滴天髓 p.4, `天干論 / 甲木` | 일간과 명시적 계절 FACT 필요 | 甲木 조건문 일치 여부만 | 甲木 외 일간으로 전이하지 않음; 성격·강약 결론 금지 |
| `rule.qiongtong.five-phase-number-season-state.v0` | 窮通寶鑑 p.2, `五行總論` | 오행 기본 수와 별도 source-specific 상태 resolver 필요 | `生旺`/`死绝`의 조건부 double/half 연산 표면만 기록; resolver가 닫히기 전 실행하지 않음 | Base 분포/지장간 가중치·일반 十二運星과 합치지 않음 |
| `rule.qiongtong.jia-wood-seasonal-clauses.v0` | 窮通寶鑑 p.4–5·p.7, `三春甲木`·`正月甲木`·`三夏甲木` | 甲 일간과 명시적 월령/계절 필요 | 해당 월별 조건문만 선택 | 월별 문단을 하나의 보편 처방으로 통합하지 않음 |

## 병존·미해결·미지원

- 子平真詮의 `用神`·`相神`·`用神變化`, 전 천간 통근·투간의 완전한 우선순위는 원문 구간은 있으나 현재 Base 입력과 규칙 완결성이 부족해 `unresolved`다. 다만 p.5 exact-example inventory, p.16의 甲 한정 root scan, p.10의 정확한 `甲生辰月` named exposure inventory는 각각 별도 source-bounded rule로 채택했고, p.10의 원문 역할 label만 별도 semantic rule로 연결했다.
- 子平真詮 p.15·p.25와 淵海子平 p.9의 운 locator는 운과 원국을 함께 보는 범위만 남기고, 방향·절기 거리·환산·정확한 기산일은 `unresolved`다.
- 窮通寶鑑의 월별 조건은 source-bounded rule로 병존시키되, 현재 Base에는 명시적 계절/절기 상태가 없어 fixture에서 실행하지 않는다.
- 신살의 reference axis/mapping, 단일 상징의 성격·개인 특성·사건 예측은 `unsupported`다.

### 窮通寶鑑 生旺/死绝 상태 audit

로컬 witness `/Users/hangyukim/Documents/malang_lab/documents/穷通宝鉴.pdf`(92쪽, SHA-256 `36d54cdc995d203fdceafcb52b2a0d4f57093ab1765c532db5418b46a96c4b19`)의 p.2 `五行總論`을 직접 시각 판독했다. 해당 면에서 닫히는 표면은 다음뿐이다.

- 기본 수: 水=1, 火=2, 木=3, 金=4, 土=5
- 상태 연산: `生旺`이면 가배(double), `死绝`이면 감반(half)
- 적용 범위: 같은 문단의 `其数`에 대한 source-local 수치 연산. 현재 Base의 분포 count나 지장간 가중치를 수정하는 규칙이 아니다.

같은 면의 `形色` 문장은 상태 라벨과 색 관계를 언급하지만, 생년·월령·지지·계절에서 `生旺`/`死绝`을 결정하는 표, 입력 구조, 원소별 적용 방식, 우선관계, 예외를 제공하지 않는다. 그러므로 다음은 닫히지 않은 상태로 남긴다.

- `resolved prerequisite`: 원소별 기본 수와 조건부 `double`/`half` 어휘만 source-bounded로 확인됨.
- `executable structural result`: 실제 frozen Base에서는 0건. p.2가 상태 resolver를 닫지 않으므로 명시 문자열만 추가한 test supplement도 실행 입력으로 승격하지 않는다.
- `unresolved remainder`: source-specific 상태의 취득 규칙, 입력 shape(단일 label인지 원소별 map인지), source 내부 우선관계·예외. 일반 十二運星·현대 명리 표·다른 lineage에서 상태를 가져오는 것은 금지한다.

이 결과는 `rule.qiongtong.five-phase-number-season-state.v0`의 bounded numeric operation과 그 prerequisite gap을 분리한 것이다. `seasonState`를 공용 Deterministic Base에 추가하지 않았고, 상태 문자열이나 `twelveStage` 대체 입력도 fail-closed로 처리한다.

현재 다섯 문헌 사이에 독립 textual lineage가 확인된 source pair가 없으므로 `commonCandidates=[]`로 유지한다. 일간 기준·월령 확인처럼 유사한 구조는 공통 후보로 승격하지 않고 각 문헌 rule에만 남긴다.

## 재현 가능한 structural result 계약

각 adopted rule의 결과 계약은 다음 네 층을 분리한다.

- `executable_rule`: 현재 frozen Base와 필요한 조건이 모두 충족되어 실행 가능한 rule 표면.
- `prerequisite_gap`: rule은 채택되었지만 Base에 없는 결정적 입력 또는 명시 조건 때문에 실행을 중단한 상태.
- `unresolved_rule`: locator는 있으나 정의·우선관계·예외·완결성이 닫히지 않아 실행 rule로 만들 수 없는 상태.
- `derived_structural_result`: 실행된 결과. 입력은 `frozen_base_common_fact` 또는 `frozen_normalized_input`, 출력은 `lineage_derived_structural_result`로만 표시한다.

추가로 서로 다른 lineage가 같은 구조 출력 슬롯에 동시에 도달하면 `lineage_conflict`로 보존하고 결과를 내보내지 않는다. `not_applicable_fixture`와 `unsupported`는 별도 목록으로 남긴다. 계약은 각 rule의 common Base FACT, lineage prerequisite, 적용 조건, 순서, stop condition, 출력 field를 기계적으로 검사한다.

| Rule | 공통 Base FACT | 추가 prerequisite / 현재 gap | 구조 절차와 출력 | 중단 조건 |
|---|---|---|---|---|
| 淵海 `day-anchor-month-command-frame` | 일간·연/월/일/시주·`timeAccuracy` | 없음 | 일간 anchor → 연·월·일·시 순서 → 월령/시 보조 role. `sourceRoleFrame` | exact 시간이 아니거나 네 기둥/일간 누락 |
| 淵海 `hidden-stem-ten-god-label-inventory` | 위치별 지장간·기존 십성 라벨·`timeAccuracy` | 없음 | 위치별 라벨 inventory와 visible label map 분리 | exact 시간이 아니거나 어느 위치의 지장간/라벨 map 누락 |
| 三命 `four-pillars-month-hour-frame` | 네 기둥·`timeAccuracy` | 없음 | frozen 네 기둥을 읽고 month-from-year/hour-from-day 절차 label만 기록 | exact 시간이 아니거나 기둥 누락; 재계산 금지 |
| 三命 `human-element-month-command` | 월지·월지장간 | 없음 | 월령 위치와 지장간 inventory만 산출 | 월지/지장간 누락; 사령 일수 일반화 금지 |
| 三命 `element-generation-control` | 오행 분포·pillarFacts·기존 천간관계 | 없음 | 기존 오행/관계 inventory만 읽음 | 입력 envelope 누락; 균형·세력·선호 도출 금지 |
| 子平 `branch-relation-inventory` | 지지 관계 array | 없음; 빈 array는 빈 inventory로 허용 | 관계명·지지·위치와 locator 범위 안/밖 이름, precedence=`none` | array 누락/비배열; 충돌 관계 삭제·순위화 금지 |
| 子平 `explicit-stem-branch-example-match` | 일간·네 지지·네 위치의 기존 지장간 array | 없음; 네 위치의 branch/hidden-stem 입력이 모두 있어야 함 | 일간을 anchor로 삼아 p.5 exact example pair만 `matchedExamples`로 보존하고 기존 지장간 목록을 함께 표시 | 입력 누락/형식 오류; 미열거 조합·본기/중기/여기 전체표·월령 우선·투간/통근 일반화 금지 |
| 子平 `jia-root-branch-scan` | 네 위치 visible stem·branch·`timeAccuracy` | 없음; exact 네 기둥 frame이 필요 | visible `甲` anchor를 보존하고 네 지지 중 `寅·亥·卯·未` match, `亥`가 있으면 visible `壬/甲` 관계를 별도 출력 | 甲 이외 mapping·중복 가중·p.10–11 투간 의미·강약/用神 금지 |
| 子平 `chen-exposure-inventory` | 일간·월지·월지장간·네 위치 visible stem·`timeAccuracy` | 정확히 `甲生辰月`; 월지장간에 `戊·癸·乙`가 공급되어야 함 | 네 visible stem에서 세 named target의 위치·source stem·단일/복수 개수만 기록 | 세 target 밖, 다른 월지/일간, 會支·用神·格局·강약·개인 의미 금지 |
| 滴天髓 `jia-wood-seasonal-condition` | 일간·월지 | `seasonContext`가 frozen public Base에 없음 | 甲/갑 조건과 명시 계절 창만 기록 | 甲/갑 이외는 비적용; 계절 context 없으면 gap |
| 窮通 `five-phase-number-season-state` | 오행 기본 수 | p.2의 상태 resolver와 입력 shape가 frozen public Base에 없음 | 조건부 `生旺` double / `死绝` half 연산 어휘만 기록 | resolver 미완결이면 gap; 문자열·十二運星·Base count로 추정 금지 |
| 窮通 `jia-wood-seasonal-clauses` | 일간·월지 | 명시 month/season `seasonContext`가 frozen public Base에 없음 | 일치하는 source section window와 clause sequence만 보존 | 甲/갑 이외는 비적용; context 없으면 gap; lineage 병합 금지 |

현재 fixture의 `갑`↔원문 `甲` 대응은 표기 정규화일 뿐, 의미 규칙이 아니다. `seasonContext`와 `seasonState`는 공개 Base 생성기에 추가하지 않았다.

## 통근·투간 구조 판단의 좁은 frontier

`子平真詮` p.3·p.5·p.7·p.10–11·p.16을 직접 대조한 결과, p.16에 甲 한정의 source-defined root scan이 추가로 닫힌다. p.5의 exact examples와 분리해 다음 두 층으로 유지한다.

- `甲逢未`, `丙逢戌`을 source가 `墓庫` 예시로 열거한 경우
- `乙逢辰`, `丁逢未`를 `余氣` 예시로 열거한 경우
- `甲逢亥/寅/卯`를 `長生祿刃` 예시로 열거한 경우
- `乙逢戌`, `丁逢丑`에 대해서는 source가 해당 지지에 각각 木·火가 없다고 명시한 negative example

이 predicate는 supplied day-master stem과 각 supplied branch를 위 exact list와 대조하고, 독립적인 기존 hidden-stem inventory를 함께 출력할 뿐이다. 따라서 결과 key는 `ziping.explicitStemBranchExampleInventory`이며, `通根`, `透干`, 강약 또는 우선순위 결과라는 이름으로 재해석하지 않는다. `甲`/`갑`은 fixture 표기 대응일 뿐 source 의미의 변환이 아니다.

### 닫힌 source-defined predicate: 甲 root scan

PDF p.16 `論支中喜忌逢運透清`은 `有一甲字`이면 네 지지를 모두 훑어 `寅·亥·卯·未` 중 하나라도 있으면 `甲木之根`으로 기록하도록 직접 제시한다. 같은 문단은 `有一亥字`이면 네 visible stem을 다시 훑어 `壬`은 `禄`, `甲`은 `長生`으로 관계를 나누고, 둘이 함께 있으면 두 관계를 병존시킨다. 이 입력·절차·출력 범위는 `rule.ziping.jia-root-branch-scan.v0`와 `ziping.jiaRootBranchScan`으로 구현했다.

PDF p.3 `論陰陽生死`와 p.5의 根 분류는 양/음, 묘고·여기·장생록왕의 source-local qualification을 보여주지만, p.16의 甲 predicate를 다른 천간으로 확장할 완전한 mapping은 제공하지 않는다. 따라서 이 rule은 all-stem 通根 rule이 아니라 `甲`/`亥` 관계에 한정된 bounded predicate다.

### 透/透干: context-bound relation만 확인, 일반 predicate는 unresolved

이번 p.7·p.10–11 원면 대조에서 `透/透干`은 세 종류의 context-bound surface로 분리된다.

- p.7 `寅月`은 `不透甲而透丙`을 用神 변화의 사례로 제시한다. visible stem 조건은 월령·用神 선택과 함께 제시되며, 독립적인 노출 판정 정의로 분리되지 않는다.
- p.10 `何謂透干`은 `甲生辰月`에서 `透戊·透癸·透乙`을 각각 用神 선택과 연결하고, 한 개/복수 투간 및 透干·會支 병존을 이어서 설명한다. 이 면은 `辰`의 named example inventory로는 닫히지만 전 지지·전 천간 predicate는 아니다.
- p.11은 `透干`과 `會支`, 복수 투간, 有情/無情 및 格局 보존·변화 사례를 함께 평가한다. 같은 노출 표면이 결합 조건에 따라 다른 문맥 결과에 참여하므로 semantic-free output으로 추출할 수 없다.

따라서 이 페이지들의 **context-bound relation**은 locator·조건·의존 문맥을 보존하되, `visible stem ∈ hidden stem`이라는 현대적·보편적 통간 공식으로 재명명하지 않는다. 다만 p.10의 named target 세 개는 구조 입력 범위를 exact `甲生辰月`로 닫을 수 있으므로, `rule.ziping.chen-exposure-inventory.v0`가 먼저 위치별 inventory를 만들고 `rule.ziping.chen-exposure-use-role.v0`가 그 inventory만 소비하는 source-bounded semantic rule을 채택했다. 이 semantic result는 원문 role label만 보존하며 개인 의미·강약·길흉·예측으로 확장하지 않는다. `rule.ziping.root-exposure.v0`는 p.7·p.10·p.11을 포함한 generic all-stem predicate unresolved 상태로 유지하고, p.16 `甲` root scan과 p.10 semantic lane을 병합하지 않는다.

### p.10 최소 source-bounded semantic grammar

p.10의 `何謂透干` 문답은 `甲生辰月`이라는 월령·일간 조건 아래 원문에 열거된 `戊·癸·乙`의 visible occurrence를 각각 source role label에 연결한다. 같은 문단의 단일/복수 노출 문구는 한 대상이면 한 label, 복수 대상이면 복수 label을 보존하는 데만 사용한다. 여기서 닫히는 것은 세 named target의 local mapping이지, 모든 천간·지지에 대한 `透`의 정의가 아니다.

실행 순서는 다음과 같이 고정했다.

1. frozen Base의 일간이 `甲/갑`, 월지가 `辰/진`, 시간이 exact인지 확인한다.
2. Base가 공급한 월지장간 목록에 `戊·癸·乙`가 모두 있는지 확인한다. 목록을 새로 계산하거나 현대 표로 보완하지 않는다.
3. 네 위치의 supplied visible stem에서 세 target만 scan하여 위치와 source stem을 `chenNamedExposureInventory`로 만든다.
4. 그 structural result를 semantic rule이 소비하여 `戊→偏财`, `癸→正印`, `乙→月劫`의 source role label만 `chenExposureUseRole`로 기록한다. 복수 match는 모두 보존하고 우선순위를 만들지 않는다.

이 규칙은 `用神` 문맥 안의 원문 label을 source-bounded result로 보존하는 것이며, 현재 사용자의 신강·성격·길흉·개인 의미를 판정하는 규칙이 아니다. `會支`를 함께 해석하거나 `有情/無情`을 평가하는 것은 p.11의 별도 unresolved frontier다. p.7의 `不透甲而透丙`은 `用神变化` 문맥의 context-bound candidate로 남아 별도 structural prerequisite가 닫히기 전에는 실행하지 않는다.

淵海子平 p.4의 지장간·월별 사령 문구, 三命通會 p.65–66의 `人元`·`司事`와 월별 service-day 예시, 滴天髓 p.4의 甲木 계절/根 조건은 각각 직접 관찰된 별도 source surface다. 이들은 지장간 inventory·월령 frame·甲木 조건문을 지지하지만, 子平의 exact-example predicate를 채우거나 generic 통근/투간 표를 제공하는 것으로 합치지 않았다. 子平 p.7의 `寅月`에서 `不透甲而透丙`을 대비하는 문장은 用神变化 문맥의 local example로만 남겨 일반적인 투간 resolver로 승격하지 않았다.

다음은 여전히 닫히지 않는다.

- 甲 predicate 밖에서 어떤 천간/지장간 존재를 일반 통근으로 판정하는지에 대한 전 위치 정의
- p.16 predicate를 여러 visible `甲` 위치에 적용할 때 source가 요구하는 중복 처리·집계 의미
- 여기·중기·본기와 투간이 동시에 있을 때의 우선순위
- 월지 외 지지, 일간 제외 여부, 충·합 등 상호작용의 예외
- p.10–11의 `透干`을 semantic-free exposure relation으로 분리할 수 있는지와 用神·格局으로 이어지는 경계
- p.5의 `乙逢午`·`丁逢酉` 음간 장생 예외를 어떤 입력관계로 재현할지

따라서 `rule.ziping.root-exposure.v0`는 generic all-stem root/exposure와 透干을 계속 `unresolved`로 둔다. exact-example inventory, 甲 root scan, p.10 named exposure inventory와 그 source role label 결과는 각각의 좁은 계약으로만 보존하고, 여러 match를 ranking하지 않는다. p.7은 context-bound candidate, p.11은 unresolved interaction으로 남긴다. 淵海의 지장간/십성 label inventory, 三命의 인원·사령 예시, 窮通·滴天髓의 계절 조건은 각각 별도 lineage 입력/출력으로 유지하고 통근·투간으로 합치지 않는다.

## Base 실행 검증

실제 frozen `tri-system-deterministic-base-v0` fixture에서 다음을 확인한다.

- Yuanhai·Sanming의 구조 frame, Sanming의 인원/오행 목록, Ziping의 지지 관계 목록, p.5 exact-example inventory와 p.16 甲 root scan은 재계산 없이 실행된다.
- 기존 서울 `계` fixture에서는 visible `甲`가 month 위치에 있고 branch `未`가 있어 p.16 predicate가 해당 root match를 deterministic result로 남긴다. `透/透干` 결과는 생성하지 않는다.
- 별도 `1997-04-12 08:30` exact fixture는 `甲生辰月`이고 hour visible stem이 `戊`이므로 p.10 structural inventory와 `偏财` source role label이 `Base FACT → lineage structural result → source-bounded semantic result` 순서로 재현된다. 결과에는 子平真詮 source ID, p.10 locator와 PDF SHA가 붙고 개인 의미는 없다.
- 같은 서울 `계` fixture를 두 번 실행해도 p.7·p.10–11 context-bound relation은 derived result로 materialize되지 않고, generic `root-exposure` unresolved rule의 locator/provenance만 유지된다. 다른 lineage와의 merge나 semantic fallback도 없다.
- `갑` fixture에서는 hour branch `未`가 p.5의 `甲逢未`와 일치하여 해당 위치·기존 hidden-stem 목록·source category가 deterministic result로 남고, 일반 통근/투간 result는 생성되지 않는다. 기존 서울 `계` fixture에서는 exact-example match가 빈 inventory로 결정된다.
- 동일 지지쌍의 `충`·`형`은 동시에 유지되고 우선순위를 부여하지 않는다.
- 시간 미상·시주 누락·운 누락은 해당 rule을 `blocked_missing_base_fact` 또는 `not_executable_by_contract`로 닫는다.
- 甲木 전용 Ditian/Qiongtong rule은 계 일간 fixture에 적용하지 않는다.
- `noRecalculation=true`, `noSemanticInterpretation=true`, `commonRulePromotion=false`를 유지한다.

structural result contract를 같은 서울 fixture에 두 번 적용하면 동일한 결과 object가 재현된다. 서울 `계` fixture의 구조 결과 분류는 `executable_rule` 8개, `derived_structural_result` 8개, `prerequisite_gap` 1개(窮通의 生旺/死绝 상태 resolver), unresolved 5개, unsupported 2개, not-applicable 3개(p.10 exact window 포함)다. p.10 exact fixture의 semantic 결과는 adopted semantic rule 1개와 derived source-bounded result 1개이며, p.7 candidate와 p.11 unresolved boundary는 결과를 내보내지 않는다. 상태 문자열과 일반 `twelveStage`를 test-only supplement로 넣어도 같은 prerequisite gap이 유지되고 Base는 변하지 않는다. 시간 미상 fixture에서는 淵海/三命의 완전한 네 기둥 rule과 exact-example/甲 root scan의 불완전 입력이 prerequisite gap으로 닫힌다. 별도 `갑` fixture에 test-only 계절 context를 공급하면 滴天髓와 窮通의 계절 창이 동시에 적용되지만, 두 결과는 `lineage_conflict`로 보존되고 병합 결과는 생성되지 않는다.

최소 fixture와 checker는 `test/sajuLineageReadingGrammar.test.js`에 있다.

## 다음 frontier

1. 窮通 p.2의 상태 resolver가 실제 source locator와 입력 shape까지 닫히는지 별도 확인한다. 일반 十二運星을 대입하지 않으며, 현재 Base에는 추가하지 않는다.
2. p.7의 用神变化 candidate와 p.11의 會支·有情/無情 interaction을 실행하려면 source-specific exposure input, 우선순위, 예외를 각각 별도로 닫는다.
3. p.10 exact lane 밖의 all-stem 통근·투간을 판정하려면 문헌별 완전한 정의·대상·우선순위·예외를 별도로 닫는다.
4. 운은 기존 timing authority frontier의 exact start-time·direction·conversion blocker를 먼저 닫는다.
5. 독립 textual witness와 판본/전승 관계가 확인되기 전까지 common rule을 생성하지 않는다.

semantic frontier는 p.10의 exact source-role lane만 닫혔다. 이는 공통 semantic grammar나 공개 Base 승격이 아니며, 다음 단계는 새 Base FACT 승격이 아니라 p.7·p.11의 문맥과 p.10 밖의 통근·투간 정의/우선순위/예외를 독립적으로 닫고, 계속 구조 결과와 source-bounded semantic result를 별도 계약으로 유지하는 것이다.
