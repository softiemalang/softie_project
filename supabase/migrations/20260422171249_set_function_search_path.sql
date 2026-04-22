create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_work_events_from_reservation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into public.work_events (
    reservation_id,
    event_type,
    scheduled_at,
    status,
    tags_snapshot,
    memo_snapshot
  )
  values
    (
      new.id,
      'checkin',
      new.start_at,
      coalesce((select status from public.work_events where reservation_id = new.id and event_type = 'checkin'), 'pending'),
      new.tags,
      new.notes_text
    ),
    (
      new.id,
      'warning',
      new.end_at - make_interval(mins => new.warning_offset_minutes),
      coalesce((select status from public.work_events where reservation_id = new.id and event_type = 'warning'), 'pending'),
      new.tags,
      new.notes_text
    ),
    (
      new.id,
      'checkout',
      new.end_at,
      coalesce((select status from public.work_events where reservation_id = new.id and event_type = 'checkout'), 'pending'),
      new.tags,
      new.notes_text
    )
  on conflict (reservation_id, event_type)
  do update set
    scheduled_at = excluded.scheduled_at,
    tags_snapshot = excluded.tags_snapshot,
    memo_snapshot = excluded.memo_snapshot,
    updated_at = timezone('utc', now());

  return new;
end;
$$;
