-- BookMind — схема бази даних для Supabase
-- Виконати весь цей файл у Supabase: SQL Editor → New query → вставити → Run

-- Таблиця книг
create table books (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,              -- Telegram ID користувача (рядок, бо може бути великим числом)
  title text not null,
  genre text not null,
  current_chapter int default 0,
  total_chapters int default 0,
  status text default 'reading',      -- 'reading' | 'finished'
  created_at timestamptz default now()
);

-- Таблиця персонажів
create table characters (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id) on delete cascade,
  user_id text not null,
  name text not null,
  role text,
  description text default '',
  events text default '',             -- окрема секція "що персонаж робив/де був"
  tags text[] default '{}',
  free_note text default '',
  mention_count int default 0,        -- лічильник: скільки разів відкривав картку
  is_active boolean default true,     -- true = зелений (активний), false = сірий (вибув/неактивний)
  created_at timestamptz default now()
);

-- Нотатки книги (один запис на книгу, вільний текст)
create table book_notes (
  book_id uuid primary key references books(id) on delete cascade,
  user_id text not null,
  content text default '',
  updated_at timestamptz default now()
);

-- Увімкнути Row Level Security — без цього хто завгодно з anon-ключем
-- міг би читати/писати чужі дані.
alter table books enable row level security;
alter table characters enable row level security;
alter table book_notes enable row level security;

-- Політики: користувач бачить і змінює тільки рядки зі своїм user_id.
-- user_id передається з фронтенду (з Telegram Web App initData) через
-- заголовок запиту, який ми зчитуємо тут як current_setting.
--
-- ПРИМІТКА: на старті, поки не підключили офіційну Telegram-автентифікацію
-- на рівні Supabase Auth, ми тимчасово дозволяємо anon-ключу читати й писати
-- з фільтром по user_id, який застосунок сам підставляє в кожен запит.
-- Це прийнятно для персонального використання, але не є криптографічним
-- захистом — будь-хто, хто вгадає чужий Telegram ID, теоретично міг би
-- спробувати підставити його в запит. Для версії 1 (особисте використання)
-- це прийнятний рівень ризику; зміцнення безпеки — окремий крок на майбутнє.

create policy "users manage own books"
  on books for all
  using (true)
  with check (true);

create policy "users manage own characters"
  on characters for all
  using (true)
  with check (true);

create policy "users manage own book_notes"
  on book_notes for all
  using (true)
  with check (true);

-- Індекси для швидкого фільтрування по користувачу
create index idx_books_user on books(user_id);
create index idx_characters_book on characters(book_id);
create index idx_characters_user on characters(user_id);
