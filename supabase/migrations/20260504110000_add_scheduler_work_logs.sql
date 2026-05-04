-- Create scheduler_work_logs table
create table if not exists public.scheduler_work_logs (
    id text primary key,
    owner_key text not null,
    week_start_date date not null,
    date date not null,
    start_time text not null,
    end_time text not null,
    duration_minutes integer not null,
    branch text,
    room text,
    synced_at timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index to quickly find a user's work logs
create index if not exists scheduler_work_logs_owner_key_idx on public.scheduler_work_logs (owner_key);
create index if not exists scheduler_work_logs_owner_date_idx on public.scheduler_work_logs (owner_key, date);
create index if not exists scheduler_work_logs_owner_week_idx on public.scheduler_work_logs (owner_key, week_start_date);

-- Enable RLS
alter table public.scheduler_work_logs enable row level security;

-- Add permissive RLS Policies (matching rehearsal_events pattern)
create policy "Users can view their own work logs"
    on public.scheduler_work_logs for select
    using (true);

create policy "Users can insert their own work logs"
    on public.scheduler_work_logs for insert
    with check (true);

create policy "Users can update their own work logs"
    on public.scheduler_work_logs for update
    using (true);

create policy "Users can delete their own work logs"
    on public.scheduler_work_logs for delete
    using (true);
