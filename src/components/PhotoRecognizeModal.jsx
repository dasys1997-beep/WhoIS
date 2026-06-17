import { useState, useRef } from 'react';

// Цей компонент реалізує флоу, який ми узгодили: користувач фотографує
// сторінку прямо на картці персонажа → AI пропонує розпізнаний текст →
// користувач РЕДАГУЄ і ПІДТВЕРДЖУЄ перед збереженням. Нічого не йде
// в базу даних автоматично.

export default function PhotoRecognizeModal({ onClose, onConfirm }) {
  const [stage, setStage] = useState('pick'); // pick | loading | review | error
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      setStage('loading');

      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type || 'image/jpeg';

      try {
        const resp = await fetch('/api/recognize-character', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || 'Не вдалося розпізнати фото');
        }

        const data = await resp.json();
        setResult(data);
        setEditedText(data.description || data.rawText || '');
        setStage('review');
      } catch (err) {
        setErrorMsg(err.message || 'Сталася помилка');
        setStage('error');
      }
    };
    reader.readAsDataURL(file);
  }

  function handleConfirm() {
    onConfirm(editedText, result);
  }

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
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            Фото сторінки
          </span>
          <button className="icon-btn" onClick={onClose}>
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        {stage === 'pick' && (
          <div>
            <p className="desc-text" style={{ color: 'var(--muted)', marginBottom: 12 }}>
              Сфотографуй сторінку з описом персонажа. AI прочитає текст і запропонує додати — ти завжди можеш відредагувати перед збереженням.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => fileInputRef.current?.click()}>
              <i className="ti ti-camera" aria-hidden="true"></i> Зробити або обрати фото
            </button>
          </div>
        )}

        {stage === 'loading' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            {preview && (
              <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, marginBottom: 14 }} />
            )}
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>AI читає текст...</p>
          </div>
        )}

        {stage === 'error' && (
          <div>
            <p className="desc-text" style={{ color: 'var(--danger)', marginBottom: 12 }}>
              {errorMsg}
            </p>
            <button className="btn-secondary" onClick={() => setStage('pick')}>
              Спробувати ще раз
            </button>
          </div>
        )}

        {stage === 'review' && (
          <div>
            {preview && (
              <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 10, marginBottom: 10 }} />
            )}

            {result?.name && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>
                Розпізнане ім'я: <strong style={{ color: 'var(--text)' }}>{result.name}</strong>
              </div>
            )}

            {result?.suggestedRole && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
                Можлива роль: <strong style={{ color: 'var(--text)' }}>{result.suggestedRole}</strong>
              </div>
            )}

            {result?.rawText && result?.description && result.rawText !== result.description && (
              <details style={{ marginBottom: 10 }}>
                <summary style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                  Показати оригінальний розпізнаний текст
                </summary>
                <p className="desc-text" style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
                  {result.rawText}
                </p>
              </details>
            )}

            <div className="sec-label">Текст для додавання (можна редагувати)</div>
            <textarea
              className="note-box"
              style={{ minHeight: 120 }}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStage('pick')}>
                Інше фото
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleConfirm} disabled={!editedText.trim()}>
                Додати
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
