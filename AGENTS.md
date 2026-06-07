# softie_project Codex Working Rules

## Project source of truth
- The local folder `~/Documents/softie_project` is the source of truth.
- Prefer local CLI inspection and file reads before making assumptions.
- Use `git status --short --branch` before and after any work.

## Project overview
- This is a React 18 + Vite app with shared global styling in `src/styles.css`.
- Supabase is used directly from the frontend via `@supabase/supabase-js` and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env.local`.
- The product is a lightweight, mobile-friendly set of internal tools for band scheduling and performance workflows.
- Deployment assumptions should stay compatible with GitHub-driven Vercel deploys.

## Default safety rules
- Do not run `git add`, `git commit`, or `git push` unless the user explicitly asks.
- Do not run `vercel`, `vercel deploy`, or production deployment commands unless the user explicitly asks.
- Do not run `supabase db push`, `supabase functions deploy`, or any remote database-changing command unless the user explicitly asks.
- Do not edit `.env`, `.env.local`, secrets, tokens, credentials, or production configuration unless the user explicitly asks.
- Do not run `npm install` or add new dependencies unless the user explicitly asks.
- Do not delete user data, database data, migrations, or localStorage migration logic unless the user explicitly asks.
- Do not make broad refactors when the user asks for a small targeted fix.

## Preferred workflow
1. Understand the request and identify the smallest safe change.
2. Inspect the relevant files and state the planned files to edit before editing.
3. Keep changes focused and minimal.
4. Preserve existing behavior unless the user explicitly asks to change it.
5. Run `npm run build` after code changes when appropriate.
6. Summarize changed files, validation results, and remaining risks.
7. Stop before commit, push, deploy, or DB push unless explicitly approved.

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
- There is currently no lint or test script in `package.json`. Do not claim lint/test coverage unless those scripts are added.

## Communication style
- Be concise.
- If a command is risky, explain why and ask for explicit approval.
- If unsure, inspect first rather than guessing.
- Never claim deployment is complete just because `git push` succeeded.
