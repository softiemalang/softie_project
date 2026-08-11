# Softie Design Reference Audit v1 — Emil corpus 10/10 incremental audit

- Verdict: `complete_softie_design_reference_incremental_emil10_audit_uncommitted`
- Audit date: 2026-08-11
- Scope: deterministic incremental evidence artifact only. No UI/CSS/application behavior/DESIGN.md/v1/source-Skill change was made.

## Authority and provenance boundary

| Tier | Meaning | Decision boundary |
| --- | --- | --- |
| T1 | Apple official artifact | Preserved from v1; not re-opened by this increment |
| T2 | Apple-derived guidance | Preserved from v1; not treated as Apple primary |
| T3 | Independent design-engineering guidance | Emil corpus; one author/repository/revision lineage, not ten independent authorities |
| T4 | Softie house rule | DESIGN.md/code; installation does not change it |
| T5 | Proposed candidate | Pilot hypothesis only |

- Upstream repository: `emilkowalski/skills`
- Upstream ref/revision: `refs/heads/main` / `78761e1b57f97dce65b983d640c70a68f39e8163`
- Installed corpus: 10/10 skills; every lock hash recomputed from local bytes: **pass**
- Lineage: `LG-EMIL10-78761e1b57f9`; independent authority count: **1**

The pinned revision and companion-file inventory come from `THIRD_PARTY_NOTICES.md`; `skills-lock.json` is verified against the actual installed files. Skill installation is not Softie house-rule adoption.

## Investigated new seven Skills

| Skill | Relatedness to loading reveal | Incremental result |
| --- | --- | --- |
| `animation-vocabulary` | Adjacent naming | Names Enter/Exit, Fade, Crossfade, Reveal, Skeleton/Shimmer; no duration or product prescription |
| `ask-sonner` | Not applicable to Scheduler inline list | Loading-to-success toast semantics only; no loading-reveal duration |
| `emil-design-eng` | Direct for enter easing; adjacent for duration/property recipes | `ease-out`, custom curve, role ranges, reduced-motion and property guidance; no loading-specific number |
| `find-animation-opportunities` | Direct opportunity match | Conditional content swap/teleporting-state seam; gate requires purpose, restraint, and no decorative motion in data being read |
| `improve-animations` | General audit framework | Repeats the same role ranges/property/reduced-motion rules and explicitly derives from Emil philosophy; no independent authority |
| `pick-ui-library` | General tool choice | Simple fade uses plain CSS; no need for a motion library and no duration evidence |
| `prototype` | Not applicable to product loading | Picker variant swap is instant; prototype chrome does not prescribe Scheduler loading |

Observation count: **19**. Exact quoted values are retained in `new-skill-observation-ledger.json` with path/line references and role classifications.

## Loading → loaded classification

- Canonical type: `state_triggered_content_enter_after_async_fetch`
- Primary corpus match: `teleporting state` / conditional content swap. The purpose is `state_indication` plus `preventing_a_jarring_change`.
- `Enter / Exit` is the primary vocabulary. `Fade in / Fade out` is the safest visual mechanism for this dense list pilot.
- `Crossfade` is conditional on actual overlap; `Reveal` is only accurate if a clip-path/mask is used. `Scroll reveal`, `Page transition`, `View transition`, and `Skeleton/Shimmer` are not automatic matches.
- Current Scheduler code meets the opportunity seam: first fetch mounts list content after a loading/empty conditional state, while refetch keeps old events. Therefore the pilot remains first empty-state success only.

## Scheduler applicability and v1 correction

- `loadEvents()` sets loading, awaits the Today query, commits rows, and clears loading for the latest request; a refetch does not clear the old events first.
- v1 wording requires an amend: `hideEmptyText` suppresses the first two sections’ post-load empty labels, but `SchedulerEventSection` explicitly renders `불러오는 중...` while loading regardless of that flag.
- The current code has no `firstFetch`/`hasLoaded` distinction and no content-entry reveal. A future pilot must prove the first empty-state success boundary without animating stale refetches.
- The list is operational data users read and act on, so an opacity-only minimal cue is a contextual pilot inference; it is not a corpus-wide transform prohibition.

## Duration / easing evidence

| Candidate | Corpus role | Direct loading support | Disposition |
| --- | --- | --- | --- |
| 150ms | dropdown/select range lower bound (150-250ms) | **no** | not_preferred_for_loading |
| 160ms | button press feedback | **no** | not_preferred_for_loading |
| 180ms | Softie duration-fast and Scheduler route application; adjacent corpus select example | **no** | bounded_pilot_candidate_only |
| 200ms | button-content/crossfade or clip-path/release recipe | **no** | bounded_pilot_candidate_only |
| 250ms | prototype picker highlight spatial feedback | **no** | not_applicable_for_loading |
| 4000ms | Sonner toast auto-close lifetime | **no** | not_applicable_for_loading |

