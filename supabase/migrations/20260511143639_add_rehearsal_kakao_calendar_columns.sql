alter table public.rehearsal_events
  add column if not exists kakao_calendar_event_id text,
  add column if not exists kakao_calendar_sync_status text default 'not_synced',
  add column if not exists kakao_calendar_synced_at timestamptz;
