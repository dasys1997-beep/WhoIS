import { useState, useRef } from 'react';

// Одноступеневий свайп-видалення: тягнеш ліворуч, червона зона росте
// разом з пальцем (без зупинки на проміжній "відкритій" позиції). Якщо
// в момент відпускання пройдено DELETE_THRESHOLD — картка видаляється
// одразу. Якщо ні — плавно повертається на нуль. Ніякої фіксованої
// кнопки, яку треба тапати окремо.
const DELETE_THRESHOLD = 130; // скільки пікселів треба протягнути, щоб спрацювало видалення
const DRAG_LIMIT = DELETE_THRESHOLD + 50; // невеликий запас руху за порогом, щоб жест не "впирався" різко

export function useSwipeToDelete(onDelete) {
  const [offset, setOffset] = useState(0);
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
    next = Math.max(-DRAG_LIMIT, Math.min(0, next));
    setOffset(next);
    setPastDeleteThreshold(next < -DELETE_THRESHOLD);
  }

  function handleEnd() {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    if (offset < -DELETE_THRESHOLD) {
      onDelete();
      return;
    }

    // Не дійшли до порогу — картка плавно повертається на місце.
    setOffset(0);
    setPastDeleteThreshold(false);
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
    pastDeleteThreshold,
    swipeHandlers: { ...touchHandlers, ...mouseHandlers },
    deleteThreshold: DELETE_THRESHOLD,
  };
}
