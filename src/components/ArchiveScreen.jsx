import { useSwipeToDelete } from '../useSwipeToDelete';

function SwipeableArchiveRow({ book, onOpen, onDelete, onUnarchive }) {
  const { offset, pastDeleteThreshold, swipeHandlers } = useSwipeToDelete(() => onDelete(book));

  function handleRowClick() {
    onOpen(book.id);
  }

  const deleteZoneWidth = Math.max(0, -offset);

  return (
    <div className="swipe-row">
      {deleteZoneWidth > 0 && (
        <div
          className="swipe-delete-zone"
          style={{ width: deleteZoneWidth, background: pastDeleteThreshold ? '#7A1F1F' : 'var(--danger)' }}
        >
          <i className="ti ti-trash" aria-hidden="true" style={{ fontSize: pastDeleteThreshold ? 26 : 20 }}></i>
        </div>
      )}
      <div
        className="book-card"
        style={{ transform: `translateX(${offset}px)`, alignItems: 'flex-start' }}
        onClick={handleRowClick}
        {...swipeHandlers}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="book-title">{book.title}</div>
          <div className="book-meta">{book.genre}</div>
          {book.rating && (
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>
              {book.rating}/10
            </div>
          )}
          {book.review && (
            <p className="desc-text" style={{ fontSize: 12, marginTop: 4, color: 'var(--muted)' }}>
              {book.review.length > 100 ? book.review.slice(0, 100) + '…' : book.review}
            </p>
          )}
        </div>
        <button
          className="btn-secondary"
          style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onUnarchive(book.id);
          }}
        >
          Повернути
        </button>
        {offset === 0 && <span className="swipe-hint">‹‹</span>}
      </div>
    </div>
  );
}

export default function ArchiveScreen({ books, onOpenBook, onUnarchive, onDeleteBook }) {
  const sorted = [...books].sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));

  function handleDelete(book) {
    const confirmed = window.confirm(
      `Видалити книгу "${book.title}" з архіву назавжди? Це включно з персонажами і рецензією.`
    );
    if (confirmed) onDeleteBook(book.id);
  }

  return (
    <div className="screen">
      <div className="topbar">
        <span className="topbar-title">Архів</span>
      </div>

      <div className="body">
        {sorted.length === 0 && (
          <div className="empty-state">
            <i className="ti ti-archive" aria-hidden="true"></i>
            Архів порожній. Дочитані книги з'являться тут.
          </div>
        )}

        {sorted.map((book) => (
          <SwipeableArchiveRow
            key={book.id}
            book={book}
            onOpen={onOpenBook}
            onDelete={handleDelete}
            onUnarchive={onUnarchive}
          />
        ))}
      </div>
    </div>
  );
}
