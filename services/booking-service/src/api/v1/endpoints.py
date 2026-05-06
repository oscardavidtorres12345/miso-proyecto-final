from json import JSONDecodeError, loads
from datetime import date, datetime, timezone
from urllib.parse import quote_plus

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.domain.schemas import (
    DashboardMeta,
    BookingBatchCreateRequest,
    BookingBatchResponse,
    BookingActionResponse,
    BookingStatus,
    BookingSummary,
    CheckInManualRequest,
    CheckInScanRequest,
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
    PortalDashboardResponse,
    QuoteRequest,
    UserBookingsResponse,
    UserConfirmedUpcomingBookingsResponse,
    UserPastBookingsResponse,
    CreateReviewRequest,
    CreateReviewResponse,
    ReviewItem,
    AdminFeedbackResponse,
)
from src.api.auth import resolve_request_user_id
from src.domain.services.booking_service import (
    BookingConflictError,
    BookingNotFoundError,
    BookingValidationError,
    booking_service,
)
from src.domain.services.dashboard_service import dashboard_service
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
from src.infrastructure.database.models import (
    Booking,
    BookingBatch,
    BookingBatchItem,
    Review,
)
from src.infrastructure.email_notifications import (
    EmailNotificationError,
    booking_email_sender,
)

router = APIRouter(prefix="/bookings")


