/**
 * Fetch Helper dengan CSRF Token Otomatis
 * Mengambil CSRF token dari cookie dan menyertakannya di header
 */
'use client';

import { cookieStore } from '@/utils/cookieStore';

/**
 * Get CSRF token from document.cookie
 */
export function getCsrfToken(): string | null {
  // ⚡ Bolt Optimization: Use centralized and optimized CSRF token retrieval.
  return cookieStore.getCsrfToken() || null;
}

/**
 * Default headers dengan CSRF token
 */
export function getDefaultHeaders(): Record<string, string> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
}

/**
 * Fetch dengan CSRF token otomatis
 */
export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init?: RequestInit & { includeCredentials?: boolean }
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const csrfToken = getCsrfToken();

  if (csrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}

/**
 * Generic HTTP request with automatic CSRF token injection.
 * Replaces the duplicated postWithCsrf / putWithCsrf / deleteWithCsrf wrappers.
 */
export async function requestWithCsrf(
  method: string,
  url: string,
  body?: unknown,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...additionalHeaders,
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
}

/** @deprecated Use `requestWithCsrf('POST', ...)` instead. */
export function postWithCsrf(
  url: string,
  body: unknown,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  return requestWithCsrf('POST', url, body, additionalHeaders);
}

/** @deprecated Use `requestWithCsrf('PUT', ...)` instead. */
export function putWithCsrf(
  url: string,
  body: unknown,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  return requestWithCsrf('PUT', url, body, additionalHeaders);
}

/** @deprecated Use `requestWithCsrf('DELETE', ...)` instead. */
export function deleteWithCsrf(
  url: string,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  return requestWithCsrf('DELETE', url, undefined, additionalHeaders);
}

/**
 * @deprecated Global fetch monkey-patching is dangerous:
 * - Mutates global `window.fetch` with no cleanup
 * - Breaks testability (patched fetch leaks across test cases)
 * - Not a real React hook (violates Rules of Hooks)
 *
 * Use the explicit wrappers (`postWithCsrf`, `putWithCsrf`, etc.) instead.
 * Scheduled for removal.
 */
export function useCsrfFetchInterception(): void {
  if (typeof window === 'undefined') return;
  const originalFetch = window.fetch;

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (init?.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(init.method.toUpperCase())) {
      const headers = new Headers(init.headers);
      const csrfToken = getCsrfToken();

      if (csrfToken && !headers.has('X-CSRF-Token')) {
        headers.set('X-CSRF-Token', csrfToken);
      }

      return originalFetch.call(window, input, {
        ...init,
        headers,
        credentials: init.credentials || 'include',
      });
    }

    return originalFetch.call(window, input, init);
  };
}
