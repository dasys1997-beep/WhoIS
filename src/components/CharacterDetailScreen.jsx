import { useState } from 'react';
import { colorFor, initials } from './CharactersScreen';

export default function CharacterDetailScreen({ character, book, onBack, onUpdate }) {
  const [noteValue, setNoteValue] = useState(character.freeNote || '');
  const col = colorFor(character.role);

  function saveNote() {
    onUpdate({ freeNote: noteValue });
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Назад
        </button>
        <span className="topbar-title">{character.name}</span>
        <span style={{ width: 20 }}></span>
      </div>

      <div className="body">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingBottom: 14,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="av" style={{ width: 52, height: 52, fontSize: 16, background: col.bg, color: col.text }}>
            {initials(character.name)}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>
              {character.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{book?.title}</div>
            {character.role && (
              <span className="badge" style={{ background: col.bg, color: col.text, marginTop: 5 }}>
                {character.role}
              </span>
            )}
          </div>
        </div>

        <div className="sec-label">Характеристика</div>
        {character.description ? (
          <p className="desc-text">{character.description}</p>
        ) : (
          <p className="desc-text" style={{ color: 'var(--muted)' }}>
            Опису ще немає. Додай через "Додати до існуючого" в меню персонажів.
          </p>
        )}

        {character.tags?.length > 0 && (
          <div style={{ marginTop: 6 }}>
            {character.tags.map((tag) => (
              <span className="chip" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="sec-label">Нотатки</div>
        <textarea
          className="note-box"
          placeholder="Твої думки про цього персонажа..."
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)}
          onBlur={saveNote}
        />

        <div className="sec-label">Фото сторінки</div>
        <div className="photo-btn" title="У реальному боті: надсилаєш фото в Telegram-чат, AI читає текст і пропонує додати">
          <i className="ti ti-camera" aria-hidden="true"></i>
          Надіслати фото боту — AI заповнить картку
        </div>
      </div>
    </div>
  );
}
