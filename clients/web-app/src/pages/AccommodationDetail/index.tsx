import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LogIn, ShoppingCart } from "lucide-react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import breakfastIcon from "@/assets/breakfast.svg";
import Button from "@/components/Button";
import Container from "@/components/Container";
import Snackbar from "@/components/Snackbar";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useSessionCountdown } from "@/context/SessionCountdownContext";
import { formatPrice } from "@/utils/accommodation";
import { createBookingBatch, createBookingHold } from "@/services/bookingService";
import { getHotelById, type HotelDetail, type HotelRoom } from "@/services/accommodationService";
import Spinner from "@/components/Spinner";
import "./AccommodationDetail.css";

const AccommodationDetail = () => {
  const { session } = useAuth();
  const { addLineFromHold } = useCart();
  const { start: startSessionCountdown } = useSessionCountdown();
  const { id: routeId } = useParams<{ id: string }>();
  const [id] = useState(() => {
    const stored = sessionStorage.getItem("accommodation-id-lock");
    if (stored) return stored;
    if (routeId) sessionStorage.setItem("accommodation-id-lock", routeId);
    return routeId;
  });
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [addingRoomId, setAddingRoomId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{
    message: string;
    variant: "success" | "error";
    show: boolean;
  }>({ message: "", variant: "success", show: false });

  useEffect(() => {
    if (!id) return;

    const adultsRaw = Number.parseInt(searchParams.get("adults") ?? "", 10);
    const params = {
      checkIn: searchParams.get("checkIn") ?? undefined,
      checkOut: searchParams.get("checkOut") ?? undefined,
      adults: Number.isFinite(adultsRaw) ? adultsRaw : undefined,
    };

    getHotelById(id, params)
      .then(setHotel)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, searchParams]);

  const checkIn = searchParams.get("checkIn") ?? "";
  const checkOut = searchParams.get("checkOut") ?? "";
  const roomsRaw = Number.parseInt(searchParams.get("rooms") ?? "", 10);
  const adultsRaw = Number.parseInt(searchParams.get("adults") ?? "", 10);
  const childrenRaw = Number.parseInt(searchParams.get("children") ?? "", 10);
  const units = Number.isFinite(roomsRaw) && roomsRaw >= 1 ? roomsRaw : 1;
  const adults = Number.isFinite(adultsRaw) && adultsRaw >= 0 ? adultsRaw : 0;
  const children = Number.isFinite(childrenRaw) && childrenRaw >= 0 ? childrenRaw : 0;
  const guestCount = adults + children;

  const runHoldAndAddLine = async (room: HotelRoom, navigateToCheckout: boolean) => {
    if (!hotel || !session) return;

    setAddingRoomId(room.id);
    try {
      const hold = await createBookingHold({
        property_id: hotel.id,
        room_id: room.id,
        user_id: String(session.user.user_id),
        check_in: checkIn,
        check_out: checkOut,
        units,
        guest_count: guestCount,
        room_type: room.name,
      });
      const bookingId = hold.booking_id;
      if (!bookingId) {
        setSnackbar({
          message: t("accommodationDetail.addToCartError"),
          variant: "error",
          show: true,
        });
        return;
      }
      const image = room.images[0] ?? hotel.photos[0]?.url ?? "";
      if (navigateToCheckout) {
        const batch = await createBookingBatch({
          user_id: String(session.user.user_id),
          booking_ids: [bookingId],
        });
        navigate(`/checkout?bookingId=${encodeURIComponent(batch.booking_id)}&entry=select`, {
          state: {
            checkoutFallbackLineItems: [
              {
                id: bookingId,
                name: `${hotel.name} · ${room.name}`,
                image,
                price: {
                  amount: room.price.totalAmount,
                  currency: room.price.currency,
                },
                breakdown: {
                  stayBase: room.price.totalAmount,
                  charges: 0,
                  taxes: 0,
                  insurance: 0,
                  discount: 0,
                },
                checkIn,
                checkOut,
              },
            ],
          },
        });
      } else {
        addLineFromHold({
          bookingId,
          roomId: room.id,
          hotelName: hotel.name,
          roomName: room.name,
          image,
          amount: room.price.totalAmount,
          currency: room.price.currency,
          checkIn,
          checkOut,
          expiresAt: hold.expires_at ?? null,
        });
      }
      startSessionCountdown(
        hold.expires_at ? { endsAt: hold.expires_at } : undefined,
      );
      if (!navigateToCheckout) {
        setSnackbar({
          message: t("accommodationDetail.addToCartSuccess"),
          variant: "success",
          show: true,
        });
      }
    } catch {
      setSnackbar({
        message: t("accommodationDetail.addToCartError"),
        variant: "error",
        show: true,
      });
    } finally {
      setAddingRoomId(null);
    }
  };

  const handleAddRoomToCart = (room: HotelRoom) => void runHoldAndAddLine(room, false);

  const handleSelectRoomForCheckout = (room: HotelRoom) =>
    void runHoldAndAddLine(room, true);

  if (loading) {
    return (
      <main className="accommodation-detail">
        <Container>
          <div className="accommodation-detail__loading">
            <Spinner size={56} />
          </div>
        </Container>
      </main>
    );
  }

  if (error || !hotel) {
    return (
      <main className="accommodation-detail">
        <Container>
          <p className="accommodation-detail__error-state">
            {t("accommodationDetail.errorLoading")}
          </p>
        </Container>
      </main>
    );
  }

  const suggestedRoomData =
    hotel.rooms.find((r) => r.name === hotel.suggestedRoom.name) ??
    hotel.rooms[0];
  const hasBreakfast = hotel.suggestedRoom.mealPlan === "breakfast";
  const schedule = {
    checkInFrom: hotel.schedule.checkIn.from,
    checkInTo: hotel.schedule.checkIn.to,
    checkOut: hotel.schedule.checkOut.time,
  };

  return (
    <main className="accommodation-detail">
      <Snackbar
        show={snackbar.show}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar((prev) => ({ ...prev, show: false }))}
      />
      <Container>
        <section
          className="accommodation-detail__gallery"
          aria-label={hotel.name}
        >
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
            <p className="accommodation-detail__description">
              {hotel.description || t("accommodationDetail.noDescription")}
            </p>
          </div>

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
                  {`${t("accommodationCard.nightsLine", { count: suggestedRoomData.price.nights })}, ${t("accommodationCard.adultsLine", { count: suggestedRoomData.price.adults })}`}
                </p>
                <div className="accommodation-detail__widget-price-row">
                  <span className="accommodation-detail__widget-price-symbol">
                    $
                  </span>
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
            <Button
              variant="primary"
              className="accommodation-detail__widget-btn"
              onClick={() =>
                document
                  .getElementById("rooms")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {t("accommodationDetail.viewRooms")}
            </Button>
          </aside>
        </div>

        <section className="accommodation-detail__section">
          <h2 className="accommodation-detail__section-title">
            {t("accommodationDetail.amenities")}
          </h2>
          <ul className="accommodation-detail__amenities-list">
            {hotel.amenities.map((amenity) => (
              <li key={amenity.id} className="accommodation-detail__amenity">
                {t(`accommodationDetail.amenityLabel.${amenity.id}`, {
                  defaultValue: amenity.id,
                })}
              </li>
            ))}
          </ul>
        </section>

        <section className="accommodation-detail__section">
          <h2 className="accommodation-detail__section-title">
            {t("accommodationDetail.schedule")}
          </h2>
          <div className="accommodation-detail__schedule">
            <div className="accommodation-detail__schedule-row">
              <LogIn
                size={18}
                className="accommodation-detail__schedule-icon"
              />
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

        <section id="rooms" className="accommodation-detail__section">
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
                  <h3 className="accommodation-detail__room-name">
                    {room.name}
                  </h3>
                  <p className="accommodation-detail__room-description">
                    {room.description}
                  </p>
                  <p className="accommodation-detail__room-nights">
                    {`${t("accommodationCard.nightsLine", { count: room.price.nights })}, ${t("accommodationCard.adultsLine", { count: room.price.adults })}`}
                  </p>
                  <div className="accommodation-detail__room-price-row">
                    <span className="accommodation-detail__room-price-symbol">
                      $
                    </span>
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
                      $ {formatPrice(room.price.pricePerNight)}{" "}
                      {room.price.currency}
                    </span>
                    <span className="accommodation-detail__room-per-night-label">
                      {t("accommodationDetail.perNight")}
                    </span>
                  </div>
                  <div className="accommodation-detail__room-actions">
                    <Button
                      type="button"
                      variant="primary"
                      className="accommodation-detail__room-btn"
                      disabled={addingRoomId === room.id}
                      onClick={() => handleSelectRoomForCheckout(room)}
                    >
                      {t("accommodationDetail.selectRoom")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="accommodation-detail__room-btn accommodation-detail__room-btn--cart"
                      disabled={addingRoomId === room.id}
                      onClick={() => handleAddRoomToCart(room)}
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
