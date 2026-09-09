# 사주 source-bounded / lineage-bounded reading grammar v0

이 문서는 다섯 확보 문헌의 제한된 locator에서 직접 관찰된 규칙 표면만 별도 lineage로 보존한다. 공통 semantic grammar, 원전 권위, readiness, activation, Base 계산은 변경하지 않는다.

## 판정 규칙

- `adopted_lineage_rule`: 해당 local witness 범위에서 조건·순서·출력 범위가 충분히 닫힌 규칙 표면. 역사적 권위나 공통 규칙 승격은 아님.
- `common candidate`: 독립 textual source가 같은 bounded claim을 직접 지지할 때만 허용. 현재는 독립성·판본·전승이 닫힌 source pair가 없어 0건이다.
- `unresolved`: locator는 있으나 조건, 우선관계, 완결성, 충돌 원인이 닫히지 않은 규칙.
- `unsupported`: 현재 허용 locator로 직접 닫힌 규칙이 없는 영역.

모든 rule은 [sajuLineageReadingGrammar.js](../src/interpretationPrep/sajuLineageReadingGrammar.js)에 source identity, locator, 전제, 입력 FACT, 구조 출력, 예외, 충돌 정책과 함께 정의되어 있다. adopted rule에는 별도의 `saju-lineage-derived-structural-result-v0` 계약이 붙어 있어 공통 Base FACT와 lineage-derived 출력의 출처를 분리한다. p.7의 exact local clause와 p.10의 한정된 다음 판단에는 별도의 `saju-lineage-source-bounded-semantic-result-v0` 계약을 붙여 source clause/role label과 개인 의미를 분리한다.

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
| `rule.ziping.yin-month-exposure-contrast.v0` | 子平真詮 p.7 `論用神變化`의 `不透甲而透丙` | 월지·네 위치 visible stem·exact `timeAccuracy` | 정확히 寅月에서 visible `甲` 부재와 단일 visible `丙` 노출의 source-local contrast inventory | 중복 丙·다른 월지·hidden-stem membership·일반 透/透干·global 用神 우선순위로 확장 금지 |
| `rule.ditian.jia-wood-seasonal-condition.v0` | 滴天髓 p.4, `天干論 / 甲木` | 일간과 명시적 계절 FACT 필요 | 甲木 조건문 일치 여부만 | 甲木 외 일간으로 전이하지 않음; 성격·강약 결론 금지 |
| `rule.qiongtong.five-phase-number-season-state.v0` | 窮通寶鑑 p.2, `五行總論` | 오행 기본 수와 별도 source-specific 상태 resolver 필요 | `生旺`/`死绝`의 조건부 double/half 연산 표면만 기록; resolver가 닫히기 전 실행하지 않음 | Base 분포/지장간 가중치·일반 十二運星과 합치지 않음 |
| `rule.qiongtong.jia-wood-seasonal-clauses.v0` | 窮通寶鑑 p.4–5·p.7, `三春甲木`·`正月甲木`·`三夏甲木` | 甲 일간과 명시적 월령/계절 필요 | 해당 월별 조건문만 선택 | 월별 문단을 하나의 보편 처방으로 통합하지 않음 |

## 병존·미해결·미지원

- 子平真詮의 global `用神`·`相神`·`用神變化`, 전 천간 통근·투간의 완전한 우선순위는 원문 구간은 있으나 현재 Base 입력과 규칙 완결성이 부족해 `unresolved`다. 다만 p.5 exact-example inventory, p.16의 甲 한정 root scan, p.10의 정확한 `甲生辰月` named exposure inventory, p.7의 exact `寅月·不透甲而透丙` local contrast는 각각 좁은 source-bounded rule로 채택했고, p.7은 원문 문구 `同知得以作主`를 local clause로만 보존하며 global 우선순위를 만들지 않는다.
- 子平真詮 p.15·p.25와 淵海子平 p.9의 운 locator는 운과 원국을 함께 보는 범위만 남기고, 방향·절기 거리·환산·정확한 기산일은 `unresolved`다.
- 窮通寶鑑의 월별 조건은 source-bounded rule로 병존시키되, 현재 Base에는 명시적 계절/절기 상태가 없어 fixture에서 실행하지 않는다.
- 신살의 reference axis/mapping, 단일 상징의 성격·개인 특성·사건 예측은 `unsupported`다.

