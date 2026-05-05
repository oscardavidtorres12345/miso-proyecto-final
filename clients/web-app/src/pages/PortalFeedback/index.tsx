import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import PortalFeedbackCard from "@/components/PortalFeedbackCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Snackbar from "@/components/Snackbar";
import { useAuth } from "@/context/AuthContext";
import { getPortalFeedback, type ReviewItemDto } from "@/services/bookingService";
import "./PortalFeedback.css";

type LoadState = "loading" | "ready" | "error";

type SnackbarState = {
  show: boolean;
  message: string;
  variant: "success" | "error";
};

const feedbackTitle = (item: ReviewItemDto): string => {
  const room = item.room_name?.trim();
  if (room) return `${item.hotel_name} — ${room}`;
  return item.hotel_name;
};

const PortalFeedback = () => {
  const { t } = useTranslation();
  const { token, session } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reviews, setReviews] = useState<ReviewItemDto[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    show: false,
    message: "",
    variant: "error",
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
    getPortalFeedback(auth)
      .then((response) => {
        if (cancelled) return;
        setReviews(response.reviews ?? []);
        setLoadState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadState("error");
        setSnackbar({
          show: true,
          message:
            error instanceof Error ? error.message : t("portalFeedback.loadError"),
          variant: "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [auth, t]);

  return (
    <section className="portal-feedback page-container page-section">
      <h1 className="portal-feedback__title">{t("sidebar.feedback")}</h1>
      {loadState === "loading" ? (
        <LoadingSpinner className="portal-feedback__spinner" />
      ) : null}
      {loadState === "ready" && reviews.length === 0 ? (
        <p className="portal-feedback__empty">{t("portalFeedback.empty")}</p>
      ) : null}
      <ul className="portal-feedback__list">
        {reviews.map((item) => (
          <li key={item.id} className="portal-feedback__item">
            <PortalFeedbackCard
              userName={item.guest_name}
              title={feedbackTitle(item)}
              rating={item.rating}
              comment={item.comment}
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

export default PortalFeedback;
