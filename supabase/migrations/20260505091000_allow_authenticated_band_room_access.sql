do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rooms' and policyname = 'rooms authenticated read'
  ) then
    create policy "rooms authenticated read" on public.rooms
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rooms' and policyname = 'rooms authenticated insert'
  ) then
    create policy "rooms authenticated insert" on public.rooms
      for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rooms' and policyname = 'rooms authenticated update'
  ) then
    create policy "rooms authenticated update" on public.rooms
      for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rooms' and policyname = 'rooms authenticated delete'
  ) then
    create policy "rooms authenticated delete" on public.rooms
      for delete to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'members' and policyname = 'members authenticated read'
  ) then
    create policy "members authenticated read" on public.members
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'members' and policyname = 'members authenticated insert'
  ) then
    create policy "members authenticated insert" on public.members
      for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'members' and policyname = 'members authenticated update'
  ) then
    create policy "members authenticated update" on public.members
      for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'members' and policyname = 'members authenticated delete'
  ) then
    create policy "members authenticated delete" on public.members
      for delete to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'availabilities' and policyname = 'availabilities authenticated read'
  ) then
    create policy "availabilities authenticated read" on public.availabilities
      for select to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'availabilities' and policyname = 'availabilities authenticated insert'
  ) then
    create policy "availabilities authenticated insert" on public.availabilities
      for insert to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'availabilities' and policyname = 'availabilities authenticated update'
  ) then
    create policy "availabilities authenticated update" on public.availabilities
      for update to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'availabilities' and policyname = 'availabilities authenticated delete'
  ) then
    create policy "availabilities authenticated delete" on public.availabilities
      for delete to authenticated using (true);
  end if;
end $$;
