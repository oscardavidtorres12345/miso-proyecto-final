import BookingsChrome from '@/components/BookingsChrome'
import ReservationCard from '@/components/ReservationCard'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cancelBooking, getUserConfirmedUpcomingBookings, type ReservationListItemDto } from '@/services/bookingService'

const toCardData = (item: ReservationListItemDto) => ({
  ...item,
  arrival: new Date(item.arrival),
  departure: new Date(item.departure),
})

const MyReservations = () => {
  const { session } = useAuth()
  const { t } = useTranslation()
  const [reservations, setReservations] = useState<ReservationListItemDto[]>([])

  useEffect(() => {
    if (!session) return
    getUserConfirmedUpcomingBookings(String(session.user.user_id))
      .then((data) => setReservations(data.reservations))
      .catch(() => setReservations([]))
  }, [session])

  const handleCancel = (bookingId: string) => {
    void cancelBooking(bookingId).then(() => {
      setReservations((prev) => prev.filter((r) => r.id !== bookingId))
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
              <ReservationCard {...toCardData(item)} onCancel={() => void handleCancel(item.id)} />
            </li>
          ))}
        </ul>
      )}
    </BookingsChrome>
  )
}

export default MyReservations
