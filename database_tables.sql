-- New tables for Outscraper database integration

-- Table to store user databases
create table public.user_databases (
  id uuid not null default extensions.uuid_generate_v4(),
  user_id uuid not null,
  name text not null,
  search_query text not null,
  location text null,
  limit_count integer not null default 20,
  language text not null default 'en',
  status text not null default 'pending',
  request_id text null,
  tags text[] null,
  statistics jsonb null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint user_databases_pkey primary key (id),
  constraint user_databases_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Table to store database entries (places data)
create table public.database_entries (
  id uuid not null default extensions.uuid_generate_v4(),
  database_id uuid not null,
  place_data jsonb not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint database_entries_pkey primary key (id),
  constraint database_entries_database_id_fkey foreign key (database_id) references public.user_databases (id) on delete cascade
) tablespace pg_default;

-- Enable RLS on the new tables
alter table public.user_databases enable row level security;
alter table public.database_entries enable row level security;

-- User databases policies
create policy "Users can read their own databases" on public.user_databases
  for select using (auth.uid() = user_id);

create policy "Users can update their own databases" on public.user_databases
  for update using (auth.uid() = user_id);

create policy "Users can insert their own databases" on public.user_databases
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own databases" on public.user_databases
  for delete using (auth.uid() = user_id);

create policy "Service role full access to user databases" on public.user_databases
  for all to service_role using (true);

-- Database entries policies
create policy "Users can read their own database entries" on public.database_entries
  for select using (
    exists (
      select 1 from public.user_databases
      where id = database_entries.database_id and user_id = auth.uid()
    )
  );

create policy "Users can update their own database entries" on public.database_entries
  for update using (
    exists (
      select 1 from public.user_databases
      where id = database_entries.database_id and user_id = auth.uid()
    )
  );

create policy "Users can insert their own database entries" on public.database_entries
  for insert with check (
    exists (
      select 1 from public.user_databases
      where id = database_entries.database_id and user_id = auth.uid()
    )
  );

create policy "Users can delete their own database entries" on public.database_entries
  for delete using (
    exists (
      select 1 from public.user_databases
      where id = database_entries.database_id and user_id = auth.uid()
    )
  );

create policy "Service role full access to database entries" on public.database_entries
  for all to service_role using (true); 