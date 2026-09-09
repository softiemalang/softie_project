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
| `rule.yuanhai.dayun-branch-seun-stem-lens.v0` | 淵海子平 p.9, `論大運`, `大運看支·歲君看干` | frozen timing의 active 大運·歲君 FACT, exact `timeAccuracy` | 大運은 branch focus, 歲君/seUn은 stem focus인 source lens | 방향·기산일·나이 환산·길흉·예측으로 확장하지 않음 |
| `rule.sanming.four-pillars-month-hour-frame.v0` | 三命通會 p.69–70, `論遁月時`·`論年月日時` | 네 기둥 | 네 기둥 구조와 월간/시간 도출 절차 표면 | 현재 Base의 절기·일경계·진태양시를 원전 규칙으로 재계산하지 않음 |
| `rule.sanming.human-element-month-command.v0` | 三命通會 p.65–66, `論人元司事`·`論四時節氣` | 월지·월지장간 | 월령/인원 구조와 지장간 목록 | 한 사령 일수 예시를 전체 가중표로 일반화하지 않음 |
| `rule.sanming.element-generation-control.v0` | 三命通會 p.4–6 | 오행·기존 관계 FACT | 오행 목록·기존 천간관계 확인 | 균형·세력·개인 의미 도출 금지 |
| `rule.sanming.seasonal-state-inventory.v0` | 三命通會 p.67–68, `論五行旺相休囚死并寄生十二宮` | 월지·오행 분포 envelope | source seasonal window와 旺相休囚死 label inventory, p.68 twelve-label vocabulary | `未`의 六月土旺을 여름에 합치지 않음; 일반 十二運星·窮通 生旺/死绝·강약 결론 금지 |
| `rule.sanming.visible-stem-frame.v0` | 三命通會 p.162, `論古人立印食官财名义` | 일간·위치별 visible stem·exact `timeAccuracy` | p.162 역할 명명에 공급하는 day-master/visible-stem frame | 십성 재계산·가족 비유·길흉·개인 의미 금지 |
| `rule.ziping.branch-relation-inventory.v0` | 子平真詮 p.5, `論刑沖會合解法` | 지지 관계 목록 | 관계·지지·위치 목록, 동시 관계 보존 | 관계 우선순위·해소·변화·길흉 금지; `破/害/半合`은 이 locator의 증거로 확장하지 않음 |
| `rule.ziping.explicit-stem-branch-example-match.v0` | 子平真詮 p.5, `論刑沖會合解法` | 일간·네 지지·위치별 기존 지장간 목록 | p.5에 실제 열거된 stem–branch 예시의 일치 inventory만 산출 | 열거되지 않은 조합, 본기/중기/여기 전체표, 순위·강도·통근/투간 일반화 금지; `乙逢午`·`丁逢酉` 예외는 unresolved로 유지 |
| `rule.ziping.jia-root-branch-scan.v0` | 子平真詮 p.3 `論陰陽生死`, p.16 `論支中喜忌逢運透清` | 네 위치의 visible stem·branch, exact `timeAccuracy` | visible `甲`가 있을 때 `寅·亥·卯·未` root match와 `亥`–visible `壬/甲` source-named relation inventory | 甲 한정; 전 천간 mapping·p.3 음간/묘고 예외·p.5 순위·透/透干 일반화 금지 |
| `rule.ziping.chen-exposure-inventory.v0` | 子平真詮 p.10 `論雜氣如何取用` | 일간·월지·월지장간·네 위치 visible stem·exact `timeAccuracy` | 정확히 `甲生辰月`에서 원문에 열거된 `戊·癸·乙`의 위치별 named exposure inventory | 세 대상 밖의 透/透干·다른 월지/일간·會支·用神·格局으로 확장 금지 |
| `rule.ziping.yin-month-exposure-contrast.v0` | 子平真詮 p.7 `論用神變化`의 `不透甲而透丙` | 월지·네 위치 visible stem·exact `timeAccuracy` | 정확히 寅月에서 visible `甲` 부재와 단일 visible `丙` 노출의 source-local contrast inventory | 중복 丙·다른 월지·hidden-stem membership·일반 透/透干·global 用神 우선순위로 확장 금지 |
| `rule.ditian.heaven-earth-human-frame.v0` | 滴天髓 p.2, `通天論` | 네 위치의 visible stem·branch·hidden-stem FACT, exact time | 天元·地元·人元 frame | 숨은 줄기 가중·進退/順悖·개인 의미 금지 |
| `rule.ditian.branch-category-inventory.v0` | 滴天髓 p.10, `地支論` | 네 지지 FACT, exact time | 陽支/陰支·四生/四庫/四敗 membership | 沖·合·生旺 선호·결과로 확장하지 않음 |
| `rule.ditian.shape-example-inventory.v0` | 滴天髓 p.12, `形象論` | 일간·월지, exact time | 네 개 명시 `形全/形缺` example inventory | 열거 밖의 形象 classifier·강약·개인 의미 금지 |
| `rule.ditian.fang-ju-example-inventory.v0` | 滴天髓 p.13, `方局論` | 네 지지 FACT, exact time | `寅卯辰=東方`, `亥卯未=木局` exact set membership | 方/局 mixing·格局·행운 outcome 금지 |
| `rule.ditian.jia-wood-seasonal-condition.v0` | 滴天髓 p.4, `天干論 / 甲木` | 일간과 명시적 계절 FACT 필요 | frozen Base에는 실행하지 않는 甲木 condition window | 甲木 외 전이·성격·강약 결론 금지 |
| `rule.qiongtong.five-phase-number-inventory.v0` | 窮通寶鑑 p.2, `五行總論` | 오행 key envelope | 水一·火二·木三·金四·土五 number inventory | 生旺/死绝 연산·Base 분포 재계산 금지 |
| `rule.qiongtong.day-stem-section-frame.v0` | 窮通寶鑑 p.3–p.90, ten day-stem sections | 일간·exact time | 해당 일간의 source section page band | 월별 처방·용신·강약·개인 의미 금지 |
| `rule.qiongtong.five-phase-number-season-state.v0` | 窮通寶鑑 p.2, `五行總論` | 오행과 source-specific 상태 resolver 필요 | resolver 미완결인 double/half operation surface | 일반 十二運星·Base 분포·다른 lineage 상태 금지 |
| `rule.qiongtong.jia-wood-seasonal-clauses.v0` | 窮通寶鑑 p.4–5·p.7, `三春甲木`·`正月甲木`·`三夏甲木` | 甲 일간과 명시적 월령/계절 필요 | frozen Base에는 실행하지 않는 month clause window | 월별 문단을 보편 처방으로 통합하지 않음 |

