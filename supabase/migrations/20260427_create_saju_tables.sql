-- 0. 공통 함수 및 확장
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

-- 1. saju_profiles (사주 프로필)
create table if not exists public.saju_profiles (
  id uuid primary key default gen_random_uuid(),
  local_key text not null unique,
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

-- 기존 테이블이 있을 경우를 대비한 컬럼 보강
alter table public.saju_profiles 
  add column if not exists local_key text,
  add column if not exists name text not null default '',
  add column if not exists birth_date date,
  add column if not exists birth_time time,
  add column if not exists gender text not null default 'male',
  add column if not exists is_lunar boolean not null default false,
  add column if not exists is_leap_month boolean not null default false,
  add column if not exists timezone text not null default 'Asia/Seoul';

-- local_key 유니크 제약 조건 및 인덱스 (비인증 사용자 식별용)
do $$ 
begin
  if not exists (select 1 from pg_indexes where indexname = 'saju_profiles_local_key_idx') then
    create index saju_profiles_local_key_idx on public.saju_profiles (local_key);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'saju_profiles_local_key_key') then
    alter table public.saju_profiles add constraint saju_profiles_local_key_key unique (local_key);
  end if;
end $$;

-- 2. saju_natal_snapshots (사주 원국 스냅샷)
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

create unique index if not exists saju_natal_snapshots_profile_id_key on public.saju_natal_snapshots (profile_id);

-- 3. saju_daily_snapshots (일일 운세 스냅샷)
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

create unique index if not exists saju_daily_snapshots_profile_date_key on public.saju_daily_snapshots (profile_id, target_date);

-- 4. saju_fortune_reports (최종 운세 리포트)
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

-- 중복 리포트 방지 고유 인덱스 (프로필, 날짜, 버전별 1개)
drop index if exists idx_saju_fortune_reports_unique;
create unique index idx_saju_fortune_reports_unique on public.saju_fortune_reports (profile_id, report_date, report_version);

-- 5. 트리거 설정
drop trigger if exists saju_profiles_set_updated_at on public.saju_profiles;
create trigger saju_profiles_set_updated_at before update on public.saju_profiles for each row execute function public.set_updated_at();

drop trigger if exists saju_natal_snapshots_set_updated_at on public.saju_natal_snapshots;
create trigger saju_natal_snapshots_set_updated_at before update on public.saju_natal_snapshots for each row execute function public.set_updated_at();

drop trigger if exists saju_daily_snapshots_set_updated_at on public.saju_daily_snapshots;
create trigger saju_daily_snapshots_set_updated_at before update on public.saju_daily_snapshots for each row execute function public.set_updated_at();

drop trigger if exists saju_fortune_reports_set_updated_at on public.saju_fortune_reports;
create trigger saju_fortune_reports_set_updated_at before update on public.saju_fortune_reports for each row execute function public.set_updated_at();

-- 6. 보안 정책 (MVP 안정화를 위해 RLS 일시 비활성화 및 권한 부여)
alter table public.saju_profiles disable row level security;
alter table public.saju_natal_snapshots disable row level security;
alter table public.saju_daily_snapshots disable row level security;
alter table public.saju_fortune_reports disable row level security;

grant all on public.saju_profiles to anon, authenticated;
grant all on public.saju_natal_snapshots to anon, authenticated;
grant all on public.saju_daily_snapshots to anon, authenticated;
grant all on public.saju_fortune_reports to anon, authenticated;
