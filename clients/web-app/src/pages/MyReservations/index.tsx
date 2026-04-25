import BookingsChrome from '@/components/BookingsChrome'
import Modal from '@/components/Modal'
import ReservationCard from '@/components/ReservationCard'
import Snackbar from '@/components/Snackbar'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getUserConfirmedUpcomingBookings, userCancelBooking, type ReservationListItemDto } from '@/services/bookingService'

type SnackbarState = { show: boolean; variant: 'success' | 'error'; message: string }

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
  const [snackbar, setSnackbar] = useState<SnackbarState>({ show: false, variant: 'success', message: '' })

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
    if (!selectedReservationId || !session) return
    
    const bookingId = selectedReservationId
    closeCancelModal()
    userCancelBooking(bookingId, session.user.user_id)
      .then(() => {
        setReservations((prev) => prev.filter((r) => r.id !== bookingId))
        setSnackbar({ show: true, variant: 'success', message: t('portalReservations.cancelSuccess') })
      })
      .catch(() => {
        setSnackbar({ show: true, variant: 'error', message: t('portalReservations.cancelError') })
      })
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
      <Snackbar
        show={snackbar.show}
        variant={snackbar.variant}
        message={snackbar.message}
        onClose={() => setSnackbar((s) => ({ ...s, show: false }))}
      />
    </BookingsChrome>
  )
}

export default MyReservations