## 병존·미해결·미지원

- 子平真詮의 global `用神`·`相神`·`用神變化`, 전 천간 통근·투간의 완전한 우선순위는 원문 구간은 있으나 현재 Base 입력과 규칙 완결성이 부족해 `unresolved`다. 다만 p.5 exact-example inventory, p.16의 甲 한정 root scan, p.10의 정확한 `甲生辰月` named exposure inventory, p.7의 exact `寅月·不透甲而透丙` local contrast는 각각 좁은 source-bounded rule로 채택했고, p.7은 원문 문구 `同知得以作主`를 local clause로만 보존하며 global 우선순위를 만들지 않는다.
- 子平真詮 p.15·p.25와 淵海子平 p.9의 운 surface 중, 淵海 p.9의 `大運看支·歲君看干` focus lens만 이미 공급된 timing FACT를 읽는 구조 결과로 닫았다. 방향·절기 거리·환산·정확한 기산일과 운의 결과 의미는 계속 `unresolved`다.
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
| 淵海 `dayun-branch-seun-stem-lens` | `timing.daYun` active cycle·`timing.seUn`·`timeAccuracy` | timing lens 자체 외 추가 prerequisite 없음 | `大運看支·歲君看干` → active branch/seUn stem focus와 fact refs | timing/active branch/seUn stem 누락; 방향·기산일·나이·길흉 추론 금지 |
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

### 子平真詮 23개 context-bound candidate closability

23개 `context_bound_candidate`를 현재 Base/structural result가 이미 공급하는 입력과 원문이 추가로 닫아야 하는 범위로 다시 대조했다. `SAJU_ZIPING_CANDIDATE_CLOSABILITY`에는 23개 전부를 보존하며, 승격을 시도할 근거리 후보는 1개만 둔다.

| 분류 | 대상 | 현재 닫힌 입력 | 단 하나의 추가 확인 또는 고정 이유 |
|---|---|---|---|
| `near_candidate` | p.4 `inventory.ziping.p4-stem-combination-nonmerge.v0` | 기존 `stemRelations`의 stem pair·position·합 상태 | 원문이 직접 규정한 해당 pair의 separation/distance와 合/合化 우선 조건 한 묶음만 source locator에서 재확인하면, 관찰된 window의 구조적 non-merge qualification을 좁힐 수 있다. 일반 합·합화 classifier로 확장하지 않는다. |
| `v0_frozen` (22개) | p.3 stem-combination role, p.5 relation resolution, p.7 나머지 用神 변화, p.6/8/9/10 用神·相神·純雜·成敗, p.12–13 pattern, p.17–27 role/pattern/timing | 일부 stem/branch/relation FACT는 존재 | source use/pattern 선행 바인더, 복수 결과의 우선·전이, 운 입력, 또는 개인/길흉 출력이 둘 이상 남는다. `requiredStructuralResult.closure`의 원인을 그대로 유지하고 modern practice·다른 lineage·자유 synthesis로 채우지 않는다. |

따라서 근거리 후보도 아직 executable rule로 승격하지 않았다. 子平真詮 inventory 기준 신규 semantic executable rule은 0개이고, 기존 p.7·p.10 두 contract만 실행된다. p.4 후보는 `near_candidate`라는 연구 우선순위일 뿐 source-defined distance/precedence 확인 전에는 결과를 materialize하지 않는다. 三命通會 p.162의 별도 role-nomenclature rule은 다음 lineage section에서 독립적으로 판정한다.

