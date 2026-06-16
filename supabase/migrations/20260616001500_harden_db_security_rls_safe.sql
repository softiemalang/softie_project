-- 1. reservations RLS 설정
alter table public.reservations enable row level security;

drop policy if exists "Reservations owner-only authenticated access" on public.reservations;

create policy "Reservations owner-only authenticated access"
  on public.reservations
  for all
  to authenticated
  using (auth.uid()::text = owner_key)
  with check (auth.uid()::text = owner_key);

-- 2. work_events RLS 설정
alter table public.work_events enable row level security;

drop policy if exists "Work events owner-only authenticated access" on public.work_events;

create policy "Work events owner-only authenticated access"
  on public.work_events
  for all
  to authenticated
  using (
    exists (
      select 1 from public.reservations r
      where r.id = work_events.reservation_id
      and r.owner_key = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.reservations r
      where r.id = work_events.reservation_id
      and r.owner_key = auth.uid()::text
    )
  );

-- 3. saju_profiles RLS 설정
alter table public.saju_profiles enable row level security;

drop policy if exists "Saju profiles owner-only authenticated access" on public.saju_profiles;
drop policy if exists "Saju profiles public select for public profile" on public.saju_profiles;

-- 로그인 유저 본인 프로필 전체 액세스
create policy "Saju profiles owner-only authenticated access"
  on public.saju_profiles
  for all
  to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- 공용 프로필 (지정된 Softie public profile ID 한정) SELECT 허용
create policy "Saju profiles public select for public profile"
  on public.saju_profiles
  for select
  to anon, authenticated
  using (id = 'f647e987-5278-4850-be98-b8fe388bf1c1'::uuid);

-- 4. saju_natal_snapshots RLS 설정
alter table public.saju_natal_snapshots enable row level security;

drop policy if exists "Saju natal snapshots owner-only authenticated access" on public.saju_natal_snapshots;
drop policy if exists "Saju natal snapshots public select for public profile" on public.saju_natal_snapshots;

create policy "Saju natal snapshots owner-only authenticated access"
  on public.saju_natal_snapshots
  for all
  to authenticated
  using (
    exists (
      select 1 from public.saju_profiles p
      where p.id = saju_natal_snapshots.profile_id
      and p.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.saju_profiles p
      where p.id = saju_natal_snapshots.profile_id
      and p.user_id = auth.uid()::text
    )
  );

create policy "Saju natal snapshots public select for public profile"
  on public.saju_natal_snapshots
  for select
  to anon, authenticated
  using (profile_id = 'f647e987-5278-4850-be98-b8fe388bf1c1'::uuid);

-- 5. saju_daily_snapshots RLS 설정
alter table public.saju_daily_snapshots enable row level security;

drop policy if exists "Saju daily snapshots owner-only authenticated access" on public.saju_daily_snapshots;
drop policy if exists "Saju daily snapshots public select for public profile" on public.saju_daily_snapshots;

create policy "Saju daily snapshots owner-only authenticated access"
  on public.saju_daily_snapshots
  for all
  to authenticated
  using (
    exists (
      select 1 from public.saju_profiles p
      where p.id = saju_daily_snapshots.profile_id
      and p.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.saju_profiles p
      where p.id = saju_daily_snapshots.profile_id
      and p.user_id = auth.uid()::text
    )
  );

create policy "Saju daily snapshots public select for public profile"
  on public.saju_daily_snapshots
  for select
  to anon, authenticated
  using (profile_id = 'f647e987-5278-4850-be98-b8fe388bf1c1'::uuid);

-- 6. saju_fortune_reports RLS 설정
alter table public.saju_fortune_reports enable row level security;

drop policy if exists "Saju fortune reports owner-only authenticated access" on public.saju_fortune_reports;
drop policy if exists "Saju fortune reports public select for public profile" on public.saju_fortune_reports;

create policy "Saju fortune reports owner-only authenticated access"
  on public.saju_fortune_reports
  for all
  to authenticated
  using (
    exists (
      select 1 from public.saju_profiles p
      where p.id = saju_fortune_reports.profile_id
      and p.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.saju_profiles p
      where p.id = saju_fortune_reports.profile_id
      and p.user_id = auth.uid()::text
    )
  );

create policy "Saju fortune reports public select for public profile"
  on public.saju_fortune_reports
  for select
  to anon, authenticated
  using (profile_id = 'f647e987-5278-4850-be98-b8fe388bf1c1'::uuid);

-- 7. 명시적 권한 철회 (Privilege Hygiene)
-- RLS 적용으로도 로우 수준 격리가 처리되나, 원천적인 비인증 직접 쓰기 차단을 확증하기 위해 권한을 회수합니다.
revoke insert, update, delete on public.saju_profiles from anon;
revoke insert, update, delete on public.saju_natal_snapshots from anon;
revoke insert, update, delete on public.saju_daily_snapshots from anon;
revoke insert, update, delete on public.saju_fortune_reports from anon;

