begin;

create schema if not exists private authorization postgres;
revoke all on schema private from public, anon, authenticated;

-- Reminder rows are internal dispatch state. Only service-role code and
-- database triggers should be able to read or mutate them.
alter table public.push_reminders enable row level security;

revoke all on table public.push_reminders from anon, authenticated;
revoke all on table public.push_subscriptions from anon, authenticated;

alter function public.set_updated_at()
  set search_path = '';
alter function public.sync_work_events_from_reservation()
  set search_path = '';
alter function public.compute_push_reminder_time(public.work_event_type, timestamp with time zone)
  set search_path = '';

alter function public.sync_push_reminders_from_work_event()
  security definer
  set search_path = '';
alter function public.delete_push_reminders_from_work_event()
  security definer
  set search_path = '';
alter function public.claim_due_push_reminders(timestamp with time zone, timestamp with time zone, uuid, integer)
  set search_path = '';

revoke execute on function public.sync_push_reminders_from_work_event() from public, anon, authenticated;
revoke execute on function public.delete_push_reminders_from_work_event() from public, anon, authenticated;
alter function public.sync_push_reminders_from_work_event() set schema private;
alter function public.delete_push_reminders_from_work_event() set schema private;

revoke execute on function public.claim_due_push_reminders(timestamp with time zone, timestamp with time zone, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.claim_due_push_reminders(timestamp with time zone, timestamp with time zone, uuid, integer)
  to service_role;

-- Work logs are user data. Replace the original open policies with ownership
-- checks tied to the authenticated Supabase user.
drop policy if exists "Users can view their own work logs" on public.scheduler_work_logs;
drop policy if exists "Users can insert their own work logs" on public.scheduler_work_logs;
drop policy if exists "Users can update their own work logs" on public.scheduler_work_logs;
drop policy if exists "Users can delete their own work logs" on public.scheduler_work_logs;

create policy "Users can view their own work logs"
  on public.scheduler_work_logs
  for select
  to authenticated
  using ((select auth.uid())::text = owner_key);

create policy "Users can insert their own work logs"
  on public.scheduler_work_logs
  for insert
  to authenticated
  with check ((select auth.uid())::text = owner_key);

create policy "Users can update their own work logs"
  on public.scheduler_work_logs
  for update
  to authenticated
  using ((select auth.uid())::text = owner_key)
  with check ((select auth.uid())::text = owner_key);

create policy "Users can delete their own work logs"
  on public.scheduler_work_logs
  for delete
  to authenticated
  using ((select auth.uid())::text = owner_key);

revoke all on table public.scheduler_work_logs from anon;
grant select, insert, update, delete on table public.scheduler_work_logs to authenticated;

-- Preserve the existing reservation behavior while avoiding repeated auth.uid()
-- evaluation for every row.
drop policy if exists "Reservations owner-only authenticated access" on public.reservations;
create policy "Reservations owner-only authenticated access"
  on public.reservations
  for all
  to authenticated
  using ((select auth.uid())::text = owner_key)
  with check ((select auth.uid())::text = owner_key);

drop policy if exists "Work events owner-only authenticated access" on public.work_events;
create policy "Work events owner-only authenticated access"
  on public.work_events
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.reservations r
      where r.id = work_events.reservation_id
        and r.owner_key = (select auth.uid())::text
    )
  )
  with check (
    exists (
      select 1
      from public.reservations r
      where r.id = work_events.reservation_id
        and r.owner_key = (select auth.uid())::text
    )
  );

-- Delete overlapping logs and save the replacement in one transaction so an
-- insert failure cannot leave the user with deleted history.
create or replace function public.replace_scheduler_work_logs(
  p_id text,
  p_week_start_date date,
  p_date date,
  p_start_time text,
  p_end_time text,
  p_duration_minutes integer,
  p_branch text,
  p_room text,
  p_remove_ids text[]
)
returns setof public.scheduler_work_logs
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_owner_key text := (select auth.uid())::text;
  v_saved public.scheduler_work_logs%rowtype;
begin
  if v_owner_key is null then
    raise exception 'Authentication required';
  end if;

  if p_id is null or btrim(p_id) = '' then
    raise exception 'Work log id is required';
  end if;

  if p_duration_minutes <= 0 then
    raise exception 'Work log duration must be positive';
  end if;

  delete from public.scheduler_work_logs
  where owner_key = v_owner_key
    and id = any(coalesce(p_remove_ids, '{}'::text[]));

  insert into public.scheduler_work_logs (
    id,
    owner_key,
    week_start_date,
    date,
    start_time,
    end_time,
    duration_minutes,
    branch,
    room,
    synced_at
  ) values (
    p_id,
    v_owner_key,
    p_week_start_date,
    p_date,
    p_start_time,
    p_end_time,
    p_duration_minutes,
    p_branch,
    p_room,
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    week_start_date = excluded.week_start_date,
    date = excluded.date,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    duration_minutes = excluded.duration_minutes,
    branch = excluded.branch,
    room = excluded.room,
    synced_at = excluded.synced_at,
    updated_at = timezone('utc', now())
  where scheduler_work_logs.owner_key = v_owner_key
  returning * into v_saved;

  if v_saved.id is null then
    raise exception 'Work log belongs to another user';
  end if;

  return next v_saved;
  return;
end;
$function$;

revoke execute on function public.replace_scheduler_work_logs(text, date, date, text, text, integer, text, text, text[])
  from public, anon;
grant execute on function public.replace_scheduler_work_logs(text, date, date, text, text, integer, text, text, text[])
  to authenticated;

commit;
