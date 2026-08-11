# Form, modal, async-state, and touch foundation batch v1

Verdict: `complete_softie_form_modal_async_state_touch_foundation_batch_v1_uncommitted`

Baseline: `59bcc1eee06147b3b486d7c3a1599c66fce42c59` on local `main`, observed equal to `origin/main` before work. The pre-existing untracked `-.jpg` remains outside this work order. No staging, commit, push, deployment, dependency change, remote database change, or business-data mutation is part of this batch.

## Outcome

The bounded active-route foundation is implemented:

- Home Memo, Band, Rehearsal, Spotify, Softie Fortune, and Scheduler work-log mutations now use immediate synchronous locks where rapid activation could duplicate or race an operation. Related controls expose disabled/busy feedback.
- Active Band, Rehearsal, Spotify, Fortune, and Scheduler surfaces distinguish loading, empty success, filter no-result, and error instead of presenting a failed or pending request as an empty success.
- Active forms gained programmatic names. Scheduler reservation validation preserves the previous rule order and messages while returning the invalid field identity, connecting the error with `aria-invalid`/`aria-describedby`, and focusing the first invalid control.
- Active Rehearsal, Spotify, Fortune, and Scheduler overlays that lacked semantics gained a truthful `role="dialog"` and accessible name. This batch does not claim that these overlays are fully modal.
- Audited Home, Band, Spotify, and Fortune action targets use the Softie `44px` house minimum. WCAG 2.2 Target Size Minimum remains a standards floor; `44px` is not attributed to WCAG.
- `DESIGN.md` 2.10.0 records the reusable form, validation, dialog, status, busy, and touch contracts.
- A historical design-audit checker now accepts its declared generation-base source snapshot after descendant source edits. Frozen artifact bytes were not rewritten.

## Provenance boundaries

Repository authority and current source bytes decide implementation scope. W3C/WAI sources support label, validation, status-message, target-size, and modal-dialog semantics. Apple official accessibility guidance supports operable controls and the product target-size direction. Installed Emil-related skills are one sibling lineage with independent authority count `1`; repetition across those skills is not corroboration and installation is not adoption.

Softie values remain house rules:

- `44px` touch targets;
- the existing `180ms` route baseline;
- the existing Scheduler `200ms` opacity-only initial async-content enter;
- the existing `160ms` press pilot.

No new motion duration, easing, stagger, animated glass, layout animation, or transition role was introduced.

## Explicit holds and rejections

- `hold` — shared modal focus containment, background inertness, Escape behavior, and trigger restoration. Existing overlays do not share one proven lifecycle; adding `aria-modal="true"` without that behavior would overclaim.
- `hold` — Lead Sheet backup/restore concurrency. This is an overwrite-capable, recovery-sensitive flow and needs a separately authorized implementation plus authenticated runtime verification.
- `hold` — shared lazy-route error/retry boundary. This is an application-architecture change outside the focused active-surface batch.
- `not_applicable` — inactive `FortunePage.jsx` and the disabled `/fortune` entry.
- `reject` — new animation for loading, dialogs, errors, or busy states.

## Validation record

- Focused motion/regression tests: 23 passed, 0 failed.
- New foundation source/logic tests: 7 passed, 0 failed.
- Production build: passed (`158` modules transformed).
- `git diff --check`: passed.
- Final full default suite observation: 651 tests, 614 passed, 35 failed, 2 skipped. All 35 failures match the known missing-source environment boundary for `PDF_SOURCE_NANBEI_PATH` and `PDF_SOURCE_NANYANGTANG_PATH`; the final full run had zero non-PDF failures. No fixture or expectation was fabricated.
- Browser keyboard traversal, screen-reader announcement order, authenticated remote mutations, 390px layout, and physical iOS target geometry remain unverified runtime checks.

Machine-readable evidence is under `artifacts/design-reference-form-modal-async-state-touch-foundation-batch-v1/`. Its checker validates repository-byte references, frozen predecessor hashes, decision boundaries, validation blockers, companion equality, integrity hashes, and artifact identity.
