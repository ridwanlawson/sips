import { describe, it, expect } from 'vitest';
import { toTitleCase } from './textManipulation';

describe('textManipulation', () => {
  describe('toTitleCase', () => {
    it('should convert lowercase string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should handle multiple spaces', () => {
      expect(toTitleCase('hello   world')).toBe('Hello World');
    });

    it('should handle already title cased strings', () => {
      expect(toTitleCase('Hello World')).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(toTitleCase('')).toBe('');
    });
  });
});
