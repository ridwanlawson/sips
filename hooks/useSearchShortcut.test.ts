import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearchShortcut } from './useSearchShortcut';

describe('useSearchShortcut', () => {
  it('returns a ref', () => {
    const { result } = renderHook(() => useSearchShortcut());
    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });
});
