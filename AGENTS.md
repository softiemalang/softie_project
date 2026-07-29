# softie_project Codex Working Rules

## Scope and source of truth
- These rules apply to this repository and its local checkout.
- For local execution, the current local working tree is the source of truth.
- For GitHub-only inspection, use the exact repository ref being inspected as the source of truth.
- Do not assume that the local working tree and `origin/main` are synchronized without verification; if synchronization was not checked, do not describe them as equal.
- The only supported working references are the existing local `main` branch and remote `origin/main`. Do not create, rename, switch, or propose feature branches or temporary PR branches for this repository.
- If the checkout is not on `main`, stop and report instead of switching branches.
- If its relationship to `origin/main` has not been verified, report that limitation and do not claim synchronization. Stop only when the task depends on confirmed remote parity.
- Prefer local CLI inspection and file reads before making assumptions. Live repository, service, and deployment state takes precedence over historical notes.
- Use `git status --short --branch` before and after any work. Inspect the relevant existing files and current diff before editing.

## Work-order boundaries
- Keep one user work order to one coherent task scope. Do not combine unrelated fixes, cleanup, refactors, or design changes in the same task.
- Before editing, identify the smallest relevant file set. Edit only requested files and files required to implement or verify the requested change.
- A work order may narrow the allowed scope but does not implicitly authorize adjacent changes. Record discovered adjacent issues in the final risks or follow-up items instead of fixing them.
- Within the authorized scope, follow the more specific instruction.
- When safety constraints differ, follow the stricter constraint.
- Repository guidance cannot override higher-level platform or tool safety requirements.
- Preserve pre-existing tracked and untracked changes.
- Do not overwrite, discard, or misattribute pre-existing changes.
- If an in-scope file already contains changes, modify only the requested portion and preserve unrelated edits.
- Do not delete, restore, reset, discard, overwrite, stash, stage, or format pre-existing changes unless the user explicitly authorizes the exact action. In particular, do not use `git restore`, `git checkout --`, `git reset`, `git clean`, or `git stash` without explicit approval for that exact action.
- Do not automatically format files outside the requested scope, report pre-existing changes as this task's results, or guess when current changes cannot be separated from the task; report the ambiguity instead.
- Do not infer approval for adjacent improvements. Record unresolved choices as `open_decision` or `needs_verification` rather than guessing.

