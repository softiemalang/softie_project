alter table public.rooms
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.members
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists rooms_owner_user_id_idx
  on public.rooms(owner_user_id);

create index if not exists members_user_id_idx
  on public.members(user_id);

create index if not exists members_room_id_user_id_idx
  on public.members(room_id, user_id);

create unique index if not exists members_room_user_unique_idx
  on public.members(room_id, user_id)
  where user_id is not null;
