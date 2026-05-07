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
    room_type: str | None = Field(default=None, min_length=1, max_length=120)

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


class ConfirmBookingRequest(BaseModel):
    payment_id: str | None = Field(default=None, min_length=1, max_length=64)


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


class PaymentCurrencyDetail(BaseModel):
    display_currency: str
    charge_currency: str
    base_currency: str
    rate_used: float
    source: str
    charge_notice: str


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
    currency_detail: PaymentCurrencyDetail | None = None
    charge_amount: float | None = None
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
    city: str | None = None
    image_url: str | None = None
    room_id: int
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


class CreateReviewRequest(BaseModel):
    booking_id: str = Field(min_length=1, max_length=64)
    rating: float = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=5000)


class ReviewItem(BaseModel):
    id: int
    booking_id: str
    property_id: int
    room_id: int
    hotel_name: str
    room_name: str | None = None
    guest_name: str
    guest_username: str | None = None
    guest_avatar_url: str | None = None
    rating: float
    comment: str
    review_date: datetime


class CreateReviewResponse(BaseModel):
    status: str
    review: ReviewItem


class AdminFeedbackResponse(BaseModel):
    reviews: list[ReviewItem]
    status: str


class DashboardKpis(BaseModel):
    total_reservations: int = Field(ge=0)
    active_reservations: int = Field(ge=0)
    current_guests: int = Field(ge=0)
    income_total: float = Field(ge=0)


class DashboardOccupancyCategoryItem(BaseModel):
    category: str
    property_name: str | None = None
    room_type: str | None = None
    value: int = Field(ge=0)


class DashboardPeriodPoint(BaseModel):
    period: str
    value: float = Field(ge=0)


class DashboardRankingItem(BaseModel):
    label: str
    value: int = Field(ge=0)


class DashboardMeta(BaseModel):
    date_from: date
    date_to: date
    granularity: str
    currency: str = Field(default="COP", min_length=3, max_length=3)
    top_n: int = Field(default=10, ge=1)
    warnings: list[str] = Field(default_factory=list)


class PortalDashboardResponse(BaseModel):
    staff_user_id: int
    property_ids: list[int]
    kpis: DashboardKpis
    occupancy_by_category: list[DashboardOccupancyCategoryItem]
    bookings_by_period: list[DashboardPeriodPoint]
    ranking: list[DashboardRankingItem]
    income_trend: list[DashboardPeriodPoint]
    meta: DashboardMeta
    status: str
    sprint: int
    hu_id: str


class MonthlyReportKpis(BaseModel):
    total_reservations: int = Field(ge=0)
    cancelled_reservations: int = Field(ge=0)
    new_guests: int = Field(ge=0)
    returning_guests: int = Field(ge=0)
    occupied_rooms: int = Field(ge=0)
    available_rooms: int = Field(ge=0)
    gross_income: float = Field(ge=0)
    net_income: float = Field(ge=0)


class MonthlyReportDistributionItem(BaseModel):
    category: str
    value: float = Field(ge=0)
    percentage: float = Field(ge=0, le=100)


class MonthlyReportBarPoint(BaseModel):
    period: str
    value: float = Field(ge=0)


class MonthlyReportAdditionalChart(BaseModel):
    key: str
    title: str
    points: list[MonthlyReportBarPoint]


class MonthlyReportMeta(BaseModel):
    month: str
    currency: str = Field(default="COP", min_length=3, max_length=3)
    top_n: int = Field(default=5, ge=1)
    warnings: list[str] = Field(default_factory=list)


class MonthlyReportConsistency(BaseModel):
    period_total_reservations: int = Field(ge=0)
    period_income_total: float = Field(ge=0)
    matches_total_reservations: bool
    matches_income_total: bool


class PortalMonthlyReportResponse(BaseModel):
    staff_user_id: int
    property_ids: list[int]
    month: str
    kpis_month: MonthlyReportKpis
    distribution_by_category: list[MonthlyReportDistributionItem]
    bars_by_period: list[MonthlyReportBarPoint]
    additional_charts: list[MonthlyReportAdditionalChart]
    consistency: MonthlyReportConsistency
    meta: MonthlyReportMeta
    status: str
    sprint: int
    hu_id: str
