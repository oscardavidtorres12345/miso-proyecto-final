import Button from '@/components/Button'
import { useTranslation } from 'react-i18next'
import './PortalReservationCard.css'

export type PortalReservationCardData = {
  id: string
  userName: string
  arrival: string
  departure: string
  roomType: string
  guestCount: number
}

type PortalReservationCardProps = PortalReservationCardData & {
  onConfirm?: () => void
  onCancel?: () => void
  showConfirmButton?: boolean
  disableConfirmButton?: boolean
  disableCancelButton?: boolean
}

const PortalReservationCard = ({
  userName,
  arrival,
  departure,
  roomType,
  guestCount,
  onConfirm,
  onCancel,
  showConfirmButton = true,
  disableConfirmButton = false,
  disableCancelButton = false,
}: PortalReservationCardProps) => {
  const { t } = useTranslation()
  const initial = userName.trim().charAt(0).toUpperCase()

  return (
    <article className="portal-reservation-card">
      <div className="portal-reservation-card__initial">{initial}</div>

      <div className="portal-reservation-card__content">
        <div className="portal-reservation-card__group">
          <h3 className="portal-reservation-card__title">{t('bookings.dates')}</h3>
          <div className="portal-reservation-card__dates">
            <p className="portal-reservation-card__date-item">
              <span>{t('bookings.arrival')}</span>
              <strong>{arrival}</strong>
            </p>
            <span className="portal-reservation-card__separator" />
            <p className="portal-reservation-card__date-item">
              <span>{t('bookings.departure')}</span>
              <strong>{departure}</strong>
            </p>
          </div>
        </div>

        <div className="portal-reservation-card__group">
          <h3 className="portal-reservation-card__title">{t('portalReservations.room')}</h3>
          <p className="portal-reservation-card__value">{roomType}</p>
        </div>

        <div className="portal-reservation-card__group">
          <h3 className="portal-reservation-card__title">
            {t('bookings.guestLabel', { count: guestCount })}
          </h3>
          <p className="portal-reservation-card__value">{guestCount}</p>
        </div>
      </div>

      <div className="portal-reservation-card__actions">
        {showConfirmButton ? (
          <Button
            type="button"
            variant="primary"
            className="portal-reservation-card__button"
            onClick={onConfirm}
            disabled={disableConfirmButton}
          >
            {t('portalReservations.confirm')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="portal-reservation-card__button"
          onClick={onCancel}
          disabled={disableCancelButton}
        >
          {t('subview.cancel')}
        </Button>
      </div>
    </article>
  )
}

export default PortalReservationCard
