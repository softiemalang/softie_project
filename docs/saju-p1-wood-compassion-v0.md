# Saju P1: 木旺相與博愛惻隱 — source rule checkpoint v0

**후속 bounded 판별 완료 / 적용 rule 0개 / 현재 P1에서 적용 불가로 고정한 후보 1개.**
주제는 temperament의 작은 원문 단위인 「木旺相 → 博爱恻隐之心」이다.
원문의 조건과 현재 계산 필드의 직접 연결이 닫히지 않아 이 후보의 탐색·적용을 종료했다.
source 의미의 unresolved는 보존한다. 역사적 명제가 거짓이라는 판정이나 사용자 성향 판정이 아니다.
다음 P1 temperament 후보 탐색은 가능하지만 이번 작업에서는 시작하지 않았다.

## 근거와 locator

기존 로컬 corpus의 `三命通會.pdf`를 직접 다시 열어 p.1과 p.242–244를 렌더링해 확인했다.
현재 위치는 `/Users/hangyukim/Documents/malang_lab/documents/三命通會.pdf`다.
7,601,079 bytes / SHA-256
`f09bce7c6dbe1e222746ad8c97f49d132ed4e8da6d3c1d0399b0824b3794593f`로,
기존 `sajuLocalSourceCorpusEvidence.js`의 파일 identity와 일치한다. 기존의 다른 사용자명
경로는 수정하지 않았다. 표지에는 2026년 8월 4일 위키문헌 내보내기라고 적혀 있다.
이 파일은 원전의 물리적 witness나 식별된 고판본이 아니다.

| 정확한 범위 | 직접 관찰한 내용 | 적용 경계 |
|---|---|---|
| PDF/표시 p.242, 卷七 「論性情相貌」, `东方震位木`으로 시작하는 문단 | `旺相主有博爱恻隐之心，慈祥恺悌之意` | 旺相 조건을 삭제해 일간 또는 오행 개수로 대체하지 않는다. |
| 같은 목 문단의 `休囚`·`死绝` 이하 | 서로 다른 조건의 서술이 이어진다. | 이 후보의 적용 범위 밖이며, 사용자에 대한 부정적 평가로 뒤집어 쓰지 않는다. |
| p.243 첫 문단 후반, `以上五行、情性`부터 `无有不验`까지 | 神煞·克·日時·納音의 관여 및 별도 판단 지시 | “신살이 없다” 같은 단순 부재 검사도 이 대목의 정확한 예외 규칙을 대신하지 못한다. |
| p.243 바로 다음 `又曰` 문단 | `看本五行，不论纳音` | 앞의 納音 서술과 같은 층으로 합치거나 우선순위를 임의로 정하지 않는다. |
| p.244 상단, 다음 「論疾病」 제목 이전 | 得地失地·太過不及 등의 추가 논의 | 현재 코드의 수치와 동일하다는 정의를 확인하지 못했다. 질병·외모·길흉 적용은 범위 밖이다. |

