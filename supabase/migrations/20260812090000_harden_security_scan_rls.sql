begin;

-- Corrective migration for the security scan findings. Historical migrations
-- remain immutable; this migration removes both the original permissive policy
-- names and the later-but-still-permissive policy names observed in the linked
-- database.

-- Rehearsal events are authenticated-owner data. Anonymous rehearsal work is
-- kept in the browser by the client; it is never authorized by a caller-owned
-- owner_key in PostgREST.
alter table public.rehearsal_events enable row level security;

drop policy if exists "Users can view their own rehearsal events" on public.rehearsal_events;
drop policy if exists "Users can insert their own rehearsal events" on public.rehearsal_events;
drop policy if exists "Users can update their own rehearsal events" on public.rehearsal_events;
drop policy if exists "Users can delete their own rehearsal events" on public.rehearsal_events;

create policy "rehearsal events authenticated owner select"
  on public.rehearsal_events
  for select
  to authenticated
  using ((select auth.uid())::text = owner_key);

create policy "rehearsal events authenticated owner insert"
  on public.rehearsal_events
  for insert
  to authenticated
  with check ((select auth.uid())::text = owner_key);

create policy "rehearsal events authenticated owner update"
  on public.rehearsal_events
  for update
  to authenticated
  using ((select auth.uid())::text = owner_key)
  with check ((select auth.uid())::text = owner_key);

create policy "rehearsal events authenticated owner delete"
  on public.rehearsal_events
  for delete
  to authenticated
  using ((select auth.uid())::text = owner_key);

revoke all on table public.rehearsal_events from public, anon;
grant select, insert, update, delete on table public.rehearsal_events to authenticated;
grant all on table public.rehearsal_events to service_role;

-- Legacy device-key rows are intentionally not auto-claimed during sign-in.
-- A caller-controlled legacy key is not an ownership proof, so rows remain
-- recoverable in the original browser until an explicit, separately designed
-- migration flow can establish that proof.

-- Band rooms: authenticated users may see only rooms they own or joined.
-- Joining is performed by an exact-code, bounded RPC rather than by exposing
-- every room row or accepting an arbitrary room_id in a direct INSERT.
alter table public.rooms enable row level security;
alter table public.members enable row level security;
alter table public.availabilities enable row level security;

create or replace function public.is_band_room_owner(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.owner_user_id = auth.uid()
  );
$function$;

create or replace function public.is_band_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.members m
    where m.room_id = target_room_id
      and m.user_id = auth.uid()
  );
$function$;

create or replace function public.owns_band_member(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.members m
    where m.id = target_member_id
      and m.user_id = auth.uid()
  );
$function$;

create or replace function public.owns_band_member_in_room(target_member_id uuid, target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.members m
    where m.id = target_member_id
      and m.room_id = target_room_id
      and m.user_id = auth.uid()
  );
$function$;

revoke execute on function public.is_band_room_owner(uuid) from public, anon;
revoke execute on function public.is_band_room_member(uuid) from public, anon;
revoke execute on function public.owns_band_member(uuid) from public, anon;
revoke execute on function public.owns_band_member_in_room(uuid, uuid) from public, anon;
grant execute on function public.is_band_room_owner(uuid) to authenticated;
grant execute on function public.is_band_room_member(uuid) to authenticated;
grant execute on function public.owns_band_member(uuid) to authenticated;
grant execute on function public.owns_band_member_in_room(uuid, uuid) to authenticated;

drop policy if exists "rooms authenticated read" on public.rooms;
drop policy if exists "rooms authenticated insert" on public.rooms;
drop policy if exists "rooms authenticated update" on public.rooms;
drop policy if exists "rooms authenticated delete" on public.rooms;
drop policy if exists "rooms public read" on public.rooms;
drop policy if exists "rooms public insert" on public.rooms;
drop policy if exists "rooms public update" on public.rooms;
drop policy if exists "rooms public delete" on public.rooms;
drop policy if exists "rooms authenticated read bounded" on public.rooms;
drop policy if exists "rooms authenticated insert own" on public.rooms;
drop policy if exists "rooms authenticated update owner" on public.rooms;
drop policy if exists "rooms authenticated delete owner" on public.rooms;

drop policy if exists "members authenticated read" on public.members;
drop policy if exists "members authenticated insert" on public.members;
drop policy if exists "members authenticated update" on public.members;
drop policy if exists "members authenticated delete" on public.members;
drop policy if exists "members public read" on public.members;
drop policy if exists "members public insert" on public.members;
drop policy if exists "members public update" on public.members;
drop policy if exists "members public delete" on public.members;
drop policy if exists "members authenticated read room participants" on public.members;
drop policy if exists "members authenticated insert self" on public.members;
drop policy if exists "members authenticated update self" on public.members;
drop policy if exists "members authenticated delete self or owner" on public.members;

