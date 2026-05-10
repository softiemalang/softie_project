alter table public.rehearsal_events
  add column if not exists description text;
