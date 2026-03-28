import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import { I18nProvider, useI18n } from '@/context/I18nContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
)

beforeEach(() => {
  localStorage.clear()
  i18n.changeLanguage('es-CO')
})

describe('I18nContext', () => {
  describe('initial state without saved preference', () => {
    it('defaults to Colombia when localStorage is empty', () => {
      const { result } = renderHook(() => useI18n(), { wrapper })
      expect(result.current.selectedCountry.code).toBe('co')
    })

    it('defaults to es-CO language when localStorage is empty', () => {
      renderHook(() => useI18n(), { wrapper })
      expect(i18n.language).toBe('es-CO')
    })

    it('language matches the default country', () => {
      const { result } = renderHook(() => useI18n(), { wrapper })
      expect(result.current.language).toBe('es-CO')
    })
  })

  describe('restoring saved preference from localStorage', () => {
    it('restores Argentina when ar is saved', () => {
      localStorage.setItem('travel-hub-country', 'ar')
      const { result } = renderHook(() => useI18n(), { wrapper })
      expect(result.current.selectedCountry.code).toBe('ar')
    })

    it('restores United States when us is saved', () => {
      localStorage.setItem('travel-hub-country', 'us')
      const { result } = renderHook(() => useI18n(), { wrapper })
      expect(result.current.selectedCountry.code).toBe('us')
    })

    it('sets the correct i18n language on restore', () => {
      localStorage.setItem('travel-hub-country', 'us')
      renderHook(() => useI18n(), { wrapper })
      expect(i18n.language).toBe('en-US')
    })

    it('falls back to Colombia when an unknown code is saved', () => {
      localStorage.setItem('travel-hub-country', 'invalid')
      const { result } = renderHook(() => useI18n(), { wrapper })
      expect(result.current.selectedCountry.code).toBe('co')
    })
  })

  describe('setSelectedCountry', () => {
    it('updates the selected country', () => {
      const { result } = renderHook(() => useI18n(), { wrapper })
      act(() => {
        result.current.setSelectedCountry({ code: 'ar', label: 'Argentina' })
      })
      expect(result.current.selectedCountry.code).toBe('ar')
    })

    it('updates the language', () => {
      const { result } = renderHook(() => useI18n(), { wrapper })
      act(() => {
        result.current.setSelectedCountry({ code: 'us', label: 'Estados Unidos' })
      })
      expect(result.current.language).toBe('en-US')
    })

    it('changes the i18n language', () => {
      const { result } = renderHook(() => useI18n(), { wrapper })
      act(() => {
        result.current.setSelectedCountry({ code: 'us', label: 'Estados Unidos' })
      })
      expect(i18n.language).toBe('en-US')
    })

    it('persists the country code to localStorage', () => {
      const { result } = renderHook(() => useI18n(), { wrapper })
      act(() => {
        result.current.setSelectedCountry({ code: 'ar', label: 'Argentina' })
      })
      expect(localStorage.getItem('travel-hub-country')).toBe('ar')
    })

    it('overwrites a previously saved preference', () => {
      localStorage.setItem('travel-hub-country', 'ar')
      const { result } = renderHook(() => useI18n(), { wrapper })
      act(() => {
        result.current.setSelectedCountry({ code: 'us', label: 'Estados Unidos' })
      })
      expect(localStorage.getItem('travel-hub-country')).toBe('us')
    })
  })
})
