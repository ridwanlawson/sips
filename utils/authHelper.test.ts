import { describe, it, expect } from 'vitest';
import { isUnauthenticatedJson, clearLoginCookies } from './authHelper';

describe('authHelper', () => {
  describe('isUnauthenticatedJson', () => {
    it('returns true for unauthenticated errors', () => {
      expect(isUnauthenticatedJson({ ok: false, error: 'Unauthenticated' })).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isUnauthenticatedJson({ ok: false, error: 'Other error' })).toBe(false);
    });
  });

  describe('clearLoginCookies', () => {
    it('clears non-locale cookies in a browser environment', () => {
      const writes: string[] = [];

      Object.defineProperty(document, 'cookie', {
        configurable: true,
        get: () => 'auth_token=test; user_Level=ADM; NEXT_LOCALE=en',
        set: (value: string) => {
          writes.push(value);
        },
      });

      clearLoginCookies();

      expect(writes.some(value => value.startsWith('auth_token='))).toBe(true);
      expect(writes.some(value => value.startsWith('user_Level='))).toBe(true);
      expect(writes.some(value => value.startsWith('NEXT_LOCALE='))).toBe(false);
    });
  });
});
