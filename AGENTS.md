# softie_project repository contract

## Scope and source of truth

- These rules apply to this repository and its local checkout.
- The current working tree and the exact ref being inspected are the source of truth. Do not claim parity with `origin/main` without checking it.
- Preserve existing tracked and untracked work. Do not overwrite, discard, misattribute, or silently fold unrelated changes into the task.
- Repository guidance cannot override higher-level platform safety rules or a more specific user request.

## Codex Remote workflow boundary

- The Mac checkout is the source of truth and the only coordinator. The public interface is limited to `npm run remote:metadata`, `npm run remote:refresh`, `npm run remote:setup`, `npm run remote:status`, `npm run remote:verify`, and `npm run remote:apply` (with `-- --dry-run` only for apply).
- The normal order is `metadata -> refresh -> setup/status -> work -> verify -> apply`. `metadata` produces only a repository-relative sanitized manifest; it does not transfer file contents or credentials.
- `remote:refresh` requires a matching private metadata admission for the same source fingerprint; if the Mac tree changes after metadata, metadata must be regenerated before refresh.
- Galaxy Tab Codex is a local project worker, not a Mac shell. It must not use Mac-wide `ssh`, `scp`, `sftp`, arbitrary remote shell, Mac absolute paths, credential material, or tab-worker operating state. Remote coordination happens only through the named interfaces from the Mac coordinator; path, host, state, boundary-module, and metadata-output overrides are forbidden.
- `refresh` and `verify` reuse the active snapshot exclusion boundary. Credentials, operating state, generated/native evidence, symlinks, and excluded paths remain isolated; the exact reviewed portable allowlist is the only explicit exception and is still subject to size, path, and content checks.
- `apply` is attestation- and source-guarded. It writes only verified target changes, never stages or commits Mac Git, preserves unrelated dirty/untracked work, and aborts closed on source drift, dirty overlap, target drift, base mismatch, protected paths, or conflict.
- The Tab checkout is an independent local Git baseline with no remote. A target change must be committed and pass the recorded verification before it can be applied to Mac.

## Autonomous execution and communication

- Infer the user's intent and desired outcome from context, and carry authorized work through to completion without intermediate approval pauses. Treat conversational requests such as “can you?”, “help me”, or “shall we try this?” as instructions to act when context indicates a task request.
- Default to proceeding with read-only and easily reversible work within scope. Ask for user judgment only when unresolved uncertainty could materially change the outcome or an action requires approval under the boundaries below, including hard-to-reverse external actions. Existing authorization for the same action remains valid.
- Before requesting required approval, complete the authorized preparatory work so the user can assess a concrete result; pause only the dependent action and continue independent work where possible.
- If an instruction conflict blocks progress, identify the specific instruction and its source, explain what it prevents, and state what user decision is needed. Do not add warnings, checklists, options, or confirmation questions solely for hypothetical risks.
- Default to natural sentences and paragraphs; use tables, lists, and Markdown when they improve communication.

## Change and external-impact boundaries

- Keep a change within the requested behavior and the smallest necessary file surface. Do not make adjacent cleanup, refactors, or design changes without authorization.
- The parent agent owns completion criteria, acceptance, and final integration. Workers and available Skills may perform bounded execution, but their output is not final until the required review or verification is complete.
- Delegation does not transfer authority or bypass permission, review, verification, or external-impact boundaries.
- Local staging and commits are allowed when useful, but include only intentional task changes; a local commit does not authorize any remote action.
- Do not discard work with destructive Git operations or delete user data, migrations, or localStorage migration logic without explicit approval.
- Push, merge, force-push, deployment, remote database or migration changes, production configuration, secrets, credentials, and tokens require explicit user approval for that action.
- Do not expose service-role or other backend secrets to frontend code. Treat current Supabase configuration and handler-level authentication/ownership checks as the security source of truth.

## Product and data invariants

- `/lead-sheet` is performance-use data. Preserve its localStorage keys and migration paths.
- Cloud backup/restore must not silently overwrite local data. Keep confirmation and a recovery path; do not add automatic sync unless explicitly requested.
- Keep the Vite frontend compatible with the existing `import.meta.env` and Supabase client setup. Keep schema changes small and feature-scoped.
- UI tokens, patterns, legacy-screen preservation, and promotion rules come from [`DESIGN.md`](DESIGN.md), [`src/styles.css`](src/styles.css), and [`docs/ui-workflow.md`](docs/ui-workflow.md); do not replace them with external design values.
- Repository-local materials under `.agents/skills/` are reference resources; corresponding Skills may be used when available in the current execution environment.

## Evidence and readiness boundaries

- Keep calculation facts, source evidence, deterministic relations, interpretation, readiness, and activation separate.
- In synthesis, do not downgrade a stronger previously verified frontier without evidence.
- A candidate, catalog record, metadata entry, OCR result, mirror scan, locator, or title/heading similarity is not by itself a physical witness, edition lineage, semantic authority, readiness, or activation proof.
- Do not replace a missing fixture, oracle, raw evidence file, or toolchain with a nearby or synthetic substitute. Preserve unresolved or conflicted states instead of tuning evidence or expectations to force a pass.
- A historical or source-derived claim is not promoted without the required exact locator, lineage, authority, and independent verification gates for that contract.

## Question-driven research execution

- Available Skills provide bounded procedures and execution support; repository contracts and canonical project rules remain authoritative.
- For finite, question-driven evidence investigations, use the `bounded-evidence-frontier` Skill when available.
- For materialized artifact and consumer-parity verification, use the `artifact-provenance-consumer-parity` Skill when available; domain canonical materializers, schemas, and checkers remain authoritative.
- Apply applicable canonical contracts to required records, statuses, and promotion decisions during bounded investigations.

## Worker and evidence boundaries

- Worker and Skill output remains advisory and does not establish parent approval, source authority, readiness, or activation.
- Do not modify external application data, authentication/session state, credentials, or tool installations unless the task explicitly includes that change and the user has authorized it.
- Use the `historical-document-evidence` Skill when available for bounded historical-source/OCR work; its output remains caller-reviewed evidence and cannot promote authority, readiness, or activation.
- For child execution evidence, use the [`subagent-evidence-contract-v0`](docs/subagent-evidence-contract-v0.md) contract and [`src/subagentEvidenceContract.js`](src/subagentEvidenceContract.js) checker. Shared, tracked, canonical, and publication surfaces remain parent-owned.
- Parent verification must use the parent basis and directly reread the relevant locator or rerun the critical check for calculation, source relation, authority, readiness, or activation impact.
- Separately governed Hermes, OCR, and DE405 workflows remain under their own contracts.
- Use the bounded gate in [`docs/bounded-continuation-quality-gate-v0.md`](docs/bounded-continuation-quality-gate-v0.md) and [`src/boundedContinuationGate.js`](src/boundedContinuationGate.js) for workflow decisions only; it does not establish domain readiness or production activation or authorize automatic retries.

## Verification boundary

- Select checks that cover the changed contract and report their actual result. A local test, build, checker, or structural inspection proves only its own scope; it does not prove UI behavior, external-source authority, deployment, or production state.
- Scale verification to the scope and risk of the change. Reuse relevant checks already completed unless new changes, failures, or unresolved concerns justify repeating them; retain required checks and independent parent verification.
