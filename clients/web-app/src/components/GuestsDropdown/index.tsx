import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import GuestsPanel from '@/components/GuestsPanel'
import type { Guests } from '@/types/search'
import './GuestsDropdown.css'

interface GuestsDropdownProps {
  value: Guests
  onChange: (guests: Guests) => void
  showValue?: boolean
}

const GuestsDropdown = ({ value, onChange, showValue = false }: GuestsDropdownProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(showValue)
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

  const handleOpen = () => {
    if (!hasOpened) setHasOpened(true)
    setIsOpen(v => !v)
  }

  const total = value.adults + value.children
  const guestDisplay = t('guests.guest', { count: total })

  return (
    <div ref={ref} className="flex flex-col flex-1 min-w-0 relative">
      <span className="input-field-label font-bold text-black">{t('search.who')}</span>
      <div className="flex items-center gap-1 cursor-pointer" onClick={handleOpen}>
        <Users className="input-field-icon text-primary" />
        <div className="input-box flex-1">
          <span className={cn('input-display', !hasOpened && 'input-display--placeholder')}>
            {hasOpened ? guestDisplay : t('search.howManyPlaceholder')}
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="input-popup guests-input__dropdown">
          <GuestsPanel value={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

export default GuestsDropdown
