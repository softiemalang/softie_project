# Saju P1: 월령·官星印綬 — bounded 재검토 종료

**선택 후보 1개 / 적용 rule 0개 / 현재 P1 적용 불가 고정.**

기존 Saju 원전·검증 corpus에서 다음 작은 temperament 후보만 탐색했다.

> `月为提纲，带官星印绶，则慷慨聪明、见识高人。`

이 기록은 원문 locator, rule provenance, 현재 계산 필드와의 구조적 대응 가능성만 보존한다.
실행 predicate는 만들지 않았고, 사용자 claim·reflection·다른 lens 비교도 만들지 않았다.
동일 source 권역의 bounded 재검토에서 조건 정의가 닫히지 않아 이 후보는
`NOT_APPLICABLE_FIXED_CURRENT_P1`로 고정한다.

## 원문과 provenance

부모가 기존 로컬 witness `/Users/hangyukim/Documents/malang_lab/documents/淵海子平.pdf`의 p.6과 p.7을 다시 렌더링해 직접 확인했다. 파일은 2,710,282 bytes, SHA-256
`c6225b78d9d49282c5699b63315018a1e17ebf091c50ce4feb3dab465ec25a12`이며,
기존 corpus의 `saju-source-yuanhai-ziping` identity와 일치한다. 표지와 export notice가 있는
현대 Wikisource 파생 PDF이고, 역사적 판본·전승·독립 witness는 여전히 미해소다.

| 범위 | 부모가 직접 본 문장 | 역할과 경계 |
|---|---|---|
| p.6, 「論日為主」 | `一曰官，分之陰陽，曰官、曰殺...` 및 `三曰生氣之陰陽，曰印綬、曰倒食...` | 官/殺, 印綬/倒食이라는 label family의 문맥. p.7의 `帶`가 어느 family·층을 선택하는지는 닫지 않는다. |
| p.7, 「論月令」 | `月为提纲，带官星印绶，则慷慨聪明、见识高人。` | 선택한 단일 source-local 조건과 결과 문구. |
| p.7 인접 문장 | `假令年为本...早年有官出自祖宗`, `时为辅佐，平生操履`, `若年月日有吉神...若凶神...`, `假令月令有用神，得父母力` | 각각 연주/시간/신살·제어/부모 outcome 문장. 선택 후보의 조건이나 예외로 합치지 않는다. |