### 子平真詮 p.7 exact clause 판정

p.7의 문장은 `假使寅月为提，不透甲而透丙，则如知府不临郡，而同知得以作主`로, `寅月`이라는 월령과 `甲` 부재·`丙` 노출의 대비, 그리고 `同知得以作主`라는 국소적 선택 변화 문구를 한 문장 안에서 직접 결합한다. 따라서 다음 범위는 source 자체의 조건·출력 문구가 닫힌다.

- 입력: frozen Base의 월지 `寅/인`, exact 시간, 네 위치의 supplied visible stem frame
- 조건: 네 위치에 visible `甲`가 없고 visible `丙`가 정확히 하나 있음
- 구조 출력: 네 visible stem inventory, 부재 `甲`, 노출 `丙`, 노출 위치
- source-bounded semantic output: `同知得以作主`라는 원문 clause와 `ziping-p7-寅月-不透甲而透丙-source-clause-only` scope

이것은 p.7 문장을 네 위치 frame에 한정한 충분조건이며, `透/透干`의 보편 정의나 모든 월령의 用神 우선순위를 닫는 주장이 아니다. `丙`이 여러 위치에 있으면 원문이 중복 처리를 닫지 않으므로 중단한다. 다른 월지, visible `甲` 동시 존재, hidden-stem membership, p.10 role label, p.11 조합은 이 rule에서 추정하지 않는다.

### 子平真詮 p.11 composition 판정

p.11은 `何谓有情？顺而相成者是也`와 `何谓无情？逆而相背者是也`를 제시한 뒤, `透干 + 會支`, 복수 노출, 格局 보존·변화 예시를 연속해서 든다. 같은 면에는 `有情而卒成无情` 및 `无情而终有情`의 전이 예시도 있어 단일 static valence로 축약되지 않는다.

현재 다음 입력·우선관계가 닫히지 않아 `rule.ziping.exposure-branch-sentiment.v0`는 `unresolved_composition`으로 유지한다.

- supplied `branchRelations` 중 어떤 레코드가 source-defined `會支`인지의 binding
- p.10의 named exposure/복수 노출과 p.11 composition을 연결하는 source-specific precedence
- `有情/無情`의 `顺/逆`를 구성하는 조건과 두 전이 예시의 중단·상태 전이
- 格局 문맥을 제거한 뒤에도 남는 독립 structural/semantic output의 완결성

그러므로 p.11의 정의와 예시는 locator/provenance가 있는 unresolved evidence로만 보존하고, `有情/無情` 판정·格局·吉凶·개인 의미 결과는 materialize하지 않는다.

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
| 子平 `yin-month-exposure-contrast` | 월지·네 위치 visible stem·`timeAccuracy` | 정확히 寅月; visible `甲` 없음; visible `丙` 하나 | 네 visible stem inventory와 `不透甲而透丙` contrast, 위치별 단일 `丙` 기록 | 중복 `丙`이면 중단; generic 透/透干·hidden-stem·global 用神 우선순위 금지 |
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

이번 p.7·p.10–11 원면 대조에서 `透/透干`은 서로 다른 context-bound surface로 분리된다.

- p.7 `寅月`의 `不透甲而透丙`은 generic exposure 정의는 아니지만, 네 위치 visible stem frame에 `寅月·甲 부재·단일 丙`을 바인딩하면 원문 clause `同知得以作主`까지 source-local하게 닫힌다. 이 exact lane만 `rule.ziping.yin-month-exposure-contrast.v0` → `rule.ziping.yin-month-exposure-change.v0`로 채택한다.
- p.10 `何謂透干`은 `甲生辰月`에서 `透戊·透癸·透乙`을 각각 用神 선택과 연결하고, 한 개/복수 투간 및 透干·會支 병존을 이어서 설명한다. 이 면은 `辰`의 named example inventory로는 닫히지만 전 지지·전 천간 predicate는 아니다.
- p.11은 `透干`과 `會支`, 복수 투간, 有情/無情 및 格局 보존·변화 사례를 함께 평가한다. 같은 노출 표면이 결합 조건에 따라 다른 문맥 결과에 참여하므로 semantic-free output으로 추출할 수 없다.

