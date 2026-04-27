create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.saju_profiles (
  id uuid primary key default gen_random_uuid(),
  local_key text not null,
  name text not null default '',
  birth_date date not null,
  birth_time time,
  gender text not null default 'male' check (gender in ('male', 'female')),
  is_lunar boolean not null default false,
  is_leap_month boolean not null default false,
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.saju_profiles
  add column if not exists local_key text,
  add column if not exists name text not null default '',
  add column if not exists birth_date date,
  add column if not exists birth_time time,
  add column if not exists gender text not null default 'male',
  add column if not exists is_lunar boolean not null default false,
  add column if not exists is_leap_month boolean not null default false,
  add column if not exists timezone text not null default 'Asia/Seoul',
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.saju_profiles
set local_key = 'legacy-' || id::text
where local_key is null;

alter table public.saju_profiles
  alter column local_key set not null,
  alter column gender set default 'male',
  alter column gender set not null;

create unique index if not exists saju_profiles_local_key_key
  on public.saju_profiles (local_key);

create table if not exists public.saju_natal_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.saju_profiles(id) on delete cascade,
  year_stem text,
  year_branch text,
  month_stem text,
  month_branch text,
  day_stem text,
  day_branch text,
  hour_stem text,
  hour_branch text,
  day_master text,
  natal_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.saju_natal_snapshots
  add column if not exists profile_id uuid references public.saju_profiles(id) on delete cascade,
  add column if not exists year_stem text,
  add column if not exists year_branch text,
  add column if not exists month_stem text,
  add column if not exists month_branch text,
  add column if not exists day_stem text,
  add column if not exists day_branch text,
  add column if not exists hour_stem text,
  add column if not exists hour_branch text,
  add column if not exists day_master text,
  add column if not exists natal_data jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists saju_natal_snapshots_profile_id_key
  on public.saju_natal_snapshots (profile_id);

create table if not exists public.saju_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.saju_profiles(id) on delete cascade,
  target_date date not null,
  daily_stem text,
  daily_branch text,
  computed_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.saju_daily_snapshots
  add column if not exists profile_id uuid references public.saju_profiles(id) on delete cascade,
  add column if not exists target_date date,
  add column if not exists daily_stem text,
  add column if not exists daily_branch text,
  add column if not exists computed_data jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create unique index if not exists saju_daily_snapshots_profile_date_key
  on public.saju_daily_snapshots (profile_id, target_date);

create table if not exists public.saju_fortune_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.saju_profiles(id) on delete cascade,
  daily_snapshot_id uuid references public.saju_daily_snapshots(id) on delete set null,
  report_date date not null,
  report_version text not null default '1.0',
  model_name text,
  headline text,
  summary text,
  report_content jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.saju_fortune_reports
  add column if not exists profile_id uuid references public.saju_profiles(id) on delete cascade,
  add column if not exists daily_snapshot_id uuid references public.saju_daily_snapshots(id) on delete set null,
  add column if not exists report_date date,
  add column if not exists report_version text not null default '1.0',
  add column if not exists model_name text,
  add column if not exists headline text,
  add column if not exists summary text,
  add column if not exists report_content jsonb not null default '{}'::jsonb,
  add column if not exists generated_at timestamptz not null default timezone('utc', now()),
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.saju_fortune_reports
set report_version = coalesce(report_version, version, '1.0')
where report_version is null;

create unique index if not exists saju_fortune_reports_profile_date_version_key
  on public.saju_fortune_reports (profile_id, report_date, report_version);

create index if not exists saju_profiles_local_key_idx
  on public.saju_profiles (local_key);

create index if not exists saju_daily_snapshots_profile_date_idx
  on public.saju_daily_snapshots (profile_id, target_date);

create index if not exists saju_fortune_reports_profile_date_idx
  on public.saju_fortune_reports (profile_id, report_date);

drop trigger if exists saju_profiles_set_updated_at on public.saju_profiles;
create trigger saju_profiles_set_updated_at
before update on public.saju_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists saju_natal_snapshots_set_updated_at on public.saju_natal_snapshots;
create trigger saju_natal_snapshots_set_updated_at
before update on public.saju_natal_snapshots
for each row
execute function public.set_updated_at();

drop trigger if exists saju_daily_snapshots_set_updated_at on public.saju_daily_snapshots;
create trigger saju_daily_snapshots_set_updated_at
before update on public.saju_daily_snapshots
for each row
execute function public.set_updated_at();

drop trigger if exists saju_fortune_reports_set_updated_at on public.saju_fortune_reports;
create trigger saju_fortune_reports_set_updated_at
before update on public.saju_fortune_reports
for each row
execute function public.set_updated_at();

alter table public.saju_profiles disable row level security;
alter table public.saju_natal_snapshots disable row level security;
alter table public.saju_daily_snapshots disable row level security;
alter table public.saju_fortune_reports disable row level security;

grant all on public.saju_profiles to anon, authenticated;
grant all on public.saju_natal_snapshots to anon, authenticated;
grant all on public.saju_daily_snapshots to anon, authenticated;
grant all on public.saju_fortune_reports to anon, authenticated;
