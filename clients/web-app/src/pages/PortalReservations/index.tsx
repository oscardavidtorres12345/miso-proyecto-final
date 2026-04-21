import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import PortalReservationCard from '@/components/PortalReservationCard'
import Snackbar from '@/components/Snackbar'
import { mockPortalReservations } from '@/mocks/portalReservations'
import './PortalReservations.css'

const PortalReservations = () => {
  const { t } = useTranslation()
  const [showConfirmSnackbar, setShowConfirmSnackbar] = useState(false)
  const [confirmedReservationIds, setConfirmedReservationIds] = useState<string[]>([])

  const handleConfirm = (reservationId: string) => {
    setConfirmedReservationIds((current) =>
      current.includes(reservationId) ? current : [...current, reservationId],
    )
    setShowConfirmSnackbar(true)
  }

  return (
    <section className="portal-reservations page-container page-section">
      <h1 className="portal-reservations__title">{t('sidebar.reservations')}</h1>
      <ul className="portal-reservations__list">
        {mockPortalReservations.map((reservation) => (
          <li key={reservation.id} className="portal-reservations__item">
            <PortalReservationCard
              {...reservation}
              onConfirm={() => handleConfirm(reservation.id)}
              showConfirmButton={!confirmedReservationIds.includes(reservation.id)}
            />
          </li>
        ))}
      </ul>
      <Snackbar
        show={showConfirmSnackbar}
        message={t('portalReservations.confirmSuccess')}
        variant="success"
        onClose={() => setShowConfirmSnackbar(false)}
      />
    </section>
  )
}

export default PortalReservations
