# Codex Security scan 3f83118b audit

## Scope and verdict

- Scan: `3f83118b-a35c-414a-9d7e-08599ddb184d`
- Scan target revision: `c211e104c27f0a2bbc188c1a92264996d47af764`
- Local base: `main` at the same revision; `origin/main` parity was checked before this work.
- Scan coverage: source, linked Supabase database, deployed Edge Functions, and anonymous runtime probes.
- The two corrective migrations and the natal-snapshot follow-up migration were applied to the linked database; ten corrective Edge Functions were deployed. No secrets, auth configuration, user data, staging, commit, or push were changed.

Verdict for the work is `security_findings_db_functions_applied_frontend_deploy_blocked`.
All 17 scan findings were real attack surfaces in the scan target and are classified below. The linked database and Edge Functions were applied and re-verified. The Vercel frontend release remains blocked because the local Vercel token is invalid; the local frontend contains the remaining client-side remediation but is not yet production-active.

Classification is the finding's validity against the scan target. `current disposition` records the effective production boundary, with `intentional-public-but-bounded` reserved for deliberately public contracts and `blocked` reserved for work that could not be verified or released.

## Evidence model

Evidence was taken from the scan revision's source, later migrations, current callers, `supabase/config.toml`, the corrective migrations, focused source regression tests, linked SQL, deployed function inventory, and anonymous HTTP probes. Before application, linked policies and grants confirmed the permissive exposure. After application, migration history and dry-run parity were clean; RLS, grants, column privileges, SECURITY DEFINER/search-path settings, negative RLS simulation, REST boundaries, public RPC projections, and deployed function versions were re-checked. The local database was not running, so local SQL linting was unavailable.

The security boundary is now:

- authenticated user identity comes from a verified Supabase bearer token or `auth.uid()`, never from a caller-selected privileged identifier;
- RLS is the data boundary for direct table access, with a corrective migration dropping the permissive policy names observed in both historical and linked-database evidence;
- public Saju surfaces use a fixed configured profile, authoritative daily snapshots, bounded projections, and no debug/RAG chunks; direct profile, natal, daily, and report table reads are revoked for `anon`;
- the public page no longer creates authoritative snapshots from browser data and fails closed with a preparation message when today's snapshot is absent;
- paid public generation is cache-first and serialized by a durable profile/date/version lock; public regeneration is rejected;
- internal evaluator/RAG tests require `SAJU_INTERNAL_TEST_SECRET` and fail closed when it is absent;
- scheduled backup endpoints fail closed when their cron secret is absent;
- legacy browser data is left in its original browser instead of being silently assigned to a newly authenticated account.

## Finding disposition

