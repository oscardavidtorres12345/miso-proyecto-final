from datetime import date, datetime, timezone, timedelta
from unittest.mock import MagicMock, patch

from sqlalchemy import text

from src.domain.schemas import BookingStatus
from src.infrastructure.database.models import Booking, PushToken

_CLIENT = "src.api.v1.endpoints.inventory_client"
_IDENTITY = "src.api.v1.endpoints.identity_client"
_SEARCH = "src.api.v1.endpoints.search_client"
_PUSH_SVC = "src.api.v1.endpoints.push_notification_service"
_SVC = "src.api.v1.endpoints.booking_service"


def _make_booking(
    booking_id="test-bk-int-001",
    user_id="test-user-integration",
    status="CONFIRMED",
):
    return Booking(
        booking_id=booking_id,
        hold_id=f"hold-{booking_id}",
        property_id=1,
        room_id=1,
        user_id=user_id,
        check_in=date.today() + timedelta(days=1),
        check_out=date.today() + timedelta(days=3),
        units=1,
        guest_count=2,
        status=status,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        created_at=datetime.now(timezone.utc),
    )


def _setup_data(db_session, booking_status="CONFIRMED", suffix="001"):
    user_id = f"test-user-integration-{suffix}"
    booking_id = f"test-bk-int-{suffix}"

    token = PushToken(
        user_id=user_id,
        expo_push_token=f"fcm-test-token-integration-{suffix}",
        platform="android",
    )
    db_session.add(token)

    booking = _make_booking(booking_id=booking_id, user_id=user_id, status=booking_status)
    db_session.add(booking)
    db_session.commit()

    return booking_id, user_id


def _cleanup(db_session, suffix="001"):
    user_id = f"test-user-integration-{suffix}"
    db_session.execute(
        text("DELETE FROM push_token WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    db_session.execute(
        text("DELETE FROM booking WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    db_session.commit()


class TestHotelConfirmPushNotification:
    def test_hotel_confirm_sends_push_notification(self, client, db_session):
        suffix = "confirm"
        booking_id, user_id = _setup_data(
            db_session, booking_status="CONFIRMED", suffix=suffix
        )
        try:
            with (
                patch(_CLIENT) as mock_client,
                patch(_IDENTITY) as mock_identity,
                patch(_SEARCH) as mock_search,
                patch(_PUSH_SVC) as mock_push_svc,
                patch(_SVC) as mock_svc,
            ):
                mock_svc.get.return_value = _make_booking(booking_id, user_id, "CONFIRMED")
                mock_svc.mark_hotel_confirmed.return_value = _make_booking(
                    booking_id, user_id, "CONFIRMED"
                )
                mock_client.get_hotel_id.return_value = "hotel-1"
                mock_identity.get_user_profile.return_value = {
                    "email": "test-integration@example.com"
                }
                mock_search.get_property_detail.return_value = {
                    "hotel_name": "Test Hotel",
                    "name": "Test Hotel",
                }
                mock_push_svc.send_push_notifications.return_value = {
                    "status": "sent",
                    "success_count": 1,
                    "responses": [],
                }

                resp = client.post(f"/api/v1/bookings/{booking_id}/hotel-confirm")
                body = resp.json()

                assert resp.status_code == 200
                assert body["status"] == "CONFIRMED"
                assert "push_notification" in body
                assert body["push_notification"]["status"] == "sent"

                # Verify Firebase was called with the correct FCM token
                mock_push_svc.send_push_notifications.assert_called_once()
                args = mock_push_svc.send_push_notifications.call_args
                tokens = args[0][0]
                assert f"fcm-test-token-integration-{suffix}" in tokens
        finally:
            _cleanup(db_session, suffix=suffix)


class TestHotelCancelPushNotification:
    def test_hotel_cancel_sends_push_notification(self, client, db_session):
        suffix = "cancel"
        booking_id, user_id = _setup_data(
            db_session, booking_status="CONFIRMED", suffix=suffix
        )
        try:
            with (
                patch(_CLIENT) as mock_client,
                patch(_IDENTITY) as mock_identity,
                patch(_SEARCH) as mock_search,
                patch(_PUSH_SVC) as mock_push_svc,
                patch(_SVC) as mock_svc,
            ):
                mock_svc.get.return_value = _make_booking(booking_id, user_id, "CONFIRMED")
                mock_client.get_hotel_id.return_value = "hotel-1"
                mock_client.list_staff_property_ids.return_value = [1]
                mock_identity.get_user_profile.return_value = {
                    "email": "test-integration@example.com"
                }
                mock_search.get_property_detail.return_value = {
                    "hotel_name": "Test Hotel",
                    "name": "Test Hotel",
                }
                mock_push_svc.send_push_notifications.return_value = {
                    "status": "sent",
                    "success_count": 1,
                    "responses": [],
                }
                # Mock mark_cancelled for cancellation
                mock_svc.mark_cancelled.return_value = _make_booking(
                    booking_id, user_id, "CANCELLED"
                )

                resp = client.delete(
                    f"/api/v1/bookings/{booking_id}/hotel-cancel",
                    headers={"X-User-Id": "1"},
                )
                body = resp.json()

                assert resp.status_code == 200
                assert body["status"] == "CANCELLED"
                assert "push_notification" in body
                assert body["push_notification"]["status"] == "sent"

                mock_push_svc.send_push_notifications.assert_called_once()
        finally:
            _cleanup(db_session, suffix=suffix)
