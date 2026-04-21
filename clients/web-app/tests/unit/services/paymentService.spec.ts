import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPaymentIntent, getPaymentStatus } from '@/services/paymentService'

const mockIntentResponse = {
  payment_id: 'pay-001',
  client_secret: 'secret_abc',
  publishable_key: 'pk_test_123',
  amount: 150,
  currency: 'USD',
  status: 'PROCESSING',
}

const mockStatusResponse = {
  payment_id: 'pay-001',
  booking_id: 'BK-001',
  status: 'COMPLETED' as const,
  amount: 150,
  currency: 'USD',
  created_at: '2026-04-20T00:00:00Z',
  booking_confirmation_code: 'CONF-XYZ',
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createPaymentIntent', () => {
  it('returns payment intent data on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockIntentResponse),
    } as Response)

    const result = await createPaymentIntent('BK-001', 'user-1', 150, 'USD')

    expect(result).toEqual(mockIntentResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/payments/intent'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ booking_id: 'BK-001', user_id: 'user-1', amount: 150, currency: 'USD' }),
      }),
    )
  })

  it('throws with detail message on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Booking does not belong to user' }),
    } as Response)

    await expect(createPaymentIntent('BK-001', 'other-user', 150, 'USD')).rejects.toThrow(
      'Booking does not belong to user',
    )
  })

  it('throws fallback message when detail is missing', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    } as Response)

    await expect(createPaymentIntent('BK-001', 'user-1', 150, 'USD')).rejects.toThrow(
      'Failed to create payment intent',
    )
  })
})

describe('getPaymentStatus', () => {
  it('returns payment status data on success', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatusResponse),
    } as Response)

    const result = await getPaymentStatus('pay-001')

    expect(result).toEqual(mockStatusResponse)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/payments/pay-001/status'))
  })

  it('throws with detail message on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Payment not found' }),
    } as Response)

    await expect(getPaymentStatus('pay-999')).rejects.toThrow('Payment not found')
  })

  it('throws fallback message when detail is missing', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    } as Response)

    await expect(getPaymentStatus('pay-999')).rejects.toThrow('Failed to get payment status')
  })
})