drop policy if exists "availabilities authenticated read" on public.availabilities;
drop policy if exists "availabilities authenticated insert" on public.availabilities;
drop policy if exists "availabilities authenticated update" on public.availabilities;
drop policy if exists "availabilities authenticated delete" on public.availabilities;
drop policy if exists "availabilities public read" on public.availabilities;
drop policy if exists "availabilities public insert" on public.availabilities;
drop policy if exists "availabilities public update" on public.availabilities;
drop policy if exists "availabilities public delete" on public.availabilities;
drop policy if exists "availabilities authenticated read room participants" on public.availabilities;
drop policy if exists "availabilities authenticated insert self" on public.availabilities;
drop policy if exists "availabilities authenticated update self" on public.availabilities;
drop policy if exists "availabilities authenticated delete self or owner" on public.availabilities;

create policy "rooms authenticated read owner or member"
  on public.rooms
  for select
  to authenticated
  using (public.is_band_room_owner(id) or public.is_band_room_member(id));

create policy "rooms authenticated insert own"
  on public.rooms
  for insert
  to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy "rooms authenticated update owner"
  on public.rooms
  for update
  to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy "rooms authenticated delete owner"
  on public.rooms
  for delete
  to authenticated
  using (owner_user_id = (select auth.uid()));

create policy "members authenticated read room participants"
  on public.members
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_band_room_owner(room_id)
    or public.is_band_room_member(room_id)
  );

-- A direct INSERT is only for an owner creating their own initial member row.
-- Non-owners use join_band_room_by_code, which binds the room lookup and the
-- membership write in one server-side operation.
create policy "members authenticated insert owner"
  on public.members
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_band_room_owner(room_id)
  );

create policy "members authenticated update self profile"
  on public.members
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "members authenticated delete self or owner"
  on public.members
  for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_band_room_owner(room_id)
  );

create policy "availabilities authenticated read room participants"
  on public.availabilities
  for select
  to authenticated
  using (public.is_band_room_owner(room_id) or public.is_band_room_member(room_id));

create policy "availabilities authenticated insert self"
  on public.availabilities
  for insert
  to authenticated
  with check (public.owns_band_member_in_room(member_id, room_id));

create policy "availabilities authenticated update self"
  on public.availabilities
  for update
  to authenticated
  using (public.owns_band_member(member_id))
  with check (public.owns_band_member_in_room(member_id, room_id));

create policy "availabilities authenticated delete self or owner"
  on public.availabilities
  for delete
  to authenticated
  using (public.owns_band_member(member_id) or public.is_band_room_owner(room_id));

revoke all on table public.rooms, public.members, public.availabilities from public, anon;
grant select, insert, update, delete on table public.rooms to authenticated;
revoke select on table public.members from authenticated;
grant select (id, room_id, user_id, display_name, created_at) on table public.members to authenticated;
grant insert, delete on table public.members to authenticated;
revoke update on table public.members from authenticated;
grant update (display_name) on table public.members to authenticated;
grant select, insert, update, delete on table public.availabilities to authenticated;
grant all on table public.rooms, public.members, public.availabilities to service_role;

drop function if exists public.join_band_room_by_code(text, text);

