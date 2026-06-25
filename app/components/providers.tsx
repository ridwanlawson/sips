'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import AuthExpiryChecker from './auth-expiry-checker';
import { isAuthErrorResponse, logoutAndRedirect } from '@/utils/authHelper';
import { getCsrfToken } from '@/lib/fetchWithCsrf';

declare global {
  interface Window {
    __authFetchInterceptorInstalled?: boolean;
  }
}

// Create QueryClient once at module level.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
      },
    },
  });
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Keep QueryClient stable across renders.
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = makeQueryClient();
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Install the interceptor only once per session.
    if (window.__authFetchInterceptorInstalled) return;
    window.__authFetchInterceptorInstalled = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let requestInit = init;

      // Automatically inject CSRF token for state-changing requests (CWE-352)
      // Note: We skip 'force-logout' to ensure sessions can always be cleared.
      const url = input instanceof Request ? input.url : String(input);
      const isForceLogout = url.includes('/api/auth/force-logout');

      const method = (
        init?.method || (input instanceof Request ? input.method : 'GET')
      ).toUpperCase();

      if (!isForceLogout && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
          const headers = new Headers(
            init?.headers || (input instanceof Request ? input.headers : {})
          );
          if (!headers.has('X-CSRF-Token')) {
            headers.set('X-CSRF-Token', csrfToken);
            requestInit = { ...init, headers };
          }
        }
      }

      const response = await originalFetch(input, requestInit);

      // Clone before checking so downstream callers can still read the body.
      if (await isAuthErrorResponse(response.clone())) {
        logoutAndRedirect();
      }
      return response;
    };

    // No cleanup needed; the interceptor should stay active for the session.
  }, []);

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <AuthExpiryChecker />
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          // Keep toast duration short enough to avoid stacking.
          duration: 3000,
          style: { maxWidth: '400px' },
        }}
      />
    </QueryClientProvider>
  );
}
