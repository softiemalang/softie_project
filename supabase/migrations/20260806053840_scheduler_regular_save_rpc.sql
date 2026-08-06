-- Local follow-up migration for the atomic regular-selection save path.
-- Apply remotely only through the approved Supabase migration workflow.
create or replace function public.save_scheduler_reservation_with_regular(
  p_reservation_id uuid,
  p_reservation_date date,
  p_branch text,
  p_room text,
  p_customer_name text,
  p_start_at timestamptz,
  p_duration_minutes integer,
  p_end_at timestamptz,
  p_warning_offset_minutes integer,
  p_tags text[],
  p_regular_phone_last4 text,
  p_notes_text text
)
returns public.reservations
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_owner_key text := (select auth.uid())::text;
  v_name_key text;
  v_regular_id uuid;
  v_saved public.reservations%rowtype;
begin
  if v_owner_key is null then
    raise exception 'Authentication required';
  end if;

  if p_customer_name is null or btrim(p_customer_name) = '' then
    raise exception 'customer_name is required';
  end if;

  if p_regular_phone_last4 is null or p_regular_phone_last4 !~ '^[0-9]{4}$' then
    raise exception 'regular_phone_last4 must contain exactly four ASCII digits';
  end if;

  if not (coalesce(p_tags, '{}'::text[]) @> array['other']::text[]) then
    raise exception 'regular save requires the other tag';
  end if;

  v_name_key := public.normalize_scheduler_regular_name(p_customer_name);

  select id
    into v_regular_id
    from public.scheduler_regulars
   where owner_key = v_owner_key
     and name_key = v_name_key
     and phone_last4 = p_regular_phone_last4
   order by is_active desc, created_at asc, id asc
   limit 1
   for update;

  if v_regular_id is null then
    begin
      insert into public.scheduler_regulars (
        owner_key,
        display_name,
        name_key,
        phone_last4,
        is_active,
        memo
      ) values (
        v_owner_key,
        btrim(p_customer_name),
        v_name_key,
        p_regular_phone_last4,
        true,
        ''
      )
      returning id into v_regular_id;
    exception when unique_violation then
      select id
        into v_regular_id
        from public.scheduler_regulars
       where owner_key = v_owner_key
         and name_key = v_name_key
         and phone_last4 = p_regular_phone_last4
         and is_active
       order by created_at asc, id asc
       limit 1
       for update;

      if v_regular_id is null then
        raise;
      end if;
    end;
  else
    update public.scheduler_regulars
       set is_active = true
     where id = v_regular_id
       and owner_key = v_owner_key;
  end if;

  if p_reservation_id is null then
    insert into public.reservations (
      owner_key,
      reservation_date,
      branch,
      room,
      customer_name,
      start_at,
      duration_minutes,
      end_at,
      warning_offset_minutes,
      tags,
      regular_phone_last4,
      regular_id,
      notes_text
    ) values (
      v_owner_key,
      p_reservation_date,
      p_branch,
      p_room,
      btrim(p_customer_name),
      p_start_at,
      p_duration_minutes,
      p_end_at,
      p_warning_offset_minutes,
      coalesce(p_tags, '{}'::text[]),
      p_regular_phone_last4,
      v_regular_id,
      coalesce(p_notes_text, '')
    ) returning * into v_saved;
  else
    update public.reservations
       set reservation_date = p_reservation_date,
           branch = p_branch,
           room = p_room,
           customer_name = btrim(p_customer_name),
           start_at = p_start_at,
           duration_minutes = p_duration_minutes,
           end_at = p_end_at,
           warning_offset_minutes = p_warning_offset_minutes,
           tags = coalesce(p_tags, '{}'::text[]),
           regular_phone_last4 = p_regular_phone_last4,
           regular_id = v_regular_id,
           notes_text = coalesce(p_notes_text, '')
     where id = p_reservation_id
       and owner_key = v_owner_key
    returning * into v_saved;

    if not found then
      raise exception 'Reservation not found or not owned';
    end if;
  end if;

  return v_saved;
end;
$$;

revoke execute on function public.save_scheduler_reservation_with_regular(
  uuid, date, text, text, text, timestamptz, integer, timestamptz, integer, text[], text, text
) from public, anon;
grant execute on function public.save_scheduler_reservation_with_regular(
  uuid, date, text, text, text, timestamptz, integer, timestamptz, integer, text[], text, text
) to authenticated;
