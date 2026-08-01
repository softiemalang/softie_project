# DE405 Type-2 readiness gap closure

Date: 2026-08-02

Candidate: `D405-CAND-TYPE2-OFFICIAL-ORDER`

## Decision

The candidate does **not** qualify for `ready_for_separate_production_change_proposal`.

The blocking evidence is production-flag sensitivity. The accepted shadow result uses the candidate object compiled with `-O0 -ffp-contract=off`. A full-range replay with the candidate compiled using the actual production optimization flags (`cc`, C11, `-O2`, `-Wall`, `-Wextra`, `-Werror`) produced:

- 150,671 rows evaluated
- 8,245 candidate-changed rows
- 5,168 candidate-resolved rows
- 66,222 candidate mismatches
- 539 candidate regressions

The 539 regressions fail the required zero-regression gate. This is sufficient to stop proposal generation. No production-change proposal, rollback implementation, feature flag, evaluator dispatch change, contract change, tolerance change, deployment, or remote-state change was made.

This does not establish that the official-order calculation direction is invalid overall. It establishes only that a safe production replacement has not been demonstrated under the actual production `-O2` build. The 539 regressions are previously-exact cases, so the readiness gate correctly blocks the proposal. The regression cause remains unresolved; the next investigation is production `-O2` instruction/intermediate-bit divergence analysis, not a tolerance change or global compiler-policy change.

## What was closed

The local repository baseline matched the required `main` commit `188c1d2a5b40ec37610e753140c62fcb6cfde3ab`, matched `origin/main`, had ahead/behind `0 0`, no staged files, and no tracked-file diff. Existing untracked DE405 artifacts and build outputs were preserved.

The actual production runner was rebuilt and linked against CSPICE N0067. Its full 150,671-row output was byte-identical to `artifacts/de405-jpl-cspice-residual-sweep.cspice.jsonl`, with 148,970 evaluated rows and 1,701 `selection_ambiguous` rows. This validates the unchanged production build/link and corpus boundary.

The shadow baseline compiled with `-O2` retained the previously recorded full-range shadow counts. The candidate compiled with the special `-O0 -ffp-contract=off` flags also retained the accepted 0-regression result. That special-flag result is not sufficient for production readiness because it is not the actual production candidate compilation mode.

## Requirements and remaining gaps

The machine-readable matrix is [de405-type2-readiness-gap-matrix.json](/Users/softie/Documents/softie_project/artifacts/de405-type2-readiness-gap-matrix.json). It records each requirement, authoritative artifact, status, local/external validation boundary, and whether it blocks proposal eligibility.

The remaining blocking gap is R04: release-equivalent candidate compilation. R05 remains incomplete because deterministic rebuild evidence for an accepted release-equivalent candidate cannot be established after R04 fails. Cross-platform or deployment validation remains unavailable locally, but it is not the immediate blocker.

## Protected boundary

The production evaluator, dispatch, canonical selection, route behavior, contracts, tolerances, default commands, deployment configuration, external CSPICE sources, and remote state were left unchanged.
