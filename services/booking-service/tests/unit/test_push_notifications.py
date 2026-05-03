from __future__ import annotations

from unittest.mock import MagicMock, patch

import httpx
import pytest

from src.infrastructure.push_notifications import (
    PushNotificationService,
    PushNotificationError,
    _as_bool,
    EXPO_PUSH_API_URL,
)


class TestAsBool:
    def test_true_values(self) -> None:
        assert _as_bool("true", False) is True
        assert _as_bool("1", False) is True
        assert _as_bool("yes", False) is True
        assert _as_bool("on", False) is True
        assert _as_bool("TRUE", False) is True

    def test_false_values(self) -> None:
        assert _as_bool("false", True) is False
        assert _as_bool("0", True) is False
        assert _as_bool("no", True) is False
        assert _as_bool("", True) is False
        assert _as_bool(None, True) is False


class TestPushNotificationService:
    def test_disabled_returns_disabled(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "false")
        svc = PushNotificationService()
        result = svc.send_push_notifications(
            ["ExponentPushToken[test]"],
            title="Test",
            body="Hello",
        )
        assert result["status"] == "disabled"

    def test_empty_tokens_returns_skipped(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "true")
        svc = PushNotificationService()
        result = svc.send_push_notifications(
            [],
            title="Test",
            body="Hello",
        )
        assert result["status"] == "skipped"

    def test_single_token_success(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "true")
        svc = PushNotificationService()

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [{"status": "ok", "id": "push-id-1"}]
        }
        mock_response.raise_for_status.return_value = None

        with patch.object(
            svc, "_get_client", return_value=MagicMock(post=MagicMock(return_value=mock_response))
        ):
            result = svc.send_push_notifications(
                ["ExponentPushToken[abc123]"],
                title="Confirmada",
                body="Tu reserva fue confirmada.",
                data={"url": "travelhub://my-bookings"},
            )

        assert result["status"] == "sent"
        assert result["sent"] == 1
        assert result["failed"] == 0

    def test_invalid_token_removed(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "true")
        svc = PushNotificationService()

        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [
                {
                    "status": "error",
                    "details": {"error": "DeviceNotRegistered"},
                }
            ]
        }
        mock_response.raise_for_status.return_value = None

        with patch.object(
            svc, "_get_client", return_value=MagicMock(post=MagicMock(return_value=mock_response))
        ):
            result = svc.send_push_notifications(
                ["ExponentPushToken[invalid]"],
                title="Test",
                body="Hello",
            )

        assert result["status"] == "failed"
        assert result["sent"] == 0
        assert result["failed"] == 1
        assert "ExponentPushToken[invalid]" in result["invalid_tokens"]

    def test_http_error_caught(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "true")
        svc = PushNotificationService()

        mock_client = MagicMock()
        mock_client.post.side_effect = httpx.HTTPError("Connection failed")
        with patch.object(svc, "_get_client", return_value=mock_client):
            result = svc.send_push_notifications(
                ["ExponentPushToken[test]"],
                title="Test",
                body="Hello",
            )

        assert result["status"] == "failed"
        assert result["failed"] == 1
