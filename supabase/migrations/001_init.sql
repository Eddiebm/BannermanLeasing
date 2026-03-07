-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Content items table
create table if not exists content_items (
  id          uuid        primary key default gen_random_uuid(),
  date        date        not null,
  platform    text        not null
                check (platform in ('blog','instagram','tiktok','linkedin','twitter','facebook_ad','google_ad')),
  topic       text,
  brief       text,
  status      text        not null default 'pending'
                check (status in ('pending','generated','approved','exported')),
  content     jsonb,
  model       text        check (model in ('claude','gpt4','gemini')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Indexes
create index if not exists content_items_date_idx   on content_items (date);
create index if not exists content_items_status_idx on content_items (status);

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists content_items_updated_at on content_items;
create trigger content_items_updated_at
  before update on content_items
  for each row execute function set_updated_at();

-- Row-level security (enable and add a permissive anon policy)
alter table content_items enable row level security;

-- Allow the anon/authenticated role to do everything (tighten per team requirements)
create policy "allow_all" on content_items
  for all using (true) with check (true);