## 淵海子平 독립 lineage 전권 inventory v0

대상 local witness는 `/Users/hangyukim/Documents/malang_lab/documents/淵海子平.pdf` 202쪽, 2,710,282바이트, SHA-256 `c6225b78d9d49282c5699b63315018a1e17ebf091c50ce4feb3dab465ec25a12`다. p.2의 Wikisource 출처 경고와 PDF 표지의 `杨淙` 표기를 직접 확인했지만, 판본·물리적 전승·독립 textual authority는 여전히 `UNRESOLVED`다. p.1–199의 본문 surface를 page render로 훑고 대표 heading/문구를 직접 대조했으며, p.200–202의 digital-edition 안내·기여자 페이지는 source rule inventory에서 제외했다.

기계적으로는 `SAJU_YUANHAI_RULE_INVENTORY`가 각 page surface에 `sourceIds`, `locatorIds`, `applicability`, `requiredStructuralResult`, `sourceDefinedOutput`, `exceptions`, `forbiddenExtensions`를 보존한다. source identity가 unresolved라는 이유만으로 local rule을 전부 차단하지는 않되, 출력이 닫힌 구조 frame인지와 semantic/personal outcome인지 별도로 판정했다.

| locator 범위 | 구조 입력 → 원문 surface | 상태 | 판정/금지 확장 |
|---|---|---|---|
| p.2 `yuanhai-p2-foundation` | 천간 polarity와 named role-label opening | `context_bound_candidate` | 뒤따르는 가족·결과 문맥과 role 우선순위가 닫히지 않아 label-only candidate로 유지 |
| p.4 `yuanhai-p4-hidden-stems-and-ten-god-labels` | 공급된 위치별 지장간·visible 십성 라벨 → label inventory | `adopted_structural_rule` | 기존 `hidden-stem-ten-god-label-inventory` contract로 실행; 사령·반복 우선·개인 의미 금지 |
| p.5 `yuanhai-p5-hidden-stem-song-and-generation-control` | 지지 장간가와 생극제화 어휘 | `unresolved` | source service 범위·완전표·우선순위가 없어 현대 지장간 가중표/三命 service-day로 보완 금지 |
| p.6–7 `yuanhai-p6-day-as-host`, `yuanhai-p7-month-command` | 일간·연/월/일/시주 → day-anchor/month-command role frame | `adopted_structural_rule` | 기존 `day-anchor-month-command-frame` contract; 강약·용신·사건 의미 금지 |
| p.8 `yuanhai-p8-taisui-annual-judgment` | 세운/太歲 관계 → 吉凶·征太歲 outcome | `unsupported` | 연간 outcome/예측은 공개 structural grammar 밖 |
| p.9 `yuanhai-p9-dayun-focus-lens` | frozen timing의 active 大運 branch와 seUn/歲君 stem → `大運看支·歲君看干` focus | `adopted_structural_rule` | 신규 `dayun-branch-seun-stem-lens`로만 실행; 방향·기산일·나이 환산·길흉 없음 |
| p.9–10 `page.local.yuanhai.p9-dayun-section`, `yuanhai-p8-taisui-annual-judgment` | 운·歲君 transition과 사례 → timing/outcome clauses | `unresolved` | 정확한 방향·절기거리·환산·전이 우선순위가 닫히지 않음 |
| p.11–14 `yuanhai-p11-disease`, `yuanhai-p13-temperament`, `yuanhai-p14-stem-body-poems` | 오행/천간 입력 → 질병·성정·신체 poetic meaning | `unsupported` | 건강·성격·개인 특성으로 확장하지 않음 |
| p.17–35 `yuanhai-p17-injury-officer` 외 role locators | role/관계/pattern 입력 → 傷官·財·官·偏官·印綬 case | `context_bound_candidate` | chapter별 조건·강약/격국·source priority가 필요; 일반 십성 의미표로 합치지 않음 |
| p.48–66 `yuanhai-p48-six-relations`, `yuanhai-p56-womens-fate` | 육친·성별 입력 → 가족/배우자/女命 outcome | `unsupported` | 개인·가족·성별 semantic은 공개 contract 밖 |
| p.67–80 `yuanhai-p67-ziping-essentials`, `yuanhai-p69-preferences`, `yuanhai-p80-miscellaneous-maxims` | 압축歌訣·喜忌·잡론 → 읽기 순서와 semantic maxims | `unresolved` | 압축 문구의 조건·예외·출력과 전역 우선순위가 완결되지 않음 |
| p.90–103 `yuanhai-p90-late-rule-collection`, `yuanhai-p103-omens-fu` | 후대 편찬 rule/妖祥賦 → role·운·개인 결과 | `unresolved` | 편찬 surface의 독립 rule identity·non-outcome output 미완결 |
| p.104–161 `yuanhai-p110-omens-fu-continuation` | 편찬 산문·賦·訣의 반복 조건 | `unresolved` | page range 자체를 rule로 취급하지 않으며 source-complete predicate 없음 |
| p.162–164 `yuanhai-p162-wanjin-fu`, `yuanhai-p164-jiechisu-miao-jue` | 萬金賦·畢要捷馳玄妙訣의 role/timing 문구 | `unresolved` | 월령·격·운·결과가 섞여 priority/transition 미완결 |
| p.165–199 `yuanhai-p173-four-line-independent-step`, `yuanhai-p197-eight-character-summary`, `yuanhai-p199-compilation-summary` | 四言獨步·撮要·會要 요약 surface | `unresolved` | summary prohibition/role clauses는 inventory로 보존하되 composition/semantic output을 만들지 않음 |

