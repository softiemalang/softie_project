create extension if not exists pg_cron;
create extension if not exists pg_net;

alter table if exists public.push_subscriptions
  add column if not exists notifications_enabled boolean not null default true;

create table if not exists public.push_reminders (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  notification_type text not null check (notification_type in ('checkin', 'warning', 'checkout')),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0 and attempt_count <= 2),
  last_attempt_at timestamptz,
  retry_after timestamptz,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (reservation_id, notification_type)
);

create index if not exists push_reminders_status_scheduled_for_idx
  on public.push_reminders (status, scheduled_for);

create index if not exists push_reminders_status_retry_after_idx
  on public.push_reminders (status, retry_after);

create index if not exists push_reminders_reservation_id_idx
  on public.push_reminders (reservation_id);

create or replace function public.compute_push_reminder_time(
  event_type public.work_event_type,
  scheduled_at timestamptz
)
returns timestamptz
language sql
immutable
as $$
  select case
    when event_type = 'checkin' then scheduled_at - interval '7 minutes'
    when event_type = 'checkout' then scheduled_at - interval '5 minutes'
    else scheduled_at
  end
$$;

create or replace function public.sync_push_reminders_from_work_event()
returns trigger
language plpgsql
as $$
begin
  insert into public.push_reminders (
    reservation_id,
    notification_type,
    scheduled_for
  )
  values (
    new.reservation_id,
    new.event_type::text,
    public.compute_push_reminder_time(new.event_type, new.scheduled_at)
  )
  on conflict (reservation_id, notification_type)
  do update set
    scheduled_for = excluded.scheduled_for,
    status = case
      when public.push_reminders.status in ('pending', 'failed') then 'pending'
      else public.push_reminders.status
    end,
    attempt_count = case
      when public.push_reminders.status in ('pending', 'failed') then 0
      else public.push_reminders.attempt_count
    end,
    last_attempt_at = case
      when public.push_reminders.status in ('pending', 'failed') then null
      else public.push_reminders.last_attempt_at
    end,
    retry_after = case
      when public.push_reminders.status in ('pending', 'failed') then null
      else public.push_reminders.retry_after
    end,
    sent_at = case
      when public.push_reminders.status in ('pending', 'failed') then null
      else public.push_reminders.sent_at
    end,
    error_message = case
      when public.push_reminders.status in ('pending', 'failed') then null
      else public.push_reminders.error_message
    end,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.delete_push_reminders_from_work_event()
returns trigger
language plpgsql
as $$
begin
  delete from public.push_reminders
  where reservation_id = old.reservation_id
    and notification_type = old.event_type::text;

  return old;
end;
$$;

drop trigger if exists push_reminders_set_updated_at on public.push_reminders;
create trigger push_reminders_set_updated_at
before update on public.push_reminders
for each row
execute function public.set_updated_at();

drop trigger if exists work_events_sync_push_reminders on public.work_events;
create trigger work_events_sync_push_reminders
after insert or update of reservation_id, event_type, scheduled_at
on public.work_events
for each row
execute function public.sync_push_reminders_from_work_event();

drop trigger if exists work_events_delete_push_reminders on public.work_events;
create trigger work_events_delete_push_reminders
after delete on public.work_events
for each row
execute function public.delete_push_reminders_from_work_event();

insert into public.push_reminders (
  reservation_id,
  notification_type,
  scheduled_for
)
select
  work_events.reservation_id,
  work_events.event_type::text,
  public.compute_push_reminder_time(work_events.event_type, work_events.scheduled_at)
from public.work_events
on conflict (reservation_id, notification_type)
do update set
  scheduled_for = excluded.scheduled_for,
  status = case
    when public.push_reminders.status in ('pending', 'failed') then 'pending'
    else public.push_reminders.status
  end,
  attempt_count = case
    when public.push_reminders.status in ('pending', 'failed') then 0
    else public.push_reminders.attempt_count
  end,
  last_attempt_at = case
    when public.push_reminders.status in ('pending', 'failed') then null
    else public.push_reminders.last_attempt_at
  end,
  retry_after = case
    when public.push_reminders.status in ('pending', 'failed') then null
    else public.push_reminders.retry_after
  end,
  sent_at = case
    when public.push_reminders.status in ('pending', 'failed') then null
    else public.push_reminders.sent_at
  end,
  error_message = case
    when public.push_reminders.status in ('pending', 'failed') then null
    else public.push_reminders.error_message
  end,
  updated_at = timezone('utc', now());

do $$
declare
  existing_job_id bigint;
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_extension where extname = 'pg_net') then
    select jobid
      into existing_job_id
      from cron.job
     where jobname = 'dispatch-scheduler-reminders';

    if existing_job_id is not null then
      perform cron.unschedule(existing_job_id);
    end if;

    perform cron.schedule(
      'dispatch-scheduler-reminders',
      '* * * * *',
      $cron$
        select net.http_post(
          url := 'https://txkqkvkwasfzapvcbezv.supabase.co/functions/v1/dispatch-scheduler-reminders',
          headers := '{"Content-Type":"application/json"}'::jsonb,
          body := '{}'::jsonb
        ) as request_id;
      $cron$
    );
  end if;
exception
  when undefined_table then
    raise notice 'cron.job is not available; skipping reminder dispatch schedule';
end;
$$;
