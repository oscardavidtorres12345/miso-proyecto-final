import { useEffect, useRef, useState } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import GuestsPanel from '@/components/GuestsPanel'
import { formatGuestSummary } from '@/utils/searchFormat'
import type { Guests } from '@/types/search'
import './GuestsDropdown.css'

interface GuestsDropdownProps {
  value: Guests
  onChange: (guests: Guests) => void
}

const GuestsDropdown = ({ value, onChange }: GuestsDropdownProps) => {
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

  return (
    <div ref={ref} className="flex flex-col flex-1 min-w-0 relative">
      <span className="guests-input__label font-bold text-black">Quién</span>
      <div className="flex items-center gap-1 cursor-pointer" onClick={() => setIsOpen(v => !v)}>
        <Users className="guests-input__icon text-primary" />
        <div className="guests-input__box">
          <span className={cn('guests-input__display', !isOpen && 'guests-input__display--active')}>
            {formatGuestSummary(value)}
          </span>
        </div>
      </div>
      {isOpen && (
        <div className="guests-input__dropdown">
          <GuestsPanel value={value} onChange={onChange} />
        </div>
      )}
    </div>
  )
}

export default GuestsDropdown
