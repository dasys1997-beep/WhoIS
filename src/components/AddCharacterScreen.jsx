import { useState } from 'react';
import { ROLE_PRESETS } from '../initialData';

// Дуже простий локальний "помічник" який пропонує роль на основі ключових
// слів у тексті. Це НЕ справжній AI — це лише заглушка для прототипу.
// У реальному застосунку цей виклик піде на Claude API (через бекенд бота)
// і буде набагато точнішим, а також зможе розпізнавати риси характеру.
function suggestRole(text) {
  const t = text.toLowerCase();
  if (/вбит|мертв|труп|жертв|загину/.test(t)) return 'Жертва';
  if (/підозр|нерв|брех|приховує|алібі|винен/.test(t)) return 'Підозрюваний';
  if (/бачив|свідок|розповів|чув/.test(t)) return 'Свідок';
  if (/детектив|слідч|розслідує|головн/.test(t)) return 'Головний';
  return null;
}

export default function AddCharacterScreen({ book, existingCharacters, onBack, onCreate, onAppendExisting }) {
  const [mode, setMode] = useState('new'); // 'new' | 'append'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState(null);
  const [customRole, setCustomRole] = useState('');
  const [appendTargetId, setAppendTargetId] = useState(existingCharacters[0]?.id || null);

  const suggestion = description.length > 8 ? suggestRole(description) : null;

  function handleCreate() {
    if (!name.trim()) return;
    const finalRole = customRole.trim() || role || null;
    onCreate({ name: name.trim(), description: description.trim(), role: finalRole, tags: [] });
  }

  function handleAppend() {
    if (!appendTargetId || !description.trim()) return;
    onAppendExisting(appendTargetId, description.trim());
  }

  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Назад
        </button>
        <span className="topbar-title">Персонаж</span>
        <span style={{ width: 20 }}></span>
      </div>

      <div className="tabs">
        <button className={'tab' + (mode === 'new' ? ' on' : '')} onClick={() => setMode('new')}>
          Новий персонаж
        </button>
        <button
          className={'tab' + (mode === 'append' ? ' on' : '')}
          onClick={() => setMode('append')}
          disabled={existingCharacters.length === 0}
        >
          Додати до існуючого
        </button>
      </div>

      <div className="body">
        {mode === 'new' && (
          <>
            <div className="field-group">
              <div className="sec-label">Ім'я</div>
              <input
                className="input-field"
                placeholder="Введи ім'я персонажа"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field-group">
              <div className="sec-label">Опис / перше враження</div>
              <textarea
                className="note-box"
                style={{ minHeight: 80 }}
                placeholder="Пиши вільно, без структури — все що зустрів у тексті..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {suggestion && !role && !customRole && (
                <div className="ai-suggest" onClick={() => setRole(suggestion)}>
                  <i className="ti ti-sparkles" aria-hidden="true"></i>
                  Можлива роль: <strong style={{ marginLeft: 4 }}>{suggestion}</strong> — тапни щоб обрати
                </div>
              )}
            </div>

            <div className="field-group">
              <div className="sec-label">Роль у книзі</div>
              <div className="role-modal">
                {ROLE_PRESETS.map((r) => (
                  <div
                    key={r}
                    className={'role-option' + (role === r ? ' sel' : '')}
                    onClick={() => {
                      setRole(r);
                      setCustomRole('');
                    }}
                  >
                    {r}
                    {role === r && <i className="ti ti-check" aria-hidden="true"></i>}
                  </div>
                ))}
                <div style={{ marginTop: 6, borderTop: '1px solid var(--border)', paddingTop: 9 }}>
                  <input
                    className="input-field"
                    placeholder="Або введи свою роль..."
                    value={customRole}
                    onChange={(e) => {
                      setCustomRole(e.target.value);
                      setRole(null);
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 6 }}
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              Зберегти персонажа
            </button>
          </>
        )}

        {mode === 'append' && (
          <>
            <div className="field-group">
              <div className="sec-label">До якого персонажа додати</div>
              <select
                className="input-field"
                value={appendTargetId || ''}
                onChange={(e) => setAppendTargetId(e.target.value)}
              >
                {existingCharacters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <div className="sec-label">Новий текст / уривок</div>
              <textarea
                className="note-box"
                style={{ minHeight: 100 }}
                placeholder="Опис цього персонажа з іншої частини книги..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>
                Текст додасться окремим блоком до картки персонажа, опис не перезапишеться.
              </div>
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 6 }}
              onClick={handleAppend}
              disabled={!appendTargetId || !description.trim()}
            >
              Додати до картки
            </button>
          </>
        )}
      </div>
    </div>
  );
}
