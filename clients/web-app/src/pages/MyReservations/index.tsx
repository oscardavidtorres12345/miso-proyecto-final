import BookingsChrome from '@/components/BookingsChrome'
import ReservationCard from '@/components/ReservationCard'
import { mockCurrentReservations } from '@/mocks/reservations'

const MyReservations = () => (
  <BookingsChrome
    titleKey="bookings.myReservationsTitle"
    switchHref="/past-trips"
    switchLabelKey="bookings.switchToPast"
  >
    <ul className="bookings-page__list">
      {mockCurrentReservations.map((item) => (
        <li key={item.id} className="bookings-page__list-item">
          <ReservationCard {...item} />
        </li>
      ))}
    </ul>
  </BookingsChrome>
)

export default MyReservations
