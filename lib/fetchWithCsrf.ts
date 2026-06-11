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

  // Set credentials jika diperlukan
  if (init?.includeCredentials || headers.has('Authorization')) {
    headers.set('Credentials', 'include');
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init?.includeCredentials ? 'include' : 'same-origin',
  });
}

/**
 * POST fetch dengan CSRF token
 */
export async function postWithCsrf(
  url: string,
  body: unknown,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...additionalHeaders,
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
  });
}

/**
 * PUT fetch dengan CSRF token
 */
export async function putWithCsrf(
  url: string,
  body: unknown,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...additionalHeaders,
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
  });
}

/**
 * DELETE fetch dengan CSRF token
 */
export async function deleteWithCsrf(
  url: string,
  additionalHeaders: Record<string, string> = {}
): Promise<Response> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...additionalHeaders,
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch(url, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });
}

/**
 * Hook untuk menambahkan CSRF token ke semua fetch requests
 * Digunakan di useEffect untuk setup global fetch interception
 */
export function useCsrfFetchInterception(): void {
  // Note: Ini hanya pekerjaan di client-side
  if (typeof window !== 'undefined') {
    // Simpan fetch asli
    const originalFetch = window.fetch;

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      // Hanya tambah CSRF untuk POST, PUT, DELETE
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
}
