begin;

alter table public.project_brain_threads
  alter column user_id set not null;

alter table public.project_brain_threads
  add constraint project_brain_threads_owner_matches_user_check
  check (owner_key = user_id::text);

alter table public.project_brain_threads enable row level security;
alter table public.project_brain_messages enable row level security;

-- Project Brain is accessed only through its authenticated Edge Function.
-- Keep the underlying tables unavailable through the public Data API roles.
revoke all privileges on table public.project_brain_threads
  from public, anon, authenticated;
revoke all privileges on table public.project_brain_messages
  from public, anon, authenticated;

grant select, insert, update, delete on table public.project_brain_threads
  to service_role;
grant select, insert, update, delete on table public.project_brain_messages
  to service_role;

commit;