따라서 이 페이지들의 **context-bound relation**은 locator·조건·의존 문맥을 보존하되, `visible stem ∈ hidden stem`이라는 현대적·보편적 통간 공식으로 재명명하지 않는다. p.7은 exact local contrast만 source clause로 닫혔고, p.10의 named target 세 개는 구조 입력 범위를 exact `甲生辰月`로 닫을 수 있으므로 각각 별도 structural prerequisite와 semantic contract를 갖는다. p.11은 `會支` binding·복수 노출 precedence·유정/무정 전이가 닫히지 않아 unresolved로 남긴다. `rule.ziping.root-exposure.v0`는 generic all-stem predicate unresolved 상태로 유지하고, p.16 `甲` root scan·p.7 exact clause·p.10 semantic lane을 서로 병합하지 않는다.

### p.10 최소 source-bounded semantic grammar

p.10의 `何謂透干` 문답은 `甲生辰月`이라는 월령·일간 조건 아래 원문에 열거된 `戊·癸·乙`의 visible occurrence를 각각 source role label에 연결한다. 같은 문단의 단일/복수 노출 문구는 한 대상이면 한 label, 복수 대상이면 복수 label을 보존하는 데만 사용한다. 여기서 닫히는 것은 세 named target의 local mapping이지, 모든 천간·지지에 대한 `透`의 정의가 아니다.

실행 순서는 다음과 같이 고정했다.

1. frozen Base의 일간이 `甲/갑`, 월지가 `辰/진`, 시간이 exact인지 확인한다.
2. Base가 공급한 월지장간 목록에 `戊·癸·乙`가 모두 있는지 확인한다. 목록을 새로 계산하거나 현대 표로 보완하지 않는다.
3. 네 위치의 supplied visible stem에서 세 target만 scan하여 위치와 source stem을 `chenNamedExposureInventory`로 만든다.
4. 그 structural result를 semantic rule이 소비하여 `戊→偏财`, `癸→正印`, `乙→月劫`의 source role label만 `chenExposureUseRole`로 기록한다. 복수 match는 모두 보존하고 우선순위를 만들지 않는다.

## 子平真詮 전권 semantic rule inventory v0

이번 inventory는 현재 local PDF 27쪽 전체를 직접 시각 대조한 뒤, `구조 입력 → 원문이 직접 말하는 다음 판단` 표면만 기록한 것이다. 이 PDF는 현대 조판 local export이고 판본·전승 identity는 여전히 unresolved이므로, 아래 locators는 source identity나 semantic authority 승격이 아니다. 원문이 구조 어휘만 제공하고 다음 판단을 닫지 않는 장은 semantic candidate로 만들지 않고 구조 grammar 또는 제외 범위로 남겼다.

기계적으로는 `SAJU_ZIPING_SEMANTIC_RULE_INVENTORY`가 각 항목에 `sourceIds`, `locatorIds`, `applicability`, `requiredStructuralResult`, `semanticRoleResult`, `exceptions`, `forbiddenExtensions`를 모두 보존한다. 현재 신규 executable rule은 0건이다. 이미 채택된 p.7·p.10 두 lane만 기존 contract의 `adopted_existing_executable`로 표시한다.

