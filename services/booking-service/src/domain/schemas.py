from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class BookingStatus(str, Enum):
    ON_HOLD = "ON_HOLD"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class HoldRequest(BaseModel):
    room_id: int = Field(ge=1)
    user_id: str = Field(min_length=1, max_length=120)
    check_in: date
    check_out: date
    units: int = Field(default=1, ge=1)

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


class PaymentSummary(BaseModel):
    accommodation: int = Field(ge=0)
    fees: int = Field(ge=0)
    taxes: int = Field(ge=0)
    insurance: int = Field(ge=0)
    discount: int = Field(le=0)
    total: int = Field(ge=0)
    currency: str = Field(default="COP", min_length=3, max_length=3)


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


class BookingSummary(BaseModel):
    booking_id: str
    hold_id: str
    room_id: int
    user_id: str
    check_in: date
    check_out: date
    units: int
    status: BookingStatus
    expires_at: datetime | None = None


class UserBookingsResponse(BaseModel):
    user_id: str
    bookings: list[BookingSummary]
    status: str
    sprint: int
    hu_id: str
