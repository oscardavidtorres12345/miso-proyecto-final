from fastapi import APIRouter

from src.domain.schemas import BookingActionResponse, HoldRequest, QuoteRequest

router = APIRouter(prefix="/bookings")


@router.post("/holds", response_model=BookingActionResponse)
def create_hold(payload: HoldRequest) -> BookingActionResponse:
    _ = payload
    return BookingActionResponse(status="not_implemented", sprint=1, hu_id="HU005")


@router.post("/quote", response_model=BookingActionResponse)
def quote_total(payload: QuoteRequest) -> BookingActionResponse:
    _ = payload
    return BookingActionResponse(status="not_implemented", sprint=2, hu_id="HU006")


@router.get("/users/{user_id}")
def user_bookings(user_id: str) -> dict:
    return {
        "user_id": user_id,
        "bookings": [],
        "status": "not_implemented",
        "sprint": 2,
        "hu_id": "HU003",
    }


@router.post("/{booking_id}/confirm", response_model=BookingActionResponse)
def confirm_booking(booking_id: str) -> BookingActionResponse:
    return BookingActionResponse(
        status="not_implemented",
        sprint=2,
        hu_id="HU007",
        booking_id=booking_id,
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


@router.post("/{booking_id}/cancel", response_model=BookingActionResponse)
def cancel_booking(booking_id: str) -> BookingActionResponse:
    return BookingActionResponse(
        status="not_implemented",
        sprint=3,
        hu_id="HU009",
        booking_id=booking_id,
    )
