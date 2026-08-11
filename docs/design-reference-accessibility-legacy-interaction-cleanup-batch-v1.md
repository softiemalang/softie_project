# Softie accessibility and legacy interaction cleanup batch v1

- Verdict: `complete_softie_accessibility_legacy_interaction_cleanup_batch_v1_uncommitted`
- Baseline HEAD: `fe39120e5c3c703038c6d957a376dc64cd62a5fd`
- Scope: repository-wide low-risk accessibility and legacy interaction audit, bounded fixes, deterministic incremental evidence, and regression checks.

## Frontier decisions

| Frontier | Decision | Closed surface or boundary |
| --- | --- | --- |
| `FRONTIER-NONSEMANTIC-ACTIONS` | `fix` | Rehearsal month reset and date cells now use native buttons. |
| `FRONTIER-FOCUS-VISIBLE` | `fix` | Rehearsal month/date/time controls expose visible keyboard focus, including the transparent native picker shell. |
| `FRONTIER-LEGACY-REDUCED-MOTION` | `fix` | Audited Scheduler, Spotify, and Interpretation Prep transforms and width interpolation stop under reduced motion while state signals remain. |
| `FRONTIER-TOUCH-KEYBOARD-STATE-SEMANTICS` | `fix` | Rehearsal target sizes, Band pressed state, compact button-group roles, and Prep gender button state are explicit. |
| `FRONTIER-TRANSITION-PROPERTY-COHERENCE` | `fix` | `transition: all` and two undefined legacy transition variables are removed without unifying unrelated timing roles. |
| `FRONTIER-SCHEDULER-SYNC-TOAST-GLASS` | `fix` | The toast keeps its ARIA/lifecycle and glass appearance but the glass surface is static. |
| `FRONTIER-LEGACY-HOVER-GATING` | `fix` | Remaining visual hover rules are fine-pointer/fine-hover gated; active and focus paths remain independent. |
| `FRONTIER-LEAD-SHEET-DENSE-OVERLAYS` | `hold` | Full-screen touch zones, the small backup badge, and dense performance controls need separate focus-order/layout/device validation. |

## DESIGN promotion

- Use native `button` for actions instead of rebuilding keyboard activation on clickable `div`/`span` targets.
- Do not suppress the visible `focus-visible` state of native controls.
- Preserve disabled and visible busy-state text; `aria-busy` may be attached when that control is the active work subject.
- The representative Rehearsal ring recipe is not a global focus-ring token.

## Before to after

- Rehearsal month/date: pointer-only `span`/`div` to keyboard-operable native buttons with labels and selected/current state.
- Rehearsal time picker: removed the `focus-visible` suppression and exposed the transparent native input's focus through `:focus-within`.
- Scheduler sync toast: self-animated `backdrop-filter` surface to static glass; its conditional `role="status"`, polite live region, success trigger, timer cleanup, and 1800ms lifetime are unchanged.
- Legacy reduced motion: movement end states and width interpolation stop; color/background/opacity/text state remain.
- Legacy transitions: explicit property lists replace `all`; repeated raw numbers are not promoted into a universal token.

## Evidence and independence

- `AGENTS.md`, `DESIGN.md`, actual DOM/CSS, and frozen Softie artifacts remain repository/house evidence.
- W3C WCAG/APG and Apple official guidance are separately identified primary external guidance.
- Apple-derived and Emil Skills remain external adjacent-role guidance. Emil 10 is one repository/revision/author lineage, so repeated claims count once.
- No product/device evidence was manufactured. The Lead Sheet hold remains open for that reason.
- The previous low-risk artifact bytes and integrity hashes remain unchanged. Its checker is hardened to accept only exact current, generation-base, or ancestry-path committed bytes and otherwise fails closed.

## Preservation boundaries

- Scheduler async content enter remains its separate opacity-only 200ms house role.
- Scheduler route View Transition remains its separate 180ms browser-default baseline.
- Scheduler press feedback remains its separate 160ms pilot; this batch does not promote it.
- No business, data, auth, API, Supabase, dependency, route architecture, deployment, or remote mutation is included.
- The untracked `?? -.jpg` remains outside the batch.
