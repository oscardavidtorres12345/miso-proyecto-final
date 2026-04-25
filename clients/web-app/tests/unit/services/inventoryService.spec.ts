import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRates, createRate, updateRate, RoomRateDto, CreateRatePayload } from '@/services/inventoryService'

const mockRate: RoomRateDto = {
  room_id: 2,
  property_id: 1,
  property_name: 'Hotel Test',
  room_type: 'Habitación estándar',
  base_rate: 150000,
  offer_rate: 120000,
  offer_active: true,
  effective_rate: 120000,
  currency: 'COP',
  occupied_units: 0,
  available_rooms: 5,
  total_units: 5,
  offer_status: 'Activa',
  updated_at: '2026-04-22T21:05:06.788277',
}

const mockPayload: CreateRatePayload = {
  property_id: 1,
  room_type: 'Suite Test',
  base_rate: 120000,
  offer_rate: 100000,
  occupied_units: 5,
  total_units: 10,
  offer_active: true,
  currency: 'COP',
  horizon_days: 30,
}

beforeEach(() => {
  vi.stubEnv('VITE_INVENTORY_API_URL', 'http://localhost:8006/api/v1')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('inventoryService.getRates', () => {
  it('returns the rates array on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ rates: [mockRate] }), { status: 200 })
    )

    const result = await getRates('test-token', 'COP')

    expect(result).toHaveLength(1)
    expect(result[0].room_type).toBe('Habitación estándar')
    expect(result[0].base_rate).toBe(150000)
  })

  it('sends Authorization Bearer header', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ rates: [] }), { status: 200 })
    )

    await getRates('my-jwt-token', 'COP')

    const [, options] = fetchSpy.mock.calls[0]
    const headers = options?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer my-jwt-token')
  })

  it('appends currency query param when provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ rates: [] }), { status: 200 })
    )

    await getRates('token', 'USD')

    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).toContain('currency=USD')
  })

  it('omits query string when currency is not provided', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ rates: [] }), { status: 200 })
    )

    await getRates('token')

    const [url] = fetchSpy.mock.calls[0]
    expect(String(url)).not.toContain('currency')
  })

  it('throws an error with status when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Unauthorized' }), { status: 401 })
    )

    await expect(getRates('bad-token', 'COP')).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401,
    })
  })
})

describe('inventoryService.createRate', () => {
  it('returns the created rate on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockRate), { status: 201 })
    )

    const result = await createRate('test-token', 42, mockPayload)

    expect(result.room_id).toBe(2)
    expect(result.room_type).toBe('Habitación estándar')
  })

  it('sends POST to /inventory/rates with correct method, headers and body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockRate), { status: 201 })
    )

    await createRate('my-token', 99, mockPayload)

    const [url, options] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/\/inventory\/rates$/)
    expect(options?.method).toBe('POST')
    const headers = options?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer my-token')
    expect(headers['X-User-Id']).toBe('99')
    expect(headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options?.body as string)).toEqual(mockPayload)
  })

  it('throws with status when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Forbidden' }), { status: 403 })
    )

    await expect(createRate('token', 1, mockPayload)).rejects.toMatchObject({
      message: 'Forbidden',
      status: 403,
    })
  })
})

describe('inventoryService.updateRate', () => {
  it('returns the updated rate on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockRate), { status: 200 })
    )

    const result = await updateRate('test-token', 42, 7, mockPayload)

    expect(result.room_id).toBe(2)
    expect(result.room_type).toBe('Habitación estándar')
  })

  it('sends PUT to /inventory/rates/{roomId} with correct method, headers and body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockRate), { status: 200 })
    )

    await updateRate('my-token', 99, 7, mockPayload)

    const [url, options] = fetchSpy.mock.calls[0]
    expect(String(url)).toMatch(/\/inventory\/rates\/7$/)
    expect(options?.method).toBe('PUT')
    const headers = options?.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer my-token')
    expect(headers['X-User-Id']).toBe('99')
    expect(headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options?.body as string)).toEqual(mockPayload)
  })

  it('throws with status when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Not Found' }), { status: 404 })
    )

    await expect(updateRate('token', 1, 7, mockPayload)).rejects.toMatchObject({
      message: 'Not Found',
      status: 404,
    })
  })
})
