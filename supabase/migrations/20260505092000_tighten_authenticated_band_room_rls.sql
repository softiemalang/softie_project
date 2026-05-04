create or replace function public.is_band_room_owner(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.owner_user_id = auth.uid()
  );
$$;

create or replace function public.is_band_room_member(target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.room_id = target_room_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.owns_band_member(target_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.id = target_member_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.owns_band_member_in_room(target_member_id uuid, target_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.id = target_member_id
      and m.room_id = target_room_id
      and m.user_id = auth.uid()
  );
$$;

grant execute on function public.is_band_room_owner(uuid) to authenticated;
grant execute on function public.is_band_room_member(uuid) to authenticated;
grant execute on function public.owns_band_member(uuid) to authenticated;
grant execute on function public.owns_band_member_in_room(uuid, uuid) to authenticated;

drop policy if exists "rooms authenticated read" on public.rooms;
drop policy if exists "rooms authenticated insert" on public.rooms;
drop policy if exists "rooms authenticated update" on public.rooms;
drop policy if exists "rooms authenticated delete" on public.rooms;

drop policy if exists "members authenticated read" on public.members;
drop policy if exists "members authenticated insert" on public.members;
drop policy if exists "members authenticated update" on public.members;
drop policy if exists "members authenticated delete" on public.members;

drop policy if exists "availabilities authenticated read" on public.availabilities;
drop policy if exists "availabilities authenticated insert" on public.availabilities;
drop policy if exists "availabilities authenticated update" on public.availabilities;
drop policy if exists "availabilities authenticated delete" on public.availabilities;

create policy "rooms authenticated read" on public.rooms
  for select to authenticated
  using (true);

create policy "rooms authenticated insert own" on public.rooms
  for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "rooms authenticated update owner" on public.rooms
  for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "rooms authenticated delete owner" on public.rooms
  for delete to authenticated
  using (owner_user_id = auth.uid());

create policy "members authenticated read room participants" on public.members
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_band_room_owner(room_id)
    or public.is_band_room_member(room_id)
  );

create policy "members authenticated insert self" on public.members
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "members authenticated update self" on public.members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "members authenticated delete self or owner" on public.members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.is_band_room_owner(room_id)
  );

create policy "availabilities authenticated read room participants" on public.availabilities
  for select to authenticated
  using (
    public.is_band_room_owner(room_id)
    or public.is_band_room_member(room_id)
  );

create policy "availabilities authenticated insert self" on public.availabilities
  for insert to authenticated
  with check (
    public.owns_band_member_in_room(member_id, room_id)
  );

create policy "availabilities authenticated update self" on public.availabilities
  for update to authenticated
  using (
    public.owns_band_member(member_id)
  )
  with check (
    public.owns_band_member_in_room(member_id, room_id)
  );

create policy "availabilities authenticated delete self or owner" on public.availabilities
  for delete to authenticated
  using (
    public.owns_band_member(member_id)
    or public.is_band_room_owner(room_id)
  );
