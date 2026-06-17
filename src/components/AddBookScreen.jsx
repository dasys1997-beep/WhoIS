import { useState } from 'react';
import { GENRES } from '../initialData';

export default function AddBookScreen({ onBack, onSave }) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [totalChapters, setTotalChapters] = useState('');

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      genre,
      totalChapters: totalChapters ? parseInt(totalChapters, 10) : 0,
    });
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Назад
        </button>
        <span className="topbar-title">Нова книга</span>
        <span style={{ width: 20 }}></span>
      </div>

      <div className="body">
        <div className="field-group">
          <div className="sec-label">Назва книги</div>
          <input
            className="input-field"
            placeholder="Наприклад: А. Крісті — Убивство у Східному експресі"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="field-group">
          <div className="sec-label">Жанр</div>
          <select
            className="input-field"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <div className="sec-label">Кількість розділів (необов'язково)</div>
          <input
            className="input-field"
            type="number"
            min="0"
            placeholder="Наприклад: 24"
            value={totalChapters}
            onChange={(e) => setTotalChapters(e.target.value)}
          />
        </div>

        <button className="btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={!title.trim()}>
          Зберегти книгу
        </button>
      </div>
    </div>
  );
}
