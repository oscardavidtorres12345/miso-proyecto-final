import { LogIn, ShoppingCart } from "lucide-react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import breakfastIcon from "@/assets/breakfast.svg";
import Button from "@/components/Button";
import Container from "@/components/Container";
import { formatPrice } from "@/utils/accommodation";
import "./AccommodationDetail.css";

const DESCRIPTION =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.";

const AMENITIES = [
  "Lorem Ipsum",
  "Lorem Ipsum",
  "Lorem Ipsum",
  "Lorem Ipsum",
  "Lorem Ipsum",
  "Lorem Ipsum",
  "Lorem Ipsum",
  "Lorem Ipsum",
  "Lorem Ipsum",
];

const IMAGES = [
  "https://picsum.photos/seed/hotel1a/800/600",
  "https://picsum.photos/seed/hotel1b/400/300",
  "https://picsum.photos/seed/hotel1c/400/300",
  "https://picsum.photos/seed/hotel1d/400/300",
  "https://picsum.photos/seed/hotel1e/400/300",
];

const ROOMS = [
  {
    id: "1",
    name: "Suite Junior",
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    image: "https://picsum.photos/seed/room1a/400/300",
    hasBreakfast: true,
    price: { amount: 5000000, currency: "COP", nights: 24, adults: 2, includesTaxes: false },
  },
  {
    id: "2",
    name: "Suite Junior",
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    image: "https://picsum.photos/seed/room1b/400/300",
    hasBreakfast: true,
    price: { amount: 5000000, currency: "COP", nights: 24, adults: 2, includesTaxes: false },
  },
  {
    id: "3",
    name: "Suite Junior",
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    image: "https://picsum.photos/seed/room1c/400/300",
    hasBreakfast: true,
    price: { amount: 5000000, currency: "COP", nights: 24, adults: 2, includesTaxes: false },
  },
];

const HOTEL_NAME = "Aonang Villa Resort";
const HOTEL_STARS = 4;
const FEATURED_ROOM = ROOMS[0];
const SCHEDULE = { checkInFrom: "15:00", checkInTo: "23:59", checkOut: "13:00" };

const AccommodationDetail = () => {
  const { t } = useTranslation();

  return (
    <main className="accommodation-detail">
      <Container>
        {/* Photo Gallery */}
        <section className="accommodation-detail__gallery" aria-label={HOTEL_NAME}>
          <img
            src={IMAGES[0]}
            alt={HOTEL_NAME}
            className="accommodation-detail__gallery-main"
          />
          <div className="accommodation-detail__gallery-grid">
            {IMAGES.slice(1).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${HOTEL_NAME} ${i + 2}`}
                className="accommodation-detail__gallery-thumb"
              />
            ))}
          </div>
        </section>

        {/* Hotel info + pricing widget */}
        <div className="accommodation-detail__info-row">
          <div className="accommodation-detail__info">
            <h1 className="accommodation-detail__name">{HOTEL_NAME}</h1>
            <div className="accommodation-detail__stars">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < HOTEL_STARS ? "currentColor" : "none"}
                  className="accommodation-detail__star"
                />
              ))}
            </div>
            <p className="accommodation-detail__description">{DESCRIPTION}</p>
          </div>

          {/* Pricing widget */}
          <aside className="accommodation-detail__widget">
            <div className="accommodation-detail__widget-header">
              <span className="accommodation-detail__widget-room">
                {FEATURED_ROOM.name}
              </span>
              {FEATURED_ROOM.hasBreakfast && (
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
            <p className="accommodation-detail__widget-nights">
              {t("accommodationCard.nightsAdults", {
                nights: FEATURED_ROOM.price.nights,
                adults: FEATURED_ROOM.price.adults,
              })}
            </p>
            <div className="accommodation-detail__widget-price-row">
              <span className="accommodation-detail__widget-price-symbol">$</span>
              <span className="accommodation-detail__widget-price-amount">
                {formatPrice(FEATURED_ROOM.price.amount)}
              </span>
              <span className="accommodation-detail__widget-price-currency">
                {FEATURED_ROOM.price.currency}
              </span>
            </div>
            {FEATURED_ROOM.price.includesTaxes && (
              <p className="accommodation-detail__widget-taxes">
                {t("accommodationCard.includesTaxes")}
              </p>
            )}
            <Button variant="primary" className="accommodation-detail__widget-btn">
              {t("accommodationDetail.viewRooms")}
            </Button>
          </aside>
        </div>

        {/* Amenidades */}
        <section className="accommodation-detail__section">
          <h2 className="accommodation-detail__section-title">
            {t("accommodationDetail.amenities")}
          </h2>
          <ul className="accommodation-detail__amenities-list">
            {AMENITIES.map((amenity, i) => (
              <li key={i} className="accommodation-detail__amenity">
                {amenity}
              </li>
            ))}
          </ul>
        </section>

        {/* Horarios */}
        <section className="accommodation-detail__section">
          <h2 className="accommodation-detail__section-title">
            {t("accommodationDetail.schedule")}
          </h2>
          <div className="accommodation-detail__schedule">
            <div className="accommodation-detail__schedule-row">
              <LogIn size={18} className="accommodation-detail__schedule-icon" />
              <span>
                {t("accommodationDetail.checkIn", {
                  from: SCHEDULE.checkInFrom,
                  to: SCHEDULE.checkInTo,
                })}
              </span>
            </div>
            <div className="accommodation-detail__schedule-row">
              <LogIn
                size={18}
                className="accommodation-detail__schedule-icon accommodation-detail__schedule-icon--out"
              />
              <span>
                {t("accommodationDetail.checkOut", { time: SCHEDULE.checkOut })}
              </span>
            </div>
          </div>
        </section>

        {/* Habitaciones */}
        <section className="accommodation-detail__section">
          <h2 className="accommodation-detail__section-title">
            {t("accommodationDetail.rooms")}
          </h2>
          <div className="accommodation-detail__rooms-grid">
            {ROOMS.map((room) => {
              const perNight = Math.round(room.price.amount / room.price.nights);
              return (
                <div key={room.id} className="accommodation-detail__room-card">
                  <img
                    src={room.image}
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
                        {formatPrice(room.price.amount)}
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
                        $ {formatPrice(perNight)} {room.price.currency}
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
              );
            })}
          </div>
        </section>
      </Container>
    </main>
  );
};

export default AccommodationDetail;
