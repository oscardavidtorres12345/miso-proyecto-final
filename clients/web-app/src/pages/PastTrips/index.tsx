import BookingsChrome from "@/components/BookingsChrome";
import PastTripCard from "@/components/PastTripCard";
import { mockPastReservations } from "@/mocks/reservations";
import "./PastTrips.css";

const PastTrips = () => (
  <BookingsChrome
    titleKey="bookings.pastTripsTitle"
    switchHref="/reservations"
    switchLabelKey="bookings.switchToCurrent"
  >
    <ul className="past-trips-page__list">
      {mockPastReservations.map((item) => (
        <li key={item.id} className="past-trips-page__item">
          <PastTripCard {...item} />
        </li>
      ))}
    </ul>
  </BookingsChrome>
);

export default PastTrips;
