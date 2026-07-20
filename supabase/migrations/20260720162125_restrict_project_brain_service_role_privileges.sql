begin;

revoke all privileges on table public.project_brain_threads
  from service_role;
revoke all privileges on table public.project_brain_messages
  from service_role;

grant select, insert, update, delete on table public.project_brain_threads
  to service_role;
grant select, insert, update, delete on table public.project_brain_messages
  to service_role;

commit;
