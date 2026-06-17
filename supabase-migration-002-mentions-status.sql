-- Міграція: додає лічильник згадувань та статус активності персонажа.
-- Виконати в Supabase SQL Editor ОДИН РАЗ, якщо база вже існує.

alter table characters add column if not exists mention_count int default 0;
alter table characters add column if not exists is_active boolean default true;
