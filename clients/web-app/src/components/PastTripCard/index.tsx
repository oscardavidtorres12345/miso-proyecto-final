import { CalendarDays, MapPin, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/utils/searchFormat";
import "./PastTripCard.css";

type PastTripCardProps = {
  imageUrl: string;
  accommodationName: string;
  location: string;
  arrival: Date;
  departure: Date;
  guestCount: number;
};

const PastTripCard = ({
  imageUrl,
  accommodationName,
  location,
  arrival,
  departure,
  guestCount,
}: PastTripCardProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const dateRange = `${formatDate(arrival, lang)} - ${formatDate(departure, lang)}`;

  return (
    <article className="past-trip-card">
      <div className="past-trip-card__image-wrap">
        <img className="past-trip-card__image" src={imageUrl} alt="" />
      </div>
      <div className="past-trip-card__content">
        <h2 className="past-trip-card__name">{accommodationName}</h2>
        <p className="past-trip-card__meta">
          <MapPin size={18} aria-hidden />
          <span>{location}</span>
        </p>
        <p className="past-trip-card__meta">
          <CalendarDays size={18} aria-hidden />
          <span>{dateRange}</span>
        </p>
        <p className="past-trip-card__meta">
          <Users size={18} aria-hidden />
          <span>{t("bookings.guestCount", { count: guestCount })}</span>
        </p>
      </div>
    </article>
  );
};

export default PastTripCard;