Final duration decision: **insufficient_to_prefer**. No observed value is directly assigned to async loaded-content entry in the corpus; the `4000ms` value is a toast lifetime, not an animation duration.
- `directly_supported`: none. `range_supported_candidate`: the broad `under-300ms` UI budget only. `softie_empirical_candidate`: `180ms` as an applied baseline with device-pass evidence still unverified. Final selection: `insufficient_to_prefer`.
- `180ms` is retained as the existing T4 Softie/applied baseline and may be the control condition only.
- `200ms` is an existing exact adjacent-role value and may be the one bounded comparison condition only.
- These two values are not a preference claim. If no feel pilot is authorized, select neither.

### Fixed pilot variables if a comparison is later authorized

- Easing: `cubic-bezier(0.23, 1, 0.32, 1)` (`ease-out` for entering content).
- Property: opacity only for the Scheduler Today pilot, because the list is dense data users read and act on. This is a bounded product inference; the corpus general rule permits transform plus opacity and does not universally ban transform.
- Transform: avoid in this pilot; no layout properties; no stagger; no refetch animation.
- Reduced motion: static state or short opacity/color-only equivalent; preserve loading versus empty information and remove movement/overshoot.
- Tool: plain CSS transition or `@starting-style`; no new animation dependency.

## 180ms status reclassification

- **Confirmed:** `180ms` is a T4 Softie house value from `DESIGN.md`/code; its original selection provenance is not recorded.
- **Confirmed as code fact:** Scheduler route View Transition CSS currently applies the shared `180ms` token with the existing custom curve.
- **Not evidenced in current main:** a physical-device feel validation pass for that route value. Structural tests and code presence are not device evidence.
- **Separate loading boundary:** loading reveal has no validation at 180ms; route application cannot authorize loading usage.

## v1 relations

- Confirm: 5 v1 conclusions, including the loading pilot status, opportunity seam, reduced-motion gate, no-stagger/refetch boundary, and no new indicator contract.
- Amend: 4 conclusions, clarifying the loading type, lack of loading-specific duration, and the unverified physical-device claim for route 180ms.
- Supersede: none. Design Reference Audit v1 and all source Skill files remain unchanged.

## Unresolved blockers

- **BLK-EMIL10-NO-LOADING-DURATION — loading_role_duration_missing:** The pinned corpus provides role ranges and adjacent exact values but no duration explicitly assigned to async loaded-content entry. Mitigation: Keep recommendationClass insufficient_to_prefer; use no value as an adopted rule.
- **BLK-EMIL10-180-ORIGIN — 180ms_original_selection_provenance:** DESIGN.md and v1 identify 180ms as a T4 Softie value, but do not identify its original selection rationale. Mitigation: Do not attribute 180ms to Apple or Emil; retain it as house/applied code evidence only.
- **BLK-EMIL10-ROUTE-DEVICE-EVIDENCE — route_180ms_physical_device_validation:** The current main worktree contains route CSS and structural tests but no physical-device feel log proving that 180ms passed device validation. Mitigation: Describe route 180ms as applied/observed code, not a verified empirical pass; require device evidence before promotion.
- **BLK-EMIL10-LOADING-FEEL — loading_reveal_runtime_feel:** No browser or physical-device feel check was performed for a loaded-content reveal. Mitigation: If a pilot is authorized, compare only the bounded pair with easing/properties fixed and inspect dense-list scanning.
- **BLK-EMIL10-REDUCED-MOTION-CONFLICT — house_rule_vs_corpus_reduced_motion:** The corpus says reduced motion is fewer/gentler rather than zero, while DESIGN.md and current CSS often collapse durations to near-zero. Mitigation: Keep this as an adoption decision and pilot gate; do not change DESIGN.md or global CSS in this audit.

## Validation contract

- Materializer output is canonical UTF-8 JSON with stable key ordering and final LF.
- `complete.json.integrity.json` hashes `complete.json` and every companion independently.
- The focused checker verifies lock hashes, source quotes, lineage deduplication, relation boundaries, companion equality, and artifact identity.
- Build/npm test are intentionally skipped for this document/artifact-only work; `git diff --check` and focused checker/test are the relevant checks.
- Staging, commit, push, deploy, and remote DB changes are outside scope.
