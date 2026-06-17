import { useState } from 'react';
import { colorFor, initials } from './CharactersScreen';
import VoiceRecordModal from './VoiceRecordModal';

export default function CharacterDetailScreen({
  character,
  book,
  allCharactersInBook,
  onBack,
  onUpdate,
  onAppendField,
  onToggleActive,
  onCreateCharacter,
  onDelete,
}) {
  const [tab, setTab] = useState('overview'); // overview | events | notes
  const [noteValue, setNoteValue] = useState(character.freeNote || '');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const col = colorFor(character.role);

  function saveNote() {
    onUpdate({ freeNote: noteValue });
  }

  function handleDelete() {
    const confirmed = window.confirm(`Видалити персонажа "${character.name}"? Це незворотно.`);
    if (confirmed) onDelete();
  }

  function findExistingByName(name) {
    if (!name) return null;
    const normalized = name.trim().toLowerCase();
    return allCharactersInBook.find((c) => c.name.trim().toLowerCase() === normalized);
  }

  function handleVoiceSegments(segments) {
    segments.forEach((seg) => {
      const target = findExistingByName(seg.assignedCharacterName);

      if (target && target.id === character.id) {
        // Сегмент про поточного персонажа — додаємо прямо в потрібне поле.
        onAppendField(seg.field, seg.text);
      } else if (target) {
        // AI розпізнав ім'я іншого вже існуючого персонажа книги.
        // Це окремий персонаж — не оновлюємо його звідси автоматично,
        // щоб не редагувати чужу картку непомітно для користувача.
        // Замість цього показуємо підказку, що варто перейти туди самому.
        window.alert(
          `Сегмент "${seg.text}" стосується персонажа "${target.name}", а не ${character.name}. Відкрий картку ${target.name}, щоб додати це там.`
        );
      } else if (seg.assignedCharacterName && seg.assignedCharacterName !== character.name) {
        // Згадано ім'я, якого ще немає серед персонажів книги.
        const confirmed = window.confirm(
          `AI почув ім'я "${seg.assignedCharacterName}", якого ще немає серед персонажів книги. Створити нового персонажа з цим текстом?`
        );
        if (confirmed) {
          onCreateCharacter(seg.assignedCharacterName);
        }
      } else {
        onAppendField(seg.field, seg.text);
      }
    });
    setShowVoiceModal(false);
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Назад
        </button>
        <span className="topbar-title">{character.name}</span>
        <button className="icon-btn" onClick={handleDelete} aria-label="Видалити персонажа">
          <i className="ti ti-trash" aria-hidden="true"></i>
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ position: 'relative' }}>
          <div className="av" style={{ width: 52, height: 52, fontSize: 16, background: col.bg, color: col.text }}>
            {initials(character.name)}
          </div>
          <button
            onClick={onToggleActive}
            title={character.isActive ? 'Активний — натисни щоб позначити як вибулого' : 'Неактивний — натисни щоб позначити як активного'}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: character.isActive ? '#3B9E4F' : '#9A9A9A',
              border: '2px solid var(--bg)',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>
            {character.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{book?.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
            {character.role && (
              <span className="badge" style={{ background: col.bg, color: col.text }}>
                {character.role}
              </span>
            )}
            {character.mentionCount > 0 && (
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                <i className="ti ti-eye" style={{ fontSize: 12, marginRight: 2 }} aria-hidden="true"></i>
                {character.mentionCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={'tab' + (tab === 'overview' ? ' on' : '')} onClick={() => setTab('overview')}>
          Огляд
        </button>
        <button className={'tab' + (tab === 'events' ? ' on' : '')} onClick={() => setTab('events')}>
          Події
        </button>
        <button className={'tab' + (tab === 'notes' ? ' on' : '')} onClick={() => setTab('notes')}>
          Нотатки
        </button>
      </div>

      <div className="body">
        {tab === 'overview' && (
          <>
            <div className="sec-label">Характеристика</div>
            {character.description ? (
              <p className="desc-text">{character.description}</p>
            ) : (
              <p className="desc-text" style={{ color: 'var(--muted)' }}>
                Опису ще немає. Запиши голосом нижче.
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
          </>
        )}

        {tab === 'events' && (
          <>
            <div className="sec-label">Події</div>
            {character.events ? (
              <p className="desc-text">{character.events}</p>
            ) : (
              <p className="desc-text" style={{ color: 'var(--muted)' }}>
                Що персонаж робив чи де був — запиши голосом нижче.
              </p>
            )}
          </>
        )}

        {tab === 'notes' && (
          <>
            <div className="sec-label">Нотатки</div>
            <textarea
              className="note-box"
              placeholder="Твої думки про цього персонажа..."
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              onBlur={saveNote}
            />
          </>
        )}

        <div className="sec-label">Голосовий запис</div>
        <div className="photo-btn" onClick={() => setShowVoiceModal(true)}>
          <i className="ti ti-microphone" aria-hidden="true"></i>
          Записати голосом — AI розкладе по полях
        </div>
      </div>

      {showVoiceModal && (
        <VoiceRecordModal
          currentCharacterName={character.name}
          existingCharacters={allCharactersInBook}
          onClose={() => setShowVoiceModal(false)}
          onConfirmSegments={handleVoiceSegments}
        />
      )}
    </div>
  );
}
