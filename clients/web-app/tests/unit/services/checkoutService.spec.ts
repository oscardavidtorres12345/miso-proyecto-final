import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchCheckoutPage } from '@/services/checkoutService'
import { MOCK_CHECKOUT_PAGE } from '@/mocks/checkout'

describe('checkoutService', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves after delay with a deep copy of the mock', async () => {
    vi.useFakeTimers()
    const promise = fetchCheckoutPage()
    await vi.advanceTimersByTimeAsync(400)
    const data = await promise

    expect(data.holder).toEqual(MOCK_CHECKOUT_PAGE.holder)
    expect(data.holder).not.toBe(MOCK_CHECKOUT_PAGE.holder)
    expect(data.cartLineItems).toHaveLength(MOCK_CHECKOUT_PAGE.cartLineItems.length)
    expect(data.cartLineItems[0]).toEqual(MOCK_CHECKOUT_PAGE.cartLineItems[0])
    expect(data.cartLineItems[0]).not.toBe(MOCK_CHECKOUT_PAGE.cartLineItems[0])
    expect(data.cartLineItems[0].breakdown).not.toBe(
      MOCK_CHECKOUT_PAGE.cartLineItems[0].breakdown,
    )
  })
})
