// Vercel Serverless Function — /api/recognize-character
//
// Приймає фото (base64) з фронтенду, відправляє в Gemini API з проханням
// розпізнати текст і виділити структуровані дані персонажа, повертає
// результат назад у застосунок ДЛЯ ПІДТВЕРДЖЕННЯ користувачем — нічого
// не зберігається автоматично без його згоди (це принципове рішення,
// узгоджене в обговоренні: AI завжди тільки пропонує, користувач вирішує).
//
// Ключ GEMINI_API_KEY читається зі змінних середовища Vercel — він
// НІКОЛИ не потрапляє у фронтенд-код і не видний користувачу браузера.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не підтримується' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY не налаштований на сервері' });
  }

  const { imageBase64, mimeType } = req.body || {};
  if (!imageBase64) {
    return res.status(400).json({ error: 'Не передано зображення' });
  }

  const prompt = `Це фото сторінки книги з описом персонажа. Прочитай текст на фото.

ВАЖЛИВО: поле "description" — це НЕ цитата і НЕ копія тексту з фото.
Ти маєш самостійно ПЕРЕКАЗАТИ суть своїми словами, як людина яка
переказує другу "хто цей персонаж і який він" — коротко, по сенсу,
іншими словами ніж в оригіналі. Не копіюй фрази з фото, не залишай
ту саму структуру речень — повністю переформулюй.

Приклад поганого result (НЕ РОБИ ТАК): копіювання фрази з тексту майже без змін.
Приклад хорошого результату: "Бельгійський детектив, дуже педантичний,
надає перевагу логіці над фізичними доказами."

Поверни ВИКЛЮЧНО JSON без жодного додаткового тексту, маркдауну чи пояснень,
у такому форматі:
{
  "name": "ім'я персонажа, якщо вказано, інакше null",
  "description": "ПЕРЕКАЗ своїми словами, 2-4 короткі речення, без цитування оригіналу",
  "suggestedRole": "одне з: Головний, Підозрюваний, Жертва, Свідок, Другорядний, або null якщо незрозуміло",
  "tags": ["риса1", "риса2", "риса3"],
  "rawText": "весь розпізнаний текст з фото без змін — це окреме поле саме для оригіналу"
}

rawText — єдине місце де має бути оригінальний текст без змін.
description завжди повинен бути переформульований, навіть якщо це
займе трохи більше зусиль.

Якщо текст погано читається або це не схоже на опис персонажа — все одно
поверни JSON, де rawText містить те що вдалось прочитати, а інші поля null
або порожні масиви.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return res.status(502).json({ error: 'Помилка звернення до AI-сервісу' });
    }

    const result = await response.json();
    const textPart = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textPart) {
      return res.status(502).json({ error: 'AI не повернув розпізнаний текст' });
    }

    let parsed;
    try {
      parsed = JSON.parse(textPart);
    } catch {
      // Якщо модель не дотримала формат — повертаємо хоча б сирий текст,
      // щоб користувач міг скопіювати вручну, замість повної відмови.
      return res.status(200).json({
        name: null,
        description: '',
        suggestedRole: null,
        tags: [],
        rawText: textPart,
        parseWarning: true,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Recognize character error:', err);
    return res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
}
