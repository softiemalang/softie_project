begin;

-- Preserve the subscription row for diagnostics, but stop retrying an endpoint
-- that has been unused for at least 60 days and already produced an error.
-- A returning device is reactivated by the normal subscription registration flow.
update public.push_subscriptions
set
  active = false,
  updated_at = timezone('utc', now())
where active = true
  and last_error_at is not null
  and last_error_message is not null
  and last_seen_at < timezone('utc', now()) - interval '60 days';

commit;
