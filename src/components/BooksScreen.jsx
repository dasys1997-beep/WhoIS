import { useState, useMemo } from 'react';
import { GENRES } from '../initialData';
import { useSwipeToDelete } from '../useSwipeToDelete';

function SwipeableBookRow({ book, spineColor, onOpen, onDelete, onArchive }) {
  const { offset, isOpen, pastDeleteThreshold, close, handleDeleteClick, swipeHandlers, maxSwipe } =
    useSwipeToDelete(() => onDelete(book));

  function handleRowClick() {
    if (isOpen) {
      close();
      return;
    }
    onOpen(book.id);
  }

  // Червона зона розтягується разом з карткою (а не лишається фіксованої
  // ширини maxSwipe), щоб видно було наскільки далеко тягнеш і коли саме
  // спрацює видалення без додаткового тапу.
  const deleteZoneWidth = Math.max(maxSwipe, -offset);

  return (
    <div className="swipe-row">
      <div
        className="swipe-delete-zone"
        style={{
          width: deleteZoneWidth,
          background: pastDeleteThreshold ? '#7A1F1F' : 'var(--danger)',
        }}
        onClick={handleDeleteClick}
      >
        <i className="ti ti-trash" aria-hidden="true" style={{ fontSize: pastDeleteThreshold ? 26 : 22 }}></i>
      </div>
      <div
        className="book-card"
        style={{ transform: `translateX(${offset}px)` }}
        onClick={handleRowClick}
        {...swipeHandlers}
      >
        <div className="book-spine" style={{ background: spineColor }}></div>
        <div className="book-info">
          <div className="book-title">{book.title}</div>
          <div className="book-meta">
            {book.genre}
            {book.totalChapters ? ` · розділ ${book.currentChapter}/${book.totalChapters}` : ''}
          </div>
        </div>
        <button
          className="btn-secondary"
          style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onArchive(book);
          }}
        >
          Дочитано
        </button>
        {offset === 0 && <span className="swipe-hint">‹‹</span>}
      </div>
    </div>
  );
}

export default function BooksScreen({ books, onOpenBook, onAddBook, onSettings, onOpenArchive, onDeleteBook, onArchiveBook }) {
  const [activeGenre, setActiveGenre] = useState('all');
  const [archivingBook, setArchivingBook] = useState(null); // книга, для якої зараз показуємо форму рецензії
  const [justArchivedTitle, setJustArchivedTitle] = useState(null); // короткий тост-підтвердження

  function handleArchiveConfirm(info) {
    const title = archivingBook.title;
    onArchiveBook(archivingBook.id, info);
    setArchivingBook(null);
    // Книга щойно зникла зі списку (бо перемістилась в архів) — без цього
    // повідомлення це виглядає так, наче вона видалилась, а не архівувалась.
    setJustArchivedTitle(title);
    setTimeout(() => setJustArchivedTitle(null), 3500);
  }

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

  function handleDelete(book) {
    const confirmed = window.confirm(
      `Видалити книгу "${book.title}"? Усі її персонажі та нотатки видаляться назавжди.`
    );
    if (confirmed) onDeleteBook(book.id);
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
              <SwipeableBookRow
                key={book.id}
                book={book}
                spineColor={spineColors[i % spineColors.length]}
                onOpen={onOpenBook}
                onDelete={handleDelete}
                onArchive={(b) => setArchivingBook(b)}
              />
            ))}
          </div>
        ))}

        <div className="fab-wrap">
          <button className="btn-primary" onClick={onAddBook}>
            <i className="ti ti-plus" aria-hidden="true"></i> Додати книгу
          </button>
        </div>
      </div>

      {archivingBook && (
        <ArchiveReviewModal
          book={archivingBook}
          onClose={() => setArchivingBook(null)}
          onConfirm={handleArchiveConfirm}
        />
      )}

      {justArchivedTitle && (
        <div
          style={{
            position: 'fixed',
            bottom: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            padding: '10px 18px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 2000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            cursor: 'pointer',
          }}
          onClick={() => {
            setJustArchivedTitle(null);
            onOpenArchive();
          }}
        >
          <i className="ti ti-archive" aria-hidden="true"></i>
          «{justArchivedTitle}» перенесено в архів · Відкрити
        </div>
      )}
    </div>
  );
}

function ArchiveReviewModal({ book, onClose, onConfirm }) {
  const [rating, setRating] = useState(null);
  const [review, setReview] = useState('');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: '18px 18px 0 0',
          padding: 18,
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            Дочитано: {book.title}
          </span>
          <button className="icon-btn" onClick={onClose}>
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        <p className="desc-text" style={{ color: 'var(--muted)', marginBottom: 12 }}>
          Книга переходить в архів. Можеш оцінити і написати рецензію зараз, або пропустити — повернутись можна пізніше з картки книги в архіві.
        </p>

        <div className="sec-label">Оцінка (1-10)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: rating === n ? 'var(--accent)' : 'var(--input)',
                color: rating === n ? 'var(--accent-text)' : 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="sec-label">Рецензія (необов'язково)</div>
        <textarea
          className="note-box"
          style={{ minHeight: 100 }}
          placeholder="Що думаєш про книгу, чи вгадав фінал, що сподобалось..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={() => onConfirm({ rating: null, review: '' })}>
            Пропустити
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => onConfirm({ rating, review })}>
            В архів
          </button>
        </div>
      </div>
    </div>
  );
}
