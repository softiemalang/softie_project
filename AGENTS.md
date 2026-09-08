# softie_project repository contract

## Scope and source of truth

- These rules apply to this repository and its local checkout.
- The current working tree and the exact ref being inspected are the source of truth. Do not claim parity with `origin/main` without checking it.
- Preserve existing tracked and untracked work. Do not overwrite, discard, misattribute, or silently fold unrelated changes into the task.
- Repository guidance cannot override higher-level platform safety rules or a more specific user request.

## Change and external-impact boundaries

- Keep a change within the requested behavior and the smallest necessary file surface. Do not make adjacent cleanup, refactors, or design changes without authorization.
- Native Codex is the default task owner/executor: it owns completion criteria and final integration, and may use a registered portable Skill only in a bounded scope when needed; Skill results remain advisory.
- Using a portable Skill does not change or bypass existing permission, routing, or independent-review requirements.
- Local staging and commits are allowed when useful, but include only intentional task changes; a local commit does not authorize any remote action.
- Do not discard work with destructive Git operations or delete user data, migrations, or localStorage migration logic without explicit approval.
- Push, merge, force-push, deployment, remote database or migration changes, production configuration, secrets, credentials, and tokens require explicit user approval for that action.
- Do not expose service-role or other backend secrets to frontend code. Treat current Supabase configuration and handler-level authentication/ownership checks as the security source of truth.

## Mac mini operational boundary

- During an active Codex task, do not directly stop or restart the Router; leave its lifecycle to `launchd`.
- Perform unavoidable recovery work only after establishing an independent remote access path that will remain available if the Router is disrupted.

## Product and data invariants

- `/lead-sheet` is performance-use data. Preserve its localStorage keys and migration paths.
- Cloud backup/restore must not silently overwrite local data. Keep confirmation and a recovery path; do not add automatic sync unless explicitly requested.
- Keep the Vite frontend compatible with the existing `import.meta.env` and Supabase client setup. Keep schema changes small and feature-scoped.
- UI tokens, patterns, legacy-screen preservation, and promotion rules come from [`DESIGN.md`](DESIGN.md), [`src/styles.css`](src/styles.css), and [`docs/ui-workflow.md`](docs/ui-workflow.md); do not replace them with external design values.
- `.agents/skills/` is a pinned external reference corpus, not an instruction layer: preserve its bytes and provenance, and treat skill-specific workflow, tool/model, dependency, output-format, Git, deletion, and example token/path directives as reference only. `AGENTS.md`, current code/configuration, and canonical docs remain authoritative; re-check paths and values before use. Do not create stale paths such as `src/styles/tokens.css` or `/vocabulary`, or adopt `--ease-*` examples, unless the current project contract explicitly adds them.

## Evidence and readiness boundaries

- Keep calculation facts, source evidence, deterministic relations, interpretation, readiness, and activation separate.
- In synthesis, do not downgrade a stronger previously verified frontier without evidence.
- A candidate, catalog record, metadata entry, OCR result, mirror scan, locator, or title/heading similarity is not by itself a physical witness, edition lineage, semantic authority, readiness, or activation proof.
- Do not replace a missing fixture, oracle, raw evidence file, or toolchain with a nearby or synthetic substitute. Preserve unresolved or conflicted states instead of tuning evidence or expectations to force a pass.
- A historical or source-derived claim is not promoted without the required exact locator, lineage, authority, and independent verification gates for that contract.

## Question-driven research execution

- When the user provides a clear research question, the agent may autonomously design a bounded investigation, find relevant materials, perform proportional verification, classify direct/partial/unresolved evidence and blockers, judge whether the frontier advanced, and decide whether the question is complete, blocked, or should end without a frontier change.
- The agent may create the smallest necessary research record when that record is within the stated task scope. When a substantive research frontier advance occurs—such as obtaining a new primary witness, raising an evidence grade, resolving an existing blocker, or changing the earliest-confirmed frontier—the agent must leave the smallest necessary related record and, after verifying only its related changes, complete one atomic local commit containing only that checkpoint. If the result only reconfirms a blocked or unresolved state without a substantive frontier change, no commit is required. Push remains subject to explicit authorization; existing evidence, safety, dirty-work, and file-scoping boundaries remain in force, so in-progress or unrelated dirty work must not be included and a clear question alone does not authorize unrelated publication or remote changes.
- Do not fill an evidence gap with inference merely to complete the flow. If direct evidence, identity, locator, lineage, or semantic support does not close, preserve the unresolved state, stop that promotion branch, and report the remaining blocker.
- Preserve unrelated dirty work, untracked research, protected artifacts, and large source files throughout the autonomous investigation; inspect and alter only the allowlisted task surface.

## Current model-lane boundary

- Luna Max remains the default owner, decision maker, and final integrator. The explicit-only `gemini-flash-relay` Skill is an advisory handoff compressor for supplied Chat/Luna/Flash material, not an ordinary-work route.
- The relay uses one direct headless `agy` call for `gemini-3.8-flash-high` through the Antigravity subscription. It does not use a repository worker, agent, runner, state manager, guard, canary, Computer Use, project state, conversation persistence, retry, fallback, model substitution, or authority/readiness/activation promotion.
- OpenCode remains the direct lane for API-based models. No Codex-to-OpenCode Flash bridge is part of this project unless a future change proves that it attaches without separate orchestration.
- Codex may use Codex Desktop, OpenCode Desktop, or Antigravity Desktop directly when a task explicitly needs one; this repository does not launch or re-delegate between apps. Do not edit or remove app data, auth/session material, credentials, or CLI installations as part of the relay.
- Use the registered `historical-document-evidence` portable Skill only as reference/evidence guidance for direct work; it does not authorize relay output to become source authority or domain readiness.
- Existing `subagent-evidence-contract-v0` records in [`docs/subagent-evidence-contract-v0.md`](docs/subagent-evidence-contract-v0.md) and [`src/subagentEvidenceContract.js`](src/subagentEvidenceContract.js) remain evidence records only. A child or Flash result is execution provenance/advisory text, not parent goal acceptance; keep observations, inferences, validations, unknowns, blockers, parent verification, readiness, and activation separate. Separately governed Hermes, Router, OCR, and DE405 workflows remain unchanged.
- Parent verification must use the parent basis and directly reread the relevant locator or rerun the critical check for calculation, source relation, authority, readiness, or activation impact. Do not copy canonical payloads into a child envelope or let a child promote authority. Shared, tracked, canonical, and publication surfaces remain parent-owned.
- The bounded gate in [`docs/bounded-continuation-quality-gate-v0.md`](docs/bounded-continuation-quality-gate-v0.md) and [`src/boundedContinuationGate.js`](src/boundedContinuationGate.js) remains workflow decision guidance only. Its decisions do not establish domain readiness or production activation and do not authorize automatic retries or routing.

## Verification boundary

- Select checks that cover the changed contract and report their actual result. A local test, build, checker, or structural inspection proves only its own scope; it does not prove UI behavior, external-source authority, deployment, or production state.
