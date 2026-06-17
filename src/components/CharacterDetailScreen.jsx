import { useState } from 'react';
import { colorFor, initials } from './CharactersScreen';
import PhotoRecognizeModal from './PhotoRecognizeModal';

export default function CharacterDetailScreen({ character, book, onBack, onUpdate, onDelete }) {
  const [noteValue, setNoteValue] = useState(character.freeNote || '');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const col = colorFor(character.role);

  function saveNote() {
    onUpdate({ freeNote: noteValue });
  }

  function handlePhotoConfirm(text, recognized, targetField) {
    const field = targetField || 'description';
    const current = character[field] || '';
    const updatedText = current ? current + '\n\n' + text : text;
    const patch = { [field]: updatedText };

    // Якщо роль ще не визначена, а AI щось запропонував — підставляємо,
    // але НЕ перезаписуємо роль, яку користувач уже встановив раніше.
    if (!character.role && recognized?.suggestedRole) {
      patch.role = recognized.suggestedRole;
    }

    onUpdate(patch);
    setShowPhotoModal(false);
  }

  function handleDelete() {
    const confirmed = window.confirm(`Видалити персонажа "${character.name}"? Це незворотно.`);
    if (confirmed) onDelete();
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
            Опису ще немає. Додай текстом або фото нижче.
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

        <div className="sec-label">Події</div>
        {character.events ? (
          <p className="desc-text">{character.events}</p>
        ) : (
          <p className="desc-text" style={{ color: 'var(--muted)' }}>
            Що персонаж робив чи де був — записуй сюди окремо від характеристики.
          </p>
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
        <div className="photo-btn" onClick={() => setShowPhotoModal(true)}>
          <i className="ti ti-camera" aria-hidden="true"></i>
          Сфотографувати — AI доповнить картку
        </div>
      </div>

      {showPhotoModal && (
        <PhotoRecognizeModal
          onClose={() => setShowPhotoModal(false)}
          onConfirm={handlePhotoConfirm}
        />
      )}
    </div>
  );
}
