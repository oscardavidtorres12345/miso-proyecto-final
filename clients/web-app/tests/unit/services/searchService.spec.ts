import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getSearchFilters, getSearchProperties } from '@/services/searchService'

describe('searchService', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubEnv('VITE_SEARCH_API_URL', 'http://localhost:8001/api/v1')
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('builds filters request with required query params', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        services: [],
        accommodationTypes: [],
        meals: [],
        stars: [],
      }),
    })

    await getSearchFilters({
      destination: 'Cartagena',
      checkIn: '2026-04-07',
      checkOut: '2026-04-10',
    })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/api/v1/search/filters?')
    expect(url).toContain('destination=Cartagena')
    expect(url).toContain('check_in=2026-04-07')
    expect(url).toContain('check_out=2026-04-10')
    expect(options).toEqual({ method: 'GET' })
  })

  it('builds properties request with defaults and optional params', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }),
    })

    await getSearchProperties({
      destination: 'Bogota',
      checkIn: '2026-05-01',
      checkOut: '2026-05-03',
      priceMin: 100000,
      priceMax: 250000,
      amenities: ['wifi', 'pool'],
      accommodationType: ['hotel'],
      stars: [4, 5],
      mealPlan: 'breakfast',
    })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/api/v1/search/properties?')
    expect(url).toContain('destination=Bogota')
    expect(url).toContain('check_in=2026-05-01')
    expect(url).toContain('check_out=2026-05-03')
    expect(url).toContain('adults=1')
    expect(url).toContain('children=0')
    expect(url).toContain('rooms=1')
    expect(url).toContain('pets=false')
    expect(url).toContain('page=1')
    expect(url).toContain('page_size=10')
    expect(url).toContain('price_min=100000')
    expect(url).toContain('price_max=250000')
    expect(url).toContain('meal_plan=breakfast')
    expect(url).toContain('amenities=wifi')
    expect(url).toContain('amenities=pool')
    expect(url).toContain('accommodation_type=hotel')
    expect(url).toContain('stars=4')
    expect(url).toContain('stars=5')
  })

  it('throws with status on properties non-ok response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
    })

    await expect(
      getSearchProperties({
        destination: 'Bogota',
        checkIn: '2026-05-01',
        checkOut: '2026-05-03',
      }),
    ).rejects.toMatchObject({ message: 'Failed to fetch properties.', status: 500 })
  })

  it('throws when VITE_SEARCH_API_URL is missing', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_SEARCH_API_URL', '')
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })

    await expect(
      getSearchProperties({
        destination: 'Bogota',
        checkIn: '2026-05-01',
        checkOut: '2026-05-03',
      }),
    ).rejects.toThrow('VITE_SEARCH_API_URL is not defined. Set it in .env.')
  })
})
