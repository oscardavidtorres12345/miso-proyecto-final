import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import type { DateRange } from 'react-day-picker'

const DATE_LOCALES: Record<string, Locale> = {
  'es-CO': es,
  'es-AR': es,
  'en-US': enUS,
}

export const today = (): Date => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export const formatDate = (date: Date, language = 'es-CO'): string => {
  const locale = DATE_LOCALES[language] ?? es
  const abbr = format(date, 'MMM', { locale })
  const month = abbr.charAt(0).toUpperCase() + abbr.slice(1, 3)
  return `${date.getDate()} ${month}`
}

export const formatDateRange = (range: DateRange | undefined, language = 'es-CO'): string | null => {
  if (!range?.from) return null
  if (!range.to) return formatDate(range.from, language)
  return `${formatDate(range.from, language)} - ${formatDate(range.to, language)}`
}

export const parseIsoDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, monthIndex, day)
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}
