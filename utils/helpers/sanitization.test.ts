import { describe, it, expect } from 'vitest';
import { isValidRedirect } from './sanitization';

describe('isValidRedirect', () => {
  it('should return true for valid relative paths', () => {
    expect(isValidRedirect('/dashboard')).toBe(true);
    expect(isValidRedirect('/profile?id=1')).toBe(true);
    expect(isValidRedirect('/')).toBe(true);
  });

  it('should return false for empty or null paths', () => {
    expect(isValidRedirect('')).toBe(false);
    expect(isValidRedirect(null)).toBe(false);
    expect(isValidRedirect(undefined)).toBe(false);
  });

  it('should return false for protocol-relative paths', () => {
    expect(isValidRedirect('//evil.com')).toBe(false);
  });

  it('should return false for absolute URLs', () => {
    expect(isValidRedirect('https://google.com')).toBe(false);
    expect(isValidRedirect('http://evil.com/dashboard')).toBe(false);
    expect(isValidRedirect('javascript:alert(1)')).toBe(false);
  });

  it('should return false for paths starting with backslash', () => {
    expect(isValidRedirect('/\\evil.com')).toBe(false);
  });
});
