import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { LoginResponse } from '@/services/identityService'
import { UserRole } from '@/types/user'

const STORAGE_KEY = 'travel-hub-auth'

interface AuthUser {
  user_id: number
  username: string
  email: string
  role: UserRole
  is_active: boolean
}

interface AuthSession {
  user: AuthUser
  permissions: string[]
  sessionExpiresAt: string
}

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  autoLoggedOut: boolean
  setAuthData: (response: LoginResponse) => void
  clearAuthData: () => void
  clearAutoLoggedOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const readSession = (): AuthSession | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const session = JSON.parse(stored) as AuthSession
    if (new Date(session.sessionExpiresAt) <= new Date()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(readSession)
  const [autoLoggedOut, setAutoLoggedOut] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!session) return

    const msUntilExpiry = new Date(session.sessionExpiresAt).getTime() - Date.now()
    if (msUntilExpiry <= 0) return

    timerRef.current = setTimeout(() => {
      localStorage.removeItem(STORAGE_KEY)
      setSession(null)
      setAutoLoggedOut(true)
    }, msUntilExpiry)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [session])

  const setAuthData = (response: LoginResponse) => {
    const newSession: AuthSession = {
      user: response.user,
      permissions: response.permissions,
      sessionExpiresAt: response.session_expires_at,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession))
    setSession(newSession)
  }

  const clearAuthData = () => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }

  const clearAutoLoggedOut = () => setAutoLoggedOut(false)

  return (
    <AuthContext.Provider value={{ session, isAuthenticated: session !== null, autoLoggedOut, setAuthData, clearAuthData, clearAutoLoggedOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
