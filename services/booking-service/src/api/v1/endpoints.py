from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.domain.schemas import (
    BookingActionResponse,
    HoldRequest,
    QuoteRequest,
    UserBookingsResponse,
)
from src.domain.services.booking_service import (
    BookingConflictError,
    BookingNotFoundError,
    booking_service,
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

router = APIRouter(prefix="/bookings")


@router.post(
    "/holds",
    response_model=BookingActionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_hold(
    payload: HoldRequest,
    db: Session = Depends(get_db),
) -> BookingActionResponse:
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
        booking = booking_service.create_on_hold(
            db,
            hold_id=hold["hold_id"],
            room_id=payload.room_id,
            user_id=payload.user_id,
            check_in=payload.check_in,
            check_out=payload.check_out,
            units=payload.units,
            expires_at=expires_at,
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

    return BookingActionResponse(
        status=booking.status,
        sprint=1,
        hu_id="HU005",
        booking_id=booking.booking_id,
        hold_id=booking.hold_id,
        expires_at=booking.expires_at,
    )


@router.post("/quote", response_model=BookingActionResponse)
def quote_total(payload: QuoteRequest) -> BookingActionResponse:
    _ = payload
    return BookingActionResponse(status="not_implemented", sprint=2, hu_id="HU006")


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


@router.post("/{booking_id}/confirm", response_model=BookingActionResponse)
def confirm_booking(
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

    return BookingActionResponse(
        status=updated.status,
        sprint=2,
        hu_id="HU007",
        booking_id=booking_id,
        hold_id=updated.hold_id,
        confirmation_preview=_build_confirmation_preview(
            booking=booking,
            user_profile=user_profile,
            property_detail=property_detail,
            payment_detail=payment_detail,
        ),
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
