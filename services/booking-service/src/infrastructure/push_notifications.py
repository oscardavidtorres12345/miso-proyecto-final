from __future__ import annotations

import logging
import os
from typing import Any

try:
    import firebase_admin
    from firebase_admin import credentials, messaging

    _FIREBASE_AVAILABLE = True
except ImportError:
    _FIREBASE_AVAILABLE = False
    firebase_admin = None
    credentials = None
    messaging = None

logger = logging.getLogger(__name__)


class PushNotificationError(Exception):
    pass


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class PushNotificationService:
    def __init__(self) -> None:
        self.enabled = _as_bool(os.getenv("BOOKING_PUSH_ENABLED"), default=False)
        self._firebase_app: Any | None = None
        self._cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        self._initialized = False

    def _init_firebase(self) -> bool:
        if self._initialized:
            return True
        if not _FIREBASE_AVAILABLE:
            logger.warning("firebase-admin not installed")
            return False
        if not self._cred_path:
            logger.warning("FIREBASE_SERVICE_ACCOUNT_PATH not set")
            return False
        if not os.path.exists(self._cred_path):
            logger.warning(
                "Firebase service account file not found: %s", self._cred_path
            )
            return False
        try:
            cred = credentials.Certificate(self._cred_path)
            self._firebase_app = firebase_admin.initialize_app(cred)
            self._initialized = True
            logger.info("Firebase Admin SDK initialized")
            return True
        except Exception:
            logger.exception("Failed to initialize Firebase Admin SDK")
            return False

    def send_push_notifications(
        self,
        tokens: list[str],
        *,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not self.enabled:
            return {"status": "disabled", "detail": "BOOKING_PUSH_ENABLED=false"}

        if not tokens:
            return {"status": "skipped", "detail": "No tokens provided."}

        if not self._init_firebase():
            return {"status": "failed", "detail": "Firebase not initialized"}

        invalid_tokens: list[str] = []
        sent_count = 0
        failed_count = 0
        errors: list[str] = []

        # Firebase data payload requires string values
        data_payload = {k: str(v) for k, v in (data or {}).items()}

        for token in tokens:
            try:
                message = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    data=data_payload,
                    token=token,
                )
                response = messaging.send(message, app=self._firebase_app)
                sent_count += 1
                logger.debug("Push sent to %s: %s", token, response)
            except Exception as exc:
                unregistered_error = getattr(messaging, "UnregisteredError", None)
                if unregistered_error is not None and isinstance(
                    exc, unregistered_error
                ):
                    invalid_tokens.append(token)
                    failed_count += 1
                    errors.append(f"{token}: Unregistered")
                else:
                    failed_count += 1
                    errors.append(f"{token}: {exc}")

        return {
            "status": "sent" if sent_count > 0 else "failed",
            "sent": sent_count,
            "failed": failed_count,
            "invalid_tokens": invalid_tokens,
            "errors": errors[:5],
        }


push_notification_service = PushNotificationService()