기존 [淵海子平 p.6–7 grounding record](../artifacts/saju-five-classics-grounding-v0/complete.json)의
`five-classics.day-master-and-month-command.yuanhai-p6-p7`는 이 범위를 locator 후보와 partial support로만 기록한다. 같은 절은 [Wikisource 卷七](https://zh.wikisource.org/wiki/三命通會/卷七)에서도 위치를 확인할 수 있고, [四庫全書本 卷07 전사](https://zh.wikisource.org/w/index.php?title=三命通會_(四庫全書本)/卷07&oldid=2082208)도 참고했지만, 전사·표제 일치는 물리적 witness·판본·semantic authority를 만들지 않는다.

## premise와 현재 필드 매핑

| premise | 현재 대응 경로 | 판정 |
|---|---|---|
| `月为提纲` | `raw.pillars.month`, `.month.branch`, `.month.stem`, `.month.referenceValue` | **구조 필드 사용 가능 / source 의미와 등치 불가**. 월주가 존재한다는 사실만으로 역사적 `提纲` rule을 채택하지 않는다. |
| `带官星印绶` | `raw.tenGods.visible`, `raw.tenGods.hidden` | **부분 대응 / scope 미해소**. 현재 출력에는 官 계열과 印 계열 label이 있으나 `帶`가 월지 본기·투간·전체 표면·지장간 중 무엇인지, 둘의 동시성을 요구하는지 source가 정하지 않는다. |
| p.6의 `官/殺`, `印綬/倒食` | `raw.dayMaster.stem`, `raw.tenGods.visible`, `raw.tenGods.hidden` | **label context만 사용 가능 / polarity 미해소**. 엔진의 `getTenGod`은 음양에 따라 정·편을 나누지만 p.7은 官星·印綬 중 어떤 polarity와 대체 명칭을 포함하는지 말하지 않는다. |
| `则慷慨聪明、见识高人` | 계산 경로 없음 | **source wording only**. 개인 성향 진술로 변환하지 않는다. |

현재 엔진의 `visible` 분포는 천간과 지지 본기 투영을 함께 세고, `hidden`은 지장간을 별도로 누적한다. 따라서 두 배열에 값이 있다는 사실을 source의 `帶`와 동일시하지 않았다. `raw.experimental.gyeokguk`의 월지 본기 기반 `정관격`도 파생 휴리스틱이므로 이 후보의 역사적 premise로 사용하지 않았다.

부모는 기존 내부 회귀 fixture `val-solar-normal`을 같은 코드로 다시 계산했다. 이 fixture는 사용자 명식이 아니다.

- `raw.dayMaster`: 계 / 수
- `raw.pillars.month`: 갑진 (월간 갑, 월지 진)
- `raw.tenGods.visible`: 편재 1, 편관 3, 상관 1, 정관 1, 정재 1
- `raw.tenGods.hidden`: 편관 1.2, 비견 0.4, 편인 0.1, 정관 0.7, 식신 0.4, 정재 0.6, 정인 0.3, 편재 0.3
- `raw.experimental.gyeokguk`: 정관격, `epistemicStatus=derived`

전체 계산 receipt와 경로 값은 [rule-set.json](../artifacts/saju-p1-yuanhai-month-command-officer-seal-v0/rule-set.json)의 `calculationProbe`에 고정했다. 계산·policy·historical authority·readiness·activation의 기존 값은 바꾸지 않았다.

## 분기와 미해소 쟁점

선택 문장 자체에는 `若` 형식의 예외가 없다. p.7의 연주·시간·신살·부모 관련 문장은 별도 branch로 남겼다. 이들을 결합해 `官星印綬`의 필수·충분 조건, 우선순위, 반전 규칙으로 만들지 않았다.

남은 blocker는 다음 세 가지다.

1. `帶`가 visible stem, month-branch content, 투간, 임의의 지장간, 또는 chart-wide presence 중 무엇인지 모른다.
2. `官星印綬`가 正官/偏官·正印/偏印의 어느 조합을 포함하는지와 두 family의 동시성·위치 조건이 없다.
3. 현재 export의 역사적 판본·lineage와 독립 대조가 닫히지 않았다.

따라서 `executablePredicate=null`, `admittedRules=[]`, `candidateStatus=not_applicable_fixed_current_P1`로 고정한다. 이 후보에 대한 source 확장·재개는 하지 않는다.

## 후속 bounded 재검토

동일한 로컬 witness의 p.4·p.6·p.7만 다시 직접 확인했다. p.7에는
`假令年为本，带官星印绶`와 `月为提纲，带官星印绶`가 함께 있지만, `帶`가
표면 천간·지장간·월주 내용·원국 전체 중 어느 층을 가리키는지 정하지 않는다.
p.6의 `官/殺`, `印綬/倒食` 짝과 p.4의 `偏官/七殺`, `倒食/偏印` 연관도
확인했지만, p.7의 일반어 `官星/印綬`가 正官·正印만을 뜻하는지 대체 명칭까지
포함하는지 선택하지 않는다. 인접한 연주·시간·신살·월령 유용신 문장은 별도
위치·결과 branch로 남겼다.

그러므로 현재 `tenGods.visible`과 `tenGods.hidden`은 구조 필드로 존재해도 이
문구에 대한 직접 predicate를 만들 수 없다. `predicate=null`과 적용 불가 결정을
고정한 근거는 [bounded recheck evidence](../artifacts/saju-p1-yuanhai-month-command-officer-seal-v0/bounded-recheck-source-evidence.json)에 남겼다.

## bounded worker와 부모 검증

`antigravity-worker`에 Gemini 3.8 Flash Medium을 명시하고 `--mode plan --print-timeout 60s --output-format json`으로 한 번만, 부모가 제공한 발췌·계산 snapshot만 inline 전달했다. 파일 입력·원격 변경·재시도는 없었다.

응답은 strict JSON으로 파싱했고 `subagent-evidence-contract-v0` 검사 결과는 오류 0개였다. worker의 관찰·inference는 실행 provenance인 advisory로만 보존했으며, 부모가 p.6–7을 다시 읽고 fixture를 직접 재계산한 결과와 분리했다. 상세 envelope와 receipt hash는 [rule-set.json](../artifacts/saju-p1-yuanhai-month-command-officer-seal-v0/rule-set.json)의 `delegation`에 있다.

이번 bounded 재검토의 외부 worker 재호출은 로컬 전사·artifact hash·계산 snapshot의 민감정보 egress 검토에서 자동 거부되었다. 재시도나 우회는 하지 않았고, 동일 source의 부모 직접 검토만으로 판정을 닫았다.

## 경계와 종료

- 사용자 claim: 생성하지 않음
- reflection: 생성하지 않음
- 다른 lens 비교: 생성하지 않음
- 새 interpretation rule / adapter / UI: 생성하지 않음
- 계산, historical authority, readiness, activation: 변경하지 않음

이번 단계의 결과는 **`月令·官星印綬 → 慷慨聰明、見識高人` 후보를 현재 P1에서 적용 불가로 고정한 것**이다. `tenGods.visible/hidden`에 직접 연결되는 해석 rule은 만들지 않았고, 이 후보를 더 확장하지 않는다. 계산·historical authority·readiness·activation 값은 변경하지 않았다.