### 淵海 채택 결과와 공통 후보

- `adopted structural rules`: 기존 p.4 label inventory, 기존 p.6–7 day-anchor/month-command frame, 신규 p.9 大運/歲君 focus lens의 3개다.
- `adopted semantic rules`: 0개. p.8·p.11–14·p.17 이후 문헌은 source-local semantic 문맥은 있으나 공개 contract의 비개인적 구조 출력으로 닫히지 않았다.
- `context-bound candidates`: p.2 opening labels와 p.17–35 role chapters. 필요한 role/pattern/priority를 별도로 닫기 전에는 실행하지 않는다.
- `unresolved`: p.5 service scope, p.9–10 timing composition, p.67–80 압축 maxims, p.90 이후 편찬·歌訣 surface.
- `unsupported`: 太歲吉凶, 질병·성정·신체, 육친·女命 등 개인/결과 영역.
- `common candidates`: `[]` 유지. 淵海의 `日为主·月为提纲` 또는 p.9 focus가 子平·三命과 유사해 보여도 독립 textual collation이 닫히지 않았으므로 common rule로 합치지 않는다.
- `composition readiness`: `compositionReady=false` 유지. source가 동시 결과의 전역 우선·결합·전이 규칙을 직접 닫지 않았으며, 새 p.9 lens도 단일 구조 focus 결과일 뿐 composition 규칙이 아니다.

## 三命通會 독립 lineage 전권 inventory v0

대상 local witness는 `/Users/hangyukim/Documents/malang_lab/documents/三命通會.pdf` 370쪽, 7,601,079바이트, SHA-256 `f09bce7c6dbe1e222746ad8c97f49d132ed4e8da6d3c1d0399b0824b3794593f`다. PDF 표지/본문의 `三命通會`·萬民英 표기를 확인했지만, 판본·물리적 전승·독립 textual authority는 기존 admission boundary대로 `UNRESOLVED`다. p.4–p.370의 heading과 대표 본문을 직접 대조해 page surface를 묶었고, 비슷한 문구를 子平真詮·淵海子平에서 보충하지 않았다.

기계적으로는 `SAJU_SANMING_RULE_INVENTORY`가 15개 surface를 `sourceIds`, 직접 locator, applicability, required structural result, source-defined output, 예외, 금지 확장, composition 상태와 함께 보존한다. 현재 분류는 adopted structural 5개, adopted semantic 1개, context-bound candidate 4개, unresolved 1개, unsupported 4개다. `commonCandidates=[]`와 `compositionReady=false`는 그대로다.

