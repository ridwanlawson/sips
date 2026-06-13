'use client';

import { useEffect, useRef } from 'react';

/**
 * 🎨 Palette Enhancement: useSearchShortcut hook.
 * Adds a keyboard shortcut (default '/') to focus an input element.
 */
export const useSearchShortcut = (shortcut: string = '/') => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is already typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput) return;

      if (e.key === shortcut) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut]);

  return inputRef;
};
