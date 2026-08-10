# Ziwei P0 evidence-acquisition field kit v1

이 문서는 현재 `main` working tree의 `TOYO_1646` extended-observation과 `local-frontier-reconciliation`을 입력으로 삼는 additive successor다. 기존 `ziwei-palace-source-acquisition-field-kit-v0`는 12궁 semantic blocker 하나의 현장 intake kit으로 보존하고, 이 v1은 현재 11개 blocker 전체를 acquisition target, 판별 기준, claim/relation boundary, priority로 확장한다. 기존 artifact와 `?? -.jpg`는 수정하지 않는다.

기계적으로 읽을 때는 다음을 순서대로 사용한다.

1. `artifacts/ziwei-p0-evidence-acquisition-field-kit-v1/quickMissionCard.json`
2. `artifacts/ziwei-p0-evidence-acquisition-field-kit-v1/targets.json`
3. `artifacts/ziwei-p0-evidence-acquisition-field-kit-v1/intakeSchema.json`
4. `artifacts/ziwei-p0-evidence-acquisition-field-kit-v1/complete.json`

## 현재 경계

현재 successor가 보존하는 graph는 `30 claims / 13 sources / 40 observations / 130 relations / 11 blockers`다. stable claim `0`, semantic authority `0`, independent witness admitted `0`, readiness `not_safe_to_start`, grounding `blocked`, activation `experimental_only`이며 `rotation-06`은 representation-only다.

- NARA concordance: local 528 pages와 NARA 532 side slots 사이에 `same_text_different_capture 522`, `probable_correspondence 6`, `unresolved 4`, `exact_same_leaf 0`; complete 12-way semantic binding `0/12`.
- TOYO_1646: 실제 byte/hash를 재확인한 23개 JPEG의 bounded visual observation. distinct physical candidate일 뿐 date/colophon/lineage/semantic authority/rights는 미해결이다.
- 四化: Nanbei `40/40` 직접 관찰, Nanyang `4/40` 직접 관찰과 `36` explicit unlocated. Nanbei 값의 production 일치는 source authority나 independent corroboration이 아니다.
- 命主/身主: life/body `144/144`, 命主 `144/144`, 身主 `120/144` comparable; `24` rows는 `火鈴星` 표면 때문에 blocked. `火鈴星`을 `火星`으로 줄이지 않는다.
- Tianfu: raw identity `0/150`, `rotation-06` numeric relation `150/150`; semantic identity는 닫히지 않았다.

이 경계는 `artifacts/ziwei-p0-local-frontier-reconciliation-v1/complete.json`에서 다시 materialize되며, 현장 자료가 발견되어도 이 kit 자체가 claim, authority, readiness, grounding, activation을 승격하지 않는다.

## 다음 탐색 순서

우선순위는 semantic authority 가치, claim fan-out, 대체 불가능성, 한 witness로 여러 blocker를 함께 검사할 수 있는지를 기준으로 정했다.

| 순위 | target | priority | 대응 blocker | 현장에서 먼저 볼 것 |
| ---: | --- | --- | --- | --- |
| 1 | `acq-palace-semantic-map-and-coordinate-witness` | P0 | source identity, palace semantics, rotation-06 semantic | 12궁명·12지지·12칸·기산점·순역 주어가 한 readable context에 있는가 |
| 2 | `acq-distinct-witness-identity-lineage` | P0 | source identity | 표지/서명/목차/간기·colophon/권차와 실제 target leaf의 물리적 identity가 연결되는가 |
| 3 | `acq-tianfu-anchor-direction-adjudicator` | P0 | direct rule, Tianfu formula, rotation-06 semantics | `安天府` anchor·방향·branch-token 의미와 두 formula를 구별할 예가 있는가 |
| 4 | `acq-independent-complete-four-transform-table` | P1 | 四化 | 甲–癸 × 化祿/化權/化科/化忌 40칸과 축 순서가 모두 보이는가 |
| 5 | `acq-independent-ziwei-oracle` | P1 | independent oracle | 독립 구현/version/ruleset/입력 cohort/output/hash/runner가 재현되는가 |
| 6 | `acq-complete-14-major-star-placement-witness` | P1 | direct rule | 紫微系·天府系 14주성의 input-bound rule이 모두 source page로 이어지는가 |
| 7 | `acq-calendar-time-input-authority` | P1 | calendar/time | 윤달·timezone·solar-time·子時 경계와 exact cohort 변환을 고정할 수 있는가 |
| 8 | `acq-complete-auxiliary-star-rule-witness` | P1 | auxiliary stars | 13개 production star rule과 `天空/地空`, `火鈴星` raw boundary가 모두 보이는가 |
| 9 | `acq-shen-zhu-compound-surface` | P1 | life/body ruler legibility | 막힌 24행과 `火鈴星` compound surface를 native/high-resolution으로 읽을 수 있는가 |
| 10 | `review-image-level-reuse-permission` | P2 | image-reuse-rights | item/image-level retention·crop·redistribution permission을 사람이 결정했는가 |