| locator 범위 | 구조 입력 → 원문 surface | 상태 | 판정/금지 확장 |
|---|---|---|---|
| p.4–6 `sanming-p4-element-generation` 외 | 오행·천간/지지 관계 FACT → 생극제화 vocabulary/inventory | `adopted_structural_rule` | 기존 `element-generation-control` 계약; 숫자·방향 문구로 Base 재계산하거나 세력·개인 의미로 확장하지 않음 |
| p.65–66 `sanming-p65-human-element-and-month-command` 외 | 월지·공급된 지장간 → 人元/月令 inventory | `adopted_structural_rule` | 기존 계약; p.66의 한 사령 일수 예시를 전체 가중표로 만들지 않음 |
| p.67–68 `sanming-p67-seasonal-state`, `sanming-p68-twelve-palace-vocabulary` | 월지 → 春木/夏火/六月土/秋金/冬水 window와 旺相休囚死 labels, p.68 twelve-label vocabulary | `adopted_structural_rule` | `未`는 별도 `long_summer`로 유지; 이는 source vocabulary/classification일 뿐 균형·강약·용신이 아니다. 일반 十二運星 또는 窮通 상태로 대체하지 않음 |
| p.69–70 `sanming-p69-month-hour-method` 외 | 네 기둥 → year/month/day/hour frame와 month-from-year/hour-from-day procedure label | `adopted_structural_rule` | 기존 계약; 절기·일경계·진태양시를 三命 rule로 재계산하지 않음 |
| p.72 `sanming-p72-fetal-and-seat` | source 胎元/坐命官 조건 → 계산 surface | `context_bound_candidate` | 현재 Base와 source policy bridge가 닫히지 않아 값 materialize 안 함 |
| p.73–77 `sanming-p73-dayun-procedure` 외 | 성별·절기거리·방향·기산·환산·운 전이 → 大運 절차 | `context_bound_candidate` | 원문 수식은 locator로 보존하지만 timing engine·운의 길흉·예측으로 승격하지 않음 |
| p.78–93 `sanming-p78-stem-combination` 외 | 천간합/化氣·六合/三合·刑/沖 → composition/priority 후보 | `unresolved` | source 내부 우선관계·예외·전이 출력이 하나의 계약으로 닫히지 않아 합화 winner를 만들지 않음 |
| p.95–105 `sanming-p95-stem-lu` 외 | 禄/驛馬 이름과 줄기·지지 조건 → relation inventory 후보 | `context_bound_candidate` | source input axis와 non-outcome 경계 추가 확인 전에는 현대 신살표를 사용하지 않음 |
| p.106–130 `sanming-p106-shensha` 외 | 神煞 섹션 → mapping·吉凶 clauses | `unsupported` | 공개 Base에서 신살 이름을 개인 의미·길흉으로 materialize하지 않음 |
| p.137–159 `sanming-p137-stem-branch-outcomes` 외 | 월·시·운·오행 조건 → 吉凶/富貴/지역·계절 결과 | `unsupported` | outcome surface는 공개 grammar 밖; p.67 상태를 개인 결과로 바꾸지 않음 |
| p.162 `sanming-p162-role-nomenclature` | visible-stem frame + frozen visible 십성 label inventory → source role label inventory | `adopted_semantic_rule` | `印綬/枭/食神/傷官/正官/偏官/妻財/劫` 명명만 보존. 가족 비유, 격국, 용신, 길흉, 개인 의미로 확장하지 않음; 비견 등 p.162 좁은 vocabulary 밖 label은 fail-closed |
| p.164–239 `sanming-p164-239-role-chapters` | 官/財/印/食 chapter 조건 → role qualification | `context_bound_candidate` | 월령·관계·지원/제어·격국·우선관계가 chapter별로 필요하며 일반 십성 의미표로 통합하지 않음 |
| p.242–261 `sanming-p242-261-personal-surfaces` | 性情·疾病·女命·六親 입력 → 개인/가족 결과 | `unsupported` | 공개 semantic grammar 밖 |
| p.300–370 `sanming-p300-370-worked-cases` | 時斷/사례 입력 → case-bound outcome | `unsupported` | 단일 사례를 universal predicate나 예측으로 일반화하지 않음 |

### 三命通會 채택 결과와 공통 후보

- `adopted structural rules`: p.4–6 생극제화 vocabulary, p.65–66 人元/月令 inventory, p.67–68 seasonal state vocabulary, p.69–70 four-pillar frame, p.162 semantic rule의 visible-stem prerequisite frame 등 5개다.
- `adopted semantic rules`: p.162의 source role-nomenclature 1개다. 이 결과는 frozen visible 십성 label을 source label로 옮기는 명명 inventory일 뿐, p.162의 부모·자식·관직·처재 비유나 결과 문장을 실행하지 않는다.
- `context-bound candidates`: 胎元/坐命官, 大運 절차, 禄/驛馬 mapping, p.164–239 role chapters다. 필요한 단일 source 조건·입력 axis·우선관계가 닫히기 전에는 materialize하지 않는다.
- `unresolved`: p.78–93 합·화기·刑沖 composition. 동시 결과의 우선·결합·전이를 source가 현재 contract만으로 닫지 않는다.
- `unsupported`: p.106–130 神煞, p.137–159 吉凶/富貴 및 지역·계절 outcome, p.242–261 개인/가족 표면, p.300–370 사례 outcome.
- `common candidates`: `[]` 유지. p.67 계절 상태, p.69 일간/월령, p.162 역할 명명이 다른 문헌과 비슷해도 독립 textual collation이 닫히지 않았으므로 common rule로 통합하지 않는다.
- `composition readiness`: `compositionReady=false`. p.78–93과 p.164 이후의 복수 semantic surface는 병존·충돌 보존만 가능하며 winner/다수결/자유 synthesis를 하지 않는다.

실제 frozen Base fixture에서 p.67 결과는 `진/辰` 월지를 `spring`으로 읽고 `{목: 旺, 화: 相, 수: 休, 금: 囚, 토: 死}`와 p.68의 12개 label을 결정적으로 반환한다. p.162 역할 rule은 p.7 fixture의 supplied visible label inventory를 `印綬/妻財/正官/傷官/食神` source labels로 보존한다. p.10 fixture처럼 `비견`이 섞여 p.162 좁은 vocabulary 밖이면 결과를 materialize하지 않고 `not_executable_by_contract`와 미지원 label을 남긴다. visible stem 누락은 structural prerequisite gap, prerequisite conflict는 `preserved_tension_fail_closed`로 닫히며 다른 lineage 결과와 합치지 않는다.

### composition grammar frontier

p.3–4의 합 관계, p.8–9의 纯/杂·成败 전이, p.11의 透干·會支·有情/無情, p.12의 破格/成格가 동시에 성립할 수 있는 surface다. 그러나 원문은 이 결과들의 전역 우선순위·결합 연산·상태 전이표를 직접 제공하지 않는다. 따라서 `compositionReady=false`로 두고 결과를 병존시키며, winner 선택·다수결·문헌 간 합성·현대적 synthesis를 금지한다. 특히 p.11의 `有情而卒成无情`과 `无情而终有情`은 단일 정적 분류가 아니라는 직접 경계로 보존한다.

