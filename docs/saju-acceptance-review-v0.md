# 사주 claim provenance/readiness v0 독립 acceptance review

기준 HEAD는 `acb1af9f7ad393cea23d8d9949660c9bcfe37beb`이다. 이 review는 claim의 사실성, 전통 규칙의 정당성, production readiness를 판정하지 않는다. `saju-claim-provenance-v0`와 `saju-readiness-grounding-v0`가 미검증 경계와 비개입 경계를 보존하는지만 별도 자료구조 검사로 판정한다.

## Verdict

`saju_acceptance_partial_gap_preserving_boundaries`

현재 사주 자료는 대화 AI의 사전 grounding 자료로 **부분 acceptance**다. 43 claim / 126 occurrence, `unverified=38`, `provenance_partial=1`, `source_unresolved=4`, `unknown=1`, `user-dependent=2`, `unresolved=44`, `unavailable=1` 경계와 blocked activation은 보존된다. 다섯 gap은 구조적으로 보완했지만 raw text는 여전히 검증된 사실이 아니며 source unresolved와 builder 입력 의존성은 명시적 제한으로 남는다. 사실 주장이나 production-ready 자료로 승격할 수 없고 자미두수 단계는 착수하지 않는다.

## 항목 판정

machine-readable 상세는 `artifacts/saju-acceptance-review-v0.json`의 `reviewItems`와 `gapClosure`에 있다. 14개 항목의 분포는 `accepted=10`, `accepted_with_declared_limit=4`, `gap=0`, `violation=0`, `not_applicable=0`이다.

- accepted: inventory, 미검증 승격 방지, epistemic category 보존, 관계 배열 비추론, frequency/selection/merge 차단, activation blocked, 금지 구조 필드 부재, claim/occurrence 참조 연결.
- accepted_with_declared_limit: 전통 source identity unresolved, 7개 external match의 선언 필드 scope 및 unhashed retrieval.
- before gap → after accepted with structural limit: stable `claimId`와 `occurrenceId`를 분리하고 occurrence별 원문·source location·claim 연결을 보존한다. 대표 `claimText`는 occurrence 대체물이 아니며 자동 등가 판정은 하지 않는다.
- before gap → after accepted with declared limit: raw text 원문은 수정하지 않고 `isVerifiedFact=false`와 소비 제한을 schema·claim gate에 기록한다. 임의 소비자는 이 경계를 우회할 수 없도록 독립 checker가 raw fact 승격을 검출한다.
- before gap → after accepted: 모든 claim과 grounding `claimRef`에 conversation availability, evidence limitation, user-context dependency, `mustNotAssume`, raw text restriction, blocked/unsupported reason을 둔다.
- before gap → after accepted with declared limit: acceptance checker는 builder/checker를 호출하지 않고 inventory, occurrence identity, raw text, gate, closed-world status, mutation 결과를 독립 재계산한다. 다만 입력 artifact 자체가 기존 builder 산출물이라는 한계는 남긴다.
- before gap → after accepted: provenance completeness의 허용 enum을 명시하고 unknown status는 unverified로 조용히 낮추지 않고 실패시킨다.

이 gap들은 이번 작업에서 고치지 않았다. 자미두수 구조로 복제될 위험은 claim grouping·raw claim text·per-claim gating은 `high`, checker 독립성은 `medium`으로 기록했다.

## Adversarial negative fixture

`test/fixtures/saju-acceptance-review-positive-v0.json`은 43 claim/126 occurrence, occurrence identity, 대표 원문 비대체 계약, claim별 gate의 positive invariant를 고정한다. `test/fixtures/saju-acceptance-review-negative-v0.json`은 기존 8개와 occurrence raw text 삭제, per-claim gate 삭제, raw text fact 승격, unknown status를 포함한 12개 변이를 별도 review 경로가 모두 검출하는지 고정한다. 기존 builder checker의 pass를 acceptance 증거로 재사용하지 않는다.

## 결정성 및 실행

독립 review materializer는 `scripts/review-saju-acceptance-v0.mjs`, checker는 `scripts/check-saju-acceptance-review-v0.mjs`다. review content hash는 hash field를 제외한 recursively sorted canonical JSON, `artifactByteSha256`는 자기 field를 null로 둔 canonical artifact preimage다. 실제 파일 byte hash는 checker 실행 시 별도 확인할 수 있으며 preimage hash와 혼동하지 않는다.

```sh
node scripts/review-saju-acceptance-v0.mjs
node scripts/check-saju-acceptance-review-v0.mjs
node --test test/sajuAcceptanceReview.test.js
```

재-materialize 결과의 content hash는 provenance `aebffb6baa1742d081dbe1ef604497f3211145148c0776b35a4a2b990749741d`, readiness `e47f0bbdf8b28fc8424b6c169895e298cd7a6e0c264341a02816abd6d0914390`, grounding `07e517eca4d373394bf0c152d7030bf146805daf6ffbfb24b403cc6d9aa1522b`, acceptance review `d6540b53a91272edd63fe2c4c6b5fca24889de15beb6dfdc1e743bff8beaaf3e`다. artifact preimage hash는 각각 `2aa7200aaf3cfd27ae9e15192e931722fd0f6207facb8633090feeb2f8042d30`, `2a3a96f7d9ff63d3c59340363106d909567d0b69aa3970409cfe011f4a038945`, `18903fa47eaf00705beaf7345ba0589f9199dbc40b00a6095c13904cb723154e`다.
