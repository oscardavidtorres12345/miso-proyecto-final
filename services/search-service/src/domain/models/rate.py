from sqlalchemy import Column, Date, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from src.infrastructure.database.session import Base


class Rate(Base):
    """
    Nightly rate (price) for a room by date.
    Maps the RATE table from the ER diagram.
    """
    __tablename__ = "rate"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(
        Integer, ForeignKey("room.id", ondelete="CASCADE"), nullable=False
    )
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)             # price per night (before tax)
    currency = Column(String(10), nullable=False, default="COP")
    cancellation_policy = Column(Text, nullable=True)

    # Relationships
    room = relationship("Room", back_populates="rates")

    __table_args__ = (
        Index("ix_rate_room_date", "date", "room_id"),
        Index("ix_rate_amount", "amount"),
    )

