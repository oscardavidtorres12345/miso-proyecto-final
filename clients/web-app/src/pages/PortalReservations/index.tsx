import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PortalReservationCard from "@/components/PortalReservationCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Snackbar from "@/components/Snackbar";
import { useAuth } from "@/context/AuthContext";
import {
  getPortalReservations,
  hotelCancelBooking,
  hotelConfirmBooking,
} from "@/services/bookingService";
import type { BookingSummaryDto } from "@/services/bookingService";
import "./PortalReservations.css";

type LoadState = "loading" | "ready" | "error";

type SnackbarState = {
  show: boolean;
  message: string;
  variant: "success" | "error";
};

const parseLocalIsoDate = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const formatPortalDate = (value: string, language: string): string => {
  const date = parseLocalIsoDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const PortalReservations = () => {
  const { t, i18n } = useTranslation();
  const { token, session } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reservations, setReservations] = useState<BookingSummaryDto[]>([]);
  const [pendingActionById, setPendingActionById] = useState<
    Record<string, boolean>
  >({});
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    show: false,
    message: "",
    variant: "success",
  });

  const auth = useMemo(() => {
    const userId = session?.user.user_id;
    if (!token || !userId) return null;
    return { token, userId };
  }, [token, session?.user.user_id]);

  useEffect(() => {
    if (!auth) {
      setLoadState("error");
      return;
    }

    let cancelled = false;
    setLoadState("loading");
    getPortalReservations(auth)
      .then((response) => {
        if (cancelled) return;
        setReservations(response.bookings);
        setLoadState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadState("error");
        setSnackbar({
          show: true,
          message:
            error instanceof Error
              ? error.message
              : t("portalReservations.loadError"),
          variant: "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [auth, t]);

  const handleConfirm = async (bookingId: string) => {
    if (!auth || pendingActionById[bookingId]) return;
    setPendingActionById((current) => ({ ...current, [bookingId]: true }));
    try {
      await hotelConfirmBooking(auth, bookingId);
      setReservations((current) =>
        current.map((reservation) =>
          reservation.booking_id === bookingId
            ? { ...reservation, hotel_confirmation_status: "CONFIRMED" }
            : reservation,
        ),
      );
      setSnackbar({
        show: true,
        message: t("portalReservations.confirmSuccess"),
        variant: "success",
      });
    } catch {
      setSnackbar({
        show: true,
        message: t("portalReservations.confirmError"),
        variant: "error",
      });
    } finally {
      setPendingActionById((current) => ({ ...current, [bookingId]: false }));
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!auth || pendingActionById[bookingId]) return;
    setPendingActionById((current) => ({ ...current, [bookingId]: true }));
    try {
      await hotelCancelBooking(auth, bookingId);
      setReservations((current) =>
        current.filter((reservation) => reservation.booking_id !== bookingId),
      );
      setSnackbar({
        show: true,
        message: t("portalReservations.cancelSuccess"),
        variant: "success",
      });
    } catch {
      setSnackbar({
        show: true,
        message: t("portalReservations.cancelError"),
        variant: "error",
      });
    } finally {
      setPendingActionById((current) => ({ ...current, [bookingId]: false }));
    }
  };

  const resolveRoomType = (reservation: BookingSummaryDto): string => {
    const roomType = reservation.room_type?.trim();
    if (roomType) return roomType;
    return "-";
  };

  return (
    <section className="portal-reservations page-container page-section">
      <h1 className="portal-reservations__title">
        {t("sidebar.reservations")}
      </h1>
      {loadState === "loading" ? (
        <LoadingSpinner className="portal-reservations__spinner" />
      ) : null}
      <ul className="portal-reservations__list">
        {reservations.map((reservation) => (
          <li
            key={reservation.booking_id}
            className="portal-reservations__item"
          >
            <PortalReservationCard
              id={reservation.booking_id}
              userName={reservation.user_id}
              arrival={formatPortalDate(reservation.check_in, i18n.language)}
              departure={formatPortalDate(reservation.check_out, i18n.language)}
              roomType={resolveRoomType(reservation)}
              guestCount={reservation.guest_count ?? 1}
              onConfirm={() => handleConfirm(reservation.booking_id)}
              onCancel={() => handleCancel(reservation.booking_id)}
              showConfirmButton={
                reservation.hotel_confirmation_status !== "CONFIRMED"
              }
              disableConfirmButton={!!pendingActionById[reservation.booking_id]}
              disableCancelButton={!!pendingActionById[reservation.booking_id]}
            />
          </li>
        ))}
      </ul>
      <Snackbar
        show={snackbar.show}
        message={snackbar.message}
        variant={snackbar.variant}
        onClose={() => setSnackbar((current) => ({ ...current, show: false }))}
      />
    </section>
  );
};

export default PortalReservations;
