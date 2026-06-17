import { useState, useMemo } from 'react';
import { GENRES } from '../initialData';

function confirmDelete(message, onConfirm) {
  const tg = window.Telegram?.WebApp;
  if (tg?.showConfirm) {
    tg.showConfirm(message, (ok) => { if (ok) onConfirm(); });
  } else if (window.confirm(message)) {
    onConfirm();
  }
}

const deleteStyle = {
  flexShrink: 0,
  marginLeft: 4,
  padding: '6px',
  background: 'none',
  border: 'none',
  borderRadius: 8,
  color: '#DC2626',
  cursor: 'pointer',
  fontSize: 18,
  display: 'flex',
  alignItems: 'center',
};

export default function BooksScreen({ books, onOpenBook, onAddBook, onSettings, onDeleteBook }) {
  const [activeGenre, setActiveGenre] = useState('all');

  const usedGenres = useMemo(() => {
    const set = new Set(books.map((b) => b.genre));
    return GENRES.filter((g) => set.has(g));
  }, [books]);

  const grouped = useMemo(() => {
    const filtered = activeGenre === 'all' ? books : books.filter((b) => b.genre === activeGenre);
    const byGenre = {};
    filtered.forEach((b) => {
      if (!byGenre[b.genre]) byGenre[b.genre] = [];
      byGenre[b.genre].push(b);
    });
    return byGenre;
  }, [books, activeGenre]);

  const spineColors = ['#C8A97E', '#A07850', '#5DCAA5', '#9F7DD1', '#D4956A', '#7B8FE8'];

  function handleDelete(e, book) {
    e.stopPropagation();
    confirmDelete(`Видалити книгу "${book.title}"?\nУсі персонажі та нотатки зникнуть.`, () => {
      if (onDeleteBook) onDeleteBook(book.id);
    });
  }

  return (
    <div className="screen">
      <div className="topbar">
        <span className="topbar-title">Мої книги</span>
        <button className="icon-btn" onClick={onSettings} aria-label="Налаштування">
          <i className="ti ti-settings" aria-hidden="true"></i>
        </button>
      </div>

      <div className="tabs">
        <button
          className={'tab' + (activeGenre === 'all' ? ' on' : '')}
          onClick={() => setActiveGenre('all')}
        >
          Всі
        </button>
        {usedGenres.map((g) => (
          <button
            key={g}
            className={'tab' + (activeGenre === g ? ' on' : '')}
            onClick={() => setActiveGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="body">
        {books.length === 0 && (
          <div className="empty-state">
            <i className="ti ti-book-2" aria-hidden="true"></i>
            Книг ще немає.
            <br />
            Додай першу — і почни записувати персонажів.
          </div>
        )}

        {Object.entries(grouped).map(([genre, list]) => (
          <div key={genre}>
            {activeGenre === 'all' && <div className="genre-sep">{genre.toUpperCase()}</div>}
            {list.map((book, i) => (
              <div className="book-card" key={book.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => onOpenBook(book.id)}
                >
                  <div
                    className="book-spine"
                    style={{ background: spineColors[i % spineColors.length] }}
                  ></div>
                  <div className="book-info">
                    <div className="book-title">{book.title}</div>
                    <div className="book-meta">
                      {book.genre}
                      {book.totalChapters ? ` · розділ ${book.currentChapter}/${book.totalChapters}` : ''}
                    </div>
                  </div>
                  <i className="ti ti-chevron-right chevron" aria-hidden="true"></i>
                </div>
                <button
                  style={deleteStyle}
                  onClick={(e) => handleDelete(e, book)}
                  aria-label="Видалити книгу"
                >
                  <i className="ti ti-trash" aria-hidden="true"></i>
                </button>
              </div>
            ))}
          </div>
        ))}

        <div className="fab-wrap">
          <button className="btn-primary" onClick={onAddBook}>
            <i className="ti ti-plus" aria-hidden="true"></i> Додати книгу
          </button>
        </div>
      </div>
    </div>
  );
}