가장 가치 높은 한 번의 현장 패킷은 순위 1–3을 함께 겨냥한다. 단, 하나의 자료가 map과 Tianfu rule을 모두 직접 말하지 않으면 target을 합쳐 닫지 않는다. 순위 4–6은 fan-out이 크지만, 표의 일치·oracle 일치는 semantic authority를 대신하지 않는다. 순위 7, 9, 10은 각각 calendar/time, `身主` 24행, rights라는 별도 층이므로 다른 자료의 성공으로 닫지 않는다.

대체 가능한 witness class는 `complete.json`의 `candidateWitnessClasses`에 고정했다: distinct physical witness, institution-supplied/native 또는 rights-cleared scan, independent executable oracle, versioned calendar/time source. 새 특정 판본·연대·저자를 근거 없이 지정하지 않고, 현재 held near-miss는 `targets.json` 안에서 다시 요청하지 않을 자료로 구분한다.

## 11 blocker의 acquisition boundary

| blocker | 현재 확보된 것 | 부족한 것 | 유효 자료 | 기각 / 해소하지 못하는 자료 |
| --- | --- | --- | --- | --- |
| `blocker-source-identity-unresolved` | local PDF bytes, NARA catalog/IIIF route, TOYO candidate와 predecessor lineage | edition/date/colophon/leaf identity와 NARA·Nanyang·Nanbei·TOYO transmission 관계 | institution/holder가 식별한 physical witness, 실제 bytes/hash, target folio, 명시적 lineage | title/catalog/OCR/local filename/numeric agreement; identity packet 단독으로 semantic claim을 닫지 않음 |
| `blocker-palace-semantic-identity` | partial diagram/traversal, NARA chart surfaces, TOYO pages; complete `0/12` | 궁명↔지지↔물리 slot↔ordinal↔기산점↔순역 | all 12 labels와 diagram boundary가 직접 보이고 방향/기산점이 같은 context에 있는 source page | cropped chart, branch ring만, OCR/redraw, rotation-06 exact fit |
| `blocker-direct-rule-absent` | 14-star surfaces와 deterministic comparisons | 14개 모두의 complete input-bound source rule/coordinate frame | source-identified 紫微系·天府系 rule pages, root/relative distinction, all 14 | selected verse/row, output match, fixture, OCR, catalog-only |
| `blocker-tianfu-raw-formula-contradiction` | Nanbei root, Nanyang series/diagram, legacy/source-aligned modes | anchor/direction/branch-token 의미로 `mod(4-Z)`와 `mod(10-Z)`를 구분할 source rule | readable `安天府` rule + examples + identity/lineage | source_aligned mode, numeric fit, chart without rule subject |
| `blocker-tianfu-rotation06-semantic-authority` | identity `0/150`, rotation `150/150` | branch token과 production coordinate의 semantic meaning | map/diagram/text가 coordinate frame과 Tianfu placement를 직접 명명 | numeric equality, same-record pair, inferred label |
| `blocker-auxiliary-star-source-witness` | 13 surfaces, `136/136` comparable, `684` non-comparable | complete independent rule witness와 raw alias boundary | 13 production stars의 complete rule, `天空/地空`, `火星/鈴星/火鈴星` 분리 | six-star subset, normalized alias, missing-row fill, exact comparison |
| `blocker-four-transform-source-witness` | Nanbei `40/40`, Nanyang `4/40` + `36` unlocated | independent/rights-cleared complete 10×4 table | 10 stems·4 columns·40 cells·axis order·edition/folio가 직접 확인되는 table | Nanbei 재복사, Nanyang 36행 추정, NARA same-record pair, OCR |
| `blocker-life-body-ruler-source-legibility` | life/body `144/144`, 命主 `144/144`, 身主 `120/144` | `火鈴星` 표면을 포함한 24행 | high-resolution/independently identified 身主 source with all 24 rows and raw glyph | 120/144를 complete 취급, `火鈴星→火星`, production field 추가 |
| `blocker-independent-external-oracle` | six pending fixtures; independent verification `0` | independent implementation, ruleset, settings, output, runner, license | executable/reproducible oracle with same cohort and field-level output | production wrapper, internal fixture, screenshot, undisclosed shared source |
| `blocker-calendar-time-source-identity` | local input contract/calculation | leap-month, timezone, solar-time, 子時/day-hour boundary identity | versioned authoritative table/service plus exact cohort conversion and bytes/hash | unversioned web result, local conversion, date-only table, Saju artifact의 silent reuse |
| `blocker-image-reuse-rights` | public access/catalog/HTTP and read-only review | repository retention, crop/render, redistribution terms | item/image-level written terms or holder-supplied rights-cleared scan | public URL, catalog CC0, HTTP 200, metadata license; 이 target은 claim을 resolve하지 않음 |

