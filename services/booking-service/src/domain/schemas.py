from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class BookingStatus(str, Enum):
    ON_HOLD = "ON_HOLD"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class HotelConfirmationStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"


class HoldRequest(BaseModel):
    property_id: int = Field(ge=1)
    room_id: int = Field(ge=1)
    user_id: str = Field(min_length=1, max_length=120)
    check_in: date
    check_out: date
    units: int = Field(default=1, ge=1)
    guest_count: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_dates(self) -> "HoldRequest":
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


class QuoteRequest(BaseModel):
    hold_id: str


class BookingActionResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    booking_id: str | None = None
    hold_id: str | None = None
    expires_at: datetime | None = None
    confirmation_preview: dict | None = None
    email_notification: dict | None = None


class PaymentSummary(BaseModel):
    accommodation: int = Field(ge=0)
    fees: int = Field(ge=0)
    taxes: int = Field(ge=0)
    insurance: int = Field(ge=0)
    discount: int = Field(le=0)
    total: int = Field(ge=0)
    currency: str = Field(default="COP", min_length=3, max_length=3)


class PaymentSummaryUser(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None


class HoldActionResponse(BookingActionResponse):
    property_id: int | None = Field(default=None, ge=1)
    payment_summary: PaymentSummary | None = None


class PaymentSummaryResponse(BaseModel):
    booking_id: str
    property_id: int
    room_id: int
    check_in: date
    check_out: date
    units: int
    payment_summary: PaymentSummary
    user: PaymentSummaryUser | None = None


class PaymentDetailByRoomResponse(BaseModel):
    property_id: int
    room_id: int
    check_in: date
    check_out: date
    units: int
    payment_summary: PaymentSummary


class BookingSummary(BaseModel):
    booking_id: str
    hold_id: str
    property_id: int | None = None
    property_name: str | None = None
    room_id: int
    property_id: int | None = None
    user_id: str
    check_in: date
    check_out: date
    units: int
    guest_count: int = Field(default=1, ge=1)
    room_type: str | None = None
    room_name: str | None = None
    hotel_confirmation_status: HotelConfirmationStatus = HotelConfirmationStatus.PENDING
    hotel_confirmed_at: datetime | None = None
    status: BookingStatus
    expires_at: datetime | None = None
    total_amount: float | None = None
    currency: str | None = None


class UserBookingsResponse(BaseModel):
    user_id: str
    bookings: list[BookingSummary]
    status: str
    sprint: int
    hu_id: str


class PortalPropertySummary(BaseModel):
    property_id: int
    property_name: str | None = None


class PortalReservationsResponse(BaseModel):
    properties: list[PortalPropertySummary]
    staff_user_id: int
    property_ids: list[int]
    bookings: list[BookingSummary]
    status: str
    sprint: int
    hu_id: str


class BookingBatchCreateRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=120)
    booking_ids: list[str] = Field(min_length=1)


class BookingBatchResponse(BaseModel):
    booking_id: str
    user_id: str
    booking_ids: list[str]
    bookings: list[BookingSummary]


class ConfirmedUpcomingReservationItem(BaseModel):
    id: str
    imageUrl: str
    accommodationName: str
    location: str
    arrival: date
    departure: date
    guestCount: int
    showCancel: bool = True


class UserConfirmedUpcomingBookingsResponse(BaseModel):
    user_id: str
    reservations: list[ConfirmedUpcomingReservationItem]
    status: str
    sprint: int
    hu_id: str


class PastReservationItem(BaseModel):
    id: str
    imageUrl: str
    accommodationName: str
    location: str
    arrival: date
    departure: date
    guestCount: int
    showCancel: bool = False


class UserPastBookingsResponse(BaseModel):
    user_id: str
    reservations: list[PastReservationItem]
    status: str
    sprint: int
    hu_id: str
