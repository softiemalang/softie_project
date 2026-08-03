# 사주 readiness and conversation grounding v0

이 계약은 `artifacts/saju-claim-provenance-v0.json`을 변경하지 않고 입력으로 읽어, 관측된 43개 claim과 126개 occurrence를 대화 전 단계의 근거·한계 자료로 재표현한다. 계산·규칙·claim 문장을 새로 만들거나 검증 상태를 승격하지 않는다.

## 결정론적 상태

각 readiness record는 stable `claimId`, provenance 참조, evidence/verification 상태, 계산·규칙 참조, unresolved evidence, 사용자 의존 영역, 추가 맥락의 구조적 `domain`/`subject`/`reason`, `mustNotAssume`를 보존한다. provenance 상태별 readiness는 다음과 같다.

| provenance completeness | readiness | conversation availability |
| --- | --- | --- |
| `unverified` (38) | `grounding_only_unverified` | `available_with_explicit_limits` |
| `provenance_partial` (1) | `partial_evidence_only` | `available_with_explicit_limits` |
| `rule_implemented_source_unresolved` (4) | `source_unresolved` | `not_available_for_assertion` |

외부 fixture match 7개는 선언된 계산 필드의 scoped evidence로만 유지되며 claim-level verification이 아니다. 전통 source identity가 없는 unresolved gap도 각 claim에 남는다. 사용자 경험·개인적 의미·강도·우선순위·가능성·정확성은 계산하지 않으므로 `userDependent`와 `additionalContext`로 구조적으로 표시한다.

## Grounding bundle

`artifacts/saju-readiness-grounding-v0.json`의 `bundle`이 대화 AI가 해석 전에 읽는 단일 자료다. subject/input/provenance/readiness identity와 claim refs, 이용 가능한 계산·규칙 참조, known/unknown/unresolved/user-dependent/unavailable 상태, activation 상태, 구조적 사용 제한을 포함한다. 모든 claim과 grounding `claimRef`에는 conversation availability, evidence limitation, user-context dependency, `mustNotAssume`, raw text 소비 제한, blocked/unsupported reason을 담은 per-claim conversation gate가 있다. raw text는 verified fact로 소비될 수 없고 unknown provenance status는 조용히 unverified로 대체되지 않는다. 자연어 질문·해석·조언·prompt·LLM 호출·ranking은 포함하지 않는다.

현재 claim 관계는 기계적으로 증명된 입력이 없으므로 `preservedClaimRelations.relatedClaimRefs`와 `tensionClaimRefs`가 빈 배열이다. occurrence 수·evidence 수·claim 수를 ranking이나 선택 근거로 사용하지 않는다.

## Hash와 검사

`contentSha256`는 해당 객체에서 hash field를 제외한 recursively key-sorted canonical JSON + LF의 SHA-256이다. artifact의 `artifactByteSha256`는 자기 field를 `null`로 둔 canonical artifact preimage의 SHA-256이라는 기존 관례를 따른다. materializer는 별도로 실제 UTF-8 file-byte hash도 출력한다. artifact는 자기 자신의 hash를 content에 넣지 않는다.

```sh
node scripts/materialize-saju-readiness-grounding-v0.mjs
node scripts/check-saju-readiness-grounding-v0.mjs
node --test test/sajuReadinessGrounding.test.js
```

checker와 negative evidence는 claim 승격, scoped external match의 전체 검증 확대, unresolved source 은폐, 사용자 경험 선제 추정, claim 누락·중복, frequency ranking, 관계 임의 생성/병합, 참조 단절, 질문·해석·조언·prompt 삽입, 비결정적 순서를 거부한다.
