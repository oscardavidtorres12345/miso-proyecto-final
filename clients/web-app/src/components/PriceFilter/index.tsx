import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Input from '@/components/Input'
import { formatPriceInputDisplay, priceInputDigitsOnly } from '@/utils/priceInput'
import './PriceFilter.css'

interface PriceRange {
  min: string
  max: string
}

interface PriceFilterProps {
  value?: PriceRange
  onChange?: (value: PriceRange) => void
  defaultOpen?: boolean
  collapsible?: boolean
}

const PriceFilter = ({ value, onChange, defaultOpen = true, collapsible = true }: PriceFilterProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [internal, setInternal] = useState<PriceRange>({ min: '', max: '' })

  const current = value ?? internal

  const handleChange = (field: keyof PriceRange, raw: string) => {
    const digits = priceInputDigitsOnly(raw)
    const next = { ...current, [field]: digits }
    if (onChange) onChange(next)
    else setInternal(next)
  }

  return (
    <div className="filter-card">
      {collapsible ? (
        <button
          className="filter-card__header"
          onClick={() => setIsOpen(v => !v)}
          aria-expanded={isOpen}
        >
          <span className="filter-card__title">{t('price.title')}</span>
          <ChevronDown className={cn('filter-card__chevron', isOpen && 'filter-card__chevron--open')} />
        </button>
      ) : (
        <div className="filter-card__header">
          <span className="filter-card__title">{t('price.title')}</span>
        </div>
      )}

      <div className={cn('filter-card__body', (isOpen || !collapsible) && 'filter-card__body--open')}>
        <div className="filter-card__overflow">
          <div className="price-filter__inputs">
            <div className="price-filter__input-group">
              <label className="price-filter__label" htmlFor="price-filter-min">
                {t('price.min')}
              </label>
              <div className="input-box">
                <Input
                  id="price-filter-min"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  aria-label={t('price.min')}
                  value={formatPriceInputDisplay(current.min)}
                  onChange={e => handleChange('min', e.target.value)}
                />
              </div>
            </div>
            <div className="price-filter__input-group">
              <label className="price-filter__label" htmlFor="price-filter-max">
                {t('price.max')}
              </label>
              <div className="input-box">
                <Input
                  id="price-filter-max"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0"
                  aria-label={t('price.max')}
                  value={formatPriceInputDisplay(current.max)}
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
