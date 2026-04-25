from json import JSONDecodeError, loads
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.domain.schemas import (
    BookingBatchCreateRequest,
    BookingBatchResponse,
    BookingActionResponse,
    BookingStatus,
    BookingSummary,
    ConfirmedUpcomingReservationItem,
    HoldRequest,
    HoldActionResponse,
    PastReservationItem,
    HotelConfirmationStatus,
    PaymentDetailByRoomResponse,
    PortalPropertySummary,
    PaymentSummaryUser,
    PaymentSummaryResponse,
    PortalReservationsResponse,
    QuoteRequest,
    UserBookingsResponse,
    UserConfirmedUpcomingBookingsResponse,
    UserPastBookingsResponse,
)
from src.api.auth import resolve_request_user_id
from src.domain.services.booking_service import (
    BookingConflictError,
    BookingNotFoundError,
    BookingValidationError,
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
    "/batch", response_model=BookingBatchResponse, status_code=status.HTTP_201_CREATED
)
def create_booking_batch(
    payload: BookingBatchCreateRequest,
    db: Session = Depends(get_db),
) -> BookingBatchResponse:
    try:
        batch_booking_id, bookings = booking_service.create_batch(
            db,
            user_id=payload.user_id,
            booking_ids=payload.booking_ids,
        )
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except BookingValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    return BookingBatchResponse(
        booking_id=batch_booking_id,
        user_id=payload.user_id,
        booking_ids=[b.booking_id for b in bookings],
        bookings=bookings,
    )


