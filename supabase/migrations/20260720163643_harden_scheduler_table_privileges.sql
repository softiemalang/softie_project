begin;

-- Keep scheduler data reachable only through the roles that actually use it.
-- RLS continues to enforce per-user ownership for authenticated clients.
revoke all privileges on table public.reservations
  from public, anon, authenticated, service_role;
revoke all privileges on table public.work_events
  from public, anon, authenticated, service_role;
revoke all privileges on table public.scheduler_work_logs
  from public, anon, authenticated, service_role;
revoke all privileges on table public.push_subscriptions
  from public, anon, authenticated, service_role;
revoke all privileges on table public.push_reminders
  from public, anon, authenticated, service_role;
revoke all privileges on table public.google_calendar_tokens
  from public, anon, authenticated, service_role;
revoke all privileges on table public.google_oauth_states
  from public, anon, authenticated, service_role;

-- The signed-in scheduler UI reads and writes only these three tables.
grant select, insert, update, delete on table public.reservations
  to authenticated;
grant select, insert, update, delete on table public.work_events
  to authenticated;
grant select, insert, update, delete on table public.scheduler_work_logs
  to authenticated;

-- Edge Functions use the service role for scheduler-internal state and OAuth.
grant select, insert, update, delete on table public.reservations
  to service_role;
grant select, insert, update, delete on table public.work_events
  to service_role;
grant select, insert, update, delete on table public.scheduler_work_logs
  to service_role;
grant select, insert, update, delete on table public.push_subscriptions
  to service_role;
grant select, insert, update, delete on table public.push_reminders
  to service_role;
grant select, insert, update, delete on table public.google_calendar_tokens
  to service_role;
grant select, insert, update, delete on table public.google_oauth_states
  to service_role;

commit;