각 행의 상세 `currentEvidenceRefs`, `claimIds`, current relation IDs, acceptance/rejection, search terms, held near-miss, post-acquisition check 계획은 `targets.json`에서 고정한다.

## 현장 intake 규칙

자료를 발견하면 원문을 해석하거나 채택하지 말고 `intakeSchema.json`의 한 record를 채운다.

- 표지/서명·저자/편자/목차/판권·간기·colophon을 먼저 확보한다.
- target page는 잘리지 않은 전체 면, 앞뒤 문맥, 페이지/엽 번호와 함께 보관한다.
- 원래 glyph, 선, 화살표, 읽기 방향, 표의 행·열 순서를 그대로 기록한다. OCR/전사는 locator일 뿐이다.
- 실제 파일 목록, bytes, SHA-256, URL/소장처/청구기호를 기록한다. 판본·연대·lineage가 안 보이면 `unresolved`로 남긴다.
- `candidate`, `promising`, `review_ready`, `potentially_sufficient`는 수색 triage일 뿐 source acceptance가 아니다.
- source identity, observation, representation, independence, semantic identity, authority, rights를 각각 별도 필드로 둔다.

이미 보유한 것으로 다시 요청하지 않는다. Nanbei 219p, Nanyangtang 528p, NARA 4468520/4469314, TOYO_1646의 reviewed 23 leaves, 기존 rule artifacts는 `held_but_authority_insufficient` 또는 `representation_only`로 남는다. 새 자료가 이들과 같은 scan/text lineage인지 먼저 확인한다.

## 검증과 보존

```sh
node scripts/materialize-ziwei-p0-evidence-acquisition-field-kit-v1.mjs
node scripts/check-ziwei-p0-evidence-acquisition-field-kit-v1.mjs
node scripts/check-ziwei-p0-evidence-acquisition-field-kit-v1-negative-v0.mjs
node --test test/ziweiP0EvidenceAcquisitionFieldKit.test.js
```

materializer는 외부 경로를 찾거나 다운로드하지 않고 현재 repository bytes만 읽는다. `complete.json`과 분리된 `blockers.json`, `targets.json`, `priorityMatrix.json`, `quickMissionCard.json`, `intakeSchema.json` 및 각 integrity sidecar는 UTF-8 final LF와 stable key order로 생성된다. 반복 materialization은 byte-identical이어야 한다.

negative checker는 잘못된 blocker→target/claim 연결, source·semantic authority 승격, same-record independence, rotation-06 semantic 승격, Nanyang missing-cell/身主 24행 삭제, OCR/rights shortcut, readiness/activation mutation, 외부 acquisition와 source-image storage, timestamp를 거부한다.

이 kit의 완료는 자료를 찾았다는 뜻이 아니다. 자료가 들어오면 별도의 additive evidence artifact와 human review를 만들고, 그때도 기존 historical/protected artifact를 덮어쓰지 않는다.
