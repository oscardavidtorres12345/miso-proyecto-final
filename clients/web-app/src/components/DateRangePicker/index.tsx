import { DayPicker, type DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { today } from '@/utils/searchFormat'

const DATE_FNS_LOCALES: Record<string, Locale> = {
  'es-CO': es,
  'es-AR': es,
  'en-US': enUS,
}

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  onComplete?: () => void
  minDate?: Date
}

const DateRangePicker = ({ value, onChange, onComplete, minDate }: DateRangePickerProps) => {
  const { i18n } = useTranslation()
  const locale = DATE_FNS_LOCALES[i18n.language] ?? es

  const effectiveMinDate = minDate ?? today()

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) { onChange(undefined); return }
    if (range.from && range.to && range.to <= range.from) {
      onChange({ from: range.from, to: undefined })
      return
    }
    onChange(range)
    if (range.from && range.to) onComplete?.()
  }

  return (
    <DayPicker
      mode="range"
      selected={value}
      onSelect={handleSelect}
      disabled={
        value?.from && !value.to
          ? { before: addDays(value.from, 1) }
          : { before: effectiveMinDate }
      }
      numberOfMonths={1}
      locale={locale}
    />
  )
}

export default DateRangePicker
export type { DateRange }
