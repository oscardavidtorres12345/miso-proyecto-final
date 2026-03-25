from pydantic import BaseModel


class HoldRequest(BaseModel):
    hotel_id: str
    room_id: str
    user_id: str
    check_in: str
    check_out: str


class QuoteRequest(BaseModel):
    hold_id: str


class BookingActionResponse(BaseModel):
    status: str
    sprint: int
    hu_id: str
    booking_id: str | None = None
