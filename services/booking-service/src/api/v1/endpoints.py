from json import JSONDecodeError, loads
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.domain.schemas import (
    BookingActionResponse,
    BookingSummary,
    HoldRequest,
    HoldActionResponse,
    PaymentDetailByRoomResponse,
    PaymentSummaryResponse,
    QuoteRequest,
    UserBookingsResponse,
)
from src.domain.services.booking_service import (
    BookingConflictError,
    BookingNotFoundError,
    booking_service,
)
from src.domain.services.payment_summary_service import (
    PaymentSummaryError,
    build_payment_summary,
)
from src.infrastructure.clients import (
    IdentityClientError,
    IdentityTransportError,
    PaymentClientError,
    PaymentTransportError,
    InventoryClientError,
    InventoryTransportError,
    identity_client,
    inventory_client,
    payment_client,
    SearchClientError,
    SearchTransportError,
    search_client,
)
from src.infrastructure.database.connection import get_db
from src.infrastructure.email_notifications import (
    EmailNotificationError,
    booking_email_sender,
)

router = APIRouter(prefix="/bookings")


@router.post(
    "/holds",
    response_model=HoldActionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_hold(
    payload: HoldRequest,
    db: Session = Depends(get_db),
) -> HoldActionResponse:
    try:
        hold = inventory_client.create_hold(
            room_id=payload.room_id,
            user_id=payload.user_id,
            check_in=payload.check_in.isoformat(),
            check_out=payload.check_out.isoformat(),
            units=payload.units,
        )
    except InventoryClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except InventoryTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    _validate_hold_consistency(payload, hold)
    expires_at = _parse_dt(hold.get("expires_at"))

    try:
        hotel_detail = search_client.get_hotel_detail(
            property_id=payload.property_id,
            check_in=payload.check_in.isoformat(),
            check_out=payload.check_out.isoformat(),
        )
        payment_summary = build_payment_summary(
            hotel_detail=hotel_detail,
            room_id=payload.room_id,
            check_in=payload.check_in,
            check_out=payload.check_out,
            units=payload.units,
        )
    except SearchClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except SearchTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except PaymentSummaryError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    try:
        booking = booking_service.create_on_hold(
            db,
            hold_id=hold["hold_id"],
            room_id=payload.room_id,
            property_id=payload.property_id,
            user_id=payload.user_id,
            check_in=payload.check_in,
            check_out=payload.check_out,
            units=payload.units,
            expires_at=expires_at,
            payment_summary_json=payment_summary.model_dump_json(),
        )
    except SQLAlchemyError as exc:
        db.rollback()
        # Best effort compensation to avoid orphan ACTIVE holds in inventory.
        try:
            inventory_client.cancel_hold(
                hold["hold_id"], reason="Booking persistence failed."
            )
        except (InventoryClientError, InventoryTransportError):
            pass
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Booking could not be persisted. Please retry.",
        ) from exc

    return HoldActionResponse(
        status=booking.status,
        sprint=1,
        hu_id="HU005",
        booking_id=booking.booking_id,
        hold_id=booking.hold_id,
        expires_at=booking.expires_at,
        property_id=booking.property_id,
        payment_summary=payment_summary,
    )


@router.post("/quote", response_model=BookingActionResponse)
def quote_total(payload: QuoteRequest) -> BookingActionResponse:
    _ = payload
    return BookingActionResponse(status="not_implemented", sprint=2, hu_id="HU006")


@router.get("/payment-detail", response_model=PaymentDetailByRoomResponse)
def get_payment_detail_by_room(
    property_id: int,
    room_id: int,
    check_in: date,
    check_out: date,
    units: int = 1,
) -> PaymentDetailByRoomResponse:
    try:
        hotel_detail = search_client.get_hotel_detail(
            property_id=property_id,
            check_in=check_in.isoformat(),
            check_out=check_out.isoformat(),
        )
        payment_summary = build_payment_summary(
            hotel_detail=hotel_detail,
            room_id=room_id,
            check_in=check_in,
            check_out=check_out,
            units=units,
        )
    except SearchClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except SearchTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except PaymentSummaryError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return PaymentDetailByRoomResponse(
        property_id=property_id,
        room_id=room_id,
        check_in=check_in,
        check_out=check_out,
        units=units,
        payment_summary=payment_summary,
    )


