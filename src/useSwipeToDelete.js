import { useState, useRef } from 'react';

// Хук реалізує жест "свайп ліворуч → з'являється червона кнопка видалити".
// Логіка побудована на touch-подіях (підходить для мобільного Telegram
// WebView) з fallback на мишу для десктоп-тестування.
//
// Дві поведінки залежно від того, наскільки далеко потягнули:
// - короткий свайп (між OPEN_THRESHOLD і DELETE_THRESHOLD): картка
//   фіксується відкритою з червоною кнопкою, яку треба тапнути окремо.
// - довгий свайп (за DELETE_THRESHOLD): видалення спрацьовує одразу
//   при відпусканні пальця, без додаткового тапу — це стандартна
//   поведінка "потягнув далеко = підтвердив дію" з багатьох застосунків.
//
// MAX_SWIPE — на скільки пікселів максимально відсувається картка коли
// зафіксована ВІДКРИТОЮ (короткий свайп). Під час самого перетягування
// дозволяємо тягнути далі за це значення (до DRAG_LIMIT), щоб користувач
// фізично відчував різницю між "відкрити" і "видалити" жестами.
const MAX_SWIPE = 76;
const OPEN_THRESHOLD = MAX_SWIPE * 0.4;
const DELETE_THRESHOLD = MAX_SWIPE * 2.2; // потягнути значно далі ширини кнопки = видалити одразу
const DRAG_LIMIT = DELETE_THRESHOLD + 40; // невеликий запас, щоб рух не зупинявся різко на самому порозі

export function useSwipeToDelete(onDelete) {
  const [offset, setOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [pastDeleteThreshold, setPastDeleteThreshold] = useState(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const draggingRef = useRef(false);

  function handleStart(clientX) {
    draggingRef.current = true;
    startXRef.current = clientX;
    startOffsetRef.current = offset;
  }

  function handleMove(clientX) {
    if (!draggingRef.current) return;
    const delta = clientX - startXRef.current;
    let next = startOffsetRef.current + delta;
    // Під час руху дозволяємо тягнути аж до DRAG_LIMIT (далі за MAX_SWIPE) —
    // саме це дає змогу розрізнити короткий і довгий свайп.
    next = Math.max(-DRAG_LIMIT, Math.min(0, next));
    setOffset(next);
    setPastDeleteThreshold(next < -DELETE_THRESHOLD);
  }

  function handleEnd() {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    if (offset < -DELETE_THRESHOLD) {
      // Потягнули достатньо далеко — видаляємо без додаткового тапу.
      onDelete();
      return;
    }

    if (offset < -OPEN_THRESHOLD) {
      setOffset(-MAX_SWIPE);
      setIsOpen(true);
    } else {
      setOffset(0);
      setIsOpen(false);
    }
    setPastDeleteThreshold(false);
  }

  function close() {
    setOffset(0);
    setIsOpen(false);
    setPastDeleteThreshold(false);
  }

  function handleDeleteClick(e) {
    e.stopPropagation();
    onDelete();
  }

  // Touch handlers (мобільний — основний сценарій використання)
  const touchHandlers = {
    onTouchStart: (e) => handleStart(e.touches[0].clientX),
    onTouchMove: (e) => handleMove(e.touches[0].clientX),
    onTouchEnd: handleEnd,
  };

  // Mouse handlers (для десктоп-тестування в браузері без сенсорного екрана)
  const mouseHandlers = {
    onMouseDown: (e) => handleStart(e.clientX),
    onMouseMove: (e) => draggingRef.current && handleMove(e.clientX),
    onMouseUp: handleEnd,
    onMouseLeave: () => draggingRef.current && handleEnd(),
  };

  return {
    offset,
    isOpen,
    pastDeleteThreshold,
    close,
    handleDeleteClick,
    swipeHandlers: { ...touchHandlers, ...mouseHandlers },
    maxSwipe: MAX_SWIPE,
  };
}
