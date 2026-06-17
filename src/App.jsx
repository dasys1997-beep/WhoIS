import { useState, useEffect } from 'react';
import { THEMES, DEFAULT_THEME, applyTheme } from './themes';
import { createInitialData } from './initialData';
import BooksScreen from './components/BooksScreen';
import CharactersScreen from './components/CharactersScreen';
import CharacterDetailScreen from './components/CharacterDetailScreen';
import AddCharacterScreen from './components/AddCharacterScreen';
import BookNotesScreen from './components/BookNotesScreen';
import SettingsScreen from './components/SettingsScreen';
import AddBookScreen from './components/AddBookScreen';
import BottomNav from './components/BottomNav';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [data, setData] = useState(createInitialData);
  const [screen, setScreen] = useState({ name: 'books' });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function navigate(name, params = {}) {
    setScreen({ name, ...params });
  }

  function addBook(book) {
    const id = 'b' + Date.now();
    setData((d) => ({
      ...d,
      books: [
        ...d.books,
        {
          ...book,
          id,
          currentChapter: 0,
          totalChapters: book.totalChapters || 0,
          status: 'reading',
          createdAt: Date.now(),
        },
      ],
    }));
    navigate('characters', { bookId: id });
  }

  function updateBook(bookId, patch) {
    setData((d) => ({
      ...d,
      books: d.books.map((b) => (b.id === bookId ? { ...b, ...patch } : b)),
    }));
  }

  function addCharacter(bookId, character) {
    const id = 'c' + Date.now();
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
          events: [],
          freeNote: '',
          createdAt: Date.now(),
        },
      ],
    }));
    return id;
  }

  function updateCharacter(charId, patch) {
    setData((d) => ({
      ...d,
      characters: d.characters.map((c) => (c.id === charId ? { ...c, ...patch } : c)),
    }));
  }

  function appendToCharacter(charId, text) {
    setData((d) => ({
      ...d,
      characters: d.characters.map((c) =>
        c.id === charId
          ? { ...c, description: c.description ? c.description + '\n\n' + text : text }
          : c
      ),
    }));
  }

  function setBookNote(bookId, text) {
    setData((d) => ({ ...d, bookNotes: { ...d.bookNotes, [bookId]: text } }));
  }

  const currentBook = data.books.find((b) => b.id === screen.bookId);
  const currentChar = data.characters.find((c) => c.id === screen.charId);

  return (
    <div className="app-shell">
      <div className="phone-frame">
        {screen.name === 'books' && (
          <BooksScreen
            books={data.books}
            onOpenBook={(bookId) => navigate('characters', { bookId })}
            onAddBook={() => navigate('addBook')}
            onSettings={() => navigate('settings')}
          />
        )}

        {screen.name === 'addBook' && (
          <AddBookScreen onBack={() => navigate('books')} onSave={addBook} />
        )}

        {screen.name === 'characters' && currentBook && (
          <CharactersScreen
            book={currentBook}
            characters={data.characters.filter((c) => c.bookId === currentBook.id)}
            onBack={() => navigate('books')}
            onOpenChar={(charId) => navigate('charDetail', { bookId: currentBook.id, charId })}
            onAddChar={() => navigate('addChar', { bookId: currentBook.id })}
            onOpenNotes={() => navigate('bookNotes', { bookId: currentBook.id })}
          />
        )}

        {screen.name === 'addChar' && currentBook && (
          <AddCharacterScreen
            book={currentBook}
            existingCharacters={data.characters.filter((c) => c.bookId === currentBook.id)}
            onBack={() => navigate('characters', { bookId: currentBook.id })}
            onCreate={(character) => {
              addCharacter(currentBook.id, character);
              navigate('characters', { bookId: currentBook.id });
            }}
            onAppendExisting={(charId, text) => {
              appendToCharacter(charId, text);
              navigate('charDetail', { bookId: currentBook.id, charId });
            }}
          />
        )}

        {screen.name === 'charDetail' && currentChar && (
          <CharacterDetailScreen
            character={currentChar}
            book={currentBook}
            onBack={() => navigate('characters', { bookId: currentChar.bookId })}
            onUpdate={(patch) => updateCharacter(currentChar.id, patch)}
          />
        )}

        {screen.name === 'bookNotes' && currentBook && (
          <BookNotesScreen
            book={currentBook}
            note={data.bookNotes[currentBook.id] || ''}
            onBack={() => navigate('characters', { bookId: currentBook.id })}
            onSave={(text) => setBookNote(currentBook.id, text)}
            onUpdateProgress={(chapter) => updateBook(currentBook.id, { currentChapter: chapter })}
          />
        )}

        {screen.name === 'settings' && (
          <SettingsScreen
            theme={theme}
            themes={THEMES}
            onSetTheme={setTheme}
            onBack={() => navigate('books')}
          />
        )}

        <BottomNav active={screen.name} onNavigate={navigate} />
      </div>
    </div>
  );
}
