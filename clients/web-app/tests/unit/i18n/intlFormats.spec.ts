import { describe, it, expect, beforeEach } from 'vitest'
import i18n, { LANGUAGE_MAP } from '@/i18n'

// Locale → expected currency per TravelHub country configuration
const LOCALE_CURRENCY: Record<string, string> = {
  'es-CO': 'COP',
  'es-AR': 'ARS',
  'en-US': 'USD',
}

const SUPPORTED_LOCALES = ['es-CO', 'es-AR', 'en-US'] as const

beforeEach(() => {
  i18n.changeLanguage('es-CO')
})

describe('Intl API format validation', () => {
  describe('BCP 47 locale codes', () => {
    it('LANGUAGE_MAP values are valid BCP 47 codes for Intl.DateTimeFormat', () => {
      for (const locale of Object.values(LANGUAGE_MAP)) {
        expect(() => new Intl.DateTimeFormat(locale), `Invalid locale: ${locale}`).not.toThrow()
      }
    })

    it('LANGUAGE_MAP values are valid BCP 47 codes for Intl.NumberFormat', () => {
      for (const locale of Object.values(LANGUAGE_MAP)) {
        expect(() => new Intl.NumberFormat(locale), `Invalid locale: ${locale}`).not.toThrow()
      }
    })

    it('all supported locales are registered in LANGUAGE_MAP', () => {
      const mapValues = new Set(Object.values(LANGUAGE_MAP))
      for (const locale of SUPPORTED_LOCALES) {
        expect(mapValues.has(locale), `${locale} missing from LANGUAGE_MAP`).toBe(true)
      }
    })

    it('LANGUAGE_MAP contains exactly 3 country entries', () => {
      expect(Object.keys(LANGUAGE_MAP)).toHaveLength(3)
    })
  })

  describe('Currency formatting', () => {
    it.each(Object.entries(LOCALE_CURRENCY))(
      '%s formats amounts with %s currency without error',
      (locale, currency) => {
        const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency })
        const result = formatter.format(1000)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      }
    )

    it('en-US USD uses comma as thousands separator and period as decimal', () => {
      const result = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(1234.56)
      expect(result).toMatch(/1,234/)
      expect(result).toMatch(/\.56/)
    })

    it('es-CO COP formats with non-period decimal separator', () => {
      const result = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
      }).format(1234.5)
      // Spanish locales do not use period as decimal separator
      expect(result).not.toMatch(/\.\d{1,2}$/)
    })

    it('es-AR ARS formats with non-period decimal separator', () => {
      const result = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(1234.5)
      expect(result).not.toMatch(/\.\d{1,2}$/)
    })

    it('en-US and es-CO currency formats are different for the same number', () => {
      const enResult = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(1234.56)
      const esResult = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
      }).format(1234.56)
      expect(enResult).not.toBe(esResult)
    })
  })

  describe('Number formatting', () => {
    it('en-US uses comma as thousands separator and period as decimal', () => {
      const result = new Intl.NumberFormat('en-US').format(1234567.89)
      expect(result).toBe('1,234,567.89')
    })

    it('es-CO uses a non-comma character as decimal separator', () => {
      const result = new Intl.NumberFormat('es-CO').format(1234.5)
      // Decimal separator should be comma, not period
      expect(result).toMatch(/,/)
      expect(result).not.toMatch(/\.\d$/)
    })

    it('es-AR uses a non-comma character as decimal separator', () => {
      const result = new Intl.NumberFormat('es-AR').format(1234.5)
      expect(result).toMatch(/,/)
      expect(result).not.toMatch(/\.\d$/)
    })

    it('number formatting differs between en-US and es-CO', () => {
      const en = new Intl.NumberFormat('en-US').format(1234567.89)
      const es = new Intl.NumberFormat('es-CO').format(1234567.89)
      expect(en).not.toBe(es)
    })

    it('number formatting differs between en-US and es-AR', () => {
      const en = new Intl.NumberFormat('en-US').format(1234567.89)
      const ar = new Intl.NumberFormat('es-AR').format(1234567.89)
      expect(en).not.toBe(ar)
    })
  })

  describe('Date formatting', () => {
    const testDate = new Date(2025, 11, 25) // 25 Dec 2025

    it.each(SUPPORTED_LOCALES)('%s formats dates without error', (locale) => {
      expect(
        () => new Intl.DateTimeFormat(locale).format(testDate),
        `Date formatting failed for ${locale}`
      ).not.toThrow()
    })

    it('en-US places the month (12) before the day (25)', () => {
      const result = new Intl.DateTimeFormat('en-US').format(testDate)
      // en-US default: 12/25/2025
      const monthIdx = result.indexOf('12')
      const dayIdx = result.indexOf('25')
      expect(monthIdx).toBeGreaterThanOrEqual(0)
      expect(dayIdx).toBeGreaterThanOrEqual(0)
      expect(monthIdx).toBeLessThan(dayIdx)
    })

    it('es-CO places the day (25) before the month (12)', () => {
      const result = new Intl.DateTimeFormat('es-CO').format(testDate)
      // es-CO default: 25/12/2025
      const dayIdx = result.indexOf('25')
      const monthIdx = result.indexOf('12')
      expect(dayIdx).toBeGreaterThanOrEqual(0)
      expect(monthIdx).toBeGreaterThanOrEqual(0)
      expect(dayIdx).toBeLessThan(monthIdx)
    })

    it('es-AR places the day (25) before the month (12)', () => {
      const result = new Intl.DateTimeFormat('es-AR').format(testDate)
      const dayIdx = result.indexOf('25')
      const monthIdx = result.indexOf('12')
      expect(dayIdx).toBeGreaterThanOrEqual(0)
      expect(monthIdx).toBeGreaterThanOrEqual(0)
      expect(dayIdx).toBeLessThan(monthIdx)
    })

    it('date formats differ between en-US and es-CO', () => {
      const en = new Intl.DateTimeFormat('en-US').format(testDate)
      const es = new Intl.DateTimeFormat('es-CO').format(testDate)
      expect(en).not.toBe(es)
    })

    it('formats dates with short month style without error in all supported locales', () => {
      const date = new Date(2025, 5, 1)
      for (const locale of SUPPORTED_LOCALES) {
        expect(() =>
          new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
            .format(date)
        ).not.toThrow()
      }
    })
  })

  describe('Pluralization via i18next', () => {
    it('guest_one renders singular in en-US (count=1)', () => {
      i18n.changeLanguage('en-US')
      expect(i18n.t('guests.guest', { count: 1 })).toBe('1 guest')
    })

    it('guest_other renders plural in en-US (count=2)', () => {
      i18n.changeLanguage('en-US')
      expect(i18n.t('guests.guest', { count: 2 })).toBe('2 guests')
    })

    it('guest_one renders singular in es-CO (count=1)', () => {
      i18n.changeLanguage('es-CO')
      expect(i18n.t('guests.guest', { count: 1 })).toBe('1 huésped')
    })

    it('guest_other renders plural in es-CO (count=2)', () => {
      i18n.changeLanguage('es-CO')
      expect(i18n.t('guests.guest', { count: 2 })).toBe('2 huéspedes')
    })

    it('guest_one renders singular in es-AR (count=1)', () => {
      i18n.changeLanguage('es-AR')
      expect(i18n.t('guests.guest', { count: 1 })).toBe('1 huésped')
    })

    it('guest_other renders plural in es-AR (count=2)', () => {
      i18n.changeLanguage('es-AR')
      expect(i18n.t('guests.guest', { count: 2 })).toBe('2 huéspedes')
    })

    it('guestCount_one renders singular in en-US (count=1)', () => {
      i18n.changeLanguage('en-US')
      expect(i18n.t('bookings.guestCount', { count: 1 })).toBe('1 guest')
    })

    it('guestCount_other renders plural in en-US (count=3)', () => {
      i18n.changeLanguage('en-US')
      expect(i18n.t('bookings.guestCount', { count: 3 })).toBe('3 guests')
    })
  })
})
