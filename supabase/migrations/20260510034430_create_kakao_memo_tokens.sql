create table if not exists public.kakao_memo_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kakao_user_id bigint,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  refresh_token_expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kakao_memo_tokens enable row level security;

create index if not exists kakao_memo_tokens_expires_at_idx
  on public.kakao_memo_tokens (expires_at);

create or replace function public.set_kakao_memo_tokens_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_kakao_memo_tokens_updated_at on public.kakao_memo_tokens;
create trigger set_kakao_memo_tokens_updated_at
before update on public.kakao_memo_tokens
for each row
execute function public.set_kakao_memo_tokens_updated_at();
