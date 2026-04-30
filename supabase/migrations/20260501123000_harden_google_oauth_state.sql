revoke all on table public.google_calendar_tokens from anon, authenticated;
drop policy if exists "Allow service role access" on public.google_calendar_tokens;

create table if not exists public.google_oauth_states (
  state_token text primary key,
  user_id text not null,
  return_path text not null default '/scheduler',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.google_oauth_states enable row level security;

revoke all on table public.google_oauth_states from anon, authenticated;
grant all on table public.google_calendar_tokens to service_role;
grant all on table public.google_oauth_states to service_role;

create index if not exists google_oauth_states_expires_at_idx
  on public.google_oauth_states (expires_at);
