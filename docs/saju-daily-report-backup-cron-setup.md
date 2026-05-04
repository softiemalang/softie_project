# Saju Daily Report Backup Cron Setup

This function creates a clean daily archive of the latest Saju fortune report for the previous KST date.

## Schedule
- Time: 03:30 KST (Daily)
- UTC Cron: `30 18 * * *`

## Manual Test Query
You can run this SQL in the Supabase SQL Editor to test the function manually:

```sql
select net.http_post(
  url := 'https://txkqkvkwasfzapvcbezv.supabase.co/functions/v1/google-drive-saju-daily-report-backup',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer <BACKUP_CRON_SECRET>'
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 30000
);
```

## Production Cron Setup
Run this SQL to schedule the daily backup:

```sql
select cron.schedule(
  'saju-daily-report-archive',
  '30 18 * * *',
  $$
  select net.http_post(
    url := 'https://txkqkvkwasfzapvcbezv.supabase.co/functions/v1/google-drive-saju-daily-report-backup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <BACKUP_CRON_SECRET>'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
```

## Behavior
- Computes target date as `current_kst_date - 1 day`.
- Queries `saju_fortune_reports` for the latest report for `target_date` and `SOFTIE_SAJU_PROFILE_ID`.
- Uploads/Updates JSON to Google Drive: `softie_project/saju/daily-reports/YYYY/YYYY-MM-DD.json`.
- Overwrites the file if it already exists for the same date.
