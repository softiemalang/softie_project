-- Public callers must use the bounded daily-snapshot projection. The natal
-- snapshot contains the full derived chart and is not a public contract.
drop policy if exists "Saju natal snapshots public select for public profile" on public.saju_natal_snapshots;
revoke select on table public.saju_natal_snapshots from public, anon;
