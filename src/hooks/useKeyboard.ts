import { useEffect, useRef } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

/**
 * Attaches a keydown listener that calls handlers[key] for each key press.
 * Uses a ref internally so the listener is installed once and always sees
 * the latest handlers without re-subscribing on every render.
 */
export function useKeyboard(handlers: Record<string, KeyHandler>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (handlersRef.current[key]) {
        handlersRef.current[key](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // empty — listener installed once, ref always current
}
