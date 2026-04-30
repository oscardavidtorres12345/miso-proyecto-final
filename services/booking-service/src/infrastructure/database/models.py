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
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    payment_summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    property_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    hotel_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
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
    guest_avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    review_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