| source surface / locator | 필요한 구조 입력과 닫힘 상태 | 원문이 직접 말하는 결과 형태 | 판정 |
|---|---|---|---|
| p.7 `page.local.ziping.p7-yongshin-continuation` | 寅月, 네 visible stem, 甲 부재, 단일 丙; `yin-month-exposure-contrast` 충족 | `同知得以作主`라는 local selection-change clause | 기존 executable; p.7 범위 밖 우선순위 금지 |
| p.10 `ziping-p10-chen-exposed-stem-definition` | 甲日主·辰月·공급된 辰 지장간·네 visible stem; `chen-exposure-inventory` 충족 | 戊→偏财, 癸→正印, 乙→月劫 source role-label inventory와 단일/복수 노출 | 기존 executable; named target만 |
| p.3 `ziping-p3-yang-yin-root-cycle-and-tomb-exception` | 완전한 source-local 상태표와 음양/묘고 예외 | 有根/无用·생사 단계 qualification | unresolved; 완전한 상태표 없음 |
| p.3–4 `ziping-p3-stem-combination-semantic-context`, `ziping-p4-stem-combination-nonmerge` | stem pair, 위치/거리, 이미 닫힌 用 role, 合/合化 상태 | 非其官/非其印/非其财, 合而不合·合而不化 등 case qualification | context-bound candidate; universal 합/합화 predicate 아님 |
| p.5 `ziping-p5-branch-relations-definition-and-examples` | 공급된 刑冲會合 relation inventory와 평가 context | 可解/不可解·刑冲会合解法 case qualification | unresolved; 관계 inventory만으로 해소·우선순위 불가 |
| p.7 `page.local.ziping.p7-yongshin-continuation`의 나머지 사례 | 用神과 page-specific 변화 조건 | 기타 用神变化 case clause | context-bound candidate; 채택된 단일 丙 lane과 병합 금지 |
| p.6 `page.local.ziping.p6-yongshin`, `ziping-p6-yongshen-success-rescue` | 월령·일간과 source-defined 用神 선택/구제 관계 | 用神 선택 및 成格/败格/救应 case | unresolved/candidate; 선택 resolver 미완결 |
| p.8 `ziping-p8-yongshen-pure-mixed`, `ziping-p8-yongshen-pattern-level` | 선택된 用神, 상호 작용 role set, 有情/有力·格局 입력 | 纯/杂, 格局高低 | context-bound candidate; 총순위 없음 |
| p.9 `ziping-p9-yongshen-success-failure-transition`, `ziping-p9-yongshen-season-result` | 이전/이후 用神·格局 상태, 기후 조건과 전이 관계 | 因成得败/因败得成, 配气候得失 | unresolved/candidate; 전이·기후 우선관계 없음 |
| p.10 `page.local.ziping.p10-xiangshen` | 이미 선택된 用神과 source-defined support relation | 相神/辅者 role mapping | context-bound candidate; 用神 선행 필요 |
| p.11 `ziping-p11-exposed-stem-and-branch-context` | 透干, source-defined 會支, 복수 노출, 格局 context | 有情/無情 및 전이 사례 | unresolved composition; 정적 valence 금지 |
| p.12 `ziping-p12-good-symbol-break-pattern`, `ziping-p12-bad-symbol-make-pattern`, `ziping-p12-generation-control-order` | 四吉/四凶 role, 格局 state, 생극제화 순서 | 破格/成格 및 先后分吉凶 | candidate/unresolved; 결과 경계와 우선순위 미완결 |
| p.13 `ziping-p13-external-pattern-use` | 月令과 source pattern 조건 | 外格用舍 | context-bound candidate; 외격 일반 resolver 없음 |
| p.14 `ziping-p14-six-relations-use`, `ziping-p14-wife-children` | 궁분·육친·개인 관계 입력 | 육친·배우자·자녀 결과 | unsupported; 공개 semantic grammar 밖 |
| p.15–16 `page.local.ziping.p15-xingyun`, `ziping-p16-yun-change-pattern`, `ziping-p16-stem-branch-preference` | exact 운 frame, 用神/格局/喜忌 context | 命運配合, 成格/變格, 干支喜忌 distinction | unresolved/candidate; timing·semantic priority 미완결 |
| p.17 `ziping-p17-not-bind-pattern`, `ziping-p17-regular-officer` | pattern 후보와 반례 또는 正官 role context | 拘泥하지 말라는 중단 지침, 正官 case qualification | unresolved/candidate; 경고를 양성 classifier로 전환 금지 |
| p.18–20 `ziping-p18-seven-killings`, `ziping-p18-injury-officer`, `ziping-p19-food-god`, `ziping-p19-seal`, `ziping-p20-wealth` | role별 제화·생조·格局 context | 七殺·傷官·食神·印綬·財 case qualification | context-bound candidates; 현대 symbol meaning 금지 |
| p.21–23 `ziping-p21-partial-wealth`, `ziping-p21-rob-wealth`, `ziping-p22-yang-blade`, `ziping-p22-building-wealth`, `ziping-p23-misc-pattern`, `ziping-p23-metal-spirit` | role/pattern별 추가 조건 | 해당 장의 source case qualification | context-bound candidates; 장 간 병합 금지 |
| p.24–27 `ziping-p24-injury-timing`, `ziping-p24-killing`, `ziping-p25-officer`, `ziping-p25-building-wealth-timing`, `ziping-p26-building-wealth-timing`, `ziping-p26-misc-pattern`, `ziping-p27-misc-pattern-continuation` | exact 운 또는 잡격 context | 取運·雜格의 source case qualification | context-bound candidates; 운·길흉·예측으로 확장 금지 |

