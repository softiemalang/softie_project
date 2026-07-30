# DE405 selection trace analysis

## 606건 결과

- Trace count: 1212
- Selection observable: 0
- Selection unobservable: 606
- Mechanism: selection_not_observable=606
- Epochs: exact=558, next-up=26, next-down=22

## 1095건 결과

- Selection unobservable: 1095
- Mechanism: selection_not_observable=1095
- One-ULP shared candidate boundaries: 1095
- next-up / next-down: 547 / 548

## velocity-only 9건 결과

- Velocity-only rows: 9
- No distinct evaluation path is confirmed because selection and coefficient-block inputs are not exposed.

## next-up / next-down 대칭성

The 1,095 rows retain the recorded 547 next-up / 548 next-down split. This is a strong correlation, not a confirmed mechanism.

## selection observability 한계

JPL official STATE and CSPICE spkez_c do not expose the actual selected logical Type 2/JPL record marker through the used APIs. Every trace records selectionObservable:false and a machine-readable unavailable reason; no selected record is inferred from candidate equality.

## logical record 비교 결과

Comparable: 0. Not comparable: 1701.

## normalized time 비교 결과

Comparable: 0. Normalized time is not attributed to a selected candidate when that candidate is not observable.

## evaluation path 비교 결과

No coefficient-block or evaluator-path equality claim is made.

## 확정 가능한 메커니즘

Only population preservation and trace observability limits are confirmed.

## 아직 확정할 수 없는 메커니즘

Selected-record direction, subinterval equality, normalized-time equality, coefficient-block equality, and evaluator-only divergence remain not computable.

## 다음 단계 진입 조건

A native API or instrumented official-reader/CSPICE build that exposes the actual selected record marker without changing computation is required before promoting a mechanism beyond unresolved.
