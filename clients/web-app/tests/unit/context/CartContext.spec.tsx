import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider, cartStorageKey, useCart } from '@/context/CartContext'
import { SessionCountdownProvider, useSessionCountdown } from '@/context/SessionCountdownContext'
import { I18nProvider } from '@/context/I18nContext'

const AUTH_KEY = 'travel-hub-auth'

function makeAuthSession(userId: number) {
  return {
    user: {
      user_id: userId,
      username: 'u',
      email: 'u@x',
      role: 'USER',
      is_active: true,
    },
    permissions: [],
    sessionExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  }
}

const sampleLine = () => ({
  bookingId: 'b1',
  roomId: 1,
  hotelName: 'Hotel',
  roomName: 'Room',
  image: '',
  amount: 100,
  currency: 'COP',
  checkIn: '2026-01-01',
  checkOut: '2026-01-02',
})

function wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <SessionCountdownProvider>
          <CartProvider>{children}</CartProvider>
        </SessionCountdownProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clearCart clears items and removes cart key from localStorage', async () => {
    const uid = 42
    localStorage.setItem(AUTH_KEY, JSON.stringify(makeAuthSession(uid)))
    localStorage.setItem(cartStorageKey(uid), JSON.stringify([sampleLine()]))

    const { result } = renderHook(() => useCart(), { wrapper })

    await waitFor(() => expect(result.current.itemCount).toBe(1))

    act(() => result.current.clearCart())

    expect(result.current.itemCount).toBe(0)
    expect(localStorage.getItem(cartStorageKey(uid))).toBeNull()
  })

  it('stops hold countdown when cart goes from non-empty to empty', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)

    const uid = 7
    localStorage.setItem(AUTH_KEY, JSON.stringify(makeAuthSession(uid)))

    const { result } = renderHook(
      () => ({
        cart: useCart(),
        countdown: useSessionCountdown(),
      }),
      { wrapper },
    )

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.cart.itemCount).toBe(0)

    act(() => {
      result.current.countdown.start()
    })
    expect(result.current.countdown.isRunning).toBe(true)

    act(() => {
      result.current.cart.addLineFromHold(sampleLine())
    })
    expect(result.current.cart.itemCount).toBe(1)

    act(() => {
      result.current.cart.clearCart()
    })

    expect(result.current.cart.itemCount).toBe(0)
    expect(result.current.countdown.isRunning).toBe(false)
  })
})
