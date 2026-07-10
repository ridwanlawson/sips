'use client';

import { useEffect } from 'react';
import { logoutAndRedirect } from '@/utils/authHelper';

/**
 * Reads token expiry from the server via a lightweight endpoint.
 * The auth_token cookie is httpOnly so it cannot be read by client-side JS.
 */
interface CheckExpiryResponse {
  tokenPresent: boolean;
  expired: boolean;
  exp: number | null;
}

async function fetchTokenExpiry(): Promise<CheckExpiryResponse> {
  try {
    const res = await fetch('/api/auth/check-expiry', { credentials: 'include' });
    if (!res.ok) return { tokenPresent: false, expired: false, exp: null };
    return await res.json() as CheckExpiryResponse;
  } catch {
    return { tokenPresent: false, expired: false, exp: null };
  }
}

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/forgot-password']);

export default function AuthExpiryChecker() {
  useEffect(() => {
    // Don't act on public pages — the middleware already handles routing there.
    if (PUBLIC_PATHS.has(window.location.pathname)) return;

    let cancelled = false;

    const check = async () => {
      const { tokenPresent, expired, exp } = await fetchTokenExpiry();
      if (cancelled) return;

      // No session at all — nothing to check.
      if (!tokenPresent) return;

      if (expired) {
        logoutAndRedirect();
        return;
      }

      if (exp !== null) {
        const nowSec = Math.floor(Date.now() / 1000);
        const msUntilExpiry = (exp - nowSec) * 1000;
        // Limit to 24 hours to avoid setTimeout overflow.
        const delay = Math.min(msUntilExpiry, 24 * 60 * 60 * 1000);
        if (delay > 0) {
          setTimeout(check, delay);
        }
      }
    };

    check();

    return () => { cancelled = true; };
  }, []);

  return null;
}
