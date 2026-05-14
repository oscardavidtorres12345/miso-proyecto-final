import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import Modal from "@/components/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { getCheckinQrToken } from "@/services/bookingService";
import "./CheckinQrModal.css";

interface CheckinQrModalProps {
  open: boolean;
  bookingId: string | null;
  onClose: () => void;
}

type QrState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; value: string }
  | { status: "error"; message: string };

const CheckinQrModal = ({ open, bookingId, onClose }: CheckinQrModalProps) => {
  const { t } = useTranslation();
  const { token, session } = useAuth();
  const [state, setState] = useState<QrState>({ status: "idle" });

  const auth = useMemo(() => {
    const userId = session?.user.user_id;
    if (!token || !userId) return null;
    return { token, userId };
  }, [token, session?.user.user_id]);

  useEffect(() => {
    if (!open || !bookingId) {
      setState({ status: "idle" });
      return;
    }
    if (!auth) {
      setState({ status: "error", message: t("portalReservations.qrError") });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });
    getCheckinQrToken(auth, bookingId)
      .then((response) => {
        if (cancelled) return;
        setState({ status: "ready", value: response.qr_value });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : t("portalReservations.qrError"),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [open, bookingId, auth, t]);

  const body = (
    <div className="checkin-qr-modal__body">
      {state.status === "loading" ? (
        <>
          <LoadingSpinner />
          <p className="checkin-qr-modal__message">
            {t("portalReservations.qrLoading")}
          </p>
        </>
      ) : null}
      {state.status === "ready" ? (
        <QRCodeSVG
          value={state.value}
          size={240}
          aria-label={t("portalReservations.qrTitle")}
        />
      ) : null}
      {state.status === "error" ? (
        <p className="checkin-qr-modal__error" role="alert">
          {state.message}
        </p>
      ) : null}
    </div>
  );

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("portalReservations.qrTitle")}
      body={body}
      cancelLabel={t("portalReservations.qrClose")}
    />
  );
};

export default CheckinQrModal;
