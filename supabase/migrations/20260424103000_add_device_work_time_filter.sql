alter table if exists public.push_subscriptions
  add column if not exists work_time_enabled boolean not null default false,
  add column if not exists work_time_start_hour smallint,
  add column if not exists work_time_end_hour smallint;

alter table if exists public.push_subscriptions
  drop constraint if exists push_subscriptions_work_time_start_hour_check,
  drop constraint if exists push_subscriptions_work_time_end_hour_check,
  drop constraint if exists push_subscriptions_work_time_range_check;

alter table if exists public.push_subscriptions
  add constraint push_subscriptions_work_time_start_hour_check
    check (work_time_start_hour is null or (work_time_start_hour >= 0 and work_time_start_hour <= 23)),
  add constraint push_subscriptions_work_time_end_hour_check
    check (work_time_end_hour is null or (work_time_end_hour >= 0 and work_time_end_hour <= 23)),
  add constraint push_subscriptions_work_time_range_check
    check (
      (work_time_enabled = false and work_time_start_hour is null and work_time_end_hour is null)
      or (
        work_time_enabled = true
        and work_time_start_hour is not null
        and work_time_end_hour is not null
        and work_time_end_hour >= work_time_start_hour
      )
    );
