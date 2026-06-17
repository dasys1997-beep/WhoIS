# BookMind

Telegram Mini App для читачів детективів та інших книг з великою кількістю персонажів.

## Версія 1.1 — що реалізовано

- Список книг з групуванням по жанрах
- Персонажі книги з ролями
- Швидкий запис персонажа, додавання до існуючого
- Нотатки книги та персонажа, прогрес читання
- 4 теми оформлення
- **Дані зберігаються в Supabase — не зникають при закритті застосунку**
- **Фото сторінки → Gemini AI розпізнає текст → пропонує опис для підтвердження**

## Налаштування Supabase (зберігання даних)

1. supabase.com → New Project
2. У **SQL Editor** виконати весь вміст файлу `supabase-schema.sql` з цього репозиторію
3. **Settings → API** → скопіювати **Project URL** і **anon public key**
4. На Vercel: **Project Settings → Environment Variables**, додати:
   - `VITE_SUPABASE_URL` = твій Project URL
   - `VITE_SUPABASE_ANON_KEY` = твій anon key
5. Redeploy проекту на Vercel, щоб змінні підхопились

## Налаштування Gemini (AI-розпізнавання фото)

1. ai.google.dev → Get API key → Create API key (безкоштовний тариф, без картки)
2. На Vercel: **Project Settings → Environment Variables**, додати:
   - `GEMINI_API_KEY` = твій ключ (без префіксу VITE_ — цей ключ має лишатись тільки на сервері)
3. Redeploy

## Запуск локально

```bash
npm install
npm run dev
```

Для локального тестування з Supabase і Gemini створи файл `.env` (скопіювавши `.env.example`) і встав свої значення — Vite автоматично підхопить його.

## Деплой на Vercel

Push у GitHub → Vercel автоматично передеплоює. Після першого додавання Environment Variables потрібен один ручний Redeploy, далі все автоматично.

## Підключення до Telegram бота

@BotFather → `/mybots` → бот → **Bot Settings** → **Menu Button** → вставити URL з Vercel.

## Технічний стек

- React 19 + Vite (фронтенд)
- Supabase (база даних)
- Gemini API через Vercel Serverless Function (`/api/recognize-character.js`) — розпізнавання фото
- Іконки: Tabler Icons, шрифти: Spectral + Inter

## Що далі (версія 2)

- Карта зв'язків між персонажами
- Архів прочитаних книг з рецензіями та зірками
- Друзі та коментарі
- Бічне меню жанрових фіч (Дошка підозр, Карта напруги тощо)