@router.post(
    "/reviews", response_model=CreateReviewResponse, status_code=status.HTTP_201_CREATED
)
def create_review(
    payload: CreateReviewRequest,
    db: Session = Depends(get_db),
    request_user_id: int = Depends(resolve_request_user_id),
) -> CreateReviewResponse:
    booking = db.get(Booking, payload.booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found."
        )

    if str(booking.user_id) != str(request_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Booking is not accessible for this user.",
        )

    if (
        booking.status != BookingStatus.CONFIRMED.value
        or booking.check_out >= date.today()
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only completed stays can be reviewed.",
        )

    existing_review = db.execute(
        select(Review).where(Review.booking_id == payload.booking_id)
    ).scalar_one_or_none()
    if existing_review is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A review for this booking already exists.",
        )

    room_name: str | None = None
    try:
        detail = search_client.get_booking_property_detail(
            room_id=booking.room_id,
            check_in=booking.check_in.isoformat(),
            check_out=booking.check_out.isoformat(),
            units=booking.units,
        )
        room_name = detail.get("room_name")
    except (SearchClientError, SearchTransportError):
        room_name = None

    guest_name = f"Guest {request_user_id}"
    guest_username: str | None = None
    guest_avatar_url: str | None = None
    try:
        user_profile = identity_client.get_user_profile(booking.user_id)
        user = user_profile.get("user") if isinstance(user_profile, dict) else None
        guest = user_profile.get("guest") if isinstance(user_profile, dict) else None
        if isinstance(user, dict):
            username = str(user.get("username") or "").strip()
            full_name = (
                str(guest.get("full_name") or "").strip()
                if isinstance(guest, dict)
                else ""
            )
            guest_name = full_name or username or guest_name
            guest_username = username or None
            seed = guest_username or str(booking.user_id)
            guest_avatar_url = (
                f"https://api.dicebear.com/9.x/initials/svg?seed={quote_plus(seed)}"
            )
    except (IdentityClientError, IdentityTransportError):
        pass

    review = Review(
        booking_id=booking.booking_id,
        property_id=int(booking.property_id or 0),
        room_id=booking.room_id,
        hotel_name=booking.property_name or "Alojamiento",
        room_name=room_name,
        guest_name=guest_name,
        guest_username=guest_username,
        guest_avatar_url=guest_avatar_url,
        rating=payload.rating,
        comment=payload.comment.strip(),
        review_date=datetime.now(timezone.utc),
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return CreateReviewResponse(
        status="ok",
        review=ReviewItem(
            id=review.id,
            booking_id=review.booking_id,
            property_id=review.property_id,
            room_id=review.room_id,
            hotel_name=review.hotel_name,
            room_name=review.room_name,
            guest_name=review.guest_name,
            guest_username=review.guest_username,
            guest_avatar_url=review.guest_avatar_url,
            rating=review.rating,
            comment=review.comment,
            review_date=review.review_date,
        ),
    )


@router.get("/admin/feedback", response_model=AdminFeedbackResponse)
def get_admin_feedback(
    db: Session = Depends(get_db),
    staff_user_id: int = Depends(resolve_request_user_id),
) -> AdminFeedbackResponse:
    property_ids = inventory_client.list_staff_property_ids(staff_user_id)
    if not property_ids:
        return AdminFeedbackResponse(reviews=[], status="ok")

    reviews = (
        db.execute(
            select(Review)
            .where(Review.property_id.in_(property_ids))
            .order_by(Review.review_date.desc())
        )
        .scalars()
        .all()
    )

    return AdminFeedbackResponse(
        status="ok",
        reviews=[
            ReviewItem(
                id=r.id,
                booking_id=r.booking_id,
                property_id=r.property_id,
                room_id=r.room_id,
                hotel_name=r.hotel_name,
                room_name=r.room_name,
                guest_name=r.guest_name,
                guest_username=r.guest_username,
                guest_avatar_url=r.guest_avatar_url,
                rating=r.rating,
                comment=r.comment,
                review_date=r.review_date,
            )
            for r in reviews
        ],
    )


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

    # Extract enrichment data from search response for later listing endpoints.
    # HotelDetailResponse uses camelCase aliases: name, city, photos[{url,alt}], etc.
    property_name = None
    city = None
    image_url = None
    if isinstance(hotel_detail, dict):
        property_name = hotel_detail.get("name")
        city = hotel_detail.get("city")
        photos = hotel_detail.get("photos") or []
        if photos and isinstance(photos, list):
            first_photo = photos[0]
            if isinstance(first_photo, dict):
                image_url = first_photo.get("url")

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
            room_type=payload.room_type.strip() if payload.room_type else None,
            expires_at=expires_at,
            payment_summary_json=payment_summary.model_dump_json(),
            property_name=property_name,
            city=city,
            image_url=image_url,
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
    display_currency: str | None = None,
    charge_currency: str | None = None,
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
    currency_detail = None
    resolved_charge_amount = None
    requested_currency = (display_currency or "").strip().upper()
    requested_charge_currency = (charge_currency or "").strip().upper() or None
    original_currency = str(payment_summary.get("currency") or "COP").upper()
    if requested_currency and requested_currency != original_currency:
        payment_summary, currency_detail, resolved_charge_amount = (
            _convert_payment_summary(
                payment_summary=payment_summary,
                from_currency=original_currency,
                to_currency=requested_currency,
                charge_currency=requested_charge_currency,
            )
        )
    user_summary = _resolve_payment_summary_user(booking.user_id)

    return PaymentSummaryResponse(
        booking_id=booking.booking_id,
        property_id=booking.property_id,
        room_id=booking.room_id,
        check_in=booking.check_in,
        check_out=booking.check_out,
        units=booking.units,
        payment_summary=payment_summary,
        currency_detail=currency_detail,
        charge_amount=resolved_charge_amount,
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
        hotel_name = b.property_name or "Alojamiento"
        city = b.city or "Ciudad"
        image_url = b.image_url or f"https://picsum.photos/seed/{b.booking_id}/640/400"
        adults = getattr(b, "guest_count", b.units)

        reservations.append(
            ConfirmedUpcomingReservationItem(
                id=b.booking_id,
                imageUrl=image_url,
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
        hotel_name = b.property_name or "Alojamiento"
        city = b.city or "Ciudad"
        image_url = b.image_url or f"https://picsum.photos/seed/{b.booking_id}/640/400"
        adults = getattr(b, "guest_count", b.units)

        reservations.append(
            PastReservationItem(
                id=b.booking_id,
                imageUrl=image_url,
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
    bookings = booking_service.list_by_properties(db, property_ids=property_ids)
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
            PortalPropertySummary(
                property_id=p["property_id"], property_name=p.get("property_name")
            )
            for p in properties
        ],
        bookings=enriched_bookings,
        status="ok",
        sprint=2,
        hu_id="HU003",
    )


@router.get("/portal/dashboard", response_model=PortalDashboardResponse)
def get_portal_dashboard(
    date_from: date | None = None,
    date_to: date | None = None,
    granularity: str = "month",
    currency: str = "COP",
    top_n: int = 10,
    db: Session = Depends(get_db),
    staff_user_id: int = Depends(resolve_request_user_id),
) -> PortalDashboardResponse:
    current_date = date.today()
    resolved_date_to = date_to or current_date
    resolved_date_from = date_from or resolved_date_to.replace(day=1)
    if resolved_date_from > resolved_date_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="date_from must be less than or equal to date_to.",
        )
    if (resolved_date_to - resolved_date_from).days > 366:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="date range cannot exceed 366 days.",
        )

    normalized_granularity = granularity.strip().lower()
    if normalized_granularity not in {"day", "week", "month"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="granularity must be one of: day, week, month.",
        )

    property_ids = inventory_client.list_staff_property_ids(staff_user_id)
    normalized_currency = currency.strip().upper()
    if len(normalized_currency) != 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="currency must be a 3-letter ISO code.",
        )
    if top_n < 1 or top_n > 50:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="top_n must be between 1 and 50.",
        )

    kpis, warnings = dashboard_service.get_kpis(
        db,
        property_ids=property_ids,
        date_from=resolved_date_from,
        date_to=resolved_date_to,
        today=current_date,
        target_currency=normalized_currency,
    )
    bookings_by_period, income_trend, series_warnings = (
        dashboard_service.get_time_series(
            db,
            property_ids=property_ids,
            date_from=resolved_date_from,
            date_to=resolved_date_to,
            granularity=normalized_granularity,
            target_currency=normalized_currency,
        )
    )
    occupancy_by_category, ranking = dashboard_service.get_occupancy_and_ranking(
        db,
        property_ids=property_ids,
        date_from=resolved_date_from,
        date_to=resolved_date_to,
        top_n=top_n,
    )
    merged_warnings = list(dict.fromkeys([*warnings, *series_warnings]))
    return PortalDashboardResponse(
        staff_user_id=staff_user_id,
        property_ids=property_ids,
        kpis=kpis,
        occupancy_by_category=occupancy_by_category,
        bookings_by_period=bookings_by_period,
        ranking=ranking,
        income_trend=income_trend,
        meta=DashboardMeta(
            date_from=resolved_date_from,
            date_to=resolved_date_to,
            granularity=normalized_granularity,
            currency=normalized_currency,
            top_n=top_n,
            warnings=merged_warnings,
        ),
        status="ok",
        sprint=3,
        hu_id="HU011",
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
        room_type=getattr(booking, "room_type", None),
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
    batch_ref_id, batch_user_id, batch_booking_ids = _resolve_batch_booking_ids(
        db=db,
        booking_id=booking_id,
    )

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
        payment_lookup_id = batch_ref_id or booking_id
        try:
            batch_payment_detail = payment_client.get_payment_by_booking(
                payment_lookup_id
            )
        except PaymentClientError as exc:
            if (
                exc.status_code == status.HTTP_404_NOT_FOUND
                and payment_lookup_id != booking_id
            ):
                batch_payment_detail = payment_client.get_payment_by_booking(booking_id)
            else:
                raise
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
        batch_booking_id=batch_ref_id or booking_id,
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
        booking_id=batch_ref_id or booking_id,
        payment_summary=primary_payment_summary,
        confirmation_preview=confirmation_preview,
        email_notification=email_notification,
    )


