import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getRates, RoomRateDto } from '@/services/inventoryService'

const mockRate: RoomRateDto = {
  room_id: 2,
  property_id: 1,
  room_type: 'Habitación estándar',
  base_rate: 150000,
  offer_rate: 120000,
  offer_active: true,
  effective_rate: 120000,
  currency: 'COP',
  occupied_units: 0,
  total_units: 5,
  availability: '0/5',
  offer_status: 'Activa',
  updated_at: '2026-04-22T21:05:06.788277',
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