@router.get("/{booking_id}/payment-summary", response_model=PaymentSummaryResponse)
def get_payment_summary(
    booking_id: str,
    db: Session = Depends(get_db),
) -> PaymentSummaryResponse:
    try:
        booking = booking_service.get(db, booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    if booking.property_id is None or not booking.payment_summary_json:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment summary is not available for this booking.",
        )

    payment_summary = _load_payment_summary_or_500(booking.payment_summary_json)

    return PaymentSummaryResponse(
        booking_id=booking.booking_id,
        property_id=booking.property_id,
        room_id=booking.room_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        units=booking.units,
        payment_summary=payment_summary,
    )


@router.get("/users/{user_id}", response_model=UserBookingsResponse)
def user_bookings(
    user_id: str,
    db: Session = Depends(get_db),
) -> UserBookingsResponse:
    return UserBookingsResponse(
        user_id=user_id,
        bookings=booking_service.list_by_user(db, user_id),
        status="ok",
        sprint=2,
        hu_id="HU003",
    )


@router.get("/{booking_id}", response_model=BookingSummary)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
) -> BookingSummary:
    try:
        booking = booking_service.get(db, booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    return BookingSummary(
        booking_id=booking.booking_id,
        hold_id=booking.hold_id,
        room_id=booking.room_id,
        user_id=booking.user_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        units=booking.units,
        status=booking.status,
        expires_at=booking.expires_at,
    )


@router.get("/{booking_id}", response_model=BookingSummary)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
) -> BookingSummary:
    try:
        booking = booking_service.get(db, booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    return BookingSummary(
        booking_id=booking.booking_id,
        hold_id=booking.hold_id,
        room_id=booking.room_id,
        user_id=booking.user_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        units=booking.units,
        status=booking.status,
        expires_at=booking.expires_at,
    )


@router.post("/{booking_id}/confirm", response_model=HoldActionResponse)
def confirm_booking(
    booking_id: str,
    db: Session = Depends(get_db),
) -> HoldActionResponse:
    try:
        booking = booking_service.get(db, booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    try:
        user_profile = identity_client.get_user_profile(booking.user_id)
    except IdentityClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except IdentityTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        payment_detail = payment_client.get_payment_by_booking(booking_id)
    except PaymentClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except PaymentTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        property_detail = search_client.get_booking_property_detail(
            room_id=booking.room_id,
            check_in=booking.check_in.isoformat(),
            check_out=booking.check_out.isoformat(),
            units=booking.units,
        )
    except SearchClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except SearchTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        inventory_client.confirm_hold(booking.hold_id)
    except InventoryClientError as exc:
        if exc.status_code == status.HTTP_410_GONE:
            booking_service.mark_expired(db, booking_id)
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except InventoryTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        updated = booking_service.mark_confirmed(db, booking_id)
    except BookingConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    confirmation_preview = _build_confirmation_preview(
        booking=booking,
        user_profile=user_profile,
        property_detail=property_detail,
        payment_detail=payment_detail,
    )

    user_email = (user_profile.get("user") or {}).get("email")
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Identity response missing user email.",
        )

    try:
        email_notification = booking_email_sender.send_confirmation_email(
            to_email=user_email,
            booking_id=booking_id,
            preview=confirmation_preview,
        )
    except EmailNotificationError as exc:
        email_notification = {"status": "failed", "detail": str(exc)}

    return HoldActionResponse(
        status=updated.status,
        sprint=2,
        hu_id="HU007",
        booking_id=booking_id,
        hold_id=updated.hold_id,
        property_id=updated.property_id,
        payment_summary=_load_payment_summary(updated.payment_summary_json),
        confirmation_preview=confirmation_preview,
        email_notification=email_notification,
    )


@router.post("/{booking_id}/notifications/email", response_model=BookingActionResponse)
def send_booking_confirmation_email(booking_id: str) -> BookingActionResponse:
    return BookingActionResponse(
        status="not_implemented",
        sprint=2,
        hu_id="HU007",
        booking_id=booking_id,
    )


@router.post("/mobile", response_model=BookingActionResponse)
def mobile_booking(payload: HoldRequest) -> BookingActionResponse:
    _ = payload
    return BookingActionResponse(status="not_implemented", sprint=3, hu_id="HU017")


@router.post("/{booking_id}/checkin/qr", response_model=BookingActionResponse)
def qr_checkin(booking_id: str) -> BookingActionResponse:
    return BookingActionResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU018",
        booking_id=booking_id,
    )


