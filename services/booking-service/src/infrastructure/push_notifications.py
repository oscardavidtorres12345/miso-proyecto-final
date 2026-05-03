from __future__ import annotations

import logging
import os
from typing import Any

import httpx

EXPO_PUSH_API_URL = "https://exp.host/--/api/v2/push/send"
EXPO_PUSH_BATCH_SIZE = 100

logger = logging.getLogger(__name__)


class PushNotificationError(Exception):
    pass


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class PushNotificationService:
    def __init__(self) -> None:
        self.enabled = _as_bool(
            os.getenv("BOOKING_PUSH_ENABLED"), default=False
        )
        self.api_url = os.getenv("EXPO_PUSH_API_URL", EXPO_PUSH_API_URL)
        self.client: httpx.Client | None = None

    def _get_client(self) -> httpx.Client:
        if self.client is None:
            self.client = httpx.Client(timeout=30.0)
        return self.client

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

        messages: list[dict[str, Any]] = []
        for token in tokens:
            message: dict[str, Any] = {
                "to": token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high",
            }
            if data:
                message["data"] = data
            messages.append(message)

        invalid_tokens: list[str] = []
        sent_count = 0
        failed_count = 0
        errors: list[str] = []

        client = self._get_client()

        for i in range(0, len(messages), EXPO_PUSH_BATCH_SIZE):
            batch = messages[i : i + EXPO_PUSH_BATCH_SIZE]
            try:
                response = client.post(self.api_url, json=batch)
                response.raise_for_status()
            except httpx.HTTPError as exc:
                logger.exception("Expo Push API request failed")
                failed_count += len(batch)
                errors.append(str(exc))
                continue

            try:
                results = response.json().get("data", [])
            except Exception as exc:
                logger.exception("Failed to parse Expo Push API response")
                failed_count += len(batch)
                errors.append(str(exc))
                continue

            for idx, result in enumerate(results):
                token = batch[idx]["to"]
                if result.get("status") == "ok":
                    sent_count += 1
                else:
                    failed_count += 1
                    error_info = result.get("details", {})
                    error_msg = error_info.get("error", "unknown")
                    if error_msg in (
                        "DeviceNotRegistered",
                        "InvalidCredentials",
                    ):
                        invalid_tokens.append(token)
                    errors.append(f"{token}: {error_msg}")

        return {
            "status": "sent" if sent_count > 0 else "failed",
            "sent": sent_count,
            "failed": failed_count,
            "invalid_tokens": invalid_tokens,
            "errors": errors[:5],
        }

    def close(self) -> None:
        if self.client is not None:
            self.client.close()
            self.client = None


push_notification_service = PushNotificationService()
