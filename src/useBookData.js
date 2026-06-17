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
  const [loading, setLoading] = useState(true);
  const userId = getTelegramUserId();
  const configured = isSupabaseConfigured();

  const reload = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [booksRes, charsRes, notesRes] = await Promise.all([
      supabase.from('books').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('characters').select('*').eq('user_id', userId),
      supabase.from('book_notes').select('*').eq('user_id', userId),
    ]);

    const books = (booksRes.data || []).map((b) => ({
      id: b.id,
      title: b.title,
      genre: b.genre,
      currentChapter: b.current_chapter,
      totalChapters: b.total_chapters,
      status: b.status,
      createdAt: new Date(b.created_at).getTime(),
    }));

    const characters = (charsRes.data || []).map((c) => ({
      id: c.id,
      bookId: c.book_id,
      name: c.name,
      role: c.role,
      description: c.description || '',
      tags: c.tags || [],
      freeNote: c.free_note || '',
      createdAt: new Date(c.created_at).getTime(),
    }));

    const bookNotes = {};
    (notesRes.data || []).forEach((n) => {
      bookNotes[n.book_id] = n.content;
    });

    setData({ books, characters, bookNotes });
    setLoading(false);
  }, [userId, configured]);

  useEffect(() => {
    reload();
  }, [reload]);

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

    await supabase.from('books').update(dbPatch).eq('id', bookId);
    await reload();
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
            tags: character.tags || [],
            freeNote: '',
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
    if ('freeNote' in patch) dbPatch.free_note = patch.freeNote;
    if ('role' in patch) dbPatch.role = patch.role;
    if ('tags' in patch) dbPatch.tags = patch.tags;
    if ('name' in patch) dbPatch.name = patch.name;

    await supabase.from('characters').update(dbPatch).eq('id', charId);
    await reload();
  }

  async function appendToCharacter(charId, text) {
    const current = data.characters.find((c) => c.id === charId);
    const newDescription = current?.description ? current.description + '\n\n' + text : text;
    await updateCharacter(charId, { description: newDescription });
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
    addBook,
    updateBook,
    addCharacter,
    updateCharacter,
    appendToCharacter,
    setBookNote,
  };
}