1–2쪽과 p.5의 정의·관계 목록, p.16의 甲 root scan은 semantic result가 아니라 기존 structural inventory로 유지했다. p.17의 `拘泥格局`은 positive classifier가 아니라 fail-closed 중단 지침으로만 기록했다. p.14의 육친/처자 표면은 후보를 억지로 만들지 않고 unsupported로 격리했다.

### composition grammar frontier

p.3–4의 합 관계, p.8–9의 纯/杂·成败 전이, p.11의 透干·會支·有情/無情, p.12의 破格/成格가 동시에 성립할 수 있는 surface다. 그러나 원문은 이 결과들의 전역 우선순위·결합 연산·상태 전이표를 직접 제공하지 않는다. 따라서 `compositionReady=false`로 두고 결과를 병존시키며, winner 선택·다수결·문헌 간 합성·현대적 synthesis를 금지한다. 특히 p.11의 `有情而卒成无情`과 `无情而终有情`은 단일 정적 분류가 아니라는 직접 경계로 보존한다.

### inventory에서 contract로 승격하지 않은 이유

새 executable semantic rule은 없다. candidate/unresolved 항목들은 공통적으로 (a) source가 먼저 선택한 用神·格局을 요구하거나, (b) 여러 결과의 우선/전이를 닫지 않거나, (c) 출력이 吉凶·개인 관계·예측으로 넘어간다. 이 gap을 Base FACT, 현대 통관표, 다른 원전 lineage, 자유 자연어 추론으로 채우지 않았다. 기존 p.7·p.10 결과만 `Base FACT → lineage structural result → source-bounded semantic result → provenance` 순서를 유지한다.

### source-bounded semantic-result contract

여러 원전의 semantic rule을 같은 형식으로 수용할 때도 결과 descriptor는 자유 자연어 해석이 아니라 다음 필드를 모두 보존한다.

- `sourceIds`·`lineage`·`locatorIds`: 어떤 source/전승 범위와 locator를 사용했는지
- `requiredStructuralResult`: 필요한 lineage structural rule ID, 실제 result ID, `satisfied`·`blocked_missing`·`conflict_preserved`·`not_required` 상태
- `applicability`·`procedure`·`stopConditions`: 적용 전제·순서·중단 조건
- `semanticRoleResult`: source가 명시한 result key/field와 materialization 여부. 실제 값은 `output`에만 둔다.
- `conflictState`: 보존된 충돌 ID, conflict policy, winner 미선정 및 fail-closed 상태
- `forbiddenExtensions`: 개인 의미·강약·용신·격국·길흉·예측·cross-lineage merge 등 금지 확장 목록
- `provenance`: contract/rule/schema identity, source·lineage·locator와 source byte SHA-256

