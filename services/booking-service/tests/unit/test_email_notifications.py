from __future__ import annotations

from unittest.mock import patch

import pytest

from src.infrastructure.email_notifications import (
    BookingEmailSender,
    EmailNotificationError,
    _as_bool,
    _booking_code,
    _format_currency,
    _format_date_es,
    _render_confirmation_email_html,
)


def _preview() -> dict:
    return {
        "guest_name": "John Doe",
        "property": {
            "hotel_name": "Aonang Villa Resort",
            "stars": 4,
            "city": "Cartagena de Indias",
            "country": "Colombia",
        },
        "stay": {
            "check_in": "2025-02-21",
            "check_out": "2025-03-16",
            "nights": 24,
            "adults": 2,
            "room_name": "Suite Junior",
            "meal_plan": "Desayuno incluido",
        },
        "payment_summary": {
            "currency": "COP",
            "lodging": 3500000.0,
            "fees": 500000.0,
            "taxes": 1500000.0,
            "insurance": 200000.0,
            "discount": 700000.0,
            "total": 5000000.0,
        },
    }


def test_email_helpers() -> None:
    assert _as_bool("true", False) is True
    assert _booking_code("bk-001", "2025-02-21") == "TH-2025-K001"
    assert _format_currency(1500000, "COP") == "$ 1.500.000 COP"
    assert _format_date_es("2025-02-21") == "21 Feb 2025"


def test_render_html_contains_key_data() -> None:
    html = _render_confirmation_email_html(
        guest_name="John Doe",
        booking_code="TH-2025-0001",
        preview=_preview(),
    )
    assert "TH-2025-0001" in html
    assert "Aonang Villa Resort" in html
    assert "Suite Junior" in html
    assert "Desayuno incluido" in html
    assert "$ 5.000.000 COP" in html


def test_send_confirmation_email_disabled_returns_disabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("BOOKING_EMAIL_ENABLED", "false")
    sender = BookingEmailSender()
    result = sender.send_confirmation_email(
        to_email="john@example.com",
        booking_id="bk-1",
        preview=_preview(),
    )
    assert result["status"] == "disabled"


def test_send_confirmation_email_missing_credentials_raises(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("BOOKING_EMAIL_ENABLED", "true")
    monkeypatch.delenv("BOOKING_SMTP_USER", raising=False)
    monkeypatch.delenv("BOOKING_SMTP_APP_PASSWORD", raising=False)
    monkeypatch.delenv("BOOKING_SMTP_FROM", raising=False)
    sender = BookingEmailSender()
    with pytest.raises(EmailNotificationError, match="SMTP credentials are incomplete"):
        sender.send_confirmation_email(
            to_email="john@example.com",
            booking_id="bk-1",
            preview=_preview(),
        )


def test_send_confirmation_email_success(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("BOOKING_EMAIL_ENABLED", "true")
    monkeypatch.setenv("BOOKING_SMTP_USER", "travelhubnotifications@gmail.com")
    monkeypatch.setenv("BOOKING_SMTP_APP_PASSWORD", "abcdefghijklmnop")
    monkeypatch.setenv("BOOKING_SMTP_FROM", "travelhubnotifications@gmail.com")
    sender = BookingEmailSender()

    smtp_mock = patch("src.infrastructure.email_notifications.smtplib.SMTP").start()
    server = smtp_mock.return_value.__enter__.return_value
    server.starttls.return_value = None
    server.login.return_value = None
    server.send_message.return_value = None
    try:
        result = sender.send_confirmation_email(
            to_email="john@example.com",
            booking_id="bk-1",
            preview=_preview(),
        )
    finally:
        patch.stopall()

    assert result["status"] == "sent"
    server.starttls.assert_called_once()
    server.login.assert_called_once()
    server.send_message.assert_called_once()


def test_send_confirmation_email_smtp_exception(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("BOOKING_EMAIL_ENABLED", "true")
    monkeypatch.setenv("BOOKING_SMTP_USER", "travelhubnotifications@gmail.com")
    monkeypatch.setenv("BOOKING_SMTP_APP_PASSWORD", "abcdefghijklmnop")
    monkeypatch.setenv("BOOKING_SMTP_FROM", "travelhubnotifications@gmail.com")
    sender = BookingEmailSender()

    with patch("src.infrastructure.email_notifications.smtplib.SMTP") as smtp_mock:
        server = smtp_mock.return_value.__enter__.return_value
        server.starttls.side_effect = OSError("network down")
        with pytest.raises(EmailNotificationError, match="SMTP transport error"):
            sender.send_confirmation_email(
                to_email="john@example.com",
                booking_id="bk-1",
                preview=_preview(),
            )
