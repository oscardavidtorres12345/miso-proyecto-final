import BookingsChrome from "@/components/BookingsChrome";
import PastTripCard from "@/components/PastTripCard";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getUserConfirmedPastBookings, type ReservationListItemDto } from "@/services/bookingService";
import { parseIsoDate } from "@/utils/searchFormat";
import "./PastTrips.css";

const toCardData = (item: ReservationListItemDto) => ({
  ...item,
  arrival: parseIsoDate(item.arrival) ?? new Date(item.arrival),
  departure: parseIsoDate(item.departure) ?? new Date(item.departure),
  status: item.status,
});

const PastTrips = () => {
  const { session } = useAuth();
  const { t } = useTranslation();
  const [reservations, setReservations] = useState<ReservationListItemDto[]>([]);

  useEffect(() => {
    if (!session) return;
    getUserConfirmedPastBookings(String(session.user.user_id))
      .then((data) => setReservations(data.reservations))
      .catch(() => setReservations([]));
  }, [session]);

  return (
    <BookingsChrome
      titleKey="bookings.pastTripsTitle"
      switchHref="/reservations"
      switchLabelKey="bookings.switchToCurrent"
    >
      {reservations.length === 0 ? (
        <p className="bookings-page__empty-message">{t("bookings.emptyMessage")}</p>
      ) : (
        <ul className="past-trips-page__list">
          {reservations.map((item) => (
            <li key={item.id} className="past-trips-page__item">
              <PastTripCard {...toCardData(item)} />
            </li>
          ))}
        </ul>
      )}
    </BookingsChrome>
  );
};

export default PastTrips;