| # | ID / severity | Finding | Classification | Evidence | Remediation | Current disposition / residual risk |
|---:|---|---|---|---|---|---|
| 1 | `csf_5cd8df7cf830e9b51da9eb42` / P1 | `rehearsal_events` SELECT used `or true` | `confirmed` | `20260430000000_create_rehearsal_events.sql` allowed every row; linked policy read also showed unconditional access. | `20260812090000_harden_security_scan_rls.sql` drops the old policy, grants table access only to `authenticated`, and binds SELECT to `auth.uid()::text = owner_key`. | `closed`. Remote RLS/grants are applied; anonymous REST SELECT returns 401 and a synthetic authenticated subject sees zero rows. |
| 2 | `csf_6d3b59863df4b7c28d8f810f` / P1 | `rehearsal_events` INSERT/UPDATE/DELETE were unconditional | `confirmed` | The same migration used `with check (true)` / `using (true)`; direct client mutations accepted caller data. | Corrective owner-bound INSERT/UPDATE/DELETE policies; anonymous work is local-only; the unused arbitrary claim helper was removed. | `closed`. Remote owner-bound policies are applied. A positive real-user write was not exercised to avoid creating or mutating user data. |
| 3 | `csf_9f97f8a5cecee0371d1d17fc` / P2 | Room metadata enumeration | `confirmed` | Linked `rooms` policies included public and authenticated unconditional read policies; the live band page queried room lists. | Rooms SELECT is limited to owner/member rooms; all known permissive policy names are dropped; joining uses a bounded exact-code RPC. | `closed`. Anonymous REST SELECT returns 401; a member can still read metadata of rooms they joined, which is intentional. |
| 4 | `csf_a890240822c37388331dd148` / P1 | Self-enrollment or arbitrary room move through `members` | `confirmed` | The historical member INSERT bound only `user_id`, not room ownership, and UPDATE allowed `room_id` changes; linked policies were also unconditional. | Direct INSERT is owner-only; UPDATE grants only `display_name`; non-owner joining is one authenticated `join_band_room_by_code` SECURITY DEFINER RPC that binds `auth.uid()` and returns bounded fields. Client SELECT is limited to non-credential columns, so `pin_hash` is not exposed to room participants. | `closed`. Remote column privileges confirm `pin_hash`, `room_id`, and `user_id` update/read boundaries; anonymous direct access is denied. |
| 5 | `csf_1d5f26fee5af58162bb960ab` / P2 | Kakao calendar caller-selected `ownerKey` | `confirmed` | Calendar functions used service-role reads and accepted `ownerKey` independently of the authenticated subject. | Create/update/delete reject a nonmatching owner key, require the rehearsal row owner to equal `user.id`, and add owner predicates to writes. | `closed in deployed function; positive cross-user bearer test unverified`. The three deployed functions retain `verify_jwt=true`; anonymous calls return 401. |
| 6 | `csf_c432b7517878c47bbab84f4e` / P1 | Spotify player control selected the target by body `userId` without effective auth | `confirmed` | The old control path could use the caller-supplied user ID to select service-role tokens; the old client also had a device fallback. | Control and OAuth start require a real bearer, verify it with Supabase Auth, require `authUser.id === body.userId`, and the client uses the signed-in account only. | `closed in deployed function; positive cross-user bearer test unverified`. Anonymous control/start calls reject before provider access. |
| 7 | `csf_f981c60beb33f045181b33ee` / P2 | Spotify OAuth start/state was not bound to the browser subject | `confirmed` | The old start endpoint accepted an unauthenticated target user ID; a one-use DB state alone did not prevent seeding a state for another user. | OAuth start now requires an authenticated subject matching the target; callback consumes the expiring one-use state and stores tokens under that state subject. | `closed in deployed function; provider redirect replay unverified`. Deployed function version is current; no provider account or callback replay was performed. |
| 8 | `csf_ec7610d04c8321519da245bd` / P2 | Kakao OAuth accepted missing/malformed state | `confirmed` | `decodeState` fell back to `{}` and nonce comparison was conditional, so missing or malformed state could proceed. | State parsing returns `null`; callback requires a nonempty session nonce, equality, and `reason === 'memo'`; failed validation stops before token exchange. | `blocked on frontend release; local source closed`. The Vercel frontend containing the parser fix is not production-active; real Kakao redirect replay also remains unverified. |
| 9 | `csf_7a275109334a3d1d15faeb1c` / P1 | Public Saju knowledge RAG test | `confirmed` | The function had no caller authentication, used service role, and returned retrieved chunks. No current client caller was found. | `SAJU_INTERNAL_TEST_SECRET` is required before body/provider work; missing configuration returns 503 and wrong/missing secret returns 401. | `closed in deployed function`. The secret is intentionally absent, so the remote endpoint returns 503 before provider work; it is internal, not a public API. |
| 10 | `csf_b72dffdaf48743fb42dcd890` / P1 | Public paid Saju evaluator test | `confirmed` | The function had no auth and called paid evaluator/RAG logic while returning retrieved chunks. | The same fail-closed internal secret gate protects the evaluator; no client caller is present in the current source. | `closed in deployed function`. The secret is intentionally absent, so the remote endpoint returns 503 before paid work. |
| 11 | `csf_a1457594abe92606b403592c` / P2 | Public `forceGenerate` could overwrite the shared report | `confirmed` | The public report path accepted `forceGenerate` and service-role upserted the shared profile/date row. | Public calls are today-only, snapshot-bound, cache-first, and reject `forceGenerate`; private generation requires bearer-authenticated profile ownership. Public writes strip debug and return only the safe response. | `closed in deployed function`. An anonymous force-generation probe returned 403 before snapshot/provider work; public callers can still obtain the intentionally public report but cannot regenerate or overwrite it. |
| 12 | `csf_670bbadd717c2709417efa88` / P1 | Public fortune generation had unbounded provider/RAG work | `confirmed` | The public path could fan out RAG/provider calls before a durable quota boundary. | A durable `(profile,date,version)` lock serializes public generation, existing reports are returned before provider work, request bodies are capped, snapshots are authoritative, and failed generations retain the lock until its short TTL expires. | `intentional-public-but-bounded` after remediation. The lock migration and function are deployed. Residual: no per-IP/global abuse quota; successful generation is one report per profile/date/version and failed attempts are backoff-bounded. The current date has no prepared public snapshot, so the page fails closed until an authorized producer materializes one. |
| 13 | `csf_db3f56035b6c76fa95ece770` / P2 | Public fortune response exposed RAG draft previews/debug | `confirmed` | Generation assembled `rag.draftPreviews` into debug and the public path returned the full result/report row. | Public response and public RPCs use bounded columns; report content removes `debug` at the database and function boundaries. Internal debug remains private. | `intentional-public-but-bounded` after remediation. Remote history RPC output has only `headline,id,profile_id,report_date,report_version,summary` and no debug key; any future public reader must preserve that boundary. |
| 14 | `csf_639b000fec9f1e4fdd6a80d0` / P2 | Authenticated users could globally read Saju evaluations | `confirmed` | The linked database exposed `saju_report_evaluations` with global authenticated SELECT; evaluator rows contain prompts/chunks. | Corrective migration drops the global policy, revokes client roles on evaluation tables, and leaves service-role access only. | `closed`. Remote client SELECT privilege is false and anonymous REST returns 401; there is no replacement end-user/admin read contract in this work order. |
| 15 | `csf_2b1f9c35738c30ec71f96076` / P2 | Public Softie profile endpoint over-fetched with `select('*')` | `confirmed` | `get-softie-saju-profile` selected every profile column through a public service-role function. | Explicit projection is limited to `id,name,birth_date,birth_time,gender`, and only the configured Softie profile is addressable; direct profile/natal/daily/report table reads are revoked for `anon`. | `intentional-public-but-bounded`. The deployed profile response has exactly five keys; bounded daily/history RPCs are the remaining public contracts. |
| 16 | `csf_18098192510aa26d55b31364` / P2 | Scheduler legacy localStorage migration had no owner binding | `confirmed` | The live Today page loaded global `scheduler:work-logs` and uploaded it under the newly signed-in owner. | Auto-migration was removed. Legacy localStorage is left untouched for recovery; no upload occurs without a separately designed ownership proof. | `blocked on frontend release; local source closed`. The corrected frontend is not production-active because Vercel authentication is invalid; the DB/function boundary does not cover this browser-only migration. |
| 17 | `csf_2ddf7de2a274da302f149523` / P2 | Google Drive scheduled backup failed open when cron secret was absent | `confirmed` | The endpoint checked `BACKUP_CRON_SECRET` only when present, so an absent secret did not block execution. | Missing secret returns 503; a present secret must exactly match `Authorization: Bearer ...`; related docs and generated README text now state the required setting. | `closed in deployed function`. The remote function rejects anonymous requests with 401; `BACKUP_CRON_SECRET` is configured, and no backup was invoked. |

