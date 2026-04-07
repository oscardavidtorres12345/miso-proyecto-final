import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SESSION_COUNTDOWN_DURATION_MS } from '@/utils/sessionCountdown'

export type SessionCountdownContextValue = {
  start: () => void
  stop: () => void
  isRunning: boolean
  remainingMs: number
}

const SessionCountdownContext = createContext<SessionCountdownContextValue | null>(null)

export const SessionCountdownProvider = ({ children }: { children: React.ReactNode }) => {
  const [isRunning, setIsRunning] = useState(false)
  const [remainingMs, setRemainingMs] = useState(0)
  const endTimeRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    endTimeRef.current = null
    setIsRunning(false)
    setRemainingMs(0)
  }, [])

  const start = useCallback(() => {
    endTimeRef.current = Date.now() + SESSION_COUNTDOWN_DURATION_MS
    setRemainingMs(SESSION_COUNTDOWN_DURATION_MS)
    setIsRunning(true)
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const tick = () => {
      const end = endTimeRef.current
      if (!end) return
      const next = Math.max(0, end - Date.now())
      setRemainingMs(next)
      if (next <= 0) {
        endTimeRef.current = null
        setIsRunning(false)
      }
    }

    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [isRunning])

  const value: SessionCountdownContextValue = {
    start,
    stop,
    isRunning,
    remainingMs,
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
