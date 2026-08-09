# Saju five-classics claim-grounding frontier v0

This packet records a claim-level source-relation assessment against the five locally available texts named by the work order. It advances the provenance frontier without promoting any claim to classical verification, semantic authority, readiness, or production activation.

## Local corpus

The materializer reads these exact files from `/Users/softie/Documents/malang_lab/documents` and hashes their current bytes:

- `子平真诠-沈孝瞻原著.pdf`
- `滴天髓.pdf`
- `淵海子平.pdf`
- `穷通宝鉴.pdf`
- `三命通會.pdf`

All five files have locally verified byte identity and page counts, but `editionIdentity` remains `unresolved_edition`. The observed provenance limits are preserved: 淵海子平 contains a visible “source unknown/unverified” warning; 窮通寶鑑 is marked as a 2026-08-04 维基文库 export; 三命通會 contains authorship/transmission caveats; 滴天髓 is a web-derived attribution export; 子平真詮 is a modern typeset local export.

## Closed research units

The artifact contains nine independent units with rendered-page locators, direct visual observations, short candidate transcriptions, relation decisions, and explicit non-support/tension boundaries. The one-to-one unit inventory is:

1. `five-classics.branch-relations.ziping-p5`: 子平真詮 p.5, 刑、沖、會、合 definitions and examples.
2. `five-classics.day-master-and-month-command.yuanhai-p6-p7`: 淵海子平 p.6–7, day-as-host and month-command framing.
3. `five-classics.hidden-stems-and-ten-gods.yuanhai-p4`: 淵海子平 p.4, hidden-stem and ten-god label scope.
4. `five-classics.four-pillars-and-hour-stem.sanming-p65-p70`: 三命通會 p.65–70, 人元、四時節氣、月時法 and 四柱 framing.
5. `five-classics.seasonal-strength.ditian-p4`: 滴天髓 p.4, qualitative seasonal strength and 甲木 conditions.
6. `five-classics.seasonal-element-and-yongshin.qiongtong-p2-p4-p7`: 窮通寶鑑 p.2, p.4, p.7, seasonal element weighting and 用神 scope.
7. `five-classics.element-generation-and-branch-origin.sanming-p4-p6`: 三命通會 p.4–6, element generation/control and stem-branch framing.
8. `five-classics.yongshin-and-gyeokguk.ziping-p6-p26`: 子平真詮 p.6 and p.26, 用神/雜格 rule-scope comparison.
9. `five-classics.timing-exact-boundary.ziping-p25`: 子平真詮 p.25, 取運 material checked against the exact timing contract.

The resulting relation assessment covers every current canonical claim from `artifacts/saju-v1-local-frontier-v0/complete.json`. The current snapshot is 43 claims and 126 occurrences; the artifact materializer derives these counts rather than assuming them. The relation statuses are partial support or scope tension for observed classical vocabulary and framing, not proof of repository coefficients or chart-specific outputs.

## Boundary

No claim was promoted. Readiness remains `blocked_unchanged`, `availableForInterpretation: false`, `integrationStatus: not_connected`, `serviceEligibility: blocked`, and `stableClaimBoundary: 0`. The remaining blockers are edition identity/transmission history, independent alternate witnesses/oracles, exact missing-time and shinsal source rules, and the mismatch between qualitative source language and repository numeric/timing heuristics.

Machine-readable artifact and checker:

- `artifacts/saju-five-classics-grounding-v0/complete.json`
- `scripts/materialize-saju-five-classics-grounding-v0.mjs`
- `scripts/check-saju-five-classics-grounding-v0.mjs`
