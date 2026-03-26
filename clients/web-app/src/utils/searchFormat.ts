import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import type { DateRange } from 'react-day-picker'

const DATE_LOCALES: Record<string, Locale> = { es, en: enUS }

export const today = (): Date => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export const formatDate = (date: Date, language = 'es'): string => {
  const locale = DATE_LOCALES[language] ?? es
  const abbr = format(date, 'MMM', { locale })
  const month = abbr.charAt(0).toUpperCase() + abbr.slice(1, 3)
  return `${date.getDate()} ${month}`
}

export const formatDateRange = (range: DateRange | undefined, language = 'es'): string | null => {
  if (!range?.from) return null
  if (!range.to) return formatDate(range.from, language)
  return `${formatDate(range.from, language)} - ${formatDate(range.to, language)}`
}