이 contract는 structural prerequisite를 충족한 경우에만 source-bounded result를 materialize한다. 입력 부족·문맥 미완결·충돌이면 상태와 provenance를 남기되 결과를 만들지 않으며, 서로 다른 원전의 유사성이나 자연어 추론으로 공통 semantic을 생성하지 않는다. `commonRulePromotion=false`, `crossLineageMerge=false`, `personalMeaning=false` 경계는 유지된다.

이 규칙은 `用神` 문맥 안의 원문 label을 source-bounded result로 보존하는 것이며, 현재 사용자의 신강·성격·길흉·개인 의미를 판정하는 규칙이 아니다. `會支`를 함께 해석하거나 `有情/無情`을 평가하는 것은 p.11의 별도 unresolved frontier다. p.7의 `不透甲而透丙`은 네 위치·단일 `丙`으로 제한한 exact local clause만 별도 structural prerequisite를 거쳐 실행하며, global 用神 우선순위나 generic 透/透干으로 확장하지 않는다.

淵海子平 p.4의 지장간·월별 사령 문구, 三命通會 p.65–66의 `人元`·`司事`와 월별 service-day 예시, 滴天髓 p.4의 甲木 계절/根 조건은 각각 직접 관찰된 별도 source surface다. 이들은 지장간 inventory·월령 frame·甲木 조건문을 지지하지만, 子平의 exact-example predicate를 채우거나 generic 통근/투간 표를 제공하는 것으로 합치지 않았다. 子平 p.7의 `寅月`에서 `不透甲而透丙`을 대비하는 문장은 exact local clause로만 채택했고, 일반적인 투간 resolver나 global 用神 우선순위로 승격하지 않았다.

다음은 여전히 닫히지 않는다.

- 甲 predicate 밖에서 어떤 천간/지장간 존재를 일반 통근으로 판정하는지에 대한 전 위치 정의
- p.16 predicate를 여러 visible `甲` 위치에 적용할 때 source가 요구하는 중복 처리·집계 의미
- 여기·중기·본기와 투간이 동시에 있을 때의 우선순위
- 월지 외 지지, 일간 제외 여부, 충·합 등 상호작용의 예외
- p.10–11의 `透干`을 semantic-free exposure relation으로 분리할 수 있는지와 用神·會支·格局으로 이어지는 경계; p.11의 `有情/無情` composition과 전이 조건
- p.5의 `乙逢午`·`丁逢酉` 음간 장생 예외를 어떤 입력관계로 재현할지

따라서 `rule.ziping.root-exposure.v0`는 generic all-stem root/exposure와 透干을 계속 `unresolved`로 둔다. exact-example inventory, 甲 root scan, p.7 exact local clause, p.10 named exposure inventory와 그 source role label 결과는 각각의 좁은 계약으로만 보존하고, 여러 match를 ranking하지 않는다. p.11 composition은 unresolved로 남긴다. 淵海의 지장간/십성 label inventory, 三命의 인원·사령 예시, 窮通·滴天髓의 계절 조건은 각각 별도 lineage 입력/출력으로 유지하고 통근·투간으로 합치지 않는다.

## Base 실행 검증

실제 frozen `tri-system-deterministic-base-v0` fixture에서 다음을 확인한다.

