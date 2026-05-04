create table if not exists public.spotify_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  token_type text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.spotify_tokens enable row level security;

revoke all on table public.spotify_tokens from anon, authenticated;
grant all on table public.spotify_tokens to service_role;

drop trigger if exists spotify_tokens_set_updated_at on public.spotify_tokens;
create trigger spotify_tokens_set_updated_at
before update on public.spotify_tokens
for each row
execute function public.set_updated_at();

create table if not exists public.spotify_oauth_states (
  state_token text primary key,
  user_id text not null,
  return_path text not null default '/music',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.spotify_oauth_states enable row level security;

revoke all on table public.spotify_oauth_states from anon, authenticated;
grant all on table public.spotify_oauth_states to service_role;

create index if not exists spotify_oauth_states_expires_at_idx
  on public.spotify_oauth_states (expires_at);
