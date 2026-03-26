import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import type { Guests } from '@/types/search'

export const today = (): Date => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export const formatDate = (date: Date): string => {
  const abbr = format(date, 'MMM', { locale: es })
  const month = abbr.charAt(0).toUpperCase() + abbr.slice(1, 3)
  return `${date.getDate()} ${month}`
}

export const formatDateRange = (range: DateRange | undefined): string | null => {
  if (!range?.from) return null
  if (!range.to) return formatDate(range.from)
  return `${formatDate(range.from)} - ${formatDate(range.to)}`
}

export const formatGuestSummary = (guests: Guests): string => {
  const total = guests.adults + guests.children
  return `${total} huésped${total !== 1 ? 'es' : ''}`
}