@router.get("/batch/{booking_id}", response_model=BookingBatchResponse)
def get_booking_batch(
    booking_id: str,
    db: Session = Depends(get_db),
) -> BookingBatchResponse:
    try:
        user_id, bookings = booking_service.get_batch(db, batch_booking_id=booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    return BookingBatchResponse(
        booking_id=booking_id,
        user_id=user_id,
        booking_ids=[b.booking_id for b in bookings],
        bookings=bookings,
    )


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
            guest_count=payload.guest_count,
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
    user_summary = _resolve_payment_summary_user(booking.user_id)

    return PaymentSummaryResponse(
        booking_id=booking.booking_id,
        property_id=booking.property_id,
        room_id=booking.room_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        units=booking.units,
        payment_summary=payment_summary,
        user=user_summary,
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


@router.get(
    "/users/{user_id}/confirmed-upcoming",
    response_model=UserConfirmedUpcomingBookingsResponse,
)
def user_confirmed_upcoming_bookings(
    user_id: str,
    db: Session = Depends(get_db),
) -> UserConfirmedUpcomingBookingsResponse:
    bookings = booking_service.list_by_user(
        db,
        user_id,
        status=BookingStatus.CONFIRMED.value,
        check_in_from=date.today(),
    )
    reservations: list[ConfirmedUpcomingReservationItem] = []

    for b in bookings:
        hotel_name = "Alojamiento"
        city = "Ciudad"
        adults = b.units

        if b.property_id is not None:
            try:
                detail = search_client.get_hotel_detail(
                    property_id=b.property_id,
                    check_in=b.check_in.isoformat(),
                    check_out=b.check_out.isoformat(),
                    adults=b.units,
                )
                hotel_name = detail.get("hotel_name") or hotel_name
                city = detail.get("city") or city
                adults = detail.get("adults") or adults
            except (SearchClientError, SearchTransportError):
                pass

        reservations.append(
            ConfirmedUpcomingReservationItem(
                id=b.booking_id,
                imageUrl=f"https://picsum.photos/seed/{b.booking_id}/640/400",
                accommodationName=hotel_name,
                location=city,
                arrival=b.check_in,
                departure=b.check_out,
                guestCount=adults,
                showCancel=True,
            )
        )

    return UserConfirmedUpcomingBookingsResponse(
        user_id=user_id,
        reservations=reservations,
        status="ok",
        sprint=2,
        hu_id="HU003",
    )


@router.get(
    "/users/{user_id}/confirmed-past",
    response_model=UserPastBookingsResponse,
)
def user_confirmed_past_bookings(
    user_id: str,
    db: Session = Depends(get_db),
) -> UserPastBookingsResponse:
    bookings = booking_service.list_by_user(
        db,
        user_id,
        status=BookingStatus.CONFIRMED.value,
        check_in_to=date.today(),
    )
    reservations: list[PastReservationItem] = []

    for b in bookings:
        hotel_name = "Alojamiento"
        city = "Ciudad"
        adults = b.units

        if b.property_id is not None:
            try:
                detail = search_client.get_hotel_detail(
                    property_id=b.property_id,
                    check_in=b.check_in.isoformat(),
                    check_out=b.check_out.isoformat(),
                    adults=b.units,
                )
                hotel_name = detail.get("hotel_name") or hotel_name
                city = detail.get("city") or city
                adults = detail.get("adults") or adults
            except (SearchClientError, SearchTransportError):
                pass

        reservations.append(
            PastReservationItem(
                id=b.booking_id,
                imageUrl=f"https://picsum.photos/seed/{b.booking_id}/640/400",
                accommodationName=hotel_name,
                location=city,
                arrival=b.check_in,
                departure=b.check_out,
                guestCount=adults,
                showCancel=False,
            )
        )

    return UserPastBookingsResponse(
        user_id=user_id,
        reservations=reservations,
        status="ok",
        sprint=2,
        hu_id="HU003",
    )


@router.get("/portal/reservations", response_model=PortalReservationsResponse)
def get_portal_reservations(
    db: Session = Depends(get_db),
    user_id: str = Depends(resolve_request_user_id),
) -> PortalReservationsResponse:
    staff_user_id = int(user_id)
    properties = inventory_client.list_staff_properties(staff_user_id)
    property_ids = [p["property_id"] for p in properties]
    bookings = booking_service.list_by_properties(
        db, property_ids=property_ids
    )
    room_types = inventory_client.list_staff_room_type_by_room_id(staff_user_id)

    enriched_bookings: list[BookingSummary] = []
    for booking in bookings:
        property_name = None
        for p in properties:
            if p["property_id"] == booking.property_id:
                property_name = p["property_name"]
                break

        room_type = room_types.get(booking.room_id)
        room_name = room_type

        if room_type is not None:
            try:
                detail = search_client.get_booking_property_detail(
                    room_id=booking.room_id,
                    check_in=booking.check_in.isoformat(),
                    check_out=booking.check_out.isoformat(),
                    units=booking.units,
                )
                room_name = detail.get("room_name") or room_type
            except (SearchClientError, SearchTransportError):
                pass

        enriched = BookingSummary(
            booking_id=booking.booking_id,
            hold_id=booking.hold_id,
            property_id=booking.property_id,
            property_name=property_name,
            room_id=booking.room_id,
            user_id=booking.user_id,
            check_in=booking.check_in,
            check_out=booking.check_out,
            units=booking.units,
            guest_count=booking.guest_count,
            room_type=room_type,
            room_name=room_name,
            hotel_confirmation_status=booking.hotel_confirmation_status,
            hotel_confirmed_at=booking.hotel_confirmed_at,
            status=booking.status,
            expires_at=booking.expires_at,
        )
        enriched_bookings.append(enriched)

    return PortalReservationsResponse(
        staff_user_id=staff_user_id,
        property_ids=property_ids,
        properties=[
            PortalPropertySummary(property_id=p["property_id"], property_name=p.get("property_name"))
            for p in properties
        ],
        bookings=enriched_bookings,
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
        property_id=getattr(booking, "property_id", None),
        room_id=booking.room_id,
        user_id=booking.user_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        units=booking.units,
        guest_count=getattr(booking, "guest_count", 1),
        hotel_confirmation_status=(
            HotelConfirmationStatus.CONFIRMED
            if getattr(booking, "hotel_confirmed_at", None) is not None
            else HotelConfirmationStatus.PENDING
        ),
        hotel_confirmed_at=getattr(booking, "hotel_confirmed_at", None),
        status=booking.status,
        expires_at=booking.expires_at,
    )


@router.post("/{booking_id}/confirm", response_model=HoldActionResponse)
def confirm_booking(
    booking_id: str,
    db: Session = Depends(get_db),
) -> HoldActionResponse:
    try:
        batch_user_id, batch_bookings = booking_service.get_batch(
            db, batch_booking_id=booking_id
        )
        batch_booking_ids = [item.booking_id for item in batch_bookings]
    except BookingNotFoundError as exc:
        # Backward compatibility: if no batch exists, treat as a 1-item batch.
        try:
            single_booking = booking_service.get(db, booking_id)
        except BookingNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
            ) from exc
        batch_user_id = single_booking.user_id
        batch_booking_ids = [single_booking.booking_id]

    if not batch_booking_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking batch not found.",
        )

    try:
        batch_user_profile = identity_client.get_user_profile(batch_user_id)
    except IdentityClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except IdentityTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    try:
        batch_payment_detail = payment_client.get_payment_by_booking(booking_id)
    except PaymentClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except PaymentTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    confirmation_items: list[dict] = []
    primary_payment_summary: dict | None = None

    for nested_booking_id in batch_booking_ids:
        booking = booking_service.get(db, nested_booking_id)
        property_detail = _get_property_detail_or_raise(booking=booking)
        _confirm_hold_or_raise(db=db, booking=booking)
        updated = _mark_booking_confirmed_or_raise(db=db, booking_id=nested_booking_id)
        persisted_summary = _load_payment_summary(updated.payment_summary_json)
        item_preview = _build_confirmation_item_preview(
            booking=booking,
            property_detail=property_detail,
            payment_summary=persisted_summary,
        )
        if primary_payment_summary is None:
            primary_payment_summary = persisted_summary
        confirmation_items.append(item_preview)

    confirmation_preview = _build_batch_confirmation_preview(
        batch_booking_id=booking_id,
        user_profile=batch_user_profile,
        payment_detail=batch_payment_detail,
        items=confirmation_items,
    )

    user_email = (batch_user_profile.get("user") or {}).get("email")
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
        status=BookingStatus.CONFIRMED.value,
        sprint=2,
        hu_id="HU007",
        booking_id=booking_id,
        payment_summary=primary_payment_summary,
        confirmation_preview=confirmation_preview,
        email_notification=email_notification,
    )


