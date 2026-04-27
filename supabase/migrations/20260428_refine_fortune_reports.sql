-- 리포트 테이블 보강 및 제약 조건 추가
alter table public.saju_fortune_reports 
add column if not exists profile_id uuid references public.saju_profiles(id) on delete cascade,
add column if not exists report_date date not null,
add column if not exists report_version text default '1.0',
add column if not exists model_name text,
add column if not exists headline text,
add column if not exists summary text;

-- 중복 리포트 방지 (동일 사용자, 동일 날짜, 동일 버전)
create unique index if not exists idx_saju_fortune_reports_unique 
on public.saju_fortune_reports (profile_id, report_date, report_version);

-- RLS 재확인
alter table public.saju_fortune_reports enable row level security;
grant all on public.saju_fortune_reports to anon, authenticated;
