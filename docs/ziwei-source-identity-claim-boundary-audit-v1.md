# 자미두수 source identity·claim boundary 독립 감사 v1

verdict=`ziwei_claim_boundary_audit_partial_unresolved`
basis HEAD=`704266bbb84882e4b3498bf3b60aeb576e8441fa`

artifact identity는 `artifact-identity-v1`을 따른다. 생성 기준은 `artifactIdentity.generation.baseHead`이며, 실제 입력 파일의 `inputs[*].byteSha256`, `artifactPayloadSha256`, contract/materializer version을 검증한다. 생성 시 artifact를 포함한 commit은 알 수 없으므로 `generation.includedCommit=null`이다. 현재 checkout HEAD가 historical `basisHead`와 다르다는 이유만으로 stale 처리하지 않는다.

이 감사는 계산·규칙·fixture 기대값·handoff 의미를 변경하지 않고, 현재 저장소의 규칙 묶음, 외부 fixture 메타데이터, 로컬 의미 후보 literal, 문서의 provenance 경계를 읽기 전용으로 확인한다. 새 해석 claim이나 provenance 구현은 만들지 않는다. 감사 산출물은 [complete.json](../artifacts/ziwei-source-identity-claim-boundary-audit-v1/complete.json)이며, 생성기는 `scripts/materialize-ziwei-source-identity-claim-boundary-audit-v1.mjs`, checker는 `scripts/check-ziwei-source-identity-claim-boundary-audit-v1.mjs`이다.

## 결론

- 현재 local ruleset identity는 `traditional_lunar`, `standard_month_hour`, `mid_month_split`, `standard_wuhangju`, `standard_ziwei_tianfu`와 세부 `traditional_v1` label로 관찰된다. 이 label은 source edition이나 유파를 증명하지 않는다.
- 외부 fixture는 6개 모두 `pending_source_review`; 내부 `knownCharts` 3개와 `starPlacementCharts` 3개는 `regression_only`이다. 외부 verified는 0개이며, 현재 runner가 local resolver를 호출하는 순환 검증 위험이 보존된다.
- 의미 후보는 현재 코드 literal 기준 19 occurrence다: 궁 설명 12개, topic label 3개, 사화 label 설명 4개. 모든 occurrence는 원문 text, local source file/export/slot, feature reference, 생성 규칙, deterministic occurrence ID 후보를 보존한다.
- stable claim boundary는 0개다. 궁 설명 12개는 `occurrence-only identifiable`, topic label 3개와 사화 설명 4개는 `ambiguous grouping`으로 분류했다. 이는 의미가 다르다고 판정한 것이 아니라, 현재 evidence로 같은 claim이라고 기계적으로 판정할 수 없다는 뜻이다.
- 19개 모두 `source identity unresolved` 및 provenance `blocked`다. 대표 문장으로 합치면 원문·범위·판본·유파 차이를 덮는 conflation risk가 있다.

## Source identity inventory 판정

규칙 source는 `src/ziwei/`의 input contract, 오행국, 14주성, 6보조성, 사화, 궁위 관계와 local solar/lunar conversion을 각각 별도 identity로 보존한다. 현재 표기된 `traditional_v1`은 구현 버전 label일 뿐 문헌명·저자·판본·페이지·권·장·절 source identity가 아니다.

외부 fixture는 《紫微斗數全書》, `陳摶 (attributed) / 羅洪先 (edit)`, CText URL, 권·절 label, 접근일, 설정을 기록하지만 exact edition, 저본/scan, immutable retrieval bytes/hash, 외부 제품·라이브러리·버전·실행 identity가 없다. 따라서 `provisional_transcription_match`는 관측 표기이며 verified가 아니다. `observedMatches=4`라는 기존 보고도 현재 resolver 재사용 가능성을 가진 비교 결과이므로 독립 검증으로 승격하지 않는다.

byte evidence는 로컬 repository file의 실제 byte SHA-256으로만 제공된다. 이것은 외부 문헌 retrieval byte 증거가 아니다. URL 자체를 retrieval evidence로 취급하지 않는다.

## Occurrence와 claim 경계

occurrence ID 후보는 `sha256(sourceFile#sourceExport#sourceSlot)`의 앞 16자리로 결정한다. text를 정규화하거나 대표 문장으로 대체하지 않으며, frequency·반복 수·별 개수로 ranking하지 않는다. ID는 provenance 구현이 아니라 audit 후보이다.

다음 최소 경계 재료가 모두 있어야 stable claim으로 고려할 수 있다: source identity, exact source location, semantic unit, feature scope, generation rule, 그리고 school/edition variant boundary. 현재 19개 중 어느 것도 이 조건을 모두 충족하지 않는다. 같은 “재물”, “관계”, “화기” 주제라는 이유만으로 palace description, topic label, transformation label을 합치지 않는다.

## Provenance 착수 blocker와 병행 가능 범위

Blocker는 exact source edition, 독립 external oracle identity, 모든 occurrence의 source location/sourceRefs, stable grouping decision, regression-only fixture의 승격 금지다. 이 gap은 `unresolved_source_identity`로 명시적으로 보존한다.

그 상태에서도 source inventory, actual-byte hash, occurrence-preserving audit, negative checker, deterministic materializer/test, unsupported scope catalog는 진행 가능하다. timing·brightness·extended minor stars·palace-based transformations는 기존 unsupported 경계를 그대로 보존한다.

claim provenance 착수 가능 여부는 `blocked`다. 시작 전에는 새 의미 문장을 쓰거나, 기존 문장을 합치거나, 문헌을 추정 연결하거나, 계산값·fixture·handoff를 변경해서는 안 된다.

## Negative boundary contract

[claim-boundary-negative-v1.json](../test/fixtures/ziwei/claim-boundary-negative-v1.json)은 다음 7개 shortcut을 의도적으로 포함하며 checker가 모두 검출해야 한다: 서로 다른 원문 강제 병합, source location 누락, regression fixture의 verified 승격, unresolved source 은폐, 판본·유파 차이 삭제, 빈도 ranking, 비결정적 ID/정렬.

재생성·검사는 다음과 같다.

```sh
node scripts/materialize-ziwei-source-identity-claim-boundary-audit-v1.mjs
node scripts/check-ziwei-source-identity-claim-boundary-audit-v1.mjs
node scripts/check-ziwei-claim-boundary-negative-v1.mjs
node --test test/ziweiSourceIdentityClaimBoundaryAudit.test.js
```

이 artifact의 hash는 `complete.json` UTF-8 bytes including final LF 범위이며 sidecar에 기록한다. 생성 시각은 없고 배열/객체 정렬은 deterministic하다. checker 통과는 source truth, 전통적 타당성, 외부 독립성, UI/handoff 동작을 증명하지 않는다.

identity migration evidence: 기존 domain payload의 verdict, source identity inventory 32개, occurrence 19개, occurrence-only 12개, ambiguous grouping 7개, stable claim boundary 0개, conflation risk 19개와 claim provenance `blocked`는 migration 전후 canonical 비교에서 동일하다. negative test는 generation base 누락·위조, input byte hash, payload hash, materializer version, self-referential included commit을 fail-closed로 검출한다.

권장 다음 하나의 goal은 `ziwei_independent_fixture_reconciliation`이다. 단, exact edition·retrieval bytes·외부 oracle identity를 확보할 별도 권한이 없으면 그 goal도 `blocked` 또는 `partial`로 종료하고 현재 unresolved를 유지해야 한다.
