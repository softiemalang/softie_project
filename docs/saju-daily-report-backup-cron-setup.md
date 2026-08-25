# Saju daily report backup — local contract and verification boundary

> Reference note: this document does not define a cron schedule, provide
> executable SQL, or assert the state of a deployed Supabase project. The
> exact local checkout, executable function code, and local configuration are
> authoritative for the contract below. Remote state requires separate,
> authorized verification.

## Local source of truth

- Handler: [`supabase/functions/google-drive-saju-daily-report-backup/index.ts`](../supabase/functions/google-drive-saju-daily-report-backup/index.ts)
- Owner binding: [`supabase/functions/_shared/sajuBackupOwnership.js`](../supabase/functions/_shared/sajuBackupOwnership.js)
- Token and Drive helpers: [`supabase/functions/_shared/googleToken.ts`](../supabase/functions/_shared/googleToken.ts), [`supabase/functions/_shared/googleBackup.ts`](../supabase/functions/_shared/googleBackup.ts)
- Function gateway setting: [`supabase/config.toml`](../supabase/config.toml), section `[functions.google-drive-saju-daily-report-backup]`
- Broader Google integration index: [`GOOGLE_INTEGRATION.md`](../GOOGLE_INTEGRATION.md)

## Observed local contract

- The gateway has `verify_jwt = false`; the handler requires `BACKUP_CRON_SECRET` and an exact `Authorization: Bearer <secret>` value. A missing secret fails closed before backup work.
- The handler requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SOFTIE_SAJU_PROFILE_ID`, and `GOOGLE_BACKUP_USER_ID`; values are not recorded in this repository.
- The profile’s `user_id` must exactly match `GOOGLE_BACKUP_USER_ID`; missing or mismatched identities fail closed before report export.
- The target date is the previous calendar date in `Asia/Seoul`. If no matching report exists for that date and profile, the handler returns a skipped result without a Drive write.
- The handler currently reads `saju_profiles` and `saju_fortune_reports` with `select('*')`. The generic Google backup field manifest does not automatically govern this dedicated handler, so this document does not claim a field-minimized Saju archive.
- When a report exists, the handler creates or updates `softie_project/saju/daily-reports/<year>/<target-date>.json` in Google Drive. The payload contains the selected profile and report rows plus archive metadata.
- Google access-token retrieval/refresh and service-role database access remain backend-only.

## Local schedule and external-state boundary

- No local migration in this checkout registers a Saju daily report schedule or invokes this Edge Function. The local database scheduling code found in migrations is for scheduler reminder dispatch, not this backup.
- The previously documented daily time, UTC expression, project URL, SQL Editor probe, and production cron setup are not established by local code/configuration and are intentionally not reproduced here.
- This repository does not prove remote cron registration, schedule time, last run, deployed Edge Function revision, Supabase secret values, Google token state, Drive folder state, or remote migration history.

Do not treat this document as a deployment or cron runbook. Any setup or verification is a separate operational action requiring the current deployment/configuration contract and explicit external-state authorization.