### inventory에서 contract로 승격하지 않은 이유

三命通會 p.162의 좁은 role-nomenclature를 제외하면 새 executable semantic rule은 없다. candidate/unresolved 항목들은 공통적으로 (a) source가 먼저 선택한 用神·格局을 요구하거나, (b) 여러 결과의 우선/전이를 닫지 않거나, (c) 출력이 吉凶·개인 관계·예측으로 넘어간다. 이 gap을 Base FACT, 현대 통관표, 다른 원전 lineage, 자유 자연어 추론으로 채우지 않았다. p.7·p.10과 p.162 결과 모두 `Base FACT → lineage structural result → source-bounded semantic result → provenance` 순서를 유지한다.

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

## 滴天髓 독립 lineage inventory v0

대상 local witness는 `/Users/hangyukim/Documents/malang_lab/documents/滴天髓.pdf` 158쪽, 8,694,949바이트, SHA-256 `6285805c91b79f1b5bccdfce1cdab1d7ec684731160b4191a25e8f1d23c229dd`다. `通天論`·`地支論`·`形象論`·`方局論`·`格局論`·`體用論`을 직접 render로 대조했지만 edition·전승·독립 authority는 기존 admission boundary대로 `UNRESOLVED`다.

분류는 `SAJU_DITIAN_RULE_INVENTORY`에 10개 surface로 보존된다. adopted structural 4개, context-bound candidate 3개, unresolved 3개, adopted semantic 0개다.

| locator | 관찰된 입력 → 출력 surface | 상태 | 닫힘/경계 |
|---|---|---|---|
| p.2 `ditian-p2-heaven-earth-human-frame` | 네 기둥 visible stem/branch/hidden stem → 天元/地元/人元 frame | `adopted_structural_rule` | supplied frame만 보존; 숨은 줄기 가중·계절 세력·개인 의미 없음 |
| p.3 `ditian-p3-progress-retreat-shunbei` | 氣/勢·進退·順悖 문맥 → 조건/출력 후보 | `unresolved` | `順則吉/悖則凶`가 붙고 source condition procedure가 닫히지 않음 |
| p.4–7 `ditian-p4-jia-wood-seasonal-conditions` | 일간·계절·根/지원 → 甲木 계절 clause | `context_bound_candidate` | 계절 FACT bridge와 clause boundary가 없고 다른 일간으로 전이 불가 |
| p.10 `ditian-p10-branch-categories` | 네 지지 → 陽支/陰支·四生/四庫/四敗 membership | `adopted_structural_rule` | 중복 membership은 보존; `生方怕動/庫宜開/沖`의 결과 문장은 적용하지 않음 |
| p.12 `ditian-p12-shape-examples` | 일간·월지 → 명시된 甲/丙/戊/庚의 形全/形缺 example | `adopted_structural_rule` | 네 개 exact pair만; 일반 形象 classifier 아님 |
| p.13 `ditian-p13-fang-ju-examples` | 네 지지 → `寅卯辰=東方`·`亥卯未=木局` exact set | `adopted_structural_rule` | 方/局을 동시에 보존하고 winner·mixing을 선택하지 않음 |
| p.13–14 `ditian-p13-p14-geju-surface` | 月支之神·透干 → 格局/선택 문맥 | `context_bound_candidate` | `透干` 보편 predicate·格局 우선순위·semantic output이 닫히지 않음 |
| p.15–17 `ditian-p15-p17-conghua-dayun` | 從化·歲運 → 조건/운 결과 | `context_bound_candidate` | 절차·전이·결과 경계가 닫히지 않음 |
| p.18–20 `ditian-p18-p20-tiyong` | 體/用 여러 축 → composition | `unresolved` | 體用之用과 用神之用을 구분하지만 configuration priority/transition이 없음 |
| p.24–27 `ditian-p24-p27-yuanliu-qingzhuo` | 源流·清濁·後續形象 → 구조/결과 문맥 | `unresolved` | 단일 재현 predicate와 non-outcome output이 닫히지 않음 |

따라서 Ditian의 executable surface는 p.2/p.10/p.12/p.13의 구조 inventory뿐이다. p.3의 進退·順悖, p.13–14의 格局, p.18–20의 體用은 semantic/composition 후보로만 유지한다. source 문장이 계절·용신·격국·길흉 문맥을 갖는다는 이유로 Base count, 현대 신강/용신표, 다른 lineage 결과를 보충하지 않았다.

## 窮通寶鑑 독립 lineage inventory v0

대상 local witness는 `/Users/hangyukim/Documents/malang_lab/documents/穷通宝鉴.pdf` 92쪽, 1,547,911바이트, SHA-256 `36d54cdc995d203fdceafcb52b2a0d4f57093ab1765c532db5418b46a96c4b19`다. p.2와 p.3–p.90의 열 개 일간 section 및 대표 월별 문단을 직접 대조했지만 edition·전승·독립 authority는 `UNRESOLVED`다.

