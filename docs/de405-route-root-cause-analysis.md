# DE405 route root-cause and candidate shadow analysis

This report is generated from the existing untracked route and Type-2 evidence. It is shadow-only; no production route, evaluator, contract, tolerance, classification, or CSPICE source is changed.

## Verdict

complete_de405_route_root_cause_and_candidate_shadow_analysis_uncommitted

## Corpus and exact counts

- Joined authoritative cases: **1701/1,701**; duplicate/conflicting identities: **0/0**.
- Primary divergence: {"accumulator_output_divergence":513,"final_assembly_divergence":479,"raw_leg_state_divergence":709}.
- Baseline final exact: **1222**; observable route exact: **1583**; chain-length differences: **118**.
- Existing Type-2 shadow changed **371**, reached final exact **1583**, and improved the Type-2 chain parity cohort by **555**; the unchanged selection ambiguity contract remains **1,701**.

The values 1,222, 1,583, 118, 371, 555, 709, 513, and 479 are therefore separate predicates: final-state exactness, observable route exactness, chain-length difference, Type-2 output changes, Type-2 chain-improvement outcome, and the three first-divergence groups. The generated cross-tabs contain the stable case IDs needed to verify every intersection.

## Root-cause boundary

The 4 deterministic clusters are in de405-route-root-cause-clusters.jsonl; sentinels and compact traces are in de405-route-root-cause-sentinels.jsonl. Raw-leg and evaluator-order evidence is direct. Accumulator and final-assembly evidence is direct at the observed CSPICE wrapper boundary, but a project-side counterfactual hook is not present; those candidates are consequently diagnostic-only rather than inferred production fixes.

## Candidates

The official-order Type-2 candidate is independently replayed across all 1,701 cases. Accumulator-order and final-assembly candidates are shadow diagnostics on their applicable observed cohorts; the chain/route candidate is a recorded-event reference replay. These replays do not establish an implementable production mechanism because the needed project-side counterfactual hooks are unobserved or protected. The candidate registry, per-case outcomes, combinations, and readiness ranking are machine-readable artifacts. No candidate activates by default and no candidate changes classification.

## Artifacts

- de405-route-root-cause-joined.jsonl
- de405-route-root-cause-reconciliation.json
- de405-route-root-cause-cross-tabs.json
- de405-route-root-cause-clusters.jsonl
- de405-route-root-cause-sentinels.jsonl
- de405-route-candidate-registry.json
- de405-route-candidate-shadow-results.json
- de405-route-candidate-outcomes.jsonl
- de405-route-candidate-combinations.json
- de405-route-production-readiness.json
- de405-route-root-cause-summary.json

Wider regression is recorded in de405-route-wider-regression.json as reference_unavailable because no wider corpus exposes the same project-side counterfactual hook. Artifact hashes and storage identities are recorded in de405-route-root-cause-artifact-manifest.json.
