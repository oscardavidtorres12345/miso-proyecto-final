"""Unit tests para endpoints de booking-service (mock de DB, booking_service e inventory_client)."""

from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from src.domain.schemas import BookingSummary, BookingStatus
from src.domain.services.booking_service import (
    BookingConflictError,
    BookingNotFoundError,
    BookingValidationError,
)
from src.infrastructure.clients import (
    IdentityClientError,
    PaymentClientError,
    InventoryClientError,
    InventoryTransportError,
    SearchClientError,
)

_SVC = "src.api.v1.endpoints.booking_service"
_CLIENT = "src.api.v1.endpoints.inventory_client"
_IDENTITY = "src.api.v1.endpoints.identity_client"
_PAYMENT = "src.api.v1.endpoints.payment_client"
_SEARCH = "src.api.v1.endpoints.search_client"
_MAILER = "src.api.v1.endpoints.booking_email_sender"
_NOW = datetime(2025, 12, 1, tzinfo=timezone.utc)

_HOLD_PAYLOAD = {
    "property_id": 10,
    "user_id": "u-1",
    "room_id": 1,
    "check_in": "2025-12-01",
    "check_out": "2025-12-05",
}

# ── Helpers: mock booking DB objects ──────────────────────────────────────────


def _mock_booking(status: str = "ON_HOLD") -> MagicMock:
    b = MagicMock()
    b.booking_id = "bk-001"
    b.hold_id = "hold-001"
    b.property_id = 10
    b.room_id = 1
    b.user_id = "99"
    b.check_in = date(2025, 12, 1)
    b.check_out = date(2025, 12, 5)
    b.units = 1
    b.hotel_confirmed_at = None
    b.status = status
    b.expires_at = None
    b.payment_summary_json = None
    return b


# ── Health ─────────────────────────────────────────────────────────────────────


def test_health(client: TestClient) -> None:
    assert client.get("/health").json()["status"] == "ok"


# ── POST /bookings/holds ───────────────────────────────────────────────────────


def test_create_hold_ok(client: TestClient) -> None:
    hold_resp = {
        "hold_id": "hold-001",
        "room_id": 1,
        "user_id": "u-1",
        "check_in": "2025-12-01",
        "check_out": "2025-12-05",
        "units": 1,
        "status": "ACTIVE",
        "expires_at": None,
    }
    # HotelDetailResponse uses camelCase aliases (name, city, photos[{url,alt}]).
    hotel_resp = {
        "rooms": [
            {
                "id": 1,
                "price": {
                    "pricePerNight": 100000,
                    "totalAmount": 476000,
                    "currency": "COP",
                },
            }
        ],
        "name": "Aonang Villa Resort",
        "city": "Cartagena de Indias",
        "photos": [{"url": "https://example.com/hotel.jpg", "alt": None}],
    }
    with (
        patch(_CLIENT) as mock_client,
        patch(_SEARCH) as mock_search,
        patch(_SVC) as mock_svc,
    ):
        mock_client.create_hold.return_value = hold_resp
        mock_search.get_hotel_detail.return_value = hotel_resp
        mock_svc.create_on_hold.return_value = _mock_booking()
        resp = client.post("/api/v1/bookings/holds", json=_HOLD_PAYLOAD)
    assert resp.status_code == 201
    assert resp.json()["booking_id"] == "bk-001"
    assert resp.json()["hu_id"] == "HU005"
    assert resp.json()["property_id"] == 10
    assert resp.json()["payment_summary"]["discount"] < 0
    # Verify enrichment data is forwarded to the service.
    create_call = mock_svc.create_on_hold.call_args
    assert create_call.kwargs["property_name"] == "Aonang Villa Resort"
    assert create_call.kwargs["city"] == "Cartagena de Indias"
    assert create_call.kwargs["image_url"] == "https://example.com/hotel.jpg"


