# Softie low-risk interaction foundation batch v1

- Verdict: `complete_softie_low_risk_interaction_foundation_batch_v1_uncommitted`
- Baseline HEAD: `52df5f9ac7d3309140b076711de0fc008ae4db82`
- Scope: low-risk interaction rules, two representative CSS corrections, deterministic evidence, and regression tests only.

## Frontier decisions

| Frontier | Decision | Surfaces | Blockers |
| --- | --- | --- | --- |
| FRONTIER-PRESS-FEEDBACK | pilot | Scheduler event completion/edit action family | BLK-PRESS-DEVICE-FEEL |
| FRONTIER-HOVER-POINTER-GATING | adopt | Atmospheric common actions; Home service cards | none |
| FRONTIER-SMALL-OVERLAY-MOTION | hold | Home Softie Memo modal sheet; Scheduler sync status toast as an adjacent glass exception | BLK-OVERLAY-GLASS-COMPOSITING, BLK-OVERLAY-EXIT-LIFECYCLE, BLK-OVERLAY-DEVICE-FEEL, BLK-SYNC-TOAST-GLASS-EXCEPTION |
| FRONTIER-REDUCED-MOTION | adopt | Atmospheric theme baseline; Home service cards; Scheduler event actions; Rehearsal modal | BLK-REDUCED-MOTION-LEGACY-COVERAGE |
| FRONTIER-MOTION-TOKEN-COHERENCE | adopt | DESIGN.md motion contract and shared CSS tokens | BLK-TOKEN-LEGACY-MIXED-VALUES |
| FRONTIER-ANIMATED-GLASS-MATERIAL | reject | Home Memo and Scheduler glass overlays | none |

## Promoted DESIGN rules

- Hover-only visual effects are gated with `(hover: hover) and (pointer: fine)` and never carry unique information.
- Reduced motion removes movement/scale/depth/animated blur while preserving feedback and state meaning through non-movement signals.
- Motion values and properties are role-scoped; numerical equality does not authorize one universal token.
- Custom pressed state begins during input while existing click/release activation semantics remain unchanged; exact recipe values stay pilot-scoped without device evidence.

## Preservation boundaries

- Frozen predecessor artifacts and their integrity sidecars were not rewritten.
- Scheduler async content enter remains the separate opacity-only 200ms house role.
- Scheduler route View Transition remains the separate 180ms browser-default baseline.
- No glass/backdrop-filter surface or ancestor received opacity/transform motion.
- No business, data, auth, API, dependency, layout, text-meaning, remote, Git publication, or deployment change was made.

## Evidence independence

- Emil 10 Skills are one repository/revision/author lineage at `78761e1b57f97dce65b983d640c70a68f39e8163`; repeated values count once.
- Apple official guidance, Apple-derived Skill guidance, Softie house evidence, and product/device evidence remain separate.
- No new product/device feel validation is claimed.