def _resolve_batch_booking_ids(
    *,
    db: Session,
    booking_id: str,
) -> tuple[str | None, str, list[str]]:
    try:
        batch_user_id, batch_bookings = booking_service.get_batch(
            db, batch_booking_id=booking_id
        )
        return booking_id, batch_user_id, [item.booking_id for item in batch_bookings]
    except BookingNotFoundError as original_exc:
        batch_ref_id: str | None = None
        row = db.execute(
            select(BookingBatchItem.batch_booking_id)
            .join(
                BookingBatch,
                BookingBatch.booking_id == BookingBatchItem.batch_booking_id,
            )
            .where(BookingBatchItem.booking_id == booking_id)
            .order_by(BookingBatch.created_at.desc())
            .limit(1)
        ).first()
        if row and row[0]:
            batch_ref_id = str(row[0])
            try:
                batch_user_id, batch_bookings = booking_service.get_batch(
                    db, batch_booking_id=batch_ref_id
                )
                return (
                    batch_ref_id,
                    batch_user_id,
                    [item.booking_id for item in batch_bookings],
                )
            except BookingNotFoundError:
                pass

        try:
            single_booking = booking_service.get(db, booking_id)
        except BookingNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(original_exc),
            ) from original_exc

        return None, single_booking.user_id, [single_booking.booking_id]


