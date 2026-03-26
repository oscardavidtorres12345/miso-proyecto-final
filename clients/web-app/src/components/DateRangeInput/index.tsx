import { useEffect, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import DateRangePicker, { type DateRange } from '@/components/DateRangePicker'
import { formatDateRange } from '@/utils/searchFormat'
import './DateRangeInput.css'

interface DateRangeInputProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
}

const DateRangeInput = ({ value, onChange }: DateRangeInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayValue = formatDateRange(value)

  return (
    <div ref={ref} className="flex flex-col flex-1 min-w-0 relative">
      <span className="date-input__label font-bold text-black">Fechas</span>
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsOpen(v => !v)}>
        <Calendar className="date-input__icon text-primary" />
        <div className="date-input__box">
          <span className={cn('date-input__display', !displayValue && 'date-input__display--placeholder')}>
            {displayValue ?? 'Agrega fechas'}
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="date-input__calendar">
          <DateRangePicker
            value={value}
            onChange={onChange}
            onComplete={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

export default DateRangeInput
