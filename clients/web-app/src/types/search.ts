import type { DateRange } from 'react-day-picker'

export interface Guests {
  adults: number
  children: number
  rooms: number
  pets: boolean
}

export const GUESTS_DEFAULTS: Guests = { adults: 2, children: 0, rooms: 1, pets: false }

export interface CommittedSearchPayload {
  destination: string
  dateRange: DateRange | undefined
  guests: Guests
}
