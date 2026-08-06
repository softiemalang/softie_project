begin;

-- The application and direct SQL data-entry examples use this same key:
-- Unicode NFKC, trim, collapse internal whitespace to one ASCII space, then
-- deterministic ASCII lower-case for English letters.
create or replace function public.normalize_scheduler_regular_name(value text)
returns text
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select translate(
    regexp_replace(
      regexp_replace(normalize(value, NFKC), '^\s+|\s+$', '', 'g'),
      '\s+',
      ' ',
      'g'
    ),
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz'
  );
$$;

create table if not exists public.scheduler_regulars (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  display_name text not null check (btrim(display_name) <> ''),
  name_key text not null check (
    name_key <> ''
    and name_key = public.normalize_scheduler_regular_name(display_name)
  ),
  phone_last4 text not null check (phone_last4 ~ '^[0-9]{4}$'),
  is_active boolean not null default true,
  memo text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists scheduler_regulars_active_identity_idx
  on public.scheduler_regulars (owner_key, name_key, phone_last4)
  where is_active;

create index if not exists scheduler_regulars_owner_active_idx
  on public.scheduler_regulars (owner_key, is_active, display_name);

alter table public.reservations
  add column if not exists regular_phone_last4 text,
  add column if not exists regular_id uuid;

alter table public.reservations
  drop constraint if exists reservations_regular_phone_last4_check;

alter table public.reservations
  add constraint reservations_regular_phone_last4_check
  check (regular_phone_last4 is null or regular_phone_last4 ~ '^[0-9]{4}$');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'reservations_regular_id_fkey'
      and conrelid = 'public.reservations'::regclass
  ) then
    alter table public.reservations
      add constraint reservations_regular_id_fkey
      foreign key (regular_id)
      references public.scheduler_regulars(id)
      on delete set null;
  end if;
end;
$$;

create or replace function public.validate_reservation_regular_owner()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.regular_id is not null and not exists (
    select 1
    from public.scheduler_regulars
    where id = new.regular_id
      and owner_key = new.owner_key
  ) then
    raise exception 'regular_id must belong to the reservation owner';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_validate_regular_owner on public.reservations;
create trigger reservations_validate_regular_owner
before insert or update of regular_id, owner_key on public.reservations
for each row
execute function public.validate_reservation_regular_owner();

drop trigger if exists scheduler_regulars_set_updated_at on public.scheduler_regulars;
create trigger scheduler_regulars_set_updated_at
before update on public.scheduler_regulars
for each row
execute function public.set_updated_at();

alter table public.scheduler_regulars enable row level security;

drop policy if exists "Scheduler regulars owner-only authenticated access" on public.scheduler_regulars;
create policy "Scheduler regulars owner-only authenticated access"
  on public.scheduler_regulars
  for all
  to authenticated
  using ((select auth.uid())::text = owner_key)
  with check ((select auth.uid())::text = owner_key);

revoke all on table public.scheduler_regulars from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.scheduler_regulars to authenticated;
grant select, insert, update, delete on table public.scheduler_regulars to service_role;

revoke execute on function public.validate_reservation_regular_owner() from public, anon, authenticated;

commit;
