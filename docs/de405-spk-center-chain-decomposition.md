# DE405 Center-Chain Decomposition Evidence

## 조사 목적

Project Type 2 direct state와 target/center-to-SSB composition을 CSPICE API states와 분리해 비교한다. CSPICE 내부 route나 selected record는 관측하지 않는다.

## 결과

- Samples: 1701; control: 1222; mismatch: 479
- Primary divergence: {"both_target_and_center_chains_diverge":64,"center_chain_diverges":243,"control_project_direct_matches_cspice":1222,"project_components_match_cspice_but_final_composition_diverges":97,"target_chain_diverges":75}
- Target chain: {"match":1520,"different":181}
- Center chain: {"match":1258,"different":443}

## 관측 경계

Project chain leg, accumulator, and binary64 subtraction are project calculations. CSPICE values are API-state comparisons only. JPL internal route/selection is not inferred.

## 계약 상태

selection_unresolved remains 1,701. Tolerance, canonical selection, active transition, scientific approval, and production integration remain unchanged.
