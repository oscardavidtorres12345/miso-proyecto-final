import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelBooking,
  createBookingHold,
  getUserBookings,
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
      room_id: 1,
      user_id: 'u1',
      check_in: '2026-05-01',
      check_out: '2026-05-04',
      units: 1,
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

  it('resolveBaseUrl throws when env missing', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_BOOKING_API_URL', '')
    await expect(createBookingHold({} as never)).rejects.toThrow(/VITE_BOOKING_API_URL/)
  })

  it('strips trailing slash from base URL', async () => {
    vi.stubEnv('VITE_BOOKING_API_URL', `${BASE}/`)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ON_HOLD', sprint: 1, hu_id: 'x' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    await createBookingHold({
      room_id: 1,
      user_id: 'u',
      check_in: '2026-05-01',
      check_out: '2026-05-04',
      units: 1,
    })
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/bookings/holds`)
  })
})
