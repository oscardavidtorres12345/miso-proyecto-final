import { act, renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SearchProvider, useSearch } from '@/context/SearchContext'
import { GUESTS_DEFAULTS } from '@/types/search'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SearchProvider>{children}</SearchProvider>
)

describe('SearchContext', () => {
  it('throws when useSearch is used outside SearchProvider', () => {
    expect(() => renderHook(() => useSearch())).toThrow(/SearchProvider/)
  })

  it('exposes initial search state from useSearchState', () => {
    const { result } = renderHook(() => useSearch(), { wrapper })
    expect(result.current.destination).toBe('')
    expect(result.current.dateRange).toBeUndefined()
    expect(result.current.guests).toEqual(GUESTS_DEFAULTS)
  })

  it('updates destination via setDestination', () => {
    const { result } = renderHook(() => useSearch(), { wrapper })
    act(() => {
      result.current.setDestination('Medellín')
    })
    expect(result.current.destination).toBe('Medellín')
  })

  it('updates dateRange via setDateRange', () => {
    const { result } = renderHook(() => useSearch(), { wrapper })
    const range = {
      from: new Date(2025, 3, 1),
      to: new Date(2025, 3, 5),
    }
    act(() => {
      result.current.setDateRange(range)
    })
    expect(result.current.dateRange).toEqual(range)
  })

  it('updates guests via setGuests', () => {
    const { result } = renderHook(() => useSearch(), { wrapper })
    const next = { adults: 3, children: 1, rooms: 2, pets: true }
    act(() => {
      result.current.setGuests(next)
    })
    expect(result.current.guests).toEqual(next)
  })
})