def test_create_hold_inventory_client_error(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client:
        mock_client.create_hold.side_effect = InventoryClientError(409, "no stock")
        resp = client.post("/api/v1/bookings/holds", json=_HOLD_PAYLOAD)
    assert resp.status_code == 409


def test_create_hold_transport_error(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client:
        mock_client.create_hold.side_effect = InventoryTransportError("timeout")
        resp = client.post("/api/v1/bookings/holds", json=_HOLD_PAYLOAD)
    assert resp.status_code == 503


def test_create_hold_invalid_payload_returns_422(client: TestClient) -> None:
    resp = client.post("/api/v1/bookings/holds", json={"room_id": 1})
    assert resp.status_code == 422


def test_create_hold_without_pricing_returns_422(client: TestClient) -> None:
    hold_resp = {
        "hold_id": "hold-001",
        "room_id": 1,
        "user_id": "u-1",
        "check_in": "2025-12-01",
        "check_out": "2025-12-05",
        "units": 1,
        "status": "ACTIVE",
        "expires_at": None,
    }
    with (
        patch(_CLIENT) as mock_client,
        patch(_SEARCH) as mock_search,
    ):
        mock_client.create_hold.return_value = hold_resp
        mock_search.get_hotel_detail.return_value = {
            "rooms": [{"id": 1, "price": {"currency": "COP"}}]
        }
        resp = client.post("/api/v1/bookings/holds", json=_HOLD_PAYLOAD)
    assert resp.status_code == 422


# ── POST /bookings/quote ───────────────────────────────────────────────────────


def test_quote_stub(client: TestClient) -> None:
    resp = client.post("/api/v1/bookings/quote", json={"hold_id": "hold-001"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_implemented"
    assert resp.json()["hu_id"] == "HU006"


# ── GET /bookings/users/{user_id} ─────────────────────────────────────────────


def test_get_user_bookings_empty(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = []
        resp = client.get("/api/v1/bookings/users/u-1")
    assert resp.status_code == 200
    assert resp.json()["user_id"] == "u-1"
    assert resp.json()["bookings"] == []


def test_get_portal_reservations_scoped_by_staff_properties(client: TestClient) -> None:
    booking = BookingSummary(
        booking_id="bk-101",
        hold_id="hold-101",
        property_id=10,
        room_id=12,
        user_id="u-42",
        check_in=date(2025, 12, 2),
        check_out=date(2025, 12, 7),
        units=2,
        guest_count=3,
        status=BookingStatus.CONFIRMED,
        expires_at=None,
    )
    with (
        patch(_CLIENT) as mock_client,
        patch(_SVC) as mock_svc,
        patch(_SEARCH) as mock_search,
    ):
        mock_client.list_staff_properties.return_value = [
            {"property_id": 10, "property_name": "Hotel A"},
            {"property_id": 11, "property_name": "Hotel B"},
        ]
        mock_client.list_staff_room_type_by_room_id.return_value = {12: "Suite Junior"}
        mock_svc.list_by_properties.return_value = [booking]
        mock_search.get_booking_property_detail.return_value = {
            "room_name": "Suite Junior"
        }
        resp = client.get(
            "/api/v1/bookings/portal/reservations",
            headers={"X-User-Id": "99"},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["staff_user_id"] == 99
    assert body["property_ids"] == [10, 11]
    assert body["properties"] == [
        {"property_id": 10, "property_name": "Hotel A"},
        {"property_id": 11, "property_name": "Hotel B"},
    ]
    assert len(body["bookings"]) == 1
    assert body["bookings"][0]["booking_id"] == "bk-101"
    assert body["bookings"][0]["property_id"] == 10
    assert body["bookings"][0]["property_name"] == "Hotel A"
    assert body["bookings"][0]["guest_count"] == 3
    assert body["bookings"][0]["room_type"] == "Suite Junior"
    assert body["bookings"][0]["room_name"] == "Suite Junior"
    assert body["bookings"][0]["status"] == "CONFIRMED"
    assert body["bookings"][0]["hotel_confirmation_status"] == "PENDING"
    assert mock_svc.list_by_properties.call_count == 1
    assert mock_svc.list_by_properties.call_args.kwargs["property_ids"] == [10, 11]


def test_get_portal_reservations_room_type_null_when_search_fails(
    client: TestClient,
) -> None:
    booking = BookingSummary(
        booking_id="bk-102",
        hold_id="hold-102",
        property_id=10,
        room_id=13,
        user_id="u-43",
        check_in=date(2025, 12, 10),
        check_out=date(2025, 12, 12),
        units=1,
        guest_count=1,
        status=BookingStatus.CONFIRMED,
        expires_at=None,
    )
    with (
        patch(_CLIENT) as mock_client,
        patch(_SVC) as mock_svc,
        patch(_SEARCH) as mock_search,
    ):
        mock_client.list_staff_properties.return_value = [
            {"property_id": 10, "property_name": None}
        ]
        mock_client.list_staff_room_type_by_room_id.return_value = {
            13: "Suite Fallback"
        }
        mock_svc.list_by_properties.return_value = [booking]
        mock_search.get_booking_property_detail.side_effect = SearchClientError(
            404, "not found"
        )
        resp = client.get(
            "/api/v1/bookings/portal/reservations",
            headers={"X-User-Id": "99"},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["bookings"][0]["room_type"] == "Suite Fallback"
    assert body["bookings"][0]["room_name"] == "Suite Fallback"
    assert body["bookings"][0]["property_name"] is None


def test_get_portal_reservations_requires_auth(client: TestClient) -> None:
    resp = client.get("/api/v1/bookings/portal/reservations")
    assert resp.status_code == 401


def test_get_portal_dashboard_base_contract(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client:
        mock_client.list_staff_property_ids.return_value = [10, 11]
        resp = client.get(
            "/api/v1/bookings/portal/dashboard",
            headers={"X-User-Id": "99"},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["hu_id"] == "HU011"
    assert body["staff_user_id"] == 99
    assert body["property_ids"] == [10, 11]
    assert body["kpis"]["total_reservations"] == 0
    assert body["kpis"]["active_reservations"] == 0
    assert body["kpis"]["current_guests"] == 0
    assert body["kpis"]["income_total"] == 0
    assert body["occupancy_by_category"] == []
    assert body["bookings_by_period"] == []
    assert body["ranking"] == []
    assert body["income_trend"] == []
    assert body["meta"]["granularity"] == "month"
    assert body["meta"]["currency"] == "COP"
    assert body["meta"]["top_n"] == 10


def test_get_portal_dashboard_requires_auth(client: TestClient) -> None:
    resp = client.get("/api/v1/bookings/portal/dashboard")
    assert resp.status_code == 401


def test_get_portal_dashboard_validates_granularity(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client:
        mock_client.list_staff_property_ids.return_value = [10]
        resp = client.get(
            "/api/v1/bookings/portal/dashboard?granularity=year",
            headers={"X-User-Id": "99"},
        )
    assert resp.status_code == 422


# ── POST/GET /bookings/batch ─────────────────────────────────────────────────


def test_create_booking_batch_ok(client: TestClient) -> None:
    batch_booking = BookingSummary(
        booking_id="bk-001",
        hold_id="hold-001",
        room_id=1,
        user_id="u-1",
        check_in=date(2025, 12, 1),
        check_out=date(2025, 12, 5),
        units=1,
        status=BookingStatus.ON_HOLD,
        expires_at=None,
    )
    with patch(_SVC) as mock_svc:
        mock_svc.create_batch.return_value = ("bundle-001", [batch_booking])
        resp = client.post(
            "/api/v1/bookings/batch",
            json={"user_id": "u-1", "booking_ids": ["bk-001"]},
        )

    assert resp.status_code == 201
    body = resp.json()
    assert body["booking_id"] == "bundle-001"
    assert body["booking_ids"] == ["bk-001"]
    assert len(body["bookings"]) == 1


def test_create_booking_batch_validation_error(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.create_batch.side_effect = BookingValidationError("invalid")
        resp = client.post(
            "/api/v1/bookings/batch",
            json={"user_id": "u-1", "booking_ids": ["bk-404"]},
        )
    assert resp.status_code == 422


def test_get_booking_batch_ok(client: TestClient) -> None:
    booking = BookingSummary(
        booking_id="bk-001",
        hold_id="hold-001",
        room_id=1,
        user_id="u-1",
        check_in=date(2025, 12, 1),
        check_out=date(2025, 12, 5),
        units=1,
        status=BookingStatus.ON_HOLD,
        expires_at=None,
    )
    with patch(_SVC) as mock_svc:
        mock_svc.get_batch.return_value = ("u-1", [booking])
        resp = client.get("/api/v1/bookings/batch/bundle-001")
    assert resp.status_code == 200
    assert resp.json()["booking_id"] == "bundle-001"


def test_get_booking_batch_not_found(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.get_batch.side_effect = BookingNotFoundError("not found")
        resp = client.get("/api/v1/bookings/batch/missing")
    assert resp.status_code == 404


# ── GET /bookings/users/{user_id}/confirmed-upcoming ───────────────────────────


def _mock_summary(
    *,
    booking_id: str = "bk-001",
    property_id: int | None = 10,
    check_in: date = date(2026, 5, 1),
    check_out: date = date(2026, 5, 5),
    units: int = 2,
    guest_count: int | None = None,
    property_name: str | None = None,
    city: str | None = None,
    image_url: str | None = None,
    status: str = "CONFIRMED",
) -> MagicMock:
    m = MagicMock()
    m.booking_id = booking_id
    m.hold_id = "hold-001"
    m.room_id = 1
    m.property_id = property_id
    m.user_id = "u-1"
    m.check_in = check_in
    m.check_out = check_out
    m.units = units
    m.guest_count = guest_count if guest_count is not None else units
    m.property_name = property_name
    m.city = city
    m.image_url = image_url
    m.status = status
    m.expires_at = None
    return m


def test_confirmed_upcoming_empty(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = []
        resp = client.get("/api/v1/bookings/users/u-1/confirmed-upcoming")
    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == "u-1"
    assert body["reservations"] == []
    assert body["hu_id"] == "HU003"


def test_confirmed_upcoming_uses_booking_enrichment(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = [
            _mock_summary(
                booking_id="bk-upcoming",
                property_id=10,
                property_name="Aonang Villa Resort",
                city="Cartagena de Indias",
                image_url="https://example.com/img.jpg",
                guest_count=2,
            ),
        ]
        resp = client.get("/api/v1/bookings/users/u-1/confirmed-upcoming")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["reservations"]) == 1
    res = body["reservations"][0]
    assert res["id"] == "bk-upcoming"
    assert res["accommodationName"] == "Aonang Villa Resort"
    assert res["location"] == "Cartagena de Indias"
    assert res["guestCount"] == 2
    assert res["showCancel"] is True
    assert res["imageUrl"] == "https://example.com/img.jpg"


def test_confirmed_upcoming_fallback_when_no_enrichment(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = [
            _mock_summary(booking_id="bk-up-2", property_id=10),
        ]
        resp = client.get("/api/v1/bookings/users/u-1/confirmed-upcoming")
    assert resp.status_code == 200
    res = resp.json()["reservations"][0]
    assert res["accommodationName"] == "Alojamiento"
    assert res["location"] == "Ciudad"
    assert res["imageUrl"] == "https://picsum.photos/seed/bk-up-2/640/400"
    assert res["guestCount"] == 2


def test_confirmed_upcoming_no_property_id_uses_defaults(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = [
            _mock_summary(booking_id="bk-up-3", property_id=None),
        ]
        resp = client.get("/api/v1/bookings/users/u-1/confirmed-upcoming")
    assert resp.status_code == 200
    res = resp.json()["reservations"][0]
    assert res["accommodationName"] == "Alojamiento"
    assert res["location"] == "Ciudad"
    assert res["guestCount"] == 2


# ── GET /bookings/users/{user_id}/confirmed-past ───────────────────────────────


def test_confirmed_past_empty(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = []
        resp = client.get("/api/v1/bookings/users/u-1/confirmed-past")
    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == "u-1"
    assert body["reservations"] == []
    assert body["hu_id"] == "HU003"


def test_confirmed_past_uses_booking_enrichment(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = [
            _mock_summary(
                booking_id="bk-past",
                property_id=10,
                check_in=date(2025, 3, 1),
                check_out=date(2025, 3, 5),
                property_name="Hotel Bocagrande Plaza",
                city="Cartagena, Colombia",
                guest_count=1,
            ),
        ]
        resp = client.get("/api/v1/bookings/users/u-1/confirmed-past")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["reservations"]) == 1
    res = body["reservations"][0]
    assert res["id"] == "bk-past"
    assert res["accommodationName"] == "Hotel Bocagrande Plaza"
    assert res["location"] == "Cartagena, Colombia"
    assert res["guestCount"] == 1
    assert res["showCancel"] is False
    assert res["arrival"] == "2025-03-01"
    assert res["departure"] == "2025-03-05"


def test_confirmed_past_fallback_when_no_enrichment(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.list_by_user.return_value = [
            _mock_summary(
                booking_id="bk-past-2",
                property_id=10,
                check_in=date(2025, 1, 1),
                check_out=date(2025, 1, 5),
            ),
        ]
        resp = client.get("/api/v1/bookings/users/u-1/confirmed-past")
    assert resp.status_code == 200
    res = resp.json()["reservations"][0]
    assert res["accommodationName"] == "Alojamiento"
    assert res["location"] == "Ciudad"
    assert res["showCancel"] is False
    assert res["imageUrl"] == "https://picsum.photos/seed/bk-past-2/640/400"


# ── GET /bookings/payment-detail ──────────────────────────────────────────────


def test_get_payment_detail_by_room_ok(client: TestClient) -> None:
    hotel_resp = {
        "rooms": [
            {
                "id": 1,
                "price": {
                    "pricePerNight": 100000,
                    "totalAmount": 476000,
                    "currency": "COP",
                },
            }
        ]
    }
    with patch(_SEARCH) as mock_search:
        mock_search.get_hotel_detail.return_value = hotel_resp
        resp = client.get(
            "/api/v1/bookings/payment-detail",
            params={
                "property_id": 10,
                "room_id": 1,
                "check_in": "2025-12-01",
                "check_out": "2025-12-05",
                "units": 1,
            },
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["property_id"] == 10
    assert body["room_id"] == 1
    assert body["payment_summary"]["currency"] == "COP"
    assert body["payment_summary"]["total"] > 0


def test_get_payment_detail_by_room_invalid_dates_returns_422(
    client: TestClient,
) -> None:
    with patch(_SEARCH) as mock_search:
        mock_search.get_hotel_detail.return_value = {"rooms": [{"id": 1, "price": {}}]}
        resp = client.get(
            "/api/v1/bookings/payment-detail",
            params={
                "property_id": 10,
                "room_id": 1,
                "check_in": "2025-12-05",
                "check_out": "2025-12-01",
                "units": 1,
            },
        )
    assert resp.status_code == 422


def test_get_payment_detail_by_room_uses_detail_total_as_base(
    client: TestClient,
) -> None:
    hotel_resp = {
        "rooms": [
            {
                "id": 1,
                "price": {
                    "totalAmount": 997254.51,
                    "currency": "COP",
                },
            }
        ]
    }
    with patch(_SEARCH) as mock_search:
        mock_search.get_hotel_detail.return_value = hotel_resp
        resp = client.get(
            "/api/v1/bookings/payment-detail",
            params={
                "property_id": 10,
                "room_id": 1,
                "check_in": "2025-12-01",
                "check_out": "2025-12-02",
                "units": 1,
            },
        )
    assert resp.status_code == 200
    body = resp.json()["payment_summary"]
    assert body["accommodation"] == 838029
    assert body["fees"] == 83803
    assert body["taxes"] == 159226
    assert body["insurance"] == 20000
    assert body["discount"] == -103803
    assert body["total"] == 997255


# ── GET /bookings/{booking_id}/payment-summary ───────────────────────────────


def test_get_payment_summary_ok(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        booking = _mock_booking()
        booking.room_id = 1
        booking.check_in = date(2025, 12, 1)
        booking.check_out = date(2025, 12, 5)
        booking.units = 1
        booking.payment_summary_json = (
            '{"accommodation":400000,"fees":40000,"taxes":76000,'
            '"insurance":20000,"discount":-20000,"total":516000,"currency":"COP"}'
        )
        mock_svc.get.return_value = booking
        resp = client.get("/api/v1/bookings/bk-001/payment-summary")

    assert resp.status_code == 200
    body = resp.json()
    assert body["booking_id"] == "bk-001"
    assert body["property_id"] == 10
    assert body["payment_summary"]["total"] == 516000


def test_get_payment_summary_includes_user_info_from_identity(
    client: TestClient,
) -> None:
    with patch(_SVC) as mock_svc, patch(_IDENTITY) as mock_identity:
        booking = _mock_booking()
        booking.user_id = "42"
        booking.room_id = 1
        booking.check_in = date(2025, 12, 1)
        booking.check_out = date(2025, 12, 5)
        booking.units = 1
        booking.payment_summary_json = (
            '{"accommodation":400000,"fees":40000,"taxes":76000,'
            '"insurance":20000,"discount":-20000,"total":516000,"currency":"COP"}'
        )
        mock_svc.get.return_value = booking
        mock_identity.get_user_profile.return_value = {
            "status": "ok",
            "user": {"email": "oscar@test.com"},
            "guest": {"full_name": "Oscar Torres"},
        }
        resp = client.get("/api/v1/bookings/bk-001/payment-summary")

    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["first_name"] == "Oscar"
    assert body["user"]["last_name"] == "Torres"
    assert body["user"]["email"] == "oscar@test.com"


def test_get_payment_summary_user_info_is_optional(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        booking = _mock_booking()
        booking.user_id = "user_legacy"
        booking.room_id = 1
        booking.check_in = date(2025, 12, 1)
        booking.check_out = date(2025, 12, 5)
        booking.units = 1
        booking.payment_summary_json = (
            '{"accommodation":400000,"fees":40000,"taxes":76000,'
            '"insurance":20000,"discount":-20000,"total":516000,"currency":"COP"}'
        )
        mock_svc.get.return_value = booking
        resp = client.get("/api/v1/bookings/bk-001/payment-summary")

    assert resp.status_code == 200
    assert resp.json()["user"] is None


def test_get_payment_summary_not_found(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.get.side_effect = BookingNotFoundError("not found")
        resp = client.get("/api/v1/bookings/bk-404/payment-summary")
    assert resp.status_code == 404


def test_get_payment_summary_not_available(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        booking = _mock_booking()
        booking.property_id = None
        booking.payment_summary_json = None
        mock_svc.get.return_value = booking
        resp = client.get("/api/v1/bookings/bk-001/payment-summary")
    assert resp.status_code == 409


# ── POST /bookings/{id}/confirm ───────────────────────────────────────────────


def test_confirm_booking_ok(client: TestClient) -> None:
    with (
        patch(_CLIENT) as mock_client,
        patch(_IDENTITY) as mock_identity,
        patch(_PAYMENT) as mock_payment,
        patch(_SEARCH) as mock_search,
        patch(_MAILER) as mock_mailer,
        patch(_SVC) as mock_svc,
    ):
        mock_svc.get_batch.side_effect = BookingNotFoundError("batch not found")
        mock_svc.get.return_value = _mock_booking()
        mock_identity.get_user_profile.return_value = {
            "status": "ok",
            "user": {"username": "john", "email": "john@example.com"},
        }
        mock_payment.get_payment_by_booking.return_value = {"status": "ok"}
        mock_search.get_booking_property_detail.return_value = {
            "status": "ok",
            "hotel_name": "Aonang Villa Resort",
            "city": "Cartagena de Indias",
            "country": "Colombia",
            "room_name": "Suite Junior",
            "meal_plan": "Desayuno incluido",
            "adults": 2,
        }
        mock_client.confirm_hold.return_value = None
        confirmed = _mock_booking("CONFIRMED")
        confirmed.payment_summary_json = (
            '{"accommodation":400000,"fees":40000,"taxes":76000,'
            '"insurance":20000,"discount":-20000,"total":516000,"currency":"COP"}'
        )
        mock_svc.mark_confirmed.return_value = confirmed
        mock_mailer.send_confirmation_email.return_value = {
            "status": "sent",
            "detail": "Email sent to john@example.com",
        }
        resp = client.post("/api/v1/bookings/bk-001/confirm")
    assert resp.status_code == 200
    assert resp.json()["status"] == "CONFIRMED"
    assert resp.json()["confirmation_preview"]["mode"] == "batch"
    assert (
        resp.json()["confirmation_preview"]["reservations"][0]["property"]["hotel_name"]
        == "Aonang Villa Resort"
    )
    assert resp.json()["email_notification"]["status"] == "sent"
    assert resp.json()["payment_summary"]["total"] == 516000


def test_confirm_booking_batch_ok(client: TestClient) -> None:
    with (
        patch(_CLIENT) as mock_client,
        patch(_IDENTITY) as mock_identity,
        patch(_PAYMENT) as mock_payment,
        patch(_SEARCH) as mock_search,
        patch(_MAILER) as mock_mailer,
        patch(_SVC) as mock_svc,
    ):
        item_a = _mock_booking()
        item_a.booking_id = "bk-001"
        item_b = _mock_booking()
        item_b.booking_id = "bk-002"

        def _mock_get(_db, booking_id: str):
            if booking_id == "batch-001":
                raise BookingNotFoundError("Booking not found.")
            if booking_id == "bk-001":
                return item_a
            if booking_id == "bk-002":
                return item_b
            raise BookingNotFoundError("Booking not found.")

        mock_svc.get.side_effect = _mock_get
        mock_svc.get_batch.return_value = (
            "u-1",
            [
                BookingSummary(
                    booking_id="bk-001",
                    hold_id="hold-001",
                    room_id=1,
                    user_id="u-1",
                    check_in=date(2025, 12, 1),
                    check_out=date(2025, 12, 5),
                    units=1,
                    status=BookingStatus.ON_HOLD,
                ),
                BookingSummary(
                    booking_id="bk-002",
                    hold_id="hold-002",
                    room_id=2,
                    user_id="u-1",
                    check_in=date(2025, 12, 2),
                    check_out=date(2025, 12, 6),
                    units=1,
                    status=BookingStatus.ON_HOLD,
                ),
            ],
        )
        mock_identity.get_user_profile.return_value = {
            "status": "ok",
            "user": {"username": "john", "email": "john@example.com"},
        }
        mock_payment.get_payment_by_booking.return_value = {"status": "ok"}
        mock_search.get_booking_property_detail.return_value = {
            "status": "ok",
            "hotel_name": "Aonang Villa Resort",
            "city": "Cartagena de Indias",
            "country": "Colombia",
            "room_name": "Suite Junior",
            "meal_plan": "Desayuno incluido",
            "adults": 2,
        }
        mock_client.confirm_hold.return_value = None
        confirmed = _mock_booking("CONFIRMED")
        confirmed.payment_summary_json = (
            '{"accommodation":400000,"fees":40000,"taxes":76000,'
            '"insurance":20000,"discount":-20000,"total":516000,"currency":"COP"}'
        )
        mock_svc.mark_confirmed.return_value = confirmed
        mock_mailer.send_confirmation_email.return_value = {
            "status": "sent",
            "detail": "Email sent to john@example.com",
        }

        resp = client.post("/api/v1/bookings/batch-001/confirm")

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "CONFIRMED"
    assert body["booking_id"] == "batch-001"
    assert body["confirmation_preview"]["mode"] == "batch"
    assert len(body["confirmation_preview"]["reservations"]) == 2
    assert body["email_notification"]["status"] == "sent"
    assert mock_mailer.send_confirmation_email.call_count == 1


def test_confirm_booking_not_found(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.get_batch.side_effect = BookingNotFoundError("not found")
        mock_svc.get.side_effect = BookingNotFoundError("not found")
        resp = client.post("/api/v1/bookings/bk-xxx/confirm")
    assert resp.status_code == 404


def test_confirm_booking_user_not_found(client: TestClient) -> None:
    with patch(_IDENTITY) as mock_identity, patch(_SVC) as mock_svc:
        mock_svc.get_batch.side_effect = BookingNotFoundError("batch not found")
        mock_svc.get.return_value = _mock_booking()
        mock_identity.get_user_profile.side_effect = IdentityClientError(
            404, "User not found"
        )
        resp = client.post("/api/v1/bookings/bk-001/confirm")
    assert resp.status_code == 404


def test_confirm_booking_payment_not_found(client: TestClient) -> None:
    with (
        patch(_IDENTITY) as mock_identity,
        patch(_PAYMENT) as mock_payment,
        patch(_SEARCH) as mock_search,
        patch(_SVC) as mock_svc,
    ):
        mock_svc.get_batch.side_effect = BookingNotFoundError("batch not found")
        mock_svc.get.return_value = _mock_booking()
        mock_identity.get_user_profile.return_value = {
            "status": "ok",
            "user": {"username": "john"},
        }
        mock_search.get_booking_property_detail.return_value = {"status": "ok"}
        mock_payment.get_payment_by_booking.side_effect = PaymentClientError(
            404, "Payment not found"
        )
        resp = client.post("/api/v1/bookings/bk-001/confirm")
    assert resp.status_code == 404


def test_confirm_booking_identity_missing_email(client: TestClient) -> None:
    with (
        patch(_CLIENT) as mock_client,
        patch(_IDENTITY) as mock_identity,
        patch(_PAYMENT) as mock_payment,
        patch(_SEARCH) as mock_search,
        patch(_SVC) as mock_svc,
    ):
        mock_svc.get_batch.side_effect = BookingNotFoundError("batch not found")
        mock_svc.get.return_value = _mock_booking()
        mock_identity.get_user_profile.return_value = {
            "status": "ok",
            "user": {"username": "john"},
        }
        mock_payment.get_payment_by_booking.return_value = {"status": "ok"}
        mock_search.get_booking_property_detail.return_value = {"status": "ok"}
        mock_client.confirm_hold.return_value = None
        mock_svc.mark_confirmed.return_value = _mock_booking("CONFIRMED")
        resp = client.post("/api/v1/bookings/bk-001/confirm")
    assert resp.status_code == 502


def test_hotel_confirm_booking_ok(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        confirmed = _mock_booking("CONFIRMED")
        mock_svc.mark_hotel_confirmed.return_value = confirmed
        resp = client.post("/api/v1/bookings/bk-001/hotel-confirm")
    assert resp.status_code == 200
    assert resp.json()["status"] == "CONFIRMED"


def test_hotel_confirm_booking_conflict(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.mark_hotel_confirmed.side_effect = BookingConflictError("invalid")
        resp = client.post("/api/v1/bookings/bk-001/hotel-confirm")
    assert resp.status_code == 409


# ── DELETE /bookings/{id} ─────────────────────────────────────────────────────


def test_cancel_booking_ok(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client, patch(_SVC) as mock_svc:
        mock_svc.get.return_value = _mock_booking()
        mock_client.cancel_hold.return_value = None
        mock_svc.mark_cancelled.return_value = _mock_booking("CANCELLED")
        resp = client.delete("/api/v1/bookings/bk-001")
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_cancel_booking_not_found(client: TestClient) -> None:
    with patch(_SVC) as mock_svc:
        mock_svc.get.side_effect = BookingNotFoundError("not found")
        resp = client.delete("/api/v1/bookings/bk-xxx")
    assert resp.status_code == 404


def test_user_cancel_confirmed_booking_ok(client: TestClient) -> None:
    with (
        patch(_CLIENT) as mock_client,
        patch(_SVC) as mock_svc,
        patch(_IDENTITY) as mock_identity,
        patch(_SEARCH) as mock_search,
        patch(_MAILER) as mock_mailer,
    ):
        confirmed = _mock_booking("CONFIRMED")
        confirmed.user_id = "99"
        mock_svc.get.return_value = confirmed
        mock_client.cancel_hold.return_value = None
        mock_svc.mark_cancelled.return_value = _mock_booking("CANCELLED")
        mock_identity.get_user_profile.return_value = {
            "user": {"email": "john@example.com"},
            "guest": {"full_name": "John Doe"},
        }
        mock_search.get_booking_property_detail.return_value = {"hotel_name": "Hotel"}
        mock_mailer.send_cancellation_email.return_value = {
            "status": "sent",
            "detail": "ok",
        }
        resp = client.delete(
            "/api/v1/bookings/bk-001/user-cancel",
            headers={"X-User-Id": "99"},
        )
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"
    assert resp.json()["email_notification"]["status"] == "sent"


def test_user_cancel_confirmed_booking_requires_auth(client: TestClient) -> None:
    resp = client.delete("/api/v1/bookings/bk-001/user-cancel")
    assert resp.status_code == 401


def test_user_cancel_confirmed_booking_forbidden_when_not_owner(
    client: TestClient,
) -> None:
    with patch(_SVC) as mock_svc:
        confirmed = _mock_booking("CONFIRMED")
        confirmed.user_id = "100"
        mock_svc.get.return_value = confirmed
        resp = client.delete(
            "/api/v1/bookings/bk-001/user-cancel",
            headers={"X-User-Id": "99"},
        )
    assert resp.status_code == 403


def test_user_cancel_confirmed_booking_only_allows_confirmed(
    client: TestClient,
) -> None:
    with patch(_SVC) as mock_svc:
        on_hold = _mock_booking("ON_HOLD")
        on_hold.user_id = "99"
        mock_svc.get.return_value = on_hold
        resp = client.delete(
            "/api/v1/bookings/bk-001/user-cancel",
            headers={"X-User-Id": "99"},
        )
    assert resp.status_code == 409


def test_hotel_cancel_booking_ok(client: TestClient) -> None:
    with patch(_CLIENT) as mock_client, patch(_SVC) as mock_svc:
        mock_svc.get.return_value = _mock_booking("CONFIRMED")
        mock_client.list_staff_property_ids.return_value = [10, 11]
        mock_client.cancel_hold.return_value = None
        mock_svc.mark_cancelled.return_value = _mock_booking("CANCELLED")
        resp = client.delete(
            "/api/v1/bookings/bk-001/hotel-cancel",
            headers={"X-User-Id": "99"},
        )
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_hotel_cancel_booking_requires_auth(client: TestClient) -> None:
    resp = client.delete("/api/v1/bookings/bk-001/hotel-cancel")
    assert resp.status_code == 401


def test_hotel_cancel_booking_forbidden_when_property_not_owned(
    client: TestClient,
) -> None:
    with patch(_CLIENT) as mock_client, patch(_SVC) as mock_svc:
        mock_svc.get.return_value = _mock_booking("CONFIRMED")
        mock_client.list_staff_property_ids.return_value = [11, 12]
        resp = client.delete(
            "/api/v1/bookings/bk-001/hotel-cancel",
            headers={"X-User-Id": "99"},
        )
    assert resp.status_code == 403


# ── Stub endpoints ────────────────────────────────────────────────────────────


def test_mobile_booking_stub(client: TestClient) -> None:
    resp = client.post("/api/v1/bookings/mobile", json=_HOLD_PAYLOAD)
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_implemented"


def test_push_notification_stub(client: TestClient) -> None:
    resp = client.post("/api/v1/bookings/mobile/notifications/push")
    assert resp.status_code == 200
    assert resp.json()["status"] == "not_implemented"
