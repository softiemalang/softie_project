# Rehearsal scheduled backup — local contract and verification boundary

> Historical/reference note: this document does not define a cron schedule,
> provide executable SQL, or assert the state of a deployed Supabase project.
> The exact local checkout, executable function code, and local configuration
> are authoritative for the contract below. Remote state requires a separate,
> authorized verification.

## Local source of truth

- Handler: [`supabase/functions/google-drive-rehearsal-scheduled-backup/index.ts`](../supabase/functions/google-drive-rehearsal-scheduled-backup/index.ts)
- Backup materializer: [`supabase/functions/_shared/rehearsalBackup.ts`](../supabase/functions/_shared/rehearsalBackup.ts)
- Function gateway setting: [`supabase/config.toml`](../supabase/config.toml), section `[functions.google-drive-rehearsal-scheduled-backup]`
- Broader Google integration index: [`GOOGLE_INTEGRATION.md`](../GOOGLE_INTEGRATION.md)

## Observed local contract

- The gateway has `verify_jwt = false`; the handler requires `BACKUP_CRON_SECRET` and an exact `Authorization: Bearer <secret>` value.
- The handler also requires `REHEARSAL_BACKUP_OWNER_KEY`; configuration values are not recorded in this repository.
- The handler computes the current `Asia/Seoul` month and passes it with the owner key to `backupUserRehearsalEvents`.
- The materializer reads the owner’s `rehearsal_events` for that month, creates or updates `Softie Backups/rehearsals/rehearsal-events-YYYY-MM.json` in Google Drive, and attempts to write the observed backup metadata back to the selected rows. The current helper logs a row-update error without converting the upload result into a failed response.
- The exported JSON is built from an explicit event-field mapping in `rehearsalBackup.ts`; Google tokens and service-role credentials remain backend-only.

## What this checkout does not establish

- No local migration in this checkout registers a rehearsal backup schedule or invokes this Edge Function. The local database scheduling code found in migrations is for scheduler reminder dispatch, not rehearsal backup.
- Therefore this repository does not prove a cron registration, schedule time, last run, deployed function revision, Supabase secret value, Google token state, or Drive folder state.

Do not execute a setup SQL copied from this document or treat a prior “active” status as current evidence. Any cron setup or verification is a separate operational action that must use the current deployment/configuration contract and explicit external-state authorization.
