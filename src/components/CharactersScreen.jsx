import { useState, useMemo } from 'react';

const ROLE_COLORS = {
  'Головний': { bg: '#E8D8B8', text: '#6B4C1E' },
  'Підозрюваний': { bg: '#F0C4B8', text: '#8B2A1A' },
  'Жертва': { bg: '#C8E0C0', text: '#2A5A1A' },
  'Свідок': { bg: '#C8DCE8', text: '#1A4A6B' },
  'Другорядний': { bg: '#DCD4E8', text: '#4A3A6B' },
};

function colorFor(role) {
  return ROLE_COLORS[role] || { bg: '#E0D0B0', text: '#5C3A18' };
}

function initials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

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

export default function CharactersScreen({ book, characters, onBack, onOpenChar, onAddChar, onOpenNotes, onDeleteChar }) {
  const [activeRole, setActiveRole] = useState('all');

  const usedRoles = useMemo(() => {
    const set = new Set(characters.map((c) => c.role).filter(Boolean));
    return Array.from(set);
  }, [characters]);

  const filtered =
    activeRole === 'all' ? characters : characters.filter((c) => c.role === activeRole);

  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  function handleDelete(e, character) {
    e.stopPropagation();
    confirmDelete(`Видалити "${character.name}"?`, () => {
      if (onDeleteChar) onDeleteChar(character.id);
    });
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Назад
        </button>
        <span className="topbar-title">{book.title}</span>
        <button className="icon-btn" onClick={onOpenNotes} aria-label="Нотатки книги">
          <i className="ti ti-notebook" aria-hidden="true"></i>
        </button>
      </div>

      <div className="tabs">
        <button
          className={'tab' + (activeRole === 'all' ? ' on' : '')}
          onClick={() => setActiveRole('all')}
        >
          Всі
        </button>
        {usedRoles.map((r) => (
          <button
            key={r}
            className={'tab' + (activeRole === r ? ' on' : '')}
            onClick={() => setActiveRole(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="body">
        {sorted.length === 0 && (
          <div className="empty-state">
            <i className="ti ti-users" aria-hidden="true"></i>
            {characters.length === 0
              ? 'Персонажів ще немає. Додай першого, як тільки зустрінеш у тексті.'
              : 'Немає персонажів з цією роллю.'}
          </div>
        )}

        {sorted.map((c) => {
          const col = colorFor(c.role);
          return (
            <div className="char-item" key={c.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => onOpenChar(c.id)}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="av" style={{ background: col.bg, color: col.text }}>
                    {initials(c.name)}
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 11,
                      height: 11,
                      borderRadius: '50%',
                      background: c.isActive === false ? '#9A9A9A' : '#3B9E4F',
                      border: '2px solid var(--card)',
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ch-name">{c.name}</div>
                  {c.role && (
                    <span className="badge" style={{ background: col.bg, color: col.text }}>
                      {c.role}
                    </span>
                  )}
                </div>
                <i className="ti ti-chevron-right" style={{ fontSize: 15, color: 'var(--muted)', flexShrink: 0 }} aria-hidden="true"></i>
              </div>
              <button
                style={deleteStyle}
                onClick={(e) => handleDelete(e, c)}
                aria-label="Видалити персонажа"
              >
                <i className="ti ti-trash" aria-hidden="true"></i>
              </button>
            </div>
          );
        })}

        <div className="fab-wrap">
          <button className="btn-primary" onClick={onAddChar}>
            <i className="ti ti-plus" aria-hidden="true"></i> Додати персонажа
          </button>
        </div>
      </div>
    </div>
  );
}

export { colorFor, initials };
