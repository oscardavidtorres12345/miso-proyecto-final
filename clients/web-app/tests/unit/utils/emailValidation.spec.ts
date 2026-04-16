import { describe, it, expect } from 'vitest'
import { isValidEmail, validateEmailKey } from '@/utils/emailValidation'

describe('emailValidation', () => {
  describe('isValidEmail', () => {
    it('returns true for a typical valid address', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
    })

    it('returns false for empty or whitespace', () => {
      expect(isValidEmail('')).toBe(false)
      expect(isValidEmail('   ')).toBe(false)
    })

    it('returns false when format is invalid', () => {
      expect(isValidEmail('not-an-email')).toBe(false)
      expect(isValidEmail('missing@domain')).toBe(false)
      expect(isValidEmail('@nodomain.com')).toBe(false)
    })

    it('trims before validating', () => {
      expect(isValidEmail('  a@b.co  ')).toBe(true)
    })
  })

  describe('validateEmailKey', () => {
    it('returns validation.required when empty', () => {
      expect(validateEmailKey('')).toBe('validation.required')
      expect(validateEmailKey('  ')).toBe('validation.required')
    })

    it('returns validation.emailInvalid when format is wrong', () => {
      expect(validateEmailKey('bad')).toBe('validation.emailInvalid')
    })

    it('returns null when valid', () => {
      expect(validateEmailKey('ok@mail.com')).toBe(null)
    })
  })
})
