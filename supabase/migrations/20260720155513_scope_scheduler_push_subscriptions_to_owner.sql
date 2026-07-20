begin;

alter table public.push_subscriptions
  add column if not exists owner_key text;

-- Existing scheduler data currently belongs to a single authenticated owner.
-- Preserve those device subscriptions while moving to owner-scoped delivery.
with sole_owner as (
  select min(owner_key) as owner_key
  from public.reservations
  where owner_key is not null
  having count(distinct owner_key) = 1
)
update public.push_subscriptions
set owner_key = sole_owner.owner_key
from sole_owner
where public.push_subscriptions.owner_key is null;

do $function$
begin
  if exists (
    select 1
    from public.push_subscriptions
    where owner_key is null or btrim(owner_key) = ''
  ) then
    raise exception 'Cannot assign existing push subscriptions to a single scheduler owner';
  end if;
end;
$function$;

alter table public.push_subscriptions
  alter column owner_key set not null;

create index if not exists push_subscriptions_owner_active_idx
  on public.push_subscriptions (owner_key, active, last_seen_at desc);

create index if not exists push_subscriptions_owner_device_active_idx
  on public.push_subscriptions (owner_key, device_id, active, last_seen_at desc);

commit;
