import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelBooking,
  createBookingBatch,
  createBookingHold,
  fetchBookingPaymentSummary,
  getBookingBatch,
  getUserConfirmedPastBookings,
  getUserConfirmedUpcomingBookings,
  getUserBookings,
  mapPaymentSummaryToLinePatch,
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
