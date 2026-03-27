import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import i18n from '@/i18n'
import useSignupForm from '@/hooks/useSignupForm'

beforeEach(() => { i18n.changeLanguage('es-CO') })

describe('useSignupForm', () => {
  describe('initial state', () => {
    it('starts with all fields empty', () => {
      const { result } = renderHook(() => useSignupForm())
      expect(result.current.firstName).toBe('')
      expect(result.current.lastName).toBe('')
      expect(result.current.email).toBe('')
      expect(result.current.password).toBe('')
      expect(result.current.confirmPassword).toBe('')
      expect(result.current.acceptedTerms).toBe(false)
    })

    it('starts with no visible errors', () => {
      const { result } = renderHook(() => useSignupForm())
      Object.values(result.current.errors).forEach(e => expect(e).toBeNull())
    })

    it('starts with submit disabled', () => {
      const { result } = renderHook(() => useSignupForm())
      expect(result.current.isSubmitDisabled).toBe(true)
    })
  })

  describe('required field validation', () => {
    it('shows required error on firstName after blur', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleBlur('firstName') })
      expect(result.current.errors.firstName).toBe('Este campo es obligatorio')
    })

    it('shows required error on lastName after blur', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleBlur('lastName') })
      expect(result.current.errors.lastName).toBe('Este campo es obligatorio')
    })

    it('clears firstName error when value is entered', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleBlur('firstName') })
      expect(result.current.errors.firstName).not.toBeNull()
      act(() => { result.current.setFirstName('Ana') })
      expect(result.current.errors.firstName).toBeNull()
    })

    it('does not show error before blur on required fields', () => {
      const { result } = renderHook(() => useSignupForm())
      expect(result.current.errors.firstName).toBeNull()
      expect(result.current.errors.lastName).toBeNull()
    })
  })

  describe('email validation', () => {
    it('shows required error on empty email after blur', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleBlur('email') })
      expect(result.current.errors.email).toBe('Este campo es obligatorio')
    })

    it('shows invalid format error on bad email after blur', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setEmail('notvalid')
        result.current.handleBlur('email')
      })
      expect(result.current.errors.email).toBe('Ingresa un correo electrónico válido')
    })

    it('shows no error on valid email after blur', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setEmail('ana@example.com')
        result.current.handleBlur('email')
      })
      expect(result.current.errors.email).toBeNull()
    })
  })

  describe('password validation', () => {
    it('shows required error on empty password after blur', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleBlur('password') })
      expect(result.current.errors.password).toBe('Este campo es obligatorio')
    })

    it('shows min length error for password under 8 characters', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setPassword('short')
        result.current.handleBlur('password')
      })
      expect(result.current.errors.password).toBe('La contraseña debe tener al menos 8 caracteres')
    })

    it('shows no error for password with 8 or more characters', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setPassword('longenough')
        result.current.handleBlur('password')
      })
      expect(result.current.errors.password).toBeNull()
    })
  })

  describe('confirmPassword validation', () => {
    it('shows required error on empty confirmPassword after blur', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleBlur('confirmPassword') })
      expect(result.current.errors.confirmPassword).toBe('Este campo es obligatorio')
    })

    it('shows mismatch error when passwords differ after blur', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setPassword('password123')
        result.current.setConfirmPassword('different')
        result.current.handleBlur('confirmPassword')
      })
      expect(result.current.errors.confirmPassword).toBe('Las contraseñas no coinciden')
    })

    it('shows no error when passwords match', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setPassword('password123')
        result.current.setConfirmPassword('password123')
        result.current.handleBlur('confirmPassword')
      })
      expect(result.current.errors.confirmPassword).toBeNull()
    })

    it('revalidates confirmPassword error when password changes', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setPassword('password123')
        result.current.setConfirmPassword('password123')
        result.current.handleBlur('confirmPassword')
      })
      expect(result.current.errors.confirmPassword).toBeNull()
      act(() => { result.current.setPassword('different') })
      expect(result.current.errors.confirmPassword).toBe('Las contraseñas no coinciden')
    })
  })

  describe('terms validation', () => {
    it('does not show error before any interaction', () => {
      const { result } = renderHook(() => useSignupForm())
      expect(result.current.errors.terms).toBeNull()
    })

    it('shows error when handleTermsChange is called with false', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleTermsChange(false) })
      expect(result.current.errors.terms).toBe('Debes aceptar los términos y condiciones')
    })

    it('shows no error when handleTermsChange is called with true', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleTermsChange(true) })
      expect(result.current.errors.terms).toBeNull()
    })

    it('shows error after checking then unchecking', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleTermsChange(true) })
      act(() => { result.current.handleTermsChange(false) })
      expect(result.current.errors.terms).toBe('Debes aceptar los términos y condiciones')
    })
  })

  describe('isSubmitDisabled', () => {
    it('is false when all fields are valid', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setFirstName('Ana')
        result.current.setLastName('García')
        result.current.setEmail('ana@example.com')
        result.current.setPassword('password123')
        result.current.setConfirmPassword('password123')
        result.current.handleTermsChange(true)
      })
      expect(result.current.isSubmitDisabled).toBe(false)
    })

    it('remains true when terms are not accepted', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setFirstName('Ana')
        result.current.setLastName('García')
        result.current.setEmail('ana@example.com')
        result.current.setPassword('password123')
        result.current.setConfirmPassword('password123')
      })
      expect(result.current.isSubmitDisabled).toBe(true)
    })

    it('remains true when passwords do not match', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setFirstName('Ana')
        result.current.setLastName('García')
        result.current.setEmail('ana@example.com')
        result.current.setPassword('password123')
        result.current.setConfirmPassword('different')
        result.current.handleTermsChange(true)
      })
      expect(result.current.isSubmitDisabled).toBe(true)
    })

    it('remains true when password is too short', () => {
      const { result } = renderHook(() => useSignupForm())
      act(() => {
        result.current.setFirstName('Ana')
        result.current.setLastName('García')
        result.current.setEmail('ana@example.com')
        result.current.setPassword('short')
        result.current.setConfirmPassword('short')
        result.current.handleTermsChange(true)
      })
      expect(result.current.isSubmitDisabled).toBe(true)
    })
  })

  describe('i18n', () => {
    it('returns error messages in English when language is en-US', () => {
      i18n.changeLanguage('en-US')
      const { result } = renderHook(() => useSignupForm())
      act(() => { result.current.handleBlur('firstName') })
      expect(result.current.errors.firstName).toBe('This field is required')
    })
  })
})
