-- Add owner_key to reservations for multi-device sync
alter table public.reservations
add column if not exists owner_key text;

-- Index to quickly find a user's reservations
create index if not exists reservations_owner_key_idx on public.reservations (owner_key);

-- Composite index for the common "find my reservations by date" query
create index if not exists reservations_owner_date_idx on public.reservations (owner_key, reservation_date);