`SAJU_QIONGTONG_RULE_INVENTORY`는 13개 surface를 보존한다. adopted structural 2개, context-bound candidate 10개, unresolved 2개, adopted semantic 0개다.

| locator 범위 | 입력 → source surface | 상태 | 경계 |
|---|---|---|---|
| p.2 `qiongtong-p2-five-phase-number-and-season` | 오행 key envelope → 水一·火二·木三·金四·土五 | `adopted_structural_rule` | number inventory만; 生旺/死绝 double/half 미적용 |
| p.2 같은 locator | 원소·生旺/死绝 → double/half | `unresolved` | 상태 resolver·입력 shape·우선/예외가 없음. 일반 十二運星을 대입하지 않음 |
| p.3–p.90 ten section locators | 일간 → 해당 일간 section page band | `adopted_structural_rule` | heading/frame만; 월별 처방을 선택하지 않음 |
| p.4–p.12 甲, p.13–p.20 乙, p.21–p.31 丙, p.32–p.39 丁, p.40–p.48 戊, p.49–p.54 己, p.55–p.64 庚, p.64–p.73 辛, p.75–p.82 壬, p.83–p.90 癸 | 일간·정확한 월/계절·필수 조건 → month clause | `context_bound_candidate` | 문단은 처방/결과 문맥이며 cross-month priority가 닫히지 않음 |
| p.2 및 p.3–p.90 | 여러 section 동시 성립 → selection/transition | `unresolved` | source가 전역 우선순위·결합·전이 규칙을 직접 제공하지 않음 |

기존 `rule.qiongtong.five-phase-number-season-state.v0`의 source-specific 生旺/死绝 prerequisite gap은 그대로 보존한다. 새 p.2 number rule은 그 gap을 우회하지 않고 숫자 어휘만 실행한다. 기존 甲木 seasonal clause는 explicit context가 없는 frozen Base에서 semantic result를 만들지 않으며, 새 inventory에서는 month-specific candidate로 분류한다.

## 다섯 source 비교·common/composition 판정

`淵海子平`·`三命通會`·`子平真詮`·`滴天髓`·`窮通寶鑑`의 유사한 일간/월령/계절 언급은 입력 axis와 출력이 실질적으로 동일하지 않다. 예를 들어 Sanming의 旺相休囚死 window, Ditian의 exact 形全/形缺 example, Qiongtong의 day-stem section frame은 모두 다른 predicate와 output이다. 그러므로 `commonCandidates=[]`를 유지하고 `SAJU_FIVE_LINEAGE_COMPOSITION_READINESS.compositionReady=false`로 고정했다.

공통 후보 review는 다섯 source ID와 대표 rule ID를 함께 기록하지만 `not_emitted_as_common_candidate`다. 각 lineage의 결과는 `lineage`, source locator, contract provenance를 보존하며 서로의 빈칸을 채우지 않는다. explicit source priority·combination·transition이 없는 p.11 會支/有情·無情, Ditian 體用/格局, Qiongtong month prescriptions, Sanming relation chapters는 병존 또는 unresolved로만 둔다. 다수 source의 주제 유사성은 상호검증이나 다수결이 아니다.

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

structural result contract를 같은 서울 fixture에 두 번 적용하면 동일한 결과 object가 재현된다. 현재 adopted contract 22개 중 서울 `계` fixture의 구조 결과 분류는 `executable_rule` 15개, `derived_structural_result` 15개, `prerequisite_gap` 1개(窮通의 生旺/死绝 상태 resolver), unresolved 5개, unsupported 2개, not-applicable 6개다. 새 Ditian p.2/p.10과 Qiongtong p.2/p.3–p.90 frame은 실제 FACT에서 실행되고 p.12/p.13 exact example은 해당 fixture에서 `not_applicable`로 닫힌다. 새 淵海 p.9 결과도 `lineage=yuanhai_local_export`, locator `yuanhai-p9-dayun-focus-lens`, `noSemanticMeaning=true`로만 materialize된다. p.10 exact fixture와 p.7 exact fixture의 子平 semantic 결과는 각각 adopted semantic rule 1개와 derived source-bounded result 1개이며, p.7 fixture에서는 三命 p.162 role-nomenclature result도 별도 lineage로 materialize된다. p.10 fixture에 `비견`이 섞이면 三命 p.162 결과는 좁은 source vocabulary 밖으로 fail-closed한다. p.11 unresolved composition은 결과를 내보내지 않는다. 상태 문자열과 일반 `twelveStage`를 test-only supplement로 넣어도 같은 prerequisite gap이 유지되고 Base는 변하지 않는다. 시간 미상 fixture에서는 淵海/三命의 완전한 네 기둥 rule과 p.9 timing lens 및 exact-example/甲 root scan/p.7 contrast의 불완전 입력이 prerequisite gap으로 닫힌다. 별도 `갑` fixture에 test-only 계절 context를 공급하면 기존 Ditian/Qiongtong seasonal window가 동시에 적용되지만, 두 결과는 `lineage_conflict`로 보존되고 병합 결과는 생성되지 않는다.

