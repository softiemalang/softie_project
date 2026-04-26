-- Sync current production reminder function definitions.
-- Source: pg_get_functiondef on 2026-04-26 (Asia/Seoul)
-- Minimal fix included: qualify claimable id to avoid PL/pgSQL ambiguity.

create or replace function public.compute_push_reminder_time(
  event_type work_event_type,
  scheduled_at timestamp with time zone
)
returns timestamp with time zone
language sql
immutable
as $function$
  select case
    when event_type = 'checkin' then scheduled_at - interval '7 minutes'
    when event_type = 'checkout' then scheduled_at - interval '5 minutes'
    else scheduled_at
  end
$function$;


create or replace function public.sync_push_reminders_from_work_event()
returns trigger
language plpgsql
as $function$
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
      when public.push_reminders.status = 'sent' then 'sent'
      else 'pending'
    end,
    attempt_count = case
      when public.push_reminders.status = 'sent' then public.push_reminders.attempt_count
      else 0
    end,
    last_attempt_at = case
      when public.push_reminders.status = 'sent' then public.push_reminders.last_attempt_at
      else null
    end,
    retry_after = case
      when public.push_reminders.status = 'sent' then public.push_reminders.retry_after
      else null
    end,
    sent_at = case
      when public.push_reminders.status = 'sent' then public.push_reminders.sent_at
      else null
    end,
    error_message = case
      when public.push_reminders.status = 'sent' then public.push_reminders.error_message
      else null
    end,
    claimed_at = null,
    claim_token = null,
    updated_at = timezone('utc', now());

  return new;
end;
$function$;


create or replace function public.delete_push_reminders_from_work_event()
returns trigger
language plpgsql
as $function$
begin
  delete from public.push_reminders
  where reservation_id = old.reservation_id
    and notification_type = old.event_type::text;

  return old;
end;
$function$;


create or replace function public.claim_due_push_reminders(
  p_now timestamp with time zone,
  p_window_start timestamp with time zone,
  p_claim_token uuid,
  p_limit integer default 50
)
returns table (
  id uuid,
  reservation_id uuid,
  notification_type text,
  scheduled_for timestamp with time zone,
  status text,
  attempt_count integer,
  retry_after timestamp with time zone,
  branch text,
  room text,
  customer_name text,
  event_scheduled_at timestamp with time zone
)
language plpgsql
as $function$
begin
  return query
  with claimable as (
    select pr.id
    from public.push_reminders pr
    where pr.status in ('pending', 'retry_pending')
      and (
        (pr.status = 'pending' and pr.scheduled_for <= p_now and pr.scheduled_for >= p_window_start)
        or (
          pr.status = 'retry_pending'
          and pr.retry_after is not null
          and pr.retry_after <= p_now
          and pr.retry_after >= p_window_start
        )
      )
      and (
        pr.claimed_at is null
        or pr.claimed_at <= p_now - interval '1 minute'
      )
    order by coalesce(pr.retry_after, pr.scheduled_for), pr.scheduled_for, pr.created_at
    limit greatest(p_limit, 1)
    for update skip locked
  ),
  updated as (
    update public.push_reminders pr
    set
      claimed_at = p_now,
      claim_token = p_claim_token,
      updated_at = timezone('utc', now())
    where pr.id in (select claimable.id from claimable)
    returning pr.*
  )
  select
    updated.id,
    updated.reservation_id,
    updated.notification_type,
    updated.scheduled_for,
    updated.status,
    updated.attempt_count,
    updated.retry_after,
    reservations.branch,
    reservations.room,
    reservations.customer_name,
    work_events.scheduled_at as event_scheduled_at
  from updated
  left join public.reservations
    on reservations.id = updated.reservation_id
  left join public.work_events
    on work_events.reservation_id = updated.reservation_id
   and work_events.event_type::text = updated.notification_type;
end;
$function$;
