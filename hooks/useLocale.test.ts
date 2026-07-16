import {
  describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLocale } from './useLocale';
vi.mock('@/utils/auth/cookieStore', () => ({
  cookieStore: { getLocaleTag: () => 'id-ID' },
}));
describe('useLocale', () => {
  it('returns a locale string', () => {
    const { result } = renderHook(() => useLocale());
    expect(typeof result.current).toBe('string');
    expect(result.current.length).toBeGreaterThan(0);
  });
});
