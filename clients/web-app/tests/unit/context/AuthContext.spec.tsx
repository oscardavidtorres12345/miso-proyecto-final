import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { LoginResponse } from '@/services/identityService'
import { UserRole } from '@/types/user'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

const makeLoginResponse = (sessionExpiresAt: string): LoginResponse => ({
  status: 'authenticated',
  sprint: 1,
  hu_id: 'HU001',
  message: 'Login successful.',
  user: { user_id: 1, username: 'test_user', email: 'test@mail.com', role: UserRole.GUEST, is_active: true },
  permissions: ['ACCESS WEB APP'],
  session_ttl_seconds: 900,
  session_expires_at: sessionExpiresAt,
})

const futureDate = () => new Date(Date.now() + 60 * 60 * 1000).toISOString()
const pastDate = () => new Date(Date.now() - 1000).toISOString()

beforeEach(() => {
  localStorage.clear()
})

describe('AuthContext', () => {
  describe('initial state', () => {
    it('isAuthenticated is false when localStorage is empty', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.session).toBeNull()
    })

    it('restores a valid session from localStorage', () => {
      const session = {
        user: { user_id: 1, username: 'test_user', email: 'test@mail.com', role: UserRole.GUEST, is_active: true },
        permissions: ['ACCESS WEB APP'],
        sessionExpiresAt: futureDate(),
      }
      localStorage.setItem('travel-hub-auth', JSON.stringify(session))

      const { result } = renderHook(() => useAuth(), { wrapper })
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.session?.user.username).toBe('test_user')
    })

    it('ignores an expired session in localStorage', () => {
      const session = {
        user: { user_id: 1, username: 'test_user', email: 'test@mail.com', role: UserRole.GUEST, is_active: true },
        permissions: ['ACCESS WEB APP'],
        sessionExpiresAt: pastDate(),
      }
      localStorage.setItem('travel-hub-auth', JSON.stringify(session))

      const { result } = renderHook(() => useAuth(), { wrapper })
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.session).toBeNull()
    })

    it('handles malformed localStorage data gracefully', () => {
      localStorage.setItem('travel-hub-auth', 'not-valid-json')
      const { result } = renderHook(() => useAuth(), { wrapper })
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('setAuthData', () => {
    it('sets isAuthenticated to true and stores session', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => {
        result.current.setAuthData(makeLoginResponse(futureDate()))
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.session?.user.username).toBe('test_user')
      expect(result.current.session?.permissions).toContain('ACCESS WEB APP')
    })

    it('persists the session to localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })
      const expires = futureDate()

      act(() => {
        result.current.setAuthData(makeLoginResponse(expires))
      })

      const stored = JSON.parse(localStorage.getItem('travel-hub-auth')!)
      expect(stored.user.username).toBe('test_user')
      expect(stored.sessionExpiresAt).toBe(expires)
    })
  })

  describe('clearAuthData', () => {
    it('sets isAuthenticated to false', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => { result.current.setAuthData(makeLoginResponse(futureDate())) })
      expect(result.current.isAuthenticated).toBe(true)

      act(() => { result.current.clearAuthData() })
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.session).toBeNull()
    })

    it('removes the session from localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => { result.current.setAuthData(makeLoginResponse(futureDate())) })
      act(() => { result.current.clearAuthData() })

      expect(localStorage.getItem('travel-hub-auth')).toBeNull()
    })
  })

  describe('auto-logout on session expiry', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('sets isAuthenticated to false when the session timer fires', () => {
      const expiresIn = 5000
      const expiresAt = new Date(Date.now() + expiresIn).toISOString()
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => { result.current.setAuthData(makeLoginResponse(expiresAt)) })
      expect(result.current.isAuthenticated).toBe(true)

      act(() => { vi.advanceTimersByTime(expiresIn + 1) })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.session).toBeNull()
    })

    it('sets autoLoggedOut to true when the session timer fires', () => {
      const expiresIn = 5000
      const expiresAt = new Date(Date.now() + expiresIn).toISOString()
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => { result.current.setAuthData(makeLoginResponse(expiresAt)) })
      act(() => { vi.advanceTimersByTime(expiresIn + 1) })

      expect(result.current.autoLoggedOut).toBe(true)
    })

    it('removes session from localStorage when the timer fires', () => {
      const expiresIn = 5000
      const expiresAt = new Date(Date.now() + expiresIn).toISOString()
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => { result.current.setAuthData(makeLoginResponse(expiresAt)) })
      act(() => { vi.advanceTimersByTime(expiresIn + 1) })

      expect(localStorage.getItem('travel-hub-auth')).toBeNull()
    })

    it('clearAutoLoggedOut resets the autoLoggedOut flag', () => {
      const expiresIn = 5000
      const expiresAt = new Date(Date.now() + expiresIn).toISOString()
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => { result.current.setAuthData(makeLoginResponse(expiresAt)) })
      act(() => { vi.advanceTimersByTime(expiresIn + 1) })
      expect(result.current.autoLoggedOut).toBe(true)

      act(() => { result.current.clearAutoLoggedOut() })
      expect(result.current.autoLoggedOut).toBe(false)
    })

    it('does not set autoLoggedOut to true when clearAuthData is called manually', () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      act(() => { result.current.setAuthData(makeLoginResponse(futureDate())) })
      act(() => { result.current.clearAuthData() })

      expect(result.current.autoLoggedOut).toBe(false)
    })
  })
})
