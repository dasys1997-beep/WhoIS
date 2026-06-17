import { useState, useRef } from 'react';

// Замінює фото-розпізнавання на голосове. Принцип той самий: AI пропонує,
// людина підтверджує — але тепер може запропонувати КІЛЬКА сегментів за раз,
// кожен зі своїм полем (характеристика/подія) і персонажем.
//
// existingCharacters потрібен щоб користувач міг вибрати кому з уже
// створених персонажів призначити сегмент, якщо AI розпізнав інше ім'я.

export default function VoiceRecordModal({ currentCharacterName, existingCharacters, onClose, onConfirmSegments }) {
  const [stage, setStage] = useState('record'); // record | recording | loading | review | error
  const [segments, setSegments] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        processRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStage('recording');
    } catch (err) {
      setErrorMsg('Не вдалося отримати доступ до мікрофона. Перевір дозволи у браузері/Telegram.');
      setStage('error');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setStage('loading');
  }

  async function processRecording() {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];

      try {
        const resp = await fetch('/api/recognize-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: 'audio/webm',
            currentCharacterName,
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || 'Не вдалося розпізнати голос');
        }

        const data = await resp.json();
        setTranscript(data.transcript || '');

        // Кожен сегмент отримує локальний стан для редагування і
        // прив'язку до персонажа (за замовчуванням — поточний, якщо
        // AI не вказав явно іншого).
        const initialSegments = (data.segments || []).map((seg, i) => ({
          id: 'seg-' + i,
          text: seg.text,
          field: seg.field === 'events' ? 'events' : 'description',
          assignedCharacterName: seg.characterName || currentCharacterName,
          mentionedOtherName: seg.mentionedOtherName || null,
          accepted: true, // користувач може зняти галочку, щоб пропустити сегмент
        }));

        setSegments(initialSegments);
        setStage('review');
      } catch (err) {
        setErrorMsg(err.message || 'Сталася помилка');
        setStage('error');
      }
    };

    reader.readAsDataURL(blob);
  }

  function updateSegment(id, patch) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function handleConfirm() {
    const toSave = segments.filter((s) => s.accepted && s.text.trim());
    onConfirmSegments(toSave);
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
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
            Голосовий запис
          </span>
          <button className="icon-btn" onClick={onClose}>
            <i className="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        {stage === 'record' && (
          <div>
            <p className="desc-text" style={{ color: 'var(--muted)', marginBottom: 14 }}>
              Скажи все, що хочеш записати про <strong style={{ color: 'var(--text)' }}>{currentCharacterName}</strong>.
              AI розбере сказане на характеристику та події — кожну частину покажу тобі для підтвердження.
            </p>
            <button className="btn-primary" style={{ width: '100%' }} onClick={startRecording}>
              <i className="ti ti-microphone" aria-hidden="true"></i> Почати запис
            </button>
          </div>
        )}

        {stage === 'recording' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--danger)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <i className="ti ti-microphone" style={{ fontSize: 28, color: '#fff' }} aria-hidden="true"></i>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>Записую... говори вільно</p>
            <button className="btn-primary" onClick={stopRecording}>
              <i className="ti ti-player-stop" aria-hidden="true"></i> Завершити запис
            </button>
          </div>
        )}

        {stage === 'loading' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>AI слухає та розбирає сказане...</p>
          </div>
        )}

        {stage === 'error' && (
          <div>
            <p className="desc-text" style={{ color: 'var(--danger)', marginBottom: 12 }}>
              {errorMsg}
            </p>
            <button className="btn-secondary" onClick={() => setStage('record')}>
              Спробувати ще раз
            </button>
          </div>
        )}

        {stage === 'review' && (
          <div>
            {transcript && (
              <details style={{ marginBottom: 12 }}>
                <summary style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                  Показати повну розшифровку
                </summary>
                <p className="desc-text" style={{ color: 'var(--muted)', fontSize: 12, marginTop: 6 }}>
                  {transcript}
                </p>
              </details>
            )}

            {segments.length === 0 && (
              <p className="desc-text" style={{ color: 'var(--muted)' }}>
                AI не зміг розібрати сказане на конкретні твердження про персонажа. Спробуй записати ще раз чіткіше.
              </p>
            )}

            {segments.map((seg) => (
              <div
                key={seg.id}
                style={{
                  background: 'var(--input)',
                  borderRadius: 10,
                  padding: 11,
                  marginBottom: 10,
                  border: '1px solid var(--border)',
                  opacity: seg.accepted ? 1 : 0.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={seg.accepted}
                    onChange={(e) => updateSegment(seg.id, { accepted: e.target.checked })}
                  />
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Для: <strong style={{ color: 'var(--text)' }}>{seg.assignedCharacterName}</strong>
                  </span>
                </div>

                {seg.mentionedOtherName && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--chip-text)',
                      background: 'var(--chip)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    Згадано інший персонаж: <strong>{seg.mentionedOtherName}</strong> — якщо його ще немає в книзі, додай окремо після цього.
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <button
                    className={seg.field === 'description' ? 'tab on' : 'tab'}
                    style={{ border: '1px solid var(--border)', borderRadius: 7, flex: 1, padding: '5px 0', fontSize: 11 }}
                    onClick={() => updateSegment(seg.id, { field: 'description' })}
                  >
                    Характеристика
                  </button>
                  <button
                    className={seg.field === 'events' ? 'tab on' : 'tab'}
                    style={{ border: '1px solid var(--border)', borderRadius: 7, flex: 1, padding: '5px 0', fontSize: 11 }}
                    onClick={() => updateSegment(seg.id, { field: 'events' })}
                  >
                    Подія
                  </button>
                </div>

                <textarea
                  className="note-box"
                  style={{ minHeight: 60, fontSize: 13 }}
                  value={seg.text}
                  onChange={(e) => updateSegment(seg.id, { text: e.target.value })}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStage('record')}>
                Записати ще
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleConfirm}
                disabled={segments.filter((s) => s.accepted).length === 0}
              >
                Зберегти обране
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
