// Vercel Serverless Function — /api/recognize-voice
//
// Приймає аудіо (base64) записане прямо в Mini App на картці персонажа.
// Gemini API розшифровує мову І одразу розбирає сказане на сегменти —
// кожен сегмент позначений куди він стосується (характеристика чи подія)
// і про кого (поточний персонаж, чи інше ім'я яке варто перевірити).
//
// Принцип лишається той самий: AI лише ПРОПОНУЄ розбір, фронтенд показує
// кожен сегмент користувачу окремо для підтвердження/редагування/відхилення
// перед збереженням — нічого не йде в базу автоматично.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не підтримується' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY не налаштований на сервері' });
  }

  const { audioBase64, mimeType, currentCharacterName } = req.body || {};
  if (!audioBase64) {
    return res.status(400).json({ error: 'Не передано аудіо' });
  }
  if (!currentCharacterName) {
    return res.status(400).json({ error: 'Не передано ім\'я поточного персонажа' });
  }

  const prompt = `Це голосове повідомлення від людини, яка читає книгу і записує
думки про персонажа під час паузи в читанні. Зараз відкрита картка персонажа
"${currentCharacterName}" — саме цей персонаж є "головним" для цього запису,
якщо мовець не назвав явно когось іншого.

Спочатку розшифруй мову українською. Потім розбий сказане на окремі логічні
сегменти — кожен сегмент це одне закінчене твердження, яке стосується ОДНОГО
персонажа і ОДНОГО типу інформації (характеристика ОСОБИСТОСТІ/зовнішності,
або ПОДІЯ яку він зробив/де був).

Приклад: людина каже "Пуаро вбив місіс Дебінгем, у нього сіре волосся, він
прагматичний" (а відкрита картка Пуаро) — це розбивається на:
1. Сегмент про дію "вбив місіс Дебінгем" → подія, стосується Пуаро (бо це
   його дія), АЛЕ згадане інше ім'я "місіс Дебінгем" — обов'язково познач
   це в полі mentionedOtherName, бо вона теж персонаж і про неї варто
   запитати користувача окремо.
2. Сегмент "сіре волосся, прагматичний" → характеристика, стосується Пуаро.

Поверни ВИКЛЮЧНО JSON без жодного додаткового тексту чи маркдауну:
{
  "transcript": "повна розшифровка сказаного, без змін",
  "segments": [
    {
      "text": "ПЕРЕКАЗ цього сегменту своїми словами, коротко, не цитата",
      "field": "description" або "events",
      "characterName": "${currentCharacterName}, або інше ім'я ЯКЩО мовець явно сказав що це стосується когось іншого",
      "mentionedOtherName": "ім'я іншого персонажа згаданого в цьому сегменті, якщо є, інакше null"
    }
  ]
}

Якщо все висловлювання стосується тільки поточного персонажа і одного типу
інформації — поверни один сегмент, не треба штучно ділити. Якщо мова
незрозуміла чи не стосується персонажа взагалі — поверни порожній масив
segments, але transcript заповни тим що вдалось розпізнати.`;

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
                    mime_type: mimeType || 'audio/webm',
                    data: audioBase64,
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
      return res.status(502).json({ error: 'AI не повернув результат розпізнавання' });
    }

    let parsed;
    try {
      parsed = JSON.parse(textPart);
    } catch {
      return res.status(200).json({
        transcript: textPart,
        segments: [],
        parseWarning: true,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Recognize voice error:', err);
    return res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
}
