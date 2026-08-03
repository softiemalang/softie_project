# 자미두수 readiness baseline v1

생성 기준 HEAD는 `d40f0fe167a020a6c6f576ac45bd180c2989da55`이다. 이 문서는 자미두수 계산·규칙·fixture·handoff의 현재 저장소 상태를 판정하며, 계산값이나 규칙을 새로 만들거나 수정하지 않는다. 기계 판정의 원본은 [complete.json](/Users/softie/Documents/softie_project/artifacts/ziwei-readiness-baseline-v1/complete.json)이다. 현재 checkout HEAD와 생성 기준 HEAD가 달라지는 것은 artifact를 포함한 후속 commit에서 정상이며 stale 사유가 아니다.

<!-- ziwei-readiness-baseline: verdict=ziwei_readiness_baseline_partial_unverified head=d40f0fe167a020a6c6f576ac45bd180c2989da55 -->
<!-- layer-status: input_calendar=partial; deterministic_calculation=implemented_unverified; traditional_rule_application=implemented_unverified; fixture_external_validation=partial; claim_meaning_candidate_structure=partial; provenance=partial; relation_graph=implemented_unverified; readiness_context=partial; handoff_grounding=partial; materialization_checker=partial; activation=experimental -->

## Verdict

`ziwei_readiness_baseline_partial_unverified`

정상 exact-time 경로에는 결정적 local calculation과 experimental handoff가 있다. 그러나 외부 fixture의 정확한 판본/검색 identity와 독립 구현 identity가 닫히지 않았고, 4개 observed match도 `verified`가 아니다. 현재 의미 후보는 `interpretivePatterns`와 prompt payload에 존재하지만 안정적인 `claimId`/`occurrenceId`/`sourceRefs`가 없어 claim-level provenance 착수는 `blocked`다.

## Layer matrix

| 계층 | 상태 | 핵심 근거 |
|---|---|---|
| input/calendar | `partial` | `solar2lunar` 실행과 lunar 정규화는 있으나 conversion/source identity가 unresolved; 윤달·자시 경계는 candidate 차단 |
| deterministic calculation | `implemented_unverified` | 명궁·신궁·오행국·주성·보조성·사화 resolver와 내부 regression fixture 존재 |
| traditional rule application | `implemented_unverified` | local ruleset version은 있으나 전통적 타당성은 판정하지 않으며 source edition이 unresolved |
| fixture/external validation | `partial` | 내부 regression 6건; 외부 선언 fixture 6건 중 observed 4, excluded 2, verified 0, pending 6 |
| claim/meaning-candidate structure | `partial` | palace context/topic pattern/prompt 구조는 있으나 stable claim/occurrence identity 없음 |
| provenance | `partial` | fixture source object는 있으나 계산 output claim-level `sourceRefs` 없음 |
| relation graph | `implemented_unverified` | 삼방사정 구조는 계산되지만 claim relation graph는 없음 |
| readiness/context | `partial` | per-result state contract와 candidate blocking은 있으나 Ziwei 계산 readiness artifact는 없었음 |
| handoff/grounding | `partial` | prompt/session handoff는 있으나 sourceRefs-grounded grounding bundle 아님 |
| materialization/checker | `partial` | 본 작업의 baseline materializer/checker는 추가되지만 계산 사실의 독립 검증을 의미하지 않음 |
| activation | `experimental` | tri-system baseline과 실행 경로가 experimental; production activation 근거 없음 |

## Source identity and independence

현재 표기는 《紫微斗數全書》, CText 공개 디지털 전사본, `陳摶 (attributed) / 羅洪先 (edit)`이다. fixture에는 권·표·절 라벨과 URL이 있지만 `editionOrVersion: pending_exact_edition_review`, 출판일 pending, immutable retrieval byte/hash 및 정확한 scan identity가 없다. 외부 제품·라이브러리·버전·실행 설정도 없다. `externalValidationRunner.js`는 비교 시 현재 저장소 resolver를 호출하므로, observed match는 내부 구현과의 순환 비교 가능성을 보존해야 한다.

## Claim-level provenance 판정

현재 의미 후보에 해당하는 구조는 `createZiweiInterpretationContext`, `buildZiweiPalaceContexts`의 `interpretivePatterns`, `buildZiweiPromptPayload`이다. 이 구조들은 stable claim ID, occurrence ID, per-claim sourceRefs, source identity hash, fact/candidate 경계를 제공하지 않는다. 따라서 provenance 구현 전에 source edition identity, external oracle identity, claim boundary를 blocker로 닫아야 한다. 그동안 inventory/checker hardening, fixture 상태 보존, unsupported scope catalog는 unresolved 상태와 병행할 수 있다.

## Fixture·handoff·지원 범위

- `knownCharts.js` 3건과 `starPlacementCharts.js` 3건은 `regression_only`다. `benchmarkCases.js` 5건은 prompt/rubric 회귀이며 chart truth 검증이 아니다.
- `externalZiweiFixtures.js` 6건은 모두 `pending_source_review`; 4건은 observed match, 2건은 source locator 또는 입력 부족으로 out-of-scope이다. verifiedMatches는 0이다.
- timing, brightness, extended minor stars, palace-based transformations는 문서와 supportScope에서 unsupported로 남아 있다.
- exact 단일 입력은 현재 `availableForChat: true`가 될 수 있으나 `needs_external_verification` 및 `experimental`이다. 미상 시각·윤달·자시 경계는 `candidate_required`/`availableForChat: false`로 차단된다.

## Recommended order and next goal

1. source edition·retrieval·external oracle identity와 claim/occurrence boundary를 audit한다.
2. 독립 fixture reconciliation을 수행하되 observed/pending/out-of-scope를 유지한다.
3. Ziwei-native claim provenance contract를 설계한다.
4. 그 뒤 readiness/grounding artifact와 handoff boundary를 만든다.

다음 하나의 완결된 goal은 `ziwei_source_identity_and_claim_boundary_audit`다. 외부 source를 다운로드하거나 계산·규칙·fixture·provenance 구현을 변경하지 않고, 정확한 source identity와 claim boundary acceptance 기준만 확정해야 한다.

## Reproduction and checks

```sh
node scripts/materialize-ziwei-readiness-baseline-v1.mjs
node scripts/check-ziwei-readiness-baseline-v1.mjs
node --test test/ziweiReadinessBaseline.test.js
```

materializer는 생성 시점 `artifactIdentity.generation.baseHead`, 실제 입력 byte hash, versioned materializer identity를 기록하고 timestamp 없이 canonical JSON과 integrity sidecar를 생성한다. checker는 base/input identity, payload byte hash, required layers/status vocabulary, evidence path connectivity, unresolved source/claim boundary, fixture counts를 fail-closed로 검사한다. 현재 checkout HEAD와의 단순 불일치는 stale로 판정하지 않는다. 이 검사는 계산값의 truth나 전통적 타당성을 증명하지 않는다.
