begin;

-- A single public Softie report may be generated for a profile/date/version
-- window. The row is a durable idempotency/quota lock so concurrent public
-- callers cannot fan out paid RAG/model work before the report is saved.
create table if not exists public.saju_fortune_generation_locks (
  profile_id uuid not null references public.saju_profiles(id) on delete cascade,
  report_date date not null,
  report_version text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, report_date, report_version)
);

alter table public.saju_fortune_generation_locks enable row level security;
revoke all on table public.saju_fortune_generation_locks from public, anon, authenticated;
grant all on table public.saju_fortune_generation_locks to service_role;

commit;
