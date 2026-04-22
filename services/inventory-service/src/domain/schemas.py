from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class HoldStatus(str, Enum):
    ACTIVE = "ACTIVE"
    CONFIRMED = "CONFIRMED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class StockUpsertRequest(BaseModel):
    room_id: int = Field(ge=1)
    date: date
    total_units: int = Field(ge=0)
    confirmed_units: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_units(self) -> "StockUpsertRequest":
        if self.confirmed_units > self.total_units:
            raise ValueError("confirmed_units cannot be greater than total_units")
        return self


class StockResponse(BaseModel):
    room_id: int
    date: date
    total_units: int
    confirmed_units: int
    held_units: int
    available_units: int


class CreateHoldRequest(BaseModel):
    room_id: int = Field(ge=1)
    user_id: str = Field(min_length=1, max_length=120)
    check_in: date
    check_out: date
    units: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def validate_dates(self) -> "CreateHoldRequest":
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self


class HoldResponse(BaseModel):
    hold_id: str
    room_id: int
    user_id: str
    check_in: date
    check_out: date
    units: int
    status: HoldStatus
    created_at: datetime
    expires_at: datetime
    updated_at: datetime | None = None


class ConfirmHoldResponse(BaseModel):
    hold_id: str
    status: HoldStatus
    confirmed_at: datetime


class CancelHoldRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=300)


class CancelHoldResponse(BaseModel):
    hold_id: str
    status: HoldStatus
    cancelled_at: datetime


class ExpireHoldsResponse(BaseModel):
    expired_count: int


class RoomRateUpsertRequest(BaseModel):
    property_id: int = Field(ge=1)
    room_type: str = Field(min_length=1, max_length=120)
    base_rate: float = Field(gt=0)
    offer_rate: float | None = Field(default=None, ge=0)
    occupied_units: int = Field(ge=0)
    total_units: int = Field(ge=0)
    offer_active: bool = False
    currency: str = Field(default="COP", min_length=1, max_length=10)
    horizon_days: int = Field(default=90, ge=1, le=365)

    @model_validator(mode="after")
    def validate_rate_offer(self) -> "RoomRateUpsertRequest":
        if self.offer_rate is not None and self.offer_rate >= self.base_rate:
            raise ValueError("offer_rate must be lower than base_rate")
        if self.occupied_units > self.total_units:
            raise ValueError("occupied_units cannot be greater than total_units")
        if self.offer_active and self.offer_rate is None:
            raise ValueError("offer_rate is required when offer_active=true")
        return self


class RoomRateResponse(BaseModel):
    room_id: int
    property_id: int
    property_name: str | None = None
    staff_user_id: int
    room_type: str
    base_rate: float
    offer_rate: float | None = None
    offer_active: bool
    effective_rate: float
    currency: str
    available_rooms: int
    occupied_units: int
    total_units: int
    offer_status: str
    updated_at: datetime


class RoomRatesResponse(BaseModel):
    rates: list[RoomRateResponse]


class CatalogSyncResponse(BaseModel):
    status: str = "ok"
    total_rooms: int
    mapped_staff_properties: int
    updated_room_rates: int
