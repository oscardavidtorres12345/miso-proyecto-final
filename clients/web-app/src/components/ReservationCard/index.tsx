import { useTranslation } from "react-i18next";
import { CalendarDays, MapPin, Users } from "lucide-react";
import Button from "@/components/Button";
import { formatDate } from "@/utils/searchFormat";
import "./ReservationCard.css";

export type ReservationCardData = {
  id: string;
  imageUrl: string;
  accommodationName: string;
  location: string;
  arrival: Date;
  departure: Date;
  guestCount: number;
  showCancel?: boolean;
};

type ReservationCardProps = ReservationCardData & {
  onCancel?: () => void;
};

const ReservationCard = ({
  imageUrl,
  accommodationName,
  location,
  arrival,
  departure,
  guestCount,
  showCancel = true,
  onCancel,
}: ReservationCardProps) => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const dateRange = `${formatDate(arrival, lang)} - ${formatDate(departure, lang)}`;
  const guestText = t("bookings.guestCount", { count: guestCount });
  return (
    <article className="reservation-card">
      <div className="reservation-card__top">
        <div className="reservation-card__image-wrap">
          <img className="reservation-card__image" src={imageUrl} alt="" />
        </div>
        <div className="reservation-card__body">
          <h2 className="reservation-card__name">{accommodationName}</h2>
          <p className="reservation-card__location">{location}</p>
          <div className="reservation-card__meta">
            <p className="reservation-card__meta-item">
              <MapPin size={16} aria-hidden />
              <span>{location}</span>
            </p>
            <p className="reservation-card__meta-item">
              <CalendarDays size={16} aria-hidden />
              <span>{dateRange}</span>
            </p>
            <p className="reservation-card__meta-item">
              <Users size={16} aria-hidden />
              <span>{guestText}</span>
            </p>
          </div>
          <div className="reservation-card__section reservation-card__section--dates">
            <h3 className="reservation-card__section-title">
              {t("bookings.dates")}
            </h3>
            <div className="reservation-card__dates">
              <div className="reservation-card__date-col reservation-card__date-col--arrival">
                <p className="reservation-card__date-label">
                  {t("bookings.arrival")}
                </p>
                <p className="reservation-card__date-value">
                  {formatDate(arrival, lang)}
                </p>
              </div>
              <div
                className="reservation-card__dates-divider"
                role="presentation"
              />
              <div className="reservation-card__date-col reservation-card__date-col--departure">
                <p className="reservation-card__date-label">
                  {t("bookings.departure")}
                </p>
                <p className="reservation-card__date-value">
                  {formatDate(departure, lang)}
                </p>
              </div>
            </div>
          </div>
          <div className="reservation-card__section reservation-card__section--guests">
            <h3 className="reservation-card__section-title">
              {t("bookings.guests")}
            </h3>
            <p className="reservation-card__guests">{guestCount}</p>
          </div>
          {showCancel ? (
            <div className="reservation-card__actions reservation-card__actions--inline">
              <Button
                type="button"
                variant="secondary"
                className="reservation-card__cancel"
                onClick={onCancel}
              >
                {t("bookings.cancelReservation")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      {showCancel ? (
        <div className="reservation-card__actions reservation-card__actions--stacked">
          <Button
            type="button"
            variant="secondary"
            className="reservation-card__cancel"
            onClick={onCancel}
          >
            {t("bookings.cancelReservation")}
          </Button>
        </div>
      ) : null}
    </article>
  );
};

export default ReservationCard;
