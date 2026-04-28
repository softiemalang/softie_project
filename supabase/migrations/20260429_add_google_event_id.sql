alter table public.reservations
add column if not exists google_event_id text;
