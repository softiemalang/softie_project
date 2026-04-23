create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  endpoint text not null,
  endpoint_hash text not null unique,
  subscription jsonb not null,
  user_agent text not null default '',
  platform text not null default '',
  notification_types text[] not null default array['checkin', 'warning', 'checkout']::text[],
  active boolean not null default true,
  last_seen_at timestamptz not null default timezone('utc', now()),
  last_test_sent_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists push_subscriptions_device_id_idx
  on public.push_subscriptions (device_id);

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (active, last_seen_at desc);

alter table public.push_subscriptions enable row level security;

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();
