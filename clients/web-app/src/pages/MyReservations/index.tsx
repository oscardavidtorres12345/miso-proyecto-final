import BookingsChrome from '@/components/BookingsChrome'
import Modal from '@/components/Modal'
import ReservationCard from '@/components/ReservationCard'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserConfirmedUpcomingBookings, type ReservationListItemDto } from '@/services/bookingService'

const toCardData = (item: ReservationListItemDto) => ({
  ...item,
  arrival: new Date(item.arrival),
  departure: new Date(item.departure),
})

const MyReservations = () => {
  const { session } = useAuth()
  const { t } = useTranslation()
  const [reservations, setReservations] = useState<ReservationListItemDto[]>([])
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    getUserConfirmedUpcomingBookings(String(session.user.user_id))
      .then((data) => setReservations(data.reservations))
      .catch(() => setReservations([]))
  }, [session])

  const closeCancelModal = () => {
    setSelectedReservationId(null)
  }

  const handleCancelConfirm = () => {
    if (!selectedReservationId) return
    // TODO: Conectar endpoint de cancelación usando selectedReservationId.
    closeCancelModal()
  }

  return (
    <BookingsChrome
      titleKey="bookings.myReservationsTitle"
      switchHref="/past-trips"
      switchLabelKey="bookings.switchToPast"
    >
      {reservations.length === 0 ? (
        <p className="bookings-page__empty-message">{t('bookings.emptyMessage')}</p>
      ) : (
        <ul className="bookings-page__list">
          {reservations.map((item) => (
            <li key={item.id} className="bookings-page__list-item">
              <ReservationCard {...toCardData(item)} onCancel={() => setSelectedReservationId(item.id)} />
            </li>
          ))}
        </ul>
      )}
      <Modal
        isOpen={selectedReservationId !== null}
        onClose={closeCancelModal}
        title={t('bookings.cancelReservationModalTitle')}
        message={t('bookings.cancelReservationModalMessage')}
        cancelLabel={t('bookings.cancelReservationModalDismiss')}
        confirmLabel={t('bookings.cancelReservationModalConfirm')}
        onConfirm={handleCancelConfirm}
      />
    </BookingsChrome>
  )
}

export default MyReservations
