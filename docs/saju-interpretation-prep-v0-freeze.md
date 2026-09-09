# Saju interpretation-prep v0 closure and freeze

Status: **FROZEN (scoped Saju interpretation-prep v0)**

Audit basis: `3bf1cdfa07c6cea9cb9295736e9ccf140c47f0cc`.

This record freezes the existing Saju interpretation-prep contract surface. It
does not add a semantic rule, change a calculation FACT, alter provenance or
activation, or attach a model, response store, or personalization engine.

## Canonical handoff chain

The intended downstream chain is:

`FACT-only Deterministic Base`
→ `saju-lineage-handoff-evidence-v0`
→ `saju-evidence-consumption-v0` (embedded in the conversational package)
→ `saju-conversational-handoff-package-v0`
→ external `saju-hypothesis-submission-v0`
→ per-hypothesis `saju-hypothesis-discussion-authorization-v0`

The evidence envelope and package carry precomputed results only. They retain
source and locator identity, lineage boundaries, provenance, unresolved states,
and conflicts. Validators reject missing, stale, tampered, malformed, or
scope-expanded inputs. No stage recalculates a result, repairs a conflict,
creates a cross-lineage winner, or turns an evidence item into a definitive
personal conclusion.

Hypothesis validation and discussion authorization are external-input gates.
They validate or authorize one submitted hypothesis at a time; they do not
generate hypotheses, store user responses, classify users, personalize, or
promote global interpretation activation. Declined or blocked hypotheses are
rejected, uncertain or boundary-bearing hypotheses remain explore-only, and
only a confirmed hypothesis without a preserved blocking boundary can receive
bounded discussion permission.

## Closure findings

- The active `/interpretation-prep` path is the input form →
  `prepareThreeSystemInterpretationData` → `ChatHandoffCard` →
  `buildDeterministicBase` → public Base projection. Its user-facing outputs
  are canonical Base copy and Markdown download; the public JSON projection
  strips internal metadata and Markdown copies.
- `chatHandoffPackage.js`, the session/prototype views and adapters are not
  imported or rendered by the active page. They remain compatibility or lab
  surfaces covered by their own tests.
- The preparation pipeline still materializes an internal legacy
  `interpretationContext`/`interpretationPrompt`. The audit found no active
  export, model call, or public handoff consuming it. Any future connection of
  that value to a conversational consumer is a reopen event.
- Calculation/context availability is distinct from evidence or
  interpretation authorization. `conversationalInterpretationActivationReady`
  remains `false`; personal application and global activation are not promoted.

## Verification record

- Closure E2E: **31/31 passed**. This includes fresh-file consumption,
  tamper, missing, unresolved/conflict preservation, stale validation,
  cross-lineage, scope expansion, personal/global activation, and active UI
  legacy-isolation cases.
- Default release regression (`npm test`): **635 passed, 0 failed, 1
  skipped** out of 636 tests.
- Production build (`npm run build`): **passed**.
- Changed-document diff check: **passed**.
- The full repository profile (`npm run test:all`) was attempted and reported
  **1129 passed, 34 failed, 2 skipped**. The observed failures are outside
  this closure path and require unavailable external historical/source or
  artifact fixtures (including the external 子平真詮 PDF root, candidate
  packets/matrices, a TOYO image, and a source-byte/path mismatch). No such
  fixture, environment, or unrelated file was changed. This freeze therefore
  makes a scoped Saju closure decision and does not claim that the unrelated
  all-profile environment is green.

## Freeze meaning

v0 is frozen at the above boundary: no new lineage rule, composition, public
Base field, provenance policy, evidence permission, hypothesis behavior,
readiness value, activation path, model integration, response persistence, or
personalization behavior may be added under this version.

The freeze is not source authority, semantic truth, personal validity, or
conversational activation. Source-bounded evidence remains source-bounded, and
unresolved/conflict states remain unresolved/conflicted.

## Reopen conditions

Reopen the closure audit before accepting any of the following:

- a Base schema, producer, public projection, Markdown serializer, or input
  normalization change;
- an evidence envelope, consumption contract, Constitution, hypothesis
  validator, authorization matrix, provenance, unresolved/conflict, or
  fail-closed policy change;
- a new lineage rule, lexicon entry, composition, common candidate, or
  cross-lineage relation;
- consuming the internal legacy prompt/package/session surfaces from a
  production or conversational path;
- adding model invocation, response storage/classification, user-context
  persistence, personalization, or automatic hypothesis generation;
- changing any readiness or activation value, route, or promotion behavior; or
- a failure of fresh-file parity, tamper/missing/conflict checks, targeted or
  default regression, build, or diff validation.

If the currently unavailable external historical/source/artifact fixtures are
made part of this release gate, rerun the full profile and record that as a
separate environment-readiness decision rather than weakening this v0
boundary.
