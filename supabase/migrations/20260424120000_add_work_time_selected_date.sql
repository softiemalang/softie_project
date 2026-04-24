alter table if exists public.push_subscriptions
  add column if not exists work_time_selected_date date;

update public.push_subscriptions
set
  work_time_enabled = false,
  work_time_start_hour = null,
  work_time_end_hour = null,
  work_time_selected_date = null,
  updated_at = now()
where work_time_enabled = true
  and work_time_selected_date is null;

alter table if exists public.push_subscriptions
  drop constraint if exists push_subscriptions_work_time_requires_date_check,
  drop constraint if exists push_subscriptions_work_time_range_check;

alter table if exists public.push_subscriptions
  add constraint push_subscriptions_work_time_range_check
    check (
      (
        work_time_enabled = false
        and work_time_start_hour is null
        and work_time_end_hour is null
        and work_time_selected_date is null
      )
      or (
        work_time_enabled = true
        and work_time_start_hour is not null
        and work_time_end_hour is not null
        and work_time_selected_date is not null
        and work_time_end_hour >= work_time_start_hour
      )
    );
