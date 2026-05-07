from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from src.infrastructure.push_notifications import (
    PushNotificationService,
    PushNotificationError,
    _as_bool,
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

    def test_none_returns_default(self) -> None:
        assert _as_bool(None, False) is False
        assert _as_bool(None, True) is True


class TestPushNotificationService:
    def test_disabled_returns_disabled(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "false")
        svc = PushNotificationService()
        result = svc.send_push_notifications(
            ["fcm-token-test"],
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

    def test_firebase_not_initialized(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "true")
        monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_PATH", raising=False)
        svc = PushNotificationService()
        result = svc.send_push_notifications(
            ["fcm-token-test"],
            title="Test",
            body="Hello",
        )
        assert result["status"] == "failed"
        assert "Firebase not initialized" in result["detail"]

    def test_single_token_success(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "true")
        monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_PATH", "/fake/path.json")
        svc = PushNotificationService()

        mock_app = MagicMock()
        svc._firebase_app = mock_app
        svc._initialized = True

        with patch("src.infrastructure.push_notifications.messaging") as mock_messaging:
            mock_messaging.send.return_value = "message-id-123"

            result = svc.send_push_notifications(
                ["fcm-token-abc123"],
                title="Confirmada",
                body="Tu reserva fue confirmada.",
                data={"url": "travelhub://my-bookings"},
            )

        assert result["status"] == "sent"
        assert result["sent"] == 1
        assert result["failed"] == 0

    def test_invalid_token_removed(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "true")
        monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_PATH", "/fake/path.json")
        svc = PushNotificationService()

        mock_app = MagicMock()
        svc._firebase_app = mock_app
        svc._initialized = True

        class FakeUnregisteredError(Exception):
            pass

        with patch("src.infrastructure.push_notifications.messaging") as mock_messaging:
            mock_messaging.UnregisteredError = FakeUnregisteredError
            mock_messaging.send.side_effect = FakeUnregisteredError("Unregistered")

            result = svc.send_push_notifications(
                ["fcm-token-invalid"],
                title="Test",
                body="Hello",
            )

        assert result["status"] == "failed"
        assert result["sent"] == 0
        assert result["failed"] == 1
        assert "fcm-token-invalid" in result["invalid_tokens"][0]

    def test_generic_error_caught(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOOKING_PUSH_ENABLED", "true")
        monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_PATH", "/fake/path.json")
        svc = PushNotificationService()

        mock_app = MagicMock()
        svc._firebase_app = mock_app
        svc._initialized = True

        class FakeUnregisteredError(Exception):
            pass

        with patch("src.infrastructure.push_notifications.messaging") as mock_messaging:
            mock_messaging.UnregisteredError = FakeUnregisteredError
            mock_messaging.send.side_effect = RuntimeError("FCM error")

            result = svc.send_push_notifications(
                ["fcm-token-test"],
                title="Test",
                body="Hello",
            )

        assert result["status"] == "failed"
        assert result["failed"] == 1
        assert "FCM error" in result["errors"][0]