def _get_property_detail_or_raise(*, booking) -> dict:
    try:
        return search_client.get_booking_property_detail(
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


def _confirm_hold_or_raise(*, db: Session, booking) -> None:
    try:
        inventory_client.confirm_hold(booking.hold_id)
    except InventoryClientError as exc:
        if exc.status_code == status.HTTP_410_GONE:
            booking_service.mark_expired(db, booking.booking_id)
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except InventoryTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


def _mark_booking_confirmed_or_raise(*, db: Session, booking_id: str):
    try:
        return booking_service.mark_confirmed(db, booking_id)
    except BookingConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc


@router.post("/{booking_id}/hotel-confirm", response_model=BookingActionResponse)
def hotel_confirm_booking(
    booking_id: str,
    db: Session = Depends(get_db),
) -> BookingActionResponse:
    try:
        updated = booking_service.mark_hotel_confirmed(db, booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc
    except BookingConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    return BookingActionResponse(
        status=updated.status,
        sprint=2,
        hu_id="HU013",
        booking_id=updated.booking_id,
        hold_id=updated.hold_id,
    )


def _build_confirmation_item_preview(
    *,
    booking,
    property_detail: dict,
    payment_summary: dict | None,
) -> dict:
    nights = (booking.check_out - booking.check_in).days
    ps = payment_summary or {}
    return {
        "booking_id": booking.booking_id,
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
            "currency": ps.get("currency", "COP"),
            "lodging": float(ps.get("accommodation", 0.0)),
            "fees": float(ps.get("fees", 0.0)),
            "taxes": float(ps.get("taxes", 0.0)),
            "insurance": float(ps.get("insurance", 0.0)),
            "discount": float(ps.get("discount", 0.0)),
            "total": float(ps.get("total", 0.0)),
        },
    }


def _build_batch_confirmation_preview(
    *,
    batch_booking_id: str,
    user_profile: dict,
    payment_detail: dict,
    items: list[dict],
) -> dict:
    guest_data = user_profile.get("guest") or {}
    user_data = user_profile.get("user") or {}
    guest_name = guest_data.get("full_name") or user_data.get("username") or "Guest"

    if not items:
        return {
            "mode": "batch",
            "booking_id": batch_booking_id,
            "guest_name": guest_name,
            "reservations": [],
            "payment_summary": {"currency": "COP", "total": 0.0},
        }

    currency = str(
        payment_detail.get("currency") or items[0]["payment_summary"]["currency"]
    )
    item_total = sum(
        float((item.get("payment_summary") or {}).get("total") or 0.0) for item in items
    )
    paid_total = float(payment_detail.get("total_amount") or item_total)
    check_in_values = [
        (item.get("stay") or {}).get("check_in")
        for item in items
        if (item.get("stay") or {}).get("check_in") is not None
    ]
    check_out_values = [
        (item.get("stay") or {}).get("check_out")
        for item in items
        if (item.get("stay") or {}).get("check_out") is not None
    ]
    # Use string keys to avoid direct object comparisons (e.g. MagicMock in unit tests).
    check_in_values.sort(key=str)
    check_out_values.sort(key=str)

    return {
        "mode": "batch",
        "booking_id": batch_booking_id,
        "guest_name": guest_name,
        "reservations": items,
        "stay": {
            "check_in": check_in_values[0] if check_in_values else None,
            "check_out": check_out_values[-1] if check_out_values else None,
            "nights": sum(
                int((item.get("stay") or {}).get("nights") or 0) for item in items
            ),
        },
        "payment_summary": {
            "currency": currency,
            "lodging": float(payment_detail.get("lodging_amount") or 0.0),
            "fees": float(payment_detail.get("fees_amount") or 0.0),
            "taxes": float(payment_detail.get("taxes_amount") or 0.0),
            "insurance": float(payment_detail.get("insurance_amount") or 0.0),
            "discount": float(payment_detail.get("discount_amount") or 0.0),
            "total": paid_total,
            "items_total": item_total,
            "payment_id": payment_detail.get("payment_id"),
            "payment_status": payment_detail.get("payment_status"),
            "method_brand": payment_detail.get("method_brand"),
            "method_last4": payment_detail.get("method_last4"),
        },
    }


def _build_confirmation_preview(
    *,
    booking,
    user_profile: dict,
    property_detail: dict,
    payment_detail: dict,
) -> dict:
    item = _build_confirmation_item_preview(
        booking=booking,
        property_detail=property_detail,
        payment_summary={
            "currency": payment_detail.get("currency", "COP"),
            "accommodation": payment_detail.get("lodging_amount", 0.0),
            "fees": payment_detail.get("fees_amount", 0.0),
            "taxes": payment_detail.get("taxes_amount", 0.0),
            "insurance": payment_detail.get("insurance_amount", 0.0),
            "discount": payment_detail.get("discount_amount", 0.0),
            "total": payment_detail.get("total_amount", 0.0),
        },
    )
    return _build_batch_confirmation_preview(
        batch_booking_id=booking.booking_id,
        user_profile=user_profile,
        payment_detail=payment_detail,
        items=[item],
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


@router.delete("/{booking_id}/user-cancel", response_model=BookingActionResponse)
def user_cancel_confirmed_booking(
    booking_id: str,
    request_user_id: int = Depends(resolve_request_user_id),
    db: Session = Depends(get_db),
) -> BookingActionResponse:
    try:
        booking = booking_service.get(db, booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    if not _same_user(booking.user_id, request_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Booking does not belong to authenticated user.",
        )

    if booking.status != BookingStatus.CONFIRMED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only confirmed bookings can be cancelled by user.",
        )

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
        sprint=2,
        hu_id="HU003",
        booking_id=booking_id,
        hold_id=updated.hold_id,
    )


@router.delete("/{booking_id}/hotel-cancel", response_model=BookingActionResponse)
def hotel_cancel_booking(
    booking_id: str,
    staff_user_id: int = Depends(resolve_request_user_id),
    db: Session = Depends(get_db),
) -> BookingActionResponse:
    try:
        booking = booking_service.get(db, booking_id)
    except BookingNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)
        ) from exc

    try:
        property_ids = inventory_client.list_staff_property_ids(staff_user_id)
    except InventoryClientError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
    except InventoryTransportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    if booking.property_id is None or booking.property_id not in property_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Booking is not accessible for this staff profile.",
        )

    try:
        inventory_client.cancel_hold(
            booking.hold_id, reason="Cancelled by hotel staff."
        )
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
        sprint=2,
        hu_id="HU013",
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
    if not raw or not isinstance(raw, str):
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


def _resolve_payment_summary_user(user_id: object) -> PaymentSummaryUser | None:
    if isinstance(user_id, int):
        identity_user_id = user_id
    elif isinstance(user_id, str) and user_id.isdigit():
        identity_user_id = int(user_id)
    else:
        return None

    try:
        user_profile = identity_client.get_user_profile(identity_user_id)
    except (IdentityClientError, IdentityTransportError):
        return None

    user_data = user_profile.get("user") or {}
    guest_data = user_profile.get("guest") or {}
    full_name = str(guest_data.get("full_name") or "").strip()

    first_name: str | None = None
    last_name: str | None = None
    if full_name:
        name_parts = full_name.split()
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:]) or None

    return PaymentSummaryUser(
        first_name=first_name,
        last_name=last_name,
        email=user_data.get("email"),
    )


def _same_user(booking_user_id: object, request_user_id: int) -> bool:
    if isinstance(booking_user_id, int):
        return booking_user_id == request_user_id
    if isinstance(booking_user_id, str) and booking_user_id.strip().isdigit():
        return int(booking_user_id.strip()) == request_user_id
    return False
