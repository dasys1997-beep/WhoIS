import { useState } from 'react';

export default function BookNotesScreen({ book, note, onBack, onSave, onUpdateProgress }) {
  const [text, setText] = useState(note);
  const [chapter, setChapter] = useState(book.currentChapter || 0);

  function handleSave() {
    onSave(text);
  }

  function handleProgressBlur() {
    const n = parseInt(chapter, 10);
    if (!isNaN(n) && n >= 0) onUpdateProgress(n);
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Назад
        </button>
        <span className="topbar-title">Нотатки книги</span>
        <span style={{ width: 20 }}></span>
      </div>

      <div className="body">
        {book.totalChapters > 0 && (
          <div className="field-group">
            <div className="sec-label">Прогрес читання</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="input-field"
                type="number"
                min="0"
                max={book.totalChapters}
                style={{ width: 80, marginBottom: 0 }}
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                onBlur={handleProgressBlur}
              />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>з {book.totalChapters} розділів</span>
            </div>
          </div>
        )}

        <div className="sec-label">Мої думки · {book.title}</div>
        <textarea
          className="note-box"
          style={{ minHeight: 220 }}
          placeholder="Вільний текст — теорії, здогадки, важливі деталі..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={handleSave}>
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
}
