import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SquarePen, Plus, Inbox } from 'lucide-react'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'
import Snackbar from '@/components/Snackbar'
import { useAuth } from '@/context/AuthContext'
import { getRates, createRate, updateRate, RoomRateDto } from '@/services/inventoryService'
import { formatPrice } from '@/utils/accommodation'
import RateFormModal, { PropertyOption } from './RateFormModal'
import './PortalRates.css'

const CURRENCIES = [
  { value: 'COP', label: 'COP' },
  { value: 'ARS', label: 'ARS' },
  { value: 'USD', label: 'USD' },
]

type LoadState = 'loading' | 'ready' | 'error'

const PortalRates = () => {
  const { t } = useTranslation()
  const { token, session } = useAuth()
  const [currency, setCurrency] = useState('COP')
  const [rates, setRates] = useState<RoomRateDto[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [snackbar, setSnackbar] = useState<{ message: string; variant: 'success' | 'error'; show: boolean }>({ message: '', variant: 'error', show: false })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<RoomRateDto | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const properties = useMemo<PropertyOption[]>(() => {
    const seen = new Set<number>()
    return rates.reduce<PropertyOption[]>((acc, rate) => {
      if (!seen.has(rate.property_id)) {
        seen.add(rate.property_id)
        acc.push({ property_id: rate.property_id, property_name: rate.property_name })
      }
      return acc
    }, [])
  }, [rates])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setLoadState('loading')
    getRates(token, currency)
      .then(data => {
        if (!cancelled) {
          setRates(data)
          setLoadState('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState('error')
          setSnackbar({ message: t('portalRates.loadError'), variant: 'error', show: true })
        }
      })
    return () => { cancelled = true }
  }, [token, currency, t])

  const openAdd = () => { setEditingRate(null); setIsModalOpen(true) }
  const openEdit = (rate: RoomRateDto) => { setEditingRate(rate); setIsModalOpen(true) }
  const closeModal = () => { setIsModalOpen(false); setEditingRate(null) }

  const handleSave = async (data: import('./RateFormModal').RateFormData) => {
    if (!token || !session) return
    setIsSaving(true)
    const wasEditing = !!editingRate
    const payload = {
      property_id: data.propertyId,
      room_type: data.roomType,
      base_rate: data.baseRate,
      offer_rate: data.offerRate,
      occupied_units: data.totalRooms - data.availableRooms,
      total_units: data.totalRooms,
      offer_active: data.isActive,
      currency,
      horizon_days: 30,
    }
    try {
      if (editingRate) {
        await updateRate(token, session.user.user_id, editingRate.room_id, payload)
      } else {
        await createRate(token, session.user.user_id, payload)
      }
      closeModal()
      setSnackbar({ message: t(wasEditing ? 'portalRates.updateSuccess' : 'portalRates.saveSuccess'), variant: 'success', show: true })
      getRates(token, currency).then(setRates).catch(() => {})
    } catch (err) {
      const message = err instanceof Error ? err.message : t('portalRates.saveError')
      setSnackbar({ message, variant: 'error', show: true })
    } finally {
      setIsSaving(false)
    }
  }

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
        {loadState === 'loading' && <LoadingSpinner className="portal-rates__spinner" />}

        {loadState !== 'loading' && rates.length === 0 && (
          <div className="portal-rates__empty">
            <Inbox size={48} className="portal-rates__empty-icon" />
            <p className="portal-rates__empty-title">{t('portalRates.empty.title')}</p>
            <p className="portal-rates__empty-subtitle">{t('portalRates.empty.subtitle')}</p>
          </div>
        )}

        {loadState !== 'loading' && rates.length > 0 && (
          <table className="portal-rates__table">
            <thead>
              <tr>
                <th>{t('portalRates.columns.property')}</th>
                <th>{t('portalRates.columns.roomType')}</th>
                <th>{t('portalRates.columns.baseRate')}</th>
                <th>{t('portalRates.columns.offerRate')}</th>
                <th>{t('portalRates.columns.availability')}</th>
                <th>{t('portalRates.columns.offerStatus')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rates.map(rate => {
                const status = rate.offer_active ? 'active' : 'inactive'

                return (
                  <tr key={rate.room_id}>
                    <td>{rate.property_name}</td>
                    <td>{rate.room_type}</td>
                    <td>
                      <span className="portal-rates__price">
                        <span>$</span>{formatPrice(rate.base_rate)}
                      </span>
                    </td>
                    <td>
                      <span className="portal-rates__price">
                        <span>$</span>{formatPrice(rate.offer_rate)}
                      </span>
                    </td>
                    <td>{rate.available_rooms}/{rate.total_units}</td>
                    <td>
                      <span className={`portal-rates__badge portal-rates__badge--${status}`}>
                        {status === 'active' ? t('portalRates.status.active') : t('portalRates.status.inactive')}
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
                )
              })}
            </tbody>
          </table>
        )}
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
        properties={properties}
        onSave={handleSave}
        isSaving={isSaving}
        initialData={editingRate ? {
          roomType: editingRate.room_type,
          baseRate: editingRate.base_rate,
          offerRate: editingRate.offer_rate,
          availableRooms: editingRate.available_rooms,
          totalRooms: editingRate.total_units,
          isActive: editingRate.offer_active,
          propertyId: editingRate.property_id,
        } : undefined}
      />

      <Snackbar
        show={snackbar.show}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar(s => ({ ...s, show: false }))}
        duration={4000}
      />
    </div>
  )
}

export default PortalRates
