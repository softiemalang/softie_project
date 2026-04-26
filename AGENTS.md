# AGENTS.md

## Project overview
- This repo is currently a small React 18 + Vite app with a single entry flow in `src/App.jsx` and shared global styling in `src/styles.css`.
- Supabase is used directly from the frontend via `@supabase/supabase-js` and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env.local`.
- The current product is a lightweight room-based scheduling tool for band practice. The UI is already optimized for simple, mobile-friendly use rather than complex app chrome.
- Deployment assumptions should stay compatible with GitHub-driven Vercel deploys.

## How Codex should work in this repo
- Inspect the existing structure before coding. This repo is small, so read the relevant files first instead of assuming framework conventions that are not present.
- Prefer minimal, production-safe changes. Avoid broad refactors unless they clearly reduce risk or unblock a real feature.
- Reuse existing patterns before introducing new abstractions. If the current feature is already handled inline in `src/App.jsx`, only extract code when the new change materially improves clarity or isolation.
- Keep new features isolated when appropriate. For internal mini-app features such as `/scheduler`, do not mix unrelated state and Supabase queries into the current scheduling flow.
- Avoid changing unrelated files unless the task requires it.

## Code organization expectations
- Follow the current lightweight style, but do not let `src/App.jsx` become an unbounded dumping ground as new tools are added.
- For new internal tools, prefer feature-scoped folders under `src/` with route/page components, feature logic, Supabase query helpers, and feature-specific types separated enough to stay maintainable.
- Keep page/rendering concerns separate from data loading and transformation logic when adding non-trivial features.
- Keep imports tidy and local. Prefer small local helpers over creating broad shared abstractions too early.
- Reuse shared UI patterns and styling primitives carefully, but do not tightly couple unrelated business logic just to share components.
- If routing is introduced later, keep each internal tool clearly separated by route, folder structure, naming, and data flow.

## Supabase / Vercel expectations
- Reuse the existing Supabase environment variable names and client setup pattern unless there is a clear repo-wide reason to centralize it.
- If a shared Supabase client module is introduced, migrate toward it deliberately and avoid leaving duplicate initialization patterns behind.
- Keep schema changes minimal and easy to understand. Prefer small, targeted migrations over bundled structural rewrites.
- Use clear migration names that describe the actual change.
- Keep Vercel-safe assumptions: frontend code should rely on `import.meta.env`, avoid server-only assumptions, and avoid adding infrastructure requirements casually.

## UX / product expectations
- Prefer practical, mobile-friendly UI. This app is used in short sessions and should stay easy to use on a phone.
- Prioritize clarity, fast comprehension, and low-friction interaction over decorative complexity.
- Do not overbuild internal tools. Start with the smallest workflow that solves the actual task.
- Match the existing product tone: straightforward, compact, and usable.

## Change management expectations
- Make a short plan before larger implementations or any work that touches structure beyond a small local edit.
- Keep diffs focused. Do not mix cleanup, restyling, and feature work unless there is a direct reason.
- Reuse existing files and patterns where reasonable, but call out when a feature boundary justifies creating a new folder or module.
- At the end of each task, summarize:
- Files changed
- Any schema or env changes
- Assumptions made
- Anything intentionally left out

## Supabase Edge Functions / Security
- **JWT Verification**: All scheduler-related functions (e.g., `update-push-preferences`, `dispatch-scheduler-reminders`) have `verify_jwt = false` in `supabase/config.toml`.
- **Reasoning**: 
  - The PWA flow does not use Supabase Auth, requiring unauthenticated access for client-side preference sync.
  - The `dispatch-scheduler-reminders` function is triggered by an external scheduler/cron without a Supabase Auth JWT, so verification must be disabled to avoid 401 errors.
- **Security Strategy**: 
  - Client-facing functions rely on `deviceId` and `active` subscription status validation.
  - Internal dispatch logic uses Service Role client for DB access.
  - If stronger security is needed later, implement custom request validation (e.g., custom headers) within the function code.

## Commands / verification
- Install dependencies: `npm install`
- Start local dev server: `npm run dev`
- Production build: `npm run build`
- Preview production build locally: `npm run preview`
- Supabase function deploy: `supabase functions deploy <name>`
- There is currently no lint or test script in `package.json`. Do not claim lint/test coverage unless those scripts are added.
