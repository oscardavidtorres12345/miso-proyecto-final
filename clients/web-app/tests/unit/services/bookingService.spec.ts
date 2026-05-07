import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelBooking,
  createBookingBatch,
  createBookingHold,
  fetchBookingPaymentSummary,
  getBookingBatch,
  getUserConfirmedPastBookings,
  getUserConfirmedUpcomingBookings,
  getBooking,
  getPortalDashboard,
  getPortalFeedback,
  getPortalReservations,
  getUserBookings,
  hotelCancelBooking,
  hotelConfirmBooking,
  mapPaymentSummaryToLinePatch,
  userCancelBooking,
} from '@/services/bookingService'

const BASE = 'http://test.local/api/v1'

describe('bookingService', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_BOOKING_API_URL', BASE)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('createBookingHold posts JSON and returns body', async () => {
    const payload = {
      property_id: 9,
      room_id: 1,
      user_id: 'u1',
      check_in: '2026-05-01',
      check_out: '2026-05-04',
      units: 1,
      guest_count: 2,
    }
    const body = {
      status: 'ON_HOLD',
      sprint: 1,
      hu_id: 'HU005',
      booking_id: 'b1',
      hold_id: 'h1',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(createBookingHold(payload)).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('createBookingHold throws with status on error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: 'Conflict' }),
      }),
    )
    await expect(createBookingHold({} as never)).rejects.toMatchObject({
      message: 'Conflict',
      status: 409,
    })
  })

  it('createBookingHold formats array detail msg', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ detail: [{ msg: 'bad date' }] }),
      }),
    )
    await expect(createBookingHold({} as never)).rejects.toMatchObject({
      message: 'bad date',
    })
  })

  it('getUserBookings GETs encoded user id', async () => {
    const res = {
      user_id: 'u%40x',
      bookings: [],
      status: 'ok',
      sprint: 2,
      hu_id: 'x',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(res),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getUserBookings('u@x')).resolves.toEqual(res)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/users/u%40x`)
  })

  it('getPortalFeedback sends auth headers and returns data', async () => {
    const body = {
      reviews: [
        {
          id: 1,
          booking_id: 'b1',
          property_id: 1,
          room_id: 1,
          hotel_name: 'Casa del Mar',
          room_name: 'Suite',
          guest_name: 'Ana',
          guest_username: null,
          guest_avatar_url: null,
          rating: 5,
          comment: 'Genial',
          review_date: '2026-03-08T12:00:00Z',
        },
      ],
      status: 'ok',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPortalFeedback({ token: 'jwt', userId: 7 })).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/admin/feedback`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer jwt',
        'X-User-Id': '7',
      },
    })
  })

  it('getPortalReservations sends auth headers and returns data', async () => {
    const body = {
      properties: [{ property_id: 1, property_name: 'Casa del Mar' }],
      staff_user_id: 1,
      property_ids: [1],
      bookings: [],
      status: 'ok',
      sprint: 2,
      hu_id: 'HU013',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getPortalReservations({ token: 'jwt', userId: 99 })).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/portal/reservations`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer jwt',
        'X-User-Id': '99',
      },
    })
  })

  it('getPortalReservations throws generic message when detail is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ boom: true }),
      }),
    )
    await expect(getPortalReservations({ token: 'jwt', userId: 1 })).rejects.toMatchObject({
      message: 'Request failed.',
      status: 500,
    })
  })

  it('hotelConfirmBooking posts with encoded booking id', async () => {
    const body = { status: 'CONFIRMED', sprint: 2, hu_id: 'HU013', booking_id: 'a/b' }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(hotelConfirmBooking({ token: 'jwt', userId: 1 }, 'a/b')).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/a%2Fb/hotel-confirm`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer jwt',
        'X-User-Id': '1',
      },
    })
  })

  it('hotelConfirmBooking throws when API returns error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: 'Already confirmed' }),
      }),
    )
    await expect(hotelConfirmBooking({ token: 'jwt', userId: 1 }, 'b1')).rejects.toMatchObject({
      message: 'Already confirmed',
      status: 409,
    })
  })

  it('hotelCancelBooking sends DELETE with auth headers', async () => {
    const body = { status: 'CANCELLED', sprint: 2, hu_id: 'HU013', booking_id: 'b1' }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(hotelCancelBooking({ token: 'jwt', userId: 77 }, 'b1')).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/b1/hotel-cancel`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer jwt',
        'X-User-Id': '77',
      },
    })
  })

  it('hotelCancelBooking handles json parse failures in error responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error('invalid json')),
      }),
    )
    await expect(hotelCancelBooking({ token: 'jwt', userId: 1 }, 'b1')).rejects.toMatchObject({
      message: 'Request failed.',
      status: 503,
    })
  })

  it('userCancelBooking sends DELETE to user-cancel with X-User-Id header', async () => {
    const body = { status: 'CANCELLED', sprint: 2, hu_id: 'HU003', booking_id: 'b1', hold_id: 'h1' }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(userCancelBooking('b1', 42)).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/b1/user-cancel`, {
      method: 'DELETE',
      headers: { 'X-User-Id': '42' },
    })
  })

  it('userCancelBooking throws with status on error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: 'Forbidden' }),
      }),
    )
    await expect(userCancelBooking('b1', 99)).rejects.toMatchObject({ message: 'Forbidden', status: 403 })
  })

  it('cancelBooking sends DELETE', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 'CANCELLED',
          sprint: 1,
          hu_id: 'x',
          booking_id: 'b2',
        }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await cancelBooking('b2')
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/b2`, { method: 'DELETE' })
  })

  it('getBooking returns booking detail', async () => {
    const body = {
      booking_id: 'b1',
      hold_id: 'h1',
      room_id: 2,
      user_id: 'u1',
      check_in: '2026-05-01',
      check_out: '2026-05-04',
      units: 1,
      status: 'CONFIRMED',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(body),
      }),
    )
    await expect(getBooking('b1')).resolves.toEqual(body)
  })

  it('getBooking throws with parsed detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      }),
    )
    await expect(getBooking('b1')).rejects.toMatchObject({
      message: 'Not found',
      status: 404,
    })
  })

  it('createBookingBatch posts booking ids and returns batch id', async () => {
    const payload = {
      user_id: '42',
      booking_ids: ['b1', 'b2'],
    }
    const body = {
      booking_id: 'batch-1',
      user_id: '42',
      booking_ids: ['b1', 'b2'],
      bookings: [],
      status: 'ON_HOLD',
      sprint: 1,
      hu_id: 'HU005',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(createBookingBatch(payload)).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('getBookingBatch gets a batch by id', async () => {
    const body = {
      booking_id: 'batch-1',
      user_id: '42',
      booking_ids: ['b1'],
      bookings: [],
      status: 'ON_HOLD',
      sprint: 1,
      hu_id: 'HU005',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getBookingBatch('batch-1')).resolves.toEqual(body)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/batch/batch-1`)
  })

  it('getUserConfirmedUpcomingBookings GETs encoded user id', async () => {
    const res = {
      user_id: 'u%40x',
      reservations: [],
      status: 'ok',
      sprint: 2,
      hu_id: 'HU003',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(res),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getUserConfirmedUpcomingBookings('u@x')).resolves.toEqual(res)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/users/u%40x/confirmed-upcoming`)
  })

  it('getUserConfirmedPastBookings GETs encoded user id', async () => {
    const res = {
      user_id: 'u%40x',
      reservations: [],
      status: 'ok',
      sprint: 2,
      hu_id: 'HU003',
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(res),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getUserConfirmedPastBookings('u@x')).resolves.toEqual(res)
    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/users/u%40x/confirmed-past`)
  })
  it('resolveBaseUrl throws when env missing', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_BOOKING_API_URL', '')
    await expect(createBookingHold({} as never)).rejects.toThrow(/VITE_BOOKING_API_URL/)
  })

  it('fetchBookingPaymentSummary returns null on 409', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: 'Payment summary is not available' }),
      }),
    )
    await expect(fetchBookingPaymentSummary('b1')).resolves.toBeNull()
  })

  it('fetchBookingPaymentSummary returns null on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      }),
    )
    await expect(fetchBookingPaymentSummary('b1')).resolves.toBeNull()
  })

  it('fetchBookingPaymentSummary returns null on non-404/409 errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Boom' }),
      }),
    )
    await expect(fetchBookingPaymentSummary('b1')).resolves.toBeNull()
  })

  it('fetchBookingPaymentSummary parses body on 200', async () => {
    const body = {
      booking_id: 'b1',
      property_id: 9,
      room_id: 2,
      check_in: '2026-05-01',
      check_out: '2026-05-04',
      units: 1,
      payment_summary: {
        accommodation: 100_000,
        fees: 5_000,
        taxes: 10_000,
        insurance: 0,
        discount: -2_000,
        total: 113_000,
        currency: 'COP',
      },
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
      }),
    )
    await expect(fetchBookingPaymentSummary('b1')).resolves.toEqual(body)
  })

  it('fetchBookingPaymentSummary includes optional user on 200', async () => {
    const body = {
      booking_id: 'b1',
      property_id: 1,
      room_id: 1,
      check_in: '2026-05-01',
      check_out: '2026-05-04',
      units: 1,
      payment_summary: {
        accommodation: 1,
        fees: 0,
        taxes: 0,
        insurance: 0,
        discount: 0,
        total: 1,
        currency: 'COP',
      },
      user: { first_name: 'A', last_name: 'B', email: 'a@b.co' },
    }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(body),
      }),
    )
    await expect(fetchBookingPaymentSummary('b1')).resolves.toEqual(body)
  })

  it('mapPaymentSummaryToLinePatch maps discount to positive breakdown', () => {
    const patch = mapPaymentSummaryToLinePatch({
      booking_id: 'b1',
      property_id: 1,
      room_id: 1,
      check_in: '2026-05-01',
      check_out: '2026-05-04',
      units: 1,
      payment_summary: {
        accommodation: 80_000,
        fees: 0,
        taxes: 0,
        insurance: 0,
        discount: -5_000,
        total: 75_000,
        currency: 'COP',
      },
    })
    expect(patch.breakdown.discount).toBe(5_000)
    expect(patch.price.amount).toBe(75_000)
  })

  describe('getPortalDashboard', () => {
    const MOCK_RESPONSE = {
      staff_user_id: 99,
      property_ids: [1],
      kpis: { total_reservations: 42, active_reservations: 10, current_guests: 5, income_total: 1_500_000 },
      occupancy_by_category: [{ category: 'Suite', room_type: null, value: 8 }],
      bookings_by_period: [{ period: '2026-01', value: 12 }],
      ranking: [{ label: 'Suite Junior', room_type: null, value: 25 }],
      income_trend: [{ period: '2026-01', value: 800_000 }],
      meta: { date_from: '2026-01-01', date_to: '2026-01-31', granularity: 'month', currency: 'COP', top_n: 10, warnings: [] },
      status: 'ok',
    }

    it('envía los headers de auth y retorna el DTO', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(MOCK_RESPONSE) })
      vi.stubGlobal('fetch', fetchMock)

      await expect(getPortalDashboard({ token: 'jwt', userId: 99 })).resolves.toEqual(MOCK_RESPONSE)
      expect(fetchMock).toHaveBeenCalledWith(`${BASE}/bookings/portal/dashboard`, {
        method: 'GET',
        headers: { Authorization: 'Bearer jwt', 'X-User-Id': '99' },
      })
    })

    it('construye el query string con todos los parámetros opcionales', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(MOCK_RESPONSE) })
      vi.stubGlobal('fetch', fetchMock)

      await getPortalDashboard({ token: 'jwt', userId: 1 }, {
        date_from: '2026-01-01',
        date_to: '2026-01-31',
        currency: 'USD',
        top_n: 5,
      })

      const url = fetchMock.mock.calls[0][0] as string
      expect(url).toContain('date_from=2026-01-01')
      expect(url).toContain('date_to=2026-01-31')
      expect(url).toContain('currency=USD')
      expect(url).toContain('top_n=5')
    })

    it('no agrega query string cuando no se pasan parámetros', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(MOCK_RESPONSE) })
      vi.stubGlobal('fetch', fetchMock)

      await getPortalDashboard({ token: 'jwt', userId: 1 })

      const url = fetchMock.mock.calls[0][0] as string
      expect(url).toBe(`${BASE}/bookings/portal/dashboard`)
    })

    it('omite parámetros opcionales con valor undefined', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(MOCK_RESPONSE) })
      vi.stubGlobal('fetch', fetchMock)

      await getPortalDashboard({ token: 'jwt', userId: 1 }, { currency: 'ARS', date_from: undefined })

      const url = fetchMock.mock.calls[0][0] as string
      expect(url).toContain('currency=ARS')
      expect(url).not.toContain('date_from')
    })

    it('lanza error con status cuando la respuesta no es ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ detail: 'Forbidden' }),
      }))

      await expect(getPortalDashboard({ token: 'jwt', userId: 1 })).rejects.toMatchObject({
        message: 'Forbidden',
        status: 403,
      })
    })

    it('lanza mensaje genérico cuando el body de error no tiene detail', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ boom: true }),
      }))

      await expect(getPortalDashboard({ token: 'jwt', userId: 1 })).rejects.toMatchObject({
        message: 'Request failed.',
        status: 500,
      })
    })

    it('maneja fallo de parseo JSON en errores', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error('invalid json')),
      }))

      await expect(getPortalDashboard({ token: 'jwt', userId: 1 })).rejects.toMatchObject({
        message: 'Request failed.',
        status: 503,
      })
    })
  })

  it('strips trailing slash from base URL', async () => {
    vi.stubEnv('VITE_BOOKING_API_URL', `${BASE}/`)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ON_HOLD', sprint: 1, hu_id: 'x' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await createBookingHold({
      property_id: 1,
      room_id: 1,
      user_id: 'u',
      check_in: '2026-05-01',
      check_out: '2026-05-04',
      units: 1,
      guest_count: 2,
    })
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/bookings/holds`)
  })
})