현재 [위키문헌 卷七](https://zh.wikisource.org/wiki/三命通會/卷七)도 같은 절을 제공한다.
웹 페이지는 위치 확인용 참고일 뿐 독립적인 판본 대조로 세지 않았다. 이번 원문 판단의
고정 basis는 위 해시의 로컬 PDF다. PDF text extraction에는 누락 문자가 있어 탐색에만
사용했고, 인용은 페이지의 시각적 관찰로 확인했다. OCR 실행·정규화로 공백을 보충하지 않았다.

## 최소 후보와 계산 연결

[rule-set.json](../artifacts/saju-p1-wood-compassion-v0/rule-set.json)의
`admittedRules`는 빈 배열이다. `unresolvedCandidates`는 원래의 미해소 근거를 보존하는
목록이며, 해당 후보의 현재 admission은 `not_applicable_fixed_current_P1`이다.
최종 workflow 판정은 같은 파일의 `finalAdjudication`에 있다.

1. **목의 대상**: 이 단락의 목이 어떤 원국 위치·층을 가리키는지 확정해야 한다.
   `raw.dayMaster.element`, 표면 개수, 월지·계절만으로 이를 정하지 않는다.
2. **木旺相**: 후속 판별에서 일반 계절 정의는 확인했다(아래). 같은 대상에 대한
   해당 성정 절의 적용은 여전히 unresolved다. `raw.season`이나
   `raw.elements.weightedCounts`, `raw.strength`, `raw.experimental.strength`와의 등치는 unresolved다.
3. **예외·분기**: 神煞·克·有氣無氣와 日時/納音의 판정 경로가 필요하다.
   기존 신살·관계 배열의 존재만으로 본문 조건이 검증되지는 않는다.

현재 코드의 `val-solar-normal` **기존 내부 회귀 fixture**를 부모가 직접 다시 계산했다.
일간은 계/수, 월지는 진, `seasonElement`는 목, 표면 목 1, 가중 목 1.2였다.
이는 현재 결과 경로가 실제 존재함을 확인한 것이며 사용자 명식 또는 원전 oracle이 아니다.
사용자의 현재 명식 입력은 이번 작업에 제공되지 않았고 별도로 추정하지 않았다.

`sajuProfileRules.js`의 강약 계산은 득령 40·득지 20 및 45/55 경계 등을 쓰는
`surface_support_heuristic`이다. 이 값으로 본문 木旺相을 대신 판정하지 않았다.
출력의 원래 `stateContract` 값도 기록 그대로 보존했으며 그 `verified` 값을
해석 rule 또는 개인 타당성의 검증으로 사용하지 않았다.

## 검토와 검증

- Antigravity Gemini 3.8 Flash Medium에 부모가 확인한 짧은 발췌만 inline으로 전달했다.
  `--mode plan --print-timeout 60s --output-format json`으로 1회 실행했고 exit 0 / SUCCESS였다.
  파일·이미지는 전달하지 않았으며 staged input이나 read_file 권한 변경은 없었다.
- 응답의 strict JSON과 `subagent-evidence-contract-v0` envelope 검사를 통과했다.
  정확한 envelope와 응답 hash는 rule-set 안에 보존했다. worker의 “conflict” 표현을
  확정된 문헌 모순으로 채택하지 않았고, 예외가 반드시 전부 부재해야 한다는 새 규칙도 만들지 않았다.
- Native 계산 검토 역시 envelope를 검증한 뒤 부모가 같은 fixture를 직접 재계산하고
  해당 코드 위치를 다시 읽었다. 어느 child PASS도 rule admission PASS가 아니다.
- [source-evidence.json](../artifacts/saju-p1-wood-compassion-v0/source-evidence.json)은
  `historical-document-evidence-v1` validator로 검사한다. 관찰 FACT와 적용 INFERENCE/UNKNOWN을
  분리하며, 파생본만 있는 source support는 **PARTIAL**, 역사적 rule admission은 **UNRESOLVED**다.

공통 grounding validator는 claim bundle용이다. 이번에는 rule 후보 연구만 했으므로
빈 사용자 claim이나 가짜 reflection을 만들어 validator 통과를 P1 성공으로 보고하지 않는다.
기존 53개 구조 테스트와 Saju core contract 테스트는 기존 계약 경계 확인에만 사용한다.

## 후속 1회 bounded 판별과 종료

추가 내용은 [bounded-recheck-source-evidence.json](../artifacts/saju-p1-wood-compassion-v0/bounded-recheck-source-evidence.json)에
FACT / INFERENCE / UNKNOWN으로 분리했다. 범위는 같은 로컬 PDF의 p.67–69
「論五行旺相休囚死并寄生十二宫」와 p.242–244의 해당 절, 그리고 같은 절의 witness locator 확인이다.
다른 저술·성정 주제·신살 세부 규칙으로 확장하지 않았다.

| 쟁점 | 이번에 닫힌 범위 | 남은 경계 |
|---|---|---|
| 旺相 정의 | p.67 `盛德乘时曰旺`, `春木旺`; p.68 `冬水旺，水生木则木相`를 육안 확인했다. | 일반 계절 정의의 존재는 확인됐다. 이를 본문 대상에 적용할 선택 규칙은 미해소다. “정의 자체가 없다”는 이전 빈칸만 갱신한다. |
| 木의 대상 | 첫 단락의 문법상 대상은 `东方震位木`이라는 오행의 목이다. | 일간·표면 총량·日時納音 중 무엇으로 원국의 대상을 고정하는지 명시적으로 닫히지 않는다. |
| 旺相 조건 | 첫 단락 성정 서술의 조건이다. | 계절 旺과 별도로 나오는 十二宮의 帝旺, 현재 수치 강약을 서로 같다고 하지 않는다. p.69도 生旺을 곧바로 길로 보지 말라고 제한한다. |
| 神煞 | 전체 오행 서술에 고려하라는 context 지시가 있다. | “모든 신살 부재”라는 단일 필수 premise나 충분조건을 새로 만들지 않는다. |
| 煞臨·有克 | 각각 `若…從…斷` 형식의 조건부 전환 지시로 읽힌다. | 어느 신살/克, 대상·우선순위·有氣 평가인지 현재 배열과 직접 연결되지 않는다. |
| 日時·納音 | 앞 account의 종합 판정 기준으로 언급된다. | 첫 문장의 조건 목록에 단순 AND로 붙이지 않는다. 대상·합성 방법은 미해소다. |
| 又曰·不論納音 | 별도로 도입되는 account이며 入格·生旺 조건 등이 뒤따른다. | 첫 account와 통합하거나 한쪽을 우선시키지 않는다. 확정된 판본 모순으로도 승격하지 않는다. |

위 표의 조건/분기 구분은 직접 관찰한 문구에 대한 제한된 문법 해석이다.
실행 가능한 historical rule의 검증을 뜻하지 않는다.

[四庫全書本 표제의 卷07 전사](https://zh.wikisource.org/w/index.php?title=三命通會_(四庫全書本)/卷07&oldid=2082208)에서도
같은 절을 확인했지만, 표제나 전사 일치만으로 판본·독립 witness를 확정하지 않았다.
[Harvard 卷七 mirror record](https://commons.wikimedia.org/wiki/File:Harvard_drs_53262215_三命通會_v.7卷之七.pdf)는
`drs:53262215`와 catalog `990079334100203941`을 가리킨다. 공식 viewer/catalog 조회는 429,
manifest 조회는 403으로 완료되지 않았다. 원면·folio·판본 대조는 미수행이며 우회·추가 획득은 중단했다.
기존 NCL 06589의 다른 절 검증을 이번 卷七 절의 증거로 전용하지 않았다.

부모가 동일 fixture를 다시 계산해 기존 `calculationProbe.observedPaths`의 값이 모두
그대로임을 확인했다. `raw.experimental.strength`의 휴리스틱, season·count·pillar·relation
필드의 존재는 확인했으나, 위 대상·조건·전환을 결합하는 source-specific bridge는 확인하지 못했다.

**종료 판정: `NOT_APPLICABLE_FIXED_CURRENT_P1`.** 재시도·자동 재개·추가 범위 확장은 하지 않는다.
`nextP1CandidateSearch.status = PERMITTED_NOT_STARTED`는 다음 독립 후보를 검토할 수 있다는
workflow 인계일 뿐 readiness·activation 판정이 아니다. 다음 탐색에서 이 candidate ID는 제외한다.

이번 진전은 **새 주제의 정확한 파생본 locator·조건·계산 연결 blocker를 특정한 것**이다.
다른 Saju 연구의 기존 frontier를 낮추거나 계산·historical authority·readiness·activation을
변경하지 않았다. 사용자 claim·reflection·다른 lens 비교·adapter/UI도 생성하지 않았다.
