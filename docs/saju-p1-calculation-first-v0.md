# Saju P1: calculation-first bounded scan

**`no executable classical temperament rule found in bounded scope`**

이번 P1은 phrase-first 후보 재사용을 멈추고, 현재 엔진이 의미와 범위를 함께 내보내는
값에서 출발했다. 기존 로컬 source corpus의 source-local 문맥만 사용해 후보를 최대
3개로 제한했고, `旺相`, `帶`, `格局`, `得氣` 또는 relation-to-person 같은 미정의
semantic bridge가 필요한 항목은 즉시 제외했다.

## 계산 출발점

부모는 기존 회귀 fixture `val-solar-normal`을 같은 코드로 재계산했다. 사용자 명식은
아니다. 전체 receipt hash는 `4bdfc89df2c45424080fa109a0a508efde037d5b734f3d56daa7749bb2ad5319`로
기존 값과 일치했다.

| 엔진 경로 | 이번 관찰값 | 범위 |
|---|---|---|
| `raw.dayMaster` | 계 / 음 / 수 | 일간 stem·음양·오행 |
| `raw.pillars.month` | 갑진 | 월주 stem·지지 |
| `raw.tenGods.visible` | 편재 1, 편관 3, 상관 1, 정관 1, 정재 1 | 천간과 지지 본기 투영의 집계 |
| `raw.tenGods.hidden` | 편관 1.2, 비견 0.4, 편인 0.1, 정관 0.7, 식신 0.4, 정재 0.6, 정인 0.3, 편재 0.3 | 지장간 가중 집계 |
| `raw.season` | 월지 진, seasonElement 목, 가중치 목 0.8·토 0.6·수 0.2 | 월지 기반 계절 출력 |
| `raw.strength` | base/adjusted 모두 weak | 기존 실험 강약 출력 |
| `raw.branchRelations` | basis `reference_pillars`, 현재 관계 파·충·형 | 원국 지지 pair/group 계산과 제한된 범위 |

## 후보 최대 3개와 즉시 제외

| source-local 후보 | 직접 대응을 시도한 엔진 값 | 제외 사유 |
|---|---|---|
| 淵海子平 p.2–4 `以乙为例见乙：为比肩、兄弟、朋友` | `raw.tenGods.visible/hidden`, 일간·각 pillar stem | `见`의 정확한 operand와 현재 집계의 표면/본기·지장간 범위가 다르다. `朋友`를 개인 behavior_style로 바꾸는 문맥도 없다. |
| 滴天髓 p.4 `五阳得阳之气...阳刚；五阴得阴之气...阴顺` | `raw.dayMaster.yinYang`, stem, strength | source 조건은 단순 음양이 아니라 `得阳之气/得阴之气`와 `势盛/势衰`다. 이 기세 판정이 엔진 값으로 닫히지 않고, 인접한 甲木 문맥을 현재 癸 일간에 일반화할 수 없다. |
| 子平真诠 p.5 `三方为会，朋友之意也；并对为合，比邻之意也` | `raw.branchRelations.items[*].relation/positions` | 지지 관계의 구조 gloss이지 개인 temperament/behavior_style 규칙이 아니다. `三会/三方`와 현재 `三合/方合` 라벨도 일대일로 닫히지 않는다. |

세 문맥의 직접 관찰과 provenance 상태는 [source-evidence.json](../artifacts/saju-p1-calculation-first-v0/source-evidence.json)에,
계산 snapshot·후보 판정·입력 hash는 [search-record.json](../artifacts/saju-p1-calculation-first-v0/search-record.json)에 남겼다.
각 PDF의 local byte identity는 확인했지만 판본·전승·독립 witness는 승격하지 않았다.

## 종료 판정

세 후보 모두 semantic-bridge gate에서 제외되어 bounded adjudication 대상으로 남은 후보가
없다. 따라서 `admittedRules=[]`, `executablePredicate=null`이며 다음 상태로 종료한다.

> `no executable classical temperament rule found in bounded scope`

사용자 claim·reflection·다른 lens 비교·새 interpretation rule·adapter·UI는 만들지
않았다. 계산, historical authority, readiness, activation도 변경하지 않았다.
