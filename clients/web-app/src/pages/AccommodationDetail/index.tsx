import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { LogIn, ShoppingCart } from "lucide-react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import breakfastIcon from "@/assets/breakfast.svg";
import Button from "@/components/Button";
import Container from "@/components/Container";
import { useSearch } from "@/context/SearchContext";
import { formatPrice } from "@/utils/accommodation";
import { getHotelById, type HotelDetail } from "@/services/accommodationService";
import "./AccommodationDetail.css";

const AccommodationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { dateRange, guests } = useSearch();
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const params = {
      checkIn: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      checkOut: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      adults: guests.adults,
    };
    getHotelById(id, params)
      .then(setHotel)
      .catch(() => setError("Failed to load hotel details"))
      .finally(() => setLoading(false));
  }, [id, dateRange, guests.adults]);

  if (loading) {
    return (
      <main className="accommodation-detail">
        <Container>
          <p className="accommodation-detail__loading">{t("common.loading")}</p>
        </Container>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="accommodation-detail">
        <Container>
          <p className="accommodation-detail__error">{error ?? t("common.error")}</p>
        </Container>
      </main>
    );
  }

  const suggestedRoomData = hotel.rooms.find((r) => r.name === hotel.suggestedRoom.name) ?? hotel.rooms[0];
  const hasBreakfast = hotel.suggestedRoom.mealPlan === "breakfast";
  const schedule = {
    checkInFrom: hotel.schedule.checkIn.from,
    checkInTo: hotel.schedule.checkIn.to,
    checkOut: hotel.schedule.checkOut.time,
  };

  return (
    <main className="accommodation-detail">
      <Container>
        {/* Photo Gallery */}
        <section className="accommodation-detail__gallery" aria-label={hotel.name}>
          <img
            src={hotel.photos[0]?.url}
            alt={hotel.photos[0]?.alt ?? hotel.name}
            className="accommodation-detail__gallery-main"
          />
          <div className="accommodation-detail__gallery-grid">
            {hotel.photos.slice(1).map((photo, i) => (
              <img
                key={i}
                src={photo.url}
                alt={photo.alt ?? `${hotel.name} ${i + 2}`}
                className="accommodation-detail__gallery-thumb"
              />
            ))}
          </div>
        </section>

        {/* Hotel info + pricing widget */}
        <div className="accommodation-detail__info-row">
          <div className="accommodation-detail__info">
            <div className="accommodation-detail__info-header">
              <h1 className="accommodation-detail__name">{hotel.name}</h1>
              <div className="accommodation-detail__stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={20}
                    fill={i < hotel.stars ? "#53BFCB" : "none"}
                    className="accommodation-detail__star"
                  />
                ))}
              </div>
            </div>
            <p className="accommodation-detail__description">{hotel.description}</p>
          </div>

          {/* Pricing widget */}
          <aside className="accommodation-detail__widget">
            <div className="accommodation-detail__widget-header">
              <span className="accommodation-detail__widget-room">
                {hotel.suggestedRoom.name}
              </span>
              {hasBreakfast && (
                <div className="accommodation-detail__widget-pill">
                  <img
                    src={breakfastIcon}
                    alt={t("accommodationCard.breakfastAlt")}
                    className="accommodation-detail__widget-pill-icon"
                  />
                  <span>{t("accommodationCard.breakfast")}</span>
                </div>
              )}
            </div>
            {suggestedRoomData && (
              <>
                <p className="accommodation-detail__widget-nights">
                  {t("accommodationCard.nightsAdults", {
                    nights: suggestedRoomData.price.nights,
                    adults: suggestedRoomData.price.adults,
                  })}
                </p>
                <div className="accommodation-detail__widget-price-row">
                  <span className="accommodation-detail__widget-price-symbol">$</span>
                  <span className="accommodation-detail__widget-price-amount">
                    {formatPrice(suggestedRoomData.price.totalAmount)}
                  </span>
                  <span className="accommodation-detail__widget-price-currency">
                    {suggestedRoomData.price.currency}
                  </span>
                </div>
                {suggestedRoomData.price.includesTaxes && (
                  <p className="accommodation-detail__widget-taxes">
                    {t("accommodationCard.includesTaxes")}
                  </p>
                )}
              </>
            )}
            <Button variant="primary" className="accommodation-detail__widget-btn">
              {t("accommodationDetail.viewRooms")}
            </Button>
          </aside>
        </div>

        {/* Amenities */}
        <section className="accommodation-detail__section">
          <h2 className="accommodation-detail__section-title">
            {t("accommodationDetail.amenities")}
          </h2>
          <ul className="accommodation-detail__amenities-list">
            {hotel.amenities.map((amenity) => (
              <li key={amenity.id} className="accommodation-detail__amenity">
                {t(`accommodationDetail.amenity.${amenity.id}`, { defaultValue: amenity.id })}
              </li>
            ))}
          </ul>
        </section>

        {/* Schedule */}
        <section className="accommodation-detail__section">
          <h2 className="accommodation-detail__section-title">
            {t("accommodationDetail.schedule")}
          </h2>
          <div className="accommodation-detail__schedule">
            <div className="accommodation-detail__schedule-row">
              <LogIn size={18} className="accommodation-detail__schedule-icon" />
              <span>
                {t("accommodationDetail.checkIn", {
                  from: schedule.checkInFrom,
                  to: schedule.checkInTo,
                })}
              </span>
            </div>
            <div className="accommodation-detail__schedule-row">
              <LogIn
                size={18}
                className="accommodation-detail__schedule-icon accommodation-detail__schedule-icon--out"
              />
              <span>
                {t("accommodationDetail.checkOut", { time: schedule.checkOut })}
              </span>
            </div>
          </div>
        </section>

        {/* Rooms */}
        <section className="accommodation-detail__section">
          <h2 className="accommodation-detail__section-title">
            {t("accommodationDetail.rooms")}
          </h2>
          <div className="accommodation-detail__rooms-grid">
            {hotel.rooms.map((room) => (
              <div key={room.id} className="accommodation-detail__room-card">
                <img
                  src={room.images[0]}
                  alt={room.name}
                  className="accommodation-detail__room-image"
                />
                <div className="accommodation-detail__room-body">
                  <h3 className="accommodation-detail__room-name">{room.name}</h3>
                  <p className="accommodation-detail__room-description">
                    {room.description}
                  </p>
                  <p className="accommodation-detail__room-nights">
                    {t("accommodationCard.nightsAdults", {
                      nights: room.price.nights,
                      adults: room.price.adults,
                    })}
                  </p>
                  <div className="accommodation-detail__room-price-row">
                    <span className="accommodation-detail__room-price-symbol">$</span>
                    <span className="accommodation-detail__room-price-amount">
                      {formatPrice(room.price.totalAmount)}
                    </span>
                    <span className="accommodation-detail__room-price-currency">
                      {room.price.currency}
                    </span>
                  </div>
                  {room.price.includesTaxes && (
                    <p className="accommodation-detail__room-taxes">
                      {t("accommodationCard.includesTaxes")}
                    </p>
                  )}
                  <div className="accommodation-detail__room-per-night">
                    <span className="accommodation-detail__room-per-night-price">
                      $ {formatPrice(room.price.pricePerNight)} {room.price.currency}
                    </span>
                    <span className="accommodation-detail__room-per-night-label">
                      {t("accommodationDetail.perNight")}
                    </span>
                  </div>
                  <div className="accommodation-detail__room-actions">
                    <Button variant="primary" className="accommodation-detail__room-btn">
                      {t("accommodationDetail.selectRoom")}
                    </Button>
                    <Button
                      variant="secondary"
                      className="accommodation-detail__room-btn accommodation-detail__room-btn--cart"
                    >
                      <ShoppingCart size={16} />
                      {t("accommodationDetail.addToCart")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
};

export default AccommodationDetail;
