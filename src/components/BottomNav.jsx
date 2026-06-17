// Нижня навігація — мінімум вкладок, бо головний пріоритет це швидкість
// до запису персонажа під час паузи в читанні. Налаштування доступні
// через шапку (іконка), не займають місце в навігації знизу.

export default function BottomNav({ active, onNavigate }) {
  const tabs = [
    { key: 'books', label: 'Книги', icon: 'ti-books' },
    { key: 'settings', label: 'Налаштування', icon: 'ti-settings' },
  ];

  // Підсвічуємо "Книги" також коли користувач всередині книги/персонажа —
  // бо логічно це все ще "в межах" розділу книг.
  const booksRelated = ['books', 'addBook', 'characters', 'addChar', 'charDetail', 'bookNotes', 'archive'];
  const activeKey = booksRelated.includes(active) ? 'books' : active;

  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={'bnav' + (activeKey === t.key ? ' on' : '')}
          onClick={() => onNavigate(t.key)}
        >
          <i className={'ti ' + t.icon} aria-hidden="true"></i>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
