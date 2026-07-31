# DE405 Type-2 Evaluator First-Divergence Trace Evidence

## 조사 목적

동일한 Type-2 record bits와 ET bits를 입력해 project-owned evaluator와 공식 CSPICE SPKE02 evaluator의 parity-validated intermediate trace를 비교한다.

## 154건 선정 기준

cohort=154; linked/instrumented parity=154; project reproduction=154; input identity=154. 기존 P0/O0 분포는 one-ULP 82건, over-one-ULP 72건이다.

## 공식 CSPICE source 및 dependency

spke02={"path":"/Users/softie/.local/share/softie-de405/cspice/N0067/src/cspice/spke02.c","sizeBytes":10818,"sha256":"e6d934db2793c3cf10b590743db6609a089383551881c5add229eb585ea0472b"}; chbint={"path":"/Users/softie/.local/share/softie-de405/cspice/N0067/src/cspice/chbint.c","sizeBytes":12372,"sha256":"0d37a160f6e5cf2542b21653631650df5db581f18e2d8012786d072ac77e99ca"}; linked libraries={"cspice":{"path":"/Users/softie/.local/share/softie-de405/cspice/N0067/lib/cspice.a","sizeBytes":6991568,"sha256":"f3a1adf1742c7a63c390834f4227936a36e3c18dd78bf427bc96a04b703946f3"},"csupport":{"path":"/Users/softie/.local/share/softie-de405/cspice/N0067/lib/csupport.a","sizeBytes":888144,"sha256":"6f293e8a096860279a349743b420ad53b323c3df13cab8b4befbd47bfec2197b"}}.

## 계측 방법과 원본 보존

설치된 CSPICE source는 수정하지 않고 SHA-256과 anchor를 검사한 임시 복사본에 diagnostic symbol과 callback을 삽입했다. instrumented source와 binary는 build output에만 보관한다.

## Instrumented/linked official final parity

154/154 sample의 6개 state component가 bitwise 동일하다.

## Project trace final reproduction

154/154 sample의 project trace final이 기존 P0와 bitwise 동일하다.

## 공통 input identity

154/154 sample에서 record payload와 query ET bits가 일치한다.

## Record layout 대조

record midpoint/radius, coefficient block start/count/fingerprint, first/last coefficient bits를 비교했다.

## Normalized time 대조

공식 CHBINT의 `s`, `2*s`와 project evaluator의 normalized-time 결과를 Binary64 bits로 비교했다.

## Coefficient layout 대조

각 component의 coefficient slice와 payload identity를 비교했다.

## Position recurrence 대조

각 operation의 coefficient, Chebyshev recurrence temporaries, position polynomial output bits를 기록했다.

## Velocity derivative 대조

각 operation의 derivative recurrence temporaries와 unscaled derivative output bits를 기록했다.

## Velocity scaling 대조

time/radius operand와 scaled velocity result bits를 기록했다.

## First-divergence 결과

primary={"position_recurrence_divergence":93,"velocity_derivative_divergence":61}; stage={"position_polynomial":93,"velocity_derivative":61}; component={"positionX":29,"positionY":33,"positionZ":31,"velocityX":19,"velocityY":19,"velocityZ":23}.

## 82/72 교차 분석

within-one-ULP={"count":82,"firstDivergentStage":{"position_polynomial":47,"velocity_derivative":35},"firstDivergentComponent":{"positionX":20,"positionY":16,"positionZ":11,"velocityX":11,"velocityY":12,"velocityZ":12},"firstDivergentOperationKind":{"polynomial_output":1,"position_recurrence":46,"velocity_derivative_recurrence":35},"recurrenceDepth":{"2":14,"3":15,"4":8,"5":7,"6":13,"7":10,"8":1,"9":1,"10":6,"11":6,"none":1},"positionVelocityOrder":{"position_diverges_first_or_same_stage":72,"velocity_diverges_first":10},"normalizedTimeRegion":{"interior":37,"minus_one":7,"outside_domain":38},"ulpDirection":{"project_above_official":41,"project_below_official":41},"primaryClassification":{"position_recurrence_divergence":47,"velocity_derivative_divergence":35}}; over-one-ULP={"count":72,"firstDivergentStage":{"position_polynomial":46,"velocity_derivative":26},"firstDivergentComponent":{"positionX":9,"positionY":17,"positionZ":20,"velocityX":8,"velocityY":7,"velocityZ":11},"firstDivergentOperationKind":{"position_recurrence":46,"velocity_derivative_recurrence":26},"recurrenceDepth":{"2":10,"3":16,"4":11,"5":5,"6":8,"7":7,"8":5,"9":3,"10":3,"11":4},"positionVelocityOrder":{"position_diverges_first_or_same_stage":70,"velocity_diverges_first":2},"normalizedTimeRegion":{"interior":48,"outside_domain":24},"ulpDirection":{"project_above_official":38,"project_below_official":34},"primaryClassification":{"position_recurrence_divergence":46,"velocity_derivative_divergence":26}}.

## Source-contract 구조 차이

{"status":"source_contract_structurally_different","official":{"routine":"spke02_ -> chbint_","normalizedTime":"s=(et-record[1])/record[2]; s2=s*2","recurrence":"w0=cp[j-1]+(s2*w1-w2); d0=(w1*2 + d1*s2) - d2","derivativeScaling":"dpdx=(w0+s*dw0-dw1)/record[2]"},"project":{"routine":"project-owned cheby","normalizedTime":"normalized=(et-midpoint)/radius; twice=2*normalized","recurrence":"w0=cp[j-1]+(twice*w1-w2); d0=w1*2 + (d1*twice-d2)","derivativeScaling":"velocity=(w0+normalized*d0-d1)/radius"},"qualification":"The source structure difference is confirmed from the inspected sources; it is not by itself a causal attribution."}

## 확정 가능한 사항

- All 154 source samples have identical record payload bits and query ET bits for linked official, instrumented official, and project evaluation.
- The temporary instrumented official evaluator reproduces linked CSPICE output bitwise for 154/154 samples.
- The project trace reproduces existing P0 bitwise for 154/154 samples.
- The first differing captured stage is an observation of the two diagnostic evaluators under the stated source and compiler contract.

## 상관관계와 후보 설명

- The source contract has a confirmed structural recurrence-order difference: official CHBINT uses left-associated derivative accumulation while the project evaluator groups the final subtraction inside the right operand.
- The 82/72 final ULP groups can be cross-tabulated against trace stages without upgrading the cross-tabulation to causal proof.
- The observed velocity-derivative divergence is consistent with the confirmed source recurrence-order difference; the trace does not establish that this is the only cause of every residual.
- A final position or velocity ULP distribution may correlate with normalized-time region, degree, or record identity, but those correlations remain candidate explanations.

## 확정할 수 없는 high-level CSPICE 내부 경로

- High-level CSPICE selected segment, selected record, route, and accumulator order are not observed.
- Unexposed official library temporaries outside the parity-validated temporary source instrumentation are not available.
- JPL internal evaluator behavior is not measured by this trace.

## 다음 단계 진입 조건

공식 source capability, instrumented/linked final parity, project final reproduction, common input identity, raw artifact identity, and deterministic freshness checks가 모두 유지되어야 한다. high-level route/selection 관측 주장은 허용하지 않는다.

## Contract state

{"selectionUnresolved":1701,"toleranceChanged":false,"canonicalSelectionChanged":false,"activeTransition":false,"scientificApproval":false,"productionIntegration":false}
