// Telegram Mini App автоматично передає дані поточного користувача
// через window.Telegram.WebApp, як тільки сторінка завантажена в Telegram.
// Це і є наш "логін" — жодного пароля, жодної реєстрації.

export function getTelegramUserId() {
  const tg = window.Telegram?.WebApp;
  const id = tg?.initDataUnsafe?.user?.id;

  if (id) return String(id);

  // Якщо застосунок відкритий поза Telegram (наприклад для розробки
  // в звичайному браузері) — використовуємо фіксований id, щоб можна
  // було тестувати локально без помилок.
  return 'dev-local-user';
}

export function getTelegramUserInfo() {
  const tg = window.Telegram?.WebApp;
  return tg?.initDataUnsafe?.user || null;
}

export function initTelegramApp() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand(); // розгортає застосунок на весь екран Telegram
  }
}
