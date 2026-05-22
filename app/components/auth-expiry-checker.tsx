'use client';

import { useEffect } from 'react';
import { logoutAndRedirect } from '@/utils/authHelper';

/** Decode the JWT payload without a library and read only the exp claim. */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/') + '===';
    const decoded = JSON.parse(atob(padded)) as Record<string, unknown>;
    return typeof decoded.exp === 'number' ? decoded.exp : null;
  } catch {
    return null;
  }
}

function getAuthTokenFromCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match('(^|;)\\s*auth_token\\s*=\\s*([^;]+)');
  return match ? decodeURIComponent(match[2] ?? '') : '';
}

export default function AuthExpiryChecker() {
  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) return;

    const exp = getTokenExpiry(token);
    if (exp === null) return;

    const nowSec = Math.floor(Date.now() / 1000);

    // Logout immediately when the token is already expired.
    if (nowSec >= exp) {
      logoutAndRedirect();
      return;
    }

    // Schedule logout when the token expires.
    const msUntilExpiry = (exp - nowSec) * 1000;
    // Limit to 24 hours to avoid setTimeout overflow.
    const delay = Math.min(msUntilExpiry, 24 * 60 * 60 * 1000);

    const timer = setTimeout(() => {
      logoutAndRedirect();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
