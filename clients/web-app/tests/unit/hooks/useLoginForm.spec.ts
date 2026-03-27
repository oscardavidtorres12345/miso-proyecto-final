import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import useLoginForm from '@/hooks/useLoginForm'

beforeEach(() => { i18n.changeLanguage('es-CO') })

describe('useLoginForm', () => {
  describe('initial state', () => {
    it('starts with empty email and password', () => {
      const { result } = renderHook(() => useLoginForm())
      expect(result.current.email).toBe('')
      expect(result.current.password).toBe('')
    })

    it('starts with no visible errors', () => {
      const { result } = renderHook(() => useLoginForm())
      expect(result.current.errors.email).toBeNull()
      expect(result.current.errors.password).toBeNull()
    })

    it('starts with submit disabled', () => {
      const { result } = renderHook(() => useLoginForm())
      expect(result.current.isSubmitDisabled).toBe(true)
    })
  })

  describe('setEmail / setPassword', () => {
    it('updates email value', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.setEmail('test@example.com') })
      expect(result.current.email).toBe('test@example.com')
    })

    it('updates password value', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.setPassword('secret') })
      expect(result.current.password).toBe('secret')
    })
  })

  describe('email validation', () => {
    it('does not show error before blur', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.setEmail('notanemail') })
      expect(result.current.errors.email).toBeNull()
    })

    it('shows required error after blur on empty email', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.handleBlur('email') })
      expect(result.current.errors.email).toBe('Este campo es obligatorio')
    })

    it('shows invalid format error after blur on bad email', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => {
        result.current.setEmail('notanemail')
        result.current.handleBlur('email')
      })
      expect(result.current.errors.email).toBe('Ingresa un correo electrónico válido')
    })

    it('shows no error after blur on valid email', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => {
        result.current.setEmail('user@example.com')
        result.current.handleBlur('email')
      })
      expect(result.current.errors.email).toBeNull()
    })

    it('clears error when valid email is entered after blur', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.handleBlur('email') })
      expect(result.current.errors.email).not.toBeNull()
      act(() => { result.current.setEmail('user@example.com') })
      expect(result.current.errors.email).toBeNull()
    })
  })

  describe('password validation', () => {
    it('does not show error before blur', () => {
      const { result } = renderHook(() => useLoginForm())
      expect(result.current.errors.password).toBeNull()
    })

    it('shows required error after blur on empty password', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.handleBlur('password') })
      expect(result.current.errors.password).toBe('Este campo es obligatorio')
    })

    it('shows no error after blur on non-empty password', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => {
        result.current.setPassword('anyvalue')
        result.current.handleBlur('password')
      })
      expect(result.current.errors.password).toBeNull()
    })
  })

  describe('isSubmitDisabled', () => {
    it('is false when both fields are valid', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => {
        result.current.setEmail('user@example.com')
        result.current.setPassword('secret')
      })
      expect(result.current.isSubmitDisabled).toBe(false)
    })

    it('is true when only email is valid', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.setEmail('user@example.com') })
      expect(result.current.isSubmitDisabled).toBe(true)
    })

    it('is true when only password is valid', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.setPassword('secret') })
      expect(result.current.isSubmitDisabled).toBe(true)
    })

    it('is true when email has invalid format', () => {
      const { result } = renderHook(() => useLoginForm())
      act(() => {
        result.current.setEmail('bademail')
        result.current.setPassword('secret')
      })
      expect(result.current.isSubmitDisabled).toBe(true)
    })
  })

  describe('i18n', () => {
    it('returns error messages in English when language is en-US', () => {
      i18n.changeLanguage('en-US')
      const { result } = renderHook(() => useLoginForm())
      act(() => { result.current.handleBlur('email') })
      expect(result.current.errors.email).toBe('This field is required')
    })
  })
})
