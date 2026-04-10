import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const clearCart = vi.fn()

let capturedExpiredHandler: (() => void) | undefined

const subscribeHoldExpired = vi.fn((fn: () => void) => {
  capturedExpiredHandler = fn
  return vi.fn()
})

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({ clearCart }),
}))

vi.mock('@/context/SessionCountdownContext', () => ({
  useSessionCountdown: () => ({
    subscribeHoldExpired,
  }),
}))

import HoldExpiredBridge from '@/components/HoldExpiredBridge'
import { I18nProvider } from '@/context/I18nContext'

describe('HoldExpiredBridge', () => {
  beforeEach(() => {
    clearCart.mockClear()
    subscribeHoldExpired.mockClear()
    capturedExpiredHandler = undefined
  })

  it('subscribes on mount', () => {
    render(
      <I18nProvider>
        <HoldExpiredBridge />
      </I18nProvider>,
    )
    expect(subscribeHoldExpired).toHaveBeenCalledTimes(1)
  })

  it('clears cart and shows error snackbar when hold expires', () => {
    render(
      <I18nProvider>
        <HoldExpiredBridge />
      </I18nProvider>,
    )
    expect(typeof capturedExpiredHandler).toBe('function')
    act(() => {
      capturedExpiredHandler?.()
    })
    expect(clearCart).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('alert')).toHaveClass('snackbar--visible')
  })
})