## Project overview
- This is a React 18 + Vite app with shared global styling in `src/styles.css`.
- Supabase is used directly from the frontend via `@supabase/supabase-js` and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env.local`.
- The product is a lightweight, mobile-friendly set of internal tools for band scheduling and performance workflows.
- Deployment assumptions should stay compatible with GitHub-driven Vercel deploys.

## Default safety rules
- Do not create a branch or switch away from `main`.
- Do not run `git add`, `git commit`, or `git push` without explicit user approval for that exact step. Treat staging, committing, pushing, deploying, and remote database changes as separate approval steps: approval for one does not imply approval for any later step.
- Stage and commit only the explicitly approved files and changes. Never include unrelated or pre-existing worktree changes.
- Do not interpret ambiguous requests such as “반영해줘” (“apply it”) as approval for the entire commit-and-push sequence.
- Do not run `vercel`, `vercel deploy`, or production deployment commands unless the user explicitly asks.
- Do not run `supabase db push`, `supabase functions deploy`, or any remote database-changing command unless the user explicitly asks.
- Do not edit `.env`, `.env.local`, secrets, tokens, credentials, or production configuration unless the user explicitly asks.
- Do not run `npm install` or add new dependencies unless the user explicitly asks.
- Do not delete user data, database data, migrations, or localStorage migration logic unless the user explicitly asks.
- Do not make broad refactors when the user asks for a small targeted fix.

## Preferred workflow
1. Read the request, applicable instructions, relevant files, and current Git state.
2. State the single task scope and planned file allowlist before editing.
3. Keep changes focused and minimal; preserve existing behavior outside the requested scope.
4. Re-check the diff and changed-file list before validation. Confirm unrelated changes remain untouched.
5. Run only checks appropriate to the change. For application changes, normally use `npm test`, `npm run build`, and `git diff --check`; for documentation-only changes, code tests and build may be skipped when their contracts are unaffected.
6. Report each validation command and its actual result. Distinguish code failures, environment/tool failures, skipped checks, and unverified claims.
7. Stop before staging, commit, push, deploy, or DB changes unless that exact action is explicitly approved.

## Model selection
- When recommending or assigning an execution model, use the lowest-capability model sufficient for the task's complexity and risk.
- Do not recommend a higher model tier without a concrete need for additional reasoning, context handling, or risk control.
- The execution agent must not imply that it can change its own model when the runtime does not support model switching.
- Model selection must not broaden the task scope or weaken verification requirements.

## Code organization expectations
- Reuse existing patterns before introducing new abstractions.
- Keep new internal tools isolated by route, folder structure, naming, and data flow.
- Prefer feature-scoped folders under `src/` with route/page components, feature logic, Supabase query helpers, and feature-specific types separated enough to stay maintainable.
- Do not let `src/App.jsx` become an unbounded dumping ground as new tools are added.
- Keep page/rendering concerns separate from data loading and transformation logic when adding non-trivial features.
- Keep imports tidy and local. Prefer small local helpers over broad shared abstractions too early.

## Supabase / Vercel expectations
- Reuse the existing Supabase environment variable names and client setup pattern unless there is a clear repo-wide reason to centralize it.
- If a shared Supabase client module is introduced, migrate toward it deliberately and avoid leaving duplicate initialization patterns behind.
- Keep schema changes minimal and easy to understand. Prefer small, targeted migrations with clear names over bundled structural rewrites.
- Keep Vercel-safe assumptions: frontend code should rely on `import.meta.env`, avoid server-only assumptions, and avoid adding infrastructure requirements casually.

## Product and data safety notes
- Prefer practical, mobile-friendly UI. This app is used in short sessions and should stay easy to use on a phone.
- Prioritize clarity, fast comprehension, and low-friction interaction over decorative complexity.
- Be especially careful with scheduler, auth, Supabase, Vercel, Google login-related features, and lead sheet data.
- `/lead-sheet` is a performance-use tool, so data loss prevention is more important than convenience.
- For `/lead-sheet`, preserve localStorage data and migration paths.
- Cloud backup/restore must never silently overwrite local data.
- Automatic sync should not be added unless the user explicitly asks.
- Manual backup/restore should always include confirmation and a recovery path.

## Supabase Edge Functions / Security
- Scheduler-related functions such as `update-push-preferences` and `dispatch-scheduler-reminders` may have `verify_jwt = false` in `supabase/config.toml`.
- This is intentional when the PWA flow does not use Supabase Auth, requiring unauthenticated access for client-side preference sync.
- `dispatch-scheduler-reminders` may also be triggered by an external scheduler/cron without a Supabase Auth JWT, so JWT verification can cause 401 errors.
- Client-facing functions should rely on `deviceId` and active subscription status validation.
- Internal dispatch logic may use the Service Role client for DB access.
- If stronger security is needed later, implement custom request validation such as custom headers within the function code.

## Commands / verification
- Useful local commands: `git status --short --branch`, `npm run build`, `rg "<query>"`, `fd <name>`, `tree -L 2 -I node_modules`.
- Install dependencies only when explicitly asked: `npm install`.
- Start local dev server when needed: `npm run dev`.
- Preview production build locally when needed: `npm run preview`.
- Deploy Supabase functions only when explicitly asked: `supabase functions deploy <name>`.
- Confirm available validation scripts from `package.json` before using or reporting them.
- Current primary validation commands include `npm test` (`node --test`) and `npm run build`; use the relevant scripts rather than inventing validation commands.
- Run `git diff --check` for text or code changes unless the command is unavailable; report any omission and its reason.
- Distinguish structure or command-existence checks from executed tests and their results. A passing test or build proves only that check's contract; it does not prove UI behavior, production deployment, external-source provenance, or data correctness unless those were independently checked.
- Report skipped checks with the reason, and never describe a failed, skipped, unavailable, partial, or merely structural check as successful.
- When a command fails, report its exit status and the core cause. If pre-existing working-tree changes may affect the result, report the validation as conditional or partial rather than guessing.
- Do not replace a missing fixture, oracle, raw evidence file, or toolchain with a nearby or synthetic substitute without explicit approval.

## Communication style
- Be concise.
- If a command is risky, explain why and ask for explicit approval.
- If unsure, inspect first rather than guessing.
- Never claim deployment is complete just because `git push` succeeded.

## Required final report
- Changed files: list the exact paths actually changed.
- Preserved scope: mention intentionally unchanged files or pre-existing changes when relevant.
- Summary: state what changed and what was deliberately preserved.
- Diff summary and notable hunks.
- Validation: list every command run with pass/fail/skipped status and concise evidence.
- Remaining checks or risks: identify unverified behavior, external dependencies, environment failures, and `open_decision` items.
- Git/deployment actions: state explicitly that staging, commit, push, deploy, and remote DB changes were not performed unless separately authorized and actually completed.
