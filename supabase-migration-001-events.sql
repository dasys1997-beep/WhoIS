-- Міграція: додає поле "events" (події персонажа) до вже існуючої таблиці.
-- Виконати в Supabase SQL Editor ОДИН РАЗ, якщо твоя база вже була створена
-- раніше за основною схемою (supabase-schema.sql) без цього поля.

alter table characters add column if not exists events text default '';
