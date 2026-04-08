import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SessionCountdownProvider,
  useSessionCountdown,
} from '@/context/SessionCountdownContext'
import { SESSION_COUNTDOWN_DURATION_MS } from '@/utils/sessionCountdown'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SessionCountdownProvider>{children}</SessionCountdownProvider>
)

describe('SessionCountdownContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('throws when useSessionCountdown is used outside SessionCountdownProvider', () => {
    expect(() => renderHook(() => useSessionCountdown())).toThrow(
      /SessionCountdownProvider/,
    )
  })

  it('starts with countdown not running and zero remaining', () => {
    const { result } = renderHook(() => useSessionCountdown(), { wrapper })
    expect(result.current.isRunning).toBe(false)
    expect(result.current.remainingMs).toBe(0)
  })

  it('start sets running and remaining to full duration', () => {
    const { result } = renderHook(() => useSessionCountdown(), { wrapper })
    act(() => {
      result.current.start()
    })
    expect(result.current.isRunning).toBe(true)
    expect(result.current.remainingMs).toBe(SESSION_COUNTDOWN_DURATION_MS)
  })

  it('stop clears running state and remaining time', () => {
    const { result } = renderHook(() => useSessionCountdown(), { wrapper })
    act(() => {
      result.current.start()
    })
    act(() => {
      result.current.stop()
    })
    expect(result.current.isRunning).toBe(false)
    expect(result.current.remainingMs).toBe(0)
  })

  it('ticks down remaining time on interval', () => {
    const { result } = renderHook(() => useSessionCountdown(), { wrapper })
    act(() => {
      result.current.start()
    })
    const afterStart = result.current.remainingMs
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.remainingMs).toBeLessThan(afterStart)
    expect(result.current.remainingMs).toBeGreaterThanOrEqual(0)
  })

  it('stops when countdown reaches zero', () => {
    const { result } = renderHook(() => useSessionCountdown(), { wrapper })
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(SESSION_COUNTDOWN_DURATION_MS + 500)
    })
    expect(result.current.isRunning).toBe(false)
    expect(result.current.remainingMs).toBe(0)
  })
})
