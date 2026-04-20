create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'work_event_type') then
    create type work_event_type as enum ('checkin', 'warning', 'checkout');
  end if;

  if not exists (select 1 from pg_type where typname = 'work_event_status') then
    create type work_event_status as enum ('pending', 'done', 'skipped');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  reservation_date date not null,
  branch text not null,
  room text not null,
  customer_name text not null,
  start_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes >= 30),
  end_at timestamptz not null,
  warning_offset_minutes integer not null default 10 check (warning_offset_minutes >= 0),
  tags text[] not null default '{}',
  notes_text text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (end_at > start_at),
  check (warning_offset_minutes <= duration_minutes)
);

create table if not exists public.work_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  event_type work_event_type not null,
  scheduled_at timestamptz not null,
  status work_event_status not null default 'pending',
  tags_snapshot text[] not null default '{}',
  memo_snapshot text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (reservation_id, event_type)
);

create index if not exists reservations_day_branch_room_idx
  on public.reservations (reservation_date, branch, room);

create index if not exists work_events_scheduled_at_idx
  on public.work_events (scheduled_at);

create index if not exists work_events_status_scheduled_at_idx
  on public.work_events (status, scheduled_at);

create or replace function public.sync_work_events_from_reservation()
returns trigger
language plpgsql
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

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row
execute function public.set_updated_at();

drop trigger if exists work_events_set_updated_at on public.work_events;
create trigger work_events_set_updated_at
before update on public.work_events
for each row
execute function public.set_updated_at();

drop trigger if exists reservations_sync_work_events on public.reservations;
create trigger reservations_sync_work_events
after insert or update of reservation_date, branch, room, customer_name, start_at, duration_minutes, end_at, warning_offset_minutes, tags, notes_text
on public.reservations
for each row
execute function public.sync_work_events_from_reservation();
