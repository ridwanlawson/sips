/**
 * Fetch Helper dengan CSRF Token Otomatis
 * Mengambil CSRF token dari cookie dan menyertakannya di header
 */
'use client';

/**
 * Get CSRF token from document.cookie
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}


