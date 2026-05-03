revoke all on table public.saju_report_evaluations from anon;
grant select on table public.saju_report_evaluations to authenticated;

drop policy if exists "Authenticated users can read saju report evaluations" on public.saju_report_evaluations;

create policy "Authenticated users can read saju report evaluations"
  on public.saju_report_evaluations
  for select
  to authenticated
  using (true);
