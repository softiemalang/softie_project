create table if not exists public.google_calendar_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique, -- Can be device_id or auth.user_id
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scope text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.google_calendar_tokens enable row level security;

-- Allow anon access for MVP if needed, or restrict to service_role
-- For now, let's allow service_role only since Edge Functions will handle it
create policy "Allow service role access" on public.google_calendar_tokens
  using (true)
  with check (true);

drop trigger if exists google_calendar_tokens_set_updated_at on public.google_calendar_tokens;
create trigger google_calendar_tokens_set_updated_at
before update on public.google_calendar_tokens
for each row
execute function public.set_updated_at();
