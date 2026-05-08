from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.infrastructure.database.connection import Base


class Booking(Base):
    __tablename__ = "booking"

    booking_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    hold_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    room_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    property_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    user_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    check_in: Mapped[date] = mapped_column(Date, nullable=False)
    check_out: Mapped[date] = mapped_column(Date, nullable=False)
    units: Mapped[int] = mapped_column(Integer, nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    room_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    payment_summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    property_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    hotel_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class BookingBatch(Base):
    __tablename__ = "booking_batch"

    booking_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )


class BookingBatchItem(Base):
    __tablename__ = "booking_batch_item"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    batch_booking_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("booking_batch.booking_id"), nullable=False, index=True
    )
    booking_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("booking.booking_id"), nullable=False, index=True
    )


class PushToken(Base):
    __tablename__ = "push_token"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    expo_push_token: Mapped[str] = mapped_column(
        String(512), nullable=False, unique=True, index=True
    )
    platform: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )


class Review(Base):
    __tablename__ = "review"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    booking_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("booking.booking_id"),
        nullable=False,
        unique=True,
        index=True,
    )
    property_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    room_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    hotel_name: Mapped[str] = mapped_column(String(255), nullable=False)
    room_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    guest_name: Mapped[str] = mapped_column(String(255), nullable=False)
    guest_username: Mapped[str | None] = mapped_column(String(120), nullable=True)
    guest_avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    review_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )


class SupportedCurrency(Base):
    __tablename__ = "supported_currency"

    code: Mapped[str] = mapped_column(String(3), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    symbol: Mapped[str] = mapped_column(String(8), nullable=False)
    decimals: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )


class FxRate(Base):
    __tablename__ = "fx_rate"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    base_currency: Mapped[str] = mapped_column(
        String(3), ForeignKey("supported_currency.code"), nullable=False, index=True
    )
    quote_currency: Mapped[str] = mapped_column(
        String(3), ForeignKey("supported_currency.code"), nullable=False, index=True
    )
    rate: Mapped[float] = mapped_column(Float, nullable=False)
    effective_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
