# Ziwei guarded occurrence source-evidence hardening v0

`verdictToken=ziwei_guarded_occurrence_source_evidence_partial_unresolved`
기준 HEAD=`ba3b516549afb98054033b778a07e241e2c13e83`

이 audit은 structural guard pilot의 `categoryLists.structuralGuardPossible`에서 기계적으로 선택된 네 occurrence만 대상으로 한다. 대상은 `ziwei-occ-2260aba6ed2163e3`(career), `ziwei-occ-a09e10a5495186b8`(siblings), `ziwei-occ-a72bdf60ef809b58`(friends), `ziwei-occ-e73f469c5e35e072`(mind)이며, raw text·provenance·guard·기존 source reference는 변경하지 않았다.

## 판정

네 항목 모두 `source_identity_partial`이다. 공개 《紫微斗數全書/卷一》 전재본에서 궁명과 일부 조건부 문구를 확인할 수 있고, CText datawiki와 MCU 공개 학술 PDF가 궁명·별칭을 보강한다. 그러나 전재본의 정확한 판본·편자·연도·scan identity와 immutable retrieval bytes가 없다. 학술 PDF도 정확한 한국어 의미 설명이나 동일 별·궁·학파 구성의 규칙을 재현하지 않는다.

따라서 독립 rule corroboration은 네 항목 모두 `insufficient_evidence`다. CText와 Wikisource는 병렬/전재 계보로 기록하고 독립 근거로 중복 계산하지 않았다. 문헌 대응은 `boundary_evidence_candidate` 네 개만 만들며 stable claim은 0이다.

| occurrence | local text scope | source identity | independent corroboration | 제한 |
|---|---|---|---|---|
| career | 官祿/事業 궁명 및 직업 영역 후보 | partial | insufficient | 사회적 위치·역량 전체와 동일한 원문/조건 미확인 |
| siblings | 兄弟 궁명 | partial | insufficient | 동료·친밀한 지인 확장 미확인 |
| friends | 奴僕/僕役/交友 별칭 | partial | insufficient | 부하·대중·일반 관계를 하나의 구성으로 닫지 못함 |
| mind | 福德/福壽 별칭 | partial | insufficient | 만족·취향·휴식 전체의 독립 문헌 대응 미확인 |

문헌에 기록됐다는 사실은 현실적 진실성, 성격 예측력, 사용자 적용 가능성 또는 계산 검증을 의미하지 않는다. 기존 fixture는 `regression_only`로 유지되며 새 독립 chart oracle이나 external fixture byte는 만들지 않았다. configuration은 궁명/별칭 대응만 부분 일치하고, 별·강약·삼방사정·사화·시간·학파 조건은 미확정이다. 반대 근거가 새로 확보되지 않았으므로 conflict를 0으로 단정하지 않고, 현재 범위에서는 `opposingEvidence: []`와 미해결 다음 증거를 함께 기록한다.

## 재현 산출물

- artifact: `artifacts/ziwei-guarded-occurrence-source-evidence-hardening-v0/complete.json`
- materializer/checker: `scripts/materialize-ziwei-guarded-occurrence-source-evidence-hardening-v0.mjs`, `scripts/check-ziwei-guarded-occurrence-source-evidence-hardening-v0.mjs`
- negative fixture/checker: `test/fixtures/ziwei/guarded-occurrence-source-evidence-hardening-negative-v0.json`, `scripts/check-ziwei-guarded-occurrence-source-evidence-hardening-negative-v0.mjs`
- targeted test: `test/ziweiGuardedOccurrenceSourceEvidenceHardening.test.js`

materializer는 occurrence ID와 원문을 pilot에서 읽고, occurrence ID·evidence ID를 결정적으로 정렬한다. generation timestamp와 임의 citation은 금지된다. artifact identity의 payload hash와 actual `complete.json` byte hash는 분리한다.

readiness/grounding은 `not_safe_to_start`, grounding subset은 `blocked`, activation은 `experimental`로 유지한다. UI, API, DB, LLM, prompt, production consumer, 전체 grounding, tri-system envelope와 계산 규칙은 변경하지 않았다.
