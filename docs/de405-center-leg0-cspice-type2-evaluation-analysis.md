# DE405 Center Leg-0 CSPICE Type-2 Exact-Record Evaluation Evidence

## 조사 목적

기존 center leg-0 record-neighborhood의 154건에 대해 동일 segment·record를 CSPICE N0067 공식 low-level SPKR02/ SPKE02로 읽고 평가했다.

## 154건 선정 기준

cohort=154; candidates=462; official evaluations=462. first divergent leg 0, center chain length 2, Type-2, project selected-record reproduction 및 audited high-level pair-state 전건을 요구했다.

## CSPICE low-level Type-2 capability

reader=spkr02_; evaluator=spke02_; source identity available=true.

## Official record reader 계약

int spkr02_(integer *handle, doublereal *descr, doublereal *et, doublereal *record)

SPKR02 selects recno=((ET-INIT)/INTLEN)+1 and returns RECORD[0]=record size followed by the selected raw record words

## Official Type-2 evaluator 계약

int spke02_(doublereal *et, doublereal *record, doublereal *xyzdot)

SPKE02 consumes ET and the raw Type-2 record and returns XYZDOT=[X,Y,Z,Xprime,Yprime,Zprime]; state order=positionX, positionY, positionZ, velocityX, velocityY, velocityZ; units=km, km, km, km/sec, km/sec, km/sec.

## Record number convention

project zero-based index i is requested through official SPKR02 with an interior reader ET for record number i+1

## Record payload identity

exact=462; mismatch=0; official reader bits와 project record bits를 Binary64 전건 비교했다.

## Exact ET identity

evidence query ET bits를 native evaluator 입력에 그대로 전달했고 reader용 candidate-selecting ET와 evaluator query ET를 분리 기록했다.

## Selected record project/official 비교

P0 vs O0 exact=0; one-ULP=82; over-one-ULP=72.

## Selected official/high-level 비교

O0 vs H exact=154.

## Previous/next official candidate 비교

O-1 vs H exact=0; O+1 vs H exact=0; multiple=0; no-match=0.

## 기존 82/66 및 기타 분류 교차

{"byExistingGroup":{"candidate_state_different":{"count":144,"selectedProjectOfficialExact":0,"selectedOfficialHighLevelExact":144,"previousOfficialHighLevelExact":0,"nextOfficialHighLevelExact":0,"officialProjectOneUlp":194,"officialHighLevelOneUlp":175,"payloadMismatch":0,"noPairMatch":0,"primaryClassification":{"official_selected_matches_pair_project_differs":144}},"state_equivalent_selection_different":{"count":10,"selectedProjectOfficialExact":0,"selectedOfficialHighLevelExact":10,"previousOfficialHighLevelExact":0,"nextOfficialHighLevelExact":0,"officialProjectOneUlp":21,"officialHighLevelOneUlp":12,"payloadMismatch":0,"noPairMatch":0,"primaryClassification":{"official_selected_matches_pair_project_differs":10}}},"byRecordNeighborhoodClassification":{"adjacent_record_one_ulp_from_cspice":{"count":5,"selectedProjectOfficialExact":0,"selectedOfficialHighLevelExact":5,"previousOfficialHighLevelExact":0,"nextOfficialHighLevelExact":0,"officialProjectOneUlp":3,"officialHighLevelOneUlp":6,"payloadMismatch":0,"noPairMatch":0,"primaryClassification":{"official_selected_matches_pair_project_differs":5}},"previous_record_matches_cspice":{"count":1,"selectedProjectOfficialExact":0,"selectedOfficialHighLevelExact":1,"previousOfficialHighLevelExact":0,"nextOfficialHighLevelExact":0,"officialProjectOneUlp":1,"officialHighLevelOneUlp":2,"payloadMismatch":0,"noPairMatch":0,"primaryClassification":{"official_selected_matches_pair_project_differs":1}},"record_neighborhood_no_match":{"count":66,"selectedProjectOfficialExact":0,"selectedOfficialHighLevelExact":66,"previousOfficialHighLevelExact":0,"nextOfficialHighLevelExact":0,"officialProjectOneUlp":42,"officialHighLevelOneUlp":72,"payloadMismatch":0,"noPairMatch":0,"primaryClassification":{"official_selected_matches_pair_project_differs":66}},"selected_record_one_ulp_from_cspice":{"count":82,"selectedProjectOfficialExact":0,"selectedOfficialHighLevelExact":82,"previousOfficialHighLevelExact":0,"nextOfficialHighLevelExact":0,"officialProjectOneUlp":169,"officialHighLevelOneUlp":107,"payloadMismatch":0,"noPairMatch":0,"primaryClassification":{"official_selected_matches_pair_project_differs":82}}}}

## Project evaluation trace

payload exact이고 P0와 O0가 다른 경우에만 project polynomial output/derivative/scale bits를 기록했다. CSPICE 내부 accumulator divergence로 해석하지 않는다.

## 확정 가능한 사항

- Official N0067 SPKR02/ SPKE02 low-level evaluation outputs and exact Binary64 bits were recorded for the bounded selected/previous/next candidates.
- Official record payload identity is compared against the existing project extractor before evaluator conclusions are classified.
- The official low-level evaluation of a candidate is compared with the audited CSPICE high-level pair-state without observing high-level internal selection.

## High-level 선택과 일관되는 후보 설명

- A matching official adjacent candidate is consistent with that candidate evaluation reproducing the high-level pair-state; it does not expose the high-level query selected record.

## 확정할 수 없는 CSPICE 내부 선택

- High-level CSPICE selected segment, selected record, body route, and accumulator order remain unobserved.
- Official internal CHBINT accumulator intermediates are not exposed by SPKE02.

## 다음 단계 진입 조건

bounded official low-level evidence가 완성되었으며, high-level 내부 selected segment/record/route/order를 관측했다는 표현은 사용하지 않는다.

## Primary classification

{"official_selected_matches_pair_project_differs":154}

## Contract state

{"selectionUnresolved":1701,"toleranceChanged":false,"canonicalSelectionChanged":false,"activeTransition":false,"scientificApproval":false,"productionIntegration":false}