## Deferred push-endpoint SSRF frontier

Classification: `blocked`, not one of the 17 scan findings.

The local checkout proves that authenticated push registration binds the row to the verified Supabase user, but `validatePushSubscriptionPayload` accepts any nonempty endpoint string. `_shared/push.ts` dynamically imports `npm:web-push@3.6.7` and passes the stored subscription to `sendNotification`. The third-party implementation, redirect behavior, DNS resolution, and network egress policy are not present in this checkout; Deno is not installed locally and no production/network oracle was used. Therefore SSRF cannot be confirmed or cleared from local evidence without either pinned package source/audit evidence and a controlled runtime test, or an authorized deployed-environment test.

No speculative endpoint allowlist was added because the supported Web Push provider set is a product/runtime contract and an incorrect allowlist could break legitimate push subscriptions. Required next evidence is the exact deployed `web-push` implementation/version plus an isolated egress test (including redirects, private/link-local destinations, and DNS rebinding behavior).

## Additional local frontier review

The remaining `verify_jwt = false` endpoints were checked for an independent newly visible privileged path: Google manual calendar/sheet/backup callers bind the body identifier to the verified bearer subject, Google OAuth state is one-use and subject-bound, Project Brain requires a verified bearer and binds threads to that subject, and the other scheduled/push handlers use explicit auth or cron-secret checks. No additional locally provable confirmed finding was found beyond the deferred Web Push transport boundary above.

