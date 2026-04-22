import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SquarePen, Plus } from 'lucide-react'
import Button from '@/components/Button'
import RateFormModal from './RateFormModal'
import './PortalRates.css'

type RateStatus = 'active' | 'inactive'

interface Rate {
  id: number
  roomType: string
  baseRate: number
  offerRate: number
  availableRooms: number
  totalRooms: number
  status: RateStatus
}

const MOCK_RATES: Rate[] = [
  { id: 1, roomType: 'Suite Junior', baseRate: 100000, offerRate: 80000, availableRooms: 15, totalRooms: 20, status: 'active' },
  { id: 2, roomType: 'Habitación estándar', baseRate: 150000, offerRate: 120000, availableRooms: 8, totalRooms: 20, status: 'active' },
  { id: 3, roomType: 'Suite deluxe', baseRate: 200000, offerRate: 170000, availableRooms: 8, totalRooms: 15, status: 'active' },
  { id: 4, roomType: 'Habitación familiar', baseRate: 250000, offerRate: 220000, availableRooms: 5, totalRooms: 8, status: 'active' },
  { id: 5, roomType: 'Penthouse', baseRate: 350000, offerRate: 300000, availableRooms: 0, totalRooms: 4, status: 'inactive' },
]

const CURRENCIES = [
  { value: 'COP', label: 'COP' },
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
]

const formatPrice = (amount: number): string => amount.toLocaleString('es-CO')

const PortalRates = () => {
  const { t } = useTranslation()
  const [currency, setCurrency] = useState('COP')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)

  const openAdd = () => { setEditingRate(null); setIsModalOpen(true) }
  const openEdit = (rate: Rate) => { setEditingRate(rate); setIsModalOpen(true) }
  const closeModal = () => { setIsModalOpen(false); setEditingRate(null) }

  return (
    <div className="portal-rates">
      <div className="portal-rates__header">
        <h1 className="portal-rates__title">{t('portalRates.title')}</h1>
        <div className="portal-rates__currency">
          <label className="portal-rates__currency-label" htmlFor="currency-select">
            {t('portalRates.currency')}
          </label>
          <select
            id="currency-select"
            className="portal-rates__currency-select"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
          >
            {CURRENCIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="portal-rates__table-card">
        <table className="portal-rates__table">
          <thead>
            <tr>
              <th>{t('portalRates.columns.roomType')}</th>
              <th>{t('portalRates.columns.baseRate')}</th>
              <th>{t('portalRates.columns.offerRate')}</th>
              <th>{t('portalRates.columns.availability')}</th>
              <th>{t('portalRates.columns.offerStatus')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_RATES.map(rate => (
              <tr key={rate.id}>
                <td>{rate.roomType}</td>
                <td>
                  <span className="portal-rates__price">
                    <sup>$</sup>{formatPrice(rate.baseRate)}
                  </span>
                </td>
                <td>
                  <span className="portal-rates__price">
                    <sup>$</sup>{formatPrice(rate.offerRate)}
                  </span>
                </td>
                <td>{rate.availableRooms}/{rate.totalRooms}</td>
                <td>
                  <span className={`portal-rates__badge portal-rates__badge--${rate.status}`}>
                    {rate.status === 'active' ? t('portalRates.status.active') : t('portalRates.status.inactive')}
                  </span>
                </td>
                <td>
                  <Button
                    variant="ghost"
                    className="portal-rates__edit-btn"
                    aria-label={t('portalRates.editRate')}
                    onClick={() => openEdit(rate)}
                  >
                    <SquarePen size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="portal-rates__footer">
        <Button
          variant="primary"
          className="portal-rates__add-btn"
          onClick={openAdd}
        >
          <Plus size={16} />
          {t('portalRates.addRate')}
        </Button>
      </div>

      <RateFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialData={editingRate ? {
          roomType: editingRate.roomType,
          baseRate: editingRate.baseRate,
          offerRate: editingRate.offerRate,
          availableRooms: editingRate.availableRooms,
          totalRooms: editingRate.totalRooms,
          isActive: editingRate.status === 'active',
        } : undefined}
      />
    </div>
  )
}

export default PortalRates
