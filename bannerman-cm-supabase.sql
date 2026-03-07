-- Bannerman Content Machine autonomous queue schema

create table if not exists public.cm_tasks (
  task_id text primary key,
  date date not null,
  scheduled_at timestamptz not null,
  platform text not null,
  content_type text not null,
  generator_type text not null,
  week integer not null check (week between 1 and 52),
  status text not null default 'pending' check (status in ('pending','generating','ready','posted','failed')),
  content jsonb,
  generated_at timestamptz,
  posted_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cm_tasks_status_scheduled_idx on public.cm_tasks (status, scheduled_at);
create index if not exists cm_tasks_date_idx on public.cm_tasks (date);

create or replace function public.cm_tasks_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cm_tasks_updated_at on public.cm_tasks;
create trigger cm_tasks_updated_at
before update on public.cm_tasks
for each row execute function public.cm_tasks_set_updated_at();
