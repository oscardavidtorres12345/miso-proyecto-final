import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Input from '@/components/Input'
import './PriceFilter.css'

interface PriceRange {
  min: string
  max: string
}

interface PriceFilterProps {
  value?: PriceRange
  onChange?: (value: PriceRange) => void
  defaultOpen?: boolean
}

const PriceFilter = ({ value, onChange, defaultOpen = true }: PriceFilterProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [internal, setInternal] = useState<PriceRange>({ min: '', max: '' })

  const current = value ?? internal

  const handleChange = (field: keyof PriceRange, val: string) => {
    const next = { ...current, [field]: val }
    if (onChange) onChange(next)
    else setInternal(next)
  }

  return (
    <div className="filter-card">
      <button
        className="filter-card__header"
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
      >
        <span className="filter-card__title">Precio</span>
        <ChevronDown className={cn('filter-card__chevron', isOpen && 'filter-card__chevron--open')} />
      </button>

      <div className={cn('filter-card__body', isOpen && 'filter-card__body--open')}>
        <div className="filter-card__overflow">
          <div className="price-filter__inputs">
            <div className="price-filter__input-group">
              <label className="price-filter__label">Min.</label>
              <div className="input-box">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={current.min}
                  onChange={e => handleChange('min', e.target.value)}
                />
              </div>
            </div>
            <div className="price-filter__input-group">
              <label className="price-filter__label">Max.</label>
              <div className="input-box">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={current.max}
                  onChange={e => handleChange('max', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PriceFilter
