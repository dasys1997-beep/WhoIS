export default function SettingsScreen({ theme, themes, onSetTheme, onBack }) {
  return (
    <div className="screen">
      <div className="topbar">
        <button className="back-btn" onClick={onBack}>
          <i className="ti ti-arrow-left" aria-hidden="true"></i> Назад
        </button>
        <span className="topbar-title">Налаштування</span>
        <span style={{ width: 20 }}></span>
      </div>

      <div className="body">
        <div className="sec-label">Тема</div>
        {Object.entries(themes).map(([key, t]) => (
          <div className="theme-row" key={key}>
            <div className="theme-label-group">
              <div className="swatch-dot" style={{ background: t.swatch }}></div>
              <span style={{ fontSize: 13.5, color: 'var(--text)' }}>{t.label}</span>
            </div>
            <button
              className="btn-secondary"
              style={
                theme === key
                  ? { borderColor: 'var(--accent)', color: 'var(--accent)' }
                  : undefined
              }
              onClick={() => onSetTheme(key)}
            >
              {theme === key ? 'Обрано' : 'Обрати'}
            </button>
          </div>
        ))}

        <div className="sec-label" style={{ marginTop: 20 }}>
          Про застосунок
        </div>
        <p className="desc-text" style={{ color: 'var(--muted)' }}>
          BookMind · версія 1. Базовий набір функцій: книги, персонажі, нотатки.
          Фото-розпізнавання, карта зв'язків, друзі та архів додаються у наступних версіях.
        </p>
      </div>
    </div>
  );
}
