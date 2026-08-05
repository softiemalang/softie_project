# Tianfu representation search v1

- Overall verdict: `equivalent_representation_proven`
- Source table correction: 10/12 predecessor cells corrected; predecessor 25/125 baseline preserved.
- Candidates: 696; every candidate tested against 150 integrated rows.
- Exact numerical fits: affine-same-rotation-06, presentation-in-same-00-out-same-06, presentation-in-same-01-out-same-05, presentation-in-same-02-out-same-04, presentation-in-same-03-out-same-03, presentation-in-same-04-out-same-02, presentation-in-same-05-out-same-01, presentation-in-same-06-out-same-00, presentation-in-same-07-out-same-11, presentation-in-same-08-out-same-10, presentation-in-same-09-out-same-09, presentation-in-same-10-out-same-08, presentation-in-same-11-out-same-07, presentation-in-reverse-00-out-reverse-02, presentation-in-reverse-01-out-reverse-01, presentation-in-reverse-02-out-reverse-00, presentation-in-reverse-03-out-reverse-11, presentation-in-reverse-04-out-reverse-10, presentation-in-reverse-05-out-reverse-09, presentation-in-reverse-06-out-reverse-08, presentation-in-reverse-07-out-reverse-07, presentation-in-reverse-08-out-reverse-06, presentation-in-reverse-09-out-reverse-05, presentation-in-reverse-10-out-reverse-04, presentation-in-reverse-11-out-reverse-03, layout-top_to_bottom-as_drawn-index-0-reference-03, layout-top_to_bottom-as_drawn-index-0-reference-09, layout-top_to_bottom-as_drawn-index-1-reference-02, layout-top_to_bottom-as_drawn-index-1-reference-08.
- Nanbei source equation: `tianfu = mod(4 - ziwei)`.
- Ming p172 independently supplies the `安天府圖` rule anchors: same palace at 寅/申 and the explicit 丑→卯 example; its drawn branch ring is preserved without synthetic cell flattening.
- Production equation observed from the existing route: `tianfu = mod(10 - ziwei)`.
- The corrected source equation and production route have the same reverse direction and differ by a fixed six-step anchor, so the evidenced candidate `affine-same-rotation-06` has zero residual over all 150 rows.
- The identity candidate's minimum counterexample is `integrated-bureau-2-day-01`: source `卯` versus production `酉`.
- Conclusion: the v0 125/150 mismatch is not a substantive cross-edition Tianfu rule divergence. It is explained by the predecessor transcription defect plus the production/source coordinate anchor difference. No production or readiness change follows.

## Implementation impact

Production calculation, public contracts, readiness, grounding, activation, and source promotion are unchanged.
