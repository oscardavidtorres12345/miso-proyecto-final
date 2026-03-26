import { createContext, useContext } from 'react'
import useSearchState from '@/hooks/useSearchState'
import type { SearchState } from '@/hooks/useSearchState'

const SearchContext = createContext<SearchState | null>(null)

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const searchState = useSearchState()
  return <SearchContext.Provider value={searchState}>{children}</SearchContext.Provider>
}

export const useSearch = (): SearchState => {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used within SearchProvider')
  return ctx
}
