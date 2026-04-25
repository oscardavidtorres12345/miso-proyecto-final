import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchCheckoutPage } from '@/services/checkoutService'
import * as bookingService from '@/services/bookingService'

const baseSummary = {
  booking_id: 'b1',
  property_id: 1,
  room_id: 1,
  check_in: '2026-01-01',
  check_out: '2026-01-03',
  units: 1,
  payment_summary: {
    accommodation: 100,
    fees: 0,
    taxes: 0,
    insurance: 0,
    discount: 0,
    total: 100,
    currency: 'COP',
  },
} satisfies bookingService.PaymentSummaryResponseDto

const makeSummary = (over: Partial<bookingService.PaymentSummaryResponseDto> = {}) => ({
  ...baseSummary,
  ...over,
})

const fallbackItem = {
  id: 'b1',
  name: 'Hotel X',
  image: 'https://example.com/x.jpg',
  price: { amount: 50, currency: 'COP' },
  breakdown: {
    stayBase: 30,
    charges: 0,
    taxes: 0,
    insurance: 0,
    discount: 0,
  },
}

describe('checkoutService', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps payment-summary user to holder and email', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        user: {
          first_name: 'Jhon',
          last_name: 'Doe',
          email: 'correo@gmail.com',
        },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'Otro Nombre', email: 'otro@mail.com' },
    })

    expect(data.holder).toEqual({ firstName: 'Jhon', lastName: 'Doe' })
    expect(data.email).toBe('correo@gmail.com')
  })

  it('falls back to session when user field is undefined on response', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({ user: undefined }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'Solo Nombre', email: 's@x.com' },
    })

    expect(data.holder).toEqual({ firstName: 'Solo', lastName: 'Nombre' })
    expect(data.email).toBe('s@x.com')
  })

  it('falls back to session when user is null from API', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({ user: null }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'Ana Rest', email: 'ana@mail.com' },
    })

    expect(data.holder).toEqual({ firstName: 'Ana', lastName: 'Rest' })
    expect(data.email).toBe('ana@mail.com')
  })

  it('falls back to session when user object is empty strings', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({ user: { first_name: '', last_name: '  ', email: undefined } }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'Pepe Soto', email: 'p@s.com' },
    })

    expect(data.holder).toEqual({ firstName: 'Pepe', lastName: 'Soto' })
    expect(data.email).toBe('p@s.com')
  })

  it('uses first summary that carries user data when multiple bookings', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockImplementation(async (id) => {
      if (id === 'a1') {
        return {
          ...makeSummary({ booking_id: 'a1' }),
          user: { first_name: '', last_name: '', email: '' },
        }
      }
      if (id === 'b1') {
        return {
          ...makeSummary({ booking_id: 'b1' }),
          user: { first_name: 'Luis', last_name: 'Paz', email: 'l@x.com' },
        }
      }
      return null
    })

    const data = await fetchCheckoutPage({
      bookingIds: ['a1', 'b1'],
      user: { username: 'X', email: 'y@z.com' },
    })

    expect(data.holder).toEqual({ firstName: 'Luis', lastName: 'Paz' })
    expect(data.email).toBe('l@x.com')
    expect(data.cartLineItems).toHaveLength(2)
  })

  it('merges partial API user with session (email only from API)', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        user: { email: 'api@mail.com' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'María López Díaz', email: 'session@mail.com' },
    })

    expect(data.holder).toEqual({ firstName: 'María', lastName: 'López Díaz' })
    expect(data.email).toBe('api@mail.com')
  })

  it('merges API first/last with session email when email absent on API', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        user: { first_name: 'Api', last_name: 'Solo' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'ignored full name', email: 'sess@mail.com' },
    })

    expect(data.holder).toEqual({ firstName: 'Api', lastName: 'Solo' })
    expect(data.email).toBe('sess@mail.com')
  })

  it('applies fallback line items and maps prices from summary', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        payment_summary: { ...baseSummary.payment_summary, total: 200, accommodation: 200 },
        user: { first_name: 'A', last_name: 'B', email: 'a@b.co' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: null,
      fallbackLineItems: [fallbackItem],
    })

    expect(data.cartLineItems[0].name).toBe('Hotel X')
    expect(data.cartLineItems[0].price).toEqual({ amount: 200, currency: 'COP' })
  })

  it('builds line item from summary when no fallback is passed', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        booking_id: 'bk-99',
        user: { first_name: 'N', last_name: 'M', email: 'n@m.co' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['bk-99'],
      user: { username: 'N M', email: 'n@m.co' },
    })

    expect(data.cartLineItems[0].id).toBe('bk-99')
    expect(data.cartLineItems[0].name).toBe('Reserva bk-99')
  })

  it('normalizes non-standard currency to COP for payment field', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        payment_summary: { ...baseSummary.payment_summary, currency: 'XYZ' },
        user: { first_name: 'A', last_name: 'B', email: 'a@b.co' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'A B', email: 'a@b.co' },
    })

    expect(data.paymentCurrency).toBe('COP')
  })

  it('accepts USD from summary', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        payment_summary: { ...baseSummary.payment_summary, currency: 'USD' },
        user: { first_name: 'A', last_name: 'B', email: 'a@b.co' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'A B', email: 'a@b.co' },
    })

    expect(data.paymentCurrency).toBe('USD')
  })

  it('accepts ARS from summary', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        payment_summary: { ...baseSummary.payment_summary, currency: 'ARS' },
        user: { first_name: 'A', last_name: 'B', email: 'a@b.co' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'A B', email: 'a@b.co' },
    })

    expect(data.paymentCurrency).toBe('ARS')
  })

  it('uses API email when session user is null', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        user: { first_name: 'Solo', last_name: 'Api', email: 'only@api.com' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: null,
    })

    expect(data.holder).toEqual({ firstName: 'Solo', lastName: 'Api' })
    expect(data.email).toBe('only@api.com')
  })

  it('treats whitespace-only session email as empty and falls back to last resort', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({ user: { first_name: 'A', last_name: 'B' } }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: 'A B', email: '   ' },
    })

    expect(data.email).toBe('')
  })

  it('throws when no booking returns a payment summary', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(null)

    await expect(
      fetchCheckoutPage({ bookingIds: ['x'], user: { username: 'A', email: 'a@b.co' } }),
    ).rejects.toThrow('Payment summary unavailable')
  })

  it('uses only email on API with empty session username for names', async () => {
    vi.spyOn(bookingService, 'fetchBookingPaymentSummary').mockResolvedValue(
      makeSummary({
        user: { email: 'only@api.com' },
      }),
    )

    const data = await fetchCheckoutPage({
      bookingIds: ['b1'],
      user: { username: '', email: 'sess@x.com' },
    })

    expect(data.holder).toEqual({ firstName: '', lastName: '' })
    expect(data.email).toBe('only@api.com')
  })
})
