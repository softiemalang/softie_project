-- 오늘의 운세 서비스를 위한 테이블 정의

-- 1. 사용자 사주 프로필
create table if not exists public.saju_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  gender text check (gender in ('male', 'female')),
  birth_date date not null, -- 양력 기준
  birth_time time, -- HH:MM:SS
  is_lunar boolean default false,
  is_leap_month boolean default false,
  timezone text default 'Asia/Seoul',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 원국 분석 스냅샷 (변하지 않는 데이터)
create table if not exists public.saju_natal_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.saju_profiles(id) on delete cascade,
  year_stem text, year_branch text,
  month_stem text, month_branch text,
  day_stem text, day_branch text,
  hour_stem text, hour_branch text,
  day_master text, -- 일간
  natal_data jsonb, -- 오행 분포, 십성 구성 등 상세 데이터
  created_at timestamptz default now()
);

-- 3. 일일 운세 계산 스냅샷 (결정론적 계산 결과)
create table if not exists public.saju_daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.saju_profiles(id) on delete cascade,
  target_date date not null,
  daily_stem text, daily_branch text,
  computed_data jsonb, -- 충, 합, 점수화된 신호들
  created_at timestamptz default now(),
  unique(profile_id, target_date)
);

-- 4. 최종 운세 리포트 (LLM 결과물)
create table if not exists public.saju_fortune_reports (
  id uuid primary key default gen_random_uuid(),
  daily_snapshot_id uuid references public.saju_daily_snapshots(id) on delete cascade,
  report_content jsonb, -- 요약, 종합흐름, 분야별 텍스트
  version text, -- LLM 모델 및 프롬프트 버전
  created_at timestamptz default now()
);

-- RLS 설정 (개인 데이터 보호)
alter table public.saju_profiles enable row level security;
alter table public.saju_natal_snapshots enable row level security;
alter table public.saju_daily_snapshots enable row level security;
alter table public.saju_fortune_reports enable row level security;

-- 권한 설정 (간단한 예시: 자신의 프로필만 접근 가능하도록 나중에 보강 가능)
-- 현재는 서비스 초기 MVP를 위해 public 권한 부여 후 점진적 제한 권장
grant all on public.saju_profiles to anon, authenticated;
grant all on public.saju_natal_snapshots to anon, authenticated;
grant all on public.saju_daily_snapshots to anon, authenticated;
grant all on public.saju_fortune_reports to anon, authenticated;
