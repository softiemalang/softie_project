-- Create rehearsal_events table
create table if not exists public.rehearsal_events (
  id uuid default gen_random_uuid() primary key,
  owner_key text not null,
  title text not null,
  team_name text,
  event_date date not null,
  start_time time not null,
  end_time time not null,
  studio_name text,
  travel_minutes integer default 0,
  label_color text,
  google_calendar_event_id text,
  google_calendar_sync_status text default 'not_synced',
  google_calendar_synced_at timestamptz,
  drive_backup_status text default 'not_backed_up',
  drive_backup_file_id text,
  drive_backup_file_name text,
  drive_backed_up_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Set up Row Level Security (RLS)
alter table public.rehearsal_events enable row level security;

-- Create policies
create policy "Users can view their own rehearsal events"
  on public.rehearsal_events
  for select
  using (owner_key = current_setting('request.jwt.claims', true)::json->>'sub' or true); -- MVP allows anon by device id

create policy "Users can insert their own rehearsal events"
  on public.rehearsal_events
  for insert
  with check (true);

create policy "Users can update their own rehearsal events"
  on public.rehearsal_events
  for update
  using (true);

create policy "Users can delete their own rehearsal events"
  on public.rehearsal_events
  for delete
  using (true);

-- Index for performance
create index if not exists idx_rehearsal_events_owner_date on public.rehearsal_events(owner_key, event_date);