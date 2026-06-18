-- Міграція: додає підтримку архіву книг (рейтинг, рецензія, дата архівації)
-- та збереження вибраної теми між сесіями. Виконати в Supabase SQL Editor
-- ОДИН РАЗ, якщо база вже існує.

alter table books add column if not exists rating int;
alter table books add column if not exists review text default '';
alter table books add column if not exists archived_at timestamptz;

create table if not exists user_settings (
  user_id text primary key,
  theme text default 'parchment',
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

drop policy if exists "users manage own settings" on user_settings;

create policy "users manage own settings"
  on user_settings for all
  using (true)
  with check (true);
