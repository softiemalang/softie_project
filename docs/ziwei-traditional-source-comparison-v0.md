# 자미두수 전통 source 비교 packet v0

이 문서는 두 사용자 제공 PDF의 실제 파일 byte를 직접 해시한 source inventory와 명대본 권3 중심의 판면 locator/comparison packet을 설명한다. PDF 원본은 Downloads에 read-only로 남기고 저장소에 복사하지 않았다. OCR·검색 텍스트는 탐색 보조이며 canonical transcription이 아니다. 해석·성격·길흉·운명 문장은 포함하지 않는다.

## 판본과 경계

명대 남양당 계통 영인본은 528쪽, SHA-256 `04e184c4a52cb042dc885c6ccc9135d94ab25de62007506198ee979a33e66bfc`이다. PDF outline과 판면 경계를 함께 확인한 PDF page 범위는 권1 9–76, 권2 77–144, 권3 145–258, 권4 259–312, 권5 313–382, 권6 383–496, 권7 497–528이다. 권3의 본문·규칙 검토 범위는 145–254이며 255–258은 공백·표제 경계 페이지다. PDF page와 원책 엽/판면 folio는 artifact에서 서로 다른 필드로 보존한다.

남북산인 편주본은 219쪽, SHA-256 `4786a94ab454acdabf9716d7c0db4756dbcbde99a88bc45fda254863c1961023`이다. 이번 source comparison에서 직접 확인한 locator window는 PDF p8–p13, printed folio 二十五–三十四다. 이 편주본에 명대 7권 경계를 소급하지 않았다.

## 결과와 한계

artifact에는 16개 규칙군을 동일한 rule ID로 기록했다. 명궁·신궁은 두 source의 표현 차이를 보존한 equivalent representation으로, 오행국과 자미는 각각 1440/1440 및 150/150의 독립 evaluator 결과를 보존한다. 천부는 남북산인 표와 현재 직접 공식이 일치하지 않으며, 기존 분석의 수치적 rotation-06 관계도 semantic identity로 승격하지 않았다. 나머지 규칙은 표제·부분 판면을 확인했더라도逐字·逐格 근거가 닫히지 않은 경우 `unreadable`로 남겼다. 미확인이라고 해서 어느 판본의 부재를 추론하지 않았다.

현재 구현·readiness·activation·공개 계약은 변경하지 않았다. 생성 artifact의 `stableClaimCount`는 0, readiness는 `not_safe_to_start`, grounding은 `blocked`, activation은 `experimental`이다.

재현 명령:

```sh
node scripts/materialize-ziwei-traditional-source-comparison-v0.mjs
node scripts/check-ziwei-traditional-source-comparison-v0.mjs
node --test test/ziweiTraditionalSourceComparison.test.js
```
