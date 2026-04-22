import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import './RateFormModal.css'

export interface RateFormData {
  roomType: string
  baseRate: number
  offerRate: number
  availableRooms: number
  totalRooms: number
  isActive: boolean
}

interface RateFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: RateFormData
}

const RateFormModal = ({ isOpen, onClose, initialData }: RateFormModalProps) => {
  const { t } = useTranslation()
  const [roomType, setRoomType] = useState('')
  const [baseRate, setBaseRate] = useState('')
  const [offerRate, setOfferRate] = useState('')
  const [availableRooms, setAvailableRooms] = useState('')
  const [totalRooms, setTotalRooms] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (initialData) {
      setRoomType(initialData.roomType)
      setBaseRate(String(initialData.baseRate))
      setOfferRate(String(initialData.offerRate))
      setAvailableRooms(String(initialData.availableRooms))
      setTotalRooms(String(initialData.totalRooms))
      setIsActive(initialData.isActive)
    } else {
      setRoomType('')
      setBaseRate('')
      setOfferRate('')
      setAvailableRooms('')
      setTotalRooms('')
      setIsActive(true)
    }
  }, [initialData, isOpen])

  const title = initialData
    ? t('portalRates.modal.editTitle')
    : t('portalRates.modal.title')

  const body = (
    <div className="rate-form">
      <div className="rate-form__field">
        <label className="rate-form__label" htmlFor="add-room-type">
          {t('portalRates.columns.roomType')}
        </label>
        <div className="input-box">
          <Input
            id="add-room-type"
            type="text"
            placeholder={t('portalRates.modal.placeholders.roomType')}
            value={roomType}
            onChange={e => setRoomType(e.target.value)}
          />
        </div>
      </div>

      <div className="rate-form__field">
        <label className="rate-form__label" htmlFor="add-base-rate">
          {t('portalRates.columns.baseRate')}
        </label>
        <div className="input-box">
          <Input
            id="add-base-rate"
            type="number"
            placeholder={t('portalRates.modal.placeholders.baseRate')}
            value={baseRate}
            onChange={e => setBaseRate(e.target.value)}
          />
        </div>
      </div>

      <div className="rate-form__field">
        <label className="rate-form__label" htmlFor="add-offer-rate">
          {t('portalRates.columns.offerRate')}
        </label>
        <div className="input-box">
          <Input
            id="add-offer-rate"
            type="number"
            placeholder={t('portalRates.modal.placeholders.offerRate')}
            value={offerRate}
            onChange={e => setOfferRate(e.target.value)}
          />
        </div>
      </div>

      <div className="rate-form__field">
        <label className="rate-form__label">
          {t('portalRates.columns.availability')}
        </label>
        <div className="rate-form__availability-row">
          <div className="input-box rate-form__availability-input">
            <Input
              aria-label={t('portalRates.modal.ariaLabels.availableRooms')}
              type="number"
              placeholder="15"
              value={availableRooms}
              onChange={e => setAvailableRooms(e.target.value)}
            />
          </div>
          <span className="rate-form__availability-sep">/</span>
          <div className="input-box rate-form__availability-input">
            <Input
              aria-label={t('portalRates.modal.ariaLabels.totalRooms')}
              type="number"
              placeholder="20"
              value={totalRooms}
              onChange={e => setTotalRooms(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rate-form__field rate-form__field--toggle">
        <label className="rate-form__label" htmlFor="add-offer-status">
          {t('portalRates.columns.offerStatus')}
        </label>
        <label className="rate-form__toggle">
          <input
            id="add-offer-status"
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
          />
          <span className="rate-form__toggle-slider" />
        </label>
      </div>

      <div className="rate-form__actions">
        <Button variant="ghost" className="rate-form__cancel-btn" onClick={onClose}>
          {t('portalRates.modal.cancel')}
        </Button>
        <Button variant="primary" className="rate-form__save-btn">
          {t('portalRates.modal.save')}
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      body={body}
    />
  )
}

export default RateFormModal
