# Scheduler interaction and visual detail audit v1

Verdict: `complete_scheduler_interaction_visual_detail_audit_v1_uncommitted`

## Scope

This audit covers Scheduler flows only: Today load/status, push status, event completion/edit entry, reservation create, reservation edit/delete, filter/work-time controls, and work-log sync/detail/delete. It does not change business data contracts, Supabase/API/auth behavior, dependencies, deployment, or `DESIGN.md`.

The pre-existing untracked `-.jpg` remains outside the work order. No staging, commit, push, deploy, or remote mutation is part of this verdict.

## Evidence boundaries

- Apple official guidance supports legible controls, understandable feedback, a 44pt default control target, and respecting Reduce Motion. It does not establish Softie CSS values.
- W3C status-message, target-size, and modal-dialog guidance establish web semantics and behavior boundaries. They do not prove iPhone runtime behavior.
- Emil guidance is one external design-engineering lineage. Repeated claims inside that corpus count once and do not authorize adoption by themselves.
- Repository code, `AGENTS.md`, and `DESIGN.md` establish the actual product and house-rule boundary.
- Browser/device evidence is absent in this environment. Source/test/build evidence must not be described as screenshot, VoiceOver, or physical-device proof.

## Implemented fixes and pilot

- Loading, empty, filter-no-result, and error meanings are separated; refetch clears stale errors and exposes one busy cue.
- Event completion uses a per-row synchronous lock, stable toggle name, `aria-pressed`, and `aria-busy`.
- Push and work-log operations use synchronous action locks and render lifecycle-scoped live success/error feedback; destructive work-log deletion confirms exact context and locks per row.
- Filter toggle controls are a named semantic group.
- Reservation deletion returns through the existing view-transition route contract; create-result scrolling is immediate.
- Raw press transforms were removed from the FAB and glass-owning setting/status controls. The event-action 160ms transform-only pilot remains narrowly scoped.
- Representative hierarchy pilot: `지금 처리할 일`, not the duplicated `오늘 전체` aggregate, owns primary emphasis.

## Motion review

| Surface | Before | After | Why |
| --- | --- | --- | --- |
| Scheduler FAB | 200ms scale press before route transition | Static geometry; shadow feedback only | Avoids redundant motion before the 180ms route crossfade |
| Setting/status glass | Glass owner scaled on press | Static glass; background feedback only | A backdrop-filter surface must not be the transform target |
| Event completion | 160ms transform-only press pilot | Preserved | It is scoped, interruptible, and has reduced-motion fallback |
| Create success scroll | Smooth scroll | Immediate scroll | No demonstrated value for unbounded travel after save |
| Route transition | Browser-default 180ms crossfade | Preserved | Existing admitted navigation role |

Motion verdict: approve the bounded removals and preserved role separation; reject new sheet/modal choreography.

## Holds and device validation needed

- Hold save-success destination changes until rapid-entry versus return-to-list intent is decided.
- Hold custom modal expansion until focus entry, containment, inert background, Escape, and trigger restoration are proven together.
- Hold hour-only picker constraints until iPhone Safari confirms that minute choices are not silently normalized.
- Hold required-field copy/sticky save layout changes until the long editor is checked on the smallest supported iPhone.
- Verify at 375x667 and a current 393x852-class iPhone: 44x44 targets, safe-area FAB, no zoom/overflow, double-tap exclusion, native pickers, VoiceOver toggle state, hardware-keyboard focus order, modal lifecycle, push/PWA status, and work-log deletion recovery.

## Validation boundary

Focused Scheduler, motion, accessibility, and historical-artifact replay tests pass. The final full-suite rerun after descendant-safe historical replay remediation recorded 663 tests: 626 passed, 35 failed, and 2 skipped. All 35 failures match missing explicit Ziwei PDF source blockers (`MISSING_SOURCE_FILE` / required PDF source paths), with zero new non-PDF failures. Browser automation was unavailable.
