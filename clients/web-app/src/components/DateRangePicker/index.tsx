import { DayPicker, type DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { today } from '@/utils/searchFormat'

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  onComplete?: () => void
}

const DateRangePicker = ({ value, onChange, onComplete }: DateRangePickerProps) => {
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
          : { before: today() }
      }
      numberOfMonths={1}
      locale={es}
    />
  )
}

export default DateRangePicker
export type { DateRange }
