create table if not exists public.saju_report_evaluations (
    id uuid primary key default gen_random_uuid(),
    report_id uuid references public.saju_fortune_reports(id) on delete cascade unique,
    report_date date,
    overall_grade text,
    issues jsonb not null default '[]'::jsonb,
    repeat_axis jsonb not null default '{}'::jsonb,
    codex_prompt text,
    retrieved_chunks jsonb not null default '[]'::jsonb,
    warning text,
    model_name text,
    evaluated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_saju_report_evaluations_report_id on public.saju_report_evaluations(report_id);
create index if not exists idx_saju_report_evaluations_report_date on public.saju_report_evaluations(report_date);
create index if not exists idx_saju_report_evaluations_overall_grade on public.saju_report_evaluations(overall_grade);
create index if not exists idx_saju_report_evaluations_evaluated_at on public.saju_report_evaluations(evaluated_at desc);
create index if not exists idx_saju_report_evaluations_created_at on public.saju_report_evaluations(created_at desc);

create table if not exists public.saju_evaluation_batches (
    id uuid primary key default gen_random_uuid(),
    batch_date date,
    report_ids uuid[] not null,
    evaluation_ids uuid[] not null,
    summary jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_saju_evaluation_batches_batch_date on public.saju_evaluation_batches(batch_date);
create index if not exists idx_saju_evaluation_batches_created_at on public.saju_evaluation_batches(created_at desc);

-- RLS Settings (Service Role only for MVP)
alter table public.saju_report_evaluations enable row level security;
alter table public.saju_evaluation_batches enable row level security;
