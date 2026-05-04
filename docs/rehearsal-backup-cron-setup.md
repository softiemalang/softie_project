# Rehearsal Backup Cron Setup

이 문서는 수동으로 등록된 리허설 백업 크론 작업에 대한 정보를 담고 있습니다. 
마이그레이션 파일(`20260504100000_add_rehearsal_backup_cron.sql`)에 포함되어 있던 내용을 백업 및 가이드 용도로 보관합니다.

## SQL reference (Manual Setup)

```sql
-- Enable pg_cron and pg_net if not already enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Create a helper function to invoke the backup via HTTP
-- This avoids hardcoding the URL in the cron schedule directly.
create or replace function public.invoke_rehearsal_scheduled_backup()
returns void
language plpgsql
security definer
as $$
declare
  project_url text;
  cron_secret text;
begin
  -- NOTE: You must set BACKUP_CRON_SECRET in Supabase Secrets.
  -- The function 'google-drive-rehearsal-scheduled-backup' validates this secret.
  
  -- Attempt to get project URL from settings (works in many Supabase environments)
  -- If this doesn't work, replace with your actual https://PROJECT_REF.supabase.co
  project_url := (select value from postgrest.settings where name = 'db-uri');
  
  -- Since we cannot easily access Edge Function secrets from SQL directly for security reasons,
  -- you should provide the secret here manually once or store it in a private vault.
  -- For this migration, we assume you will trigger it via a shell command or set it manually.
  
  -- Example: select net.http_post(url := '...', headers := '{"Authorization": "Bearer ..."}'::jsonb);
end;
$$;

-- Manual setup recommended for the Cron Job URL and Secret
-- to avoid committing sensitive info to the repository.

/*
-- To manually enable this, run the following in SQL Editor:

select cron.schedule(
  'rehearsal-daily-backup',
  '30 15 * * *', -- 00:30 Asia/Seoul
  $$
  select net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-drive-rehearsal-scheduled-backup',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_BACKUP_CRON_SECRET"}'::jsonb
  );
  $$
);
*/
```

## Status
- `rehearsal-daily-backup` 크론 작업은 Supabase SQL Editor에서 수동으로 등록되어 활성 상태입니다.
- 마이그레이션 파일을 통한 자동 적용은 제외되었습니다.
