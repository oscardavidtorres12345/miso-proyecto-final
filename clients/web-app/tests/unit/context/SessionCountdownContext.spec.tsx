import { useLayoutEffect } from 'react'
import { act, renderHook } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import {
  SessionCountdownProvider,
  useSessionCountdown,
} from '@/context/SessionCountdownContext'
import { SESSION_COUNTDOWN_DURATION_MS } from '@/utils/sessionCountdown'

const seedAuthSession = (userId = 99) => {
  localStorage.setItem(
    'travel-hub-auth',
    JSON.stringify({
      user: {
        user_id: userId,
        username: 't',
        email: 't@t.com',
        role: 'GUEST',
        is_active: true,
      },
      permissions: [],
      sessionExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    }),
  )
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <SessionCountdownProvider>{children}</SessionCountdownProvider>
  </AuthProvider>
)

describe('SessionCountdownContext', () => {
  beforeEach(() => {
    localStorage.clear()
    seedAuthSession()
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
    expect(localStorage.getItem('travelhub_hold_countdown_v1')).toBeNull()
  })

  it('start with endsAt uses server end time', () => {
    const t0 = 1_700_000_000_000
    vi.setSystemTime(t0)
    const end = t0 + 120_000
    const { result } = renderHook(() => useSessionCountdown(), { wrapper })
    act(() => {
      result.current.start({ endsAt: end })
    })
    expect(result.current.isRunning).toBe(true)
    expect(result.current.remainingMs).toBe(120_000)
  })

  it('persists end time and restores after remount', () => {
    const t0 = 1_700_000_000_000
    vi.setSystemTime(t0)
    const end = t0 + 600_000
    const { result, unmount } = renderHook(() => useSessionCountdown(), { wrapper })
    act(() => {
      result.current.start({ endsAt: end })
    })
    const raw = localStorage.getItem('travelhub_hold_countdown_v1')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw as string).endMs).toBe(end)

    unmount()

    const { result: result2 } = renderHook(() => useSessionCountdown(), { wrapper })
    expect(result2.current.isRunning).toBe(true)
    expect(result2.current.remainingMs).toBe(600_000)
  })

  it('does not start when endsAt is already in the past', () => {
    const t0 = 1_700_000_000_000
    vi.setSystemTime(t0)
    const { result } = renderHook(() => useSessionCountdown(), { wrapper })
    act(() => {
      result.current.start({ endsAt: t0 - 1000 })
    })
    expect(result.current.isRunning).toBe(false)
    expect(result.current.remainingMs).toBe(0)
  })

  it('invokes subscribeHoldExpired when countdown reaches zero', async () => {
    const fn = vi.fn()
    const { result } = renderHook(
      () => {
        const ctx = useSessionCountdown()
        useLayoutEffect(() => ctx.subscribeHoldExpired(fn), [ctx])
        return ctx
      },
      { wrapper },
    )
    act(() => {
      result.current.start()
    })
    act(() => {
      vi.advanceTimersByTime(SESSION_COUNTDOWN_DURATION_MS + 500)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('stop before the end does not invoke subscribeHoldExpired', async () => {
    const fn = vi.fn()
    const { result } = renderHook(
      () => {
        const ctx = useSessionCountdown()
        useLayoutEffect(() => ctx.subscribeHoldExpired(fn), [ctx])
        return ctx
      },
      { wrapper },
    )
    act(() => {
      result.current.start()
    })
    act(() => {
      result.current.stop()
    })
    act(() => {
      vi.advanceTimersByTime(SESSION_COUNTDOWN_DURATION_MS + 500)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(fn).not.toHaveBeenCalled()
  })

  it('notifies subscribers when restoring an already expired deadline', async () => {
    const listener = vi.fn()
    const t0 = 1_700_000_000_000
    vi.setSystemTime(t0 + 120_000)
    localStorage.setItem(
      'travelhub_hold_countdown_v1',
      JSON.stringify({ v: 1, userId: 99, endMs: t0 }),
    )
    renderHook(
      () => {
        const ctx = useSessionCountdown()
        useLayoutEffect(() => ctx.subscribeHoldExpired(listener), [ctx])
        return ctx
      },
      { wrapper },
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('travelhub_hold_countdown_v1')).toBeNull()
  })

  it('clears hold storage when persisted userId does not match the session', () => {
    const t0 = 1_700_000_000_000
    vi.setSystemTime(t0)
    localStorage.setItem(
      'travelhub_hold_countdown_v1',
      JSON.stringify({ v: 1, userId: 1, endMs: t0 + 600_000 }),
    )
    const { result } = renderHook(() => useSessionCountdown(), { wrapper })
    expect(localStorage.getItem('travelhub_hold_countdown_v1')).toBeNull()
    expect(result.current.isRunning).toBe(false)
  })
})
