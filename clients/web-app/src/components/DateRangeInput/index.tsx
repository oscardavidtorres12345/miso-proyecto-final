import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import DateRangePicker, { type DateRange } from '@/components/DateRangePicker'
import { formatDateRange } from '@/utils/searchFormat'
import { useI18n } from '@/context/I18nContext'
import './DateRangeInput.css'

interface DateRangeInputProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  minDate?: Date
}

const DateRangeInput = ({ value, onChange, minDate }: DateRangeInputProps) => {
  const { t } = useTranslation()
  const { language } = useI18n()
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

  const displayValue = formatDateRange(value, language)

  return (
    <div ref={ref} className="flex flex-col flex-1 min-w-0 relative">
      <span className="input-field-label font-bold text-black">{t('search.dates')}</span>
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsOpen(v => !v)}>
        <Calendar className="input-field-icon text-primary" />
        <div className="input-box flex-1 min-w-0 overflow-hidden">
          <span className={cn('input-display date-input__display', !displayValue && 'input-display--placeholder')}>
            {displayValue ?? t('search.addDates')}
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="input-popup date-input__calendar">
          <DateRangePicker
            value={value}
            onChange={onChange}
            onComplete={() => setIsOpen(false)}
            minDate={minDate}
          />
        </div>
      )}
    </div>
  )
}

export default DateRangeInput
