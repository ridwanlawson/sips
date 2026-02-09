import { describe, it, expect } from 'vitest'
import { getTodayISO, formatDateISO } from './datetime'

describe('datetime', () => {
  describe('formatDateISO', () => {
    it('should format date correctly', () => {
      const date = new Date(2023, 0, 1) // Jan 1, 2023
      expect(formatDateISO(date)).toBe('2023-01-01')
    })
  })

  describe('getTodayISO', () => {
    it('should return a string in YYYY-MM-DD format', () => {
      const today = getTodayISO()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
