import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DateRange } from 'react-day-picker'
import { formatDate, formatDateRange, parseIsoDateLocal, today } from '@/utils/searchFormat'

describe('searchFormat', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('today', () => {
    it('returns local midnight for the current system day', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2025, 5, 15, 14, 30, 45, 123))
      const d = today()
      expect(d.getFullYear()).toBe(2025)
      expect(d.getMonth()).toBe(5)
      expect(d.getDate()).toBe(15)
      expect(d.getHours()).toBe(0)
      expect(d.getMinutes()).toBe(0)
      expect(d.getSeconds()).toBe(0)
      expect(d.getMilliseconds()).toBe(0)
    })
  })

  describe('formatDate', () => {
    const sample = new Date(2025, 5, 3)

    it('formats with es-CO locale (default)', () => {
      expect(formatDate(sample)).toMatch(/^3 [A-Za-záéíóú]{3}$/)
    })

    it('formats with en-US when language is en-US', () => {
      expect(formatDate(sample, 'en-US')).toMatch(/^3 [A-Za-z]{3}$/)
    })

    it('falls back to Spanish for unknown language codes', () => {
      expect(formatDate(sample, 'xx-XX')).toBe(formatDate(sample, 'es-CO'))
    })
  })

  describe('parseIsoDateLocal', () => {
    it('parses ISO date string to the correct local day without UTC shift', () => {
      const d = parseIsoDateLocal('2026-05-15')
      expect(d.getFullYear()).toBe(2026)
      expect(d.getMonth()).toBe(4)
      expect(d.getDate()).toBe(15)
    })

    it('parses first day of year correctly', () => {
      const d = parseIsoDateLocal('2025-01-01')
      expect(d.getFullYear()).toBe(2025)
      expect(d.getMonth()).toBe(0)
      expect(d.getDate()).toBe(1)
    })

    it('parses last day of year correctly', () => {
      const d = parseIsoDateLocal('2025-12-31')
      expect(d.getFullYear()).toBe(2025)
      expect(d.getMonth()).toBe(11)
      expect(d.getDate()).toBe(31)
    })

    it('produces a date that formatDate renders correctly', () => {
      const d = parseIsoDateLocal('2026-05-19')
      const label = formatDate(d, 'es-CO')
      expect(label).toMatch(/^19/)
    })
  })

  describe('formatDateRange', () => {
    it('returns null when range is undefined', () => {
      expect(formatDateRange(undefined)).toBeNull()
    })

    it('returns null when from is missing', () => {
      expect(
        formatDateRange({ to: new Date(2025, 0, 1) } as DateRange),
      ).toBeNull()
    })

    it('returns single formatted date when only from is set', () => {
      const from = new Date(2025, 0, 10)
      expect(formatDateRange({ from, to: undefined })).toBe(formatDate(from, 'es-CO'))
    })

    it('returns range string when both ends are set', () => {
      const from = new Date(2025, 0, 10)
      const to = new Date(2025, 0, 12)
      expect(formatDateRange({ from, to }, 'es-CO')).toBe(
        `${formatDate(from, 'es-CO')} - ${formatDate(to, 'es-CO')}`
      )
    })
  })
})