create function public.join_band_room_by_code(
  p_room_code text,
  p_display_name text
)
returns table (
  member_id uuid,
  room_id uuid,
  user_id uuid,
  display_name text,
  room_name text,
  room_code text,
  owner_user_id uuid,
  room_created_at timestamptz,
  member_created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_room_code is null or btrim(p_room_code) = '' or length(p_room_code) > 64 then
    raise exception 'Room code is invalid' using errcode = '22023';
  end if;

  select r.*
  into v_room
  from public.rooms r
  where upper(btrim(r.room_code)) = upper(btrim(p_room_code))
  limit 1;

  if not found then
    raise exception 'Room not found' using errcode = 'P0002';
  end if;

  insert into public.members (room_id, user_id, display_name, pin_hash)
  values (
    v_room.id,
    v_user_id,
    left(btrim(coalesce(p_display_name, '')), 120),
    'auth:' || v_user_id::text
  )
  on conflict do nothing;

  return query
  select
    m.id,
    m.room_id,
    m.user_id,
    m.display_name,
    v_room.name,
    v_room.room_code,
    v_room.owner_user_id,
    v_room.created_at,
    m.created_at
  from public.members m
  where m.room_id = v_room.id
    and m.user_id = v_user_id;
end;
$function$;

revoke execute on function public.join_band_room_by_code(text, text) from public, anon;
grant execute on function public.join_band_room_by_code(text, text) to authenticated;

-- Evaluation rows contain prompts and retrieved internal chunks. No client
-- role is a reader; the scheduled evaluator remains service-role only.
alter table public.saju_report_evaluations enable row level security;
alter table public.saju_evaluation_batches enable row level security;
drop policy if exists "Authenticated users can read saju report evaluations" on public.saju_report_evaluations;
revoke all on table public.saju_report_evaluations, public.saju_evaluation_batches from public, anon, authenticated;
grant all on table public.saju_report_evaluations, public.saju_evaluation_batches to service_role;

-- Public Softie report reads go through a bounded projection. Existing report
-- rows may contain historical debug keys, so the projection removes debug at
-- the database boundary instead of relying on a browser-side filter.
-- Public profile and daily-snapshot reads also go through bounded function
-- contracts. Do not leave the fixed public profile policy on the base tables:
-- PostgREST column selection is caller-controlled, so a client-side select
-- list is not an authorization boundary.
drop policy if exists "Saju profiles public select for public profile" on public.saju_profiles;
revoke select on table public.saju_profiles from public, anon;

drop policy if exists "Saju daily snapshots public select for public profile" on public.saju_daily_snapshots;
revoke select on table public.saju_daily_snapshots from public, anon;

drop function if exists public.get_public_saju_daily_snapshot(uuid, date);

create function public.get_public_saju_daily_snapshot(
  p_profile_id uuid,
  p_target_date date
)
returns table (
  id uuid,
  profile_id uuid,
  target_date date,
  computed_data jsonb
)
language sql
security definer
set search_path = ''
as $function$
  select s.id, s.profile_id, s.target_date, s.computed_data
  from public.saju_daily_snapshots s
  where p_profile_id = 'f647e987-5278-4850-be98-b8fe388bf1c1'::uuid
    and s.profile_id = p_profile_id
    and s.target_date = p_target_date
    and p_target_date = (now() at time zone 'Asia/Seoul')::date
  limit 1;
$function$;

revoke all on function public.get_public_saju_daily_snapshot(uuid, date) from public, anon, authenticated;
grant execute on function public.get_public_saju_daily_snapshot(uuid, date) to anon, authenticated;

drop policy if exists "Saju fortune reports public select for public profile" on public.saju_fortune_reports;
revoke all on table public.saju_fortune_reports from public, anon;

drop function if exists public.get_public_saju_fortune_report(uuid, date, text);

create function public.get_public_saju_fortune_report(
  p_profile_id uuid,
  p_report_date date,
  p_report_version text
)
returns table (
  id uuid,
  profile_id uuid,
  report_date date,
  report_version text,
  model_name text,
  headline text,
  summary text,
  report_content jsonb
)
language sql
security definer
set search_path = ''
as $function$
  select
    r.id,
    r.profile_id,
    r.report_date,
    r.report_version,
    r.model_name,
    r.headline,
    r.summary,
    coalesce(r.report_content, '{}'::jsonb) - 'debug'
  from public.saju_fortune_reports r
  where p_profile_id = 'f647e987-5278-4850-be98-b8fe388bf1c1'::uuid
    and r.profile_id = p_profile_id
    and r.report_date = p_report_date
    and r.report_version = p_report_version
  limit 1;
$function$;

drop function if exists public.get_public_saju_fortune_history(uuid, integer);

create function public.get_public_saju_fortune_history(
  p_profile_id uuid,
  p_limit integer default 30
)
returns table (
  id uuid,
  profile_id uuid,
  report_date date,
  report_version text,
  headline text,
  summary text
)
language sql
security definer
set search_path = ''
as $function$
  select r.id, r.profile_id, r.report_date, r.report_version, r.headline, r.summary
  from public.saju_fortune_reports r
  where p_profile_id = 'f647e987-5278-4850-be98-b8fe388bf1c1'::uuid
    and r.profile_id = p_profile_id
  order by r.report_date desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$function$;

drop function if exists public.get_public_saju_fortune_report_by_id(uuid, uuid);

create function public.get_public_saju_fortune_report_by_id(
  p_profile_id uuid,
  p_report_id uuid
)
returns table (
  id uuid,
  profile_id uuid,
  report_date date,
  report_version text,
  headline text,
  summary text,
  report_content jsonb
)
language sql
security definer
set search_path = ''
as $function$
  select
    r.id,
    r.profile_id,
    r.report_date,
    r.report_version,
    r.headline,
    r.summary,
    coalesce(r.report_content, '{}'::jsonb) - 'debug'
  from public.saju_fortune_reports r
  where p_profile_id = 'f647e987-5278-4850-be98-b8fe388bf1c1'::uuid
    and r.profile_id = p_profile_id
    and r.id = p_report_id
  limit 1;
$function$;

revoke all on function public.get_public_saju_fortune_report(uuid, date, text) from public, anon, authenticated;
revoke all on function public.get_public_saju_fortune_history(uuid, integer) from public, anon, authenticated;
revoke all on function public.get_public_saju_fortune_report_by_id(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_public_saju_fortune_report(uuid, date, text) to anon, authenticated;
grant execute on function public.get_public_saju_fortune_history(uuid, integer) to anon, authenticated;
grant execute on function public.get_public_saju_fortune_report_by_id(uuid, uuid) to anon, authenticated;

commit;