## Validation

| Check | Result | Evidence / limitation |
|---|---|---|
| `node --test test/securityScan3f83118b.test.js` | PASS | 5 focused regression tests cover RLS policy shape, internal/public boundaries, subject binding, legacy migration, and cron fail-closed behavior. |
| `npm run build` | PASS | Vite production build completed successfully. |
| `git diff --check` | PASS | No whitespace errors in the local diff. |
| `npm test` | PARTIAL / FAIL BASELINE | 633 passed, 35 failed, 2 skipped out of 670 tests. Failures are the repository's missing Ziwei/Nanbei/Nanyangtang PDF source fixtures (`MISSING_SOURCE_FILE`), not the security regression tests. No fixture was fabricated or changed. |
| `supabase db lint --local` | BLOCKED | Local PostgreSQL was not running (`127.0.0.1:54322 connection refused`); no SQL parser/database was available for execution-level migration validation. |
| `supabase migration list --linked` | PASS | `20260812020105`, `20260812090000`, and `20260812091000` match local and remote. |
| `supabase db push --linked --dry-run` | PASS | Remote database is up to date. |
| Remote RLS/grant/column verification | PASS | Target tables have RLS; anonymous direct SELECT privileges are false; owner/member policies and member column restrictions are present; synthetic authenticated subject sees zero band rows. |
| `supabase db advisors --linked --type security --level warn --fail-on error` | PASS WITH WARNINGS | No advisor errors. Remaining warnings are two pre-existing mutable trigger search paths, `pg_net` in `public`, intentionally public bounded RPCs/helpers, and project Auth password/MFA posture. |
| Codex Security post-remediation standard re-audit | BLOCKED AT PREFLIGHT | A new workbench scan was created, but its required preflight helper cannot run on the available Python 3.9 runtime because neither `tomllib` nor `tomli` is installed. It is not treated as a completed re-audit. |
| Anonymous REST/RPC verification | PASS | All nine direct target table reads return 401; profile response has five keys; daily RPC is bounded; history RPC exposes six safe keys with no debug. |
| Deployed Edge Function verification | PASS / BOUNDED | Corrective functions are active at the deployed versions; anonymous identity/cron/internal probes fail closed and public force generation returns 403. Positive provider/account replay was not performed. |
| `supabase config push` | SKIPPED | Local Auth config contains localhost/MFA drift relative to production; pushing the full config would overwrite unrelated production Auth settings. Function runtime flags were applied through function deployment. |
| Vercel production deployment | BLOCKED | `vercel whoami` reports the local token is invalid; no frontend deployment was made. |

## Files and release boundary

The main corrective artifacts are:

- `supabase/migrations/20260812090000_harden_security_scan_rls.sql`
- `supabase/migrations/20260812091000_add_public_fortune_generation_lock.sql`
- `supabase/migrations/20260812020105_close_public_saju_natal_snapshot_read.sql`
- `supabase/functions/_shared/internalAuth.ts`
- `src/saju/SoftieFortunePage.jsx` and `src/saju/api.js`
- `test/securityScan3f83118b.test.js`

Additional client/function/config/docs changes are listed by `git status` and are limited to the finding surfaces. Historical migrations were not edited. The pre-existing untracked `-.jpg` was preserved. Supabase migrations and Edge Functions were applied without user-data writes; Vercel deployment, secret rotation, Auth config push, staging, commit, and push were not performed.

The repository also contains a legacy authenticated Saju helper (`src/saju/api.js`) that retains broad selects for private profile/report workflows and a legacy non-live `BandPage.jsx` PIN flow. Those are not public endpoints in the current router (`/band` resolves to the Google-auth compact page), and they were not widened or silently rewritten in this scan remediation. Their future removal or migration should be handled as a separate ownership/credential-model task.