- Yuanhai·Sanming의 구조 frame, Sanming의 인원/오행 목록, Ziping의 지지 관계 목록, p.5 exact-example inventory와 p.16 甲 root scan은 재계산 없이 실행된다.
- 기존 서울 `계` fixture에서는 visible `甲`가 month 위치에 있고 branch `未`가 있어 p.16 predicate가 해당 root match를 deterministic result로 남긴다. `透/透干` 결과는 생성하지 않는다.
- 별도 `1997-04-12 08:30` exact fixture는 `甲生辰月`이고 hour visible stem이 `戊`이므로 p.10 structural inventory와 `偏财` source role label이 `Base FACT → lineage structural result → source-bounded semantic result` 순서로 재현된다. 결과에는 子平真詮 source ID, p.10 locator와 PDF SHA가 붙고 개인 의미는 없다.
- 별도 `1990-02-07 08:30` exact fixture는 `寅月`이고 supplied visible stems가 `경·무·계·병`이므로 p.7 structural contrast와 `同知得以作主` source clause가 두 번 실행해도 동일하게 재현된다. 이 결과에는 p.7 locator와 PDF SHA가 붙지만 generic 透/透干·global 用神 우선순위는 생성하지 않는다.
- 같은 서울 `계` fixture를 두 번 실행해도 p.10–11 context-bound relation은 derived result로 materialize되지 않고, generic `root-exposure` unresolved rule과 p.11 unresolved composition의 locator/provenance만 유지된다. 다른 lineage와의 merge나 semantic fallback도 없다.
- `갑` fixture에서는 hour branch `未`가 p.5의 `甲逢未`와 일치하여 해당 위치·기존 hidden-stem 목록·source category가 deterministic result로 남고, 일반 통근/투간 result는 생성되지 않는다. 기존 서울 `계` fixture에서는 exact-example match가 빈 inventory로 결정된다.
- 동일 지지쌍의 `충`·`형`은 동시에 유지되고 우선순위를 부여하지 않는다.
- 시간 미상·시주 누락·운 누락은 해당 rule을 `blocked_missing_base_fact` 또는 `not_executable_by_contract`로 닫는다.
- 甲木 전용 Ditian/Qiongtong rule은 계 일간 fixture에 적용하지 않는다.
- `noRecalculation=true`, `noSemanticInterpretation=true`, `commonRulePromotion=false`를 유지한다.

structural result contract를 같은 서울 fixture에 두 번 적용하면 동일한 결과 object가 재현된다. 서울 `계` fixture의 구조 결과 분류는 adopted contract 13개 중 `executable_rule` 8개, `derived_structural_result` 8개, `prerequisite_gap` 1개(窮通의 生旺/死绝 상태 resolver), unresolved 5개, unsupported 2개, not-applicable 4개(p.7/p.10 exact window 포함)다. p.10 exact fixture와 p.7 exact fixture의 semantic 결과는 각각 adopted semantic rule 1개와 derived source-bounded result 1개이며, p.11 unresolved composition은 결과를 내보내지 않는다. 상태 문자열과 일반 `twelveStage`를 test-only supplement로 넣어도 같은 prerequisite gap이 유지되고 Base는 변하지 않는다. 시간 미상 fixture에서는 淵海/三命의 완전한 네 기둥 rule과 exact-example/甲 root scan/p.7 contrast의 불완전 입력이 prerequisite gap으로 닫힌다. 별도 `갑` fixture에 test-only 계절 context를 공급하면 滴天髓와 窮通의 계절 창이 동시에 적용되지만, 두 결과는 `lineage_conflict`로 보존되고 병합 결과는 생성되지 않는다.

최소 fixture와 checker는 `test/sajuLineageReadingGrammar.test.js`에 있다.

## 다음 frontier

1. 窮通 p.2의 상태 resolver가 실제 source locator와 입력 shape까지 닫히는지 별도 확인한다. 일반 十二運星을 대입하지 않으며, 현재 Base에는 추가하지 않는다.
2. p.7 exact clause 밖의 global 用神变化 우선순위와 p.11의 會支·有情/無情 composition을 실행하려면 source-specific exposure input, 우선순위, 예외를 각각 별도로 닫는다.
3. p.10 exact lane 밖의 all-stem 통근·투간을 판정하려면 문헌별 완전한 정의·대상·우선순위·예외를 별도로 닫는다.
4. 운은 기존 timing authority frontier의 exact start-time·direction·conversion blocker를 먼저 닫는다.
5. 독립 textual witness와 판본/전승 관계가 확인되기 전까지 common rule을 생성하지 않는다.

semantic frontier는 p.7의 exact local clause와 p.10의 exact source-role lane만 닫혔다. 이는 공통 semantic grammar나 공개 Base 승격이 아니며, 다음 단계는 새 Base FACT 승격이 아니라 p.7 global 우선순위·p.11 composition·p.10 밖의 통근/투간 정의·우선순위·예외를 독립적으로 닫고, 계속 구조 결과와 source-bounded semantic result를 별도 계약으로 유지하는 것이다.