최소 fixture와 checker는 `test/sajuLineageReadingGrammar.test.js`에 있다.

## 다음 frontier

1. 窮通 p.2의 상태 resolver가 실제 source locator와 입력 shape까지 닫히는지 별도 확인한다. 일반 十二運星을 대입하지 않으며, 현재 Base에는 추가하지 않는다.
2. p.7 exact clause 밖의 global 用神变化 우선순위와 p.11의 會支·有情/無情 composition을 실행하려면 source-specific exposure input, 우선순위, 예외를 각각 별도로 닫는다.
3. p.10 exact lane 밖의 all-stem 통근·투간을 판정하려면 문헌별 완전한 정의·대상·우선순위·예외를 별도로 닫는다.
4. 운은 기존 timing authority frontier의 exact start-time·direction·conversion blocker를 먼저 닫는다.
5. 독립 textual witness와 판본/전승 관계가 확인되기 전까지 common rule을 생성하지 않는다.

semantic frontier는 p.7의 exact local clause와 p.10의 exact source-role lane만 닫혔다. 이는 공통 semantic grammar나 공개 Base 승격이 아니며, 다음 단계는 새 Base FACT 승격이 아니라 p.7 global 우선순위·p.11 composition·p.10 밖의 통근/투간 정의·우선순위·예외를 독립적으로 닫고, 계속 구조 결과와 source-bounded semantic result를 별도 계약으로 유지하는 것이다.

## Source-bounded semantic lexicon v0

다섯 문헌에서 원문이 직접 부여한 용어·역할·상태·작용 어휘만 `saju-source-bounded-semantic-lexicon-v0` inventory로 보존했다. 이 lexicon은 현대적 의미표나 개인 해석 사전이 아니며, `SAJU_LINEAGE_READING_GRAMMAR.sourceBoundedSemanticLexicon`으로 기존 grammar와 분리된다. 각 entry는 다음을 함께 가진다.

- source/lineage, 직접 locator, source term, 대상 symbol/structure
- 직접 지원되는 wording/role/state 범위와 적용 전제
- 예외·미완결 조건·금지 확장, source byte SHA provenance
- 필요한 structural result와 연결된 lineage rule/semantic rule ID
- `adopted_semantic_entry`, `context_bound_entry`, `unresolved`, `unsupported` 상태

현재 inventory는 43개다. 子平真詮은 adopted 3, context-bound 3, unresolved 1, unsupported 1; 淵海子平은 adopted 2, context-bound 1, unresolved 1, unsupported 2; 三命通會는 adopted 5, unresolved 1, unsupported 1; 滴天髓는 adopted 4, context-bound 2, unresolved 2; 窮通寶鑑은 adopted 1, context-bound 11, unresolved 1, unsupported 1이다. 전체 합계는 adopted 15, context-bound 17, unresolved 6, unsupported 5다. adopted는 원문 용어/구조 frame이 닫혔다는 뜻이며, 자동으로 개인 의미나 semantic synthesis를 뜻하지 않는다.

직접 닫힌 범위는 子平真詮 p.3의 생사 단계 어휘, p.7의 exact `不透甲而透丙` clause, p.10의 `甲生辰月` role-label lane; 淵海子平 p.6·p.9의 day/timing frame; 三命通會 p.4–6·p.65–68·p.162의 구조/role nomenclature; 滴天髓 p.2·p.10·p.12·p.13의 `天元/地元/人元`, branch category, `形全/形缺`, `方/局`; 窮通寶鑑 p.2의 오행 수치 vocabulary다. p.3의 `有根/無根`, p.5 관계 작용, p.11 `有情/無情`, Ditian p.3·p.13–14의 문맥 용어, Qiongtong의 월별 일간 절은 context-bound로만 둔다. 用神 선택, 生旺/死絶 resolver, 복수 결과 조합·우선순위, 육친·성격·길흉·예측은 unresolved 또는 unsupported로 유지한다.

기존 source-bounded semantic rule과의 연결은 子平真詮 p.7·p.10 및 三命通會 p.162의 이미 채택된 lane으로 한정한다. 그 외 adopted entry는 기존 structural result가 제공하는 source vocabulary만 연결하며, 여러 entry를 합성하거나 다른 lineage와 병합하지 않는다. `commonSemanticCandidates=[]`, `compositionReady=false`, `personalMeaning=false`, `crossLineageMerge=false`를 유지한다. 다섯 문헌의 비슷한 단어는 입력·조건·출력 범위가 실질적으로 동일하다고 입증되지 않았으므로 common semantic 후보로 올리지 않았다.

실제 fixture에서 동일 입력의 lookup은 동일한 entry/result/provenance chain을 재현한다. structural result 또는 semantic result가 없거나, source/lineage가 어긋나거나, 충돌이 보존된 경우에는 winner나 fallback을 만들지 않고 각각 blocked/ambiguous로 닫힌다. 이 변경은 Deterministic Base, Constitution, 계산·activation 경계와 공개 Base 필드를 변경하지 않으며, lexicon 자체도 개인에 대한 interpretation hypothesis를 생성하지 않는다.
