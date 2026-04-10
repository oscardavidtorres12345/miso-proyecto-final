import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  clearHoldCountdownEnd,
  persistHoldCountdownEnd,
  readHoldCountdownEnd,
} from '@/utils/holdCountdownStorage'
import { resolveCountdownEndMs, SESSION_COUNTDOWN_DURATION_MS } from '@/utils/sessionCountdown'

export type SessionCountdownStartOptions = {
  endsAt?: string | number | Date
}

export type SessionCountdownContextValue = {
  start: (options?: SessionCountdownStartOptions) => void
  stop: () => void
  isRunning: boolean
  remainingMs: number
  subscribeHoldExpired: (listener: () => void) => () => void
}

const SessionCountdownContext = createContext<SessionCountdownContextValue | null>(null)

export const SessionCountdownProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth()
  const userId = session?.user.user_id ?? null
  const [isRunning, setIsRunning] = useState(false)
  const [remainingMs, setRemainingMs] = useState(0)
  const endTimeRef = useRef<number | null>(null)
  const holdExpiredListenersRef = useRef(new Set<() => void>())

  const notifyHoldExpired = useCallback(() => {
    queueMicrotask(() => {
      holdExpiredListenersRef.current.forEach((fn) => {
        try {
          fn()
        } catch {}
      })
    })
  }, [])

  const subscribeHoldExpired = useCallback((listener: () => void) => {
    holdExpiredListenersRef.current.add(listener)
    return () => {
      holdExpiredListenersRef.current.delete(listener)
    }
  }, [])

  const stop = useCallback(() => {
    endTimeRef.current = null
    setIsRunning(false)
    setRemainingMs(0)
    clearHoldCountdownEnd()
  }, [])

  const start = useCallback(
    (options?: SessionCountdownStartOptions) => {
      const now = Date.now()
      const endMs =
        options?.endsAt != null
          ? resolveCountdownEndMs(options.endsAt, now)
          : now + SESSION_COUNTDOWN_DURATION_MS
      if (endMs == null || !Number.isFinite(endMs) || endMs <= now) {
        endTimeRef.current = null
        setRemainingMs(0)
        setIsRunning(false)
        clearHoldCountdownEnd()
        return
      }
      endTimeRef.current = endMs
      setRemainingMs(endMs - now)
      setIsRunning(true)
      if (session?.user.user_id != null) {
        persistHoldCountdownEnd(session.user.user_id, endMs)
      }
    },
    [session?.user.user_id],
  )

  useEffect(() => {
    if (userId == null) {
      stop()
      return
    }
    const stored = readHoldCountdownEnd()
    if (stored == null) return
    if (stored.userId !== userId) {
      clearHoldCountdownEnd()
      endTimeRef.current = null
      setIsRunning(false)
      setRemainingMs(0)
      return
    }
    const now = Date.now()
    if (stored.endMs <= now) {
      clearHoldCountdownEnd()
      notifyHoldExpired()
      return
    }
    endTimeRef.current = stored.endMs
    setRemainingMs(stored.endMs - now)
    setIsRunning(true)
  }, [userId, stop, notifyHoldExpired])

  useEffect(() => {
    if (!isRunning) return

    const tick = () => {
      const end = endTimeRef.current
      if (!end) return
      const next = Math.max(0, end - Date.now())
      setRemainingMs(next)
      if (next <= 0) {
        notifyHoldExpired()
        endTimeRef.current = null
        setIsRunning(false)
        clearHoldCountdownEnd()
      }
    }

    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [isRunning, notifyHoldExpired])

  const value: SessionCountdownContextValue = {
    start,
    stop,
    isRunning,
    remainingMs,
    subscribeHoldExpired,
  }

  return (
    <SessionCountdownContext.Provider value={value}>
      {children}
    </SessionCountdownContext.Provider>
  )
}

export const useSessionCountdown = (): SessionCountdownContextValue => {
  const ctx = useContext(SessionCountdownContext)
  if (!ctx) throw new Error('useSessionCountdown must be used within SessionCountdownProvider')
  return ctx
}