@router.post("/mobile/notifications/push")
def send_push_notification() -> dict:
    return {"status": "not_implemented", "sprint": 3, "hu_id": "HU019"}


@router.delete("/{booking_id}", response_model=BookingActionResponse)
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
) -> BookingActionResponse:
    try:
        booking = booking_service.get(db, booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    try:
        inventory_client.cancel_hold(booking.hold_id, reason="Cancelled by user.")
    except InventoryClientError as exc:
        if exc.status_code == status.HTTP_410_GONE:
            booking_service.mark_expired(db, booking_id)
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except InventoryTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        updated = booking_service.mark_cancelled(db, booking_id)
    except BookingConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    return BookingActionResponse(
        status=updated.status,
        sprint=1,
        hu_id="HU005",
        booking_id=booking_id,
        hold_id=updated.hold_id,
    )


def _parse_dt(value: str | None) -> datetime | None:
    if value is None:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _parse_date(value: str | None) -> date | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _validate_hold_consistency(payload: HoldRequest, hold: dict) -> None:
    checks = [
        ("room_id", payload.room_id, hold.get("room_id")),
        ("user_id", payload.user_id, hold.get("user_id")),
        ("units", payload.units, hold.get("units")),
        ("check_in", payload.check_in, _parse_date(hold.get("check_in"))),
        ("check_out", payload.check_out, _parse_date(hold.get("check_out"))),
    ]

    for field, expected, actual in checks:
        if actual is None:
            continue
        if actual != expected:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Inconsistent hold payload from inventory: {field} mismatch.",
            )


def _load_payment_summary(raw: str | None) -> dict | None:
    if not raw:
        return None
    try:
        return loads(raw)
    except JSONDecodeError:
        return None


def _load_payment_summary_or_500(raw: str) -> dict:
    try:
        return loads(raw)
    except JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored payment summary is invalid.",
        ) from exc


def _build_confirmation_preview(
    *,
    booking,
    user_profile: dict,
    property_detail: dict,
    payment_detail: dict,
) -> dict:
    guest_data = user_profile.get("guest") or {}
    user_data = user_profile.get("user") or {}
    guest_name = guest_data.get("full_name") or user_data.get("username") or "Guest"
    nights = (booking.check_out - booking.check_in).days
    currency = payment_detail.get("currency", "COP")
    lodging = float(payment_detail.get("lodging_amount", 0.0))
    fees = float(payment_detail.get("fees_amount", 0.0))
    taxes = float(payment_detail.get("taxes_amount", 0.0))
    insurance = float(payment_detail.get("insurance_amount", 0.0))
    discount = float(payment_detail.get("discount_amount", 0.0))
    total = float(
        payment_detail.get(
            "total_amount", lodging + fees + taxes + insurance - discount
        )
    )

    return {
        "guest_name": guest_name,
        "property": {
            "hotel_name": property_detail.get("hotel_name"),
            "stars": property_detail.get("stars"),
            "city": property_detail.get("city"),
            "country": property_detail.get("country"),
        },
        "stay": {
            "check_in": booking.check_in.isoformat(),
            "check_out": booking.check_out.isoformat(),
            "nights": nights,
            "rooms": booking.units,
            "adults": property_detail.get("adults"),
            "room_name": property_detail.get("room_name"),
            "meal_plan": property_detail.get("meal_plan"),
        },
        "payment_summary": {
            "currency": currency,
            "lodging": lodging,
            "fees": fees,
            "taxes": taxes,
            "insurance": insurance,
            "discount": discount,
            "total": total,
            "payment_id": payment_detail.get("payment_id"),
            "payment_status": payment_detail.get("payment_status"),
            "method_brand": payment_detail.get("method_brand"),
            "method_last4": payment_detail.get("method_last4"),
        },
    }
