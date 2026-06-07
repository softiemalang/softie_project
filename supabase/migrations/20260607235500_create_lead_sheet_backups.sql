-- Create lead_sheet_backups table for cloud backup and restore of lead sheet data
create table public.lead_sheet_backups (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null unique references auth.users(id) on delete cascade,
    data jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.lead_sheet_backups enable row level security;

-- Create RLS Policies for authenticated users
create policy "Users can select their own lead sheet backup"
on public.lead_sheet_backups
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own lead sheet backup"
on public.lead_sheet_backups
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own lead sheet backup"
on public.lead_sheet_backups
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own lead sheet backup"
on public.lead_sheet_backups
for delete
to authenticated
using (auth.uid() = user_id);

-- Create function and trigger to automatically update updated_at timestamp
create or replace function public.handle_lead_sheet_backups_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger trigger_lead_sheet_backups_updated_at
    before update on public.lead_sheet_backups
    for each row
    execute function public.handle_lead_sheet_backups_updated_at();
