// Початкові дані — приклад для демонстрації. Користувач може видалити
// або відредагувати все, додати своє. У версії з Supabase ця функція
// буде замінена на завантаження реальних даних користувача з бази.

export const GENRES = ['Детектив', 'Трилер', 'Роман', 'Фентезі', 'Історична проза', 'Жахи'];

export const ROLE_PRESETS = ['Головний', 'Підозрюваний', 'Жертва', 'Свідок', 'Другорядний'];

export function createInitialData() {
  const now = Date.now();
  return {
    books: [
      {
        id: 'b1',
        title: 'А. Крісті — Пуаро',
        genre: 'Детектив',
        currentChapter: 8,
        totalChapters: 24,
        status: 'reading', // reading | finished
        createdAt: now,
      },
    ],
    characters: [
      {
        id: 'c1',
        bookId: 'b1',
        name: 'Еркюль Пуаро',
        role: 'Головний',
        description:
          'Бельгійський детектив. Педантичний, любить порядок. Спирається на «сірі клітинки» — логіку та психологію, а не фізичні докази.',
        tags: ['Педантичний', 'Логічний', 'Бельгієць'],
        events: [{ chapter: 1, text: 'Прибув на маєток для розслідування.' }],
        notes: [{ chapter: 3, text: 'Щось приховує про стосунки з господарем.' }],
        createdAt: now,
      },
      {
        id: 'c2',
        bookId: 'b1',
        name: 'Місіс Фезерстоун',
        role: 'Підозрюваний',
        description: 'Заможна вдова з темним минулим. Була присутня на місці злочину тієї ночі.',
        tags: ['Нервова', 'Вдова'],
        events: [],
        notes: [],
        createdAt: now,
      },
      {
        id: 'c3',
        bookId: 'b1',
        name: 'Сер Річард',
        role: 'Жертва',
        description: 'Землевласник, господар маєтку. Знайдений мертвим у бібліотеці.',
        tags: [],
        events: [],
        notes: [],
        createdAt: now,
      },
    ],
    bookNotes: {
      b1: "Убивця точно не слуга — занадто очевидно.\n\nГл. 7 — важлива деталь про годинник! Перечитати.",
    },
    connections: [
      { id: 'rel1', bookId: 'b1', fromId: 'c2', toId: 'c3', label: 'Колишня знайома', type: 'suspicious' },
    ],
  };
}
