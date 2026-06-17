import { useState } from 'react';
import { colorFor, initials } from './CharactersScreen';
import VoiceRecordModal from './VoiceRecordModal';

// Невеликий повторюваний блок: заголовок секції + іконка редагування,
// яка перемикає секцію в режим textarea з кнопками Зберегти/Скасувати.
function EditableSection({ label, value, placeholder, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  function startEdit() {
    setDraft(value || '');
    setEditing(true);
  }

  function save() {
    onSave(draft);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
  }

  return (
    <>
      <div className="sec-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{label}</span>
        {!editing && (
          <button className="icon-btn" style={{ fontSize: 14 }} onClick={startEdit} aria-label={`Редагувати ${label.toLowerCase()}`}>
            <i className="ti ti-edit" aria-hidden="true"></i>
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <textarea
            className="note-box"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={cancel}>
              Скасувати
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={save}>
              Зберегти
            </button>
          </div>
        </div>
      ) : value ? (
        <p className="desc-text">{value}</p>
      ) : (
        <p className="desc-text" style={{ color: 'var(--muted)' }}>
          {placeholder}
        </p>
      )}
    </>
  );
}

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
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(character.name);
  const col = colorFor(character.role);

  function saveNote() {
    onUpdate({ freeNote: noteValue });
  }

  function handleDelete() {
    const confirmed = window.confirm(`Видалити персонажа "${character.name}"? Це незворотно.`);
    if (confirmed) onDelete();
  }

  function saveName() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== character.name) {
      onUpdate({ name: trimmed });
    }
    setEditingName(false);
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
        onAppendField(seg.field, seg.text);
      } else if (target) {
        window.alert(
          `Сегмент "${seg.text}" стосується персонажа "${target.name}", а не ${character.name}. Відкрий картку ${target.name}, щоб додати це там.`
        );
      } else if (seg.assignedCharacterName && seg.assignedCharacterName !== character.name) {
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
          {editingName ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                className="input-field"
                style={{ marginBottom: 0, fontSize: 15, padding: '6px 9px' }}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
              />
              <button className="icon-btn" style={{ fontSize: 18 }} onClick={saveName} aria-label="Зберегти ім'я">
                <i className="ti ti-check" aria-hidden="true"></i>
              </button>
            </div>
          ) : (
            <div
              style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => {
                setNameDraft(character.name);
                setEditingName(true);
              }}
            >
              {character.name}
              <i className="ti ti-edit" style={{ fontSize: 13, color: 'var(--muted)' }} aria-hidden="true"></i>
            </div>
          )}
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
            <EditableSection
              label="Характеристика"
              value={character.description}
              placeholder="Опису ще немає. Запиши голосом нижче або відредагуй тут."
              onSave={(text) => onUpdate({ description: text })}
            />

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
          <EditableSection
            label="Події"
            value={character.events}
            placeholder="Що персонаж робив чи де був — запиши голосом нижче або відредагуй тут."
            onSave={(text) => onUpdate({ events: text })}
          />
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
