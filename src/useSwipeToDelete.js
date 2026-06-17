import { useState, useRef } from 'react';

// Хук реалізує жест "свайп ліворуч → з'являється червона кнопка видалити".
// Логіка побудована на touch-подіях (підходить для мобільного Telegram
// WebView) з fallback на мишу для десктоп-тестування.
//
// MAX_SWIPE — на скільки пікселів максимально відсувається картка,
// саме стільки ширини займає червона зона з кнопкою-кошиком.
const MAX_SWIPE = 76;
const OPEN_THRESHOLD = MAX_SWIPE * 0.4; // тягнути треба хоча б на 40% щоб зафіксувалось відкритим

export function useSwipeToDelete(onDelete) {
  const [offset, setOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
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
    // Обмежуємо діапазон: не більше MAX_SWIPE вліво, і не тягнеться вправо
    // за нульову позицію (картка не може "виїхати" за межі праворуч).
    next = Math.max(-MAX_SWIPE, Math.min(0, next));
    setOffset(next);
  }

  function handleEnd() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    // Якщо потягнули достатньо — фіксуємо у відкритому положенні,
    // інакше повертаємо назад на нуль.
    if (offset < -OPEN_THRESHOLD) {
      setOffset(-MAX_SWIPE);
      setIsOpen(true);
    } else {
      setOffset(0);
      setIsOpen(false);
    }
  }

  function close() {
    setOffset(0);
    setIsOpen(false);
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
    close,
    handleDeleteClick,
    swipeHandlers: { ...touchHandlers, ...mouseHandlers },
    maxSwipe: MAX_SWIPE,
  };
}
