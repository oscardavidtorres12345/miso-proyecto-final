import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import type { Guests } from '@/types/search'
import { GUESTS_DEFAULTS } from '@/types/search'

export interface SearchState {
  destination: string
  setDestination: (v: string) => void
  dateRange: DateRange | undefined
  setDateRange: (v: DateRange | undefined) => void
  guests: Guests
  setGuests: (v: Guests) => void
}

const useSearchState = (): SearchState => {
  const [destination, setDestination] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState<Guests>(GUESTS_DEFAULTS)

  return { destination, setDestination, dateRange, setDateRange, guests, setGuests }
}

export default useSearchState
