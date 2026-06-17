import { useState, useEffect } from 'react';
import { THEMES, DEFAULT_THEME, applyTheme } from './themes';
import { useBookData } from './useBookData';
import { initTelegramApp } from './telegram';
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
  const [screen, setScreen] = useState({ name: 'books' });
  const {
    data,
    loading,
    configured,
    addBook,
    updateBook,
    deleteBook,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    appendToCharacter,
    setBookNote,
  } = useBookData();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    initTelegramApp();
  }, []);

  function navigate(name, params = {}) {
    setScreen({ name, ...params });
  }

  const currentBook = data.books.find((b) => b.id === screen.bookId);
  const currentChar = data.characters.find((c) => c.id === screen.charId);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="phone-frame">
          <div className="screen">
            <div className="body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Завантаження...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        {!configured && (
          <div
            style={{
              background: '#F0C4B8',
              color: '#8B2A1A',
              fontSize: 11,
              padding: '6px 14px',
              textAlign: 'center',
            }}
          >
            База даних не підключена — дані не зберігаються між сесіями
          </div>
        )}

        {screen.name === 'books' && (
          <BooksScreen
            books={data.books}
            onOpenBook={(bookId) => navigate('characters', { bookId })}
            onAddBook={() => navigate('addBook')}
            onSettings={() => navigate('settings')}
            onDeleteBook={async (bookId) => {
              await deleteBook(bookId);
            }}
          />
        )}

        {screen.name === 'addBook' && (
          <AddBookScreen
            onBack={() => navigate('books')}
            onSave={async (book) => {
              const id = await addBook(book);
              if (id) navigate('characters', { bookId: id });
            }}
          />
        )}

        {screen.name === 'characters' && currentBook && (
          <CharactersScreen
            book={currentBook}
            characters={data.characters.filter((c) => c.bookId === currentBook.id)}
            onBack={() => navigate('books')}
            onOpenChar={(charId) => navigate('charDetail', { bookId: currentBook.id, charId })}
            onAddChar={() => navigate('addChar', { bookId: currentBook.id })}
            onOpenNotes={() => navigate('bookNotes', { bookId: currentBook.id })}
            onDeleteChar={async (charId) => {
              await deleteCharacter(charId);
            }}
          />
        )}

        {screen.name === 'addChar' && currentBook && (
          <AddCharacterScreen
            book={currentBook}
            existingCharacters={data.characters.filter((c) => c.bookId === currentBook.id)}
            onBack={() => navigate('characters', { bookId: currentBook.id })}
            onCreate={async (character) => {
              await addCharacter(currentBook.id, character);
              navigate('characters', { bookId: currentBook.id });
            }}
            onAppendExisting={async (charId, text) => {
              await appendToCharacter(charId, text);
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
            onDelete={async () => {
              const bookId = currentChar.bookId;
              await deleteCharacter(currentChar.id);
              navigate('characters', { bookId });
            }}
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
