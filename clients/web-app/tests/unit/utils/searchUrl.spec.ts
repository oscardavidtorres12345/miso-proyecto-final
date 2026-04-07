import { describe, it, expect } from 'vitest'
import {
  committedSearchFromUrlParams,
  committedSearchToUrlParams,
  defaultCommittedSearch,
  formatLocalYmd,
  parseLocalYmd,
  committedSearchFromSearchState,
  normalizeCommittedSearch,
} from '@/utils/searchUrl'
import { GUESTS_DEFAULTS } from '@/types/search'

describe('searchUrl', () => {
  it('round-trips dates in local YMD', () => {
    const d = new Date(2026, 3, 6)
    const s = formatLocalYmd(d)
    expect(s).toBe('2026-04-06')
    const back = parseLocalYmd(s)
    expect(back?.getTime()).toBe(d.getTime())
  })

  it('parses full search URL into payload', () => {
    const p = new URLSearchParams({
      destination: 'Medellín',
      checkIn: '2026-05-01',
      checkOut: '2026-05-03',
      adults: '1',
      children: '0',
      rooms: '1',
    })
    const out = committedSearchFromUrlParams(p)
    expect(out?.destination).toBe('Medellín')
    expect(out?.guests.adults).toBe(1)
    expect(formatLocalYmd(out!.dateRange!.from!)).toBe('2026-05-01')
  })

  it('serializes pets when true', () => {
    const params = committedSearchToUrlParams(
      committedSearchFromSearchState('Bogotá', { from: new Date(2026, 0, 1), to: new Date(2026, 0, 2) }, {
        ...GUESTS_DEFAULTS,
        pets: true,
      }),
    )
    expect(params.get('pets')).toBe('true')
  })

  it('returns null when required params missing', () => {
    expect(committedSearchFromUrlParams(new URLSearchParams())).toBeNull()
  })

  it('omits destination from URL params when blank', () => {
    const params = committedSearchToUrlParams(
      committedSearchFromSearchState('   ', { from: new Date(2026, 0, 1), to: new Date(2026, 0, 2) }, GUESTS_DEFAULTS),
    )
    expect(params.has('destination')).toBe(false)
  })

  it('normalizes destination with trim but no fallback value', () => {
    const normalized = normalizeCommittedSearch(
      committedSearchFromSearchState('  Medellin  ', { from: new Date(2026, 1, 10), to: new Date(2026, 1, 12) }, GUESTS_DEFAULTS),
    )
    expect(normalized.destination).toBe('Medellin')
  })

  it('uses empty destination in default committed search', () => {
    const payload = defaultCommittedSearch()
    expect(payload.destination).toBe('')
    expect(payload.dateRange?.from).toBeTruthy()
    expect(payload.dateRange?.to).toBeTruthy()
  })

  it('returns null when guests values are invalid', () => {
    const invalidAdults = new URLSearchParams({
      destination: 'Bogota',
      checkIn: '2026-05-01',
      checkOut: '2026-05-03',
      adults: '0',
      children: '0',
      rooms: '1',
    })
    expect(committedSearchFromUrlParams(invalidAdults)).toBeNull()
  })
})
