-- 1. saju_profiles 테이블에 local_key 추가 (비인증 사용자 식별용)
alter table public.saju_profiles add column if not exists local_key text unique;
alter table public.saju_profiles alter column user_id drop not null; -- Auth 필수 해제

-- 2. saju_fortune_reports 테이블 재정의 및 필드 정렬
-- 기존 데이터가 있다면 보존하며 없으면 새로 구성하는 수준으로 패치
alter table public.saju_fortune_reports 
add column if not exists profile_id uuid references public.saju_profiles(id) on delete cascade,
add column if not exists report_date date,
add column if not exists report_version text default '1.0',
add column if not exists model_name text,
add column if not exists headline text,
add column if not exists summary text,
add column if not exists report_content jsonb,
add column if not exists generated_at timestamptz default now();

-- 3. 중복 리포트 방지 고유 인덱스 (안정성 보장)
drop index if exists idx_saju_fortune_reports_unique;
create unique index idx_saju_fortune_reports_unique 
on public.saju_fortune_reports (profile_id, report_date, report_version);

-- 4. MVP 안정화를 위해 RLS 정책 일시 완화 (모든 접근 허용)
-- 실제 운영 시에는 local_key 또는 auth 기반의 엄격한 정책으로 전환 필요
alter table public.saju_profiles disable row level security;
alter table public.saju_natal_snapshots disable row level security;
alter table public.saju_daily_snapshots disable row level security;
alter table public.saju_fortune_reports disable row level security;
