create table if not exists public.saju_knowledge_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid null,
  target_date date null,
  source text not null default 'manual-test',
  computed_data jsonb null,
  extracted_tags jsonb not null default '[]'::jsonb,
  retrieval_queries jsonb not null default '[]'::jsonb,
  retrieved_chunks jsonb not null default '[]'::jsonb,
  final_answer text null,
  model_name text null,
  warning text null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.saju_knowledge_feedback (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.saju_knowledge_runs(id) on delete cascade,
  rating int null,
  notes text null,
  accepted_sections jsonb not null default '[]'::jsonb,
  rejected_sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saju_interpretation_rules (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  tags jsonb not null default '[]'::jsonb,
  condition_text text null,
  rule_text text not null,
  caution_text text null,
  action_tip text null,
  tone_hint text null,
  source_run_ids jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saju_knowledge_runs_profile_id_target_date_idx
  on public.saju_knowledge_runs(profile_id, target_date);

create index if not exists saju_knowledge_runs_created_at_desc_idx
  on public.saju_knowledge_runs(created_at desc);

create index if not exists saju_knowledge_feedback_run_id_idx
  on public.saju_knowledge_feedback(run_id);

create index if not exists saju_interpretation_rules_section_idx
  on public.saju_interpretation_rules(section);

create index if not exists saju_interpretation_rules_status_idx
  on public.saju_interpretation_rules(status);

alter table public.saju_knowledge_runs enable row level security;
alter table public.saju_knowledge_feedback enable row level security;
alter table public.saju_interpretation_rules enable row level security;

comment on table public.saju_knowledge_runs is
  'Internal experimental RAG run logs for saju interpretation. Server-side writes only for now; add stricter RLS before any public UI use.';

comment on table public.saju_knowledge_feedback is
  'Internal experimental review feedback for saju RAG runs. Add explicit RLS policies before exposing any user-facing feedback UI.';

comment on table public.saju_interpretation_rules is
  'Draft internal interpretation rules extracted from RAG experiments. Keep server-side only until ownership and review flow are defined.';
