import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTelegramUserId } from './telegram';

// Цей хук зберігає той самий "інтерфейс" що раніше був у App.jsx
// (data.books, data.characters, data.bookNotes + функції addBook/addCharacter/...),
// але тепер кожна дія одразу йде в Supabase, а не тільки в пам'ять браузера.
//
// Якщо Supabase не налаштований (немає змінних середовища) — застосунок
// не ламається, а просто працює в режимі "тільки в цій сесії", як було
// раніше. Це корисно для локальної розробки без бази.

export function useBookData() {
  const [data, setData] = useState({ books: [], characters: [], bookNotes: {} });
  const [theme, setThemeState] = useState(null); // null = ще не завантажено з бази
  const [loading, setLoading] = useState(true);
  const userId = getTelegramUserId();
  const configured = isSupabaseConfigured();

  const reload = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [booksRes, charsRes, notesRes, settingsRes] = await Promise.all([
      supabase.from('books').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('characters').select('*').eq('user_id', userId),
      supabase.from('book_notes').select('*').eq('user_id', userId),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    const books = (booksRes.data || []).map((b) => ({
      id: b.id,
      title: b.title,
      genre: b.genre,
      currentChapter: b.current_chapter,
      totalChapters: b.total_chapters,
      status: b.status,
      rating: b.rating ?? null,
      review: b.review || '',
      archivedAt: b.archived_at ? new Date(b.archived_at).getTime() : null,
      createdAt: new Date(b.created_at).getTime(),
    }));

    const characters = (charsRes.data || []).map((c) => ({
      id: c.id,
      bookId: c.book_id,
      name: c.name,
      role: c.role,
      description: c.description || '',
      events: c.events || '',
      tags: c.tags || [],
      freeNote: c.free_note || '',
      mentionCount: c.mention_count || 0,
      isActive: c.is_active !== false, // за замовчуванням true, якщо null/undefined
      createdAt: new Date(c.created_at).getTime(),
    }));

    const bookNotes = {};
    (notesRes.data || []).forEach((n) => {
      bookNotes[n.book_id] = n.content;
    });

    setData({ books, characters, bookNotes });

    // Якщо в user_settings ще нема рядка (перший запуск) — лишаємо null,
    // App.jsx підставить DEFAULT_THEME сам, не звертаючись до бази зайвий раз.
    if (settingsRes.data?.theme) {
      setThemeState(settingsRes.data.theme);
    }

    setLoading(false);
  }, [userId, configured]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function setTheme(themeKey) {
    setThemeState(themeKey);

    if (!configured) return;

    // upsert: створює рядок при першому виборі теми, оновлює при наступних.
    await supabase
      .from('user_settings')
      .upsert({ user_id: userId, theme: themeKey, updated_at: new Date().toISOString() });
  }

  async function addBook(book) {
    if (!configured) {
      const id = 'local-' + Date.now();
      setData((d) => ({
        ...d,
        books: [...d.books, { ...book, id, currentChapter: 0, createdAt: Date.now() }],
      }));
      return id;
    }

    const { data: inserted, error } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        title: book.title,
        genre: book.genre,
        total_chapters: book.totalChapters || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Помилка додавання книги:', error);
      return null;
    }

    await reload();
    return inserted.id;
  }

  async function updateBook(bookId, patch) {
    if (!configured) {
      setData((d) => ({
        ...d,
        books: d.books.map((b) => (b.id === bookId ? { ...b, ...patch } : b)),
      }));
      return;
    }

    const dbPatch = {};
    if ('currentChapter' in patch) dbPatch.current_chapter = patch.currentChapter;
    if ('totalChapters' in patch) dbPatch.total_chapters = patch.totalChapters;
    if ('status' in patch) dbPatch.status = patch.status;
    if ('title' in patch) dbPatch.title = patch.title;
    if ('genre' in patch) dbPatch.genre = patch.genre;
    if ('rating' in patch) dbPatch.rating = patch.rating;
    if ('review' in patch) dbPatch.review = patch.review;
    if ('archivedAt' in patch) {
      dbPatch.archived_at = patch.archivedAt ? new Date(patch.archivedAt).toISOString() : null;
    }

    await supabase.from('books').update(dbPatch).eq('id', bookId);
    await reload();
  }

  // Позначає книгу як дочитану: зберігає рейтинг/рецензію і ставить
  // archivedAt — звідси книга переходить зі списку "читаю" в архів.
  async function archiveBook(bookId, { rating, review } = {}) {
    await updateBook(bookId, {
      status: 'finished',
      rating: rating ?? null,
      review: review || '',
      archivedAt: Date.now(),
    });
  }

  // Повертає книгу назад в активне читання (якщо вирішив перечитати).
  async function unarchiveBook(bookId) {
    await updateBook(bookId, { status: 'reading', archivedAt: null });
  }

  async function addCharacter(bookId, character) {
    if (!configured) {
      const id = 'local-' + Date.now();
      setData((d) => ({
        ...d,
        characters: [
          ...d.characters,
          {
            id,
            bookId,
            name: character.name,
            role: character.role,
            description: character.description || '',
            events: character.events || '',
            tags: character.tags || [],
            freeNote: '',
            mentionCount: 0,
            isActive: true,
            createdAt: Date.now(),
          },
        ],
      }));
      return id;
    }

    const { data: inserted, error } = await supabase
      .from('characters')
      .insert({
        book_id: bookId,
        user_id: userId,
        name: character.name,
        role: character.role,
        description: character.description || '',
        events: character.events || '',
        tags: character.tags || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Помилка додавання персонажа:', error);
      return null;
    }

    await reload();
    return inserted.id;
  }

  async function updateCharacter(charId, patch) {
    if (!configured) {
      setData((d) => ({
        ...d,
        characters: d.characters.map((c) => (c.id === charId ? { ...c, ...patch } : c)),
      }));
      return;
    }

    const dbPatch = {};
    if ('description' in patch) dbPatch.description = patch.description;
    if ('events' in patch) dbPatch.events = patch.events;
    if ('freeNote' in patch) dbPatch.free_note = patch.freeNote;
    if ('role' in patch) dbPatch.role = patch.role;
    if ('tags' in patch) dbPatch.tags = patch.tags;
    if ('name' in patch) dbPatch.name = patch.name;
    if ('mentionCount' in patch) dbPatch.mention_count = patch.mentionCount;
    if ('isActive' in patch) dbPatch.is_active = patch.isActive;

    await supabase.from('characters').update(dbPatch).eq('id', charId);
    await reload();
  }

  async function appendToCharacter(charId, text, field = 'description') {
    const current = data.characters.find((c) => c.id === charId);
    const existingValue = current?.[field] || '';
    const updatedValue = existingValue ? existingValue + '\n\n' + text : text;
    await updateCharacter(charId, { [field]: updatedValue });
  }

  // Викликається кожного разу коли користувач відкриває картку персонажа —
  // лічильник "скільки разів я сюди заходив" як непрямий індикатор того,
  // наскільки часто персонаж зринає в історії.
  async function incrementMention(charId) {
    const current = data.characters.find((c) => c.id === charId);
    if (!current) return;
    const newCount = (current.mentionCount || 0) + 1;

    // Локальне оновлення без повного reload — це гаряча дія при кожному
    // відкритті картки, зайвий round-trip до бази тут не потрібен.
    setData((d) => ({
      ...d,
      characters: d.characters.map((c) => (c.id === charId ? { ...c, mentionCount: newCount } : c)),
    }));

    if (configured) {
      await supabase.from('characters').update({ mention_count: newCount }).eq('id', charId);
    }
  }

  async function toggleActive(charId) {
    const current = data.characters.find((c) => c.id === charId);
    if (!current) return;
    await updateCharacter(charId, { isActive: !current.isActive });
  }

  async function deleteBook(bookId) {
    if (!configured) {
      setData((d) => ({
        ...d,
        books: d.books.filter((b) => b.id !== bookId),
        characters: d.characters.filter((c) => c.bookId !== bookId),
      }));
      return;
    }

    // characters і book_notes мають "on delete cascade" у схемі —
    // видалення книги автоматично прибирає її персонажів і нотатки.
    await supabase.from('books').delete().eq('id', bookId);
    await reload();
  }

  async function deleteCharacter(charId) {
    if (!configured) {
      setData((d) => ({
        ...d,
        characters: d.characters.filter((c) => c.id !== charId),
      }));
      return;
    }

    await supabase.from('characters').delete().eq('id', charId);
    await reload();
  }

  async function setBookNote(bookId, text) {
    if (!configured) {
      setData((d) => ({ ...d, bookNotes: { ...d.bookNotes, [bookId]: text } }));
      return;
    }

    await supabase
      .from('book_notes')
      .upsert({ book_id: bookId, user_id: userId, content: text, updated_at: new Date().toISOString() });

    await reload();
  }

  return {
    data,
    loading,
    configured,
    theme,
    setTheme,
    addBook,
    updateBook,
    deleteBook,
    archiveBook,
    unarchiveBook,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    appendToCharacter,
    incrementMention,
    toggleActive,
    setBookNote,
  };
}
