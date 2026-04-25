import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import './RateFormModal.css'

export interface PropertyOption {
  property_id: number
  property_name: string
}

export interface RateFormData {
  roomType: string
  baseRate: number
  offerRate: number
  availableRooms: number
  totalRooms: number
  isActive: boolean
  propertyId: number
}

interface RateFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: RateFormData
  properties: PropertyOption[]
  onSave?: (data: RateFormData) => void
  isSaving?: boolean
}

const RateFormModal = ({ isOpen, onClose, initialData, properties, onSave, isSaving = false }: RateFormModalProps) => {
  const { t } = useTranslation()
  const [roomType, setRoomType] = useState('')
  const [baseRate, setBaseRate] = useState('')
  const [offerRate, setOfferRate] = useState('')
  const [availableRooms, setAvailableRooms] = useState('')
  const [totalRooms, setTotalRooms] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [propertyId, setPropertyId] = useState<number>(0)

  useEffect(() => {
    if (!isOpen) return
    if (initialData) {
      setRoomType(initialData.roomType)
      setBaseRate(String(initialData.baseRate))
      setOfferRate(String(initialData.offerRate))
      setAvailableRooms(String(initialData.availableRooms))
      setTotalRooms(String(initialData.totalRooms))
      setIsActive(initialData.isActive)
      setPropertyId(initialData.propertyId)
    } else {
      setRoomType('')
      setBaseRate('')
      setOfferRate('')
      setAvailableRooms('')
      setTotalRooms('')
      setIsActive(true)
      setPropertyId(0)
    }
  }, [initialData, isOpen])

  const offerRateInvalid =
    offerRate !== '' &&
    baseRate !== '' &&
    parseFloat(offerRate) >= parseFloat(baseRate)

  const isFormValid =
    roomType.trim().length > 0 &&
    parseFloat(baseRate) > 0 &&
    parseFloat(offerRate) > 0 &&
    !offerRateInvalid &&
    parseInt(availableRooms, 10) >= 0 &&
    parseInt(totalRooms, 10) > 0 &&
    (!!initialData || propertyId > 0)

  const title = initialData
    ? t('portalRates.modal.editTitle')
    : t('portalRates.modal.title')

  const body = (
    <div className="rate-form">
      <div className="rate-form__field">
        <label className="rate-form__label" htmlFor="add-property">
          {t('portalRates.modal.labels.property')}
        </label>
        <div className="input-box">
          <select
            id="add-property"
            className="input"
            value={propertyId}
            disabled={!!initialData}
            onChange={e => setPropertyId(Number(e.target.value))}
          >
            {!initialData && (
              <option value={0} disabled>
                {t('portalRates.modal.placeholders.property')}
              </option>
            )}
            {properties.map(p => (
              <option key={p.property_id} value={p.property_id}>
                {p.property_name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
            min="0"
            onChange={e => setBaseRate(e.target.value)}
          />
        </div>
      </div>

      <div className="rate-form__field">
        <label className="rate-form__label" htmlFor="add-offer-rate">
          {t('portalRates.columns.offerRate')}
        </label>
        <Input
          id="add-offer-rate"
          type="number"
          placeholder={t('portalRates.modal.placeholders.offerRate')}
          value={offerRate}
          min="0"
          onChange={e => setOfferRate(e.target.value)}
          error={offerRateInvalid}
          errorMessage={t('portalRates.modal.errors.offerRateInvalid')}
        />
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
              min="0"
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
              min="1"
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
        <Button
          variant="primary"
          className="rate-form__save-btn"
          disabled={!isFormValid || isSaving}
          onClick={() => onSave?.({
            propertyId,
            roomType,
            baseRate: parseFloat(baseRate),
            offerRate: parseFloat(offerRate),
            availableRooms: parseInt(availableRooms, 10),
            totalRooms: parseInt(totalRooms, 10),
            isActive,
          })}
        >
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
