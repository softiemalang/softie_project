# Saju P1: 木旺相與博愛惻隱 — source rule checkpoint v0

**P1 시작 / 적용 가능한 rule 0개 / unresolved 후보 1개.**
주제는 temperament의 작은 원문 단위인 「木旺相 → 博爱恻隐之心」이다.
원문의 조건과 현재 계산 필드를 대조했으나 의미 연결이 닫히지 않아 여기서 적용을 중단했다.
이것은 사용자 성향에 대한 판정이 아니다.

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
`admittedRules`는 빈 배열이다. `unresolvedCandidates`에는 다음 한 후보만 있다.

1. **목의 대상**: 이 단락의 목이 어떤 원국 위치·층을 가리키는지 확정해야 한다.
   `raw.dayMaster.element`, 표면 개수, 월지·계절만으로 이를 정하지 않는다.
2. **木旺相**: 같은 대상에 적용할 원문 정의가 필요하다. `raw.season`이나
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

## 다음 판별 작업

이 절의 식별된 원전 witness·판본 연결, 목의 대상과 旺相의 정확한 정의,
日時/納音 두 서술의 관계 및 神煞·克 예외를 먼저 닫아야 한다. 현재 확인한 범위에서
어느 하나도 자동으로 보충하지 않는다. 다른 주제로 갈아타서 적용 rule을 만들지 않는다.

이번 진전은 **새 주제의 정확한 파생본 locator·조건·계산 연결 blocker를 특정한 것**이다.
다른 Saju 연구의 기존 frontier를 낮추거나 계산·historical authority·readiness·activation을
변경하지 않았다. 사용자 claim·reflection·다른 lens 비교·adapter/UI도 생성하지 않았다.
