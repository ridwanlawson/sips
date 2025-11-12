'use client';

import { useEffect } from 'react';

export function useThemeEffect() {
  useEffect(() => {
    // Only run on client side
    try {
      const theme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      console.error('Error setting theme:', e);
    }
  }, []);
}
