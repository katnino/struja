-- User-specific settings (API keys, preferences).
-- One row per user, RLS-enforced like other tables.
create table if not exists public.user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  ai_api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_owner_select" on public.user_settings
  for select using (auth.uid() = user_id);
create policy "user_settings_owner_insert" on public.user_settings
  for insert with check (auth.uid() = user_id);
create policy "user_settings_owner_update" on public.user_settings
  for update using (auth.uid() = user_id);
create policy "user_settings_owner_delete" on public.user_settings
  for delete using (auth.uid() = user_id);
