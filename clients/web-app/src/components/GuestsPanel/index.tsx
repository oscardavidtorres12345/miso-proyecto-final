import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import Button from '@/components/Button'
import type { Guests } from '@/types/search'
import './GuestsPanel.css'

interface CounterRowProps {
  label: string
  subLabel?: string
  value: number
  min: number
  onIncrement: () => void
  onDecrement: () => void
}

const CounterRow = ({ label, subLabel, value, min, onIncrement, onDecrement }: CounterRowProps) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="counter-row__label font-bold text-black">{label}</p>
        {subLabel && <p className="counter-row__sublabel text-gray-500">{subLabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="w-5 h-5" onClick={onDecrement} disabled={value <= min} aria-label={t('guests.decrement', { label })}>
          <Minus size={10} aria-hidden="true" />
        </Button>
        <span className="counter-row__value font-medium" aria-live="polite">{value}</span>
        <Button variant="ghost" className="w-5 h-5" onClick={onIncrement} aria-label={t('guests.increment', { label })}>
          <Plus size={10} aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (val: boolean) => void
  label: string
}

const Toggle = ({ checked, onChange, label }: ToggleProps) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn(
      'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors',
      checked ? 'toggle--on' : 'bg-gray-300'
    )}
  >
    <span
      className={cn(
        'toggle__thumb inline-block rounded-full bg-white shadow-sm transition-transform',
        checked ? 'toggle__thumb--on' : 'toggle__thumb--off'
      )}
    />
  </button>
)

interface GuestsPanelProps {
  value: Guests
  onChange: (guests: Guests) => void
}

const GuestsPanel = ({ value, onChange }: GuestsPanelProps) => {
  const { t } = useTranslation()
  return (
    <div className="guests-panel">
      <CounterRow
        label={t('guests.adults')}
        subLabel={t('guests.adultsAge')}
        value={value.adults}
        min={1}
        onIncrement={() => onChange({ ...value, adults: value.adults + 1 })}
        onDecrement={() => onChange({ ...value, adults: Math.max(1, value.adults - 1) })}
      />
      <CounterRow
        label={t('guests.children')}
        subLabel={t('guests.childrenAge')}
        value={value.children}
        min={0}
        onIncrement={() => onChange({ ...value, children: value.children + 1 })}
        onDecrement={() => onChange({ ...value, children: Math.max(0, value.children - 1) })}
      />
      <CounterRow
        label={t('guests.rooms')}
        value={value.rooms}
        min={1}
        onIncrement={() => onChange({ ...value, rooms: value.rooms + 1 })}
        onDecrement={() => onChange({ ...value, rooms: Math.max(1, value.rooms - 1) })}
      />
      <div className="guests-panel__toggle-row">
        <p className="counter-row__label font-bold text-black">{t('guests.pets')}</p>
        <div className="guests-panel__toggle-wrapper">
          <Toggle checked={value.pets} onChange={val => onChange({ ...value, pets: val })} label={t('guests.togglePets')} />
        </div>
      </div>
    </div>
  )
}

export default GuestsPanel