def _get_property_detail_or_raise(*, booking) -> dict:
    try:
        detail = search_client.get_booking_property_detail(
            room_id=booking.room_id,
            check_in=booking.check_in.isoformat(),
            check_out=booking.check_out.isoformat(),
            units=booking.units,
        )
        hotel_name = detail.get("hotel_name")
        hotel_missing = (
            not isinstance(hotel_name, str)
            or not hotel_name.strip()
            or hotel_name.strip().lower() == "none"
        )
        property_id: int | None
        units: int
        try:
            property_id = int(booking.property_id)
        except (TypeError, ValueError):
            property_id = None
        try:
            units = max(1, int(booking.units))
        except (TypeError, ValueError):
            units = 1

        if hotel_missing and property_id is not None:
            hotel_detail = search_client.get_hotel_detail(
                property_id=property_id,
                check_in=booking.check_in.isoformat(),
                check_out=booking.check_out.isoformat(),
                adults=max(2, units * 2),
            )
            if isinstance(hotel_detail, dict):
                name = hotel_detail.get("name")
                if isinstance(name, str) and name.strip():
                    detail["hotel_name"] = name.strip()
        return detail
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
    def _text_or_default(value: object, default: str) -> str:
        if isinstance(value, str):
            normalized = value.strip()
            if normalized and normalized.lower() != "none":
                return normalized
        return default

    nights = (booking.check_out - booking.check_in).days
    ps = payment_summary or {}
    suggested_room = property_detail.get("suggested_room")
    suggested_room_name = (
        suggested_room.get("name") if isinstance(suggested_room, dict) else None
    )
    suggested_meal_plan = (
        suggested_room.get("meal_plan") if isinstance(suggested_room, dict) else None
    )

    return {
        "booking_id": booking.booking_id,
        "property": {
            "hotel_name": _text_or_default(
                property_detail.get("hotel_name") or property_detail.get("name"),
                "Alojamiento",
            ),
            "stars": property_detail.get("stars"),
            "city": _text_or_default(property_detail.get("city"), "Sin ciudad"),
            "country": _text_or_default(property_detail.get("country"), "Sin país"),
        },
        "stay": {
            "check_in": booking.check_in.isoformat(),
            "check_out": booking.check_out.isoformat(),
            "nights": nights,
            "rooms": booking.units,
            "adults": property_detail.get("adults"),
            "room_name": _text_or_default(
                property_detail.get("room_name") or suggested_room_name,
                "Habitación estándar",
            ),
            "meal_plan": _text_or_default(
                property_detail.get("meal_plan") or suggested_meal_plan,
                "Sin alimentación",
            ),
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

    first_item_payment = items[0].get("payment_summary") or {}
    currency = str(
        payment_detail.get("currency") or first_item_payment.get("currency") or "COP"
    )
    lodging_total = sum(
        float((item.get("payment_summary") or {}).get("lodging") or 0.0)
        for item in items
    )
    fees_total = sum(
        float((item.get("payment_summary") or {}).get("fees") or 0.0) for item in items
    )
    taxes_total = sum(
        float((item.get("payment_summary") or {}).get("taxes") or 0.0) for item in items
    )
    insurance_total = sum(
        float((item.get("payment_summary") or {}).get("insurance") or 0.0)
        for item in items
    )
    discount_total = sum(
        float((item.get("payment_summary") or {}).get("discount") or 0.0)
        for item in items
    )
    item_total = sum(
        float((item.get("payment_summary") or {}).get("total") or 0.0) for item in items
    )
    paid_total = (
        item_total
        if item_total > 0
        else float(payment_detail.get("total_amount") or 0.0)
    )
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
            "lodging": lodging_total,
            "fees": fees_total,
            "taxes": taxes_total,
            "insurance": insurance_total,
            "discount": discount_total,
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


def _send_cancellation_email_best_effort(*, booking, booking_id: str) -> dict:
    try:
        user_profile = identity_client.get_user_profile(booking.user_id)
        user_email = (user_profile.get("user") or {}).get("email")
        if not user_email:
            return {
                "status": "failed",
                "detail": "Identity response missing user email.",
            }

        payment_summary = (
            _load_payment_summary(getattr(booking, "payment_summary_json", None)) or {}
        )
        property_detail = _get_property_detail_or_raise(booking=booking)
        cancellation_item = _build_confirmation_item_preview(
            booking=booking,
            property_detail=property_detail,
            payment_summary=payment_summary,
        )
        cancellation_preview = _build_batch_confirmation_preview(
            batch_booking_id=booking_id,
            user_profile=user_profile,
            payment_detail={},
            items=[cancellation_item],
        )
        return booking_email_sender.send_cancellation_email(
            to_email=user_email,
            booking_id=booking_id,
            preview=cancellation_preview,
        )
    except (
        IdentityClientError,
        IdentityTransportError,
        SearchClientError,
        SearchTransportError,
        EmailNotificationError,
    ) as exc:
        return {"status": "failed", "detail": str(exc)}


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


@router.post("/{booking_id}/checkin/scan", response_model=BookingActionResponse)
def scan_checkin(
    booking_id: str,
    payload: CheckInScanRequest,
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

    # HU018 (fase inicial): acepta cualquier QR no vacío y registra check-in.
    if not payload.qr_value.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="qr_value is required.",
        )

    try:
        updated = booking_service.mark_checked_in(db, booking_id)
    except BookingConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    return BookingActionResponse(
        status=updated.status,
        sprint=3,
        hu_id="HU018",
        booking_id=booking_id,
        hold_id=updated.hold_id,
    )


@router.post("/{booking_id}/checkin/manual", response_model=BookingActionResponse)
def manual_checkin(
    booking_id: str,
    payload: CheckInManualRequest,
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

    if not payload.document_number.strip() or not payload.contact_hint.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="document_number and contact_hint are required.",
        )

    try:
        updated = booking_service.mark_checked_in(db, booking_id)
    except BookingConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail=str(exc)
        ) from exc

    return BookingActionResponse(
        status=updated.status,
        sprint=3,
        hu_id="HU018",
        booking_id=booking_id,
        hold_id=updated.hold_id,
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
    email_notification = _send_cancellation_email_best_effort(
        booking=booking,
        booking_id=booking_id,
    )

    return BookingActionResponse(
        status=updated.status,
        sprint=2,
        hu_id="HU003",
        booking_id=booking_id,
        hold_id=updated.hold_id,
        email_notification=email_notification,
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


def _convert_payment_summary(
    *,
    payment_summary: dict,
    from_currency: str,
    to_currency: str,
    charge_currency: str | None,
) -> tuple[dict, dict, float]:
    component_keys = (
        "accommodation",
        "fees",
        "taxes",
        "insurance",
        "discount",
        "total",
    )
    converted: dict = dict(payment_summary)
    currency_detail: dict | None = None
    charge_amount = 0.0

    for key in component_keys:
        raw_amount = float(converted.get(key) or 0.0)
        amount = abs(raw_amount) if key == "discount" else raw_amount
        quote = payment_client.fx_quote(
            from_currency=from_currency,
            to_currency=to_currency,
            amount=amount,
            charge_currency=charge_currency,
        )
        converted_amount = float(quote.get("converted_amount") or 0.0)
        if key == "discount":
            converted_amount = -abs(converted_amount)
        converted[key] = int(round(converted_amount))
        if key == "total":
            charge_amount = float(quote.get("charge_amount") or 0.0)
            currency_detail = quote.get("currency_detail") or {}

    converted["currency"] = to_currency
    return converted, (currency_detail or {}), charge_amount


def _same_user(booking_user_id: object, request_user_id: int) -> bool:
    if isinstance(booking_user_id, int):
        return booking_user_id == request_user_id
    if isinstance(booking_user_id, str) and booking_user_id.strip().isdigit():
        return int(booking_user_id.strip()) == request_user_id
    return False
