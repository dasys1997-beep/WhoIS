import { useState, useMemo } from 'react';
import { useSwipeToDelete } from '../useSwipeToDelete';

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

function SwipeableCharRow({ character, onOpen, onDelete }) {
  const col = colorFor(character.role);
  const { offset, isOpen, pastDeleteThreshold, close, handleDeleteClick, swipeHandlers, maxSwipe } =
    useSwipeToDelete(() => onDelete(character));

  function handleRowClick() {
    if (isOpen) {
      close();
      return;
    }
    onOpen(character.id);
  }

  const deleteZoneWidth = Math.max(maxSwipe, -offset);

  return (
    <div className="swipe-row">
      <div
        className="swipe-delete-zone"
        style={{ width: deleteZoneWidth, background: pastDeleteThreshold ? '#7A1F1F' : 'var(--danger)' }}
        onClick={handleDeleteClick}
      >
        <i className="ti ti-trash" aria-hidden="true" style={{ fontSize: pastDeleteThreshold ? 26 : 22 }}></i>
      </div>
      <div
        className="char-item"
        style={{ transform: `translateX(${offset}px)` }}
        onClick={handleRowClick}
        {...swipeHandlers}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div className="av" style={{ background: col.bg, color: col.text }}>
            {initials(character.name)}
          </div>
          <span
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 11,
              height: 11,
              borderRadius: '50%',
              background: character.isActive === false ? '#9A9A9A' : '#3B9E4F',
              border: '2px solid var(--card)',
            }}
          />
        </div>
        <div className="char-info-grow">
          <div className="ch-name">{character.name}</div>
          {character.role && (
            <span className="badge" style={{ background: col.bg, color: col.text }}>
              {character.role}
            </span>
          )}
        </div>
        <i className="ti ti-chevron-right chevron" aria-hidden="true"></i>
        {offset === 0 && <span className="swipe-hint">‹‹</span>}
      </div>
    </div>
  );
}

export default function CharactersScreen({ book, characters, onBack, onOpenChar, onAddChar, onOpenNotes, onDeleteChar }) {
  const [activeRole, setActiveRole] = useState('all');

  const usedRoles = useMemo(() => {
    const set = new Set(characters.map((c) => c.role).filter(Boolean));
    return Array.from(set);
  }, [characters]);

  const filtered =
    activeRole === 'all' ? characters : characters.filter((c) => c.role === activeRole);

  // Нещодавно додані — спочатку, щоб при великій кількості персонажів
  // не доводилось шукати того кого щойно записав.
  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  function handleDelete(character) {
    const confirmed = window.confirm(`Видалити персонажа "${character.name}"? Це незворотно.`);
    if (confirmed) onDeleteChar(character.id);
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

        {sorted.map((c) => (
          <SwipeableCharRow key={c.id} character={c} onOpen={onOpenChar} onDelete={handleDelete} />
        ))}

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
